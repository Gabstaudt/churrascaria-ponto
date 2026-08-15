import { describe, expect, it } from "vitest";
import { establishmentSchema, repPEntryRequestSchema } from "./rep-p";

describe("REP-P establishment", () => { it("normaliza CNPJ e fixa timezone oficial", () => expect(establishmentSchema.parse({ name: "Churrascaria Marituba", cnpj: "16.912.959/0001-33" })).toEqual({ name: "Churrascaria Marituba", cnpj: "16912959000133", timezone: "America/Belem" })); it("rejeita identificação incompleta", () => expect(() => establishmentSchema.parse({ name: "X", cnpj: "123" })).toThrow()); });
describe("REP-P entry request", () => { it("não aceita NSR, horário ou estabelecimento enviados pelo cliente", () => expect(() => repPEntryRequestSchema.parse({ employeeId: "00000000-0000-4000-8000-000000000000", eventType: "CLOCK_IN", nsr: "999", recordedAt: "2000-01-01", establishmentId: "00000000-0000-4000-8000-000000000000" })).toThrow()); });
