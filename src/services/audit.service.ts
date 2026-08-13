import "server-only";

import { and, asc, count, desc, eq, gte, lte, type SQL } from "drizzle-orm";
import { db, type Database } from "@/db";
import { auditLogs, users } from "@/db/schema";
import { redactAuditPayload } from "./audit-redaction";

type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
type AuditWriter = Database | Transaction;

export type AuditEvent = {
  action: string;
  entity: string;
  entityId: string;
  performedBy: string;
  before?: unknown;
  after?: unknown;
  reason?: string | null;
};

export async function recordAudit(writer: AuditWriter, event: AuditEvent) {
  return writer.insert(auditLogs).values({
    action: event.action,
    entity: event.entity,
    entityId: event.entityId,
    performedBy: event.performedBy,
    before: event.before == null ? null : redactAuditPayload(event.before) as Record<string, unknown>,
    after: event.after == null ? null : redactAuditPayload(event.after) as Record<string, unknown>,
    reason: event.reason ?? null,
  });
}

export type AuditFilters = {
  action?: string;
  entity?: string;
  performedBy?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
};

const PAGE_SIZE = 25;

export async function listAuditLogs(filters: AuditFilters = {}) {
  const conditions: SQL[] = [];
  if (filters.action) conditions.push(eq(auditLogs.action, filters.action));
  if (filters.entity) conditions.push(eq(auditLogs.entity, filters.entity));
  if (filters.performedBy) conditions.push(eq(auditLogs.performedBy, filters.performedBy));
  if (filters.startDate) conditions.push(gte(auditLogs.createdAt, new Date(`${filters.startDate}T00:00:00-03:00`)));
  if (filters.endDate) conditions.push(lte(auditLogs.createdAt, new Date(`${filters.endDate}T23:59:59.999-03:00`)));
  const where = conditions.length ? and(...conditions) : undefined;
  const requestedPage = Math.max(1, Math.floor(filters.page ?? 1));
  const [{ value: total = 0 } = { value: 0 }] = await db.select({ value: count() }).from(auditLogs).where(where);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);
  const items = await db.select({
    id: auditLogs.id, action: auditLogs.action, entity: auditLogs.entity,
    entityId: auditLogs.entityId, reason: auditLogs.reason,
    createdAt: auditLogs.createdAt, performedByName: users.name,
  }).from(auditLogs).innerJoin(users, eq(users.id, auditLogs.performedBy))
    .where(where).orderBy(desc(auditLogs.createdAt)).limit(PAGE_SIZE).offset((page - 1) * PAGE_SIZE);
  return { items, total, page, totalPages };
}

export async function getAuditLogById(id: string) {
  const [item] = await db.select({
    id: auditLogs.id, action: auditLogs.action, entity: auditLogs.entity,
    entityId: auditLogs.entityId, before: auditLogs.before, after: auditLogs.after,
    reason: auditLogs.reason, createdAt: auditLogs.createdAt,
    performedById: users.id, performedByName: users.name, performedByEmail: users.email,
  }).from(auditLogs).innerJoin(users, eq(users.id, auditLogs.performedBy))
    .where(eq(auditLogs.id, id)).limit(1);
  if (!item) return undefined;
  return { ...item, before: redactAuditPayload(item.before), after: redactAuditPayload(item.after) };
}

export async function listAuditFilterOptions() {
  const [actions, entities, responsible] = await Promise.all([
    db.selectDistinct({ value: auditLogs.action }).from(auditLogs).orderBy(asc(auditLogs.action)),
    db.selectDistinct({ value: auditLogs.entity }).from(auditLogs).orderBy(asc(auditLogs.entity)),
    db.selectDistinct({ id: users.id, name: users.name }).from(auditLogs)
      .innerJoin(users, eq(users.id, auditLogs.performedBy)).orderBy(asc(users.name)),
  ]);
  return { actions, entities, responsible };
}
