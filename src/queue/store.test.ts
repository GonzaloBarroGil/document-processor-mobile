import { beforeEach, describe, expect, it } from "vitest";

import { MAX_PENDING, QUEUE_DB_NAME, QueueFullError, QueueStore } from "./store";

function deleteDatabase(name: string): Promise<void> {
  return new Promise((resolve) => {
    const request = indexedDB.deleteDatabase(name);
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
  });
}

describe("QueueStore", () => {
  let store: QueueStore;

  beforeEach(async () => {
    await deleteDatabase(QUEUE_DB_NAME);
    store = new QueueStore();
  });

  it("adds an item as pending", async () => {
    const item = await store.add({
      dataUrl: "data:image/jpeg;base64,AAAA",
      type: "invoice",
      region: "AR",
    });

    expect(item.status).toBe("pending");
    expect(item.retryCount).toBe(0);
    expect(item.type).toBe("invoice");
  });

  it("lists pending items in FIFO order", async () => {
    await store.add({ dataUrl: "a", type: "invoice", region: "AR" });
    await store.add({ dataUrl: "b", type: "ticket", region: "AR" });

    const pending = await store.listPending();

    expect(pending).toHaveLength(2);
    expect(pending[0]?.dataUrl).toBe("a");
    expect(pending[1]?.dataUrl).toBe("b");
  });

  it("moves an item to the dead-letter state", async () => {
    const item = await store.add({ dataUrl: "a", type: "invoice", region: "AR" });

    await store.update(item.id, { status: "dead_letter" });

    expect(await store.listPending()).toHaveLength(0);
    expect(await store.listDeadLetter()).toHaveLength(1);
  });

  it("removes an item", async () => {
    const item = await store.add({ dataUrl: "a", type: "invoice", region: "AR" });

    await store.remove(item.id);

    expect(await store.countPending()).toBe(0);
  });

  it("rejects a new item when the queue is full", async () => {
    for (let i = 0; i < MAX_PENDING; i += 1) {
      await store.add({ dataUrl: `d${i}`, type: "invoice", region: "AR" });
    }

    await expect(
      store.add({ dataUrl: "overflow", type: "invoice", region: "AR" }),
    ).rejects.toBeInstanceOf(QueueFullError);
  });
});
