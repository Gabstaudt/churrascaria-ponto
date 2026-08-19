import Module from "node:module";
import { loadEnvConfig } from "@next/env";

// "server-only" resolves via the "react-server" package export condition inside Next's
// bundler; a bare tsx/node invocation (as this script needs, to run from an external cron)
// doesn't set that condition, so requiring it directly throws. Redirect it to a no-op here,
// scoped to this script only — the guard has no purpose outside Next's build anyway.
const resolveFilename = (Module as unknown as { _resolveFilename: (request: string, ...rest: unknown[]) => string })._resolveFilename;
(Module as unknown as { _resolveFilename: (request: string, ...rest: unknown[]) => string })._resolveFilename = function (request: string, ...rest: unknown[]) {
  if (request === "server-only") return require.resolve("node:module");
  return resolveFilename.call(this, request, ...rest);
};

loadEnvConfig(process.cwd());

async function main() {
  const [{ notifyUpcomingVacationAcquisitions }, { postgresClient }] = await Promise.all([
    import("../src/services/vacation-acquisition.service"),
    import("../src/db/connection"),
  ]);
  try {
    const daysAhead = Number(process.env.VACATION_ALERT_DAYS_AHEAD ?? 30);
    if (!Number.isInteger(daysAhead) || daysAhead < 1) throw new Error("VACATION_ALERT_DAYS_AHEAD deve ser um inteiro positivo.");
    const count = await notifyUpcomingVacationAcquisitions(daysAhead);
    console.info(`Monitoramento concluído: ${count} funcionário(s) notificado(s) sobre período aquisitivo próximo.`);
  } finally {
    await postgresClient.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Monitoramento de período aquisitivo falhou.");
  process.exitCode = 1;
});
