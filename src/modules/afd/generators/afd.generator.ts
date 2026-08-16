import { createAfdHeader, createAfdTrailer } from "../factories/afd-record.factory";
import { serializeAfd } from "../serializers/afd.serializer";
import { type AfdArtifact, type AfdSource } from "../types";
import { validateAfdSource, validateAfdStructure, validateSerializedAfd } from "../validators/afd.validator";

export function generateAfdArtifact(source: AfdSource, startDate: string, endDate: string, generatedAt: Date): AfdArtifact {
  const clocks = [...source.entries].sort((a, b) => a.nsr - b.nsr);
  const records = [createAfdHeader(source, startDate, endDate, generatedAt), ...clocks, createAfdTrailer(clocks.length), { type: "SIGNATURE" as const, value: "ASSINATURA_DIGITAL_EM_ARQUIVO_P7S" as const }];
  const issues = [...validateAfdSource(source, clocks), ...validateAfdStructure(records)];
  const serialized = serializeAfd(records, source.establishment.timezone);
  issues.push(...validateSerializedAfd(serialized.bytes));
  return { records, text: serialized.text, bytes: serialized.bytes, issues, recordCount: records.length, firstNsr: clocks[0] ? String(clocks[0].nsr) : undefined, lastNsr: clocks.at(-1) ? String(clocks.at(-1)!.nsr) : undefined, recordCountByType: { "1": 1, "7": clocks.length, "9": 1, SIGNATURE: 1 } };
}
