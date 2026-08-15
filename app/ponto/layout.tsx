import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Terminal de ponto | UpTime",
  description: "Terminal oficial de registro de ponto da Churrascaria Marituba.",
};

export default function PointTerminalLayout({ children }: { children: ReactNode }) {
  return <main className="point-terminal-shell" data-kiosk="true">{children}</main>;
}
