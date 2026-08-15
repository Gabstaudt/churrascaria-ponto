import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { employees, establishments, repCollectors, repConfigurations, repRegistrars, timeEntries } from "@/db/schema";
import { nextRepPNsr } from "@/rep-p/nsr.service";
import { officialRecordedAt, type OfficialClock, systemOfficialClock } from "@/rep-p/official-clock.service";
import { assertRepPRegistrationContext, RepPRegistrationError } from "@/rep-p/registration-core";

export type RegisterRepPPointInput = { employeeId: string; collectorId: string; eventType: "CLOCK_IN" | "CLOCK_OUT" };

export async function registerRepPPoint(input: RegisterRepPPointInput, clock: OfficialClock = systemOfficialClock) {
  const [context] = await db.select({ collectorId: repCollectors.id, collectorStatus: repCollectors.status, deviceIdentifier: repCollectors.deviceIdentifier, registrarId: repRegistrars.id, registrarStatus: repRegistrars.status, registrarMode: repRegistrars.mode, establishmentId: establishments.id, establishmentActive: establishments.isActive, timezone: establishments.timezone, registrationEnabled: repConfigurations.registrationEnabled }).from(repCollectors).innerJoin(repRegistrars, eq(repRegistrars.id, repCollectors.registrarId)).innerJoin(establishments, eq(establishments.id, repRegistrars.establishmentId)).innerJoin(repConfigurations, eq(repConfigurations.registrarId, repRegistrars.id)).where(eq(repCollectors.id, input.collectorId)).limit(1);
  if (!context) throw new RepPRegistrationError("COLLECTOR_NOT_FOUND", "Coletor não encontrado.");
  const [employee] = await db.select({ id: employees.id, isActive: employees.isActive, status: employees.status }).from(employees).where(eq(employees.id, input.employeeId)).limit(1);
  if (!employee) throw new RepPRegistrationError("EMPLOYEE_NOT_FOUND", "Funcionário não encontrado.");
  assertRepPRegistrationContext({ ...context, employeeActive: employee.isActive, employeeStatus: employee.status });
  const occurredAt = officialRecordedAt(clock);
  return db.transaction(async (tx) => { const nsr = await nextRepPNsr(tx, context.establishmentId); const [entry] = await tx.insert(timeEntries).values({ employeeId: employee.id, occurredAt, source: "REP_P", externalId: `rep-p:${context.registrarId}:${nsr}`, deviceIdentifier: context.deviceIdentifier, establishmentId: context.establishmentId, registrarId: context.registrarId, collectorId: context.collectorId, nsr, metadata: { eventType: input.eventType, timezone: context.timezone, original: true } }).returning(); if (!entry) throw new Error("Marcação REP-P não foi criada."); return { id: entry.id, employeeId: employee.id, establishmentId: context.establishmentId, registrarId: context.registrarId, collectorId: context.collectorId, nsr, recordedAt: entry.occurredAt, eventType: input.eventType }; });
}
