import { describe, expect, it, vi } from "vitest";

import { retryDeadLetter, shouldDeadLetter } from "./dead-letter";
import type { QueueStore } from "./store";
import type { QueueItem } from "./types";

function makeItem(): QueueItem {
  return {
    id: "1",
    dataUrl: "data:image/jpeg;base64,AAAA",
    type: "invoice",
    region: "AR",
    status: "dead_letter",
    retryCount: 5,
    createdAt: 1,
    updatedAt: 1,
  };
}

describe("shouldDeadLetter", () => {
  it("returns true when retries are exhausted", () => {
    expect(shouldDeadLetter(5)).toBe(true);
    expect(shouldDeadLetter(6)).toBe(true);
  });

  it("returns false while retries remain", () => {
    expect(shouldDeadLetter(0)).toBe(false);
    expect(shouldDeadLetter(4)).toBe(false);
  });
});

describe("retryDeadLetter", () => {
  it("resets a dead-letter item back to pending", async () => {
    const store = { update: vi.fn().mockResolvedValue(undefined) } as unknown as QueueStore;
    const item = makeItem();

    await retryDeadLetter(store, item);

    expect(store.update).toHaveBeenCalledWith("1", {
      status: "pending",
      retryCount: 0,
    });
  });
});
