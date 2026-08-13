import { ArrowLeft, CalendarPlus } from "lucide-react";
import Link from "next/link";
import { WorkScheduleForm } from "@/components/schedules/work-schedule-form";
import { listEligibleEmployees } from "@/services/work-schedule.service";

export default async function NewSchedulePage({ searchParams }: PageProps<"/admin/jornadas/nova">) {
  const query = await searchParams;
  const employees = await listEligibleEmployees();
  return <main className="dashboard-page schedule-form-page"><Link className="back-link" href="/admin/jornadas"><ArrowLeft size={17} /> Voltar para jornadas</Link><header className="schedule-form-header"><span><CalendarPlus size={24} /></span><div><p className="eyebrow">Nova jornada</p><h1>Criar jornada de trabalho</h1><p>Defina a vigência e configure os horários de cada dia da semana.</p></div></header><WorkScheduleForm employees={employees} selectedEmployeeId={typeof query.employeeId === "string" ? query.employeeId : undefined} /></main>;
}
