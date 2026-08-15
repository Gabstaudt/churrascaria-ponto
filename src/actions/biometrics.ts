"use server";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/auth/session";
import { enrollEmployeeBiometric, revokeEmployeeBiometric } from "@/modules/biometrics/services/biometric.service";
export async function enrollBiometricAction(employeeId: string, formData: FormData) { const session = await requireAdmin(); const image = String(formData.get("image") ?? ""); if (!image.startsWith("data:image/jpeg;base64,") || image.length > 3_500_000 || formData.get("acknowledged") !== "on") redirect(`/admin/funcionarios/${employeeId}/biometria?error=invalid`); try { await enrollEmployeeBiometric({ employeeId, image: Buffer.from(image.split(",")[1], "base64"), performedBy: session.user.id, privacyNoticeVersion: "1.0", policyVersion: "1.0" }); } catch { redirect(`/admin/funcionarios/${employeeId}/biometria?error=capture`); } redirect(`/admin/funcionarios/${employeeId}/biometria?saved=1`); }
export async function revokeBiometricAction(employeeId: string) { await requireAdmin(); await revokeEmployeeBiometric(employeeId); redirect(`/admin/funcionarios/${employeeId}/biometria?revoked=1`); }
