import { beforeEach, describe, expect, it } from "vitest";
import { issueContingencyTicket, verifyContingencyTicket } from "./contingency-ticket";

describe("ticket de contingência", () => {
  beforeEach(() => { process.env.CONTINGENCY_SIGNING_SECRET = "segredo-de-teste-com-mais-de-trinta-e-dois-caracteres"; });
  const data = { collectorId: "collector", employeeId: "employee", attemptId: "attempt", locationValidationId: "location", biometricValidationId: "biometric" };
  it("aceita somente o coletor vinculado", () => { const token = issueContingencyTicket(data, new Date("2026-08-15T12:00:00Z")); expect(verifyContingencyTicket(token, "collector", new Date("2026-08-15T13:00:00Z"))?.employeeId).toBe("employee"); expect(verifyContingencyTicket(token, "other", new Date("2026-08-15T13:00:00Z"))).toBeUndefined(); });
  it("rejeita adulteração e expiração", () => { const token = issueContingencyTicket(data, new Date("2026-08-15T12:00:00Z")); expect(verifyContingencyTicket(`${token}x`, "collector", new Date("2026-08-15T13:00:00Z"))).toBeUndefined(); expect(verifyContingencyTicket(token, "collector", new Date("2026-08-16T00:00:01Z"))).toBeUndefined(); });
});
