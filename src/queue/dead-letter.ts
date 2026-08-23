import type { QueueStore } from "./store";
import type { QueueItem } from "./types";

export const DEFAULT_MAX_RETRIES = 5;

export function shouldDeadLetter(
  retryCount: number,
  maxRetries: number = DEFAULT_MAX_RETRIES,
): boolean {
  return retryCount >= maxRetries;
}

export async function retryDeadLetter(
  store: QueueStore,
  item: QueueItem,
): Promise<void> {
  await store.update(item.id, { status: "pending", retryCount: 0 });
}
