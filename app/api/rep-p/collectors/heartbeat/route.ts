import { eq } from "drizzle-orm";
import { db } from "@/db";
import { repCollectors } from "@/db/schema";
import { authenticateTerminal } from "@/services/terminal-auth.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) { const authenticated = await authenticateTerminal(); if (!authenticated) return Response.json({ status: "INACTIVE", error: "Terminal não autorizado." }, { status: 401 }); const body = await request.json().catch(() => ({})) as { appVersion?: string }; if (body.appVersion && /^\d+\.\d+\.\d+$/.test(body.appVersion)) await db.update(repCollectors).set({ terminalVersion: body.appVersion, updatedAt: new Date() }).where(eq(repCollectors.id, authenticated.id)); const [collector] = await db.select({ id: repCollectors.id, name: repCollectors.name, status: repCollectors.status, lastSeenAt: repCollectors.lastSeenAt, terminalVersion: repCollectors.terminalVersion }).from(repCollectors).where(eq(repCollectors.id, authenticated.id)).limit(1); if (!collector) return Response.json({ status: "INACTIVE" }, { status: 401 }); return Response.json({ collector: { ...collector, connection: collector.status === "ACTIVE" ? "ONLINE" : collector.status } }, { headers: { "Cache-Control": "no-store" } }); }
