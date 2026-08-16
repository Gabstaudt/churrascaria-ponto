import { Download, FileCheck2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { reprocessPointReceiptAction } from "@/actions/point-receipts";
import { listAdminPointReceipts } from "@/modules/point-receipts/services/point-receipt.service";

function instant(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Belem" }).format(value);
}

export default async function AdminReceiptsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const text = (key: string) => typeof query[key] === "string" ? query[key] as string : "";
  const rows = await listAdminPointReceipts();
  const filtered = rows.filter(({ receipt, employeeName, establishmentName }) =>
    (!text("employee") || employeeName.toLowerCase().includes(text("employee").toLowerCase())) &&
    (!text("nsr") || receipt.nsr.includes(text("nsr"))) &&
    (!text("status") || receipt.status === text("status")) &&
    (!text("establishment") || establishmentName.toLowerCase().includes(text("establishment").toLowerCase())) &&
    (!text("from") || receipt.recordedAt >= new Date(`${text("from")}T00:00:00-03:00`)) &&
    (!text("to") || receipt.recordedAt <= new Date(`${text("to")}T23:59:59-03:00`))
  );

  return <main className="page-content receipt-page"><header className="page-heading"><div><p className="eyebrow">REP-P</p><h1>Comprovantes</h1><p>Consulta, integridade e recuperação dos comprovantes eletrônicos de registro.</p></div></header><section className="content-panel"><form className="receipt-filters" method="get"><label>De<input type="date" name="from" defaultValue={text("from")} /></label><label>Até<input type="date" name="to" defaultValue={text("to")} /></label><label>Funcionário<input name="employee" defaultValue={text("employee")} /></label><label>NSR<input name="nsr" defaultValue={text("nsr")} /></label><label>Estabelecimento<input name="establishment" defaultValue={text("establishment")} /></label><label>Status<select name="status" defaultValue={text("status")}><option value="">Todos</option><option value="AVAILABLE">Disponível</option><option value="PENDING">Pendente</option><option value="FAILED">Falhou</option><option value="REQUIRES_ATTENTION">Requer atenção</option></select></label><button className="primary-button">Filtrar</button></form></section><section className="content-panel"><header><div><h2>Documentos</h2><p>O PDF é privado e validado por hash antes do download.</p></div><span>{filtered.length}</span></header><div className="receipt-list admin-receipt-list">{filtered.map(({ receipt, employeeName, establishmentName }) => <article key={receipt.id}><span className="receipt-icon"><FileCheck2 /></span><div className="receipt-summary"><strong>{employeeName}</strong><small>{instant(receipt.recordedAt)} · NSR {receipt.nsr} · {establishmentName}</small><small>{receipt.receiptNumber}</small></div><span className={`portal-status ${receipt.status === "AVAILABLE" ? "approved" : "pending"}`}>{receipt.status}</span>{receipt.status === "AVAILABLE" ? <Link className="receipt-download" href={`/admin/comprovantes/${receipt.id}/download`}><Download size={16} /> PDF</Link> : <form action={reprocessPointReceiptAction.bind(null, receipt.id)}><button className="receipt-download" type="submit"><RefreshCw size={16} /> Reprocessar</button></form>}</article>)}{!filtered.length ? <div className="empty-state"><FileCheck2 /><h2>Nenhum comprovante encontrado</h2><p>Ajuste os filtros para consultar outro período.</p></div> : null}</div></section></main>;
}
