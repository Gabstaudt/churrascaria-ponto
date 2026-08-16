import { getAfdGeneration } from "@/modules/afd/services/afd-generation.service";
import { requireAfdPermission } from "@/modules/afd/services/afd-permission.service";

export const runtime = "nodejs";

export async function GET(_request: Request, context: RouteContext<"/api/rep-p/afd/[generationId]/signature">) {
  await requireAfdPermission("AFD_DOWNLOAD");
  const { generationId } = await context.params;
  const row = await getAfdGeneration(generationId);
  if (!row) return new Response("Geração não encontrada.", { status: 404 });
  return new Response("Assinatura CAdES ainda não disponível. Consolidação prevista na Sprint 32.", { status: 409 });
}
