import { X509Certificate } from "node:crypto";
import type { CertificatePublicInfo, CertificateStatus } from "../types";

export function certificateTemporalStatus(validFrom: Date, validUntil: Date, now = new Date()): CertificateStatus {
  if (now < validFrom) return "NOT_YET_VALID";
  if (now > validUntil) return "EXPIRED";
  return "VALID";
}

export function expirationAlertLevel(days: number) {
  if (days < 0) return "CRITICAL";
  if (days <= 7) return "CRITICAL";
  if (days <= 60) return "WARNING";
  return "OK";
}

export function publicCertificateInfo(pem: string, alias: string, certificateType: CertificatePublicInfo["certificateType"], now = new Date()): CertificatePublicInfo {
  const certificate = new X509Certificate(pem);
  const validFrom = new Date(certificate.validFrom);
  const validUntil = new Date(certificate.validTo);
  const keyType = certificate.publicKey.asymmetricKeyType;
  const supported = keyType === "rsa" || keyType === "ec";
  return { alias, certificateType, serialNumber: certificate.serialNumber, subject: certificate.subject, issuer: certificate.issuer, fingerprint: certificate.fingerprint256, validFrom, validUntil, status: supported ? certificateTemporalStatus(validFrom, validUntil, now) : "UNSUPPORTED", daysUntilExpiration: Math.ceil((validUntil.getTime() - now.getTime()) / 86_400_000) };
}
