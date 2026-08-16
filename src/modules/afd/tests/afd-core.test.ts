import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { generateAfdArtifact } from "../generators/afd.generator";
import { crc16Kermit } from "../integrity/crc16-kermit";
import { encodeLatin1 } from "../serializers/latin1";
import type { AfdSource } from "../types";

function source(nsrs = [1, 2]): AfdSource {
  return {
    registrar: { id: "registrar", name: "REP-P Marituba", identifier: "REP-P-UPTIME", inpiRegistration: "51202612345678901", status: "ACTIVE", mode: "REP_P" },
    establishment: { id: "establishment", name: "Marituba", cnpj: "16912959000133", timezone: "America/Belem" },
    employer: { name: "CHURRASCARIA MARITUBA COMERCIO E SERVICOS LTDA", idType: "CNPJ", id: "16912959000133" },
    developer: { idType: "CPF", id: "01951956206" },
    entries: nsrs.map((nsr) => ({ type: "7", sourceId: `entry-${nsr}`, nsr, markedAt: new Date(`2026-08-0${nsr}T13:58:37Z`), recordedAt: new Date(`2026-08-0${nsr}T13:58:40Z`), employeeCpf: "01951956206", collectorType: "02", offline: false })),
  };
}

describe("núcleo AFD layout 004", () => {
  it("implementa o vetor oficial do CRC-16/KERMIT", () => expect(crc16Kermit(encodeLatin1("123456789"))).toBe("2189"));

  it("produz bytes determinísticos em ISO-8859-1 com CRLF e tipos oficiais", () => {
    const artifact = generateAfdArtifact(source(), "2026-08-01", "2026-08-31", new Date("2026-09-01T12:30:00Z"));
    const again = generateAfdArtifact(source(), "2026-08-01", "2026-08-31", new Date("2026-09-01T12:30:00Z"));
    expect(createHash("sha256").update(artifact.bytes).digest("hex")).toBe(createHash("sha256").update(again.bytes).digest("hex"));
    expect(artifact.records.map((record) => record.type)).toEqual(["1", "7", "7", "9", "SIGNATURE"]);
    expect(artifact.issues.filter((issue) => issue.severity === "ERROR")).toEqual([]);
  });

  it("ordena pelo NSR e detecta lacunas", () => {
    const mixed = source([4, 1, 2]);
    const artifact = generateAfdArtifact(mixed, "2026-08-01", "2026-08-31", new Date("2026-09-01T12:30:00Z"));
    expect(artifact.records.filter((record) => record.type === "7").map((record) => record.type === "7" && record.nsr)).toEqual([1, 2, 4]);
    expect(artifact.issues).toEqual(expect.arrayContaining([expect.objectContaining({ code: "MISSING_NSR", nsr: "3" })]));
  });

  it("bloqueia duplicidade e CPF inválido", () => {
    const invalid = source([1, 2, 2]); invalid.entries[0]!.employeeCpf = "11111111111";
    const artifact = generateAfdArtifact(invalid, "2026-08-01", "2026-08-31", new Date("2026-09-01T12:30:00Z"));
    expect(artifact.issues.map((issue) => issue.code)).toEqual(expect.arrayContaining(["DUPLICATE_NSR", "INVALID_EMPLOYEE_CPF"]));
  });

  it("mantém acentos válidos em ISO-8859-1", () => {
    const accented = source([1]); accented.employer.name = "João José D'Ávila";
    expect(() => generateAfdArtifact(accented, "2026-08-01", "2026-08-01", new Date("2026-08-02T12:30:00Z"))).not.toThrow();
  });
});
