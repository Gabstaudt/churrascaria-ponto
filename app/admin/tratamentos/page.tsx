import { ArrowLeft, Clock3, History, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TimeAdjustmentForm } from "@/components/time-adjustments/time-adjustment-form";
import { getEmployeeById } from "@/services/employee.service";
import { listTimeAdjustments } from "@/services/time-adjustment.service";
import { listTimeEntries } from "@/services/time-entry.service";
import { employeeIdSchema } from "@/validations/employee";

const labels = { ADD_ENTRY: "Marcação incluída", IGNORE_ENTRY: "Marcação desconsiderada", FORGOTTEN_EXIT: "Saída esquecida", JUSTIFY_LATE: "Atraso justificado", JUSTIFY_EARLY_EXIT: "Saída antecipada justificada" } as const;
function dateTime(value: Date) { return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Belem" }).format(value); }
function time(value: Date) { return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Belem" }).format(value); }

export default async function TreatmentsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const employeeId = typeof query.employeeId === "string" ? query.employeeId : "";
  const date = typeof query.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(query.date) ? query.date : "";
  if (!employeeIdSchema.safeParse(employeeId).success || !date) notFound();
  const [employee, entries, adjustments] = await Promise.all([getEmployeeById(employeeId), listTimeEntries({ employeeId, start: new Date(`${date}T00:00:00-03:00`), end: new Date(`${date}T23:59:59.999-03:00`) }), listTimeAdjustments({ employeeId, date })]);
  if (!employee) notFound();
  return <main className="dashboard-page treatment-page"><Link className="back-link" href={`/admin?date=${date}`}><ArrowLeft size={17} /> Voltar para o painel</Link><div className="page-heading compact-heading"><div><p className="eyebrow">Tratamento de ponto</p><h1>{employee.fullName}</h1><p>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`))} · Matrícula {employee.registrationNumber}</p></div><span className="status-pill"><ShieldCheck size={15} /> Originais protegidos</span></div>{query.saved === "1" ? <p className="success-message">Tratamento registrado com sucesso.</p> : null}<div className="treatment-layout"><div className="treatment-column"><section className="data-panel treatment-panel"><header><Clock3 size={19} /><div><h2>Marcações originais</h2><p>Eventos imutáveis recebidos pelo sistema.</p></div><span>{entries.length}</span></header>{entries.length ? <div className="treatment-entries">{entries.map((entry) => <div key={entry.id}><strong>{time(entry.occurredAt)}</strong><small>{entry.source === "SIMULATOR" ? "Simulador" : entry.source === "IMPORT" ? "Importação" : "REP-C"}</small><em>{entry.externalId}</em></div>)}</div> : <div className="availability-empty">Nenhuma marcação original nesta data.</div>}</section><section className="data-panel treatment-panel"><header><History size={19} /><div><h2>Histórico de tratamentos</h2><p>Eventos administrativos adicionados sem alterar os originais.</p></div><span>{adjustments.length}</span></header>{adjustments.length ? <div className="treatment-history">{adjustments.map((item) => <article key={item.id}><div><strong>{labels[item.type]}</strong><small>{dateTime(item.createdAt)} · {item.performedByName}</small></div>{item.adjustedAt ? <span>{time(item.adjustedAt)}</span> : null}<p>{item.reason}</p></article>)}</div> : <div className="availability-empty">Nenhum tratamento registrado.</div>}</section></div><aside className="data-panel treatment-create"><header><h2>Novo tratamento</h2><p>O registro será permanente e auditável.</p></header><TimeAdjustmentForm employeeId={employeeId} date={date} entries={entries.map((entry) => ({ id: entry.id, occurredAt: entry.occurredAt }))} /></aside></div></main>;
}
