import type { EmployeeStatus } from "@/db/schema/enums";

export const employeeStatusLabels: Record<EmployeeStatus, string> = {
  ACTIVE: "Ativo",
  VACATION: "Em férias",
  LEAVE: "Afastado",
  TERMINATED: "Desligado",
  INACTIVE: "Inativo",
};

export function isEmployeeActiveForStatus(status: EmployeeStatus): boolean {
  return status !== "INACTIVE" && status !== "TERMINATED";
}

export function resolveEmployeeActivation(active: boolean): {
  status: EmployeeStatus;
  isActive: boolean;
} {
  return { status: active ? "ACTIVE" : "INACTIVE", isActive: active };
}
