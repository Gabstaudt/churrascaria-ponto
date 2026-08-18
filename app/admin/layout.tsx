import { LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { logoutAction } from "@/actions/auth";
import { requireAdmin } from "@/auth/session";
import { AdminNav } from "@/components/layout/admin-nav";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await requireAdmin();
  const initials = session.user.name.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <Link className="sidebar-brand" href="/admin"><span className="brand-mark small" aria-hidden="true"><Image src="/logo/favico.ico" alt="" width={784} height={569} /></span><span><strong>Churrascaria</strong><small>Gestão de ponto</small></span></Link>
        <AdminNav />
        <form action={logoutAction} className="logout-form"><button className="nav-link logout-button" type="submit"><LogOut size={19} /> Sair</button></form>
      </aside>
      <div className="admin-main"><header className="topbar"><div><p>Ambiente administrativo</p><strong>{session.user.name}</strong></div><span className="avatar" aria-label={`Usuário ${session.user.name}`}>{initials}</span></header>{children}</div>
    </div>
  );
}
