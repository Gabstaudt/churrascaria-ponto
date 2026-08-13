import { ArrowLeft, CalendarCog } from "lucide-react";
import Link from "next/link";
import { ScheduleExceptionForm } from "@/components/schedules/schedule-exception-form";
import { listEligibleEmployees } from "@/services/work-schedule.service";

export default async function ScheduleAdjustmentPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const employees = await listEligibleEmployees();
  return <main className="dashboard-page schedule-form-page"><Link className="back-link" href="/admin/escalas"><ArrowLeft size={17} /> Voltar para escalas</Link><header className="schedule-form-header"><span><CalendarCog size={24} /></span><div><p className="eyebrow">Exceção por data</p><h1>Ajustar escala</h1><p>Registre uma mudança pontual sem alterar a jornada semanal do funcionário.</p></div></header><ScheduleExceptionForm employees={employees} employeeId={typeof query.employeeId === "string" ? query.employeeId : undefined} date={typeof query.date === "string" ? query.date : undefined} /></main>;
}
