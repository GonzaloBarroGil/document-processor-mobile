import { describe, expect, it, vi } from "vitest";

import {
  captureDocument,
  dataUrlSizeBytes,
  type CameraGateway,
  type DimensionReader,
} from "./camera";

describe("dataUrlSizeBytes", () => {
  it("estimates byte size from base64", () => {
    expect(dataUrlSizeBytes("data:image/jpeg;base64,AAAA")).toBe(3);
  });

  it("returns 0 for an empty data URL", () => {
    expect(dataUrlSizeBytes("data:image/jpeg;base64,")).toBe(0);
  });
});

describe("captureDocument", () => {
  it("captures via the gateway and maps the result", async () => {
    const gateway: CameraGateway = {
      getPhoto: vi.fn().mockResolvedValue({
        dataUrl: "data:image/jpeg;base64,AAAA",
        format: "jpeg",
        saved: false,
      }),
    };
    const dimensionReader: DimensionReader = {
      read: vi.fn().mockResolvedValue({ width: 1920, height: 1080 }),
    };

    const result = await captureDocument(gateway, dimensionReader);

    expect(result.format).toBe("jpeg");
    expect(result.width).toBe(1920);
    expect(result.height).toBe(1080);
    expect(result.sizeBytes).toBe(3);
  });
});
