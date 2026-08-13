import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { TimeEntrySimulatorForm } from "@/components/time-entries/time-entry-simulator-form";
import { listEligibleEmployees } from "@/services/work-schedule.service";

export default async function SimulateTimeEntriesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const employees = await listEligibleEmployees();
  return <main className="dashboard-page form-page"><Link className="back-link" href="/admin/marcacoes"><ArrowLeft size={17} /> Voltar para marcações</Link><div className="page-heading compact-heading"><div><p className="eyebrow">Ambiente de desenvolvimento</p><h1>Simular marcações</h1><p>Gere registros controlados para validar os próximos fluxos do sistema.</p></div></div><TimeEntrySimulatorForm employees={employees} selectedEmployeeId={typeof query.employeeId === "string" ? query.employeeId : undefined} /></main>;
}
