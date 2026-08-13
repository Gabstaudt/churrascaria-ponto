import { describe, expect, it } from "vitest";
import { availabilityCreateSchema, swapReviewSchema } from "./availability";

const employeeId = "550e8400-e29b-41d4-a716-446655440000";
describe("availabilityCreateSchema", () => {
  it("aceita folga pontual", () => expect(availabilityCreateSchema.safeParse({ kind: "DAY_OFF", employeeId, date: "2026-09-01", reason: "Folga autorizada" }).success).toBe(true));
  it("rejeita troca com datas iguais", () => expect(availabilityCreateSchema.safeParse({ kind: "SWAP", employeeId, date: "2026-09-01", workDate: "2026-09-01", reason: "Troca solicitada" }).success).toBe(false));
  it("aceita período de férias", () => expect(availabilityCreateSchema.safeParse({ kind: "VACATION", employeeId, startDate: "2026-09-01", endDate: "2026-09-15", reason: "Férias programadas" }).success).toBe(true));
  it("exige tipo no afastamento", () => expect(availabilityCreateSchema.safeParse({ kind: "LEAVE", employeeId, startDate: "2026-09-01", endDate: "2026-09-02", reason: "Afastamento legal" }).success).toBe(false));
  it("valida a decisão da troca", () => expect(swapReviewSchema.safeParse({ id: employeeId, decision: "APPROVED", reason: "Aprovado pela gestão" }).success).toBe(true));
});
