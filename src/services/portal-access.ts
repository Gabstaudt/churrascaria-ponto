export type PortalRole = "ADMIN" | "MANAGER" | "EMPLOYEE";
export function portalHome(role: PortalRole) { return role === "ADMIN" ? "/admin" : role === "MANAGER" ? "/gestao" : "/portal"; }
export function canAccessEmployee(role: PortalRole, ownEmployeeId: string | null, managedEmployeeIds: string[], targetEmployeeId: string) { return role === "ADMIN" || (role === "EMPLOYEE" && ownEmployeeId === targetEmployeeId) || (role === "MANAGER" && managedEmployeeIds.includes(targetEmployeeId)); }
export function canReviewPortalRequest(role: PortalRole) { return role === "ADMIN" || role === "MANAGER"; }
