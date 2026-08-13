import { ArrowLeft, CalendarPlus, CalendarRange, Clock3, Coffee, PencilLine, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getWorkScheduleById } from "@/services/work-schedule.service";
import { formatDate } from "@/utils/format";
import { employeeIdSchema } from "@/validations/employee";

const weekDays = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
const shortTime = (value: string | null) => value?.slice(0, 5) ?? "—";

export default async function ScheduleDetailPage({ params, searchParams }: PageProps<"/admin/jornadas/[id]">) {
  const { id } = await params;
  if (!employeeIdSchema.safeParse(id).success) notFound();
  const schedule = await getWorkScheduleById(id);
  if (!schedule) notFound();
  const query = await searchParams;
  const workDays = schedule.days.filter((day) => day.isWorkDay).length;

  return <main className="dashboard-page schedule-detail-page"><Link className="back-link" href="/admin/jornadas"><ArrowLeft size={17} /> Voltar para jornadas</Link>{query.created === "1" ? <p className="success-message">Jornada cadastrada com sucesso.</p> : null}{query.updated === "1" ? <p className="success-message">Jornada atualizada com sucesso.</p> : null}<section className="schedule-detail-hero"><div><span className="schedule-detail-icon"><CalendarRange size={25} /></span><div><p className="eyebrow">{schedule.name}</p><h1>{schedule.employeeName}</h1><p>{schedule.position} · Matrícula {schedule.registrationNumber}</p></div></div><div className="schedule-detail-actions"><Link className="secondary-button detail-action" href={`/admin/jornadas/${schedule.id}/editar`}><PencilLine size={17} /> Editar</Link><Link className="primary-button action-button" href={`/admin/jornadas/nova?employeeId=${schedule.employeeId}`}><CalendarPlus size={17} /> Nova vigência</Link></div></section><section className="schedule-summary"><div><CalendarRange size={18} /><span><small>Vigência</small><strong>{formatDate(schedule.validFrom)} — {schedule.validTo ? formatDate(schedule.validTo) : "sem data final"}</strong></span></div><div><ShieldCheck size={18} /><span><small>Semana prevista</small><strong>{workDays} {workDays === 1 ? "dia de trabalho" : "dias de trabalho"}</strong></span></div></section><section className="schedule-week" aria-label="Horários da semana">{schedule.days.map((day) => <article className={day.isWorkDay ? "schedule-week-day" : "schedule-week-day off"} key={day.id}><div className="schedule-week-name"><strong>{weekDays[day.dayOfWeek]}</strong><span>{day.isWorkDay ? "Trabalho" : "Folga"}</span></div>{day.isWorkDay ? <div className="schedule-week-data"><span><Clock3 size={16} /><small>Horário</small><strong>{shortTime(day.startTime)} – {shortTime(day.endTime)}</strong></span><span><Coffee size={16} /><small>Intervalo</small><strong>{day.breakStartTime ? `${shortTime(day.breakStartTime)} – ${shortTime(day.breakEndTime)}` : "Sem intervalo"}</strong></span><span><ShieldCheck size={16} /><small>Tolerância</small><strong>{day.toleranceMinutes} min</strong></span></div> : <p>Nenhum horário previsto para este dia.</p>}</article>)}</section><p className="immutable-note">Alterações ficam registradas na auditoria. Para iniciar outro período sem substituir esta escala, utilize “Nova vigência”.</p></main>;
}
