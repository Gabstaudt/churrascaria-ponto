import { index, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { employees } from "./employees";
import { users } from "./users";

export const employeeDocuments = pgTable("employee_documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "restrict" }),
  type: varchar("type", { length: 50 }).notNull(),
  title: varchar("title", { length: 150 }).notNull(),
  fileKey: text("file_key").notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  contentType: varchar("content_type", { length: 100 }).notNull(),
  uploadedBy: uuid("uploaded_by").notNull().references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("employee_documents_employee_id_idx").on(table.employeeId), index("employee_documents_type_idx").on(table.type)]);
