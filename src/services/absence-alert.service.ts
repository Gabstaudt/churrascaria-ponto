import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { employeeAbsenceAlerts, notifications, users } from "@/db/schema";
import { belemDate, CONFIRMED_ABSENCE_MINUTES, officialDateTime } from "./daily-attendance-core";
import { getDailyAttendance } from "./daily-attendance.service";

async function notifyAdmins(title: string, message: string, link: string) {
  const admins = await db.select({ id: users.id }).from(users).where(and(eq(users.role, "ADMIN"), eq(users.isActive, true)));
  if (admins.length) await db.insert(notifications).values(admins.map(({ id }) => ({ recipientUserId: id, title, message, link })));
}

export async function notifyLikelyAbsences(now = new Date()) {
  const date = belemDate(now);
  const report = await getDailyAttendance(date, now);
  let notified = 0;
  for (const row of report.rows) {
    if (row.status !== "POSSIBLE_ABSENCE" || !row.startTime) continue;
    const confirmedLimit = officialDateTime(date, row.startTime).getTime() + CONFIRMED_ABSENCE_MINUTES * 60_000;
    if (now.getTime() < confirmedLimit) continue;
    const [inserted] = await db.insert(employeeAbsenceAlerts).values({ employeeId: row.employee.id, date }).onConflictDoNothing({ target: [employeeAbsenceAlerts.employeeId, employeeAbsenceAlerts.date] }).returning({ id: employeeAbsenceAlerts.id });
    if (!inserted) continue;
    await notifyAdmins("Falta provável", `${row.employee.fullName} não bateu ponto até ${CONFIRMED_ABSENCE_MINUTES} minutos após o início previsto (${row.startTime.slice(0, 5)}) hoje.`, `/admin/faltas?date=${date}&employeeId=${row.employee.id}`);
    notified += 1;
  }
  return notified;
}
