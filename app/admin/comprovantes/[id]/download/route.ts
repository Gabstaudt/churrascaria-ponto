import { requireAdmin } from "@/auth/session";
import { getPointReceiptForAccess, privateReceiptDownload } from "@/modules/point-receipts/services/point-receipt.service";

export const runtime = "nodejs";

export async function GET(_request: Request, context: RouteContext<"/admin/comprovantes/[id]/download">) {
  await requireAdmin();
  const { id } = await context.params;
  const receipt = await getPointReceiptForAccess(id);
  if (!receipt) return new Response("Comprovante não encontrado.", { status: 404 });
  if (receipt.status !== "AVAILABLE") return new Response("Comprovante ainda indisponível.", { status: 409 });
  try {
    const url = await privateReceiptDownload(id);
    return url ? Response.redirect(url, 302) : new Response("Arquivo indisponível.", { status: 409 });
  } catch {
    return new Response("A integridade do arquivo não pôde ser confirmada.", { status: 409 });
  }
}
