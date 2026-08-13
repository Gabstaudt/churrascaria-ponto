import Link from "next/link";

export default function AccessDeniedPage() {
  return <main className="centered-page"><p className="eyebrow">Acesso restrito</p><h1>Você não tem permissão para acessar esta área.</h1><p>Entre com uma conta administrativa ou fale com o responsável.</p><Link className="primary-button link-button" href="/login">Voltar ao login</Link></main>;
}
