import { randomUUID } from "node:crypto";
import { retryDelayMs } from "./backoff";
import type { PontoSyncSourceAdapter, PontoSyncState, QueuedBatch, SyncResponse } from "./types";

type AgentDependencies = { adapter: PontoSyncSourceAdapter; client: { send(requestId: string, batch: { source: string; records: QueuedBatch["records"] }): Promise<SyncResponse> }; store: { read(): Promise<PontoSyncState>; write(state: PontoSyncState): Promise<void> }; batchSize: number; now?: () => Date; random?: () => number; emit?: (event: string, details?: Record<string, unknown>) => void };

function highestNsr(records: QueuedBatch["records"]) { return records.reduce((highest, record) => BigInt(record.nsr) > BigInt(highest) ? record.nsr : highest, records[0]!.nsr); }

export async function runPontoSyncCycle({ adapter, client, store, batchSize, now = () => new Date(), random = Math.random, emit = () => undefined }: AgentDependencies) {
  const state = await store.read();
  if (state.queue.length === 0) {
    const records = await adapter.fetchAfter(state.lastConfirmedNsr, batchSize);
    if (records.length) { const createdAt = now().toISOString(); state.queue.push({ id: randomUUID(), requestId: randomUUID(), records, attempts: 0, nextAttemptAt: createdAt, createdAt }); await store.write(state); emit("batch_queued", { count: records.length }); }
  }
  const batch = state.queue[0];
  if (!batch || new Date(batch.nextAttemptAt).getTime() > now().getTime()) return { status: "idle" as const, queueLength: state.queue.length };
  try {
    const result = await client.send(batch.requestId, { source: adapter.id, records: batch.records });
    if (result.rejected > 0 || result.status !== "PROCESSED") { batch.requestId = randomUUID(); throw new Error(`Lote parcial (${result.rejected} registro(s) rejeitado(s)).`); }
    state.lastConfirmedNsr = highestNsr(batch.records); state.queue.shift(); await store.write(state); emit("batch_confirmed", { count: batch.records.length, lastConfirmedNsr: state.lastConfirmedNsr });
    return { status: "confirmed" as const, queueLength: state.queue.length };
  } catch (error) {
    batch.attempts++; batch.lastError = error instanceof Error ? error.message : "Falha desconhecida"; batch.nextAttemptAt = new Date(now().getTime() + retryDelayMs(batch.attempts, random)).toISOString(); await store.write(state); emit("batch_retry_scheduled", { attempts: batch.attempts, nextAttemptAt: batch.nextAttemptAt });
    return { status: "retry" as const, queueLength: state.queue.length };
  }
}
