"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/auth/session";
import { createTerminal, setCollectorStatus, TerminalDeviceConflictError } from "@/services/terminal-admin.service";
import { redirect } from "next/navigation";
import { issueCollectorActivation } from "@/services/rep-p-activation.service";
import { terminalCreateSchema } from "@/validations/rep-p";
export async function blockTerminalAction(formData: FormData) { await requireAdmin(); const id = String(formData.get("collectorId") ?? ""); if (id) await setCollectorStatus(id, "BLOCKED"); revalidatePath("/admin/terminais"); }
export async function reactivateTerminalAction(formData: FormData) { await requireAdmin(); const id = String(formData.get("collectorId") ?? ""); if (id) await setCollectorStatus(id, "ACTIVE"); revalidatePath("/admin/terminais"); }
export async function generateTerminalActivationAction(formData: FormData) { const session = await requireAdmin(); const id = String(formData.get("collectorId") ?? ""); if (!id) redirect("/admin/terminais?error=terminal"); const activation = await issueCollectorActivation(id, session.user.id); redirect(`/admin/terminais?activation=${activation.code}`); }
export async function createTerminalAction(formData: FormData) {
  const session = await requireAdmin();
  const parsed = terminalCreateSchema.safeParse({ name: formData.get("name"), deviceIdentifier: formData.get("deviceIdentifier") });
  if (!parsed.success) redirect("/admin/terminais?error=invalid");
  let collector;
  try { collector = await createTerminal(parsed.data); }
  catch (error) { redirect(`/admin/terminais?error=${error instanceof TerminalDeviceConflictError ? "device" : "create"}`); }
  const activation = await issueCollectorActivation(collector.id, session.user.id);
  redirect(`/admin/terminais?activation=${activation.code}`);
}
