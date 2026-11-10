/** The release-history Git branch is the only production counter. No package-version counter. */
export type ReleaseEvent = {
  type: "baseline" | "started" | "allocated" | "published" | "failed" | "verification_failed" | "rollback";
  attemptId?: string;
  version?: string;
  commit: string;
  releaseId?: string;
  buildId?: string;
  buildTime?: string;
  publishedAt?: string | null;
  recordedAt?: string;
  status: string;
  description: string;
  previousVersion?: string | null;
  rollbackReference?: string | null;
  originalIdentifier?: string;
};
export function versionParts(version: string) {
  const match = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.([0-9]{4})$/.exec(version);
  if (!match || Number(match[3]) < 1) throw new Error("Invalid WideOrder release version.");
  return { major: Number(match[1]), minor: Number(match[2]), release: Number(match[3]) };
}
export function nextVersion(events: ReleaseEvent[], phase: { major: number; minor: number }) {
  if (![phase.major, phase.minor].every(value => Number.isSafeInteger(value) && value >= 0)) throw new Error("Invalid authorized phase.");
  const published = events.filter(event => ["baseline", "published"].includes(event.type));
  const latest = published.at(-1);
  if (!latest?.version) throw new Error("A durable baseline is required.");
  const previous = versionParts(latest.version);
  if (phase.major < previous.major || (phase.major === previous.major && phase.minor < previous.minor)) throw new Error("Phase cannot decrease.");
  const inPhase = published.filter(event => event.version && versionParts(event.version).major === phase.major && versionParts(event.version).minor === phase.minor);
  const release = inPhase.reduce((value, event) => Math.max(value, versionParts(event.version!).release), 0) + 1;
  if (release > 9999) throw new Error("Release range exhausted; explicitly authorize a new phase.");
  return `${phase.major}.${phase.minor}.${String(release).padStart(4, "0")}`;
}
export function artifactRelease(events: ReleaseEvent[], releaseId: string) {
  const allocation = events.findLast(event => event.type === "allocated" && event.releaseId === releaseId);
  const publication = events.find(event => ["published", "baseline"].includes(event.type) && event.releaseId === releaseId);
  return publication ?? (allocation && !events.some(event => event.type === "failed" && event.attemptId === allocation.attemptId) ? allocation : null);
}
export function allocate(events: ReleaseEvent[], candidate: ReleaseEvent, phase: { major: number; minor: number }): ReleaseEvent {
  const previous = artifactRelease(events, candidate.releaseId!);
  if (previous) return previous;
  const pending = events.find(event => event.type === "allocated" && !events.some(end => end.attemptId === event.attemptId && ["published", "failed"].includes(end.type)));
  if (pending) throw new Error("An unresolved production reservation must be reconciled before allocation.");
  return { ...candidate, type: "allocated", status: "verifying", version: nextVersion(events, phase),
    previousVersion: events.filter(event => ["baseline", "published", "rollback"].includes(event.type)).at(-1)?.version ?? null };
}
export function parseHistory(text: string): ReleaseEvent[] {
  const events = text.trim().split("\n").filter(Boolean).map(line => JSON.parse(line) as ReleaseEvent);
  if (!events.length || events[0].type !== "baseline") throw new Error("Invalid release ledger baseline.");
  const versions = new Map<string, string>();
  for (const event of events) {
    if (event.version) versionParts(event.version);
    if (!/^[a-f\d]{40,64}$/.test(event.commit) || typeof event.description !== "string") throw new Error("Invalid release ledger event.");
    if (["baseline", "published"].includes(event.type)) {
      if (!event.version || !event.releaseId || !event.buildId || !event.publishedAt || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(event.publishedAt) || !Number.isFinite(Date.parse(event.publishedAt))) throw new Error("Invalid durable publication.");
      if (versions.has(event.version) && versions.get(event.version) !== event.releaseId) throw new Error("A published version cannot identify two artifacts.");
      versions.set(event.version, event.releaseId);
    }
  }
  return events;
}
const publications = new Map<string, ReleaseEvent>();
let inFlight: Promise<ReleaseEvent[]> | undefined;
export async function durableArtifactRelease(releaseId: string): Promise<ReleaseEvent | null> {
  const known = publications.get(releaseId);
  if (known) return known; // Original publication is immutable, including restored artifacts.
  const request = inFlight ??= fetch(`https://raw.githubusercontent.com/WeatherManUS/wideorder-net-website/release-history/history.jsonl?read=${Date.now()}`, {
    cache: "no-store", redirect: "error", signal: AbortSignal.timeout(5000),
  }).then(async response => {
    if (response.status === 404) return [];
    if (!response.ok) throw new Error("Durable release history unavailable.");
    const text = await response.text();
    if (text.length > 8_000_000) throw new Error("Release history requires archival maintenance.");
    return parseHistory(text);
  });
  try {
    const event = artifactRelease(await request, releaseId);
    if (event?.type === "published" || event?.type === "baseline") publications.set(releaseId, event);
    return event;
  } finally { if (inFlight === request) inFlight = undefined; }
}
