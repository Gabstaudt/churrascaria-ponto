import { date, index, integer, pgTable, text, time, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { employees } from "./employees";
import { scheduleExceptionTypeEnum } from "./enums";
import { users } from "./users";

export const scheduleExceptions = pgTable("schedule_exceptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "restrict" }),
  date: date("date", { mode: "string" }).notNull(),
  type: scheduleExceptionTypeEnum("type").notNull(),
  startTime: time("start_time", { withTimezone: false }),
  endTime: time("end_time", { withTimezone: false }),
  breakStartTime: time("break_start_time", { withTimezone: false }),
  breakEndTime: time("break_end_time", { withTimezone: false }),
  toleranceMinutes: integer("tolerance_minutes").notNull().default(0),
  reason: text("reason").notNull(),
  createdBy: uuid("created_by").notNull().references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  uniqueIndex("schedule_exceptions_employee_date_unique").on(table.employeeId, table.date),
  index("schedule_exceptions_date_idx").on(table.date),
  index("schedule_exceptions_employee_idx").on(table.employeeId),
]);

export type ScheduleException = typeof scheduleExceptions.$inferSelect;

export const scheduledOvertimePeriods = pgTable("scheduled_overtime_periods", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  date: date("date", { mode: "string" }).notNull(),
  sequence: integer("sequence").notNull().default(0),
  startTime: time("start_time", { withTimezone: false }).notNull(),
  endTime: time("end_time", { withTimezone: false }).notNull(),
  toleranceMinutes: integer("tolerance_minutes").notNull().default(10),
  reason: text("reason").notNull(),
  createdBy: uuid("created_by").notNull().references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("scheduled_overtime_periods_employee_date_seq_unique").on(table.employeeId, table.date, table.sequence),
  index("scheduled_overtime_periods_date_idx").on(table.date),
]);

export type ScheduledOvertimePeriod = typeof scheduledOvertimePeriods.$inferSelect;
