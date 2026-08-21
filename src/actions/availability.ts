"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/auth/session";
import { AvailabilityConflictError, createAvailability, deleteAvailability, reviewDayOffSwap, updateAvailability } from "@/services/availability.service";
import { availabilityCreateSchema, availabilityIdSchema, type AvailabilityKind, swapReviewSchema } from "@/validations/availability";

export type AvailabilityFormState = { message?: string; errors?: string[] };

export async function createAvailabilityAction(_state: AvailabilityFormState, formData: FormData): Promise<AvailabilityFormState> {
  const session = await requireAdmin();
  const optional = (key: string) => String(formData.get(key) ?? "").trim() || undefined;
  const parsed = availabilityCreateSchema.safeParse({ kind: formData.get("kind"), employeeId: formData.get("employeeId"), date: optional("date"), startDate: optional("startDate"), endDate: optional("endDate"), workDate: optional("workDate"), leaveType: optional("leaveType"), reason: formData.get("reason"), timeBankDebitMinutes: optional("timeBankDebitMinutes") });
  if (!parsed.success) return { message: "Revise os dados informados.", errors: parsed.error.issues.map((issue) => issue.message) };
  try { await createAvailability(parsed.data, session.user.id); }
  catch (error) { if (error instanceof AvailabilityConflictError) return { message: error.message }; return { message: "Não foi possível salvar o registro." }; }
  redirect("/admin/disponibilidade?saved=1");
}

export async function updateAvailabilityAction(kind: AvailabilityKind, id: string, _state: AvailabilityFormState, formData: FormData): Promise<AvailabilityFormState> {
  const session = await requireAdmin();
  const parsedId = availabilityIdSchema.safeParse(id);
  if (!parsedId.success) return { message: "Registro inválido." };
  const optional = (key: string) => String(formData.get(key) ?? "").trim() || undefined;
  const parsed = availabilityCreateSchema.safeParse({ kind, employeeId: formData.get("employeeId"), date: optional("date"), startDate: optional("startDate"), endDate: optional("endDate"), workDate: optional("workDate"), leaveType: optional("leaveType"), reason: formData.get("reason") });
  if (!parsed.success) return { message: "Revise os dados informados.", errors: parsed.error.issues.map((issue) => issue.message) };
  let saved;
  try { saved = await updateAvailability(kind, parsedId.data, parsed.data, session.user.id); }
  catch (error) { if (error instanceof AvailabilityConflictError) return { message: error.message }; return { message: "Não foi possível atualizar o registro." }; }
  if (!saved) return { message: "Registro não encontrado ou não pode mais ser editado." };
  redirect("/admin/disponibilidade?saved=1");
}

export async function deleteAvailabilityAction(kind: AvailabilityKind, id: string) {
  const session = await requireAdmin();
  const parsedId = availabilityIdSchema.safeParse(id);
  if (!parsedId.success) redirect("/admin/disponibilidade?error=notfound");
  let deleted;
  try { deleted = await deleteAvailability(kind, parsedId.data, session.user.id); }
  catch { redirect("/admin/disponibilidade?error=delete"); }
  if (!deleted) redirect("/admin/disponibilidade?error=notfound");
  redirect("/admin/disponibilidade?deleted=1");
}

export async function reviewDayOffSwapAction(id: string, decision: "APPROVED" | "REJECTED", formData: FormData) {
  const session = await requireAdmin();
  const parsed = swapReviewSchema.safeParse({ id, decision, reason: formData.get("reason") });
  if (!parsed.success) redirect("/admin/disponibilidade?reviewError=1");
  try { await reviewDayOffSwap(parsed.data.id, parsed.data.decision, parsed.data.reason, session.user.id); }
  catch { redirect("/admin/disponibilidade?reviewError=1"); }
  redirect("/admin/disponibilidade?reviewed=1");
}
