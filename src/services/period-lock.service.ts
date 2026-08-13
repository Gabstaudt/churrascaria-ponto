import "server-only";

import { and, asc, eq, gte, lte, sql } from "drizzle-orm";
import type { Database } from "@/db";
import { closingPeriods } from "@/db/schema";

type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
export class ClosedPeriodError extends Error { constructor() { super("A competência deste período está fechada. Reabra-a antes de alterar os dados."); this.name = "ClosedPeriodError"; } }

export async function assertPeriodRangeMutable(tx: Transaction, startDate: string, endDate = startDate) {
  const overlapping = await tx.select({ id: closingPeriods.id }).from(closingPeriods).where(and(lte(closingPeriods.startDate, endDate), gte(closingPeriods.endDate, startDate))).orderBy(asc(closingPeriods.id));
  for (const period of overlapping) await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`closing:${period.id}`}))`);
  if (!overlapping.length) return;
  const [closed] = await tx.select({ id: closingPeriods.id }).from(closingPeriods).where(and(eq(closingPeriods.status, "CLOSED"), lte(closingPeriods.startDate, endDate), gte(closingPeriods.endDate, startDate))).limit(1);
  if (closed) throw new ClosedPeriodError();
}
