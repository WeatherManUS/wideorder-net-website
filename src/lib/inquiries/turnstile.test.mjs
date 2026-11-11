import { test } from "node:test";
import assert from "node:assert/strict";
import { verifyContactTurnstile } from "./turnstile.ts";

test("Turnstile requires success, contact action and an approved production hostname", async () => {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  try {
    const valid = { success: true, action: "contact", hostname: "wideorder.net" };
    const verify = value => verifyContactTurnstile("token", "secret", async () => Response.json(value));
    assert.equal(await verify(valid), true);
    for (const value of [null, {}, { ...valid, success: false }, { ...valid, success: "true" },
      { ...valid, action: "login" }, { ...valid, hostname: "localhost" },
      { ...valid, hostname: "example.com" }, { ...valid, hostname: "wideorder.net.attacker.test" }]) {
      assert.equal(await verify(value), false);
    }
    assert.equal(await verifyContactTurnstile("token", "secret", async () => { throw new Error("timeout"); }), false);
    assert.equal(await verifyContactTurnstile("token", "secret", async () => new Response("oops", { status: 500 })), false);
    assert.equal(await verifyContactTurnstile("token", "secret", async () => new Response("invalid json")), false);
    assert.equal(await verifyContactTurnstile("", "secret"), false);
    assert.equal(await verifyContactTurnstile("x".repeat(2049), "secret"), false);
  } finally {
    if (previous === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previous;
  }
});
