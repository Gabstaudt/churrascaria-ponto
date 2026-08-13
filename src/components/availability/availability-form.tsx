"use client";

import { LoaderCircle, Save } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { createAvailabilityAction, type AvailabilityFormState } from "@/actions/availability";

const labels = { DAY_OFF: "Folga", SWAP: "Troca de folga", VACATION: "Férias", LEAVE: "Afastamento" } as const;
type Kind = keyof typeof labels;

export function AvailabilityForm({ employees, initialKind }: { employees: Array<{ id: string; fullName: string; registrationNumber: string }>; initialKind?: Kind }) {
  const [state, action, pending] = useActionState(createAvailabilityAction, {} as AvailabilityFormState);
  const [kind, setKind] = useState<Kind>(initialKind ?? "DAY_OFF");
  return <form className="employee-form availability-form" action={action}>
    <section className="form-section"><div className="form-section-heading"><div><h2>Tipo de registro</h2><p>Escolha a ocorrência que será adicionada ao planejamento.</p></div></div><div className="availability-kind">{(Object.keys(labels) as Kind[]).map((item) => <label className={kind === item ? "selected" : ""} key={item}><input type="radio" name="kind" value={item} checked={kind === item} onChange={() => setKind(item)} /><strong>{labels[item]}</strong></label>)}</div></section>
    <section className="form-section"><div className="form-section-heading"><div><h2>Dados do período</h2><p>O responsável será identificado automaticamente pela sessão administrativa.</p></div></div><div className="form-grid availability-fields"><div className="field-group field-span-2"><label htmlFor="employeeId">Funcionário *</label><select id="employeeId" name="employeeId" defaultValue="" required><option value="" disabled>Selecione</option>{employees.map((employee) => <option value={employee.id} key={employee.id}>{employee.fullName} · {employee.registrationNumber}</option>)}</select></div>{kind === "DAY_OFF" || kind === "SWAP" ? <div className="field-group"><label htmlFor="date">Data da folga *</label><input id="date" name="date" type="date" required /></div> : <><div className="field-group"><label htmlFor="startDate">Início *</label><input id="startDate" name="startDate" type="date" required /></div><div className="field-group"><label htmlFor="endDate">Fim *</label><input id="endDate" name="endDate" type="date" required /></div></>}{kind === "SWAP" ? <div className="field-group"><label htmlFor="workDate">Data compensada de trabalho *</label><input id="workDate" name="workDate" type="date" required /></div> : null}{kind === "LEAVE" ? <div className="field-group"><label htmlFor="leaveType">Tipo de afastamento *</label><select id="leaveType" name="leaveType" defaultValue="" required><option value="" disabled>Selecione</option><option value="MEDICAL">Médico</option><option value="PERSONAL">Pessoal</option><option value="LEGAL">Legal</option><option value="OTHER">Outro</option></select></div> : null}<div className="field-group field-span-2"><label htmlFor="reason">Motivo *</label><textarea id="reason" name="reason" rows={4} maxLength={500} placeholder="Descreva o motivo e as informações necessárias para a autorização." required /></div></div></section>
    {state.message ? <div className="form-error" role="alert"><strong>{state.message}</strong>{state.errors?.length ? <ul>{state.errors.map((error) => <li key={error}>{error}</li>)}</ul> : null}</div> : null}<div className="form-actions"><Link className="cancel-button" href="/admin/disponibilidade">Cancelar</Link><button className="primary-button action-button" disabled={pending} type="submit">{pending ? <LoaderCircle className="spin" size={18} /> : <Save size={18} />}{pending ? "Salvando..." : kind === "SWAP" ? "Enviar solicitação" : "Salvar registro"}</button></div>
  </form>;
}
