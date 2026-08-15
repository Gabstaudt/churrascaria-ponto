import { eq } from "drizzle-orm";
import { db } from "@/db";
import { repCollectors } from "@/db/schema";
import { authenticateTerminal } from "@/services/terminal-auth.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() { const authenticated = await authenticateTerminal(); if (!authenticated) return Response.json({ status: "INACTIVE", error: "Terminal não autorizado." }, { status: 401 }); const [collector] = await db.select({ id: repCollectors.id, name: repCollectors.name, status: repCollectors.status, lastSeenAt: repCollectors.lastSeenAt }).from(repCollectors).where(eq(repCollectors.id, authenticated.id)).limit(1); if (!collector) return Response.json({ status: "INACTIVE" }, { status: 401 }); return Response.json({ collector: { ...collector, connection: collector.status === "ACTIVE" ? "ONLINE" : collector.status } }, { headers: { "Cache-Control": "no-store" } }); }
