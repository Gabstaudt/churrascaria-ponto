"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/auth/session";
import { decideAbsence } from "@/services/absence.service";
import { absenceDecisionSchema } from "@/validations/absence";

export type AbsenceFormState = { message?: string; errors?: string[] };
export async function decideAbsenceAction(_state: AbsenceFormState, formData: FormData): Promise<AbsenceFormState> {
  const session = await requireAdmin();
  const parsed = absenceDecisionSchema.safeParse({ employeeId: formData.get("employeeId"), date: formData.get("date"), decision: formData.get("decision"), reason: formData.get("reason") });
  if (!parsed.success) return { message: "Revise os dados da decisão.", errors: parsed.error.issues.map((issue) => issue.message) };
  try { await decideAbsence(parsed.data, session.user.id); }
  catch { return { message: "Não foi possível registrar a decisão." }; }
  redirect(`/admin/faltas?employeeId=${parsed.data.employeeId}&date=${parsed.data.date}&saved=1`);
}
