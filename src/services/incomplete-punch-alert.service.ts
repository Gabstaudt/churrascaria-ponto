import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { employeeIncompletePunchAlerts, notifications, users } from "@/db/schema";
import { belemDate, officialDateTime } from "./daily-attendance-core";
import { getDailyAttendance } from "./daily-attendance.service";

// Tempo de tolerância após o fim do turno previsto antes de considerar que as marcações
// do dia não virão mais e notificar. Evita alertar enquanto o funcionário ainda pode
// simplesmente estar batendo o ponto com um pequeno atraso.
const CHECK_AFTER_SHIFT_END_MINUTES = 30;

async function notifyAdmins(title: string, message: string, link: string) {
  const admins = await db.select({ id: users.id }).from(users).where(and(eq(users.role, "ADMIN"), eq(users.isActive, true)));
  if (admins.length) await db.insert(notifications).values(admins.map(({ id }) => ({ recipientUserId: id, title, message, link })));
}

export async function notifyIncompletePunches(now = new Date()) {
  const date = belemDate(now);
  const report = await getDailyAttendance(date, now);
  let notified = 0;
  for (const row of report.rows) {
    if (row.situation !== "WORK" || !row.startTime || !row.endTime) continue;
    const regularExpectedCount = row.breakStartTime && row.breakEndTime ? 4 : 2;
    const expectedCount = regularExpectedCount + row.overtimePeriods.length * 2;
    const lastEndTime = row.overtimePeriods.length ? row.overtimePeriods.reduce((latest, period) => (period.endTime > latest ? period.endTime : latest), row.endTime) : row.endTime;
    const checkFrom = officialDateTime(date, lastEndTime).getTime() + CHECK_AFTER_SHIFT_END_MINUTES * 60_000;
    if (now.getTime() < checkFrom) continue;
    if (row.originalEntries.length >= expectedCount) continue;
    const [inserted] = await db.insert(employeeIncompletePunchAlerts).values({ employeeId: row.employee.id, date }).onConflictDoNothing({ target: [employeeIncompletePunchAlerts.employeeId, employeeIncompletePunchAlerts.date] }).returning({ id: employeeIncompletePunchAlerts.id });
    if (!inserted) continue;
    await notifyAdmins("Marcações incompletas", `${row.employee.fullName} registrou ${row.originalEntries.length} de ${expectedCount} marcações previstas hoje.`, `/admin/marcacoes?date=${date}&employeeId=${row.employee.id}`);
    notified += 1;
  }
  return notified;
}
