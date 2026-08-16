import { index, integer, pgTable, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";

export const certificateMetadata = pgTable("certificate_metadata", {
  id: uuid("id").defaultRandom().primaryKey(),
  alias: varchar("alias", { length: 100 }).notNull(),
  certificateType: varchar("certificate_type", { length: 20 }).notNull(),
  serialNumber: varchar("serial_number", { length: 200 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  issuer: varchar("issuer", { length: 500 }).notNull(),
  fingerprint: varchar("fingerprint", { length: 95 }).notNull(),
  validFrom: timestamp("valid_from", { withTimezone: true }).notNull(),
  validUntil: timestamp("valid_until", { withTimezone: true }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("ACTIVE"),
  activatedAt: timestamp("activated_at", { withTimezone: true }).notNull().defaultNow(),
  deactivatedAt: timestamp("deactivated_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("certificate_metadata_serial_unique").on(table.serialNumber), index("certificate_metadata_status_idx").on(table.status)]);

export const signatureOperations = pgTable("signature_operations", {
  id: uuid("id").defaultRandom().primaryKey(),
  documentType: varchar("document_type", { length: 30 }).notNull(),
  documentId: uuid("document_id").notNull(),
  signatureType: varchar("signature_type", { length: 10 }).notNull(),
  status: varchar("status", { length: 30 }).notNull().default("PENDING"),
  certificateSerialNumber: varchar("certificate_serial_number", { length: 200 }),
  certificateSubject: varchar("certificate_subject", { length: 500 }),
  inputHash: varchar("input_hash", { length: 64 }).notNull(),
  outputHash: varchar("output_hash", { length: 64 }),
  signatureFileKey: varchar("signature_file_key", { length: 500 }),
  provider: varchar("provider", { length: 100 }),
  implementationVersion: varchar("implementation_version", { length: 40 }).notNull(),
  softwareVersion: varchar("software_version", { length: 40 }).notNull(),
  retryCount: integer("retry_count").notNull().default(0),
  lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true }),
  nextRetryAt: timestamp("next_retry_at", { withTimezone: true }),
  lastErrorCode: varchar("last_error_code", { length: 80 }),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("signature_operations_idempotency_unique").on(table.documentType, table.documentId, table.signatureType, table.inputHash, table.certificateSerialNumber),
  index("signature_operations_document_idx").on(table.documentType, table.documentId),
  index("signature_operations_status_retry_idx").on(table.status, table.nextRetryAt),
]);
