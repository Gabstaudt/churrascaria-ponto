import { date, index, integer, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { employees } from "./employees";
import { timeBankEntryTypeEnum } from "./enums";
import { users } from "./users";

export const timeBankPolicies = pgTable("time_bank_policies", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  effectiveFrom: date("effective_from", { mode: "string" }).notNull(),
  creditBasisPoints: integer("credit_basis_points").notNull().default(10000),
  debitBasisPoints: integer("debit_basis_points").notNull().default(10000),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("time_bank_policies_effective_unique").on(table.effectiveFrom), index("time_bank_policies_effective_idx").on(table.effectiveFrom)]);

export const timeBankEntries = pgTable("time_bank_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "restrict" }),
  referenceDate: date("reference_date", { mode: "string" }).notNull(),
  type: timeBankEntryTypeEnum("type").notNull(),
  amountMinutes: integer("amount_minutes").notNull(),
  calculatedDailyMinutes: integer("calculated_daily_minutes"),
  calculationVersion: varchar("calculation_version", { length: 50 }),
  sourceFingerprint: varchar("source_fingerprint", { length: 64 }),
  policyId: uuid("policy_id").references(() => timeBankPolicies.id, { onDelete: "restrict" }),
  reason: text("reason").notNull(),
  createdBy: uuid("created_by").notNull().references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("time_bank_entries_employee_date_idx").on(table.employeeId, table.referenceDate),
  index("time_bank_entries_created_idx").on(table.createdAt),
  uniqueIndex("time_bank_entries_source_unique").on(table.employeeId, table.referenceDate, table.sourceFingerprint),
]);
