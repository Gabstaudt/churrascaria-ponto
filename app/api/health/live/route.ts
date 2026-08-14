export const dynamic = "force-dynamic";
export function GET() { return Response.json({ status: "ok", service: "churrascaria-ponto", timestamp: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } }); }
