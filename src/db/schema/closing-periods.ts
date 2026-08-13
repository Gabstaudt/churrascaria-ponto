import { date, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { closingPeriodEventEnum, closingPeriodStatusEnum } from "./enums";
import { employees } from "./employees";
import { users } from "./users";

export const closingPeriods = pgTable("closing_periods", {
  id: uuid("id").defaultRandom().primaryKey(),
  referenceMonth: varchar("reference_month", { length: 7 }).notNull().unique(),
  startDate: date("start_date", { mode: "string" }).notNull(),
  endDate: date("end_date", { mode: "string" }).notNull(),
  status: closingPeriodStatusEnum("status").notNull().default("OPEN"),
  currentRevision: integer("current_revision").notNull().default(0),
  createdBy: uuid("created_by").notNull().references(() => users.id, { onDelete: "restrict" }),
  reviewedBy: uuid("reviewed_by").references(() => users.id, { onDelete: "restrict" }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  closedBy: uuid("closed_by").references(() => users.id, { onDelete: "restrict" }),
  closedAt: timestamp("closed_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("closing_periods_status_idx").on(table.status), index("closing_periods_dates_idx").on(table.startDate, table.endDate)]);

export const closingPeriodEvents = pgTable("closing_period_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  periodId: uuid("period_id").notNull().references(() => closingPeriods.id, { onDelete: "restrict" }),
  event: closingPeriodEventEnum("event").notNull(),
  fromStatus: closingPeriodStatusEnum("from_status"),
  toStatus: closingPeriodStatusEnum("to_status").notNull(),
  reason: text("reason"),
  performedBy: uuid("performed_by").notNull().references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("closing_period_events_period_idx").on(table.periodId), index("closing_period_events_created_idx").on(table.createdAt)]);

export const closingPeriodSummaries = pgTable("closing_period_summaries", {
  id: uuid("id").defaultRandom().primaryKey(),
  periodId: uuid("period_id").notNull().references(() => closingPeriods.id, { onDelete: "restrict" }),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "restrict" }),
  revision: integer("revision").notNull(),
  plannedMinutes: integer("planned_minutes").notNull(),
  workedMinutes: integer("worked_minutes").notNull(),
  lateMinutes: integer("late_minutes").notNull(),
  earlyDepartureMinutes: integer("early_departure_minutes").notNull(),
  overtimeMinutes: integer("overtime_minutes").notNull(),
  absenceDays: integer("absence_days").notNull(),
  justifiedAbsenceDays: integer("justified_absence_days").notNull(),
  timeBankMinutes: integer("time_bank_minutes").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("closing_period_summaries_revision_unique").on(table.periodId, table.employeeId, table.revision), index("closing_period_summaries_period_idx").on(table.periodId, table.revision)]);
