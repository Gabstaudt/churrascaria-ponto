"use server";

import { redirect } from "next/navigation";

import { requireAdmin } from "@/auth/session";
import { EmployeeConflictError } from "@/services/employee-errors";
import { createEmployee, setEmployeeActive, updateEmployee } from "@/services/employee.service";
import { employeeCreateSchema, employeeIdSchema, employeeUpdateSchema } from "@/validations/employee";

export type EmployeeField = "fullName" | "cpf" | "phone" | "position" | "registrationNumber" | "admissionDate" | "status" | "workCardNumber" | "emergencyContactName" | "emergencyContactRelationship" | "emergencyContactPhone" | "notes";

export type EmployeeFormState = {
  message?: string;
  errors?: Partial<Record<EmployeeField, string[]>>;
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
    workCardNumber: formData.get("workCardNumber"),
    emergencyContactName: formData.get("emergencyContactName"),
    emergencyContactRelationship: formData.get("emergencyContactRelationship"),
    emergencyContactPhone: formData.get("emergencyContactPhone"),
    notes: formData.get("notes"),
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

function employeeInput(formData: FormData) {
  return {
    fullName: formData.get("fullName"),
    cpf: formData.get("cpf"),
    phone: formData.get("phone"),
    position: formData.get("position"),
    registrationNumber: formData.get("registrationNumber"),
    admissionDate: formData.get("admissionDate"),
    status: formData.get("status"),
    workCardNumber: formData.get("workCardNumber"),
    emergencyContactName: formData.get("emergencyContactName"),
    emergencyContactRelationship: formData.get("emergencyContactRelationship"),
    emergencyContactPhone: formData.get("emergencyContactPhone"),
    notes: formData.get("notes"),
  };
}

export async function updateEmployeeAction(id: string, _state: EmployeeFormState, formData: FormData): Promise<EmployeeFormState> {
  const session = await requireAdmin();
  const parsedId = employeeIdSchema.safeParse(id);
  const parsed = employeeUpdateSchema.safeParse(employeeInput(formData));
  if (!parsedId.success) return { message: "Funcionário inválido." };
  if (!parsed.success) return { message: "Revise os campos destacados.", errors: parsed.error.flatten().fieldErrors };
  try {
    const updated = await updateEmployee(parsedId.data, parsed.data, session.user.id);
    if (!updated) return { message: "Funcionário não encontrado." };
  } catch (error) {
    if (error instanceof EmployeeConflictError) return { message: error.message, errors: { [error.field]: [error.message] } };
    console.error("Falha ao atualizar funcionário", { error: error instanceof Error ? error.message : "unknown", performedBy: session.user.id });
    return { message: "Não foi possível atualizar o funcionário." };
  }
  redirect(`/admin/funcionarios/${parsedId.data}?updated=1`);
}

export async function setEmployeeActiveAction(id: string, active: boolean) {
  const session = await requireAdmin();
  const parsedId = employeeIdSchema.safeParse(id);
  if (!parsedId.success) redirect("/admin/funcionarios");
  await setEmployeeActive(parsedId.data, active, session.user.id);
  redirect(`/admin/funcionarios/${parsedId.data}?${active ? "reactivated" : "deactivated"}=1`);
}
