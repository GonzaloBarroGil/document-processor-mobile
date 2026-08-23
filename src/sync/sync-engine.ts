import { backoffDelayMs, sleep } from "../queue/backoff";
import { DEFAULT_MAX_RETRIES, shouldDeadLetter } from "../queue/dead-letter";
import type { QueueStore } from "../queue/store";
import type { QueueItem } from "../queue/types";
import type { Uploader } from "./uploader";

export interface SyncEngineOptions {
  maxRetries?: number;
  sleep?: (ms: number) => Promise<void>;
}

export class SyncEngine {
  constructor(
    private readonly store: QueueStore,
    private readonly uploader: Uploader,
    private readonly options: SyncEngineOptions = {},
  ) {}

  async syncOnce(): Promise<void> {
    const pending = await this.store.listPending();
    for (const item of pending) {
      await this.processItem(item);
    }
  }

  async processItem(item: QueueItem): Promise<void> {
    try {
      await this.uploader.upload(item);
      await this.store.remove(item.id);
    } catch {
      const nextRetryCount = item.retryCount + 1;
      const maxRetries = this.options.maxRetries ?? DEFAULT_MAX_RETRIES;

      if (shouldDeadLetter(nextRetryCount, maxRetries)) {
        await this.store.update(item.id, {
          status: "dead_letter",
          retryCount: nextRetryCount,
        });
        return;
      }

      await this.store.update(item.id, { retryCount: nextRetryCount });
      const sleeper = this.options.sleep ?? sleep;
      await sleeper(backoffDelayMs(item.retryCount));
    }
  }
}
