import { db } from "@/db";
import { requireAdmin } from "@/auth/session";
import { recordAudit } from "@/services/audit.service";
import { generateOperationalReport, reportToCsv } from "@/services/report.service";
import { reportToPdf } from "@/services/report-pdf";
import { consumeRateLimit, rateLimitResponse } from "@/services/rate-limit.service";
import { log } from "@/services/logger";
import { reportFiltersSchema } from "@/validations/report";

export async function GET(request: Request, { params }: { params: Promise<{ format: string }> }) {
  const session = await requireAdmin(); const limited = await consumeRateLimit(request, "report-export", 12, 60, session.user.id); if (!limited.allowed) { log("warn", "rate_limit.blocked", { scope: "report-export", userId: session.user.id }); return rateLimitResponse(limited); } const { format } = await params; if (format !== "csv" && format !== "pdf") return new Response("Formato não suportado.", { status: 404 });
  const query = new URL(request.url).searchParams; const parsed = reportFiltersSchema.safeParse({ startDate: query.get("startDate"), endDate: query.get("endDate"), employeeId: query.get("employeeId") || undefined, status: query.get("status") || undefined }); if (!parsed.success) return new Response("Filtros inválidos.", { status: 400 });
  const report = await generateOperationalReport(parsed.data); const exportId = crypto.randomUUID(); await recordAudit(db, { action: "EXPORT_OPERATIONAL_REPORT", entity: "OperationalReport", entityId: exportId, performedBy: session.user.id, after: { format, filters: parsed.data, rowCount: report.rows.length, totals: report.totals }, reason: "Exportação de relatório operacional" });
  log("info", "report.exported", { exportId, userId: session.user.id, format, rowCount: report.rows.length });
  const filename = `espelho-ponto-${parsed.data.startDate}-${parsed.data.endDate}.${format}`;
  if (format === "csv") return new Response(reportToCsv(report), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${filename}"`, "Cache-Control": "private, no-store" } });
  return new Response(new Uint8Array(reportToPdf(report)), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${filename}"`, "Cache-Control": "private, no-store" } });
}
