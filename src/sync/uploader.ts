import { apiClient } from "../api/client";
import type { QueueItem } from "../queue/types";

export interface UploadResult {
  documentId: string;
}

export interface Uploader {
  upload(item: QueueItem): Promise<UploadResult>;
}

function dataUrlToFile(dataUrl: string): File {
  const [header, base64] = dataUrl.split(",");
  const mime = header?.match(/data:(.*?);/)?.[1] ?? "image/jpeg";
  const binary = atob(base64 ?? "");
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new File([bytes], "document.jpg", { type: mime });
}

export const apiUploader: Uploader = {
  async upload(item) {
    const formData = new FormData();
    formData.append("file", dataUrlToFile(item.dataUrl));
    formData.append("type", item.type);
    formData.append("region", item.region);

    const { data, error } = await apiClient.POST("/api/v1/documents", {
      body: formData as never,
    });

    if (error !== undefined || data === undefined) {
      throw new Error("Upload failed");
    }

    return { documentId: data.document_id };
  },
};
