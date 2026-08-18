export function validateAejBytes(bytes: Uint8Array) {
  const issues: Array<{ severity: "ERROR" | "WARNING"; code: string; message: string }> = [];
  const text = Buffer.from(bytes).toString("latin1");
  if (!text.endsWith("\r\n")) issues.push({ severity: "ERROR", code: "AEJ_LINE_ENDING", message: "O AEJ deve terminar com CRLF." });
  if (/(^|[^\r])\n/.test(text)) issues.push({ severity: "ERROR", code: "AEJ_INVALID_LINE_ENDING", message: "O AEJ contém quebra de linha fora do padrão CRLF." });
  const lines = text.split("\r\n").filter(Boolean);
  const trailerIndex = lines.findIndex((line) => line.startsWith("99|"));
  if (trailerIndex < 0) issues.push({ severity: "ERROR", code: "AEJ_TRAILER_MISSING", message: "Trailer do AEJ ausente." });
  else {
    const expected = lines[trailerIndex].split("|").slice(1).map(Number);
    const actual = ["01", "02", "03", "04", "05", "06", "07", "08"].map((type) => lines.filter((line) => line.startsWith(`${type}|`)).length);
    if (expected.some((value, index) => value !== actual[index])) issues.push({ severity: "ERROR", code: "AEJ_TRAILER_COUNT", message: "Contadores do trailer divergem dos registros." });
  }
  if (!lines.at(-1)?.startsWith("ASSINATURA_DIGITAL_EM_ARQUIVO_P7S")) issues.push({ severity: "ERROR", code: "AEJ_SIGNATURE_MARKER", message: "Marcador de assinatura destacada ausente." });
  return issues;
}
