const WINDOW_MS = 1000 * 60 * 10;
const MAX_ATTEMPTS = 5;
const BLOCK_MS = 1000 * 60 * 15;

type AttemptWindow = {
  timestamps: number[];
  blockedUntil: number;
};

const attempts = new Map<string, AttemptWindow>();

function prune(key: string, now: number) {
  const current = attempts.get(key);

  if (!current) {
    return null;
  }

  const nextTimestamps = current.timestamps.filter((timestamp) => now - timestamp <= WINDOW_MS);
  const nextBlockedUntil = current.blockedUntil > now ? current.blockedUntil : 0;

  if (nextTimestamps.length === 0 && nextBlockedUntil === 0) {
    attempts.delete(key);
    return null;
  }

  const next = {
    timestamps: nextTimestamps,
    blockedUntil: nextBlockedUntil,
  } satisfies AttemptWindow;

  attempts.set(key, next);
  return next;
}

export function checkAndRecordContactAttempt(scope: string) {
  const now = Date.now();
  const key = scope || "unknown";
  const current = prune(key, now) ?? { timestamps: [], blockedUntil: 0 };

  if (current.blockedUntil > now) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.blockedUntil - now) / 1000)),
    } as const;
  }

  const nextTimestamps = [...current.timestamps, now];

  if (nextTimestamps.length > MAX_ATTEMPTS) {
    const blockedUntil = now + BLOCK_MS;
    attempts.set(key, { timestamps: nextTimestamps, blockedUntil });
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil(BLOCK_MS / 1000)),
    } as const;
  }

  attempts.set(key, { timestamps: nextTimestamps, blockedUntil: 0 });
  return {
    allowed: true,
    retryAfterSeconds: 0,
  } as const;
}

export function resetContactRateLimit(scope: string) {
  attempts.delete(scope || "unknown");
}
