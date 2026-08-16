import type { AfdArtifact, AfdClockRecord, AfdSource } from "../types";

export function reconcileAfd(source: AfdSource, artifact: AfdArtifact) {
  const expected = new Map(source.entries.map((entry) => [entry.sourceId, entry]));
  const generated = artifact.records.filter((record): record is AfdClockRecord => record.type === "7");
  const generatedIds = new Set(generated.map((entry) => entry.sourceId));
  const missing = source.entries.filter((entry) => !generatedIds.has(entry.sourceId)).map((entry) => ({ code: "AFD_RECORD_MISSING", sourceId: entry.sourceId, nsr: entry.nsr }));
  const unexpected = generated.filter((entry) => !expected.has(entry.sourceId)).map((entry) => ({ code: "UNEXPECTED_AFD_RECORD", sourceId: entry.sourceId, nsr: entry.nsr }));
  const divergent = generated.flatMap((entry) => { const origin = expected.get(entry.sourceId); if (!origin) return []; return origin.nsr !== entry.nsr || origin.employeeCpf !== entry.employeeCpf || origin.markedAt.getTime() !== entry.markedAt.getTime() ? [{ code: "AFD_RECORD_DIVERGENCE", sourceId: entry.sourceId, nsr: entry.nsr }] : []; });
  return { expected: source.entries.length, generated: generated.length, missing, unexpected, divergent, valid: !missing.length && !unexpected.length && !divergent.length };
}
