import { describe, expect, it, vi } from "vitest";

import type { QueueStore } from "../queue/store";
import type { QueueItem } from "../queue/types";
import { SyncEngine } from "./sync-engine";
import type { Uploader } from "./uploader";

function makeItem(overrides: Partial<QueueItem> = {}): QueueItem {
  return {
    id: "1",
    dataUrl: "data:image/jpeg;base64,AAAA",
    type: "invoice",
    region: "AR",
    status: "pending",
    retryCount: 0,
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}

function makeStore(items: QueueItem[]): QueueStore {
  return {
    listPending: vi.fn().mockResolvedValue(items),
    remove: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
  } as unknown as QueueStore;
}

describe("SyncEngine", () => {
  it("uploads and removes items in FIFO order", async () => {
    const items = [makeItem({ id: "a" }), makeItem({ id: "b" })];
    const store = makeStore(items);
    const uploader: Uploader = {
      upload: vi.fn().mockResolvedValue({ documentId: "d1" }),
    };
    const engine = new SyncEngine(store, uploader);

    await engine.syncOnce();

    expect(uploader.upload).toHaveBeenCalledTimes(2);
    expect(store.remove).toHaveBeenCalledWith("a");
    expect(store.remove).toHaveBeenCalledWith("b");
  });

  it("dead-letters an item once retries are exhausted", async () => {
    const item = makeItem({ id: "a", retryCount: 4 });
    const store = makeStore([item]);
    const uploader: Uploader = {
      upload: vi.fn().mockRejectedValue(new Error("boom")),
    };
    const engine = new SyncEngine(store, uploader, {
      maxRetries: 5,
      sleep: vi.fn().mockResolvedValue(undefined),
    });

    await engine.processItem(item);

    expect(store.update).toHaveBeenCalledWith("a", {
      status: "dead_letter",
      retryCount: 5,
    });
  });

  it("increments the retry count and backs off on a transient failure", async () => {
    const item = makeItem({ id: "a", retryCount: 0 });
    const store = makeStore([item]);
    const sleeper = vi.fn().mockResolvedValue(undefined);
    const uploader: Uploader = {
      upload: vi.fn().mockRejectedValue(new Error("boom")),
    };
    const engine = new SyncEngine(store, uploader, {
      maxRetries: 5,
      sleep: sleeper,
    });

    await engine.processItem(item);

    expect(store.update).toHaveBeenCalledWith("a", { retryCount: 1 });
    expect(sleeper).toHaveBeenCalledWith(1000);
  });
});
