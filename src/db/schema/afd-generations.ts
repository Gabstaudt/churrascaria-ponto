import { index, integer, jsonb, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { users } from "./users";
import { establishments, repRegistrars } from "./rep-p";

export const afdGenerations = pgTable("afd_generations", {
  id: uuid("id").defaultRandom().primaryKey(),
  registrarId: uuid("registrar_id").notNull().references(() => repRegistrars.id, { onDelete: "restrict" }),
  establishmentId: uuid("establishment_id").notNull().references(() => establishments.id, { onDelete: "restrict" }),
  startDate: varchar("start_date", { length: 10 }).notNull(),
  endDate: varchar("end_date", { length: 10 }).notNull(),
  layoutVersion: varchar("layout_version", { length: 40 }).notNull(),
  status: varchar("status", { length: 30 }).notNull().default("PENDING"),
  recordCount: integer("record_count").notNull().default(0),
  recordCountByType: jsonb("record_count_by_type").$type<Record<string, number>>().notNull().default({}),
  firstNsr: varchar("first_nsr", { length: 9 }),
  lastNsr: varchar("last_nsr", { length: 9 }),
  validationIssues: jsonb("validation_issues").$type<Array<{ severity: string; code: string; message: string; nsr?: string }>>().notNull().default([]),
  fileName: varchar("file_name", { length: 250 }),
  fileKey: varchar("file_key", { length: 500 }),
  fileHash: varchar("file_hash", { length: 64 }),
  signatureStatus: varchar("signature_status", { length: 20 }).notNull().default("PENDING"),
  signatureFileKey: varchar("signature_file_key", { length: 500 }),
  certificateIdentifier: varchar("certificate_identifier", { length: 200 }),
  signedAt: timestamp("signed_at", { withTimezone: true }),
  generatedBy: uuid("generated_by").notNull().references(() => users.id, { onDelete: "restrict" }),
  generatedAt: timestamp("generated_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("afd_generations_registrar_period_idx").on(table.registrarId, table.startDate, table.endDate),
  index("afd_generations_establishment_created_idx").on(table.establishmentId, table.createdAt),
  index("afd_generations_status_idx").on(table.status),
]);
