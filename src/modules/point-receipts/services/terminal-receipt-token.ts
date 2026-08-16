import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

const TOKEN_TTL_SECONDS = 120;

function secret() {
  const value = process.env.RECEIPT_VERIFICATION_SECRET ?? process.env.BETTER_AUTH_SECRET;
  if (!value || value.length < 32) throw new Error("Segredo de comprovantes inválido.");
  return value;
}

function signature(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function issueTerminalReceiptToken(receiptId: string, collectorId: string, now = Date.now()) {
  const payload = Buffer.from(JSON.stringify({ receiptId, collectorId, expiresAt: Math.floor(now / 1000) + TOKEN_TTL_SECONDS })).toString("base64url");
  return `${payload}.${signature(payload)}`;
}

export function verifyTerminalReceiptToken(token: string, receiptId: string, collectorId: string, now = Date.now()) {
  const [payload, suppliedSignature] = token.split(".");
  if (!payload || !suppliedSignature) return false;
  const expected = signature(payload);
  if (expected.length !== suppliedSignature.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(suppliedSignature))) return false;
  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { receiptId: string; collectorId: string; expiresAt: number };
    return claims.receiptId === receiptId && claims.collectorId === collectorId && claims.expiresAt >= Math.floor(now / 1000);
  } catch {
    return false;
  }
}
