"use client";

import { FilePlus2, LoaderCircle, Save } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { decideAbsenceAction, type AbsenceFormState } from "@/actions/absences";

const labels = { UNJUSTIFIED: "Falta não justificada", JUSTIFIED: "Falta justificada", MEDICAL_CERTIFICATE: "Atestado médico", DAY_OFF: "Folga", VACATION: "Férias", LEAVE: "Afastamento", TIME_ENTRY_ERROR: "Erro de marcação", OTHER: "Outro" } as const;
export function AbsenceDecisionForm({ employeeId, date, decision }: { employeeId: string; date: string; decision?: keyof typeof labels }) {
  const [state, action, pending] = useActionState(decideAbsenceAction, {} as AbsenceFormState);
  return <><Link className="absence-certificate-link" href={`/admin/atestados/novo?employeeId=${employeeId}&date=${date}`}><FilePlus2 size={16} /> Anexar atestado</Link><form className="employee-form absence-form" action={action}><input type="hidden" name="employeeId" value={employeeId} /><input type="hidden" name="date" value={date} /><div className="field-group"><label htmlFor="decision">Decisão *</label><select id="decision" name="decision" defaultValue={decision ?? ""} required><option value="" disabled>Selecione</option>{Object.entries(labels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></div><div className="field-group"><label htmlFor="reason">Motivo *</label><textarea id="reason" name="reason" rows={4} maxLength={1000} placeholder="Explique a decisão administrativa." required /></div>{state.message ? <div className="form-error" role="alert"><strong>{state.message}</strong>{state.errors?.length ? <ul>{state.errors.map((error) => <li key={error}>{error}</li>)}</ul> : null}</div> : null}<button className="primary-button action-button" disabled={pending} type="submit">{pending ? <LoaderCircle className="spin" size={18} /> : <Save size={18} />}{pending ? "Salvando..." : decision ? "Registrar nova decisão" : "Registrar decisão"}</button></form></>;
}
