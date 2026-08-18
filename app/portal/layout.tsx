import { Bell, CalendarDays, ClipboardList, Clock3, FileCheck2, LogOut } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { logoutAction } from "@/actions/auth";
import { requireEmployeePortal } from "@/auth/session";

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const session = await requireEmployeePortal();
  return <div className="portal-shell"><header className="portal-header"><Link href="/portal" className="portal-brand"><span><Clock3 size={20} /></span><div><strong>Meu ponto</strong><small>OnTheDot</small></div></Link><nav><Link href="/portal"><CalendarDays size={17} /> Visão geral</Link><Link href="/portal/solicitacoes"><ClipboardList size={17} /> Solicitações</Link><Link href="/portal/comprovantes"><FileCheck2 size={17} /> Comprovantes</Link></nav><div className="portal-user"><Bell size={18} /><span>{session.user.name}</span><form action={logoutAction}><button aria-label="Sair" type="submit"><LogOut size={18} /></button></form></div></header>{children}</div>;
}
