import type { NewQueueItem, QueueItem, QueueItemStatus } from "./types";

const DB_NAME = "document-processor-queue";
const STORE_NAME = "queue";
export const MAX_PENDING = 50;
export { DB_NAME as QUEUE_DB_NAME };

export class QueueFullError extends Error {
  constructor() {
    super(`Queue is full (max ${MAX_PENDING} pending items)`);
    this.name = "QueueFullError";
  }
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

let lastCreatedAt = 0;

function nextCreatedAt(): number {
  const now = Date.now();
  lastCreatedAt = Math.max(now, lastCreatedAt + 1);
  return lastCreatedAt;
}

export class QueueStore {
  async add(item: NewQueueItem): Promise<QueueItem> {
    const db = await openDb();
    try {
      const pending = await this._countPending(db);
      if (pending >= MAX_PENDING) {
        throw new QueueFullError();
      }

      const now = nextCreatedAt();
      const queueItem: QueueItem = {
        id: generateId(),
        dataUrl: item.dataUrl,
        type: item.type,
        region: item.region,
        status: "pending",
        retryCount: 0,
        createdAt: now,
        updatedAt: now,
      };

      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put(queueItem);
      await transactionDone(tx);
      return queueItem;
    } finally {
      db.close();
    }
  }

  async listPending(): Promise<QueueItem[]> {
    return this._listByStatus("pending");
  }

  async listDeadLetter(): Promise<QueueItem[]> {
    return this._listByStatus("dead_letter");
  }

  async countPending(): Promise<number> {
    const db = await openDb();
    try {
      return await this._countPending(db);
    } finally {
      db.close();
    }
  }

  async remove(id: string): Promise<void> {
    const db = await openDb();
    try {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(id);
      await transactionDone(tx);
    } finally {
      db.close();
    }
  }

  async update(
    id: string,
    changes: Partial<Pick<QueueItem, "status" | "retryCount" | "dataUrl">>,
  ): Promise<void> {
    const db = await openDb();
    try {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const existing = await requestToPromise(store.get(id));
      if (existing === undefined) {
        return;
      }
      store.put({ ...existing, ...changes, updatedAt: Date.now() });
      await transactionDone(tx);
    } finally {
      db.close();
    }
  }

  private async _listByStatus(status: QueueItemStatus): Promise<QueueItem[]> {
    const db = await openDb();
    try {
      const all = await requestToPromise(
        db.transaction(STORE_NAME).objectStore(STORE_NAME).index("createdAt").getAll(),
      );
      return all.filter((item) => item.status === status);
    } finally {
      db.close();
    }
  }

  private async _countPending(db: IDBDatabase): Promise<number> {
    const all = await requestToPromise(
      db.transaction(STORE_NAME).objectStore(STORE_NAME).getAll(),
    );
    return all.filter((item) => item.status === "pending").length;
  }
}
