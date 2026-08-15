"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/auth/session";
import { setCollectorStatus } from "@/services/terminal-admin.service";
export async function blockTerminalAction(formData: FormData) { await requireAdmin(); const id = String(formData.get("collectorId") ?? ""); if (id) await setCollectorStatus(id, "BLOCKED"); revalidatePath("/admin/terminais"); }
export async function reactivateTerminalAction(formData: FormData) { await requireAdmin(); const id = String(formData.get("collectorId") ?? ""); if (id) await setCollectorStatus(id, "ACTIVE"); revalidatePath("/admin/terminais"); }
