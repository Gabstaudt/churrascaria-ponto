"use client";

import { AlertTriangle, Archive, BarChart3, CalendarCheck2, CalendarDays, CalendarRange, ClipboardCheck, FileCheck2, FileKey, FileSignature, KeyRound, LayoutDashboard, MapPin, MonitorSmartphone, Scale, ScanFace, ShieldCheck, Stamp, UsersRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const sections = [
  {
    title: null,
    links: [
      { href: "/admin", label: "Painel", icon: LayoutDashboard, exact: true, desktopOnly: false },
      { href: "/admin/funcionarios", label: "Funcionários", icon: UsersRound, exact: false, desktopOnly: false },
      { href: "/admin/jornadas", label: "Jornadas", icon: CalendarDays, exact: false, desktopOnly: false },
      { href: "/admin/escalas", label: "Escalas", icon: CalendarRange, exact: false, desktopOnly: false },
    ],
  },
  {
    title: "Gestão",
    links: [
      { href: "/admin/auditoria", label: "Auditoria", icon: ShieldCheck, exact: false, desktopOnly: true },
      { href: "/admin/banco-horas", label: "Banco de horas", icon: Scale, exact: false, desktopOnly: true },
      { href: "/admin/fechamentos", label: "Fechamentos", icon: CalendarCheck2, exact: false, desktopOnly: true },
      { href: "/admin/acessos", label: "Acessos", icon: KeyRound, exact: false, desktopOnly: true },
      { href: "/gestao/solicitacoes", label: "Solicitações", icon: ClipboardCheck, exact: false, desktopOnly: true },
    ],
  },
  {
    title: "Terminal REP-P",
    links: [
      { href: "/admin/terminais", label: "Terminais", icon: MonitorSmartphone, exact: false, desktopOnly: true },
      { href: "/admin/geofence", label: "Geofence", icon: MapPin, exact: false, desktopOnly: true },
      { href: "/admin/biometria", label: "Biometria", icon: ScanFace, exact: false, desktopOnly: true },
      { href: "/admin/contingencias", label: "Contingências", icon: AlertTriangle, exact: false, desktopOnly: true },
    ],
  },
  {
    title: "Documentos oficiais",
    links: [
      { href: "/admin/comprovantes", label: "Comprovantes", icon: FileCheck2, exact: false, desktopOnly: true },
      { href: "/admin/rep-p/afd", label: "AFD", icon: Archive, exact: false, desktopOnly: true },
      { href: "/admin/rep-p/aej", label: "AEJ", icon: FileSignature, exact: false, desktopOnly: true },
      { href: "/admin/rep-p/certificado", label: "Certificado", icon: FileKey, exact: false, desktopOnly: true },
      { href: "/admin/rep-p/assinaturas", label: "Assinaturas", icon: Stamp, exact: false, desktopOnly: true },
    ],
  },
  {
    title: null,
    links: [
      { href: "/admin/relatorios", label: "Relatórios", icon: BarChart3, exact: false, desktopOnly: true },
    ],
  },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="admin-navigation" aria-label="Navegação administrativa">
      {sections.map((section, index) => {
        const sectionDesktopOnly = section.links.every((link) => link.desktopOnly);
        return (
          <div className={`nav-section${sectionDesktopOnly ? " desktop-only-nav" : ""}`} key={section.title ?? `section-${index}`}>
            {section.title ? <p className="nav-section-label">{section.title}</p> : null}
            {section.links.map(({ href, label, icon: Icon, exact, desktopOnly }) => {
              const active = exact ? pathname === href : pathname.startsWith(href);
              return <Link className={`nav-link${active ? " active" : ""}${desktopOnly ? " desktop-only-nav" : ""}`} href={href} key={href}><Icon size={19} /> {label}</Link>;
            })}
          </div>
        );
      })}
    </nav>
  );
}
