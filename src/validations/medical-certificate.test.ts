import { describe, expect, it } from "vitest";
import { medicalCertificateUploadSchema } from "./medical-certificate";

const valid = { employeeId: "123e4567-e89b-12d3-a456-426614174000", startDate: "2026-08-13", endDate: "2026-08-14", fileName: "atestado.pdf", contentType: "application/pdf", fileSize: 1024 };

describe("medicalCertificateUploadSchema", () => {
  it("aceita PDF dentro do limite", () => expect(medicalCertificateUploadSchema.safeParse(valid).success).toBe(true));
  it("rejeita executáveis", () => expect(medicalCertificateUploadSchema.safeParse({ ...valid, contentType: "application/x-msdownload" }).success).toBe(false));
  it("rejeita período invertido", () => expect(medicalCertificateUploadSchema.safeParse({ ...valid, endDate: "2026-08-12" }).success).toBe(false));
  it("rejeita arquivo maior que 8 MB", () => expect(medicalCertificateUploadSchema.safeParse({ ...valid, fileSize: 9 * 1024 * 1024 }).success).toBe(false));
});
