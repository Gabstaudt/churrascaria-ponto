import { db } from "@/db";
import { requireAdmin } from "@/auth/session";
import { recordAudit } from "@/services/audit.service";
import { log } from "@/services/logger";
import { consumeRateLimit, rateLimitResponse } from "@/services/rate-limit.service";
import { timeEntriesToCsv } from "@/services/report-core";
import { listTimeEntries } from "@/services/time-entry.service";

export async function GET(request: Request) {
  const session = await requireAdmin();
  const limited = await consumeRateLimit(request, "time-entries-export", 12, 60, session.user.id);
  if (!limited.allowed) { log("warn", "rate_limit.blocked", { scope: "time-entries-export", userId: session.user.id }); return rateLimitResponse(limited); }
  const query = new URL(request.url).searchParams;
  const employeeId = query.get("employeeId") || undefined;
  const date = query.get("date") || undefined;
  const source = query.get("source");
  const validSource = source === "SIMULATOR" || source === "IMPORT" || source === "REP_C" || source === "REP_P" ? source : undefined;
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) return new Response("Data inválida.", { status: 400 });
  const entries = await listTimeEntries({ employeeId, source: validSource, start: date ? new Date(`${date}T00:00:00-03:00`) : undefined, end: date ? new Date(`${date}T23:59:59.999-03:00`) : undefined });
  const exportId = crypto.randomUUID();
  await recordAudit(db, { action: "EXPORT_TIME_ENTRIES", entity: "TimeEntryExport", entityId: exportId, performedBy: session.user.id, after: { employeeId, date, source: validSource, rowCount: entries.length }, reason: "Exportação de marcações originais" });
  log("info", "time_entries.exported", { exportId, userId: session.user.id, rowCount: entries.length });
  const filename = `marcacoes${date ? `-${date}` : ""}.csv`;
  return new Response(timeEntriesToCsv(entries), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${filename}"`, "Cache-Control": "private, no-store" } });
}
