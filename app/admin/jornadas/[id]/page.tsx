import { ArrowLeft, CalendarPlus } from "lucide-react";
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
  return <main className="dashboard-page employee-detail-page"><Link className="back-link" href="/admin/jornadas"><ArrowLeft size={17} /> Voltar para jornadas</Link>{query.created === "1" ? <p className="success-message">Jornada cadastrada com sucesso.</p> : null}<section className="employee-profile-header"><div><p className="eyebrow">{schedule.name}</p><div className="profile-title-line"><h1>{schedule.employeeName}</h1></div><p>{schedule.position} · Matrícula {schedule.registrationNumber}</p></div><Link className="secondary-button detail-action" href={`/admin/jornadas/nova?employeeId=${schedule.employeeId}`}><CalendarPlus size={17} /> Nova vigência</Link></section><section className="schedule-validity"><div><small>Início</small><strong>{formatDate(schedule.validFrom)}</strong></div><div><small>Fim</small><strong>{schedule.validTo ? formatDate(schedule.validTo) : "Sem data final"}</strong></div></section><section className="schedule-detail-list">{schedule.days.map((day) => <article className={day.isWorkDay ? "" : "off"} key={day.id}><strong>{weekDays[day.dayOfWeek]}</strong>{day.isWorkDay ? <><span>{shortTime(day.startTime)} – {shortTime(day.endTime)}</span><small>Intervalo: {day.breakStartTime ? `${shortTime(day.breakStartTime)} – ${shortTime(day.breakEndTime)}` : "não informado"} · Tolerância: {day.toleranceMinutes} min</small></> : <span>Folga</span>}</article>)}</section><p className="immutable-note">Jornadas históricas não são editadas. Para alterar horários, encerre a vigência anterior e cadastre uma nova vigência sem sobreposição.</p></main>;
}
