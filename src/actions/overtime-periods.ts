"use server";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/auth/session";
import { createScheduledOvertimePeriod, deleteScheduledOvertimePeriod } from "@/services/overtime-period.service";
import { ClosedPeriodError } from "@/services/period-lock.service";
import { overtimePeriodCreateSchema, overtimePeriodIdSchema } from "@/validations/overtime-period";

export async function createOvertimePeriodAction(formData: FormData) {
  const session = await requireAdmin();
  const employeeId = String(formData.get("employeeId") ?? "");
  const date = String(formData.get("date") ?? "");
  const parsed = overtimePeriodCreateSchema.safeParse({
    employeeId,
    date,
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) redirect(`/admin/escalas/ajuste?employeeId=${employeeId}&date=${date}&error=invalid`);
  try {
    await createScheduledOvertimePeriod(parsed.data, session.user.id);
  } catch (error) {
    redirect(`/admin/escalas/ajuste?employeeId=${employeeId}&date=${date}&error=${error instanceof ClosedPeriodError ? "closed" : "create"}`);
  }
  redirect(`/admin/escalas/ajuste?employeeId=${employeeId}&date=${date}&saved=overtime`);
}

export async function deleteOvertimePeriodAction(formData: FormData) {
  const session = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const employeeId = String(formData.get("employeeId") ?? "");
  const date = String(formData.get("date") ?? "");
  const parsedId = overtimePeriodIdSchema.safeParse(id);
  if (!parsedId.success) redirect(`/admin/escalas/ajuste?employeeId=${employeeId}&date=${date}&error=invalid`);
  try {
    await deleteScheduledOvertimePeriod(parsedId.data, session.user.id);
  } catch (error) {
    redirect(`/admin/escalas/ajuste?employeeId=${employeeId}&date=${date}&error=${error instanceof ClosedPeriodError ? "closed" : "delete"}`);
  }
  redirect(`/admin/escalas/ajuste?employeeId=${employeeId}&date=${date}&deleted=overtime`);
}
