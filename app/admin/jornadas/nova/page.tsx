import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { WorkScheduleForm } from "@/components/schedules/work-schedule-form";
import { listEligibleEmployees } from "@/services/work-schedule.service";

export default async function NewSchedulePage({ searchParams }: PageProps<"/admin/jornadas/nova">) {
  const query = await searchParams;
  const employees = await listEligibleEmployees();
  return <main className="dashboard-page form-page schedule-form-page"><Link className="back-link" href="/admin/jornadas"><ArrowLeft size={17} /> Voltar para jornadas</Link><div className="page-heading compact-heading"><div><p className="eyebrow">Nova vigência</p><h1>Cadastrar jornada</h1><p>Defina os horários previstos para cada dia da semana.</p></div></div><WorkScheduleForm employees={employees} selectedEmployeeId={typeof query.employeeId === "string" ? query.employeeId : undefined} /></main>;
}
