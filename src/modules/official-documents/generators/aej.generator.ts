import { aej, serializeAEJ } from "@/compliance/aej";

export const AEJ_LAYOUT_VERSION = "PORTARIA_671_AEJ_002";

export type AejGenerationSource = {
  legalRecords: [ReturnType<typeof aej.header>, ReturnType<typeof aej.software>];
  registrars: Array<{ id: string; inpiRegistration: string }>;
  employees: Array<{ id: string; cpf: string; name: string; registrationNumber: string; scheduleCode: string; scheduleMinutes: number; schedulePairs: Array<[string, string]> }>;
  entries: Array<{ employeeId: string; occurredAt: string; registrarId?: string; kind: "E" | "S" | "D"; source: "O" | "I" | "P" | "X" | "T"; scheduleCode?: string; reason?: string }>;
  bank: Array<{ employeeId: string; date: string; minutes: number }>;
};

export function generateAejArtifact(source: AejGenerationSource) {
  const employeeNumbers = new Map(source.employees.map((employee, index) => [employee.id, String(index + 1)]));
  const registrarNumbers = new Map(source.registrars.map((registrar, index) => [registrar.id, String(index + 1)]));
  const records = [
    source.legalRecords[0],
    ...source.registrars.map((registrar, index) => aej.rep(String(index + 1), "3", registrar.inpiRegistration)),
    ...source.employees.map((employee, index) => aej.employee(String(index + 1), employee.cpf, employee.name)),
    ...source.employees.map((employee) => aej.schedule(employee.scheduleCode, String(employee.scheduleMinutes), employee.schedulePairs)),
    ...source.entries.map((entry, index, entries) => {
      const employeeNumber = employeeNumbers.get(entry.employeeId);
      if (!employeeNumber) throw new Error("AEJ_EMPLOYEE_MAPPING_MISSING");
      const sameDay = entries.slice(0, index + 1).filter((candidate) => candidate.employeeId === entry.employeeId && candidate.occurredAt.slice(0, 10) === entry.occurredAt.slice(0, 10));
      const sequence = String(sameDay.length).padStart(3, "0");
      return aej.clock(employeeNumber, entry.occurredAt, entry.registrarId ? registrarNumbers.get(entry.registrarId) ?? "" : "", entry.kind, sequence, entry.source, sequence === "001" && entry.kind === "E" ? entry.scheduleCode ?? "" : "", entry.reason ?? "");
    }),
    ...source.employees.map((employee, index) => aej.socialRegistration(String(index + 1), employee.registrationNumber)),
    ...source.bank.filter((entry) => entry.minutes !== 0).map((entry) => {
      const employeeNumber = employeeNumbers.get(entry.employeeId);
      if (!employeeNumber) throw new Error("AEJ_EMPLOYEE_MAPPING_MISSING");
      return aej.absenceOrBank(employeeNumber, "3", entry.date, String(Math.abs(entry.minutes)), entry.minutes > 0 ? "1" : "2");
    }),
    source.legalRecords[1],
  ].filter((record): record is NonNullable<typeof record> => Boolean(record));
  const bytes = serializeAEJ({ records, includeSignatureMarker: true });
  return { bytes, recordCount: records.length, recordCounts: records.reduce<Record<string, number>>((counts, record) => ({ ...counts, [record.type]: (counts[record.type] ?? 0) + 1 }), {}) };
}
