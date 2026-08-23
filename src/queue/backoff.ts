export const DEFAULT_BASE_DELAY_MS = 1000;
export const DEFAULT_MAX_DELAY_MS = 60_000;

export interface BackoffConfig {
  baseDelayMs: number;
  maxDelayMs: number;
}

export const DEFAULT_BACKOFF: BackoffConfig = {
  baseDelayMs: DEFAULT_BASE_DELAY_MS,
  maxDelayMs: DEFAULT_MAX_DELAY_MS,
};

export function backoffDelayMs(
  attempt: number,
  config: BackoffConfig = DEFAULT_BACKOFF,
): number {
  return Math.min(config.baseDelayMs * 2 ** attempt, config.maxDelayMs);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
