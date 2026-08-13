import { CalendarClock, ShieldCheck, UsersRound } from "lucide-react";

export default function AdminPage() {
  return (
    <main className="dashboard-page">
      <div className="page-heading"><div><p className="eyebrow">Visão geral</p><h1>Painel administrativo</h1><p>A fundação do sistema está pronta para receber os módulos de gestão.</p></div><span className="status-pill">Sistema protegido</span></div>
      <section className="foundation-grid" aria-label="Estado dos módulos">
        <article><UsersRound aria-hidden="true" /><div><h2>Funcionários</h2><p>Cadastro e gestão serão implementados na próxima sprint.</p></div></article>
        <article><CalendarClock aria-hidden="true" /><div><h2>Jornadas</h2><p>Planejamento preparado para vigências e horários flexíveis.</p></div></article>
        <article><ShieldCheck aria-hidden="true" /><div><h2>Acesso seguro</h2><p>Sessão, perfil administrativo e rotas protegidas estão ativos.</p></div></article>
      </section>
    </main>
  );
}
