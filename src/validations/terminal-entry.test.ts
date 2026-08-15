import { describe, expect, it } from "vitest";
import { repPEntryRequestSchema } from "./rep-p";
describe("payload do terminal", () => { it("não aceita estabelecimento escolhido pelo navegador", () => { expect(repPEntryRequestSchema.safeParse({ employeeId: "550e8400-e29b-41d4-a716-446655440000", eventType: "CLOCK_IN", establishmentId: "550e8400-e29b-41d4-a716-446655440001" }).success).toBe(false); }); });
