import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));

const store = new Map<string, Uint8Array>();
vi.mock("@/services/object-storage.service", () => ({
  putPrivateObject: vi.fn(async (key: string, body: Uint8Array) => { store.set(key, body); }),
  getPrivateObjectBytes: vi.fn(async (key: string) => { const value = store.get(key); if (!value) throw new Error("OBJECT_NOT_FOUND"); return value; }),
}));

const { db } = await import("@/db");
const { signatureOperations } = await import("@/db/schema");
const { inArray } = await import("drizzle-orm");
const { DigitalSignatureService } = await import("../services/digital-signature.service");

async function certificateInfo(serial: string) { return { alias: "Teste", certificateType: "A1" as const, serialNumber: serial, subject: "CN=Teste de Assinatura", issuer: "CN=Teste de Assinatura", fingerprint: "AA:BB:CC", validFrom: new Date(Date.now() - 86_400_000), validUntil: new Date(Date.now() + 86_400_000), status: "VALID" as const, daysUntilExpiration: 300 }; }

function fakeProvider(serial: string, failTimes = 0) {
  let attempts = 0; let signCalls = 0;
  return {
    signCalls: () => signCalls,
    certificateInfo: () => certificateInfo(serial),
    signCades: async () => { signCalls += 1; attempts += 1; if (attempts <= failTimes) throw new Error("PROVIDER_TEMPORARIAMENTE_INDISPONIVEL"); return { signature: new TextEncoder().encode(`assinatura-${attempts}`), certificate: await certificateInfo(serial), provider: "FAKE" }; },
    verifyCades: async () => ({ status: "VALID" as const }),
    signPades: async () => { throw new Error("não utilizado neste teste"); },
    verifyPades: async () => ({ status: "VALID" as const }),
  };
}

describe("DigitalSignatureService (integração com Postgres local)", () => {
  const createdDocumentIds: string[] = [];
  afterAll(async () => { if (createdDocumentIds.length) await db.delete(signatureOperations).where(inArray(signatureOperations.documentId, createdDocumentIds)); });

  it("é idempotente: assinar o mesmo documento duas vezes não reprocessa nem duplica a operação", async () => {
    const serial = `TEST-IDEMPOTENT-${randomUUID()}`; const documentId = randomUUID(); createdDocumentIds.push(documentId);
    const provider = fakeProvider(serial); const service = new DigitalSignatureService(provider as never); const document = new TextEncoder().encode("AFD de teste de idempotência\r\n");

    const first = await service.signCades("AFD", documentId, document, `test/${documentId}.p7s`);
    expect(first.idempotent).toBe(false); expect(provider.signCalls()).toBe(1);

    const second = await service.signCades("AFD", documentId, document, `test/${documentId}.p7s`);
    expect(second.idempotent).toBe(true); expect(second.outputHash).toBe(first.outputHash); expect(provider.signCalls()).toBe(1);

    const rows = await db.select().from(signatureOperations).where(inArray(signatureOperations.documentId, [documentId]));
    expect(rows).toHaveLength(1); expect(rows[0]!.status).toBe("SIGNED");
  });

  it("permite nova tentativa após falha, preservando o histórico de tentativas", async () => {
    const serial = `TEST-RETRY-${randomUUID()}`; const documentId = randomUUID(); createdDocumentIds.push(documentId);
    const provider = fakeProvider(serial, 1); const service = new DigitalSignatureService(provider as never); const document = new TextEncoder().encode("AFD de teste de retry\r\n");

    await expect(service.signCades("AFD", documentId, document, `test/${documentId}.p7s`)).rejects.toThrow("PROVIDER_TEMPORARIAMENTE_INDISPONIVEL");
    const [failed] = await db.select().from(signatureOperations).where(inArray(signatureOperations.documentId, [documentId]));
    expect(failed!.status).toBe("FAILED"); expect(failed!.retryCount).toBe(1); expect(failed!.nextRetryAt).not.toBeNull();

    const retried = await service.signCades("AFD", documentId, document, `test/${documentId}.p7s`);
    expect(retried.idempotent).toBe(false); expect(provider.signCalls()).toBe(2);
    const [signed] = await db.select().from(signatureOperations).where(inArray(signatureOperations.documentId, [documentId]));
    expect(signed!.status).toBe("SIGNED"); expect(signed!.retryCount).toBe(1);
  });

  it("lista operações pendentes e falhadas por tipo de documento", async () => {
    const serial = `TEST-PENDING-${randomUUID()}`; const documentId = randomUUID(); createdDocumentIds.push(documentId);
    const provider = fakeProvider(serial, 5); const service = new DigitalSignatureService(provider as never); const document = new TextEncoder().encode("AEJ de teste de pendências\r\n");

    await expect(service.signCades("AEJ", documentId, document, `test/${documentId}.p7s`)).rejects.toThrow();
    const pending = await service.pendingOperations("AEJ");
    expect(pending.some((operation) => operation.documentId === documentId && operation.status === "FAILED")).toBe(true);
  });
});
