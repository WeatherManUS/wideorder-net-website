// Node's TS stripping plus repository aliases for server-unit tests (never loaded by the app).
import { registerHooks } from "node:module";
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
const root = fileURLToPath(new URL("../src/", import.meta.url));
registerHooks({ resolve(specifier, context, next) {
  if (specifier.startsWith("@/")) return { url: pathToFileURL(path.join(root, specifier.slice(2) + ".ts")).href, shortCircuit: true };
  if (specifier.startsWith(".") && context.parentURL) {
    const candidate = new URL(specifier + ".ts", context.parentURL);
    if (existsSync(candidate)) return { url: candidate.href, shortCircuit: true };
  }
  if (specifier === "next/headers") return next("next/headers.js", context);
  return next(specifier, context);
} });
