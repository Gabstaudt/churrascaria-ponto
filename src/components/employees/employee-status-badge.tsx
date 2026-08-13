import type { EmployeeStatus } from "@/db/schema/enums";
import { employeeStatusLabels } from "@/services/employee-status";

export function EmployeeStatusBadge({ status }: { status: EmployeeStatus }) {
  return <span className={`employee-badge status-${status.toLowerCase()}`}>{employeeStatusLabels[status]}</span>;
}
