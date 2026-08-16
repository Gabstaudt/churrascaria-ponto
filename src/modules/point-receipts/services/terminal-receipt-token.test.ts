import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { issueTerminalReceiptToken, verifyTerminalReceiptToken } from "./terminal-receipt-token";

describe("token temporário do comprovante no terminal", () => {
  beforeEach(() => { process.env.RECEIPT_VERIFICATION_SECRET = "segredo-de-teste-com-mais-de-32-caracteres"; });
  afterEach(() => { delete process.env.RECEIPT_VERIFICATION_SECRET; });
  it("vincula o acesso ao comprovante, coletor e prazo", () => {
    const token = issueTerminalReceiptToken("receipt-1", "collector-1", 1_000_000);
    expect(verifyTerminalReceiptToken(token, "receipt-1", "collector-1", 1_050_000)).toBe(true);
    expect(verifyTerminalReceiptToken(token, "receipt-2", "collector-1", 1_050_000)).toBe(false);
    expect(verifyTerminalReceiptToken(token, "receipt-1", "collector-2", 1_050_000)).toBe(false);
    expect(verifyTerminalReceiptToken(token, "receipt-1", "collector-1", 1_130_000)).toBe(false);
  });
});
