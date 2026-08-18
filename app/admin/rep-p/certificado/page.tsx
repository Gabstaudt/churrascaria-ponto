import { AlertTriangle, KeyRound, ShieldAlert, ShieldCheck } from "lucide-react";
import { disableCertificateAction } from "@/actions/certificate";
import { CertificateService } from "@/modules/digital-signatures/services/certificate.service";
import { requireSignaturePermission } from "@/modules/digital-signatures/services/signature-permission.service";

function date(value: Date) { return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Belem" }).format(value); }
function alertLabel(level: string) { return level === "CRITICAL" ? "Crítico" : level === "WARNING" ? "Atenção" : "Normal"; }

export default async function CertificatePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireSignaturePermission("CERTIFICATE_VIEW_STATUS");
  const query = await searchParams;
  const status = await new CertificateService().status();
  const loaded = "serialNumber" in status;
  return (
    <main className="page-content afd-page">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Conformidade · assinatura digital</p>
          <h1>Certificado digital</h1>
          <p>Status público do certificado ICP-Brasil usado nas assinaturas CAdES e PAdES. Chave privada e senha nunca são exibidas.</p>
        </div>
      </header>
      {query.error === "reason-required" ? <p className="portal-feedback error">Informe o motivo da desativação.</p> : null}
      <section className={`afd-validation-result ${status.alertLevel === "CRITICAL" ? "critical" : status.alertLevel === "WARNING" ? "warning" : ""}`}>
        {status.alertLevel === "CRITICAL" ? <ShieldAlert /> : status.alertLevel === "WARNING" ? <AlertTriangle /> : <ShieldCheck />}
        <div>
          <strong>Nível de alerta: {alertLabel(status.alertLevel)}</strong>
          <p>Status técnico: {status.status}{loaded ? ` · status no banco: ${status.databaseStatus}` : ""}</p>
        </div>
      </section>
      {loaded ? (
        <section className="afd-detail-grid">
          <article><span>Alias</span><strong>{status.alias}</strong></article>
          <article><span>Tipo</span><strong>{status.certificateType}</strong></article>
          <article><span>Número de série</span><strong>{status.serialNumber}</strong></article>
          <article><span>Titular</span><strong>{status.subject}</strong></article>
          <article><span>Emissor</span><strong>{status.issuer}</strong></article>
          <article><span>Válido de</span><strong>{date(status.validFrom)}</strong></article>
          <article><span>Válido até</span><strong>{date(status.validUntil)}</strong></article>
          <article><span>Dias até expirar</span><strong>{status.daysUntilExpiration}</strong></article>
        </section>
      ) : <p className="portal-feedback">O certificado configurado no ambiente não pôde ser carregado. Verifique as variáveis <code>CERTIFICATE_PFX_PATH</code> e <code>CERTIFICATE_PFX_PASSWORD</code>.</p>}
      {loaded && status.databaseStatus === "ACTIVE" ? (
        <section className="content-panel afd-form-panel">
          <header><div><h2>Desativar certificado</h2><p>Interrompe imediatamente novas assinaturas com este certificado. Use em caso de suspeita de comprometimento.</p></div></header>
          <form action={disableCertificateAction.bind(null, status.serialNumber)} className="portal-form">
            <label className="wide">Motivo<input name="reason" required maxLength={300} /></label>
            <button className="primary-button"><KeyRound size={16} /> Desativar certificado</button>
          </form>
        </section>
      ) : null}
    </main>
  );
}
