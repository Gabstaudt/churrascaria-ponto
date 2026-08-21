import { ArrowLeft, CalendarCog, History } from "lucide-react";
import Link from "next/link";
import { ScheduleExceptionForm } from "@/components/schedules/schedule-exception-form";
import { getTimeBankAccumulatedBalance } from "@/services/time-bank.service";
import { listEligibleEmployees } from "@/services/work-schedule.service";

function formatMinutes(value: number) { const sign = value > 0 ? "+" : value < 0 ? "−" : ""; const absolute = Math.abs(value); const hours = Math.floor(absolute / 60); const minutes = absolute % 60; return hours ? `${sign}${hours}h ${String(minutes).padStart(2, "0")}min` : `${sign}${minutes} min`; }

export default async function ScheduleAdjustmentPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const employeeId = typeof query.employeeId === "string" ? query.employeeId : undefined;
  const [employees, balance] = await Promise.all([listEligibleEmployees(), employeeId ? getTimeBankAccumulatedBalance(employeeId) : Promise.resolve(undefined)]);
  return <main className="dashboard-page schedule-form-page"><Link className="back-link" href="/admin/escalas"><ArrowLeft size={17} /> Voltar para escalas</Link><header className="schedule-form-header"><span><CalendarCog size={24} /></span><div><p className="eyebrow">Exceção por data</p><h1>Ajustar escala</h1><p>Registre uma mudança pontual sem alterar a jornada semanal do funcionário. Útil também para escalas de compensação de horas — o próprio horário estendido já credita o banco de horas quando o período for processado.</p></div></header>{balance !== undefined ? <div className={`form-alert${balance < 0 ? " warning" : ""}`}><History size={18} /><span>Saldo atual do banco de horas: <strong>{formatMinutes(balance)}</strong>. <Link href="/admin/banco-horas">Ver extrato</Link></span></div> : null}<ScheduleExceptionForm employees={employees} employeeId={employeeId} date={typeof query.date === "string" ? query.date : undefined} /></main>;
}
