import { boolean, date, index, integer, pgTable, time, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { employees } from "./employees";

export const workSchedules = pgTable("work_schedules", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "restrict" }),
  name: varchar("name", { length: 100 }).notNull(),
  validFrom: date("valid_from", { mode: "string" }).notNull(),
  validTo: date("valid_to", { mode: "string" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("work_schedules_employee_id_idx").on(table.employeeId), index("work_schedules_validity_idx").on(table.validFrom, table.validTo)]);

export const scheduleDays = pgTable("schedule_days", {
  id: uuid("id").defaultRandom().primaryKey(),
  workScheduleId: uuid("work_schedule_id").notNull().references(() => workSchedules.id, { onDelete: "cascade" }),
  dayOfWeek: integer("day_of_week").notNull(),
  isWorkDay: boolean("is_work_day").notNull().default(true),
  startTime: time("start_time", { withTimezone: false }),
  endTime: time("end_time", { withTimezone: false }),
  breakStartTime: time("break_start_time", { withTimezone: false }),
  breakEndTime: time("break_end_time", { withTimezone: false }),
  toleranceMinutes: integer("tolerance_minutes").notNull().default(0),
}, (table) => [uniqueIndex("schedule_days_schedule_weekday_unique").on(table.workScheduleId, table.dayOfWeek), index("schedule_days_schedule_id_idx").on(table.workScheduleId)]);

export type WorkSchedule = typeof workSchedules.$inferSelect;
export type ScheduleDay = typeof scheduleDays.$inferSelect;
