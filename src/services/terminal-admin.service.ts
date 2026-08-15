import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { repCollectors } from "@/db/schema";
import { recordRepPEvent } from "@/rep-p/audit.service";
export async function setCollectorStatus(collectorId: string, status: "ACTIVE" | "BLOCKED") { return db.transaction(async (tx) => { const [collector] = await tx.update(repCollectors).set({ status, activeInstanceId: status === "ACTIVE" ? null : undefined, activeInstanceSeenAt: status === "ACTIVE" ? null : undefined, updatedAt: new Date() }).where(eq(repCollectors.id, collectorId)).returning({ id: repCollectors.id, registrarId: repCollectors.registrarId }); if (collector) await recordRepPEvent(tx, { eventType: status === "BLOCKED" ? "COLLECTOR_BLOCKED" : "COLLECTOR_UNBLOCKED", outcome: "SUCCESS", collectorId: collector.id, registrarId: collector.registrarId }); return collector; }); }
