import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));

const { db } = await import("@/db");
const { rateLimitBuckets } = await import("@/db/schema");
const { like } = await import("drizzle-orm");
const { consumeRateLimit } = await import("./rate-limit.service");

describe("consumeRateLimit (integração com Postgres local)", () => {
  const scope = `test-rate-limit-${randomUUID().slice(0, 8)}`;
  afterAll(async () => { await db.delete(rateLimitBuckets).where(like(rateLimitBuckets.key, `${scope}%`)); });

  it("permite chamadas repetidas dentro da janela sem quebrar no caminho de conflito (upsert)", async () => {
    const request = new Request("http://localhost/test");
    const first = await consumeRateLimit(request, scope, 5, 30, "subject-fixo");
    expect(first.allowed).toBe(true); expect(first.remaining).toBe(4);

    const second = await consumeRateLimit(request, scope, 5, 30, "subject-fixo");
    expect(second.allowed).toBe(true); expect(second.remaining).toBe(3);

    const third = await consumeRateLimit(request, scope, 5, 30, "subject-fixo");
    expect(third.allowed).toBe(true); expect(third.remaining).toBe(2);
  });

  it("bloqueia após exceder o limite", async () => {
    const request = new Request("http://localhost/test"); const localScope = `${scope}-limit`;
    for (let i = 0; i < 2; i += 1) await consumeRateLimit(request, localScope, 2, 30, "subject-limite");
    const blocked = await consumeRateLimit(request, localScope, 2, 30, "subject-limite");
    expect(blocked.allowed).toBe(false);
  });
});
