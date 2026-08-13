import { ArrowLeft, BriefcaseBusiness, CalendarDays, Edit3, Hash, Phone, UserRound } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EmployeeActiveForm } from "@/components/employees/employee-active-form";
import { EmployeeStatusBadge } from "@/components/employees/employee-status-badge";
import { getEmployeeById } from "@/services/employee.service";
import { formatCpf, formatDate } from "@/utils/format";
import { employeeIdSchema } from "@/validations/employee";

export default async function EmployeeDetailPage({ params, searchParams }: PageProps<"/admin/funcionarios/[id]">) {
  const { id } = await params;
  const parsedId = employeeIdSchema.safeParse(id);
  if (!parsedId.success) notFound();
  const employee = await getEmployeeById(parsedId.data);
  if (!employee) notFound();
  const query = await searchParams;

  return (
    <main className="dashboard-page employee-detail-page">
      <Link className="back-link" href="/admin/funcionarios"><ArrowLeft size={17} /> Voltar para funcionários</Link>
      {query.updated === "1" ? <p className="success-message">Dados atualizados com sucesso.</p> : null}
      {query.deactivated === "1" ? <p className="success-message neutral">Funcionário inativado. O histórico foi preservado.</p> : null}
      {query.reactivated === "1" ? <p className="success-message">Funcionário reativado com sucesso.</p> : null}

      <section className="employee-profile-header">
        <div className="employee-profile-identity"><span className="profile-initials">{employee.fullName.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span><div><div className="profile-title-line"><h1>{employee.fullName}</h1><EmployeeStatusBadge status={employee.status} /></div><p>{employee.position} · Matrícula {employee.registrationNumber}</p></div></div>
        <div className="profile-actions"><Link className="secondary-button detail-action" href={`/admin/funcionarios/${employee.id}/editar`}><Edit3 size={17} /> Editar</Link><EmployeeActiveForm employeeId={employee.id} active={employee.isActive} /></div>
      </section>

      <section className="detail-grid" aria-label="Dados do funcionário">
        <article className="detail-section"><div className="form-section-heading"><span><UserRound size={20} /></span><div><h2>Dados pessoais</h2><p>Identificação e contato</p></div></div><dl><div><dt>Nome completo</dt><dd>{employee.fullName}</dd></div><div><dt>CPF</dt><dd>{formatCpf(employee.cpf)}</dd></div><div><dt><Phone size={15} /> Telefone</dt><dd>{employee.phone ?? "Não informado"}</dd></div></dl></article>
        <article className="detail-section"><div className="form-section-heading"><span><BriefcaseBusiness size={20} /></span><div><h2>Dados profissionais</h2><p>Vínculo atual</p></div></div><dl><div><dt><Hash size={15} /> Matrícula</dt><dd>{employee.registrationNumber}</dd></div><div><dt>Cargo</dt><dd>{employee.position}</dd></div><div><dt><CalendarDays size={15} /> Admissão</dt><dd>{formatDate(employee.admissionDate)}</dd></div></dl></article>
      </section>
    </main>
  );
}
