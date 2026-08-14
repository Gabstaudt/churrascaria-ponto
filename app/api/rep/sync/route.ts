import { ZodError } from "zod";
import { log } from "@/services/logger";
import { consumeRateLimit, rateLimitResponse } from "@/services/rate-limit.service";
import { authenticateRepDevice, processRepBatch } from "@/services/rep.service";
import { MockREPAdapter } from "@/rep/mock-adapter";
import { repHeadersSchema } from "@/validations/rep";

export const dynamic = "force-dynamic"; export const runtime = "nodejs";
const MAX_BODY_BYTES = 1_000_000;
export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return Response.json({ error: "Content-Type deve ser application/json." }, { status: 415 });
  const headers = repHeadersSchema.safeParse({ deviceId: request.headers.get("x-rep-device-id"), requestId: request.headers.get("x-request-id"), authorization: request.headers.get("authorization") }); if (!headers.success) return Response.json({ error: "Cabeçalhos de autenticação inválidos." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  const token = headers.data.authorization.replace(/^Bearer\s+/i, ""); let device; try { device = await authenticateRepDevice(headers.data.deviceId, token); } catch (error) { log("error", "rep.authentication_configuration_failed", { error }); return Response.json({ error: "Sincronização indisponível." }, { status: 503 }); } if (!device) { log("warn", "rep.authentication_failed", { deviceId: headers.data.deviceId }); return Response.json({ error: "Dispositivo não autorizado." }, { status: 401, headers: { "Cache-Control": "no-store" } }); }
  const limited = await consumeRateLimit(request, "rep-sync", 30, 60, device.id); if (!limited.allowed) return rateLimitResponse(limited);
  const declaredLength = Number(request.headers.get("content-length") ?? 0); if (declaredLength > MAX_BODY_BYTES) return Response.json({ error: "Lote excede 1 MB." }, { status: 413 });
  try { const text = await request.text(); if (Buffer.byteLength(text, "utf8") > MAX_BODY_BYTES) return Response.json({ error: "Lote excede 1 MB." }, { status: 413 }); const payload: unknown = JSON.parse(text); if (device.adapter !== "MOCK") return Response.json({ error: "Adapter do dispositivo não está disponível nesta versão." }, { status: 422 }); const batch = new MockREPAdapter().parse(payload); const result = await processRepBatch(device, headers.data.requestId, batch); log("info", "rep.batch_processed", { deviceId: device.id, syncId: result.syncId, replay: result.replay, received: result.received, inserted: result.inserted, duplicates: result.duplicates, rejected: result.rejected }); return Response.json(result, { status: 200, headers: { "Cache-Control": "no-store" } }); } catch (error) { if (error instanceof SyntaxError || error instanceof ZodError) return Response.json({ error: "Payload mock inválido." }, { status: 400 }); log("error", "rep.batch_failed", { deviceId: device.id, requestId: headers.data.requestId, error }); return Response.json({ error: "Falha ao processar a sincronização." }, { status: 500 }); }
}
