import "server-only";

import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { pointReceipts, timeEntries } from "@/db/schema";
import { recordRepPEvent } from "@/rep-p/audit.service";
import { POINT_RECEIPT_FORMAT_VERSION } from "../types";
import { generatePointReceipt } from "./point-receipt.service";

export async function reconcilePointReceipts(repair = false, limit = 100) {
  const missing = await db.select({ id: timeEntries.id, employeeId: timeEntries.employeeId, collectorId: timeEntries.collectorId, nsr: timeEntries.nsr }).from(timeEntries).leftJoin(pointReceipts, and(eq(pointReceipts.timeEntryId, timeEntries.id), eq(pointReceipts.formatVersion, POINT_RECEIPT_FORMAT_VERSION))).where(and(eq(timeEntries.source, "REP_P"), isNull(pointReceipts.id))).limit(limit);
  for (const entry of missing) {
    await recordRepPEvent(db, { eventType: "MARKING_WITHOUT_RECEIPT", outcome: "REJECTED", collectorId: entry.collectorId ?? undefined, employeeId: entry.employeeId, nsr: entry.nsr ?? undefined, reasonCode: "MISSING_RECEIPT", metadata: { timeEntryId: entry.id, repair } });
    if (repair) await generatePointReceipt(entry.id);
  }
  return { missing: missing.length, repaired: repair ? missing.length : 0, truncated: missing.length === limit };
}
