import { describe, expect, it } from "vitest";
import { csvCell, datesBetween, sumReportRows } from "./report-core";

describe("report core", () => {
  it("inclui todas as datas sem deslocamento de timezone", () => expect(datesBetween("2026-02-27", "2026-03-02")).toEqual(["2026-02-27", "2026-02-28", "2026-03-01", "2026-03-02"]));
  it("totaliza valores e estados exibidos", () => expect(sumReportRows([{ plannedMinutes: 480, workedMinutes: 450, lateMinutes: 30, overtimeMinutes: 0, timeBankMinutes: -30, status: "LATE" }, { plannedMinutes: 0, workedMinutes: 0, lateMinutes: 0, overtimeMinutes: 0, timeBankMinutes: 0, status: "ABSENCE_UNJUSTIFIED" }])).toMatchObject({ plannedMinutes: 480, workedMinutes: 450, lateMinutes: 30, timeBankMinutes: -30, absences: 1 }));
  it("neutraliza fórmulas e escapa CSV", () => { expect(csvCell("=SUM(A1:A2)")).toBe("'=SUM(A1:A2)"); expect(csvCell("Nome, teste")).toBe('"Nome, teste"'); });
});
