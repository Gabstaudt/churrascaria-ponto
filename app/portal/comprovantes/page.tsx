import { Download, FileCheck2 } from "lucide-react";
import Link from "next/link";
import { requireEmployeePortal } from "@/auth/session";
import { listEmployeePointReceipts } from "@/modules/point-receipts/services/point-receipt.service";

function instant(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
    timeZone: "America/Belem",
  }).format(value);
}

function statusLabel(status: string) {
  if (status === "AVAILABLE") return "Disponível";
  if (status === "REQUIRES_ATTENTION") return "Em análise";
  return "Em preparação";
}

export default async function EmployeeReceiptsPage() {
  const session = await requireEmployeePortal();
  const receipts = await listEmployeePointReceipts(session.employeeId);

  return (
    <main className="portal-page receipt-page">
      <div className="portal-title">
        <p>Registros oficiais</p>
        <h1>Meus comprovantes</h1>
        <span>Consulte e baixe os comprovantes eletrônicos das suas marcações REP-P.</span>
      </div>
      <section className="portal-card">
        <header><div><h2>Histórico</h2><p>Documentos vinculados às marcações originais.</p></div><span>{receipts.length}</span></header>
        <div className="receipt-list">
          {receipts.map((receipt) => (
            <article key={receipt.id}>
              <span className="receipt-icon"><FileCheck2 /></span>
              <div className="receipt-summary">
                <strong>{instant(receipt.recordedAt)}</strong>
                <small>NSR {receipt.nsr} · {receipt.receiptNumber}</small>
              </div>
              <span className={`portal-status ${receipt.status === "AVAILABLE" ? "approved" : "pending"}`}>{statusLabel(receipt.status)}</span>
              {receipt.status === "AVAILABLE" ? <Link className="receipt-download" href={`/portal/comprovantes/${receipt.id}/download`}><Download size={16} /> Baixar PDF</Link> : null}
            </article>
          ))}
          {!receipts.length ? <div className="empty-state"><FileCheck2 /><h2>Nenhum comprovante ainda</h2><p>Os comprovantes aparecerão aqui após uma marcação REP-P.</p></div> : null}
        </div>
      </section>
    </main>
  );
}
