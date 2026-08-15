import type { EnrollmentResult, IdentificationCandidate, IdentificationResult } from "../types";
export interface FacialRecognitionProvider { enroll(image: Uint8Array): Promise<EnrollmentResult>; identify(image: Uint8Array, candidates: IdentificationCandidate[], policy: { minimumSimilarityThreshold: number; minimumScoreGap: number }): Promise<IdentificationResult>; }
export class BiometricProviderUnavailableError extends Error { constructor() { super("Serviço biométrico temporariamente indisponível."); this.name = "BiometricProviderUnavailableError"; } }
