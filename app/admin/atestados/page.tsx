import { FileCheck2, FilePlus2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { reviewMedicalCertificateAction } from "@/actions/medical-certificates";
import { listMedicalCertificates } from "@/services/medical-certificate.service";

function formatDate(value: string) { return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`)); }
function formatSize(value: number) { return value < 1024 * 1024 ? `${Math.ceil(value / 1024)} KB` : `${(value / 1024 / 1024).toFixed(1)} MB`; }

export default async function CertificatesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams; const certificates = await listMedicalCertificates();
  return <main className="dashboard-page certificates-page">
    <div className="page-heading employees-heading"><div><p className="eyebrow">Documentos médicos</p><h1>Atestados</h1><p>Consulte arquivos protegidos e seus vínculos administrativos.</p></div><Link className="primary-button action-button" href="/admin/atestados/novo"><FilePlus2 size={18} /> Novo atestado</Link></div>
    {query.saved ? <p className="success-message">Atestado registrado ou analisado com sucesso.</p> : null}
    <section className="certificate-security"><ShieldCheck size={20} /><div><strong>Armazenamento privado</strong><small>O banco mantém somente metadados. Cada abertura gera acesso temporário de dois minutos.</small></div></section>
    <section className="data-panel certificates-panel"><header><div><h2>Atestados cadastrados</h2><p>Períodos e arquivos disponíveis para consulta autorizada.</p></div><span>{certificates.length}</span></header>
      {certificates.length ? <div className="certificate-list">{certificates.map((item) => <article key={item.id}>
        <span className="certificate-icon"><FileCheck2 size={19} /></span>
        <div className="certificate-person"><strong>{item.employeeName}</strong><small>Matrícula {item.registrationNumber}</small></div>
        <div className="certificate-period"><small>Período</small><strong>{formatDate(item.startDate)} — {formatDate(item.endDate)}</strong></div>
        <div className="certificate-file"><small>Arquivo</small><strong>{item.fileName}</strong><em>{formatSize(item.fileSize)}</em></div>
        <div className="certificate-state"><small>Situação</small><span className={`certificate-status status-${item.status.toLowerCase()}`}>{item.status === "PENDING" ? "Pendente" : item.status === "APPROVED" ? "Aprovado" : "Rejeitado"}</span>{item.status !== "PENDING" ? <em>{item.approvedByName ?? "Análise concluída"}</em> : null}</div>
        <a className="certificate-open" href={`/admin/atestados/${item.id}/arquivo`} target="_blank" rel="noreferrer">Visualizar</a>
        {item.status === "PENDING" ? <form className="certificate-review" action={reviewMedicalCertificateAction.bind(null, item.id)}><label><span>Parecer da análise</span><input name="reason" minLength={3} placeholder="Informe o motivo da decisão" required /></label><div><button name="decision" value="APPROVED">Aprovar</button><button className="reject" name="decision" value="REJECTED">Rejeitar</button></div></form> : null}
      </article>)}</div> : <div className="empty-state"><FileCheck2 size={30} /><h2>Nenhum atestado cadastrado</h2><p>Os documentos médicos protegidos aparecerão aqui.</p><Link href="/admin/atestados/novo">Anexar atestado</Link></div>}
    </section>
  </main>;
}
