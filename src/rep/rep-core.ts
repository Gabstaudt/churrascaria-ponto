import { createHash } from "node:crypto";
import type { REPRecord } from "./contracts";

export function normalizeNsr(value: string) { return BigInt(value).toString(); }
export function repExternalId(repDeviceId: string, nsr: string) { return `rep:${repDeviceId}:${normalizeNsr(nsr)}`; }
export function repRecordFingerprint(record: REPRecord) { return createHash("sha256").update(JSON.stringify({ nsr: normalizeNsr(record.nsr), employeeRegistration: record.employeeRegistration.trim(), occurredAt: record.occurredAt, eventType: record.eventType })).digest("hex"); }
export function deduplicateRepBatch(records: REPRecord[]) { const groups = new Map<string, REPRecord[]>(); for (const record of records) { const nsr = normalizeNsr(record.nsr); groups.set(nsr, [...(groups.get(nsr) ?? []), { ...record, nsr }]); } const unique: REPRecord[] = []; const duplicateNsrs: string[] = []; const conflictingNsrs: string[] = []; let conflictingRecordCount = 0; for (const [nsr, group] of groups) { const fingerprints = new Set(group.map(repRecordFingerprint)); if (fingerprints.size > 1) { conflictingNsrs.push(nsr); conflictingRecordCount += group.length; continue; } unique.push(group[0]!); for (let index = 1; index < group.length; index++) duplicateNsrs.push(nsr); } return { unique, duplicateNsrs, conflictingNsrs, conflictingRecordCount }; }
