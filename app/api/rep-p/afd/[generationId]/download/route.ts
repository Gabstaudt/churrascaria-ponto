import { downloadSignedAfd } from "@/modules/afd/services/afd-generation.service";
import { requireAfdPermission } from "@/modules/afd/services/afd-permission.service";
import { consumeRateLimit, rateLimitResponse } from "@/services/rate-limit.service";

export const runtime = "nodejs";
export async function GET(request: Request, context: RouteContext<"/api/rep-p/afd/[generationId]/download">) { const session = await requireAfdPermission("AFD_DOWNLOAD"); const limited = await consumeRateLimit(request, "afd-download", 12, 60, session.user.id); if (!limited.allowed) return rateLimitResponse(limited); const { generationId } = await context.params; try { const url = await downloadSignedAfd(generationId, session.user.id); return url ? Response.redirect(url, 302) : new Response("AFD oficial indisponível ou sem assinatura CAdES.", { status: 409 }); } catch { return new Response("A integridade do AFD não pôde ser confirmada.", { status: 409 }); } }
