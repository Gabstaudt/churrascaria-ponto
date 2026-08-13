import "server-only";

import { createHash } from "node:crypto";
import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { employees, timeBankEntries, timeBankPolicies, users } from "@/db/schema";
import { ATTENDANCE_CALCULATION_VERSION } from "./attendance-calculation";
import { getDailyAttendanceCalculation } from "./attendance.service";
import { recordAudit } from "./audit.service";
import { applyTimeBankPolicy, reconcileDailyBalance, timeBankConcurrencyKey } from "./time-bank-core";
import { assertPeriodRangeMutable } from "./period-lock.service";

type PeriodInput = { employeeId: string; startDate: string; endDate: string };
type ManualInput = { employeeId: string; date: string; amountMinutes: number; reason: string };
type PolicyInput = { name: string; effectiveFrom: string; creditPercent: number; debitPercent: number };

function datesBetween(start: string, end: string) { const result: string[] = []; const cursor = new Date(`${start}T00:00:00Z`); const last = new Date(`${end}T00:00:00Z`); while (cursor <= last) { result.push(cursor.toISOString().slice(0, 10)); cursor.setUTCDate(cursor.getUTCDate() + 1); } return result; }
async function policyForDate(date: string) {
  const [policy] = await db.select().from(timeBankPolicies).where(lte(timeBankPolicies.effectiveFrom, date)).orderBy(desc(timeBankPolicies.effectiveFrom)).limit(1);
  return policy ?? { id: null, name: "Padrão 100%", effectiveFrom: "0001-01-01", creditBasisPoints: 10000, debitBasisPoints: 10000, createdBy: null, createdAt: new Date(0) };
}
function fingerprint(attendance: NonNullable<Awaited<ReturnType<typeof getDailyAttendanceCalculation>>>, policy: Awaited<ReturnType<typeof policyForDate>>) {
  return createHash("sha256").update(JSON.stringify({ version: ATTENDANCE_CALCULATION_VERSION, schedule: attendance.schedule, entries: attendance.effectiveEntries.map((entry) => [entry.id, entry.occurredAt.toISOString()]), adjustments: attendance.adjustments.map((item) => [item.id, item.type, item.createdAt.toISOString()]), policy: [policy.id, policy.creditBasisPoints, policy.debitBasisPoints] })).digest("hex");
}

export async function processTimeBankPeriod(input: PeriodInput, performedBy: string) {
  const result = { processed: 0, unchanged: 0, pending: 0 };
  for (const date of datesBetween(input.startDate, input.endDate)) {
    const attendance = await getDailyAttendanceCalculation(input.employeeId, date);
    if (!attendance || attendance.calculation.status !== "COMPLETE" || attendance.calculation.balanceMinutes === null) { result.pending++; continue; }
    const policy = await policyForDate(date);
    const calculated = applyTimeBankPolicy(attendance.calculation.balanceMinutes, policy.creditBasisPoints, policy.debitBasisPoints);
    const sourceFingerprint = fingerprint(attendance, policy);
    const changed = await db.transaction(async (tx) => {
      await assertPeriodRangeMutable(tx, date);
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${timeBankConcurrencyKey(input.employeeId, date)}))`);
      const [sameSource] = await tx.select({ id: timeBankEntries.id }).from(timeBankEntries).where(and(eq(timeBankEntries.employeeId, input.employeeId), eq(timeBankEntries.referenceDate, date), eq(timeBankEntries.sourceFingerprint, sourceFingerprint))).limit(1);
      if (sameSource) return false;
      const [previous] = await tx.select({ calculatedDailyMinutes: timeBankEntries.calculatedDailyMinutes }).from(timeBankEntries).where(and(eq(timeBankEntries.employeeId, input.employeeId), eq(timeBankEntries.referenceDate, date), sql`${timeBankEntries.calculatedDailyMinutes} is not null`)).orderBy(desc(timeBankEntries.createdAt)).limit(1);
      const amountMinutes = reconcileDailyBalance(previous?.calculatedDailyMinutes ?? null, calculated);
      const [entry] = await tx.insert(timeBankEntries).values({ employeeId: input.employeeId, referenceDate: date, type: previous ? "RECALCULATION" : "DAILY_CALCULATION", amountMinutes, calculatedDailyMinutes: calculated, calculationVersion: ATTENDANCE_CALCULATION_VERSION, sourceFingerprint, policyId: policy.id, reason: previous ? "Recálculo após alteração das origens" : "Apuração diária processada", createdBy: performedBy }).returning();
      if (!entry) throw new Error("Não foi possível registrar o banco de horas.");
      await recordAudit(tx, { action: previous ? "RECALCULATE_TIME_BANK" : "CALCULATE_TIME_BANK", entity: "TimeBankEntry", entityId: entry.id, performedBy, after: { employeeId: entry.employeeId, referenceDate: entry.referenceDate, amountMinutes: entry.amountMinutes, calculatedDailyMinutes: entry.calculatedDailyMinutes, calculationVersion: entry.calculationVersion, policyId: entry.policyId }, reason: entry.reason });
      return true;
    });
    if (changed) result.processed++; else result.unchanged++;
  }
  return result;
}

export async function createManualTimeBankAdjustment(input: ManualInput, performedBy: string) {
  return db.transaction(async (tx) => {
    await assertPeriodRangeMutable(tx, input.date);
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${timeBankConcurrencyKey(input.employeeId, input.date)}))`);
    const [employee] = await tx.select({ id: employees.id }).from(employees).where(eq(employees.id, input.employeeId)).limit(1);
    if (!employee) return undefined;
    const [entry] = await tx.insert(timeBankEntries).values({ employeeId: input.employeeId, referenceDate: input.date, type: "MANUAL_ADJUSTMENT", amountMinutes: input.amountMinutes, reason: input.reason, createdBy: performedBy }).returning();
    if (!entry) throw new Error("Não foi possível registrar o ajuste.");
    await recordAudit(tx, { action: "ADJUST_TIME_BANK", entity: "TimeBankEntry", entityId: entry.id, performedBy, after: { employeeId: entry.employeeId, referenceDate: entry.referenceDate, amountMinutes: entry.amountMinutes, type: entry.type }, reason: input.reason });
    return entry;
  });
}

export async function createTimeBankPolicy(input: PolicyInput, performedBy: string) {
  return db.transaction(async (tx) => {
    const [policy] = await tx.insert(timeBankPolicies).values({ name: input.name, effectiveFrom: input.effectiveFrom, creditBasisPoints: input.creditPercent * 100, debitBasisPoints: input.debitPercent * 100, createdBy: performedBy }).returning();
    if (!policy) throw new Error("Não foi possível criar a política.");
    await recordAudit(tx, { action: "CREATE_TIME_BANK_POLICY", entity: "TimeBankPolicy", entityId: policy.id, performedBy, after: { name: policy.name, effectiveFrom: policy.effectiveFrom, creditBasisPoints: policy.creditBasisPoints, debitBasisPoints: policy.debitBasisPoints } });
    return policy;
  });
}

export async function listTimeBankEntries(input: { employeeId?: string; startDate?: string; endDate?: string } = {}) {
  const conditions = [];
  if (input.employeeId) conditions.push(eq(timeBankEntries.employeeId, input.employeeId));
  if (input.startDate) conditions.push(gte(timeBankEntries.referenceDate, input.startDate));
  if (input.endDate) conditions.push(lte(timeBankEntries.referenceDate, input.endDate));
  return db.select({ id: timeBankEntries.id, employeeId: timeBankEntries.employeeId, employeeName: employees.fullName, registrationNumber: employees.registrationNumber, referenceDate: timeBankEntries.referenceDate, type: timeBankEntries.type, amountMinutes: timeBankEntries.amountMinutes, calculatedDailyMinutes: timeBankEntries.calculatedDailyMinutes, calculationVersion: timeBankEntries.calculationVersion, reason: timeBankEntries.reason, createdByName: users.name, createdAt: timeBankEntries.createdAt }).from(timeBankEntries).innerJoin(employees, eq(employees.id, timeBankEntries.employeeId)).innerJoin(users, eq(users.id, timeBankEntries.createdBy)).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(timeBankEntries.referenceDate), desc(timeBankEntries.createdAt));
}

export async function listTimeBankPolicies() { return db.select().from(timeBankPolicies).orderBy(desc(timeBankPolicies.effectiveFrom)); }
export async function listTimeBankEmployees() { return db.select({ id: employees.id, fullName: employees.fullName, registrationNumber: employees.registrationNumber }).from(employees).orderBy(asc(employees.fullName)); }
export async function getTimeBankAccumulatedBalance(employeeId?: string) {
  const [row] = await db.select({ value: sql<number>`coalesce(sum(${timeBankEntries.amountMinutes}), 0)` }).from(timeBankEntries).where(employeeId ? eq(timeBankEntries.employeeId, employeeId) : undefined);
  return Number(row?.value ?? 0);
}
