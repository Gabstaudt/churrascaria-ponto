import { CalendarDays, Clock3, LayoutDashboard, LogOut, UsersRound } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { logoutAction } from "@/actions/auth";
import { requireAdmin } from "@/auth/session";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await requireAdmin();
  const initials = session.user.name.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <Link className="sidebar-brand" href="/admin"><span className="brand-mark small" aria-hidden="true"><Clock3 size={21} /></span><span><strong>Churrascaria</strong><small>Gestão de ponto</small></span></Link>
        <nav aria-label="Navegação administrativa">
          <Link className="nav-link active" href="/admin"><LayoutDashboard size={19} /> Painel</Link>
          <span className="nav-link disabled"><UsersRound size={19} /> Funcionários <small>Em breve</small></span>
          <span className="nav-link disabled"><CalendarDays size={19} /> Jornadas <small>Em breve</small></span>
        </nav>
        <form action={logoutAction} className="logout-form"><button className="nav-link logout-button" type="submit"><LogOut size={19} /> Sair</button></form>
      </aside>
      <div className="admin-main"><header className="topbar"><div><p>Ambiente administrativo</p><strong>{session.user.name}</strong></div><span className="avatar" aria-label={`Usuário ${session.user.name}`}>{initials}</span></header>{children}</div>
    </div>
  );
}
