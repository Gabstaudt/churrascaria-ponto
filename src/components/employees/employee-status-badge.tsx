import type { EmployeeStatus } from "@/db/schema/enums";

const labels: Record<EmployeeStatus, string> = {
  ACTIVE: "Ativo",
  VACATION: "Férias",
  LEAVE: "Afastado",
  TERMINATED: "Desligado",
  INACTIVE: "Inativo",
};

export function EmployeeStatusBadge({ status }: { status: EmployeeStatus }) {
  return <span className={`employee-badge status-${status.toLowerCase()}`}>{labels[status]}</span>;
}
