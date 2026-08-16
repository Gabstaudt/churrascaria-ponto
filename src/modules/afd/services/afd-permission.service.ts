import "server-only";
import { requireAdmin } from "@/auth/session";

export type AfdPermission = "AFD_VALIDATE" | "AFD_GENERATE" | "AFD_DOWNLOAD" | "AFD_VIEW_HISTORY";
export async function requireAfdPermission(_permission: AfdPermission) { return requireAdmin(); }
