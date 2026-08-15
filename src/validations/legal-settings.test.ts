import { describe, expect, it } from "vitest";
import { legalSettingsSchema } from "./legal-settings";

const valid = { employerName: "Empresa Exemplo LTDA", employerIdType: "CNPJ" as const, employerId: "12.345.678/0001-95", caepf: "", cno: "", street: "Rua Exemplo, 1", district: "Centro", postalCode: "12345-678", city: "Cidade", state: "pa", legalRepresentative: "Responsável", employerEmail: "EMPRESA@example.com", ptrpName: "UpTime", ptrpVersion: "0.1.0", developerIdType: "CPF" as const, developerId: "529.982.247-25", developerName: "Desenvolvedora", developerEmail: "DEV@example.com" };
describe("configuração jurídica", () => {
  it("normaliza documentos, estado, CEP e e-mails", () => { const parsed = legalSettingsSchema.parse(valid); expect(parsed.employerId).toBe("12345678000195"); expect(parsed.developerId).toBe("52998224725"); expect(parsed.postalCode).toBe("12345678"); expect(parsed.state).toBe("PA"); expect(parsed.developerEmail).toBe("dev@example.com"); });
  it("rejeita CPF inválido e versão fora do padrão", () => { expect(() => legalSettingsSchema.parse({ ...valid, developerId: "11111111111" })).toThrow(); expect(() => legalSettingsSchema.parse({ ...valid, ptrpVersion: "versão final" })).toThrow(); });
});
