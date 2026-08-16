import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { generateAfdArtifact } from "../generators/afd.generator";
import { reconcileAfd } from "../services/afd-reconciliation.service";
import type { AfdSource } from "../types";

const fixtureUrl = new URL("./fixtures/afd/", import.meta.url);
function fixtureSource(input: { markedAt: string; recordedAt: string }): AfdSource { return { registrar: { id: "r", name: "REP-P", identifier: "UPTIME", inpiRegistration: "51202612345678901", status: "ACTIVE", mode: "REP_P" }, establishment: { id: "e", name: "Marituba", cnpj: "16912959000133", timezone: "America/Belem" }, employer: { name: "CHURRASCARIA MARITUBA COMERCIO E SERVICOS LTDA", idType: "CNPJ", id: "16912959000133" }, developer: { idType: "CPF", id: "01951956206" }, entries: [{ type: "7", sourceId: "entry-1", nsr: 1, markedAt: new Date(input.markedAt), recordedAt: new Date(input.recordedAt), employeeCpf: "01951956206", collectorType: "02", offline: false }] }; }

describe("golden file e conciliação AFD", () => {
  it("compara o leiaute byte por byte com o arquivo de referência", async () => { const input = JSON.parse(await readFile(new URL("input.json", fixtureUrl), "utf8")); const expected = Buffer.from((await readFile(new URL("expected-afd.base64", fixtureUrl), "utf8")).trim(), "base64"); const artifact = generateAfdArtifact(fixtureSource(input), input.startDate, input.endDate, new Date(input.generatedAt)); expect(Buffer.from(artifact.bytes).equals(expected)).toBe(true); });
  it("detecta omissão, registro inesperado e divergência", () => { const source = fixtureSource({ markedAt: "2026-08-01T13:58:37Z", recordedAt: "2026-08-01T13:58:40Z" }); const artifact = generateAfdArtifact(source, "2026-08-01", "2026-08-01", new Date("2026-08-02T12:30:00Z")); expect(reconcileAfd(source, artifact).valid).toBe(true); const clock = artifact.records.find((record) => record.type === "7")!; if (clock.type === "7") clock.employeeCpf = "52998224725"; expect(reconcileAfd(source, artifact).divergent).toHaveLength(1); artifact.records = artifact.records.filter((record) => record.type !== "7"); expect(reconcileAfd(source, artifact).missing).toHaveLength(1); });
});
