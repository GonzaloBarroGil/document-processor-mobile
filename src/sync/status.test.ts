import { describe, expect, it, vi } from "vitest";

vi.mock("../api/client", () => ({
  apiClient: { GET: vi.fn() },
}));

import { apiClient } from "../api/client";
import { isTerminal, pollDocumentStatus, pollUntilTerminal } from "./status";

describe("isTerminal", () => {
  it("recognizes terminal statuses", () => {
    expect(isTerminal("COMPLETED")).toBe(true);
    expect(isTerminal("OCR_FAILED")).toBe(true);
    expect(isTerminal("PENDING")).toBe(false);
  });
});

describe("pollDocumentStatus", () => {
  it("returns the document status", async () => {
    vi.mocked(apiClient.GET).mockResolvedValue({
      data: {
        id: "d1",
        type: "invoice",
        region: "AR",
        status: "COMPLETED",
        media_type: "image/jpeg",
        image_key: "k",
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
      response: new Response(),
    } as never);

    const status = await pollDocumentStatus("d1");

    expect(status).toBe("COMPLETED");
  });

  it("throws when the poll fails", async () => {
    vi.mocked(apiClient.GET).mockResolvedValue({
      error: { message: "boom" },
      response: new Response(null, { status: 404 }),
    } as never);

    await expect(pollDocumentStatus("d1")).rejects.toThrow("Status poll failed");
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
