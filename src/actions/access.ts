"use server";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/auth/session";
import { assignManagerEmployee, createPortalAccess } from "@/services/access.service";
import { managerScopeSchema, portalUserSchema } from "@/validations/access";

export async function createPortalAccessAction(formData: FormData) { const session = await requireAdmin(); const parsed = portalUserSchema.safeParse({ name: formData.get("name"), email: formData.get("email"), password: formData.get("password"), role: formData.get("role"), employeeId: formData.get("employeeId") || undefined }); if (!parsed.success) redirect("/admin/acessos?error=invalid"); try { await createPortalAccess(parsed.data, session.user.id); } catch { redirect("/admin/acessos?error=conflict"); } redirect("/admin/acessos?saved=user"); }
export async function assignManagerEmployeeAction(formData: FormData) { const session = await requireAdmin(); const parsed = managerScopeSchema.safeParse({ managerUserId: formData.get("managerUserId"), employeeId: formData.get("employeeId") }); if (!parsed.success) redirect("/admin/acessos?error=scope"); await assignManagerEmployee(parsed.data.managerUserId, parsed.data.employeeId, session.user.id); redirect("/admin/acessos?saved=scope"); }
