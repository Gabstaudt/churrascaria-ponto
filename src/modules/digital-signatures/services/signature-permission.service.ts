import "server-only";
import { requireAdmin } from "@/auth/session";
export type SignaturePermission = "CERTIFICATE_VIEW_STATUS" | "CERTIFICATE_CONFIGURE" | "CERTIFICATE_ROTATE" | "SIGNATURE_VIEW" | "SIGNATURE_RETRY";
export async function requireSignaturePermission(_permission: SignaturePermission) { return requireAdmin(); }
