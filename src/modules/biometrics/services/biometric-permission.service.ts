import "server-only";
import { requireAdmin } from "@/auth/session";

export type BiometricPermission = "BIOMETRIC_ENROLL" | "BIOMETRIC_REVOKE" | "BIOMETRIC_REENROLL" | "BIOMETRIC_VIEW_STATUS" | "PRIVACY_ADMIN";
export async function requireBiometricPermission(_permission: BiometricPermission) { return requireAdmin(); }
