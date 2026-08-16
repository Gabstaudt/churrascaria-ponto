import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

async function main() {
  const [{ postgresClient }, { reconcilePointReceipts }] = await Promise.all([import("../src/db/connection"), import("../src/modules/point-receipts/services/point-receipt-reconciliation.service")]);
  try { console.info(JSON.stringify(await reconcilePointReceipts(process.argv.includes("--repair"), Number(process.env.RECEIPT_RECONCILIATION_LIMIT ?? 100)), null, 2)); }
  finally { await postgresClient.end(); }
}
main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : "Conciliação de comprovantes falhou."); process.exitCode = 1; });
