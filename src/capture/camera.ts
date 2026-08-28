import {
  Camera,
  CameraResultType,
  CameraSource,
  type Photo,
} from "@capacitor/camera";

export const CAPTURE_WIDTH = 1920;
export const CAPTURE_HEIGHT = 1080;
export const CAPTURE_QUALITY = 85;

export interface CameraGateway {
  getPhoto(): Promise<Photo>;
}

export const capacitorCameraGateway: CameraGateway = {
  async getPhoto() {
    return Camera.getPhoto({
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
      width: CAPTURE_WIDTH,
      height: CAPTURE_HEIGHT,
      quality: CAPTURE_QUALITY,
      correctOrientation: true,
    });
  },
};

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface DimensionReader {
  read(dataUrl: string): Promise<ImageDimensions>;
}

export const imageDimensionReader: DimensionReader = {
  read(dataUrl) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () =>
        resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => reject(new Error("Failed to read image dimensions"));
      image.src = dataUrl;
    });
  },
};

export interface CapturedDocument {
  dataUrl: string;
  format: string;
  width: number;
  height: number;
  sizeBytes: number;
}

export function dataUrlSizeBytes(dataUrl: string): number {
  const base64 = dataUrl.split(",")[1] ?? "";
  return Math.floor((base64.length * 3) / 4);
}

export async function captureDocument(
  gateway: CameraGateway,
  dimensionReader: DimensionReader = imageDimensionReader,
): Promise<CapturedDocument> {
  const photo = await gateway.getPhoto();
  const dataUrl = photo.dataUrl ?? "";
  const { width, height } = await dimensionReader.read(dataUrl);

  return {
    dataUrl,
    format: photo.format,
    width,
    height,
    sizeBytes: dataUrlSizeBytes(dataUrl),
  };
}

export const mockCameraGateway: CameraGateway = {
  async getPhoto(): Promise<Photo> {
    const canvas = document.createElement("canvas");
    canvas.width = CAPTURE_WIDTH;
    canvas.height = CAPTURE_HEIGHT;
    const ctx = canvas.getContext("2d");
    if (ctx === null) {
      throw new Error("Failed to create 2d canvas context");
    }
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CAPTURE_WIDTH, CAPTURE_HEIGHT);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    return { dataUrl, format: "jpeg", saved: true };
  },
};

export function resolveCameraGateway(): CameraGateway {
  return import.meta.env.VITE_MOCK_CAPTURE === "1"
    ? mockCameraGateway
    : capacitorCameraGateway;
}
