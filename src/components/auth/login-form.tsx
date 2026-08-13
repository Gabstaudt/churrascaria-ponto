"use client";

import { LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { authClient } from "@/auth/auth-client";
import { loginSchema } from "@/validations/auth";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    const formData = new FormData(event.currentTarget);
    const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Revise os dados informados.");
      return;
    }
    setPending(true);
    const result = await authClient.signIn.email({ ...parsed.data, rememberMe: false });
    if (result.error) {
      setError("Email ou senha inválidos, ou usuário sem acesso.");
      setPending(false);
      return;
    }
    router.replace("/admin");
    router.refresh();
  }

  return (
    <form className="login-form" onSubmit={handleSubmit} noValidate>
      <div className="field-group"><label htmlFor="email">Email</label><div className="input-shell"><Mail aria-hidden="true" size={18} /><input id="email" name="email" type="email" autoComplete="email" placeholder="admin@churrascaria.com.br" required /></div></div>
      <div className="field-group"><label htmlFor="password">Senha</label><div className="input-shell"><LockKeyhole aria-hidden="true" size={18} /><input id="password" name="password" type="password" autoComplete="current-password" placeholder="Digite sua senha" required /></div></div>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <button className="primary-button" disabled={pending} type="submit">{pending ? <LoaderCircle className="spin" size={18} /> : null}{pending ? "Entrando..." : "Entrar"}</button>
    </form>
  );
}
