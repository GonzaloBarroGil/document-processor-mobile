import { describe, expect, it, vi } from "vitest";

vi.mock("@capacitor/camera", () => ({
  Camera: { getPhoto: vi.fn() },
  CameraResultType: { DataUrl: "dataUrl" },
  CameraSource: { Camera: "CAMERA" },
}));

import { Camera } from "@capacitor/camera";

import { capacitorCameraGateway } from "./camera";

describe("capacitorCameraGateway", () => {
  it("captures via the Camera plugin at the required quality", async () => {
    vi.mocked(Camera.getPhoto).mockResolvedValue({
      dataUrl: "data:image/jpeg;base64,AAAA",
      format: "jpeg",
      saved: false,
    });

    const photo = await capacitorCameraGateway.getPhoto();

    expect(photo.format).toBe("jpeg");
    expect(Camera.getPhoto).toHaveBeenCalledWith(
      expect.objectContaining({
        resultType: "dataUrl",
        source: "CAMERA",
        width: 1920,
        height: 1080,
        quality: 85,
      }),
    );
  });
});
