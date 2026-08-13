"use client";

import { useState } from "react";
import { setEmployeeActiveAction } from "@/actions/employees";

export function EmployeeActiveForm({ employeeId, active }: { employeeId: string; active: boolean }) {
  const [confirming, setConfirming] = useState(false);
  const action = setEmployeeActiveAction.bind(null, employeeId, !active);

  if (!confirming) {
    return <button className={active ? "danger-button" : "secondary-button"} type="button" onClick={() => setConfirming(true)}>{active ? "Inativar funcionário" : "Reativar funcionário"}</button>;
  }

  return <div className="inline-confirm" role="alert"><p>{active ? "O funcionário deixará de aparecer como ativo. O histórico será preservado." : "O funcionário voltará ao status Ativo."}</p><div><button className="cancel-button" type="button" onClick={() => setConfirming(false)}>Cancelar</button><form action={action}><button className={active ? "danger-button" : "primary-button action-button"} type="submit">Confirmar {active ? "inativação" : "reativação"}</button></form></div></div>;
}
