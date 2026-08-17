import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { decryptBiometricTemplate, encryptBiometricTemplate } from "./biometric-encryption.service";
const ORIGINAL_KEY = process.env.BIOMETRIC_ENCRYPTION_KEY;
describe("BiometricEncryptionService", () => {
  beforeEach(() => { process.env.BIOMETRIC_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64"); });
  afterEach(() => { process.env.BIOMETRIC_ENCRYPTION_KEY = ORIGINAL_KEY; });
  it("protege template com cifra autenticada", () => { const result = encryptBiometricTemplate([0.1, 0.2, -0.3]); expect(result.encrypted).not.toContain("0.1"); expect(decryptBiometricTemplate(result.encrypted)).toEqual([0.1, 0.2, -0.3]); });
  it("rejeita conteúdo adulterado", () => { const parts = encryptBiometricTemplate([1]).encrypted.split("."); parts[3] = `${parts[3][0] === "A" ? "B" : "A"}${parts[3].slice(1)}`; expect(() => decryptBiometricTemplate(parts.join("."))).toThrow(); });
  it("recusa operar sem chave configurada, sem vazar detalhes internos", () => { delete process.env.BIOMETRIC_ENCRYPTION_KEY; expect(() => encryptBiometricTemplate([1, 2, 3])).toThrow("BIOMETRIC_ENCRYPTION_KEY não configurada."); });
  it("recusa chave com tamanho incorreto, sem expor o valor recebido", () => { process.env.BIOMETRIC_ENCRYPTION_KEY = Buffer.alloc(8, 1).toString("base64"); try { encryptBiometricTemplate([1]); throw new Error("deveria ter lançado"); } catch (error) { expect(String(error)).toContain("deve possuir 32 bytes"); expect(String(error)).not.toContain(Buffer.alloc(8, 1).toString("base64")); } });
});
