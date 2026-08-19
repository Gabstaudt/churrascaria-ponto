import { ArrowLeft, ClipboardCheck, Clock3, LogOut, UsersRound } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { logoutAction } from "@/actions/auth";
import { requireManagerPortal } from "@/auth/session";

export default async function ManagerLayout({ children }: { children: ReactNode }) { const session = await requireManagerPortal(); const isAdmin = session.user.role === "ADMIN"; return <div className="portal-shell manager-shell"><header className="portal-header">{isAdmin ? <Link href="/admin" className="portal-brand"><span><ArrowLeft size={20} /></span><div><strong>Voltar ao painel admin</strong><small>Gestão da equipe</small></div></Link> : <Link href="/gestao" className="portal-brand"><span><Clock3 size={20} /></span><div><strong>Gestão da equipe</strong><small>Escopo autorizado</small></div></Link>}<nav><Link href="/gestao"><UsersRound size={17} /> Equipe</Link><Link href="/gestao/solicitacoes"><ClipboardCheck size={17} /> Solicitações</Link></nav><div className="portal-user"><span>{session.user.name}</span><form action={logoutAction}><button aria-label="Sair" type="submit"><LogOut size={18} /></button></form></div></header>{children}</div>; }
