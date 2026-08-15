export type CollectorStatus = "ACTIVE" | "INACTIVE" | "BLOCKED";
export function collectorCanRegister(status: CollectorStatus) { return status === "ACTIVE"; }
