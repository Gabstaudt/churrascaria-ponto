"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/auth/session";
import { createManualTimeBankAdjustment, createTimeBankPolicy, processTimeBankPeriod } from "@/services/time-bank.service";
import { timeBankManualAdjustmentSchema, timeBankPeriodSchema, timeBankPolicySchema } from "@/validations/time-bank";

export async function processTimeBankAction(formData: FormData) {
  const session = await requireAdmin();
  const parsed = timeBankPeriodSchema.safeParse({ employeeId: formData.get("employeeId"), startDate: formData.get("startDate"), endDate: formData.get("endDate") });
  if (!parsed.success) redirect("/admin/banco-horas?error=period");
  const result = await processTimeBankPeriod(parsed.data, session.user.id);
  redirect(`/admin/banco-horas?employeeId=${parsed.data.employeeId}&startDate=${parsed.data.startDate}&endDate=${parsed.data.endDate}&processed=${result.processed}&unchanged=${result.unchanged}&pending=${result.pending}`);
}

export async function createManualTimeBankAdjustmentAction(formData: FormData) {
  const session = await requireAdmin();
  const parsed = timeBankManualAdjustmentSchema.safeParse({ employeeId: formData.get("employeeId"), date: formData.get("date"), amountMinutes: formData.get("amountMinutes"), reason: formData.get("reason") });
  if (!parsed.success) redirect("/admin/banco-horas?error=adjustment");
  const saved = await createManualTimeBankAdjustment(parsed.data, session.user.id);
  if (!saved) redirect("/admin/banco-horas?error=employee");
  redirect(`/admin/banco-horas?employeeId=${parsed.data.employeeId}&saved=adjustment`);
}

export async function createTimeBankPolicyAction(formData: FormData) {
  const session = await requireAdmin();
  const parsed = timeBankPolicySchema.safeParse({ name: formData.get("name"), effectiveFrom: formData.get("effectiveFrom"), creditPercent: formData.get("creditPercent"), debitPercent: formData.get("debitPercent") });
  if (!parsed.success) redirect("/admin/banco-horas?error=policy");
  try { await createTimeBankPolicy(parsed.data, session.user.id); }
  catch { redirect("/admin/banco-horas?error=policy-conflict"); }
  redirect("/admin/banco-horas?saved=policy");
}
