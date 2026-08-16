export const SIGNATURE_IMPLEMENTATION_VERSION = "OPENSSL_3_CADES_PADES_V1" as const;
export type DocumentType = "AFD" | "AEJ" | "POINT_RECEIPT";
export type SignatureType = "CADES" | "PADES";
export type CertificateStatus = "VALID" | "EXPIRED" | "NOT_YET_VALID" | "INVALID" | "UNSUPPORTED" | "PRIVATE_KEY_UNAVAILABLE" | "DISABLED";
export type VerificationStatus = "VALID" | "INVALID" | "CERTIFICATE_EXPIRED" | "CERTIFICATE_NOT_YET_VALID" | "CERTIFICATE_NOT_TRUSTED" | "HASH_MISMATCH" | "SIGNATURE_MALFORMED";
export type CertificatePublicInfo = { alias: string; certificateType: "A1" | "A3" | "HSM" | "REMOTE"; serialNumber: string; subject: string; issuer: string; fingerprint: string; validFrom: Date; validUntil: Date; status: CertificateStatus; daysUntilExpiration: number };
export type CadesSignInput = { document: Uint8Array; documentId: string; documentType: "AFD" | "AEJ" };
export type PadesSignInput = { pdf: Uint8Array; documentId: string; documentType: "POINT_RECEIPT" };
export type CadesSignResult = { signature: Uint8Array; certificate: CertificatePublicInfo; provider: string };
export type PadesSignResult = { signedPdf: Uint8Array; certificate: CertificatePublicInfo; provider: string };
export type SignatureVerificationResult = { status: VerificationStatus; certificate?: CertificatePublicInfo; reasonCode?: string };
export interface DigitalSignatureProvider { signCades(input: CadesSignInput): Promise<CadesSignResult>; signPades(input: PadesSignInput): Promise<PadesSignResult>; verifyCades(document: Uint8Array, signature: Uint8Array): Promise<SignatureVerificationResult>; verifyPades(pdf: Uint8Array): Promise<SignatureVerificationResult>; certificateInfo(): Promise<CertificatePublicInfo>; }
export function expectedSignatureType(documentType: DocumentType): SignatureType { return documentType === "POINT_RECEIPT" ? "PADES" : "CADES"; }
export function assertSignatureMapping(documentType: DocumentType, signatureType: SignatureType) { if (expectedSignatureType(documentType) !== signatureType) throw new Error("INVALID_SIGNATURE_MAPPING"); }
