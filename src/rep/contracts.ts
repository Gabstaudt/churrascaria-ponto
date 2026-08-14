export type REPRecord = { nsr: string; employeeRegistration: string; occurredAt: string; eventType: "CLOCK" };
export type REPBatch = { records: REPRecord[]; source: string };
export interface REPAdapter { readonly id: string; parse(payload: unknown): REPBatch; }
