import { date, index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { employees } from "./employees";
import { dayOffSwapStatusEnum, leaveTypeEnum } from "./enums";
import { users } from "./users";

export const daysOff = pgTable("days_off", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "restrict" }),
  date: date("date", { mode: "string" }).notNull(),
  reason: text("reason").notNull(),
  authorizedBy: uuid("authorized_by").notNull().references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [uniqueIndex("days_off_employee_date_unique").on(table.employeeId, table.date), index("days_off_date_idx").on(table.date)]);

export const dayOffSwaps = pgTable("day_off_swaps", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "restrict" }),
  dayOffDate: date("day_off_date", { mode: "string" }).notNull(),
  workDate: date("work_date", { mode: "string" }).notNull(),
  reason: text("reason").notNull(),
  status: dayOffSwapStatusEnum("status").notNull().default("PENDING"),
  requestedBy: uuid("requested_by").notNull().references(() => users.id, { onDelete: "restrict" }),
  reviewedBy: uuid("reviewed_by").references(() => users.id, { onDelete: "restrict" }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewReason: text("review_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("day_off_swaps_employee_idx").on(table.employeeId), index("day_off_swaps_dates_idx").on(table.dayOffDate, table.workDate), index("day_off_swaps_status_idx").on(table.status)]);

export const vacations = pgTable("vacations", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "restrict" }),
  startDate: date("start_date", { mode: "string" }).notNull(),
  endDate: date("end_date", { mode: "string" }).notNull(),
  reason: text("reason").notNull(),
  authorizedBy: uuid("authorized_by").notNull().references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [index("vacations_employee_idx").on(table.employeeId), index("vacations_period_idx").on(table.startDate, table.endDate)]);

export const employeeVacationAlerts = pgTable("employee_vacation_alerts", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  acquisitiveDate: date("acquisitive_date", { mode: "string" }).notNull(),
  notifiedAt: timestamp("notified_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("employee_vacation_alerts_unique").on(table.employeeId, table.acquisitiveDate)]);

export const leavePeriods = pgTable("leave_periods", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "restrict" }),
  type: leaveTypeEnum("type").notNull(),
  startDate: date("start_date", { mode: "string" }).notNull(),
  endDate: date("end_date", { mode: "string" }).notNull(),
  reason: text("reason").notNull(),
  authorizedBy: uuid("authorized_by").notNull().references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [index("leave_periods_employee_idx").on(table.employeeId), index("leave_periods_period_idx").on(table.startDate, table.endDate)]);
