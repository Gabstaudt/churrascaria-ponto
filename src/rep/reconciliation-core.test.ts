import { describe, expect, it } from "vitest";
import { repRecordFingerprint } from "./rep-core";
import { reconcileREPRecords } from "./reconciliation-core";

const record = (nsr: string, time = "2026-08-14T08:00:00-03:00") => ({ nsr, employeeRegistration: "M1", occurredAt: time, eventType: "CLOCK" as const });
describe("REP reconciliation", () => {
  it("separa ausentes, alterados e extras sem presumir continuidade numérica", () => { const source = [record("10"), record("12"), record("20")]; const imported = [{ nsr: "10", fingerprint: repRecordFingerprint(record("10")) }, { nsr: "12", fingerprint: repRecordFingerprint(record("12", "2026-08-14T09:00:00-03:00")) }, { nsr: "99", fingerprint: repRecordFingerprint(record("99")) }]; expect(reconcileREPRecords(source, imported)).toEqual({ sourceCount: 3, matchedCount: 1, missingNsrs: ["20"], alteredNsrs: ["12"], extraNsrs: ["99"] }); });
});
