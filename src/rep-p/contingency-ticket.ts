import { createHmac, timingSafeEqual } from "node:crypto";

export type ContingencyTicket = {
  version: 1;
  collectorId: string;
  employeeId: string;
  attemptId: string;
  locationValidationId: string;
  biometricValidationId: string;
  issuedAt: string;
  expiresAt: string;
};

function secret() {
  const value = process.env.CONTINGENCY_SIGNING_SECRET ?? process.env.BETTER_AUTH_SECRET;
  if (!value || value.length < 32) throw new Error("CONTINGENCY_SIGNING_SECRET deve possuir pelo menos 32 caracteres.");
  return value;
}

function encode(value: string) { return Buffer.from(value).toString("base64url"); }
function signature(payload: string) { return createHmac("sha256", secret()).update(payload).digest("base64url"); }

export function issueContingencyTicket(input: Omit<ContingencyTicket, "version" | "issuedAt" | "expiresAt">, now = new Date()) {
  const ticket: ContingencyTicket = { version: 1, ...input, issuedAt: now.toISOString(), expiresAt: new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString() };
  const payload = encode(JSON.stringify(ticket));
  return `${payload}.${signature(payload)}`;
}

export function verifyContingencyTicket(token: string, collectorId: string, now = new Date()): ContingencyTicket | undefined {
  const [payload, supplied, extra] = token.split(".");
  if (!payload || !supplied || extra) return undefined;
  const expected = signature(payload);
  const a = Buffer.from(supplied); const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return undefined;
  try {
    const ticket = JSON.parse(Buffer.from(payload, "base64url").toString()) as ContingencyTicket;
    if (ticket.version !== 1 || ticket.collectorId !== collectorId || new Date(ticket.expiresAt) <= now) return undefined;
    return ticket;
  } catch { return undefined; }
}
