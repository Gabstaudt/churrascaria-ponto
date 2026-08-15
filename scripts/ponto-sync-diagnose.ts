import { access } from "node:fs/promises";
import { constants } from "node:fs";
import { loadPontoSyncConfig } from "../src/ponto-sync/config";
import { FileStateStore } from "../src/ponto-sync/state-store";

async function main() {
  const config = loadPontoSyncConfig();
  if (config.fixtureFile) await access(config.fixtureFile, constants.R_OK);
  const state = await new FileStateStore(config.stateFile).read();
  const health = await fetch(new URL("/api/health/live", config.apiUrl), { signal: AbortSignal.timeout(10_000) });
  if (!health.ok) throw new Error(`API indisponível (HTTP ${health.status}).`);
  console.info(JSON.stringify({ status: "ok", apiReachable: true, adapter: config.fixtureFile ? "FIXTURE" : "NOT_CONFIGURED", queueLength: state.queue.length, lastConfirmedNsr: state.lastConfirmedNsr ?? null }));
}
main().catch((error: unknown) => { console.error(JSON.stringify({ status: "error", message: error instanceof Error ? error.message : "Diagnóstico falhou." })); process.exitCode = 1; });
