export type IdentifiedEmployee = { id: string; displayName: string; jobTitle?: string };
export type IdentificationContext = { collectorId: string; signal?: AbortSignal };

/** Extension point implemented by facial identification in Sprint 28. */
export interface EmployeeIdentificationService { identify(context: IdentificationContext): Promise<IdentifiedEmployee>; }

export class IdentificationUnavailableError extends Error { constructor() { super("Identificação ainda não disponível neste terminal."); this.name = "IdentificationUnavailableError"; } }
