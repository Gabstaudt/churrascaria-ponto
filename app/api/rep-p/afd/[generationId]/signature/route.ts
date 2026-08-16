import { downloadAfdSignature } from "@/modules/digital-signatures/services/afd-signature.service";
import { requireAfdPermission } from "@/modules/afd/services/afd-permission.service";

export const runtime = "nodejs";

export async function GET(_request: Request, context: RouteContext<"/api/rep-p/afd/[generationId]/signature">) {
  const session = await requireAfdPermission("AFD_DOWNLOAD");
  const { generationId } = await context.params;
  try { const url = await downloadAfdSignature(generationId, session.user.id); return url ? Response.redirect(url, 302) : new Response("Assinatura indisponível.", { status: 409 }); }
  catch { return new Response("A integridade da assinatura não pôde ser confirmada.", { status: 409 }); }
}
