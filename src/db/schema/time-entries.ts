import { index, jsonb, pgTable, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { employees } from "./employees";
import { timeEntrySourceEnum } from "./enums";
import { establishments, repCollectors, repRegistrars } from "./rep-p";

export const timeEntries = pgTable("time_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "restrict" }),
  occurredAt: timestamp("occurred_at", { withTimezone: true, mode: "date" }).notNull(),
  source: timeEntrySourceEnum("source").notNull(),
  externalId: varchar("external_id", { length: 150 }).notNull(),
  deviceIdentifier: varchar("device_identifier", { length: 150 }),
  establishmentId: uuid("establishment_id").references(() => establishments.id, { onDelete: "restrict" }),
  registrarId: uuid("registrar_id").references(() => repRegistrars.id, { onDelete: "restrict" }),
  collectorId: uuid("collector_id").references(() => repCollectors.id, { onDelete: "restrict" }),
  nsr: varchar("nsr", { length: 30 }),
    idempotencyKey: varchar("idempotency_key", { length: 100 }),
    locationValidationId: uuid("location_validation_id"),
    biometricValidationId: uuid("biometric_validation_id"),
    registrationAttemptId: uuid("registration_attempt_id"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  receivedAt: timestamp("received_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("time_entries_source_external_unique").on(table.source, table.externalId),
  index("time_entries_employee_occurred_idx").on(table.employeeId, table.occurredAt),
  index("time_entries_occurred_idx").on(table.occurredAt),
  uniqueIndex("time_entries_registrar_nsr_unique").on(table.registrarId, table.nsr),
  index("time_entries_establishment_idx").on(table.establishmentId, table.occurredAt),
  uniqueIndex("time_entries_collector_idempotency_unique").on(table.collectorId, table.idempotencyKey),
]);

export type TimeEntry = typeof timeEntries.$inferSelect;
