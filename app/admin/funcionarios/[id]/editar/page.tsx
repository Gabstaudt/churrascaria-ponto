import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EmployeeForm } from "@/components/employees/employee-form";
import { getEmployeeById } from "@/services/employee.service";
import { employeeIdSchema } from "@/validations/employee";

export default async function EditEmployeePage({ params }: PageProps<"/admin/funcionarios/[id]/editar">) {
  const { id } = await params;
  const parsedId = employeeIdSchema.safeParse(id);
  if (!parsedId.success) notFound();
  const employee = await getEmployeeById(parsedId.data);
  if (!employee) notFound();

  return <main className="dashboard-page form-page"><Link className="back-link" href={`/admin/funcionarios/${employee.id}`}><ArrowLeft size={17} /> Voltar para o funcionário</Link><div className="page-heading compact-heading"><div><p className="eyebrow">Editar cadastro</p><h1>{employee.fullName}</h1><p>Atualize os dados mantendo a integridade do histórico.</p></div></div><div className="required-note"><span>*</span> Campos obrigatórios</div><EmployeeForm employee={employee} /></main>;
}
