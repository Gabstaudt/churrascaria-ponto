import "server-only";
import { and, asc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { employees, timeBankEntries } from "@/db/schema";
import type { ReportFilters } from "@/validations/report";
import { getDailyAttendanceCalculation } from "./attendance.service";
import { getDailyAttendance } from "./daily-attendance.service";
import { csvCell, datesBetween, reportStatusLabels, sumReportRows, type ReportStatus } from "./report-core";

export type OperationalReportRow = { date: string; employeeId: string; employeeName: string; registrationNumber: string; position: string; status: ReportStatus; schedule: string; entries: string; plannedMinutes: number; workedMinutes: number; lateMinutes: number; overtimeMinutes: number; timeBankMinutes: number };
function time(date: Date) { return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Belem" }).format(date); }
export async function listReportEmployees() { return db.select({ id: employees.id, fullName: employees.fullName, registrationNumber: employees.registrationNumber }).from(employees).orderBy(asc(employees.fullName)); }
export async function generateOperationalReport(filters: ReportFilters) {
  const bankConditions = [gte(timeBankEntries.referenceDate, filters.startDate), lte(timeBankEntries.referenceDate, filters.endDate)]; if (filters.employeeId) bankConditions.push(eq(timeBankEntries.employeeId, filters.employeeId));
  const bank = await db.select({ employeeId: timeBankEntries.employeeId, date: timeBankEntries.referenceDate, amount: timeBankEntries.amountMinutes }).from(timeBankEntries).where(and(...bankConditions));
  const bankByDay = new Map<string, number>(); for (const entry of bank) bankByDay.set(`${entry.employeeId}:${entry.date}`, (bankByDay.get(`${entry.employeeId}:${entry.date}`) ?? 0) + entry.amount);
  const rows: OperationalReportRow[] = [];
  for (const date of datesBetween(filters.startDate, filters.endDate)) {
    const daily = await getDailyAttendance(date);
    for (const item of daily.rows) {
      if (filters.employeeId && item.employee.id !== filters.employeeId) continue;
      if (filters.status && item.status !== filters.status) continue;
      const calculated = ["PRESENT", "LATE", "LATE_JUSTIFIED", "INCOMPLETE"].includes(item.status) ? await getDailyAttendanceCalculation(item.employee.id, date) : undefined;
      rows.push({ date, employeeId: item.employee.id, employeeName: item.employee.fullName, registrationNumber: item.employee.registrationNumber, position: item.employee.position, status: item.status, schedule: item.situation === "WORK" ? `${item.startTime?.slice(0, 5) ?? "--:--"}–${item.endTime?.slice(0, 5) ?? "--:--"}` : item.scheduleName ?? reportStatusLabels[item.status], entries: item.entries.map((entry) => time(entry.occurredAt)).join(" · "), plannedMinutes: calculated?.calculation.plannedMinutes ?? 0, workedMinutes: calculated?.calculation.workedMinutes ?? 0, lateMinutes: calculated?.calculation.delayMinutes ?? 0, overtimeMinutes: calculated?.calculation.overtimeMinutes ?? 0, timeBankMinutes: bankByDay.get(`${item.employee.id}:${date}`) ?? 0 });
    }
  }
  return { filters, rows, totals: sumReportRows(rows) };
}
export function reportToCsv(report: Awaited<ReturnType<typeof generateOperationalReport>>) { const header = ["Data", "Funcionário", "Matrícula", "Cargo", "Status", "Jornada", "Marcações", "Previsto (min)", "Trabalhado (min)", "Atraso (min)", "Extra (min)", "Banco (min)"]; const lines = report.rows.map((row) => [row.date, row.employeeName, row.registrationNumber, row.position, reportStatusLabels[row.status], row.schedule, row.entries, row.plannedMinutes, row.workedMinutes, row.lateMinutes, row.overtimeMinutes, row.timeBankMinutes].map(csvCell).join(",")); return `\uFEFF${[header.join(","), ...lines].join("\r\n")}`; }
