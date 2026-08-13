import { ArrowLeft, Clock3, Database, ShieldCheck, UserRound } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/auth/session";
import { getAuditLogById } from "@/services/audit.service";

function dateTime(value: Date) { return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short", timeZone: "America/Belem" }).format(value); }
function Payload({ title, value }: { title: string; value: unknown }) {
  return <section className="data-panel audit-payload"><header><div><h2>{title}</h2><p>Campos confidenciais são ocultados automaticamente.</p></div><ShieldCheck size={19} /></header>{value == null ? <div className="availability-empty">Não há dados para esta etapa.</div> : <pre>{JSON.stringify(value, null, 2)}</pre>}</section>;
}

export default async function AuditDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const item = await getAuditLogById(id);
  if (!item) notFound();
  return <main className="dashboard-page audit-detail-page">
    <Link className="back-link" href="/admin/auditoria"><ArrowLeft size={17} /> Voltar para auditoria</Link>
    <section className="audit-detail-hero"><div><span><ShieldCheck size={24} /></span><div><p className="eyebrow">Evento auditável</p><h1>{item.action}</h1><p>{item.entity} · {item.entityId}</p></div></div></section>
    <section className="audit-detail-summary"><article><UserRound size={18} /><span><small>Responsável</small><strong>{item.performedByName}</strong><em>{item.performedByEmail}</em></span></article><article><Clock3 size={18} /><span><small>Data e hora</small><strong>{dateTime(item.createdAt)}</strong></span></article><article><Database size={18} /><span><small>Motivo informado</small><strong>{item.reason ?? "Não informado"}</strong></span></article></section>
    <div className="audit-comparison"><Payload title="Antes" value={item.before} /><Payload title="Depois" value={item.after} /></div>
    <p className="immutable-note">Este registro é somente para consulta. Senhas, tokens, sessões e CPF são ocultados pela política de auditoria.</p>
  </main>;
}
