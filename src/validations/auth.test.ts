import { describe, expect, it } from "vitest";
import { createAdminSchema, loginSchema } from "./auth";

describe("loginSchema", () => {
  it("normaliza o email", () => {
    expect(loginSchema.parse({ email: " ADMIN@EXAMPLE.COM ", password: "senha" }).email).toBe("admin@example.com");
  });
  it("rejeita dados inválidos", () => {
    expect(loginSchema.safeParse({ email: "inválido", password: "" }).success).toBe(false);
  });
});

describe("createAdminSchema", () => {
  it("aceita senha forte", () => {
    expect(createAdminSchema.safeParse({ name: "Administrador", email: "admin@example.com", password: "Senha-forte-123" }).success).toBe(true);
  });
  it("rejeita senha fraca", () => {
    expect(createAdminSchema.safeParse({ name: "Administrador", email: "admin@example.com", password: "senha-fraca" }).success).toBe(false);
  });
});
