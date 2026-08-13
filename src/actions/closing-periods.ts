"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/auth/session";
import { closeClosingPeriod, createClosingPeriod, reopenClosingPeriod, sendClosingPeriodToReview } from "@/services/closing-period.service";
import { closingPeriodIdSchema, closingReferenceMonthSchema, reopeningReasonSchema } from "@/validations/closing-period";

export async function createClosingPeriodAction(formData: FormData) {
  const session = await requireAdmin(); const parsed = closingReferenceMonthSchema.safeParse(formData.get("referenceMonth"));
  if (!parsed.success) redirect("/admin/fechamentos?error=month");
  let period; try { period = await createClosingPeriod(parsed.data, session.user.id); }
  catch { redirect("/admin/fechamentos?error=duplicate"); }
  redirect(`/admin/fechamentos/${period.id}?created=1`);
}
export async function sendClosingPeriodToReviewAction(id: string) {
  const session = await requireAdmin(); const parsed = closingPeriodIdSchema.safeParse(id); if (!parsed.success) redirect("/admin/fechamentos");
  try { await sendClosingPeriodToReview(parsed.data, session.user.id); } catch { redirect(`/admin/fechamentos/${parsed.data}?error=transition`); }
  redirect(`/admin/fechamentos/${parsed.data}?review=1`);
}
export async function closeClosingPeriodAction(id: string) {
  const session = await requireAdmin(); const parsed = closingPeriodIdSchema.safeParse(id); if (!parsed.success) redirect("/admin/fechamentos");
  try { await closeClosingPeriod(parsed.data, session.user.id); } catch { redirect(`/admin/fechamentos/${parsed.data}?error=blockers`); }
  redirect(`/admin/fechamentos/${parsed.data}?closed=1`);
}
export async function reopenClosingPeriodAction(id: string, formData: FormData) {
  const session = await requireAdmin(); const parsedId = closingPeriodIdSchema.safeParse(id); const parsedReason = reopeningReasonSchema.safeParse(formData.get("reason"));
  if (!parsedId.success) redirect("/admin/fechamentos"); if (!parsedReason.success) redirect(`/admin/fechamentos/${parsedId.data}?error=reason`);
  try { await reopenClosingPeriod(parsedId.data, parsedReason.data, session.user.id); } catch { redirect(`/admin/fechamentos/${parsedId.data}?error=transition`); }
  redirect(`/admin/fechamentos/${parsedId.data}?reopened=1`);
}
