import type { REPBatch } from "@/rep/contracts";
import type { PontoSyncConfig } from "./config";
import type { SyncResponse } from "./types";

export class PontoSyncApiClient {
  constructor(private readonly config: Pick<PontoSyncConfig, "apiUrl" | "deviceId" | "deviceToken">, private readonly request: typeof fetch = fetch) {}

  async send(requestId: string, batch: REPBatch): Promise<SyncResponse> {
    const response = await this.request(new URL("/api/rep/sync", this.config.apiUrl), { method: "POST", headers: { authorization: `Bearer ${this.config.deviceToken}`, "content-type": "application/json", "x-rep-device-id": this.config.deviceId, "x-request-id": requestId }, body: JSON.stringify({ version: "ponto-sync-v1", sourceAdapter: batch.source, records: batch.records }), signal: AbortSignal.timeout(30_000) });
    if (!response.ok) throw new Error(`API respondeu HTTP ${response.status}.`);
    return await response.json() as SyncResponse;
  }
}
