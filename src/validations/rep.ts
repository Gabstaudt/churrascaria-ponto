import { z } from "zod";

export const repRecordSchema = z.object({ nsr: z.string().trim().regex(/^\d{1,20}$/, "NSR deve conter somente números."), employeeRegistration: z.string().trim().min(1).max(50), occurredAt: z.iso.datetime({ offset: true }), eventType: z.literal("CLOCK").default("CLOCK") }).strict();
export const mockRepBatchSchema = z.object({ version: z.literal("mock-v1"), records: z.array(repRecordSchema).min(1).max(500) }).strict();
export const pontoSyncBatchSchema = z.object({ version: z.literal("ponto-sync-v1"), sourceAdapter: z.string().trim().min(1).max(50), records: z.array(repRecordSchema).min(1).max(500) }).strict();
export const repHeadersSchema = z.object({ deviceId: z.uuid(), requestId: z.string().trim().min(8).max(100), authorization: z.string().regex(/^Bearer\s+\S+$/i) });
