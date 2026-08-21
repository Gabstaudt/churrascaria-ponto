export const dailyStatusValues = ["EXPECTED", "PRESENT", "LATE", "LATE_JUSTIFIED", "INCOMPLETE", "POSSIBLE_ABSENCE", "ABSENCE_UNJUSTIFIED", "ABSENCE_JUSTIFIED", "OFF", "VACATION", "LEAVE", "NO_SCHEDULE"] as const;
export type ReportStatus = typeof dailyStatusValues[number];
export const reportStatusLabels: Record<ReportStatus, string> = { EXPECTED: "Previsto", PRESENT: "Presente", LATE: "Atrasado", LATE_JUSTIFIED: "Atraso justificado", INCOMPLETE: "Marcação incompleta", POSSIBLE_ABSENCE: "Possível ausência", ABSENCE_UNJUSTIFIED: "Falta não justificada", ABSENCE_JUSTIFIED: "Ausência justificada", OFF: "Folga", VACATION: "Férias", LEAVE: "Afastamento", NO_SCHEDULE: "Sem jornada" };

export function datesBetween(start: string, end: string) { const result: string[] = []; const current = new Date(`${start}T00:00:00Z`); const last = new Date(`${end}T00:00:00Z`); while (current <= last) { result.push(current.toISOString().slice(0, 10)); current.setUTCDate(current.getUTCDate() + 1); } return result; }
type SummableRow = { plannedMinutes: number; workedMinutes: number; lateMinutes: number; overtimeMinutes: number; scheduledOvertimeMinutes: number; timeBankMinutes: number; status: ReportStatus };
export function sumReportRows(rows: SummableRow[]) { return rows.reduce((total, row) => ({ plannedMinutes: total.plannedMinutes + row.plannedMinutes, workedMinutes: total.workedMinutes + row.workedMinutes, lateMinutes: total.lateMinutes + row.lateMinutes, overtimeMinutes: total.overtimeMinutes + row.overtimeMinutes, scheduledOvertimeMinutes: total.scheduledOvertimeMinutes + row.scheduledOvertimeMinutes, timeBankMinutes: total.timeBankMinutes + row.timeBankMinutes, absences: total.absences + (row.status === "ABSENCE_UNJUSTIFIED" ? 1 : 0), justifiedAbsences: total.justifiedAbsences + (row.status === "ABSENCE_JUSTIFIED" ? 1 : 0), pending: total.pending + (["INCOMPLETE", "POSSIBLE_ABSENCE"].includes(row.status) ? 1 : 0) }), { plannedMinutes: 0, workedMinutes: 0, lateMinutes: 0, overtimeMinutes: 0, scheduledOvertimeMinutes: 0, timeBankMinutes: 0, absences: 0, justifiedAbsences: 0, pending: 0 }); }
export function csvCell(value: string | number) { let text = String(value); if (/^[=+\-@]/.test(text)) text = `'${text}`; return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text; }

const sourceLabels = { SIMULATOR: "Simulador", IMPORT: "Importação", REP_C: "REP-C", REP_P: "REP-P" } as const;
type TimeEntryRow = { occurredAt: Date; employeeName: string; registrationNumber: string; position: string; source: keyof typeof sourceLabels; externalId: string };
export function timeEntriesToCsv(entries: TimeEntryRow[]) {
  const header = ["Data", "Hora", "Funcionário", "Matrícula", "Cargo", "Origem", "Identificador externo"];
  const formatDate = (value: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Belem" }).format(value);
  const formatTime = (value: Date) => new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "America/Belem" }).format(value);
  const sorted = [...entries].sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());
  const lines = sorted.map((entry) => [formatDate(entry.occurredAt), formatTime(entry.occurredAt), entry.employeeName, entry.registrationNumber, entry.position, sourceLabels[entry.source], entry.externalId].map(csvCell).join(","));
  const bom = String.fromCharCode(0xfeff);
  return `${bom}${[header.join(","), ...lines].join("\r\n")}`;
}

// Agrupa as linhas do relatório por funcionário (ordem alfabética), cada grupo já
// ordenado por data — usado nas exportações para separar o relatório por funcionário
// mesmo quando "Todos" está selecionado, com subtotal por pessoa.
export function groupRowsByEmployee<Row extends SummableRow & { employeeId: string; employeeName: string; registrationNumber: string; date: string }>(rows: Row[]) {
  const groups = new Map<string, { employeeId: string; employeeName: string; registrationNumber: string; rows: Row[] }>();
  for (const row of rows) {
    const group = groups.get(row.employeeId) ?? { employeeId: row.employeeId, employeeName: row.employeeName, registrationNumber: row.registrationNumber, rows: [] };
    group.rows.push(row);
    groups.set(row.employeeId, group);
  }
  return [...groups.values()]
    .sort((a, b) => a.employeeName.localeCompare(b.employeeName, "pt-BR"))
    .map((group) => ({ ...group, rows: [...group.rows].sort((a, b) => a.date.localeCompare(b.date)), totals: sumReportRows(group.rows) }));
}
