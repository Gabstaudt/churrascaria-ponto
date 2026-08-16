export type AfdSignatureResult = { status: "PENDING" | "SIGNED" | "FAILED"; bytes?: Uint8Array; provider?: string; certificateIdentifier?: string; signedAt?: Date };
export interface AfdDigitalSignatureService { sign(bytes: Uint8Array): Promise<AfdSignatureResult>; }
export class DeferredCadesSignatureService implements AfdDigitalSignatureService { async sign(_bytes: Uint8Array): Promise<AfdSignatureResult> { return { status: "PENDING" }; } }
