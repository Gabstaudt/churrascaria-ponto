const SIGNATURE_MARKER = "ASSINATURA_DIGITAL_EM_ARQUIVO_P7S";

type AEJRecord = { type: "01" | "02" | "03" | "04" | "05" | "06" | "07" | "08"; fields: string[] };
export type AEJDocument = { records: AEJRecord[]; includeSignatureMarker?: boolean };

function field(value: string, maximum: number, required = true) {
  if ((required && value.length === 0) || value.length > maximum || /[|\r\n]/.test(value)) throw new Error("Campo AEJ inválido.");
  if ([...value].some((character) => character.codePointAt(0)! > 255)) throw new Error("Caractere fora de ISO-8859-1.");
  return value;
}
function exact(value: string, pattern: RegExp) { if (!pattern.test(value)) throw new Error("Formato AEJ inválido."); return value; }

export const aej = {
  header: (employerType: "1" | "2", employerId: string, caepf: string, cno: string, name: string, initialDate: string, finalDate: string, generatedAt: string): AEJRecord => ({ type: "01", fields: [employerType, exact(employerId, employerType === "1" ? /^\d{14}$/ : /^\d{11}$/), exact(caepf, /^$|^\d{14}$/), exact(cno, /^$|^\d{12}$/), field(name, 150), exact(initialDate, /^\d{4}-\d{2}-\d{2}$/), exact(finalDate, /^\d{4}-\d{2}-\d{2}$/), exact(generatedAt, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00[+-]\d{4}$/), "002"] }),
  rep: (id: string, type: "1" | "2" | "3", number: string): AEJRecord => ({ type: "02", fields: [exact(id, /^\d{1,9}$/), type, exact(number, /^\d{17}$/)] }),
  employee: (id: string, cpf: string, name: string): AEJRecord => ({ type: "03", fields: [exact(id, /^\d{1,9}$/), exact(cpf, /^\d{11}$/), field(name, 150)] }),
  schedule: (code: string, durationMinutes: string, pairs: Array<[string, string]>): AEJRecord => { if (!pairs.length) throw new Error("Horário contratual sem pares."); return { type: "04", fields: [field(code, 30), exact(durationMinutes, /^\d{1,12}$/), ...pairs.flatMap(([entry, exit]) => [exact(entry, /^([01]\d|2[0-3])[0-5]\d$/), exact(exit, /^([01]\d|2[0-3])[0-5]\d$/)])] }; },
  clock: (employeeId: string, occurredAt: string, repId: string, kind: "E" | "S" | "D", sequence: string, source: "O" | "I" | "P" | "X" | "T", scheduleCode = "", reason = ""): AEJRecord => { if (kind === "E" && Number(sequence) === 1 && !scheduleCode) throw new Error("Código do horário é obrigatório na primeira entrada."); if ((kind === "D" || source === "I") && !reason) throw new Error("Motivo obrigatório para tratamento."); return { type: "05", fields: [exact(employeeId, /^\d{1,9}$/), exact(occurredAt, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00[+-]\d{4}$/), exact(repId, /^$|^\d{1,9}$/), kind, exact(sequence, /^\d{3}$/), source, field(scheduleCode, 30, false), field(reason, 150, false)] }; },
  socialRegistration: (employeeId: string, registration: string): AEJRecord => ({ type: "06", fields: [exact(employeeId, /^\d{1,9}$/), field(registration, 30)] }),
  absenceOrBank: (employeeId: string, type: "1" | "2" | "3" | "4", date: string, minutes = "", movement = ""): AEJRecord => { if (type === "3" && (!/^\d{1,12}$/.test(minutes) || !/^[12]$/.test(movement))) throw new Error("Movimento de banco de horas incompleto."); return { type: "07", fields: [exact(employeeId, /^\d{1,9}$/), type, exact(date, /^\d{4}-\d{2}-\d{2}$/), exact(minutes, /^$|^\d{1,12}$/), exact(movement, /^$|^[12]$/)] }; },
  software: (name: string, version: string, developerType: "1" | "2", developerId: string, developerName: string, email: string): AEJRecord => ({ type: "08", fields: [field(name, 150), field(version, 8), developerType, exact(developerId, developerType === "1" ? /^\d{14}$/ : /^\d{11}$/), field(developerName, 150), field(email, 50)] }),
};

export function serializeAEJ(document: AEJDocument) {
  const counts = new Map<string, number>();
  const lines = document.records.map((record) => { counts.set(record.type, (counts.get(record.type) ?? 0) + 1); return [record.type, ...record.fields].join("|"); });
  lines.push(["99", ...["01", "02", "03", "04", "05", "06", "07", "08"].map((type) => String(counts.get(type) ?? 0))].join("|"));
  if (document.includeSignatureMarker) lines.push(SIGNATURE_MARKER.padEnd(100, " "));
  return Buffer.from(`${lines.join("\r\n")}\r\n`, "latin1");
}
