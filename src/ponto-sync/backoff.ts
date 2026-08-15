export function retryDelayMs(attempt: number, random = Math.random) {
  const exponent = Math.max(0, Math.min(attempt - 1, 8));
  const base = Math.min(1_000 * 2 ** exponent, 300_000);
  return Math.round(base * (0.8 + random() * 0.4));
}
