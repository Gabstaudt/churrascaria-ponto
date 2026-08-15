import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export function generateRepCredential() { const token = `rep_${randomBytes(32).toString("base64url")}`; return { token, prefix: token.slice(0, 12) }; }
export function hashRepCredential(token: string, pepper: string) { return createHmac("sha256", pepper).update(token).digest("hex"); }
export function verifyRepCredential(token: string, expectedHash: string, pepper: string) { const actual = Buffer.from(hashRepCredential(token, pepper), "hex"); const expected = Buffer.from(expectedHash, "hex"); return actual.length === expected.length && timingSafeEqual(actual, expected); }
