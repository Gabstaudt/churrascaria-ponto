import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { EmployeeForm } from "@/components/employees/employee-form";

export default function NewEmployeePage() {
  return (
    <main className="dashboard-page form-page">
      <Link className="back-link" href="/admin/funcionarios"><ArrowLeft size={17} /> Voltar para funcionários</Link>
      <div className="page-heading compact-heading"><div><p className="eyebrow">Novo cadastro</p><h1>Cadastrar funcionário</h1><p>Inclua os dados pessoais e profissionais para iniciar o vínculo.</p></div></div>
      <div className="required-note"><span>*</span> Campos obrigatórios</div>
      <EmployeeForm />
    </main>
  );
}
