const REDACTED = "[OCULTO]";

const blockedKeys = [
  "password", "senha", "token", "secret", "segredo", "authorization",
  "cookie", "session", "hash", "credential", "apikey", "api_key",
];

function normalizedKey(key: string) {
  return key.toLowerCase().replace(/[^a-z0-9_]/g, "");
}

function maskCpf(value: unknown) {
  if (typeof value !== "string") return REDACTED;
  const digits = value.replace(/\D/g, "");
  return digits.length === 11 ? `***.***.***-${digits.slice(-2)}` : REDACTED;
}

export function redactAuditPayload(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(redactAuditPayload);
  if (typeof value !== "object") return value;

  return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => {
    const normalized = normalizedKey(key);
    if (normalized === "cpf" || normalized.endsWith("cpf")) return [key, maskCpf(item)];
    if (blockedKeys.some((blocked) => normalized.includes(blocked))) return [key, REDACTED];
    return [key, redactAuditPayload(item)];
  }));
}

export { REDACTED as AUDIT_REDACTED_VALUE };
