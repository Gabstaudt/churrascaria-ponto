import { describe, expect, it } from "vitest";
import { clientAddress, rateLimitDecision } from "./rate-limit-core";

describe("rate limiting", () => { it("bloqueia somente depois do limite", () => { const start = new Date("2026-08-14T12:00:00Z"); expect(rateLimitDecision(5, 5, start, 60, start).allowed).toBe(true); expect(rateLimitDecision(6, 5, start, 60, start)).toMatchObject({ allowed: false, remaining: 0, retryAfterSeconds: 60 }); }); it("usa o primeiro endereço encaminhado", () => expect(clientAddress(new Headers({ "x-forwarded-for": "203.0.113.10, 10.0.0.1" }))).toBe("203.0.113.10")); });
