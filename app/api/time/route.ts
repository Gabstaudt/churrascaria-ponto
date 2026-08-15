export const dynamic = "force-dynamic";
export function GET() { const now = new Date(); return Response.json({ serverTime: now.toISOString(), epochMs: now.getTime() }, { headers: { "Cache-Control": "no-store" } }); }
