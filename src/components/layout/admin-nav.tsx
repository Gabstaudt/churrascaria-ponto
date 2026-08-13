"use client";

import { CalendarDays, CalendarRange, LayoutDashboard, UsersRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Painel", icon: LayoutDashboard, exact: true },
  { href: "/admin/funcionarios", label: "Funcionários", icon: UsersRound, exact: false },
  { href: "/admin/jornadas", label: "Jornadas", icon: CalendarDays, exact: false },
  { href: "/admin/escalas", label: "Escalas", icon: CalendarRange, exact: false },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Navegação administrativa">
      {links.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return <Link className={`nav-link${active ? " active" : ""}`} href={href} key={href}><Icon size={19} /> {label}</Link>;
      })}
    </nav>
  );
}
