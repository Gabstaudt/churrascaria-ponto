import { decideContingency } from "../policies/contingency-policy.service";
import type { ContingencyReason } from "../types";
export function classifyLocationFailure(code: number | string): ContingencyReason { if (code === 1 || code === "PERMISSION_DENIED") return "LOCATION_PERMISSION_DENIED"; if (code === 2 || code === "POSITION_UNAVAILABLE") return "LOCATION_UNAVAILABLE"; if (code === "LOW_ACCURACY") return "LOCATION_LOW_ACCURACY"; if (code === "OUTSIDE_GEOFENCE") return "OUTSIDE_GEOFENCE"; return "GEOFENCE_SERVICE_ERROR"; }
export function classifyBiometricFailure(code: string): ContingencyReason { if (code === "PROVIDER_UNAVAILABLE") return "BIOMETRIC_PROVIDER_UNAVAILABLE"; if (code === "LIVENESS_FAILED") return "LIVENESS_FAILED"; if (code === "CAMERA_UNAVAILABLE") return "CAMERA_UNAVAILABLE"; return "BIOMETRIC_NO_MATCH"; }
export function contingencyFor(reason: ContingencyReason) { return decideContingency(reason); }
