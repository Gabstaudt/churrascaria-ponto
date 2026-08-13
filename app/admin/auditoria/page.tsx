import { ArrowLeft, ChevronLeft, ChevronRight, Eye, Filter, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { requireAdmin } from "@/auth/session";
import { listAuditFilterOptions, listAuditLogs } from "@/services/audit.service";

function text(value: string | string[] | undefined) { return typeof value === "string" ? value : undefined; }
function validDate(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value ? value : undefined;
}
function dateTime(value: Date) { return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Belem" }).format(value); }
function pageUrl(query: Record<string, string | string[] | undefined>, page: number) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) if (typeof value === "string" && value && key !== "page") params.set(key, value);
  params.set("page", String(page));
  return `/admin/auditoria?${params}`;
}

export default async function AuditPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const query = await searchParams;
  const filters = { action: text(query.action), entity: text(query.entity), performedBy: text(query.performedBy), startDate: validDate(text(query.startDate)), endDate: validDate(text(query.endDate)), page: Number(text(query.page)) || 1 };
  const [result, options] = await Promise.all([listAuditLogs(filters), listAuditFilterOptions()]);
  return <main className="dashboard-page audit-page">
    <Link className="back-link" href="/admin"><ArrowLeft size={17} /> Voltar para o painel</Link>
    <div className="page-heading employees-heading"><div><p className="eyebrow">Governança e segurança</p><h1>Auditoria</h1><p>Consulte alterações administrativas sem expor credenciais ou documentos sensíveis.</p></div><span className="status-pill"><ShieldCheck size={16} /> Somente administradores</span></div>
    <section className="data-panel audit-panel">
      <form className="audit-filters"><span><Filter size={17} /> Filtros</span><select name="performedBy" defaultValue={filters.performedBy ?? ""}><option value="">Todos os responsáveis</option>{options.responsible.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select><select name="entity" defaultValue={filters.entity ?? ""}><option value="">Todas as entidades</option>{options.entities.map((item) => <option value={item.value} key={item.value}>{item.value}</option>)}</select><select name="action" defaultValue={filters.action ?? ""}><option value="">Todas as ações</option>{options.actions.map((item) => <option value={item.value} key={item.value}>{item.value}</option>)}</select><label>De<input name="startDate" type="date" defaultValue={filters.startDate} /></label><label>Até<input name="endDate" type="date" defaultValue={filters.endDate} /></label><button type="submit">Aplicar filtros</button></form>
      <div className="table-summary"><strong>{result.total}</strong> {result.total === 1 ? "evento encontrado" : "eventos encontrados"}</div>
      {result.items.length ? <div className="audit-list">{result.items.map((item) => <article key={item.id}><span className="audit-event-icon"><ShieldCheck size={18} /></span><div className="audit-event-main"><strong>{item.action}</strong><small>{item.entity} · {item.entityId}</small></div><div className="audit-event-owner"><small>Responsável</small><strong>{item.performedByName}</strong></div><div className="audit-event-date"><small>Registrado em</small><strong>{dateTime(item.createdAt)}</strong></div><Link href={`/admin/auditoria/${item.id}`} aria-label={`Ver detalhes de ${item.action}`}><Eye size={17} /> Detalhes</Link></article>)}</div> : <div className="empty-state"><ShieldCheck size={30} /><h2>Nenhum evento encontrado</h2><p>Ajuste os filtros para consultar a trilha administrativa.</p></div>}
      {result.totalPages > 1 ? <nav className="audit-pagination" aria-label="Paginação da auditoria">{result.page > 1 ? <Link href={pageUrl(query, result.page - 1)}><ChevronLeft size={16} /> Anterior</Link> : <span /> }<strong>Página {result.page} de {result.totalPages}</strong>{result.page < result.totalPages ? <Link href={pageUrl(query, result.page + 1)}>Próxima <ChevronRight size={16} /></Link> : <span />}</nav> : null}
    </section>
  </main>;
}
