import { chainedClockHash, digits } from "../layout/afd-layout-004";
import { decodeLatin1 } from "../serializers/latin1";
import type { AfdClockRecord, AfdRecord, AfdSource, AfdValidationIssue } from "../types";

function validCpf(value: string) {
  const document = digits(value); if (document.length !== 11 || /^(\d)\1+$/.test(document)) return false;
  const digit = (length: number) => { const sum = document.slice(0, length).split("").reduce((total, item, index) => total + Number(item) * (length + 1 - index), 0); const rest = (sum * 10) % 11; return rest === 10 ? 0 : rest; };
  return digit(9) === Number(document[9]) && digit(10) === Number(document[10]);
}
function validCnpj(value: string) {
  const document = digits(value); if (document.length !== 14 || /^(\d)\1+$/.test(document)) return false;
  const digit = (length: number) => { const weights = length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]; const sum = document.slice(0, length).split("").reduce((total, item, index) => total + Number(item) * weights[index]!, 0); const rest = sum % 11; return rest < 2 ? 0 : 11 - rest; };
  return digit(12) === Number(document[12]) && digit(13) === Number(document[13]);
}

export function validateAfdSource(source: AfdSource, records: AfdClockRecord[]) {
  const issues: AfdValidationIssue[] = [];
  if (source.registrar.mode !== "REP_P") issues.push({ severity: "ERROR", code: "INVALID_REGISTRAR_MODE", message: "O registrador selecionado não é REP-P." });
  if (source.registrar.status !== "ACTIVE") issues.push({ severity: "ERROR", code: "INACTIVE_REGISTRAR", message: "O registrador não está ativo." });
  if (!(source.employer.idType === "CPF" ? validCpf(source.employer.id) : validCnpj(source.employer.id))) issues.push({ severity: "ERROR", code: "INVALID_EMPLOYER_DOCUMENT", message: "CPF/CNPJ do empregador é inválido." });
  const seen = new Set<number>();
  records.forEach((record, index) => {
    if (seen.has(record.nsr)) issues.push({ severity: "ERROR", code: "DUPLICATE_NSR", message: `NSR ${record.nsr} está duplicado.`, nsr: String(record.nsr) });
    seen.add(record.nsr);
    if (index > 0 && record.nsr !== records[index - 1]!.nsr + 1) issues.push({ severity: "ERROR", code: "MISSING_NSR", message: `Lacuna entre os NSRs ${records[index - 1]!.nsr} e ${record.nsr}.`, nsr: String(records[index - 1]!.nsr + 1) });
    if (!validCpf(record.employeeCpf)) issues.push({ severity: "ERROR", code: "INVALID_EMPLOYEE_CPF", message: "CPF obrigatório do trabalhador é inválido.", nsr: String(record.nsr) });
  });
  if (!records.length) issues.push({ severity: "WARNING", code: "EMPTY_PERIOD", message: "Não existem marcações REP-P no período informado." });
  return issues;
}

export function validateAfdStructure(records: AfdRecord[]) {
  const issues: AfdValidationIssue[] = [];
  if (records[0]?.type !== "1") issues.push({ severity: "ERROR", code: "MISSING_HEADER", message: "Cabeçalho ausente." });
  if (records.at(-2)?.type !== "9") issues.push({ severity: "ERROR", code: "MISSING_TRAILER", message: "Trailer ausente." });
  if (records.at(-1)?.type !== "SIGNATURE") issues.push({ severity: "ERROR", code: "MISSING_SIGNATURE_RECORD", message: "Registro de assinatura ausente." });
  const clocks = records.filter((record): record is AfdClockRecord => record.type === "7");
  const trailer = records.find((record) => record.type === "9");
  if (trailer?.type === "9" && trailer.counts.type7 !== clocks.length) issues.push({ severity: "ERROR", code: "RECORD_COUNT_MISMATCH", message: "Contagem do trailer diverge das marcações." });
  return issues;
}

export function validateSerializedAfd(bytes: Uint8Array) {
  const text = decodeLatin1(bytes);
  const issues: AfdValidationIssue[] = [];
  if (!text.endsWith("\r\n") || /(^|\r\n)\r\n/.test(text)) issues.push({ severity: "ERROR", code: "INVALID_LINE_ENDING", message: "Quebra de linha ou linha em branco inválida." });
  const lines = text.slice(0, -2).split("\r\n");
  if (lines[0]?.length !== 302) issues.push({ severity: "ERROR", code: "INVALID_HEADER_LENGTH", message: "Cabeçalho fora do tamanho oficial." });
  if (lines.at(-2)?.length !== 64) issues.push({ severity: "ERROR", code: "INVALID_TRAILER_LENGTH", message: "Trailer fora do tamanho oficial." });
  if (lines.at(-1)?.length !== 100) issues.push({ severity: "ERROR", code: "INVALID_SIGNATURE_LENGTH", message: "Registro de assinatura fora do tamanho oficial." });
  let previousHash = "";
  for (const line of lines.filter((item) => item[9] === "7")) {
    if (line.length !== 137) { issues.push({ severity: "ERROR", code: "INVALID_TYPE_7_LENGTH", message: "Registro tipo 7 fora do tamanho oficial." }); continue; }
    const fields = line.slice(0, 73); const hash = line.slice(73);
    const expected = chainedClockHash(fields, previousHash);
    if (hash !== expected) issues.push({ severity: "ERROR", code: "INVALID_TYPE_7_HASH", message: "Encadeamento SHA-256 inválido.", nsr: String(Number(line.slice(0, 9))) });
    previousHash = hash;
  }
  return issues;
}
