import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

async function main() { const [{ monitorREPDevices }, { postgresClient }] = await Promise.all([import("../src/services/rep-pilot.service"), import("../src/db/connection")]); try { const minutes = Number(process.env.REP_STALLED_MINUTES ?? 30); if (!Number.isInteger(minutes) || minutes < 5) throw new Error("REP_STALLED_MINUTES deve ser um inteiro a partir de 5."); const count = await monitorREPDevices(minutes); console.info(`Monitoramento concluído para ${count} dispositivo(s).`); } finally { await postgresClient.end(); } }
main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : "Monitoramento REP falhou."); process.exitCode = 1; });
