import { date, index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { absenceDecisionEnum } from "./enums";
import { employees } from "./employees";
import { users } from "./users";

export const absences = pgTable("absences", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "restrict" }),
  date: date("date", { mode: "string" }).notNull(),
  decision: absenceDecisionEnum("decision").notNull(),
  decidedBy: uuid("decided_by").notNull().references(() => users.id, { onDelete: "restrict" }),
  decidedAt: timestamp("decided_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [uniqueIndex("absences_employee_date_unique").on(table.employeeId, table.date), index("absences_date_idx").on(table.date), index("absences_decision_idx").on(table.decision)]);

export const absenceJustifications = pgTable("absence_justifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  absenceId: uuid("absence_id").notNull().references(() => absences.id, { onDelete: "restrict" }),
  decision: absenceDecisionEnum("decision").notNull(),
  reason: text("reason").notNull(),
  approvedBy: uuid("approved_by").notNull().references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("absence_justifications_absence_idx").on(table.absenceId), index("absence_justifications_created_idx").on(table.createdAt)]);

export const employeeAbsenceAlerts = pgTable("employee_absence_alerts", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  date: date("date", { mode: "string" }).notNull(),
  notifiedAt: timestamp("notified_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("employee_absence_alerts_unique").on(table.employeeId, table.date)]);

export const employeeIncompletePunchAlerts = pgTable("employee_incomplete_punch_alerts", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  date: date("date", { mode: "string" }).notNull(),
  notifiedAt: timestamp("notified_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("employee_incomplete_punch_alerts_unique").on(table.employeeId, table.date)]);
