import { CalendarCog, CalendarDays, ChevronLeft, ChevronRight, Clock3, Filter, Plus } from "lucide-react";
import Link from "next/link";
import { getScheduleCalendar, listScheduleCalendarFilters, type CalendarSituation } from "@/services/schedule-calendar.service";
import { formatDate } from "@/utils/format";

type View = "day" | "week" | "month";
const situationLabels = { WORK: "Trabalho", OFF: "Folga", NO_SCHEDULE: "Sem jornada" } as const;

function iso(date: Date) { return date.toISOString().slice(0, 10); }
function validDate(value: unknown) { return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : iso(new Date()); }
function range(date: string, view: View) {
  const selected = new Date(`${date}T00:00:00Z`);
  if (view === "day") return { start: date, end: date };
  if (view === "week") { const start = new Date(selected); start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7)); const end = new Date(start); end.setUTCDate(end.getUTCDate() + 6); return { start: iso(start), end: iso(end) }; }
  return { start: `${date.slice(0, 7)}-01`, end: iso(new Date(Date.UTC(selected.getUTCFullYear(), selected.getUTCMonth() + 1, 0))) };
}
function move(date: string, view: View, direction: number) { const result = new Date(`${date}T00:00:00Z`); if (view === "day") result.setUTCDate(result.getUTCDate() + direction); else if (view === "week") result.setUTCDate(result.getUTCDate() + 7 * direction); else result.setUTCMonth(result.getUTCMonth() + direction); return iso(result); }
function url(query: Record<string, string | undefined>) { const params = new URLSearchParams(); Object.entries(query).forEach(([key, value]) => value && params.set(key, value)); return `/admin/escalas?${params}`; }

export default async function ScheduleCalendarPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const view: View = query.view === "day" || query.view === "week" ? query.view : "month";
  const date = validDate(query.date);
  const period = range(date, view);
  const employeeId = typeof query.employeeId === "string" ? query.employeeId : undefined;
  const position = typeof query.position === "string" ? query.position : undefined;
  const situation = query.situation === "WORK" || query.situation === "OFF" || query.situation === "NO_SCHEDULE" ? query.situation as CalendarSituation : undefined;
  const [calendar, filters] = await Promise.all([getScheduleCalendar({ ...period, employeeId, position, situation }), listScheduleCalendarFilters()]);
  const grouped = calendar.rows.reduce((result, row) => { const current = result.get(row.date) ?? []; current.push(row); result.set(row.date, current); return result; }, new Map<string, typeof calendar.rows>());
  const baseQuery = { view, employeeId, position, situation };
  const periodTitle = view === "day" ? formatDate(period.start) : `${formatDate(period.start)} — ${formatDate(period.end)}`;

  return <main className="dashboard-page calendar-page"><div className="page-heading employees-heading"><div><p className="eyebrow">Planejamento operacional</p><h1>Escalas</h1><p>Consulte a previsão válida e registre ajustes específicos por data.</p></div><Link className="primary-button action-button" href="/admin/escalas/ajuste"><Plus size={18} /> Novo ajuste</Link></div>{query.saved === "1" ? <p className="success-message">Ajuste da escala salvo com sucesso.</p> : null}<section className="data-panel calendar-panel"><div className="calendar-controls"><div className="calendar-view-tabs" aria-label="Modo de visualização">{(["day", "week", "month"] as View[]).map((item) => <Link className={view === item ? "active" : ""} href={url({ ...baseQuery, view: item, date })} key={item}>{item === "day" ? "Dia" : item === "week" ? "Semana" : "Mês"}</Link>)}</div><div className="calendar-period"><Link aria-label="Período anterior" href={url({ ...baseQuery, date: move(date, view, -1) })}><ChevronLeft size={19} /></Link><div><CalendarDays size={18} /><strong>{periodTitle}</strong></div><Link aria-label="Próximo período" href={url({ ...baseQuery, date: move(date, view, 1) })}><ChevronRight size={19} /></Link></div></div><form className="calendar-filters"><span><Filter size={17} /> Filtros</span><select name="employeeId" defaultValue={employeeId ?? ""}><option value="">Todos os funcionários</option>{filters.employees.map((employee) => <option value={employee.id} key={employee.id}>{employee.fullName}</option>)}</select><select name="position" defaultValue={position ?? ""}><option value="">Todos os cargos</option>{filters.positions.map((item) => <option value={item} key={item}>{item}</option>)}</select><select name="situation" defaultValue={situation ?? ""}><option value="">Todas as situações</option><option value="WORK">Trabalho</option><option value="OFF">Folga</option><option value="NO_SCHEDULE">Sem jornada</option></select><input type="hidden" name="view" value={view} /><input type="hidden" name="date" value={date} /><button type="submit">Aplicar</button></form><section className="calendar-results">{calendar.rows.length ? [...grouped.entries()].map(([day, rows]) => <article className="calendar-date" key={day}><header><div><strong>{new Intl.DateTimeFormat("pt-BR", { weekday: "long", timeZone: "UTC" }).format(new Date(`${day}T00:00:00Z`))}</strong><span>{formatDate(day)}</span></div><small>{rows.length} {rows.length === 1 ? "registro" : "registros"}</small></header><div>{rows.map((row) => <div className="calendar-entry" key={`${row.employee.id}-${day}`}><span className="calendar-person"><strong>{row.employee.fullName}</strong><small>{row.employee.position} · {row.employee.registrationNumber}</small></span><span className={`calendar-situation situation-${row.situation.toLowerCase()}`}>{situationLabels[row.situation]}</span><span className="calendar-hours"><Clock3 size={16} />{row.situation === "WORK" ? <strong>{row.startTime?.slice(0, 5)} — {row.endTime?.slice(0, 5)}</strong> : <strong>Sem horário</strong>}<small>{row.source === "EXCEPTION" ? row.reason : row.scheduleName ?? "Nenhuma jornada vigente"}</small></span><Link className="calendar-adjust" href={`/admin/escalas/ajuste?employeeId=${row.employee.id}&date=${day}`}><CalendarCog size={16} /> Ajustar</Link></div>)}</div></article>) : <div className="empty-state"><CalendarDays size={30} /><h2>Nenhuma previsão encontrada</h2><p>Altere os filtros ou cadastre uma jornada para a equipe.</p></div>}</section></section></main>;
}
