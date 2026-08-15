export type ReadinessCheck = { id: string; status: "PASS" | "FAIL" | "BLOCKED"; message: string; critical: boolean };
export type ReadinessInput = { migrationCount: number; expectedMigrationCount: number; activeAdmins: number; legalSettingsConfigured: boolean; officialExportsEnabled: boolean; activeRepAlerts: number; failedSyncsLast24h: number; backupEvidenceProvided: boolean; repAdapterReal: boolean };

export function evaluateReleaseReadiness(input: ReadinessInput): ReadinessCheck[] {
  return [
    { id: "migrations", status: input.migrationCount === input.expectedMigrationCount ? "PASS" : "FAIL", message: `${input.migrationCount}/${input.expectedMigrationCount} migrations registradas.`, critical: true },
    { id: "admin", status: input.activeAdmins > 0 ? "PASS" : "FAIL", message: `${input.activeAdmins} administrador(es) ativo(s).`, critical: true },
    { id: "legal-settings", status: input.legalSettingsConfigured ? "PASS" : "FAIL", message: input.legalSettingsConfigured ? "Configuração jurídica presente." : "Configuração jurídica ausente.", critical: true },
    { id: "official-documents", status: input.officialExportsEnabled ? "PASS" : "BLOCKED", message: input.officialExportsEnabled ? "Documentos oficiais liberados." : "Documentos oficiais aguardam conformidade e assinatura.", critical: true },
    { id: "rep-adapter", status: input.repAdapterReal ? "PASS" : "BLOCKED", message: input.repAdapterReal ? "Adapter físico configurado." : "Adapter físico e piloto em campo pendentes.", critical: true },
    { id: "rep-alerts", status: input.activeRepAlerts === 0 ? "PASS" : "FAIL", message: `${input.activeRepAlerts} alerta(s) REP ativo(s).`, critical: true },
    { id: "rep-failures", status: input.failedSyncsLast24h === 0 ? "PASS" : "FAIL", message: `${input.failedSyncsLast24h} sincronização(ões) com falha nas últimas 24h.`, critical: true },
    { id: "backup", status: input.backupEvidenceProvided ? "PASS" : "BLOCKED", message: input.backupEvidenceProvided ? "Evidência de restauração informada." : "Ensaio recente de restauração não confirmado.", critical: true },
  ];
}
export function releaseCanProceed(checks: ReadinessCheck[]) { return checks.every((check) => !check.critical || check.status === "PASS"); }
