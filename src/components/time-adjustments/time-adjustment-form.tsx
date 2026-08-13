"use client";

import { LoaderCircle, Save } from "lucide-react";
import { useActionState, useState } from "react";
import { createTimeAdjustmentAction, type TimeAdjustmentFormState } from "@/actions/time-adjustments";

type Entry = { id: string; occurredAt: Date };
const labels = { ADD_ENTRY: "Incluir marcação faltante", IGNORE_ENTRY: "Desconsiderar marcação", FORGOTTEN_EXIT: "Registrar saída esquecida", JUSTIFY_LATE: "Justificar atraso", JUSTIFY_EARLY_EXIT: "Justificar saída antecipada" } as const;
type Type = keyof typeof labels;
function time(value: Date) { return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Belem" }).format(value); }

export function TimeAdjustmentForm({ employeeId, date, entries }: { employeeId: string; date: string; entries: Entry[] }) {
  const [state, action, pending] = useActionState(createTimeAdjustmentAction, {} as TimeAdjustmentFormState);
  const [type, setType] = useState<Type>(entries.length % 2 ? "FORGOTTEN_EXIT" : "ADD_ENTRY");
  const needsTime = type === "ADD_ENTRY" || type === "FORGOTTEN_EXIT";
  return <form className="employee-form treatment-form" action={action}><input type="hidden" name="employeeId" value={employeeId} /><input type="hidden" name="date" value={date} /><div className="field-group"><label htmlFor="type">Tipo de tratamento *</label><select id="type" name="type" value={type} onChange={(event) => setType(event.target.value as Type)}>{Object.entries(labels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></div>{needsTime ? <div className="field-group"><label htmlFor="time">Horário do ajuste *</label><input id="time" name="time" type="time" required /></div> : null}{type === "IGNORE_ENTRY" ? <div className="field-group"><label htmlFor="originalTimeEntryId">Marcação original *</label><select id="originalTimeEntryId" name="originalTimeEntryId" defaultValue="" required><option value="" disabled>Selecione</option>{entries.map((entry) => <option value={entry.id} key={entry.id}>{time(entry.occurredAt)}</option>)}</select></div> : null}<div className="field-group treatment-reason"><label htmlFor="reason">Motivo *</label><textarea id="reason" name="reason" rows={3} maxLength={500} placeholder="Explique a necessidade do tratamento." required /></div>{state.message ? <div className="form-error" role="alert"><strong>{state.message}</strong>{state.errors?.length ? <ul>{state.errors.map((error) => <li key={error}>{error}</li>)}</ul> : null}</div> : null}<button className="primary-button action-button treatment-submit" disabled={pending} type="submit">{pending ? <LoaderCircle className="spin" size={18} /> : <Save size={18} />}{pending ? "Salvando..." : "Registrar tratamento"}</button></form>;
}
