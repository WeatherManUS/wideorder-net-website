import { mkdir, writeFile, readFile, unlink, access } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { createBuildContext } from "./release-context.mjs";

const root = process.cwd();
await mkdir(path.join(root, ".release"), { recursive: true });
const context = createBuildContext(root);
const contextPath = path.join(root, ".release", "build-context.json");
await writeFile(contextPath, JSON.stringify(context));
// Must exist during file tracing; a null completion time is never served as a completed build.
await writeFile(path.join(root, ".release", "release.json"), JSON.stringify({ ...context, buildTime: null }));
console.log(`[release] build started: ${context.buildId} at ${context.buildStartedAt}`);
const result = await new Promise((resolve, reject) => {
  const child = spawn(process.execPath, [path.join(root, "node_modules", "next", "dist", "bin", "next"), "build", "--webpack"], {
    cwd: root, stdio: "inherit", env: { ...process.env, WIDEORDER_BUILD_CONTEXT: contextPath },
  });
  child.on("error", reject);
  child.on("exit", (code, signal) => resolve(code ?? (signal ? 1 : 0)));
});
if (result !== 0) {
  console.error("[release] build failed; no completed release metadata was created.");
  process.exitCode = result;
} else {
  const nextId = (await readFile(path.join(root, ".next", "BUILD_ID"), "utf8")).trim();
  if (nextId !== context.releaseId) throw new Error("Next.js build identity differs from the release context.");
  const completed = { ...context, buildTime: new Date().toISOString() };
  const locations = [path.join(root, ".next"), path.join(root, ".release")];
  const standalone = path.join(root, ".next", "standalone", ".release");
  if (await access(standalone).then(() => true, () => false)) locations.push(standalone);
  for (const directory of locations) {
    await unlink(path.join(directory, "release-publication.json")).catch((error) => { if (error.code !== "ENOENT") throw error; });
    await writeFile(path.join(directory, "release.json"), JSON.stringify(completed, null, 2) + "\n");
  }
  console.log(`[release] build completed: ${context.buildId} at ${completed.buildTime}; publication is not yet confirmed.`);
}
