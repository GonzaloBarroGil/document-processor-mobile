import { describe, expect, it, vi } from "vitest";

import { backoffDelayMs, sleep } from "./backoff";

describe("backoffDelayMs", () => {
  it("doubles the delay with each attempt", () => {
    expect(backoffDelayMs(0)).toBe(1000);
    expect(backoffDelayMs(1)).toBe(2000);
    expect(backoffDelayMs(2)).toBe(4000);
    expect(backoffDelayMs(3)).toBe(8000);
  });

  it("caps the delay at the maximum", () => {
    const config = { baseDelayMs: 1000, maxDelayMs: 4000 };

    expect(backoffDelayMs(0, config)).toBe(1000);
    expect(backoffDelayMs(1, config)).toBe(2000);
    expect(backoffDelayMs(2, config)).toBe(4000);
    expect(backoffDelayMs(10, config)).toBe(4000);
  });
});

describe("sleep", () => {
  it("resolves after the given delay", async () => {
    vi.useFakeTimers();
    const promise = sleep(1000);
    let resolved = false;
    void promise.then(() => {
      resolved = true;
    });

    await vi.advanceTimersByTimeAsync(1000);

    expect(resolved).toBe(true);
    vi.useRealTimers();
  });
});
