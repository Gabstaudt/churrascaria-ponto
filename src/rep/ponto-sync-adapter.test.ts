import { describe, expect, it } from "vitest";
import { PontoSyncREPAdapter } from "./ponto-sync-adapter";

describe("Ponto Sync REP adapter", () => {
  it("normaliza o contrato versionado do agente local", () => { const batch = new PontoSyncREPAdapter().parse({ version: "ponto-sync-v1", sourceAdapter: "FIXTURE", records: [{ nsr: "10", employeeRegistration: "M1", occurredAt: "2026-08-14T08:00:00-03:00", eventType: "CLOCK" }] }); expect(batch.source).toBe("FIXTURE"); expect(batch.records[0]?.nsr).toBe("10"); });
  it("rejeita versões desconhecidas", () => expect(() => new PontoSyncREPAdapter().parse({ version: "ponto-sync-v2", sourceAdapter: "FIXTURE", records: [] })).toThrow());
});
