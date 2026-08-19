import { CheckCircle2 } from "lucide-react";
import { markAdminNotificationReadAction } from "@/actions/notifications";
import { requireAdmin } from "@/auth/session";
import { listNotifications } from "@/services/portal.service";

function dateTime(value: Date) { return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Belem" }).format(value); }

export default async function AdminNotificationsPage() {
  const session = await requireAdmin();
  const notices = await listNotifications(session.user.id);
  return <main className="dashboard-page">
    <div className="page-heading"><div><p className="eyebrow">Central</p><h1>Notificações</h1><p>Alertas gerados automaticamente pelo sistema, como períodos aquisitivos de férias próximos.</p></div></div>
    <section className="data-panel">
      <header><div><h2>Todas</h2><p>Mais recentes primeiro.</p></div><span>{notices.length}</span></header>
      <div className="portal-list">
        {notices.map((item) => <article className={item.readAt ? "" : "unread"} key={item.id}>
          {item.link ? <a className="notification-open" href={`/admin/notificacoes/${item.id}/abrir`}><strong>{item.title}</strong><small>{dateTime(item.createdAt)} · {item.message}</small></a> : <div className="notification-plain"><strong>{item.title}</strong><small>{dateTime(item.createdAt)} · {item.message}</small></div>}
          <div className="notification-actions">
            {!item.readAt ? <form action={markAdminNotificationReadAction.bind(null, item.id)}><button className="secondary-button" type="submit"><CheckCircle2 size={13} /> Marcar como lida</button></form> : <em>Lida</em>}
          </div>
        </article>)}
        {!notices.length ? <p className="portal-empty">Nenhuma notificação por enquanto.</p> : null}
      </div>
    </section>
  </main>;
}
