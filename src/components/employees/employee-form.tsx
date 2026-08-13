"use client";

import { LoaderCircle, Save } from "lucide-react";
import { useActionState } from "react";

import { createEmployeeAction, type EmployeeFormState } from "@/actions/employees";

const initialState: EmployeeFormState = {};

function FieldError({ errors }: { errors?: string[] }) {
  return errors?.length ? <p className="field-error">{errors[0]}</p> : null;
}

export function EmployeeForm() {
  const [state, action, pending] = useActionState(createEmployeeAction, initialState);

  return (
    <form className="employee-form" action={action} noValidate>
      <div className="form-grid">
        <div className="field-group field-span-2">
          <label htmlFor="fullName">Nome completo</label>
          <input id="fullName" name="fullName" autoComplete="name" maxLength={150} required />
          <FieldError errors={state.errors?.fullName} />
        </div>
        <div className="field-group">
          <label htmlFor="cpf">CPF</label>
          <input id="cpf" name="cpf" inputMode="numeric" placeholder="000.000.000-00" maxLength={14} required />
          <FieldError errors={state.errors?.cpf} />
        </div>
        <div className="field-group">
          <label htmlFor="phone">Telefone</label>
          <input id="phone" name="phone" type="tel" inputMode="tel" placeholder="(91) 99999-9999" maxLength={16} />
          <FieldError errors={state.errors?.phone} />
        </div>
        <div className="field-group">
          <label htmlFor="registrationNumber">Matrícula</label>
          <input id="registrationNumber" name="registrationNumber" maxLength={50} required />
          <FieldError errors={state.errors?.registrationNumber} />
        </div>
        <div className="field-group">
          <label htmlFor="position">Cargo</label>
          <input id="position" name="position" maxLength={100} required />
          <FieldError errors={state.errors?.position} />
        </div>
        <div className="field-group">
          <label htmlFor="admissionDate">Data de admissão</label>
          <input id="admissionDate" name="admissionDate" type="date" required />
          <FieldError errors={state.errors?.admissionDate} />
        </div>
      </div>

      {state.message ? <p className="form-error" role="alert">{state.message}</p> : null}

      <div className="form-actions">
        <button className="primary-button action-button" type="submit" disabled={pending}>
          {pending ? <LoaderCircle className="spin" size={18} /> : <Save size={18} />}
          {pending ? "Salvando..." : "Cadastrar funcionário"}
        </button>
      </div>
    </form>
  );
}
