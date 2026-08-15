import "server-only";
import { cookies } from "next/headers";
import { authenticateRepPCollector } from "@/services/rep-p-collector-auth.service";

export const TERMINAL_COLLECTOR_COOKIE = "uptime_collector_id";
export const TERMINAL_TOKEN_COOKIE = "uptime_collector_token";

export async function authenticateTerminal() { const store = await cookies(); const collectorId = store.get(TERMINAL_COLLECTOR_COOKIE)?.value; const token = store.get(TERMINAL_TOKEN_COOKIE)?.value; if (!collectorId || !token) return undefined; return authenticateRepPCollector(collectorId, token); }
