import "server-only";

const productionRequired = ["DATABASE_URL", "BETTER_AUTH_SECRET", "BETTER_AUTH_URL", "R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET_NAME", "REP_CREDENTIAL_PEPPER"] as const;
export function validateRuntimeEnvironment() {
  if (process.env.NODE_ENV !== "production" || process.env.NEXT_PHASE === "phase-production-build") return;
  const missing = productionRequired.filter((name) => !process.env[name] || process.env[name]!.startsWith("replace-with"));
  if (missing.length) throw new Error(`Variáveis obrigatórias ausentes: ${missing.join(", ")}`);
  if ((process.env.BETTER_AUTH_SECRET?.length ?? 0) < 32) throw new Error("BETTER_AUTH_SECRET deve possuir pelo menos 32 caracteres.");
  if (!process.env.BETTER_AUTH_URL?.startsWith("https://")) throw new Error("BETTER_AUTH_URL deve usar HTTPS em produção.");
  if (!["staging", "production"].includes(process.env.APP_ENV ?? "production")) throw new Error("APP_ENV deve ser staging ou production no servidor.");
}
