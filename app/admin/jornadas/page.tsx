import { CalendarDays, Plus } from "lucide-react";
import Link from "next/link";
import { listWorkSchedules } from "@/services/work-schedule.service";
import { formatDate } from "@/utils/format";

export default async function SchedulesPage() {
  const schedules = await listWorkSchedules();
  return <main className="dashboard-page"><div className="page-heading employees-heading"><div><p className="eyebrow">Planejamento</p><h1>Jornadas</h1><p>Horários semanais e vigências dos funcionários.</p></div><Link className="primary-button action-button" href="/admin/jornadas/nova"><Plus size={18} /> Nova jornada</Link></div><section className="data-panel"><div className="table-summary"><strong>{schedules.length}</strong> {schedules.length === 1 ? "jornada cadastrada" : "jornadas cadastradas"}</div>{schedules.length ? <div className="schedule-list">{schedules.map((schedule) => <Link href={`/admin/jornadas/${schedule.id}`} className="schedule-row" key={schedule.id}><span><strong>{schedule.employeeName}</strong><small>{schedule.position}</small></span><span><strong>{schedule.name}</strong><small>{formatDate(schedule.validFrom)} até {schedule.validTo ? formatDate(schedule.validTo) : "sem data final"}</small></span></Link>)}</div> : <div className="empty-state"><CalendarDays size={30} /><h2>Nenhuma jornada cadastrada</h2><p>Crie a primeira jornada semanal da equipe.</p><Link href="/admin/jornadas/nova">Cadastrar jornada</Link></div>}</section></main>;
}
