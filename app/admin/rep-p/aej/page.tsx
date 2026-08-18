import { AlertTriangle, FileArchive } from "lucide-react";
import Link from "next/link";
import { generateAejAction } from "@/actions/aej";
import { listAejGenerations } from "@/modules/official-documents/services/aej-generation.service";
import { requireAejPermission } from "@/modules/official-documents/services/aej-permission.service";
import { AEJ_LAYOUT_VERSION } from "@/modules/official-documents/generators/aej.generator";
import { listClosingPeriods } from "@/services/closing-period.service";

function date(value: Date) { return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Belem" }).format(value); }

export default async function AejPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAejPermission("AEJ_VIEW_HISTORY");
  const query = await searchParams;
  const [rows, periods] = await Promise.all([listAejGenerations(), listClosingPeriods()]);
  const closedPeriods = periods.filter((period) => period.status === "CLOSED");
  return (
    <main className="dashboard-page afd-page">
      <header className="page-heading">
        <div>
          <p className="eyebrow">PTRP · documento regulatório</p>
          <h1>Arquivo Eletrônico de Jornada</h1>
          <p>Gere o AEJ a partir de um período fechado, com tratamentos, apuração e leiaute oficial versionado.</p>
        </div>
      </header>
      {query.error ? <p className="portal-feedback error">A operação não pôde ser concluída. Verifique se o período está fechado, se há funcionários no intervalo e se os dados jurídicos estão configurados.</p> : null}
      <section className="data-panel afd-form-panel single-form-panel">
        <header><div><h2>Nova geração</h2><p>Somente períodos fechados podem gerar AEJ oficial.</p></div></header>
        <form action={generateAejAction} className="portal-form">
          <label className="wide">Competência
            <select name="closingPeriodId" required>
              <option value="">Selecione</option>
              {closedPeriods.map((period) => <option value={period.id} key={period.id}>{period.referenceMonth} · {period.startDate} a {period.endDate}</option>)}
            </select>
          </label>
          <button className="primary-button"><FileArchive size={16} /> Gerar AEJ</button>
        </form>
        {!closedPeriods.length ? <p className="portal-feedback">Nenhuma competência fechada disponível.</p> : null}
      </section>
      <section className="data-panel">
        <header><div><h2>Histórico de gerações</h2><p>Cada revisão preserva arquivo, hash e assinatura anteriores; reaberturas geram uma nova revisão.</p></div><span>{rows.length}</span></header>
        <div className="afd-list">
          {rows.map(({ generation, establishmentName, referenceMonth }) => (
            <Link href={`/admin/rep-p/aej/${generation.id}`} key={generation.id}>
              <span className="receipt-icon">{generation.status === "FAILED" ? <AlertTriangle /> : <FileArchive />}</span>
              <div>
                <strong>{referenceMonth} · revisão {generation.revision}</strong>
                <small>{generation.startDate} a {generation.endDate} · {establishmentName}</small>
                <small>{generation.fileName} · {date(generation.createdAt)}</small>
              </div>
              <span className={`portal-status ${generation.status === "FAILED" ? "rejected" : generation.signatureStatus === "SIGNED" ? "approved" : "pending"}`}>{generation.status === "SUPERSEDED" ? "SUPERSEDED" : generation.signatureStatus}</span>
            </Link>
          ))}
          {!rows.length ? <div className="empty-state"><FileArchive /><h2>Nenhuma geração encontrada</h2><p>Gere o AEJ a partir de uma competência fechada.</p></div> : null}
        </div>
      </section>
      <p className="portal-feedback">Leiaute vigente: {AEJ_LAYOUT_VERSION}.</p>
    </main>
  );
}
