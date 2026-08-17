import { describe, expect, it } from "vitest";
import { aej } from "@/compliance/aej";
import { generateAejArtifact } from "./aej.generator";
import { validateAejBytes } from "../validators/aej.validator";

describe("geração oficial do AEJ", () => {
  it("mantém mapeamento, trailer e marcador da assinatura destacada", () => {
    const artifact = generateAejArtifact({
      legalRecords: [aej.header("1", "16912959000133", "", "", "Churrascaria", "2026-07-01", "2026-07-31", "2026-08-16T10:00:00-0300"), aej.software("UpTime", "0.1.0", "2", "01951956206", "Gabriella", "gabi@example.com")],
      registrars: [{ id: "rep", inpiRegistration: "51202612345678901" }],
      employees: [{ id: "employee", cpf: "01951956206", name: "Gabriella", registrationNumber: "1", scheduleCode: "J1", scheduleMinutes: 480, schedulePairs: [["0800", "1200"], ["1300", "1700"]] }],
      entries: [{ employeeId: "employee", occurredAt: "2026-07-01T08:00:00-0300", registrarId: "rep", kind: "E", source: "O", scheduleCode: "J1" }, { employeeId: "employee", occurredAt: "2026-07-01T12:00:00-0300", registrarId: "rep", kind: "S", source: "O" }],
      bank: [{ employeeId: "employee", date: "2026-07-01", minutes: 30 }],
    });
    expect(validateAejBytes(artifact.bytes)).toEqual([]);
    expect(Buffer.from(artifact.bytes).toString("latin1")).toContain("02|1|3|51202612345678901");
  });
});
