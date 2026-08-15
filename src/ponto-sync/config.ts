import { z } from "zod";

const schema = z.object({
  apiUrl: z.url().refine((value) => value.startsWith("https://") || value.startsWith("http://localhost"), "Use HTTPS fora do localhost."),
  deviceId: z.uuid(),
  deviceToken: z.string().min(32),
  stateFile: z.string().min(1),
  fixtureFile: z.string().min(1).optional(),
  pollIntervalMs: z.coerce.number().int().min(1_000).max(3_600_000).default(15_000),
  batchSize: z.coerce.number().int().min(1).max(500).default(250),
});

export type PontoSyncConfig = z.infer<typeof schema>;

export function loadPontoSyncConfig(environment: NodeJS.ProcessEnv = process.env): PontoSyncConfig {
  return schema.parse({ apiUrl: environment.PONTO_SYNC_API_URL, deviceId: environment.PONTO_SYNC_DEVICE_ID, deviceToken: environment.PONTO_SYNC_DEVICE_TOKEN, stateFile: environment.PONTO_SYNC_STATE_FILE, fixtureFile: environment.PONTO_SYNC_FIXTURE_FILE, pollIntervalMs: environment.PONTO_SYNC_POLL_INTERVAL_MS, batchSize: environment.PONTO_SYNC_BATCH_SIZE });
}
