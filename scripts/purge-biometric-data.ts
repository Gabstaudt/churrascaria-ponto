import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

async function main() {
  const [{ postgresClient }, { purgeExpiredBiometricData }] = await Promise.all([import("../src/db/connection"), import("../src/modules/biometrics/services/biometric-retention.service")]);
  try { const result = await purgeExpiredBiometricData(); console.info(JSON.stringify(result, null, 2)); }
  finally { await postgresClient.end(); }
}
main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : "Expurgo de dados biométricos falhou."); process.exitCode = 1; });
