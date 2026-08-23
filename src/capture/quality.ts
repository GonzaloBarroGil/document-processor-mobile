export const MIN_WIDTH = 1920;
export const MIN_HEIGHT = 1080;
export const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export interface CaptureDimensions {
  width: number;
  height: number;
  format: string;
  sizeBytes: number;
}

export type CaptureQualityResult =
  | { ok: true }
  | { ok: false; errors: string[] };

export function validateCaptureQuality(
  input: CaptureDimensions,
): CaptureQualityResult {
  const errors: string[] = [];

  if (input.width < MIN_WIDTH || input.height < MIN_HEIGHT) {
    errors.push(`Resolution too low (minimum ${MIN_WIDTH}x${MIN_HEIGHT})`);
  }

  const format = input.format.toLowerCase();
  if (format !== "jpeg" && format !== "jpg") {
    errors.push("Image must be JPEG");
  }

  if (input.sizeBytes > MAX_SIZE_BYTES) {
    errors.push("Image exceeds 5 MB");
  }

  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}
