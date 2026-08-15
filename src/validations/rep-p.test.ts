import { describe, expect, it } from "vitest";
import { establishmentSchema } from "./rep-p";

describe("REP-P establishment", () => { it("normaliza CNPJ e fixa timezone oficial", () => expect(establishmentSchema.parse({ name: "Churrascaria Marituba", cnpj: "16.912.959/0001-33" })).toEqual({ name: "Churrascaria Marituba", cnpj: "16912959000133", timezone: "America/Belem" })); it("rejeita identificação incompleta", () => expect(() => establishmentSchema.parse({ name: "X", cnpj: "123" })).toThrow()); });
