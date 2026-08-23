export type QueueItemStatus = "pending" | "dead_letter";

export interface QueueItem {
  id: string;
  dataUrl: string;
  type: string;
  region: string;
  status: QueueItemStatus;
  retryCount: number;
  createdAt: number;
  updatedAt: number;
}

export type NewQueueItem = Pick<QueueItem, "dataUrl" | "type" | "region">;
