import { describe, expect, it } from "vitest";
import { certificateTemporalStatus, expirationAlertLevel } from "../certificates/certificate-validator";
import { assertSignatureMapping } from "../types";

describe("validação de certificado e mapeamento documental", () => {
  const now = new Date("2026-08-16T12:00:00Z");
  it("bloqueia certificado expirado e ainda não válido", () => { expect(certificateTemporalStatus(new Date("2025-01-01"), new Date("2026-01-01"), now)).toBe("EXPIRED"); expect(certificateTemporalStatus(new Date("2027-01-01"), new Date("2028-01-01"), now)).toBe("NOT_YET_VALID"); expect(certificateTemporalStatus(new Date("2026-01-01"), new Date("2027-01-01"), now)).toBe("VALID"); });
  it("produz alertas progressivos de expiração", () => { expect(expirationAlertLevel(61)).toBe("OK"); expect(expirationAlertLevel(30)).toBe("WARNING"); expect(expirationAlertLevel(7)).toBe("CRITICAL"); expect(expirationAlertLevel(-1)).toBe("CRITICAL"); });
  it("impede aplicar o padrão errado ao documento", () => { expect(() => assertSignatureMapping("AFD", "PADES")).toThrow("INVALID_SIGNATURE_MAPPING"); expect(() => assertSignatureMapping("POINT_RECEIPT", "PADES")).not.toThrow(); });
});
