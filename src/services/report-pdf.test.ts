import { describe, expect, it } from "vitest";
import { reportToPdf } from "./report-pdf";

describe("report pdf", () => { it("gera um PDF válido com o mesmo total recebido da tela", () => { const pdf = reportToPdf({ filters: { startDate: "2026-08-01", endDate: "2026-08-01" }, rows: [], totals: { plannedMinutes: 480, workedMinutes: 470, lateMinutes: 10, overtimeMinutes: 0, scheduledOvertimeMinutes: 0, timeBankMinutes: -10, absences: 0, justifiedAbsences: 0, pending: 0 }, byEmployee: [] }); expect(pdf.subarray(0, 8).toString()).toBe("%PDF-1.4"); expect(pdf.toString("ascii")).toContain("trabalhado 470 min"); }); });
