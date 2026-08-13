"use client";

import { BriefcaseBusiness, LoaderCircle, Save, UserRound } from "lucide-react";
import Link from "next/link";
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
      <section className="form-section" aria-labelledby="personal-data-title">
        <div className="form-section-heading">
          <span><UserRound size={20} /></span>
          <div><h2 id="personal-data-title">Dados pessoais</h2><p>Informações de identificação e contato.</p></div>
        </div>
        <div className="form-grid">
          <div className="field-group field-span-2">
            <label htmlFor="fullName">Nome completo <span aria-hidden="true">*</span></label>
            <input id="fullName" name="fullName" autoComplete="name" placeholder="Ex.: Maria da Silva" maxLength={150} required />
            <FieldError errors={state.errors?.fullName} />
          </div>
          <div className="field-group">
            <label htmlFor="cpf">CPF <span aria-hidden="true">*</span></label>
            <input id="cpf" name="cpf" inputMode="numeric" placeholder="000.000.000-00" maxLength={14} required />
            <small>Digite um CPF válido. A máscara é aplicada na exibição.</small>
            <FieldError errors={state.errors?.cpf} />
          </div>
          <div className="field-group">
            <label htmlFor="phone">Telefone <em>Opcional</em></label>
            <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="(91) 99999-9999" maxLength={16} />
            <FieldError errors={state.errors?.phone} />
          </div>
        </div>
      </section>

      <section className="form-section" aria-labelledby="work-data-title">
        <div className="form-section-heading">
          <span><BriefcaseBusiness size={20} /></span>
          <div><h2 id="work-data-title">Dados profissionais</h2><p>Vínculo do funcionário com a empresa.</p></div>
        </div>
        <div className="form-grid form-grid-3">
          <div className="field-group">
            <label htmlFor="registrationNumber">Matrícula <span aria-hidden="true">*</span></label>
            <input id="registrationNumber" name="registrationNumber" placeholder="Ex.: FUNC-001" maxLength={50} required />
            <FieldError errors={state.errors?.registrationNumber} />
          </div>
          <div className="field-group">
            <label htmlFor="position">Cargo <span aria-hidden="true">*</span></label>
            <input id="position" name="position" placeholder="Ex.: Garçom" maxLength={100} required />
            <FieldError errors={state.errors?.position} />
          </div>
          <div className="field-group">
            <label htmlFor="admissionDate">Data de admissão <span aria-hidden="true">*</span></label>
            <input id="admissionDate" name="admissionDate" type="date" required />
            <FieldError errors={state.errors?.admissionDate} />
          </div>
        </div>
      </section>

      {state.message ? <p className="form-error" role="alert">{state.message}</p> : null}

      <div className="form-actions">
        <Link className="cancel-button" href="/admin/funcionarios">Cancelar</Link>
        <button className="primary-button action-button" type="submit" disabled={pending}>
          {pending ? <LoaderCircle className="spin" size={18} /> : <Save size={18} />}
          {pending ? "Salvando..." : "Cadastrar funcionário"}
        </button>
      </div>
    </form>
  );
}
