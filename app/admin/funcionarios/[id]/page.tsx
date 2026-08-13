import { ArrowLeft, BriefcaseBusiness, CalendarDays, Edit3, FileText, Hash, Phone, PhoneCall, UserRound } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EmployeeActiveForm } from "@/components/employees/employee-active-form";
import { EmployeeStatusBadge } from "@/components/employees/employee-status-badge";
import { getEmployeeById } from "@/services/employee.service";
import { formatCpf, formatDate, formatPhone } from "@/utils/format";
import { employeeIdSchema } from "@/validations/employee";

function Info({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return <div className="employee-profile-field"><dt>{icon}{label}</dt><dd>{value}</dd></div>;
}

export default async function EmployeeDetailPage({ params, searchParams }: PageProps<"/admin/funcionarios/[id]">) {
  const { id } = await params;
  const parsedId = employeeIdSchema.safeParse(id);
  if (!parsedId.success) notFound();
  const employee = await getEmployeeById(parsedId.data);
  if (!employee) notFound();
  const query = await searchParams;
  const initials = employee.fullName.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  return <main className="dashboard-page employee-profile-page">
    <Link className="back-link" href="/admin/funcionarios"><ArrowLeft size={17} /> Voltar para funcionários</Link>
    {query.updated === "1" ? <p className="success-message">Dados atualizados com sucesso.</p> : null}
    {query.deactivated === "1" ? <p className="success-message neutral">Funcionário inativado. O histórico foi preservado.</p> : null}
    {query.reactivated === "1" ? <p className="success-message">Funcionário reativado com sucesso.</p> : null}

    <section className="employee-profile-hero">
      <div className="employee-profile-person"><span className="employee-profile-avatar">{initials}</span><div className="employee-profile-title"><div><h1>{employee.fullName}</h1><EmployeeStatusBadge status={employee.status} /></div><p>{employee.position}<span aria-hidden="true">•</span>Matrícula {employee.registrationNumber}</p></div></div>
      <div className="employee-profile-actions"><Link className="secondary-button detail-action" href={`/admin/funcionarios/${employee.id}/editar`}><Edit3 size={17} /> Editar dados</Link><EmployeeActiveForm employeeId={employee.id} active={employee.isActive} /></div>
    </section>

    <div className="employee-profile-layout">
      <div className="employee-profile-main">
        <section className="employee-profile-card"><header><span><UserRound size={19} /></span><div><h2>Dados pessoais</h2><p>Identificação e contato</p></div></header><dl className="employee-profile-fields"><Info label="Nome completo" value={employee.fullName} /><Info label="CPF" value={formatCpf(employee.cpf)} /><Info label="Telefone" value={employee.phone ? formatPhone(employee.phone) : "Não informado"} icon={<Phone size={14} />} /></dl></section>
        <section className="employee-profile-card"><header><span><BriefcaseBusiness size={19} /></span><div><h2>Dados profissionais</h2><p>Informações do vínculo</p></div></header><dl className="employee-profile-fields"><Info label="Matrícula" value={employee.registrationNumber} icon={<Hash size={14} />} /><Info label="Cargo" value={employee.position} /><Info label="Data de admissão" value={formatDate(employee.admissionDate)} icon={<CalendarDays size={14} />} /><Info label="Carteira de trabalho" value={employee.workCardNumber ?? "Não informada"} /></dl></section>
      </div>
      <aside className="employee-profile-side">
        <section className="employee-profile-card"><header><span><PhoneCall size={19} /></span><div><h2>Contato de emergência</h2><p>Pessoa para situações urgentes</p></div></header>{employee.emergencyContactName || employee.emergencyContactPhone ? <dl><Info label="Nome" value={employee.emergencyContactName ?? "Não informado"} /><Info label="Parentesco ou relação" value={employee.emergencyContactRelationship ?? "Não informado"} /><Info label="Telefone" value={employee.emergencyContactPhone ? formatPhone(employee.emergencyContactPhone) : "Não informado"} icon={<Phone size={14} />} /></dl> : <div className="employee-profile-empty">Nenhum contato de emergência informado.</div>}</section>
        <section className="employee-profile-card"><header><span><FileText size={19} /></span><div><h2>Documentos</h2><p>Anexos do funcionário</p></div></header><div className="employee-profile-documents"><FileText size={26} /><strong>Nenhum documento anexado</strong><p>O envio será habilitado com o armazenamento seguro Cloudflare R2.</p><button type="button" disabled>Adicionar documento</button></div></section>
      </aside>
    </div>
  </main>;
}
