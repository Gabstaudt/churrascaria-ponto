import { describe, expect, it } from "vitest";
import { AUDIT_REDACTED_VALUE, redactAuditPayload } from "./audit-redaction";

describe("redactAuditPayload", () => {
  it("oculta credenciais em qualquer profundidade", () => {
    expect(redactAuditPayload({ password: "abc", nested: { accessToken: "token", safe: "ok" } })).toEqual({
      password: AUDIT_REDACTED_VALUE,
      nested: { accessToken: AUDIT_REDACTED_VALUE, safe: "ok" },
    });
  });

  it("mantém somente os dois últimos dígitos do CPF", () => {
    expect(redactAuditPayload({ cpf: "123.456.789-01" })).toEqual({ cpf: "***.***.***-01" });
  });

  it("processa listas sem alterar dados não sensíveis", () => {
    expect(redactAuditPayload([{ name: "Ana", sessionId: "x" }])).toEqual([{ name: "Ana", sessionId: AUDIT_REDACTED_VALUE }]);
  });
});
