import { createHash } from "node:crypto";
import { crc16Kermit } from "../integrity/crc16-kermit";
import { encodeLatin1 } from "../serializers/latin1";

export function digits(value: string) { return value.replace(/\D/g, ""); }
export function afdField(value: string, length: number, fieldName: string) {
  const clean = value.replace(/[\r\n]/g, " ");
  if (clean.length > length) throw new Error(`FIELD_TOO_LONG:${fieldName}`);
  return clean.padEnd(length, " ");
}
export function afdNumber(value: number | string, length: number, fieldName: string) {
  const clean = String(value);
  if (!/^\d+$/.test(clean) || clean.length > length) throw new Error(`INVALID_NUMERIC_FIELD:${fieldName}`);
  return clean.padStart(length, "0");
}
export function formatAfdDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("INVALID_AFD_DATE");
  return value;
}
export function formatAfdDateTime(value: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZoneName: "longOffset" }).formatToParts(value);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  const offset = part("timeZoneName").replace("GMT", "").replace(":", "") || "+0000";
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}:00${offset}`;
}
export function appendCrc(lineWithoutCrc: string) { return `${lineWithoutCrc}${crc16Kermit(encodeLatin1(lineWithoutCrc))}`; }
export function chainedClockHash(fields: string, previousHash = "") { return createHash("sha256").update(encodeLatin1(`${fields}${previousHash}`)).digest("hex").toUpperCase(); }
