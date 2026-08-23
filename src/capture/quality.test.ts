import { describe, expect, it } from "vitest";

import { validateCaptureQuality } from "./quality";

describe("validateCaptureQuality", () => {
  it("accepts a valid JPEG", () => {
    const result = validateCaptureQuality({
      width: 1920,
      height: 1080,
      format: "jpeg",
      sizeBytes: 1024,
    });

    expect(result).toEqual({ ok: true });
  });

  it("rejects low resolution", () => {
    const result = validateCaptureQuality({
      width: 640,
      height: 480,
      format: "jpeg",
      sizeBytes: 1024,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.join()).toContain("Resolution");
    }
  });

  it("rejects non-JPEG formats", () => {
    const result = validateCaptureQuality({
      width: 1920,
      height: 1080,
      format: "png",
      sizeBytes: 1024,
    });

    expect(result.ok).toBe(false);
  });

  it("rejects images over 5 MB", () => {
    const result = validateCaptureQuality({
      width: 1920,
      height: 1080,
      format: "jpeg",
      sizeBytes: 5 * 1024 * 1024 + 1,
    });

    expect(result.ok).toBe(false);
  });
});
