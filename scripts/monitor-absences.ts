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
  const [{ notifyLikelyAbsences }, { postgresClient }] = await Promise.all([
    import("../src/services/absence-alert.service"),
    import("../src/db/connection"),
  ]);
  try {
    const count = await notifyLikelyAbsences();
    console.info(`Monitoramento concluído: ${count} falta(s) provável(is) notificada(s).`);
  } finally {
    await postgresClient.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Monitoramento de faltas falhou.");
  process.exitCode = 1;
});
