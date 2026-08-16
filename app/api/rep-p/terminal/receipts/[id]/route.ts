import { getPointReceiptForAccess, privateReceiptDownload } from "@/modules/point-receipts/services/point-receipt.service";
import { verifyTerminalReceiptToken } from "@/modules/point-receipts/services/terminal-receipt-token";
import { authenticateTerminal } from "@/services/terminal-auth.service";

export const runtime = "nodejs";

export async function GET(request: Request, context: RouteContext<"/api/rep-p/terminal/receipts/[id]">) {
  const collector = await authenticateTerminal();
  if (!collector) return new Response("Terminal não autorizado.", { status: 401 });
  const { id } = await context.params;
  const token = new URL(request.url).searchParams.get("token") ?? "";
  if (!verifyTerminalReceiptToken(token, id, collector.id)) return new Response("Acesso expirado ou inválido.", { status: 403 });
  const receipt = await getPointReceiptForAccess(id);
  if (!receipt || receipt.collectorId !== collector.id) return new Response("Comprovante não encontrado.", { status: 404 });
  try {
    const url = await privateReceiptDownload(id);
    return url ? Response.redirect(url, 302) : new Response("Comprovante em preparação.", { status: 409 });
  } catch {
    return new Response("A integridade do arquivo não pôde ser confirmada.", { status: 409 });
  }
}
