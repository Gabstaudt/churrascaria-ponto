export function encodeLatin1(value: string) {
  const bytes = new Uint8Array(value.length);
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code > 255) throw new Error(`INVALID_ISO_8859_1_CHARACTER:${index}`);
    bytes[index] = code;
  }
  return bytes;
}

export function decodeLatin1(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
}
