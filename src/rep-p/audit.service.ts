import type { Database } from "@/db";
import { repPEvents } from "@/db/schema";
type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0]; type Writer = Database | Transaction;
export type RepPEventType = "REP_P_REGISTERED" | "REP_P_ENTRY_CREATED" | "REP_P_ENTRY_REJECTED" | "REP_P_COLLECTOR_AUTHORIZED" | "REP_P_COLLECTOR_BLOCKED" | "REP_P_NSR_ASSIGNED";
export async function recordRepPEvent(writer: Writer, event: { eventType: RepPEventType; outcome: "SUCCESS" | "REJECTED"; registrarId?: string; collectorId?: string; employeeId?: string; nsr?: string; reasonCode?: string; metadata?: Record<string, unknown>; occurredAt?: Date }) { await writer.insert(repPEvents).values({ ...event, occurredAt: event.occurredAt ?? new Date() }); }
