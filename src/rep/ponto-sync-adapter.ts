import type { REPAdapter } from "./contracts";
import { pontoSyncBatchSchema } from "@/validations/rep";

export class PontoSyncREPAdapter implements REPAdapter {
  readonly id = "PONTO_SYNC_V1";
  parse(payload: unknown) { const parsed = pontoSyncBatchSchema.parse(payload); return { source: parsed.sourceAdapter, records: parsed.records }; }
}
