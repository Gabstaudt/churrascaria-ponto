import { afdField, afdNumber, appendCrc, chainedClockHash, digits, formatAfdDate, formatAfdDateTime } from "../layout/afd-layout-004";
import { AFD_LAYOUT_CODE, AFD_LINE_ENDING, type AfdRecord } from "../types";
import { encodeLatin1 } from "./latin1";

export function serializeAfd(records: AfdRecord[], timezone: string) {
  let previousClockHash = "";
  const lines = records.map((record) => {
    if (record.type === "1") {
      const withoutCrc = `${"000000000"}1${record.employerIdType}${afdField(digits(record.employerId), 14, "employerId")}${afdField(digits(record.cnoOrCaepf), 14, "cnoOrCaepf")}${afdField(record.employerName, 150, "employerName")}${afdField(record.inpiRegistration, 17, "inpiRegistration")}${formatAfdDate(record.startDate)}${formatAfdDate(record.endDate)}${formatAfdDateTime(record.generatedAt, timezone)}${AFD_LAYOUT_CODE}${record.developerIdType}${afdField(digits(record.developerId), 14, "developerId")}${afdField("", 30, "repCModel")}`;
      return appendCrc(withoutCrc);
    }
    if (record.type === "7") {
      const fields = `${afdNumber(record.nsr, 9, "nsr")}7${formatAfdDateTime(record.markedAt, timezone)}${afdField(digits(record.employeeCpf), 12, "employeeCpf")}${formatAfdDateTime(record.recordedAt, timezone)}${record.collectorType}${record.offline ? "1" : "0"}`;
      previousClockHash = chainedClockHash(fields, previousClockHash);
      return `${fields}${previousClockHash}`;
    }
    if (record.type === "9") return `999999999${afdNumber(record.counts.type2, 9, "type2Count")}${afdNumber(record.counts.type3, 9, "type3Count")}${afdNumber(record.counts.type4, 9, "type4Count")}${afdNumber(record.counts.type5, 9, "type5Count")}${afdNumber(record.counts.type6, 9, "type6Count")}${afdNumber(record.counts.type7, 9, "type7Count")}9`;
    return afdField(record.value, 100, "signature");
  });
  const text = `${lines.join(AFD_LINE_ENDING)}${AFD_LINE_ENDING}`;
  return { text, bytes: encodeLatin1(text), lines };
}
