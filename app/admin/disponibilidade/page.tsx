import { ArrowRightLeft, CalendarOff, Pencil, Plus, Stethoscope, Trash2, Umbrella } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { deleteAvailabilityAction, reviewDayOffSwapAction } from "@/actions/availability";
import { listAvailability } from "@/services/availability.service";
import { formatDate } from "@/utils/format";

const swapLabels = { PENDING: "Pendente", APPROVED: "Aprovada", REJECTED: "Rejeitada" } as const;
const leaveLabels = { MEDICAL: "Médico", PERSONAL: "Pessoal", LEGAL: "Legal", OTHER: "Outro" } as const;

export default async function AvailabilityPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const data = await listAvailability();
  return <main className="dashboard-page availability-page"><div className="page-heading employees-heading"><div><p className="eyebrow">Disponibilidade</p><h1>Folgas e ausências</h1><p>Gerencie exceções de disponibilidade sem perder o histórico.</p></div><Link className="primary-button action-button" href="/admin/disponibilidade/nova"><Plus size={18} /> Novo registro</Link></div>
    {query.saved === "1" ? <p className="success-message">Registro salvo com sucesso.</p> : null}
    {query.deleted === "1" ? <p className="success-message">Registro excluído com sucesso.</p> : null}
    {query.reviewed === "1" ? <p className="success-message">Solicitação analisada com sucesso.</p> : null}
    {query.reviewError === "1" ? <p className="form-error availability-alert">Não foi possível analisar a solicitação.</p> : null}
    {query.error === "delete" ? <p className="form-error availability-alert">Não foi possível excluir o registro.</p> : null}
    {query.error === "notfound" ? <p className="form-error availability-alert">Registro não encontrado.</p> : null}
    <div className="availability-grid">
      <AvailabilitySection title="Trocas de folga" subtitle="Solicitações e aprovações" icon={<ArrowRightLeft size={19} />} count={data.swaps.length}>{data.swaps.map((item) => <article className="availability-record" key={item.id}><div><strong>{item.employeeName}</strong><small>{item.position}</small></div><div><small>Troca</small><strong>{formatDate(item.dayOffDate)} → {formatDate(item.workDate)}</strong><p>{item.reason}</p></div><div className="availability-record-status-actions"><span className={`swap-status status-${item.status.toLowerCase()}`}>{swapLabels[item.status]}</span><AvailabilityRowActions kind="SWAP" id={item.id} /></div>{item.status === "PENDING" ? <form className="swap-review"><input name="reason" placeholder="Motivo da decisão" minLength={5} required /><button formAction={reviewDayOffSwapAction.bind(null, item.id, "APPROVED")}>Aprovar</button><button className="reject" formAction={reviewDayOffSwapAction.bind(null, item.id, "REJECTED")}>Rejeitar</button></form> : null}</article>)}</AvailabilitySection>
      <AvailabilitySection title="Folgas" subtitle="Folgas pontuais autorizadas" icon={<CalendarOff size={19} />} count={data.daysOff.length}>{data.daysOff.map((item) => <AvailabilityRow key={item.id} kind="DAY_OFF" id={item.id} name={item.employeeName} position={item.position} period={formatDate(item.date)} reason={item.reason} />)}</AvailabilitySection>
      <AvailabilitySection title="Férias" subtitle="Períodos programados" icon={<Umbrella size={19} />} count={data.vacations.length}>{data.vacations.map((item) => <AvailabilityRow key={item.id} kind="VACATION" id={item.id} name={item.employeeName} position={item.position} period={`${formatDate(item.startDate)} — ${formatDate(item.endDate)}`} reason={item.reason} />)}</AvailabilitySection>
      <AvailabilitySection title="Afastamentos" subtitle="Indisponibilidades registradas" icon={<Stethoscope size={19} />} count={data.leaves.length}>{data.leaves.map((item) => <AvailabilityRow key={item.id} kind="LEAVE" id={item.id} name={item.employeeName} position={item.position} period={`${formatDate(item.startDate)} — ${formatDate(item.endDate)}`} reason={`${leaveLabels[item.type]} · ${item.reason}`} />)}</AvailabilitySection>
    </div>
  </main>;
}

function AvailabilitySection({ title, subtitle, icon, count, children }: { title: string; subtitle: string; icon: ReactNode; count: number; children: ReactNode }) { return <section className="data-panel availability-section"><header><span>{icon}</span><div><h2>{title}</h2><p>{subtitle}</p></div><em>{count}</em></header>{count ? <div className="availability-records">{children}</div> : <div className="availability-empty">Nenhum registro.</div>}</section>; }
function AvailabilityRowActions({ kind, id }: { kind: "DAY_OFF" | "SWAP" | "VACATION" | "LEAVE"; id: string }) { return <div className="availability-row-actions"><Link href={`/admin/disponibilidade/${kind}/${id}/editar`} aria-label="Editar"><Pencil size={15} /></Link><form action={deleteAvailabilityAction.bind(null, kind, id)}><button type="submit" aria-label="Excluir"><Trash2 size={15} /></button></form></div>; }
function AvailabilityRow({ kind, id, name, position, period, reason }: { kind: "DAY_OFF" | "VACATION" | "LEAVE"; id: string; name: string; position: string; period: string; reason: string }) { return <article className="availability-record simple"><div><strong>{name}</strong><small>{position}</small></div><div><strong>{period}</strong><p>{reason}</p></div><AvailabilityRowActions kind={kind} id={id} /></article>; }
