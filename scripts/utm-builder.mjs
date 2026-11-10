import { writeFile } from "node:fs/promises";
import { buildCampaignUrl } from "../src/lib/marketing/utm.ts";

const flags = new Map();
const args = process.argv.slice(2);
for (let index = 0; index < args.length; index += 2) {
  if (!/^--(destination|source|medium|campaign|content|term|export)$/.test(args[index]) || !args[index + 1] || flags.has(args[index])) throw new Error("Use unique --destination --source --medium --campaign [--content --term --export] flags with values.");
  flags.set(args[index], args[index + 1]);
}
const input = Object.fromEntries(["destination", "source", "medium", "campaign", "content", "term"].map((key) => [key, flags.get(`--${key}`)]));
if (!["destination", "source", "medium", "campaign"].every((key) => input[key])) throw new Error("Destination, source, medium and campaign are required.");
const url = buildCampaignUrl(input);
if (flags.has("--export")) await writeFile(flags.get("--export"), JSON.stringify({ ...input, url }, null, 2) + "\n", { flag: "wx" });
console.log(url);
