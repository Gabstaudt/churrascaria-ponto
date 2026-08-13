import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { EmployeeForm } from "@/components/employees/employee-form";

export default function NewEmployeePage() {
  return (
    <main className="dashboard-page form-page">
      <Link className="back-link" href="/admin/funcionarios"><ArrowLeft size={17} /> Voltar para funcionários</Link>
      <div className="page-heading"><div><p className="eyebrow">Novo cadastro</p><h1>Cadastrar funcionário</h1><p>Preencha os dados profissionais. Campos marcados são obrigatórios.</p></div></div>
      <section className="form-panel"><EmployeeForm /></section>
    </main>
  );
}
