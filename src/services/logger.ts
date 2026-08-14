type Level = "debug" | "info" | "warn" | "error";
const weights: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };
function enabled(level: Level) { const configured = (process.env.LOG_LEVEL ?? "info") as Level; return weights[level] >= (weights[configured] ?? weights.info); }
function serialize(error: unknown) { return error instanceof Error ? { name: error.name, message: error.message, stack: process.env.NODE_ENV === "production" ? undefined : error.stack } : error; }
export function log(level: Level, event: string, context: Record<string, unknown> = {}) { if (!enabled(level)) return; const payload = JSON.stringify({ timestamp: new Date().toISOString(), level, event, environment: process.env.APP_ENV ?? process.env.NODE_ENV ?? "unknown", ...context, ...(context.error ? { error: serialize(context.error) } : {}) }); if (level === "error") console.error(payload); else if (level === "warn") console.warn(payload); else console.info(payload); }
