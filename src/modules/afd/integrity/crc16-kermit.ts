export const AFD_CRC_ALGORITHM = "CRC_16_KERMIT_V1" as const;

export function crc16Kermit(input: Uint8Array) {
  let crc = 0;
  for (const byte of input) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc & 1) ? (crc >>> 1) ^ 0x8408 : crc >>> 1;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}
