import { getSession } from "@/auth/session";
import { getMedicalCertificateDownload } from "@/services/medical-certificate.service";
import { managedEmployeeIds } from "@/services/portal.service";
import { consumeRateLimit, rateLimitResponse } from "@/services/rate-limit.service";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !session.user.isActive) return new Response("Não autorizado.", { status: 401 });
  const { id } = await params; const file = await getMedicalCertificateDownload(id);
  if (!file) return new Response("Atestado não encontrado.", { status: 404 });
  const allowed = session.user.role === "ADMIN" || (session.user.role === "EMPLOYEE" && session.user.employeeId === file.employeeId) || (session.user.role === "MANAGER" && (await managedEmployeeIds(session.user.id)).includes(file.employeeId));
  if (!allowed) return new Response("Acesso negado.", { status: 403 });
  const limited = await consumeRateLimit(request, "medical-certificate-download", 20, 60, session.user.id); if (!limited.allowed) return rateLimitResponse(limited);
  return Response.redirect(file.url, 307);
}
