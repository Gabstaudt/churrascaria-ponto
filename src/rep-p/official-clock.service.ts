export const REP_P_OFFICIAL_TIMEZONE = "America/Belem";
export type OfficialClock = { now(): Date };
export const systemOfficialClock: OfficialClock = { now: () => new Date() };

export function officialRecordedAt(clock: OfficialClock = systemOfficialClock) { const timestamp = clock.now(); if (Number.isNaN(timestamp.getTime())) throw new Error("Relógio oficial indisponível."); return new Date(timestamp.getTime()); }
