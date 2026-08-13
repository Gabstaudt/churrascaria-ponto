import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { AvailabilityForm } from "@/components/availability/availability-form";
import { listEligibleEmployees } from "@/services/work-schedule.service";

export default async function NewAvailabilityPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const employees = await listEligibleEmployees();
  const kind = query.kind === "SWAP" || query.kind === "VACATION" || query.kind === "LEAVE" ? query.kind : "DAY_OFF";
  return <main className="dashboard-page form-page"><Link className="back-link" href="/admin/disponibilidade"><ArrowLeft size={17} /> Voltar para disponibilidade</Link><div className="page-heading compact-heading"><div><p className="eyebrow">Planejamento da equipe</p><h1>Novo registro</h1><p>Cadastre uma folga, troca, férias ou afastamento.</p></div></div><AvailabilityForm employees={employees} initialKind={kind} selectedEmployeeId={typeof query.employeeId === "string" ? query.employeeId : undefined} /></main>;
}
