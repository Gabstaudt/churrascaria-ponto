import { describe, expect, it } from "vitest";
import { localBelemDateTime, simulatedExternalId } from "./time-entry-core";

describe("simulatedExternalId", () => {
  it("gera o mesmo identificador para o mesmo evento", () => {
    const first = simulatedExternalId("employee", "2026-08-13", "08:00");
    expect(simulatedExternalId("employee", "2026-08-13", "08:00")).toBe(first);
  });
  it("distingue horários diferentes", () => expect(simulatedExternalId("employee", "2026-08-13", "08:00")).not.toBe(simulatedExternalId("employee", "2026-08-13", "12:00")));
});

describe("localBelemDateTime", () => {
  it("converte o horário de Belém para o instante oficial", () => expect(localBelemDateTime("2026-08-13", "08:00").toISOString()).toBe("2026-08-13T11:00:00.000Z"));
});
