import "server-only";
import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { rateLimitBuckets } from "@/db/schema";
import { clientAddress, rateLimitDecision } from "./rate-limit-core";

export async function consumeRateLimit(request: Request, scope: string, limit: number, windowSeconds: number, subject?: string) { const now = new Date(); const boundary = new Date(now.getTime() - windowSeconds * 1000); const nowIso = now.toISOString(); const boundaryIso = boundary.toISOString(); const identity = subject ?? clientAddress(request.headers); const key = `${scope}:${createHash("sha256").update(identity).digest("hex")}`; const [bucket] = await db.insert(rateLimitBuckets).values({ key, windowStartedAt: now, count: 1, updatedAt: now }).onConflictDoUpdate({ target: rateLimitBuckets.key, set: { count: sql`case when ${rateLimitBuckets.windowStartedAt} <= ${boundaryIso} then 1 else ${rateLimitBuckets.count} + 1 end`, windowStartedAt: sql`case when ${rateLimitBuckets.windowStartedAt} <= ${boundaryIso} then ${nowIso} else ${rateLimitBuckets.windowStartedAt} end`, updatedAt: now } }).returning(); if (!bucket) throw new Error("Não foi possível verificar o limite de requisições."); return rateLimitDecision(bucket.count, limit, bucket.windowStartedAt, windowSeconds, now); }
export function rateLimitResponse(result: Awaited<ReturnType<typeof consumeRateLimit>>) { return new Response("Muitas solicitações. Aguarde antes de tentar novamente.", { status: 429, headers: { "Retry-After": String(result.retryAfterSeconds), "X-RateLimit-Remaining": String(result.remaining), "Cache-Control": "private, no-store" } }); }
