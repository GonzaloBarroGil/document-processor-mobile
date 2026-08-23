import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("../api/client", () => ({
  apiClient: { POST: vi.fn() },
}));

import { apiClient } from "../api/client";
import type { QueueItem } from "../queue/types";
import { apiUploader } from "./uploader";

interface PostResult {
  data?: { document_id: string };
  error?: unknown;
  response: Response;
}

type PostMock = Mock<(path: string, init: unknown) => Promise<PostResult>>;

function postMock(): PostMock {
  return apiClient.POST as unknown as PostMock;
}

function makeItem(): QueueItem {
  return {
    id: "1",
    dataUrl: "data:image/jpeg;base64,AAAA",
    type: "invoice",
    region: "AR",
    status: "pending",
    retryCount: 0,
    createdAt: 1,
    updatedAt: 1,
  };
}

describe("apiUploader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uploads a queue item and returns the document id", async () => {
    postMock().mockResolvedValue({
      data: { document_id: "d1" },
      response: new Response(),
    });

    const result = await apiUploader.upload(makeItem());

    expect(result.documentId).toBe("d1");
    expect(postMock()).toHaveBeenCalledWith(
      "/api/v1/documents",
      expect.objectContaining({ body: expect.any(FormData) }),
    );
  });

  it("throws when the upload fails", async () => {
    postMock().mockResolvedValue({
      error: { message: "boom" },
      response: new Response(null, { status: 500 }),
    });

    await expect(apiUploader.upload(makeItem())).rejects.toThrow(
      "Upload failed",
    );
  });
});
