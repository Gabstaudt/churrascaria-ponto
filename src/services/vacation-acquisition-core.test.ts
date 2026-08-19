import { describe, expect, it } from "vitest";
import { isWithinAcquisitiveAlertWindow, nextAcquisitiveAnniversary } from "./vacation-acquisition-core";

describe("nextAcquisitiveAnniversary", () => {
  it("retorna o próximo aniversário quando ainda não chegou este ano", () => {
    expect(nextAcquisitiveAnniversary("2023-08-15", "2026-08-01")).toBe("2026-08-15");
  });
  it("pula para o ano seguinte quando o aniversário deste ano já passou", () => {
    expect(nextAcquisitiveAnniversary("2023-08-15", "2026-08-20")).toBe("2027-08-15");
  });
  it("nunca retorna uma data igual ou anterior à própria admissão", () => {
    expect(nextAcquisitiveAnniversary("2026-08-15", "2026-08-10")).toBe("2027-08-15");
  });
  it("lida com admissão em 29 de fevereiro (ano bissexto) ajustando para anos não bissextos", () => {
    expect(nextAcquisitiveAnniversary("2020-02-29", "2026-01-01")).toBe("2026-02-28");
  });
});

describe("isWithinAcquisitiveAlertWindow", () => {
  it("está dentro da janela quando faltam menos dias que o limite", () => {
    expect(isWithinAcquisitiveAlertWindow("2026-09-01", "2026-08-15", 30)).toBe(true);
  });
  it("está fora da janela quando falta mais que o limite", () => {
    expect(isWithinAcquisitiveAlertWindow("2026-12-01", "2026-08-15", 30)).toBe(false);
  });
  it("inclui o próprio dia do aniversário", () => {
    expect(isWithinAcquisitiveAlertWindow("2026-08-15", "2026-08-15", 30)).toBe(true);
  });
  it("não alerta para datas já passadas", () => {
    expect(isWithinAcquisitiveAlertWindow("2026-08-01", "2026-08-15", 30)).toBe(false);
  });
});
