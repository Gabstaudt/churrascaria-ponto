import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

async function main() {
  const [{ postgresClient }, { recoverPointReceipts }] = await Promise.all([import("../src/db/connection"), import("../src/modules/point-receipts/services/point-receipt.service")]);
  try { const results = await recoverPointReceipts(Number(process.env.RECEIPT_RECOVERY_LIMIT ?? 50)); console.info(JSON.stringify({ processed: results.length, statuses: results.map((item) => item?.status ?? "NOT_CREATED") }, null, 2)); }
  finally { await postgresClient.end(); }
}
main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : "Recuperação de comprovantes falhou."); process.exitCode = 1; });
