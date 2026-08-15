import type { timeEntrySourceValues } from "@/db/schema/enums";
type TimeEntrySource = (typeof timeEntrySourceValues)[number];
const labels: Record<TimeEntrySource, string> = { SIMULATOR: "Simulador", IMPORT: "Importação", REP_C: "REP-C", REP_P: "REP-P" };
export function timeEntrySourceLabel(source: TimeEntrySource) { return labels[source]; }
