import { z } from "zod";

export const establishmentSchema = z.object({ name: z.string().trim().min(2).max(150), cnpj: z.string().transform((value) => value.replace(/\D/g, "")).pipe(z.string().length(14)), timezone: z.literal("America/Belem").default("America/Belem") }).strict();
export const repPEntryRequestSchema = z.object({ employeeId: z.uuid(), eventType: z.enum(["CLOCK_IN", "CLOCK_OUT"]) }).strict();
export const repPCollectorHeadersSchema = z.object({ collectorId: z.uuid(), authorization: z.string().regex(/^Bearer\s+\S+$/i), idempotencyKey: z.string().trim().min(16).max(100).regex(/^[A-Za-z0-9_-]+$/) });
