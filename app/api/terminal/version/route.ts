const TERMINAL_VERSION = process.env.NEXT_PUBLIC_TERMINAL_VERSION ?? "1.0.0";
export function GET() { return Response.json({ version: TERMINAL_VERSION }, { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }); }
