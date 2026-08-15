import { describe, expect, it } from "vitest";
import { evaluateReleaseReadiness, releaseCanProceed } from "./readiness";

const ready = { migrationCount: 18, expectedMigrationCount: 18, activeAdmins: 1, legalSettingsConfigured: true, officialExportsEnabled: true, activeRepAlerts: 0, failedSyncsLast24h: 0, backupEvidenceProvided: true, repAdapterReal: true };
describe("release readiness", () => {
  it("libera somente quando todos os gates críticos passam", () => expect(releaseCanProceed(evaluateReleaseReadiness(ready))).toBe(true));
  it("bloqueia migration divergente, documento não aprovado e ausência de piloto", () => { const checks = evaluateReleaseReadiness({ ...ready, migrationCount: 0, officialExportsEnabled: false, repAdapterReal: false }); expect(releaseCanProceed(checks)).toBe(false); expect(checks.filter(({ status }) => status !== "PASS").map(({ id }) => id)).toEqual(["migrations", "official-documents", "rep-adapter"]); });
});
