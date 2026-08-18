import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { certificateMetadata } from "@/db/schema";
import { expirationAlertLevel } from "../certificates/certificate-validator";
import { OpenSslDigitalSignatureProvider } from "../providers/openssl-digital-signature.provider";

export class CertificateService {
  constructor(private readonly provider = new OpenSslDigitalSignatureProvider()) {}
  async status() { try { const info = await this.provider.certificateInfo(); const [stored] = await db.insert(certificateMetadata).values({ alias: info.alias, certificateType: info.certificateType, serialNumber: info.serialNumber, subject: info.subject, issuer: info.issuer, fingerprint: info.fingerprint, validFrom: info.validFrom, validUntil: info.validUntil, status: "ACTIVE" }).onConflictDoUpdate({ target: certificateMetadata.serialNumber, set: { alias: info.alias, subject: info.subject, issuer: info.issuer, fingerprint: info.fingerprint, validFrom: info.validFrom, validUntil: info.validUntil } }).returning(); return { ...info, databaseStatus: stored?.status ?? "ACTIVE", alertLevel: expirationAlertLevel(info.daysUntilExpiration) }; } catch (error) { return { status: error instanceof Error ? error.message : "INVALID", alertLevel: "CRITICAL" as const }; } }
  async disable(serialNumber: string) { await db.update(certificateMetadata).set({ status: "DISABLED", deactivatedAt: new Date() }).where(eq(certificateMetadata.serialNumber, serialNumber)); }
}
