import type { generateOperationalReport } from "./report.service";
import { groupRowsByEmployee, reportStatusLabels } from "./report-core";

type Report = Awaited<ReturnType<typeof generateOperationalReport>>;
function ascii(value: string) { return value.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\x20-\x7E]/g, "?"); }
function pdfText(value: string) { return ascii(value).replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)"); }
function short(value: string, max: number) { const clean = ascii(value).replace(/\s+/g, " "); return clean.length > max ? `${clean.slice(0, max - 3)}...` : clean; }

export function reportToPdf(report: Report) {
  const total = report.totals;
  const groups = groupRowsByEmployee(report.rows);
  const lines: string[] = [];
  for (const group of groups) {
    lines.push(`>> ${short(group.employeeName, 40)} - ${group.registrationNumber}`);
    for (const row of group.rows) lines.push(`${row.date} | ${reportStatusLabels[row.status].padEnd(21)} | ${short(row.entries || "--", 22).padEnd(22)} | ${String(row.workedMinutes).padStart(5)} | ${String(row.lateMinutes).padStart(5)} | ${String(row.scheduledOvertimeMinutes).padStart(5)} | ${String(row.timeBankMinutes).padStart(5)}`);
    lines.push(`   Total do periodo: trab. ${group.totals.workedMinutes} min | atraso ${group.totals.lateMinutes} min | extra prog. ${group.totals.scheduledOvertimeMinutes} min | banco ${group.totals.timeBankMinutes} min`);
    lines.push("");
  }
  const chunks: string[][] = []; for (let index = 0; index < lines.length || index === 0; index += 36) chunks.push(lines.slice(index, index + 36));
  const objects = new Map<number, string>(); const pageIds: number[] = []; objects.set(1, "<< /Type /Catalog /Pages 2 0 R >>"); objects.set(3, "<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>");
  chunks.forEach((pageLines, pageIndex) => { const pageId = 4 + pageIndex * 2; const contentId = pageId + 1; pageIds.push(pageId); const headings = ["CHURRASCARIA - ESPELHO GERENCIAL DE PONTO (NAO OFICIAL)", `Periodo: ${report.filters.startDate} a ${report.filters.endDate}${report.filters.employeeId ? " | Funcionario filtrado" : " | Todos os funcionarios, separado por pessoa"}${report.filters.status ? ` | Status: ${reportStatusLabels[report.filters.status]}` : ""}`, `Totais gerais: previsto ${total.plannedMinutes} min | trabalhado ${total.workedMinutes} min | atraso ${total.lateMinutes} min | extra total ${total.overtimeMinutes} min | extra programada ${total.scheduledOvertimeMinutes} min | banco ${total.timeBankMinutes} min`, "Data       | Status                | Marcacoes              | Trab. | Atr.  | ExtProg | Banco", "---------------------------------------------------------------------------------------------------------------", ...pageLines, `Pagina ${pageIndex + 1} de ${chunks.length}`]; const commands = ["BT", "/F1 8 Tf", ...headings.map((line, index) => `1 0 0 1 28 ${565 - index * 13} Tm (${pdfText(line)}) Tj`), "ET"].join("\n"); objects.set(pageId, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`); objects.set(contentId, `<< /Length ${Buffer.byteLength(commands, "ascii")} >>\nstream\n${commands}\nendstream`); });
  objects.set(2, `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`);
  const maxId = Math.max(...objects.keys()); let pdf = "%PDF-1.4\n"; const offsets = [0]; for (let id = 1; id <= maxId; id++) { offsets[id] = Buffer.byteLength(pdf, "ascii"); pdf += `${id} 0 obj\n${objects.get(id) ?? "<< >>"}\nendobj\n`; } const xref = Buffer.byteLength(pdf, "ascii"); pdf += `xref\n0 ${maxId + 1}\n0000000000 65535 f \n`; for (let id = 1; id <= maxId; id++) pdf += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`; pdf += `trailer\n<< /Size ${maxId + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`; return Buffer.from(pdf, "ascii");
}
