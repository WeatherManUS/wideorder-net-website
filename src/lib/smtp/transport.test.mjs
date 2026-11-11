import { test } from "node:test";
import assert from "node:assert/strict";
import net from "node:net";
import tls from "node:tls";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import nodemailer from "nodemailer";
import { smtpTransportOptions } from "./transport.ts";

// Exercise real TLS/SMTP on loopback without relaxing the production host/DNS guards.
test("implicit TLS and mandatory STARTTLS verify connections and await DATA acceptance", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "wideorder-smtp-"));
  try {
    const openssl = process.env.OPENSSL_PATH || (process.platform === "win32" ? "C:/Program Files/Git/usr/bin/openssl.exe" : "openssl");
    execFileSync(openssl, ["req", "-x509", "-newkey", "rsa:2048", "-nodes", "-keyout", path.join(dir, "key.pem"), "-out", path.join(dir, "cert.pem"), "-days", "1", "-subj", "/CN=smtp.fixture.test", "-addext", "subjectAltName=DNS:smtp.fixture.test"], { stdio: "ignore", env: { ...process.env, MSYS_NO_PATHCONV: "1" } });
    const key = readFileSync(path.join(dir, "key.pem")), cert = readFileSync(path.join(dir, "cert.pem"));
    const secureContext = tls.createSecureContext({ key, cert });
    for (const secure of [true, false]) {
      let messages = 0, reject = false;
      const sockets = new Set();
      const connect = (socket, encrypted = secure, greet = true) => {
        sockets.add(socket); socket.on("close", () => sockets.delete(socket)); socket.on("error", () => {});
        if (greet) socket.write("220 fixture ESMTP\r\n");
        let buffer = "", data = false;
        const receive = chunk => {
          buffer += chunk.toString();
          while (buffer.includes("\r\n")) {
            const index = buffer.indexOf("\r\n"), line = buffer.slice(0, index); buffer = buffer.slice(index + 2);
            if (data) { if (line === ".") { data = false; if (reject) socket.write("451 temporary fixture failure\r\n"); else { messages++; socket.write("250 queued fixture\r\n"); } } continue; }
            if (/^EHLO|^HELO/.test(line)) socket.write(`250-fixture\r\n${encrypted ? "" : "250-STARTTLS\r\n"}250 AUTH PLAIN\r\n`);
            else if (line === "STARTTLS") { socket.write("220 ready for TLS\r\n"); socket.removeListener("data", receive); connect(new tls.TLSSocket(socket, { isServer: true, secureContext }), true, false); return; }
            else if (/^AUTH/.test(line)) socket.write("235 authenticated\r\n");
            else if (/^MAIL|^RCPT|^RSET|^NOOP/.test(line)) socket.write("250 ok\r\n");
            else if (line === "DATA") { data = true; socket.write("354 continue\r\n"); }
            else if (line === "QUIT") socket.end("221 bye\r\n");
            else socket.write("500 unknown\r\n");
          }
        };
        socket.on("data", receive);
      };
      const server = secure ? tls.createServer({ key, cert }, socket => connect(socket)) : net.createServer(socket => connect(socket));
      await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
      const options = smtpTransportOptions({ host: "smtp.fixture.test", port: server.address().port, secure, auth: true, username: "fixture", password: "fixture" }, "127.0.0.1");
      const transport = nodemailer.createTransport({ ...options, tls: { ...options.tls, ca: cert } });
      try {
        assert.equal(await transport.verify(), true); assert.equal(messages, 0, "Connection test does not send mail");
        const sent = await transport.sendMail({ from: "site@example.test", to: "inbox@example.test", subject: "Fixture", text: "Only a local test" });
        assert.deepEqual(sent.accepted, ["inbox@example.test"]); assert.equal(messages, 1);
        reject = true;
        await assert.rejects(transport.sendMail({ from: "site@example.test", to: "inbox@example.test", text: "Rejected fixture" }), error => error.responseCode === 451);
        assert.equal(messages, 1);
      } finally { transport.close(); for (const socket of sockets) socket.destroy(); await new Promise(resolve => server.close(resolve)); }
    }
  } finally { assert.ok(path.resolve(dir).startsWith(path.resolve(tmpdir()) + path.sep)); rmSync(dir, { recursive: true, force: true }); }
});
