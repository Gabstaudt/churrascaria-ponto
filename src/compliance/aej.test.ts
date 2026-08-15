import { describe, expect, it } from "vitest";
import { aej, serializeAEJ } from "./aej";

describe("AEJ versão 002", () => {
  it("serializa com pipe, CRLF, trailer e marcador destacado", () => { const output = serializeAEJ({ includeSignatureMarker: true, records: [aej.header("1", "12345678000199", "", "", "Empresa", "2026-08-01", "2026-08-31", "2026-09-01T08:00:00-0300"), aej.rep("1", "1", "12345678901234567"), aej.employee("2", "12345678901", "Funcionário"), aej.schedule("CH001", "480", [["0800", "1200"], ["1300", "1700"]]), aej.clock("2", "2026-08-14T08:00:00-0300", "1", "E", "001", "O", "CH001"), aej.software("Churrascaria Ponto", "0.1.0", "1", "12345678000199", "Desenvolvedor", "dev@example.com")] }).toString("latin1"); expect(output).toContain("05|2|2026-08-14T08:00:00-0300|1|E|001|O|CH001|\r\n"); expect(output).toContain("99|1|1|1|1|1|0|0|1\r\n"); expect(output.endsWith(`${"ASSINATURA_DIGITAL_EM_ARQUIVO_P7S".padEnd(100, " ")}\r\n`)).toBe(true); });
  it("bloqueia horário, primeira entrada e caracteres incompatíveis", () => { expect(() => aej.schedule("CH", "480", [["2500", "1200"]])).toThrow(); expect(() => aej.clock("1", "2026-08-14T08:00:00-0300", "1", "E", "001", "O")).toThrow(); expect(() => aej.employee("1", "12345678901", "Nome 😀")).toThrow(); });
});
