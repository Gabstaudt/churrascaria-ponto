import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { repCollectors } from "@/db/schema";
import { verifyRepCredential } from "@/rep/credential";

function credentialPepper() { const value = process.env.REP_CREDENTIAL_PEPPER; if (!value || value.startsWith("replace-with") || value.length < 32) throw new Error("REP_CREDENTIAL_PEPPER não configurado com segurança."); return value; }
export async function authenticateRepPCollector(id: string, token: string) { const [collector] = await db.select({ id: repCollectors.id, credentialHash: repCollectors.credentialHash }).from(repCollectors).where(and(eq(repCollectors.id, id), eq(repCollectors.status, "ACTIVE"))).limit(1); if (!collector || !verifyRepCredential(token, collector.credentialHash, credentialPepper())) return undefined; await db.update(repCollectors).set({ lastSeenAt: new Date(), updatedAt: new Date() }).where(eq(repCollectors.id, id)); return { id: collector.id }; }
