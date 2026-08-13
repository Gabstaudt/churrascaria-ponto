import { AlertTriangle, CalendarDays, CheckCircle2, Clock3, Coffee, SearchCheck, TimerOff, UsersRound } from "lucide-react";
import Link from "next/link";
import { belemDate, type DailyStatus } from "@/services/daily-attendance-core";
import { getDailyAttendance } from "@/services/daily-attendance.service";

const labels: Record<DailyStatus, string> = { EXPECTED: "Previsto", PRESENT: "Presente", LATE: "Atrasado", LATE_JUSTIFIED: "Atraso justificado", INCOMPLETE: "Incompleto", POSSIBLE_ABSENCE: "Possível ausência", ABSENCE_UNJUSTIFIED: "Falta não justificada", ABSENCE_JUSTIFIED: "Ausência justificada", OFF: "Folga", VACATION: "Férias", LEAVE: "Afastamento", NO_SCHEDULE: "Sem jornada" };
function validDate(value: unknown) { return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : belemDate(new Date()); }
function time(value: Date) { return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Belem" }).format(value); }

export default async function AdminPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const date = validDate(query.date);
  const report = await getDailyAttendance(date);
  const cards = [
    { label: "Funcionários ativos", value: report.summary.active, icon: UsersRound, tone: "neutral" },
    { label: "Presentes", value: report.summary.present, icon: CheckCircle2, tone: "success" },
    { label: "Atrasados", value: report.summary.late, icon: Clock3, tone: "warning" },
    { label: "Possíveis ausências", value: report.summary.possibleAbsence, icon: TimerOff, tone: "danger" },
    { label: "Folgas e ausências", value: report.summary.off, icon: Coffee, tone: "info" },
    { label: "Pendências", value: report.summary.pending, icon: AlertTriangle, tone: "warning" },
  ];
  return <main className="dashboard-page operational-page"><div className="page-heading employees-heading"><div><p className="eyebrow">Situação diária</p><h1>Painel operacional</h1><p>Compare a previsão de trabalho com as marcações originais da equipe.</p></div><form className="operational-date"><label htmlFor="date"><CalendarDays size={17} /> Data</label><input id="date" name="date" type="date" defaultValue={date} /><button type="submit">Consultar</button></form></div><section className="operational-summary" aria-label="Resumo do dia">{cards.map(({ label, value, icon: Icon, tone }) => <article className={`tone-${tone}`} key={label}><span><Icon size={20} /></span><div><strong>{value}</strong><small>{label}</small></div></article>)}</section><section className="data-panel operational-panel"><header><div><h2>Equipe no dia</h2><p>Previsão, marcações realizadas e situação calculada.</p></div><span>{report.rows.length} registros</span></header>{report.rows.length ? <div className="operational-list">{report.rows.map((row) => <article key={row.employee.id}><Link className="operational-person" href={`/admin/funcionarios/${row.employee.id}?tab=timesheet`}><strong>{row.employee.fullName}</strong><small>{row.employee.position} · {row.employee.registrationNumber}</small></Link><div className="operational-planned"><small>Previsão</small><strong>{row.situation === "WORK" ? `${row.startTime?.slice(0, 5) ?? "--:--"} — ${row.endTime?.slice(0, 5) ?? "--:--"}` : row.scheduleName ?? labels[row.status]}</strong></div><div className="operational-actual"><small>Realizado</small><strong>{row.entries.length ? row.entries.map((entry) => time(entry.occurredAt)).join(" · ") : "Nenhuma marcação"}</strong>{row.pairs.some((pair) => !pair.exit) ? <em>Par incompleto</em> : null}</div><span className={`daily-status daily-${row.status.toLowerCase()}`}>{labels[row.status]}</span><Link className="operational-check" href={row.status === "POSSIBLE_ABSENCE" || row.status === "ABSENCE_UNJUSTIFIED" || row.status === "ABSENCE_JUSTIFIED" ? `/admin/faltas?employeeId=${row.employee.id}&date=${date}` : `/admin/tratamentos?employeeId=${row.employee.id}&date=${date}`}><SearchCheck size={16} /> Conferir</Link></article>)}</div> : <div className="empty-state"><UsersRound size={30} /><h2>Nenhum funcionário encontrado</h2><p>Não existem funcionários ativos para a data consultada.</p></div>}</section><p className="operational-note">“Possível ausência” e “incompleto” são ocorrências que precisam de análise. O sistema não declara falta definitiva nem altera marcações originais.</p></main>;
}
