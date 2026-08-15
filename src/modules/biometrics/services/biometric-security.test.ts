import { describe, expect, it } from "vitest";
import { redactAuditPayload } from "@/services/audit-redaction";
describe("segurança biométrica", () => { it("remove material biométrico de auditoria", () => { expect(redactAuditPayload({ employeeId: "1", encryptedTemplate: "secret", imageBase64: "photo", similarityScore: .9 })).toEqual({ employeeId: "1", encryptedTemplate: "[OCULTO]", imageBase64: "[OCULTO]", similarityScore: "[OCULTO]" }); }); });
