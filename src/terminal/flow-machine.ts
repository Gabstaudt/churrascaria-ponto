import type { IdentifiedEmployee } from "./identification";
export type TerminalFlowStatus = "IDLE" | "REQUESTING_LOCATION" | "CHECKING_LOCATION" | "LOCATION_REJECTED" | "WAITING_FOR_FACE" | "CHECKING_FACE" | "CHECKING_LIVENESS" | "IDENTIFYING" | "IDENTIFICATION_FAILED" | "VALIDATING" | "READY" | "REGISTERING" | "SUCCESS" | "ERROR";
export type TerminalFlowState = { status: TerminalFlowStatus; locationValidationId?: string; biometricValidationId?: string; attemptId?: string; contingencyTicket?: string; employee?: IdentifiedEmployee; result?: { eventLabel: string; recordedAt: string; nsr: string; receipt?: { id: string; status: string; accessToken?: string } }; error?: string; failureCode?: string };
export type TerminalFlowEvent = { type: "START" } | { type: "LOCATION_CAPTURED" } | { type: "LOCATION_VALID"; validationId: string } | { type: "LOCATION_REJECTED"; message: string; code?: string } | { type: "FACE_CAPTURED" } | { type: "BIOMETRIC_APPROVED"; employee: IdentifiedEmployee; biometricValidationId: string; attemptId: string; contingencyTicket: string } | { type: "BIOMETRIC_REJECTED"; message: string; code?: string } | { type: "RETRY_FACE" } | { type: "IDENTIFIED"; employee: IdentifiedEmployee } | { type: "VALIDATED" } | { type: "REGISTER" } | { type: "SUCCEEDED"; result: NonNullable<TerminalFlowState["result"]> } | { type: "FAILED"; message: string } | { type: "RESET" };
export const initialTerminalFlowState: TerminalFlowState = { status: "IDLE" };
export function terminalFlowReducer(state: TerminalFlowState, event: TerminalFlowEvent): TerminalFlowState {
  if (event.type === "RESET") return initialTerminalFlowState;
  switch (state.status) {
    case "IDLE": return event.type === "START" ? { status: "REQUESTING_LOCATION" } : state;
    case "REQUESTING_LOCATION": return event.type === "LOCATION_CAPTURED" ? { status: "CHECKING_LOCATION" } : event.type === "LOCATION_REJECTED" ? { status: "LOCATION_REJECTED", error: event.message, failureCode: event.code } : state;
    case "CHECKING_LOCATION": return event.type === "LOCATION_VALID" ? { status: "WAITING_FOR_FACE", locationValidationId: event.validationId } : event.type === "LOCATION_REJECTED" ? { status: "LOCATION_REJECTED", error: event.message, failureCode: event.code } : state;
    case "WAITING_FOR_FACE": return event.type === "FACE_CAPTURED" ? { ...state, status: "CHECKING_FACE" } : event.type === "BIOMETRIC_REJECTED" ? { ...state, status: "IDENTIFICATION_FAILED", error: event.message, failureCode: event.code } : state;
    case "CHECKING_FACE": return event.type === "BIOMETRIC_APPROVED" ? { ...state, status: "VALIDATING", employee: event.employee, biometricValidationId: event.biometricValidationId, attemptId: event.attemptId, contingencyTicket: event.contingencyTicket } : event.type === "BIOMETRIC_REJECTED" ? { ...state, status: "IDENTIFICATION_FAILED", error: event.message, failureCode: event.code } : state;
    case "IDENTIFYING": return event.type === "IDENTIFIED" ? { ...state, status: "VALIDATING", employee: event.employee } : state;
    case "IDENTIFICATION_FAILED": return event.type === "RETRY_FACE" && state.locationValidationId ? { status: "WAITING_FOR_FACE", locationValidationId: state.locationValidationId } : state;
    case "VALIDATING": return event.type === "VALIDATED" ? { ...state, status: "READY" } : event.type === "FAILED" ? { status: "ERROR", error: event.message } : state;
    case "READY": return event.type === "REGISTER" ? { ...state, status: "REGISTERING" } : state;
    case "REGISTERING": return event.type === "SUCCEEDED" ? { ...state, status: "SUCCESS", result: event.result } : event.type === "FAILED" ? { ...state, status: "ERROR", error: event.message } : state;
    default: return state;
  }
}
