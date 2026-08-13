"use server";

import { redirect } from "next/navigation";

import { requireAdmin } from "@/auth/session";
import { EmployeeConflictError } from "@/services/employee-errors";
import { createEmployee } from "@/services/employee.service";
import { employeeCreateSchema } from "@/validations/employee";

export type EmployeeFormState = {
  message?: string;
  errors?: Partial<Record<"fullName" | "cpf" | "phone" | "position" | "registrationNumber" | "admissionDate", string[]>>;
};

export async function createEmployeeAction(
  _previousState: EmployeeFormState,
  formData: FormData,
): Promise<EmployeeFormState> {
  const session = await requireAdmin();
  const parsed = employeeCreateSchema.safeParse({
    fullName: formData.get("fullName"),
    cpf: formData.get("cpf"),
    phone: formData.get("phone"),
    position: formData.get("position"),
    registrationNumber: formData.get("registrationNumber"),
    admissionDate: formData.get("admissionDate"),
  });

  if (!parsed.success) {
    return {
      message: "Revise os campos destacados.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await createEmployee(parsed.data, session.user.id);
  } catch (error) {
    if (error instanceof EmployeeConflictError) {
      return {
        message: error.message,
        errors: { [error.field]: [error.message] },
      };
    }

    console.error("Falha ao cadastrar funcionário", {
      error: error instanceof Error ? error.message : "unknown",
      performedBy: session.user.id,
    });
    return { message: "Não foi possível cadastrar o funcionário. Tente novamente." };
  }

  redirect("/admin/funcionarios?created=1");
}
