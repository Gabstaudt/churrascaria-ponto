import { z } from "zod";
import { activateCollector } from "@/services/rep-p-activation.service";

export const runtime = "nodejs";
const inputSchema = z.object({ code: z.string().regex(/^\d{6}$/) }).strict();
export async function POST(request: Request) { const parsed = inputSchema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return Response.json({ error: "Código inválido." }, { status: 400 }); const collector = await activateCollector(parsed.data.code); if (!collector) return Response.json({ error: "Código inválido, expirado ou já utilizado." }, { status: 422 }); const response = Response.json({ collector: { id: collector.id, name: collector.name } }); response.headers.append("Set-Cookie", `uptime_collector_id=${collector.id}; Path=/; HttpOnly; SameSite=Strict; Max-Age=31536000${process.env.NODE_ENV === "production" ? "; Secure" : ""}`); response.headers.append("Set-Cookie", `uptime_collector_token=${collector.token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=31536000${process.env.NODE_ENV === "production" ? "; Secure" : ""}`); return response; }
