export function canViewAudit(role: string | null | undefined) {
  return role === "ADMIN";
}
