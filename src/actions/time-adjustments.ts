"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/auth/session";
import { createTimeAdjustment, InvalidOriginalEntryError } from "@/services/time-adjustment.service";
import { timeAdjustmentSchema } from "@/validations/time-adjustment";

export type TimeAdjustmentFormState = { message?: string; errors?: string[] };
export async function createTimeAdjustmentAction(_state: TimeAdjustmentFormState, formData: FormData): Promise<TimeAdjustmentFormState> {
  const session = await requireAdmin();
  const optional = (key: string) => String(formData.get(key) ?? "").trim() || undefined;
  const parsed = timeAdjustmentSchema.safeParse({ employeeId: formData.get("employeeId"), date: formData.get("date"), type: formData.get("type"), time: optional("time"), originalTimeEntryId: optional("originalTimeEntryId"), reason: formData.get("reason") });
  if (!parsed.success) return { message: "Revise os dados do tratamento.", errors: parsed.error.issues.map((issue) => issue.message) };
  try { await createTimeAdjustment(parsed.data, session.user.id); }
  catch (error) { if (error instanceof InvalidOriginalEntryError) return { message: error.message }; return { message: "Não foi possível registrar o tratamento." }; }
  redirect(`/admin/tratamentos?employeeId=${parsed.data.employeeId}&date=${parsed.data.date}&saved=1`);
}
