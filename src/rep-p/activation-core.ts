import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

export const ACTIVATION_TTL_MS = 10 * 60 * 1000;
export function generateActivationCode() { return randomInt(0, 1_000_000).toString().padStart(6, "0"); }
export function hashActivationCode(code: string, pepper: string) { return createHmac("sha256", pepper).update(`activation:${code}`).digest("hex"); }
export function activationCodeMatches(code: string, expectedHash: string, pepper: string) { const actual = Buffer.from(hashActivationCode(code, pepper), "hex"); const expected = Buffer.from(expectedHash, "hex"); return actual.length === expected.length && timingSafeEqual(actual, expected); }
export function activationIsUsable(input: { expiresAt: Date; usedAt: Date | null }, now = new Date()) { return input.usedAt === null && input.expiresAt.getTime() > now.getTime(); }
