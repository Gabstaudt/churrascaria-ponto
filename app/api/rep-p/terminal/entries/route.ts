import { z } from "zod";
import { registerRepPPoint } from "@/services/rep-p-registration.service";
import { authenticateTerminal } from "@/services/terminal-auth.service";
import { RepPRegistrationError } from "@/rep-p/registration-core";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { locationValidations, timeEntries } from "@/db/schema";

export const runtime = "nodejs";
const schema = z.object({ employeeId: z.uuid(), eventType: z.enum(["CLOCK_IN", "CLOCK_OUT"]), locationValidationId: z.uuid() }).strict();
const idempotencySchema = z.string().min(16).max(100).regex(/^[A-Za-z0-9_-]+$/);
export async function POST(request: Request) { const collector = await authenticateTerminal(); if (!collector) return Response.json({ error: "Terminal não autorizado." }, { status: 401 }); const input = schema.safeParse(await request.json().catch(() => null)); const idempotencyKey = idempotencySchema.safeParse(request.headers.get("idempotency-key")); if (!input.success || !idempotencyKey.success) return Response.json({ error: "Solicitação inválida." }, { status: 400 }); const [location] = await db.select({ id: locationValidations.id }).from(locationValidations).where(and(eq(locationValidations.id, input.data.locationValidationId), eq(locationValidations.collectorId, collector.id), eq(locationValidations.status, "VALID"), gt(locationValidations.validatedAt, new Date(Date.now() - 30_000)))).limit(1); if (!location) return Response.json({ error: "Localização inválida ou expirada.", code: "LOCATION_INVALID" }, { status: 422 }); try { const result = await registerRepPPoint({ employeeId: input.data.employeeId, eventType: input.data.eventType, collectorId: collector.id, idempotencyKey: idempotencyKey.data }); await db.update(timeEntries).set({ locationValidationId: location.id }).where(eq(timeEntries.id, result.id)); return Response.json(result, { status: result.replay ? 200 : 201, headers: { "Cache-Control": "no-store" } }); } catch (error) { if (error instanceof RepPRegistrationError) return Response.json({ error: error.message, code: error.code }, { status: 422 }); return Response.json({ error: "Não foi possível registrar o ponto." }, { status: 500 }); } }
