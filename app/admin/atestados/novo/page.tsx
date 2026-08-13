import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { MedicalCertificateForm } from "@/components/medical-certificates/medical-certificate-form";
import { listEligibleEmployees } from "@/services/work-schedule.service";

function value(input: string | string[] | undefined) { return typeof input === "string" ? input : undefined; }
export default async function NewCertificatePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams; const employees = await listEligibleEmployees();
  return <main className="dashboard-page form-page certificate-form-page"><Link className="back-link" href="/admin/atestados"><ArrowLeft size={17} /> Voltar para atestados</Link><div className="page-heading compact-heading"><div><p className="eyebrow">Documento protegido</p><h1>Novo atestado</h1><p>O envio realizado por administrador já será registrado como aprovado.</p></div></div><MedicalCertificateForm employees={employees} employeeId={value(query.employeeId)} absenceId={value(query.absenceId)} date={value(query.date)} /></main>;
}
