import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { employeeVacationAlerts, employees, notifications, users } from "@/db/schema";
import { belemDate } from "./daily-attendance-core";
import { isWithinAcquisitiveAlertWindow, nextAcquisitiveAnniversary } from "./vacation-acquisition-core";

function brDate(value: string) { return value.split("-").reverse().join("/"); }

async function notifyAdmins(title: string, message: string, link: string) {
  const admins = await db.select({ id: users.id }).from(users).where(and(eq(users.role, "ADMIN"), eq(users.isActive, true)));
  if (admins.length) await db.insert(notifications).values(admins.map(({ id }) => ({ recipientUserId: id, title, message, link })));
}

export async function notifyUpcomingVacationAcquisitions(daysAhead = 30, now = new Date()) {
  const today = belemDate(now);
  const active = await db.select({ id: employees.id, fullName: employees.fullName, admissionDate: employees.admissionDate }).from(employees).where(eq(employees.isActive, true));
  let notified = 0;
  for (const employee of active) {
    const acquisitiveDate = nextAcquisitiveAnniversary(employee.admissionDate, today);
    if (!isWithinAcquisitiveAlertWindow(acquisitiveDate, today, daysAhead)) continue;
    const [inserted] = await db.insert(employeeVacationAlerts).values({ employeeId: employee.id, acquisitiveDate }).onConflictDoNothing({ target: [employeeVacationAlerts.employeeId, employeeVacationAlerts.acquisitiveDate] }).returning({ id: employeeVacationAlerts.id });
    if (!inserted) continue;
    await notifyAdmins("Período aquisitivo de férias próximo", `${employee.fullName} completa o período aquisitivo de férias em ${brDate(acquisitiveDate)}.`, `/admin/funcionarios/${employee.id}?tab=availability`);
    notified += 1;
  }
  return notified;
}
