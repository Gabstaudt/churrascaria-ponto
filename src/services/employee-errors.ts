export class EmployeeConflictError extends Error {
  constructor(public readonly field: "cpf" | "registrationNumber") {
    super(field === "cpf" ? "Já existe um funcionário com este CPF." : "Já existe um funcionário com esta matrícula.");
    this.name = "EmployeeConflictError";
  }
}

function getUniqueConstraint(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  const candidate = error as { code?: string; constraint_name?: string; constraint?: string };
  if (candidate.code !== "23505") return undefined;
  return candidate.constraint_name ?? candidate.constraint;
}

export function mapEmployeeConflict(error: unknown): EmployeeConflictError | undefined {
  const constraint = getUniqueConstraint(error);
  if (constraint === "employees_cpf_unique") return new EmployeeConflictError("cpf");
  if (constraint === "employees_registration_number_unique") return new EmployeeConflictError("registrationNumber");
  return undefined;
}
