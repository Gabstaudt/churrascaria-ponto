import { Clock3 } from "lucide-react";

export default function PointTerminalPage() {
  return (
    <section className="point-terminal" aria-labelledby="terminal-title">
      <header>
        <span className="point-terminal-mark" aria-hidden="true"><Clock3 size={30} /></span>
        <div>
          <p>Churrascaria Marituba</p>
          <h1 id="terminal-title">Terminal de ponto</h1>
        </div>
      </header>
      <div className="point-terminal-intro">
        <p>Registro oficial de jornada</p>
        <strong>Inicie seu registro de ponto</strong>
        <span>O horário oficial será confirmado pelo servidor.</span>
      </div>
      <button className="point-terminal-primary" type="button">Iniciar registro</button>
    </section>
  );
}
