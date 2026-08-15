import { z } from "zod";
import { registerRepPPoint } from "@/services/rep-p-registration.service";
import { authenticateTerminal } from "@/services/terminal-auth.service";
import { RepPRegistrationError } from "@/rep-p/registration-core";

export const runtime = "nodejs";
const schema = z.object({ employeeId: z.uuid(), eventType: z.enum(["CLOCK_IN", "CLOCK_OUT"]) }).strict();
const idempotencySchema = z.string().min(16).max(100).regex(/^[A-Za-z0-9_-]+$/);
export async function POST(request: Request) { const collector = await authenticateTerminal(); if (!collector) return Response.json({ error: "Terminal não autorizado." }, { status: 401 }); const input = schema.safeParse(await request.json().catch(() => null)); const idempotencyKey = idempotencySchema.safeParse(request.headers.get("idempotency-key")); if (!input.success || !idempotencyKey.success) return Response.json({ error: "Solicitação inválida." }, { status: 400 }); try { const result = await registerRepPPoint({ ...input.data, collectorId: collector.id, idempotencyKey: idempotencyKey.data }); return Response.json(result, { status: result.replay ? 200 : 201, headers: { "Cache-Control": "no-store" } }); } catch (error) { if (error instanceof RepPRegistrationError) return Response.json({ error: error.message, code: error.code }, { status: 422 }); return Response.json({ error: "Não foi possível registrar o ponto." }, { status: 500 }); } }
