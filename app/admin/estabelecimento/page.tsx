import { Building2, MapPin, Plus, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { createEstablishmentAction } from "@/actions/establishments";
import { listEstablishments } from "@/services/terminal-admin.service";

const errorLabels = {
  invalid: "Revise o nome, CNPJ e os dados do registrador.",
  conflict: "Já existe um estabelecimento ou registrador com esses dados.",
  create: "Não foi possível criar o estabelecimento.",
} as const;

function formatCnpj(value: string) {
  return value.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

export default async function EstablishmentPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const query = await searchParams;
  const units = await listEstablishments();
  const error = query.error ? errorLabels[query.error as keyof typeof errorLabels] : undefined;
  return <main className="dashboard-page terminals-page">
    <header className="page-heading"><div><p className="eyebrow">REP-P</p><h1>Estabelecimento</h1><p>Cadastre a unidade e o registrador REP-P que autoriza os terminais de ponto.</p></div></header>
    {query.saved === "1" ? <p className="success-message">Estabelecimento e registrador criados com sucesso. Agora você já pode cadastrar terminais.</p> : null}
    {error ? <div className="form-alert danger"><TriangleAlert /><span>{error}</span></div> : null}
    <section className="data-panel terminal-create-panel">
      <header><div><h2>Novo estabelecimento</h2><p>Cria a unidade e ativa automaticamente um registrador REP-P para ela. Necessário antes de criar terminais.</p></div></header>
      <form className="terminal-create-form" action={createEstablishmentAction}>
        <div className="field-group"><label htmlFor="name">Nome do estabelecimento *</label><input id="name" name="name" placeholder="Ex.: Churrascaria Marituba" maxLength={150} required /></div>
        <div className="field-group"><label htmlFor="cnpj">CNPJ *</label><input id="cnpj" name="cnpj" placeholder="Somente números, 14 dígitos" maxLength={18} required /></div>
        <div className="field-group"><label htmlFor="registrarName">Nome do registrador *</label><input id="registrarName" name="registrarName" placeholder="Ex.: Registrador Matriz" maxLength={150} required /></div>
        <div className="field-group"><label htmlFor="registrarIdentifier">Identificador do registrador *</label><input id="registrarIdentifier" name="registrarIdentifier" placeholder="Ex.: matriz-01" maxLength={100} required /></div>
        <button className="primary-button action-button" type="submit"><Plus size={16} /> Criar estabelecimento</button>
      </form>
    </section>
    <section className="data-panel terminals-panel">
      <header><div><h2>Estabelecimentos cadastrados</h2><p>Depois de criados, ajuste a localização e o geofence em Localização/Geofence.</p></div><span>{units.length}</span></header>
      <div className="terminal-admin-list">
        {units.map((unit) => <article key={unit.id}>
          <span className="terminal-admin-icon"><Building2 size={22} /></span>
          <div><strong>{unit.name}</strong><small>{formatCnpj(unit.cnpj)}</small></div>
          <div className="terminal-admin-meta"><small>Geofence</small><strong>{unit.geofenceEnabled ? "Ativo" : "Desativado"}</strong></div>
          <Link className="operational-check" href="/admin/geofence"><MapPin size={16} /> Configurar localização</Link>
        </article>)}
        {!units.length && <p className="terminal-admin-empty">Nenhum estabelecimento cadastrado ainda.</p>}
      </div>
    </section>
  </main>;
}
