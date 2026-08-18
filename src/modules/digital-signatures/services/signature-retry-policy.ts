export function signatureRetryDelayMs(count: number) { return [60_000, 300_000, 900_000, 3_600_000, 21_600_000][Math.min(count, 4)]; }
