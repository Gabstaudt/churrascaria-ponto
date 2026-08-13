"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/auth/session";
import { AvailabilityConflictError, createAvailability, reviewDayOffSwap } from "@/services/availability.service";
import { availabilityCreateSchema, swapReviewSchema } from "@/validations/availability";

export type AvailabilityFormState = { message?: string; errors?: string[] };

export async function createAvailabilityAction(_state: AvailabilityFormState, formData: FormData): Promise<AvailabilityFormState> {
  const session = await requireAdmin();
  const optional = (key: string) => String(formData.get(key) ?? "").trim() || undefined;
  const parsed = availabilityCreateSchema.safeParse({ kind: formData.get("kind"), employeeId: formData.get("employeeId"), date: optional("date"), startDate: optional("startDate"), endDate: optional("endDate"), workDate: optional("workDate"), leaveType: optional("leaveType"), reason: formData.get("reason") });
  if (!parsed.success) return { message: "Revise os dados informados.", errors: parsed.error.issues.map((issue) => issue.message) };
  try { await createAvailability(parsed.data, session.user.id); redirect("/admin/disponibilidade?saved=1"); }
  catch (error) { if (error instanceof AvailabilityConflictError) return { message: error.message }; return { message: "Não foi possível salvar o registro." }; }
}

export async function reviewDayOffSwapAction(id: string, decision: "APPROVED" | "REJECTED", formData: FormData) {
  const session = await requireAdmin();
  const parsed = swapReviewSchema.safeParse({ id, decision, reason: formData.get("reason") });
  if (!parsed.success) redirect("/admin/disponibilidade?reviewError=1");
  try { await reviewDayOffSwap(parsed.data.id, parsed.data.decision, parsed.data.reason, session.user.id); redirect("/admin/disponibilidade?reviewed=1"); }
  catch { redirect("/admin/disponibilidade?reviewError=1"); }
}
