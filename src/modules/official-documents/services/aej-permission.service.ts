import "server-only";
import { requireAdmin } from "@/auth/session";

export type AejPermission = "AEJ_GENERATE" | "AEJ_DOWNLOAD" | "AEJ_VIEW_HISTORY";
export async function requireAejPermission(_permission: AejPermission) { return requireAdmin(); }
