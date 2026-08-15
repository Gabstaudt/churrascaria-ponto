import type { REPRecord } from "./contracts";
import { normalizeNsr, repRecordFingerprint } from "./rep-core";

export type ImportedREPRecord = { nsr: string; fingerprint: string };

export function reconcileREPRecords(source: REPRecord[], imported: ImportedREPRecord[]) {
  const sourceMap = new Map(source.map((record) => [normalizeNsr(record.nsr), repRecordFingerprint({ ...record, nsr: normalizeNsr(record.nsr) })]));
  const importedMap = new Map(imported.map((record) => [normalizeNsr(record.nsr), record.fingerprint]));
  const missingNsrs = [...sourceMap.keys()].filter((nsr) => !importedMap.has(nsr));
  const alteredNsrs = [...sourceMap].filter(([nsr, fingerprint]) => importedMap.has(nsr) && importedMap.get(nsr) !== fingerprint).map(([nsr]) => nsr);
  const extraNsrs = [...importedMap.keys()].filter((nsr) => !sourceMap.has(nsr));
  return { sourceCount: sourceMap.size, matchedCount: sourceMap.size - missingNsrs.length - alteredNsrs.length, missingNsrs, alteredNsrs, extraNsrs };
}
