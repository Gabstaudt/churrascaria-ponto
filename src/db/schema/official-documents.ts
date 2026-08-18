import { index, integer, jsonb, pgTable, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { closingPeriods } from "./closing-periods";
import { establishments } from "./rep-p";
import { users } from "./users";

export const aejGenerations = pgTable("aej_generations", {
  id: uuid("id").defaultRandom().primaryKey(),
  establishmentId: uuid("establishment_id").notNull().references(() => establishments.id, { onDelete: "restrict" }),
  closingPeriodId: uuid("closing_period_id").notNull().references(() => closingPeriods.id, { onDelete: "restrict" }),
  revision: integer("revision").notNull(),
  startDate: varchar("start_date", { length: 10 }).notNull(),
  endDate: varchar("end_date", { length: 10 }).notNull(),
  layoutVersion: varchar("layout_version", { length: 40 }).notNull(),
  status: varchar("status", { length: 30 }).notNull().default("GENERATED"),
  fileName: varchar("file_name", { length: 250 }).notNull(),
  fileKey: varchar("file_key", { length: 500 }).notNull(),
  fileHash: varchar("file_hash", { length: 64 }).notNull(),
  signatureStatus: varchar("signature_status", { length: 30 }).notNull().default("PENDING"),
  signatureFileKey: varchar("signature_file_key", { length: 500 }),
  signatureHash: varchar("signature_hash", { length: 64 }),
  validationIssues: jsonb("validation_issues").$type<Array<{ severity: string; code: string; message: string }>>().notNull().default([]),
  generatedBy: uuid("generated_by").notNull().references(() => users.id, { onDelete: "restrict" }),
  generatedAt: timestamp("generated_at", { withTimezone: true }).notNull().defaultNow(),
  signedAt: timestamp("signed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("aej_generations_period_revision_unique").on(table.closingPeriodId, table.revision), index("aej_generations_status_idx").on(table.status)]);

export const pointMirrorGenerations = pgTable("point_mirror_generations", {
  id: uuid("id").defaultRandom().primaryKey(),
  closingPeriodId: uuid("closing_period_id").notNull().references(() => closingPeriods.id, { onDelete: "restrict" }),
  revision: integer("revision").notNull(),
  layoutVersion: varchar("layout_version", { length: 40 }).notNull(),
  documentKind: varchar("document_kind", { length: 40 }).notNull().default("OFFICIAL_POINT_MIRROR"),
  status: varchar("status", { length: 30 }).notNull().default("AVAILABLE"),
  fileKey: varchar("file_key", { length: 500 }).notNull(),
  fileHash: varchar("file_hash", { length: 64 }).notNull(),
  generatedBy: uuid("generated_by").notNull().references(() => users.id, { onDelete: "restrict" }),
  generatedAt: timestamp("generated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("point_mirror_period_revision_unique").on(table.closingPeriodId, table.revision), index("point_mirror_status_idx").on(table.status)]);
