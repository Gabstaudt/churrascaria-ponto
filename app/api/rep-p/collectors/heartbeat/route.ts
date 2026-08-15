import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { repCollectors, securityEvents } from "@/db/schema";
import { recordRepPEvent } from "@/rep-p/audit.service";
import { authenticateTerminal } from "@/services/terminal-auth.service";
export const dynamic = "force-dynamic"; export const runtime = "nodejs";
const schema = z.object({ appVersion: z.string().regex(/^\d+\.\d+\.\d+$/), instanceId: z.uuid(), pendingOperationCount: z.number().int().min(0).max(10_000), offlineSince: z.iso.datetime().nullable().optional(), timeZone: z.string().max(80).optional() }).strict();
export async function POST(request: Request) {
  const authenticated = await authenticateTerminal(); if (!authenticated) return Response.json({ status: "INACTIVE", error: "COLLECTOR_UNAUTHORIZED" }, { status: 401 });
  const body = schema.safeParse(await request.json().catch(() => null)); if (!body.success) return Response.json({ error: "Heartbeat inválido." }, { status: 400 });
  const [collector] = await db.select().from(repCollectors).where(eq(repCollectors.id, authenticated.id)).limit(1); if (!collector) return Response.json({ status: "INACTIVE" }, { status: 401 });
  const now = new Date(); const previousInstance = collector.activeInstanceId; const simultaneousClone = previousInstance && previousInstance !== body.data.instanceId && collector.activeInstanceSeenAt && now.getTime() - collector.activeInstanceSeenAt.getTime() < 120_000;
  if (simultaneousClone) { await db.update(repCollectors).set({ status: "BLOCKED", updatedAt: now }).where(eq(repCollectors.id, collector.id)); await db.insert(securityEvents).values({ type: "DEVICE_CLONE", severity: "CRITICAL", collectorId: collector.id, metadataSafe: { previousInstance: previousInstance.slice(0, 8), currentInstance: body.data.instanceId.slice(0, 8) } }); await recordRepPEvent(db, { eventType: "COLLECTOR_BLOCKED", outcome: "REJECTED", collectorId: collector.id, reasonCode: "COLLECTOR_CREDENTIAL_SUSPECTED_CLONE" }); return Response.json({ status: "BLOCKED", error: "Possível clonagem detectada. Reative o terminal." }, { status: 403 }); }
  if (body.data.timeZone && body.data.timeZone !== "America/Belem") await db.insert(securityEvents).values({ type: "DEVICE_TIMEZONE_MISMATCH", severity: "INFO", collectorId: collector.id, metadataSafe: { reportedTimeZone: body.data.timeZone } });
  await db.update(repCollectors).set({ terminalVersion: body.data.appVersion, activeInstanceId: body.data.instanceId, activeInstanceSeenAt: now, pendingOperationCount: body.data.pendingOperationCount, offlineSince: body.data.offlineSince ? new Date(body.data.offlineSince) : null, updatedAt: now }).where(eq(repCollectors.id, collector.id));
  return Response.json({ collector: { id: collector.id, name: collector.name, status: collector.status, lastSeenAt: now, terminalVersion: body.data.appVersion, pendingOperationCount: body.data.pendingOperationCount, connection: "ONLINE" } }, { headers: { "Cache-Control": "no-store" } });
}
