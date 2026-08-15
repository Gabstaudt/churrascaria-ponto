import type { REPRecord } from "@/rep/contracts";

export interface PontoSyncSourceAdapter {
  readonly id: string;
  fetchAfter(lastConfirmedNsr: string | undefined, limit: number): Promise<REPRecord[]>;
}

export type QueuedBatch = {
  id: string;
  requestId: string;
  records: REPRecord[];
  attempts: number;
  nextAttemptAt: string;
  createdAt: string;
  lastError?: string;
};

export type PontoSyncState = {
  version: 1;
  lastConfirmedNsr?: string;
  queue: QueuedBatch[];
};

export type SyncResponse = {
  status: "PROCESSED" | "PARTIAL";
  received: number;
  inserted: number;
  duplicates: number;
  rejected: number;
};
