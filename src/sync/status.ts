import { apiClient } from "../api/client";

export type TerminalDocumentStatus =
  | "COMPLETED"
  | "VALIDATION_FAILED"
  | "OCR_FAILED"
  | "IMAGE_EXPIRED";

const TERMINAL_STATUSES: readonly TerminalDocumentStatus[] = [
  "COMPLETED",
  "VALIDATION_FAILED",
  "OCR_FAILED",
  "IMAGE_EXPIRED",
];

export function isTerminal(status: string): status is TerminalDocumentStatus {
  return TERMINAL_STATUSES.includes(status as TerminalDocumentStatus);
}

export async function pollDocumentStatus(documentId: string): Promise<string> {
  const { data, error } = await apiClient.GET(
    "/api/v1/documents/{document_id}",
    { params: { path: { document_id: documentId } } },
  );

  if (error !== undefined || data === undefined) {
    throw new Error("Status poll failed");
  }

  return data.status;
}

export interface PollOptions {
  intervalMs?: number;
  maxAttempts?: number;
  sleep?: (ms: number) => Promise<void>;
}

export async function pollUntilTerminal(
  documentId: string,
  poll: (id: string) => Promise<string>,
  options: PollOptions = {},
): Promise<TerminalDocumentStatus> {
  const intervalMs = options.intervalMs ?? 1000;
  const maxAttempts = options.maxAttempts ?? 30;
  const sleeper = options.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const status = await poll(documentId);
    if (isTerminal(status)) {
      return status;
    }
    await sleeper(intervalMs);
  }

  throw new Error("Timed out waiting for document status");
}
