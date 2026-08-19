import "server-only";

import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { correctionRequests, dayOffSwaps, employees, managerEmployees, notifications, users } from "@/db/schema";
import { createAvailability } from "./availability.service";
import { reviewDayOffSwap } from "./availability.service";
import { getEmployeeAvailability } from "./availability.service";
import { getEmployeeById } from "./employee.service";
import { listMedicalCertificates } from "./medical-certificate.service";
import { createTimeAdjustment } from "./time-adjustment.service";
import { getTimeBankAccumulatedBalance, listTimeBankEntries } from "./time-bank.service";
import { listEmployeeTimeEntries } from "./time-entry.service";
import { listWorkSchedulesByEmployee } from "./work-schedule.service";

export async function notifyReviewers(employeeId: string, title: string, message: string, link: string) {
  const [admins, managers] = await Promise.all([db.select({ id: users.id }).from(users).where(and(eq(users.role, "ADMIN"), eq(users.isActive, true))), db.select({ id: managerEmployees.managerUserId }).from(managerEmployees).where(eq(managerEmployees.employeeId, employeeId))]);
  const ids = [...new Set([...admins.map((item) => item.id), ...managers.map((item) => item.id)])];
  if (ids.length) await db.insert(notifications).values(ids.map((recipientUserId) => ({ recipientUserId, title, message, link })));
}
export async function getEmployeePortalData(employeeId: string) {
  const [employee, schedules, availability, entries, bankEntries, bankBalance, certificates, requests] = await Promise.all([getEmployeeById(employeeId), listWorkSchedulesByEmployee(employeeId), getEmployeeAvailability(employeeId), listEmployeeTimeEntries(employeeId, 12), listTimeBankEntries({ employeeId }), getTimeBankAccumulatedBalance(employeeId), listMedicalCertificates({ employeeId }), db.select().from(correctionRequests).where(eq(correctionRequests.employeeId, employeeId)).orderBy(desc(correctionRequests.createdAt))]);
  return { employee, schedules, availability, entries, bankEntries: bankEntries.slice(0, 12), bankBalance, certificates, requests };
}
export async function createCorrectionRequest(employeeId: string, requestedBy: string, input: { date: string; type: "ADD_ENTRY" | "IGNORE_ENTRY" | "FORGOTTEN_EXIT" | "OTHER"; requestedTime?: string; reason: string }) {
  const [saved] = await db.insert(correctionRequests).values({ employeeId, requestedBy, ...input }).returning(); if (!saved) throw new Error("Não foi possível criar a solicitação.");
  await notifyReviewers(employeeId, "Nova solicitação de correção", `Correção de ponto solicitada para ${input.date}.`, "/gestao/solicitacoes"); return saved;
}
export async function createPortalSwapRequest(employeeId: string, requestedBy: string, input: { dayOffDate: string; workDate: string; reason: string }) { const saved = await createAvailability({ kind: "SWAP", employeeId, date: input.dayOffDate, workDate: input.workDate, reason: input.reason }, requestedBy); await notifyReviewers(employeeId, "Nova solicitação de troca", `Troca solicitada: ${input.dayOffDate} → ${input.workDate}.`, "/gestao/solicitacoes"); return saved; }
export async function managedEmployeeIds(managerUserId: string, isAdmin = false) { if (isAdmin) return (await db.select({ id: employees.id }).from(employees).where(eq(employees.isActive, true))).map((item) => item.id); return (await db.select({ id: managerEmployees.employeeId }).from(managerEmployees).where(eq(managerEmployees.managerUserId, managerUserId))).map((item) => item.id); }
export async function listManagerRequests(managerUserId: string, isAdmin = false) { const ids = await managedEmployeeIds(managerUserId, isAdmin); if (!ids.length) return []; return db.select({ id: correctionRequests.id, employeeId: correctionRequests.employeeId, employeeName: employees.fullName, date: correctionRequests.date, type: correctionRequests.type, requestedTime: correctionRequests.requestedTime, reason: correctionRequests.reason, status: correctionRequests.status, createdAt: correctionRequests.createdAt }).from(correctionRequests).innerJoin(employees, eq(employees.id, correctionRequests.employeeId)).where(inArray(correctionRequests.employeeId, ids)).orderBy(desc(correctionRequests.createdAt)); }
export async function listManagerSwaps(managerUserId: string, isAdmin = false) { const ids = await managedEmployeeIds(managerUserId, isAdmin); if (!ids.length) return []; return db.select({ id: dayOffSwaps.id, employeeId: dayOffSwaps.employeeId, employeeName: employees.fullName, dayOffDate: dayOffSwaps.dayOffDate, workDate: dayOffSwaps.workDate, reason: dayOffSwaps.reason, status: dayOffSwaps.status, requestedBy: dayOffSwaps.requestedBy }).from(dayOffSwaps).innerJoin(employees, eq(employees.id, dayOffSwaps.employeeId)).where(inArray(dayOffSwaps.employeeId, ids)).orderBy(desc(dayOffSwaps.createdAt)); }
export async function reviewManagerSwap(id: string, managerUserId: string, decision: "APPROVED" | "REJECTED", reason: string, isAdmin = false) { const scope = await managedEmployeeIds(managerUserId, isAdmin); const [current] = await db.select().from(dayOffSwaps).where(eq(dayOffSwaps.id, id)).limit(1); if (!current || !scope.includes(current.employeeId)) return undefined; const saved = await reviewDayOffSwap(id, decision, reason, managerUserId); if (saved) await db.insert(notifications).values({ recipientUserId: current.requestedBy, title: decision === "APPROVED" ? "Troca aprovada" : "Troca rejeitada", message: reason, link: "/portal/solicitacoes" }); return saved; }
export async function reviewCorrectionRequest(id: string, managerUserId: string, decision: "APPROVED" | "REJECTED", reason: string, isAdmin = false) {
  const scope = await managedEmployeeIds(managerUserId, isAdmin); const [current] = await db.select().from(correctionRequests).where(and(eq(correctionRequests.id, id), eq(correctionRequests.status, "PENDING"))).limit(1); if (!current || !scope.includes(current.employeeId)) return undefined;
  if (decision === "APPROVED" && (current.type === "ADD_ENTRY" || current.type === "FORGOTTEN_EXIT")) await createTimeAdjustment({ employeeId: current.employeeId, date: current.date, type: current.type, time: current.requestedTime ?? undefined, reason: `Solicitação aprovada: ${reason}` }, managerUserId);
  const [saved] = await db.update(correctionRequests).set({ status: decision, reviewedBy: managerUserId, reviewReason: reason, reviewedAt: new Date() }).where(eq(correctionRequests.id, id)).returning();
  await db.insert(notifications).values({ recipientUserId: current.requestedBy, title: decision === "APPROVED" ? "Correção aprovada" : "Correção rejeitada", message: reason, link: "/portal/solicitacoes" }); return saved;
}
export async function listNotifications(userId: string) { return db.select().from(notifications).where(eq(notifications.recipientUserId, userId)).orderBy(desc(notifications.createdAt)).limit(20); }
export async function notifyUser(recipientUserId: string, title: string, message: string, link = "/portal/solicitacoes") { return db.insert(notifications).values({ recipientUserId, title, message, link }); }
export async function markNotificationRead(id: string, userId: string) { return db.update(notifications).set({ readAt: new Date() }).where(and(eq(notifications.id, id), eq(notifications.recipientUserId, userId))); }
