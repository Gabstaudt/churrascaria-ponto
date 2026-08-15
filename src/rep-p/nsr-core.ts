export function formatRepPNsr(value: bigint) { if (value < BigInt(1)) throw new Error("NSR deve ser positivo."); return value.toString().padStart(9, "0"); }
