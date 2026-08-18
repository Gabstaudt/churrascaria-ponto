"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { CertificateService } from "@/modules/digital-signatures/services/certificate.service";
import { requireSignaturePermission } from "@/modules/digital-signatures/services/signature-permission.service";
import { recordAudit } from "@/services/audit.service";

export async function disableCertificateAction(serialNumber: string, formData: FormData) {
  const session = await requireSignaturePermission("CERTIFICATE_ROTATE");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) redirect("/admin/rep-p/certificado?error=reason-required");
  await new CertificateService().disable(serialNumber);
  await recordAudit(db, { action: "CERTIFICATE_DISABLED", entity: "CERTIFICATE_METADATA", entityId: serialNumber, performedBy: session.user.id, reason });
  revalidatePath("/admin/rep-p/certificado");
}
