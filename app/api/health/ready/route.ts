import { sql } from "drizzle-orm";
import { db } from "@/db";
import { log } from "@/services/logger";

export const dynamic = "force-dynamic";
export async function GET() { const started = performance.now(); try { await db.execute(sql`select 1 as ready`); return Response.json({ status: "ready", checks: { database: "ok", objectStorageConfigured: Boolean(process.env.R2_ACCOUNT_ID && process.env.R2_BUCKET_NAME) }, responseTimeMs: Math.round(performance.now() - started), timestamp: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } }); } catch (error) { log("error", "health.readiness_failed", { error }); return Response.json({ status: "unavailable", checks: { database: "error" }, timestamp: new Date().toISOString() }, { status: 503, headers: { "Cache-Control": "no-store" } }); } }
