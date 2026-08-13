import "server-only";

import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { absenceJustifications, absences, employees, users } from "@/db/schema";
import type { AbsenceDecisionInput } from "@/validations/absence";
import { recordAudit } from "./audit.service";
import { assertPeriodRangeMutable } from "./period-lock.service";

export async function decideAbsence(input: AbsenceDecisionInput, performedBy: string) {
  return db.transaction(async (tx) => {
    await assertPeriodRangeMutable(tx, input.date);
    const [current] = await tx.select().from(absences).where(and(eq(absences.employeeId, input.employeeId), eq(absences.date, input.date))).limit(1);
    const [absence] = current
      ? await tx.update(absences).set({ decision: input.decision, decidedBy: performedBy, decidedAt: new Date() }).where(eq(absences.id, current.id)).returning()
      : await tx.insert(absences).values({ employeeId: input.employeeId, date: input.date, decision: input.decision, decidedBy: performedBy }).returning();
    if (!absence) throw new Error("Não foi possível registrar a decisão.");
    const [justification] = await tx.insert(absenceJustifications).values({ absenceId: absence.id, decision: input.decision, reason: input.reason, approvedBy: performedBy }).returning();
    await recordAudit(tx, { action: current ? "UPDATE_ABSENCE_DECISION" : "DECIDE_ABSENCE", entity: "Absence", entityId: absence.id, performedBy, before: current ?? null, after: { absence, justification }, reason: input.reason });
    return absence;
  });
}

export async function listAbsenceDecisions(input: { employeeId?: string; start?: string; end?: string } = {}) {
  const conditions = [];
  if (input.employeeId) conditions.push(eq(absences.employeeId, input.employeeId));
  if (input.start) conditions.push(gte(absences.date, input.start));
  if (input.end) conditions.push(lte(absences.date, input.end));
  return db.select({ id: absences.id, employeeId: absences.employeeId, employeeName: employees.fullName, registrationNumber: employees.registrationNumber, position: employees.position, date: absences.date, decision: absences.decision, decidedAt: absences.decidedAt, decidedByName: users.name }).from(absences).innerJoin(employees, eq(employees.id, absences.employeeId)).innerJoin(users, eq(users.id, absences.decidedBy)).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(absences.date));
}

export async function getAbsenceHistory(employeeId: string, date: string) {
  const [absence] = await db.select().from(absences).where(and(eq(absences.employeeId, employeeId), eq(absences.date, date))).limit(1);
  if (!absence) return { absence: undefined, history: [] };
  const history = await db.select({ id: absenceJustifications.id, decision: absenceJustifications.decision, reason: absenceJustifications.reason, createdAt: absenceJustifications.createdAt, approvedByName: users.name }).from(absenceJustifications).innerJoin(users, eq(users.id, absenceJustifications.approvedBy)).where(eq(absenceJustifications.absenceId, absence.id)).orderBy(desc(absenceJustifications.createdAt));
  return { absence, history };
}

export async function listAbsenceDecisionsForDate(date: string) { return db.select().from(absences).where(eq(absences.date, date)); }
