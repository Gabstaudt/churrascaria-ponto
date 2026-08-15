"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/auth/session";
import { setCollectorStatus } from "@/services/terminal-admin.service";
import { redirect } from "next/navigation";
import { issueCollectorActivation } from "@/services/rep-p-activation.service";
export async function blockTerminalAction(formData: FormData) { await requireAdmin(); const id = String(formData.get("collectorId") ?? ""); if (id) await setCollectorStatus(id, "BLOCKED"); revalidatePath("/admin/terminais"); }
export async function reactivateTerminalAction(formData: FormData) { await requireAdmin(); const id = String(formData.get("collectorId") ?? ""); if (id) await setCollectorStatus(id, "ACTIVE"); revalidatePath("/admin/terminais"); }
export async function generateTerminalActivationAction(formData: FormData) { const session = await requireAdmin(); const id = String(formData.get("collectorId") ?? ""); if (!id) redirect("/admin/terminais?error=terminal"); const activation = await issueCollectorActivation(id, session.user.id); redirect(`/admin/terminais?activation=${activation.code}`); }
