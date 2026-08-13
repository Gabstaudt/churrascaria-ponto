import { date, index, integer, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { absences } from "./absences";
import { employees } from "./employees";
import { users } from "./users";

export const medicalCertificates = pgTable("medical_certificates", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "restrict" }),
  absenceId: uuid("absence_id").references(() => absences.id, { onDelete: "set null" }),
  startDate: date("start_date", { mode: "string" }).notNull(),
  endDate: date("end_date", { mode: "string" }).notNull(),
  description: varchar("description", { length: 300 }),
  fileKey: text("file_key").notNull().unique(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  contentType: varchar("content_type", { length: 100 }).notNull(),
  fileSize: integer("file_size").notNull(),
  uploadedBy: uuid("uploaded_by").notNull().references(() => users.id, { onDelete: "restrict" }),
  approvedBy: uuid("approved_by").notNull().references(() => users.id, { onDelete: "restrict" }),
  approvedAt: timestamp("approved_at", { withTimezone: true }).notNull().defaultNow(),
  retentionUntil: date("retention_until", { mode: "string" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("medical_certificates_employee_idx").on(table.employeeId), index("medical_certificates_absence_idx").on(table.absenceId), index("medical_certificates_period_idx").on(table.startDate, table.endDate)]);
