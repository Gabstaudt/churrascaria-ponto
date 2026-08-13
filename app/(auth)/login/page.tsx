import { Clock3, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { getSession } from "@/auth/session";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage() {
  const session = await getSession();
  if (session?.user.isActive) redirect("/admin");

  return (
    <main className="auth-page">
      <section className="auth-intro">
        <div className="brand-mark" aria-hidden="true"><Clock3 size={28} /></div>
        <p className="eyebrow">Churrascaria Marituba</p>
        <h1>Gestão de jornada com segurança e clareza.</h1>
        <p>Acesse o ambiente administrativo para acompanhar funcionários, jornadas e registros de ponto.</p>
        <div className="security-note"><ShieldCheck aria-hidden="true" size={20} /><span>Ambiente restrito a usuários autorizados</span></div>
      </section>
      <section className="login-panel" aria-labelledby="login-title">
        <div><p className="eyebrow">Acesso administrativo</p><h2 id="login-title">Entre na sua conta</h2><p>Use as credenciais fornecidas pelo administrador do sistema.</p></div>
        <LoginForm />
      </section>
    </main>
  );
}
