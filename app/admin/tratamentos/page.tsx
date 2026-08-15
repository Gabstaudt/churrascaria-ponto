import { ArrowLeft, Calculator, Clock3, History, ShieldCheck, Timer, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TimeAdjustmentForm } from "@/components/time-adjustments/time-adjustment-form";
import { getDailyAttendanceCalculation } from "@/services/attendance.service";
import { getEmployeeById } from "@/services/employee.service";
import { employeeIdSchema } from "@/validations/employee";
import { timeEntrySourceLabel } from "@/utils/time-entry-source";

const labels = { ADD_ENTRY: "Marcação incluída", IGNORE_ENTRY: "Marcação desconsiderada", FORGOTTEN_EXIT: "Saída esquecida", JUSTIFY_LATE: "Atraso justificado", JUSTIFY_EARLY_EXIT: "Saída antecipada justificada" } as const;
function dateTime(value: Date) { return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Belem" }).format(value); }
function time(value: Date) { return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Belem" }).format(value); }
function minutes(value: number | null) {
  if (value === null) return "Pendente";
  const sign = value < 0 ? "−" : ""; const absolute = Math.abs(value); const hours = Math.floor(absolute / 60); const rest = absolute % 60;
  return hours ? `${sign}${hours}h ${String(rest).padStart(2, "0")}min` : `${sign}${rest} min`;
}

export default async function TreatmentsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const employeeId = typeof query.employeeId === "string" ? query.employeeId : "";
  const date = typeof query.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(query.date) ? query.date : "";
  if (!employeeIdSchema.safeParse(employeeId).success || !date) notFound();
  const [employee, attendance] = await Promise.all([getEmployeeById(employeeId), getDailyAttendanceCalculation(employeeId, date)]);
  if (!employee || !attendance) notFound();
  const { originalEntries: entries, adjustments, calculation } = attendance;
  const cards = [
    { label: "Previsto", value: calculation.plannedMinutes, icon: Clock3 },
    { label: "Trabalhado", value: calculation.workedMinutes, icon: Timer },
    { label: "Atraso", value: calculation.delayMinutes, icon: TrendingDown, note: calculation.lateJustified ? "Justificado" : undefined },
    { label: "Saída antecipada", value: calculation.earlyDepartureMinutes, icon: TrendingDown, note: calculation.earlyDepartureJustified ? "Justificada" : undefined },
    { label: "Horas extras", value: calculation.overtimeMinutes, icon: TrendingUp },
    { label: "Saldo", value: calculation.balanceMinutes, icon: Calculator },
  ];
  return <main className="dashboard-page treatment-page">
    <Link className="back-link" href={`/admin?date=${date}`}><ArrowLeft size={17} /> Voltar para o painel</Link>
    <div className="page-heading compact-heading"><div><p className="eyebrow">Tratamento de ponto</p><h1>{employee.fullName}</h1><p>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`))} · Matrícula {employee.registrationNumber}</p></div><span className="status-pill"><ShieldCheck size={15} /> Originais protegidos</span></div>
    {query.saved === "1" ? <p className="success-message">Tratamento registrado e apuração recalculada com sucesso.</p> : null}
    <section className="attendance-calculation" aria-label="Apuração diária"><header><div><Calculator size={19} /><span><strong>Apuração diária</strong><small>Versão {calculation.version} · valores em minutos inteiros</small></span></div><em className={`calculation-status status-${calculation.status.toLowerCase()}`}>{calculation.status === "COMPLETE" ? "Completa" : calculation.status === "INCOMPLETE" ? "Par incompleto" : "Sem marcações"}</em></header><div className="attendance-metrics">{cards.map(({ label, value, icon: Icon, note }) => <article key={label}><Icon size={18} /><span><small>{label}</small><strong>{minutes(value)}</strong>{note ? <em>{note}</em> : null}</span></article>)}</div><details><summary>Como este resultado foi calculado</summary><div>{calculation.explanation.map((item) => <article key={item.code}><strong>{item.label}</strong><p>{item.detail}</p><small>Origem: {item.source}</small></article>)}</div></details></section>
    <div className="treatment-layout"><div className="treatment-column"><section className="data-panel treatment-panel"><header><Clock3 size={19} /><div><h2>Marcações originais</h2><p>Eventos imutáveis recebidos pelo sistema.</p></div><span>{entries.length}</span></header>{entries.length ? <div className="treatment-entries">{entries.map((entry) => <div key={entry.id}><strong>{time(entry.occurredAt)}</strong><small>{timeEntrySourceLabel(entry.source)}</small><em>{entry.externalId}</em></div>)}</div> : <div className="availability-empty">Nenhuma marcação original nesta data.</div>}</section><section className="data-panel treatment-panel"><header><History size={19} /><div><h2>Histórico de tratamentos</h2><p>Eventos administrativos adicionados sem alterar os originais.</p></div><span>{adjustments.length}</span></header>{adjustments.length ? <div className="treatment-history">{adjustments.map((item) => <article key={item.id}><div><strong>{labels[item.type]}</strong><small>{dateTime(item.createdAt)} · {item.performedByName}</small></div>{item.adjustedAt ? <span>{time(item.adjustedAt)}</span> : null}<p>{item.reason}</p></article>)}</div> : <div className="availability-empty">Nenhum tratamento registrado.</div>}</section></div><aside className="data-panel treatment-create"><header><h2>Novo tratamento</h2><p>O registro será permanente, auditável e provocará novo cálculo.</p></header><TimeAdjustmentForm employeeId={employeeId} date={date} entries={entries.map((entry) => ({ id: entry.id, occurredAt: entry.occurredAt }))} /></aside></div>
  </main>;
}
