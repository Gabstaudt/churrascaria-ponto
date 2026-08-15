import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { legalSettings } from "@/db/schema";
import { aej } from "@/compliance/aej";

export async function getLegalSettings() { const [settings] = await db.select().from(legalSettings).where(eq(legalSettings.installationKey, "PRIMARY")).limit(1); return settings; }
export async function requireOfficialLegalSettings() { const settings = await getLegalSettings(); if (!settings) throw new Error("Configuração jurídica da instalação não cadastrada."); if (!settings.officialExportsEnabled || !settings.complianceReviewedAt) throw new Error("Emissão oficial bloqueada até validação de conformidade e assinatura CAdES."); return settings; }
export function legalAEJRecords(settings: typeof legalSettings.$inferSelect, initialDate: string, finalDate: string, generatedAt: string) { return [aej.header(settings.employerIdType === "CNPJ" ? "1" : "2", settings.employerId, settings.caepf ?? "", settings.cno ?? "", settings.employerName, initialDate, finalDate, generatedAt), aej.software(settings.ptrpName, settings.ptrpVersion, settings.developerIdType === "CNPJ" ? "1" : "2", settings.developerId, settings.developerName, settings.developerEmail)]; }
