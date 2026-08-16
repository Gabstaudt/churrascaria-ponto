import type { SignedPdfResult } from "../types";
export interface PointReceiptSignatureService { signPdf(pdf: Uint8Array): Promise<SignedPdfResult>; }
export class DeferredPadesSignatureService implements PointReceiptSignatureService { async signPdf(pdf: Uint8Array): Promise<SignedPdfResult> { return { bytes: pdf, status: "NOT_REQUIRED" }; } }
