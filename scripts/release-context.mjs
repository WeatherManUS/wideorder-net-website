import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const excludedDirectories = new Set([".git", "node_modules", ".next", ".release", ".data", ".cache", ".vscode", ".idea", "dist", "out", "coverage"]);
const excludedFile = (name) => /^(?:\.env(?:\..*)?|cookies-.*\.txt|\.DS_Store|Thumbs\.db)$/.test(name) && name !== ".env.example" || /\.(?:log|tsbuildinfo)$/.test(name);

export function sourceFingerprint(root = process.cwd()) {
  const files = [];
  function walk(directory, prefix = "") {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (excludedDirectories.has(entry.name) || excludedFile(entry.name)) continue;
      if (entry.isSymbolicLink()) throw new Error("Release sources must not contain symbolic links.");
      if (entry.isDirectory() && !excludedDirectories.has(entry.name)) walk(path.join(directory, entry.name), `${prefix}${entry.name}/`);
      else if (entry.isFile() && !excludedFile(entry.name)) files.push(`${prefix}${entry.name}`);
    }
  }
  walk(root);
  const hash = createHash("sha256");
  for (const name of files.sort()) {
    const bytes = readFileSync(path.join(root, name));
    let content = bytes;
    // Git can normalize legacy non-UTF-8 text too. Preserve every byte except text CRLF.
    const knownText = /\.(?:[cm]?jsx?|tsx?|json|md|txt|html?|css|ya?ml|xml|svg|toml|ini|sql|sh|ps1)$/i.test(name) || /\/(?:\.gitignore|\.editorconfig|\.gitattributes)$/.test(`/${name}`);
    const binary = /\.(?:png|webp|jpe?g|gif|ico|ttf|otf|woff2?|pdf|zip)$/i.test(name);
    if (!binary && !bytes.includes(0)) {
      let text = knownText;
      if (!text) { try { new TextDecoder("utf-8", { fatal: true }).decode(bytes); text = true; } catch { /* Unknown binary. */ } }
      if (text) content = Buffer.from(bytes.toString("latin1").replace(/\r\n/g, "\n"), "latin1");
    }
    hash.update(name).update("\0").update(String(content.length)).update("\0").update(content);
  }
  return hash.digest("hex");
}

export function createBuildContext(root = process.cwd()) {
  const { version } = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(version)) throw new Error("package.json must contain a release version.");
  let commit = "";
  try { commit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(); } catch { /* Source archives remain identifiable by digest. */ }
  const sourceHash = sourceFingerprint(root);
  let policy;
  try { policy = JSON.parse(readFileSync(path.join(root, "release-policy.json"), "utf8")); } catch { /* Legacy source fixtures. */ }
  return { application: "WideOrder", version: policy?.baseline ?? version, ...(policy ? { versionPolicy: 1, phase: { major: policy.major, minor: policy.minor } } : {}), commit, buildId: `${/^[a-f\d]{40,64}$/.test(commit) ? commit.slice(0, 12) : "source"}-${sourceHash.slice(0, 16)}`,
    releaseId: randomUUID(), sourceHash, buildStartedAt: new Date().toISOString() };
}

export function configIdentity() {
  try {
    const location = process.env.WIDEORDER_BUILD_CONTEXT || path.join(process.cwd(), ".next", "release.json");
    return JSON.parse(readFileSync(location, "utf8"));
  } catch {
    return { version: JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).version, buildId: "development", releaseId: "development" };
  }
}
