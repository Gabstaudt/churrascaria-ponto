import { downloadAej } from "@/modules/official-documents/services/aej-generation.service";
import { requireAejPermission } from "@/modules/official-documents/services/aej-permission.service";
import { consumeRateLimit, rateLimitResponse } from "@/services/rate-limit.service";

export const runtime = "nodejs";
export async function GET(request: Request, context: RouteContext<"/api/rep-p/aej/[generationId]/download">) {
  const session = await requireAejPermission("AEJ_DOWNLOAD");
  const limited = await consumeRateLimit(request, "aej-download", 12, 60, session.user.id);
  if (!limited.allowed) return rateLimitResponse(limited);
  const { generationId } = await context.params;
  try { const url = await downloadAej(generationId, session.user.id); return url ? Response.redirect(url, 302) : new Response("AEJ oficial indisponível ou sem assinatura CAdES.", { status: 409 }); }
  catch { return new Response("A integridade do AEJ não pôde ser confirmada.", { status: 409 }); }
}
