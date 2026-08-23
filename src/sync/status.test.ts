import { describe, expect, it, vi } from "vitest";

import { isTerminal, pollUntilTerminal } from "./status";

describe("isTerminal", () => {
  it("recognizes terminal statuses", () => {
    expect(isTerminal("COMPLETED")).toBe(true);
    expect(isTerminal("OCR_FAILED")).toBe(true);
    expect(isTerminal("PENDING")).toBe(false);
  });
});

describe("pollUntilTerminal", () => {
  it("returns the terminal status once reached", async () => {
    const poll = vi
      .fn()
      .mockResolvedValueOnce("PENDING")
      .mockResolvedValueOnce("COMPLETED");
    const sleep = vi.fn().mockResolvedValue(undefined);

    const status = await pollUntilTerminal("d1", poll, { intervalMs: 10, sleep });

    expect(status).toBe("COMPLETED");
    expect(poll).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledTimes(1);
  });

  it("times out after the maximum attempts", async () => {
    const poll = vi.fn().mockResolvedValue("PENDING");
    const sleep = vi.fn().mockResolvedValue(undefined);

    await expect(
      pollUntilTerminal("d1", poll, { intervalMs: 10, maxAttempts: 3, sleep }),
    ).rejects.toThrow("Timed out");
  });
});
