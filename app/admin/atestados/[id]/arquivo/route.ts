import { requireAdmin } from "@/auth/session";
import { getMedicalCertificateDownload } from "@/services/medical-certificate.service";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params; const url = await getMedicalCertificateDownload(id);
  if (!url) return new Response("Atestado não encontrado.", { status: 404 });
  return Response.redirect(url, 307);
}
