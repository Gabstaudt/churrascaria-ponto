import { setTimeout as wait } from "node:timers/promises";
import { PontoSyncApiClient } from "../src/ponto-sync/api-client";
import { runPontoSyncCycle } from "../src/ponto-sync/agent";
import { loadPontoSyncConfig } from "../src/ponto-sync/config";
import { FixtureSourceAdapter } from "../src/ponto-sync/fixture-adapter";
import { FileStateStore } from "../src/ponto-sync/state-store";

const config = loadPontoSyncConfig();
if (!config.fixtureFile) throw new Error("PONTO_SYNC_FIXTURE_FILE é obrigatório enquanto o adapter do fabricante não estiver disponível.");
const adapter = new FixtureSourceAdapter(config.fixtureFile); const client = new PontoSyncApiClient(config); const store = new FileStateStore(config.stateFile);
const emit = (event: string, details: Record<string, unknown> = {}) => process.stdout.write(`${JSON.stringify({ timestamp: new Date().toISOString(), level: "info", component: "ponto-sync", event, ...details })}\n`);
let stopped = false; process.once("SIGTERM", () => { stopped = true; }); process.once("SIGINT", () => { stopped = true; }); emit("agent_started", { adapter: adapter.id });
while (!stopped) { try { await runPontoSyncCycle({ adapter, client, store, batchSize: config.batchSize, emit }); } catch (error) { emit("cycle_failed", { message: error instanceof Error ? error.message : "Falha desconhecida" }); } await wait(config.pollIntervalMs); }
emit("agent_stopped");
