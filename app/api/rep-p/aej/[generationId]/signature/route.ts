import { downloadAejSignature } from "@/modules/digital-signatures/services/aej-signature.service";
import { requireAejPermission } from "@/modules/official-documents/services/aej-permission.service";
import { consumeRateLimit, rateLimitResponse } from "@/services/rate-limit.service";

export const runtime = "nodejs";
export async function GET(request: Request, context: RouteContext<"/api/rep-p/aej/[generationId]/signature">) {
  const session = await requireAejPermission("AEJ_DOWNLOAD");
  const limited = await consumeRateLimit(request, "aej-signature", 12, 60, session.user.id);
  if (!limited.allowed) return rateLimitResponse(limited);
  const { generationId } = await context.params;
  try { const url = await downloadAejSignature(generationId, session.user.id); return url ? Response.redirect(url, 302) : new Response("Assinatura indisponível.", { status: 409 }); }
  catch { return new Response("A integridade da assinatura não pôde ser confirmada.", { status: 409 }); }
}
