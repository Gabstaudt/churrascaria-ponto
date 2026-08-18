import { AlertTriangle, ArrowLeft, Download, FileArchive } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { signAejAction } from "@/actions/aej";
import { getAejGenerationDetail } from "@/modules/official-documents/services/aej-generation.service";
import { requireAejPermission } from "@/modules/official-documents/services/aej-permission.service";

export default async function AejDetailPage({ params, searchParams }: PageProps<"/admin/rep-p/aej/[id]">) {
  await requireAejPermission("AEJ_VIEW_HISTORY");
  const { id } = await params; const query = await searchParams;
  const row = await getAejGenerationDetail(id); if (!row) notFound();
  const item = row.generation;
  return (
    <main className="dashboard-page afd-detail-page">
      <Link className="back-link" href="/admin/rep-p/aej"><ArrowLeft size={16} /> Voltar ao histórico</Link>
      <header className="page-heading">
        <div>
          <p className="eyebrow">AEJ · detalhes da geração</p>
          <h1>{item.fileName}</h1>
          <p>{row.referenceMonth} · {row.establishmentName}</p>
        </div>
        <span className={`portal-status ${item.status === "FAILED" ? "rejected" : item.signatureStatus === "SIGNED" ? "approved" : "pending"}`}>{item.status === "SUPERSEDED" ? "SUPERSEDED" : item.status}</span>
      </header>
      {query.error ? <p className="portal-feedback error">A assinatura não pôde ser concluída. Verifique o certificado e tente novamente.</p> : null}
      <section className="afd-detail-grid">
        <article><span>Período</span><strong>{item.startDate} a {item.endDate}</strong></article>
        <article><span>Revisão</span><strong>{item.revision}</strong></article>
        <article><span>Leiaute</span><strong>{item.layoutVersion}</strong></article>
        <article><span>Assinatura CAdES</span><strong>{item.signatureStatus}</strong></article>
      </section>
      <section className="data-panel afd-hash-panel">
        <header><div><h2>Integridade</h2><p>Hashes SHA-256 do arquivo e da assinatura destacada.</p></div></header>
        <code>{item.fileHash}</code>
        {item.signatureHash ? <code>{item.signatureHash}</code> : null}
      </section>
      <section className="data-panel">
        <header><div><h2>Avisos de validação</h2><p>O AEJ é gerado a partir das marcações e tratamentos do período; nada é editado manualmente.</p></div></header>
        <div className="afd-issues">
          {item.validationIssues.map((issue, index) => <article key={`${issue.code}-${index}`}><AlertTriangle /><div><strong>{issue.code}</strong><p>{issue.message}</p></div></article>)}
          {!item.validationIssues.length ? <p>Nenhuma inconsistência encontrada.</p> : null}
        </div>
      </section>
      <div className="form-actions">
        {item.status !== "FAILED" && item.signatureStatus !== "SIGNED" ? <form action={signAejAction.bind(null, item.id)}><button className="primary-button"><FileArchive size={16} /> Assinar com CAdES</button></form> : null}
        {item.signatureStatus === "SIGNED" ? <>
          <Link className="primary-button" href={`/api/rep-p/aej/${item.id}/download`}><Download size={16} /> Baixar AEJ</Link>
          <Link className="secondary-button" href={`/api/rep-p/aej/${item.id}/signature`}><Download size={16} /> Baixar .p7s</Link>
        </> : <span className="afd-signature-notice"><FileArchive size={17} /> O download oficial exige assinatura CAdES validada.</span>}
      </div>
    </main>
  );
}
