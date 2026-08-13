"use client";

import { BriefcaseBusiness, LoaderCircle, Save, UserRound } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

import { createEmployeeAction, updateEmployeeAction, type EmployeeFormState } from "@/actions/employees";
import type { Employee, EmployeeStatus } from "@/db/schema";

const initialState: EmployeeFormState = {};

function FieldError({ errors }: { errors?: string[] }) {
  return errors?.length ? <p className="field-error">{errors[0]}</p> : null;
}

const statusOptions: Array<{ value: EmployeeStatus; label: string }> = [
  { value: "ACTIVE", label: "Ativo" }, { value: "VACATION", label: "Em férias" },
  { value: "LEAVE", label: "Afastado" }, { value: "TERMINATED", label: "Desligado" },
  { value: "INACTIVE", label: "Inativo" },
];

export function EmployeeForm({ employee }: { employee?: Employee }) {
  const formAction = employee ? updateEmployeeAction.bind(null, employee.id) : createEmployeeAction;
  const [state, action, pending] = useActionState(formAction, initialState);

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
            <input id="fullName" name="fullName" defaultValue={employee?.fullName} autoComplete="name" placeholder="Ex.: Maria da Silva" maxLength={150} required />
            <FieldError errors={state.errors?.fullName} />
          </div>
          <div className="field-group">
            <label htmlFor="cpf">CPF <span aria-hidden="true">*</span></label>
            <input id="cpf" name="cpf" defaultValue={employee?.cpf} inputMode="numeric" placeholder="000.000.000-00" maxLength={14} required />
            <small>Digite um CPF válido. A máscara é aplicada na exibição.</small>
            <FieldError errors={state.errors?.cpf} />
          </div>
          <div className="field-group">
            <label htmlFor="phone">Telefone <em>Opcional</em></label>
            <input id="phone" name="phone" defaultValue={employee?.phone ?? ""} type="tel" inputMode="tel" autoComplete="tel" placeholder="(91) 99999-9999" maxLength={16} />
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
            <input id="registrationNumber" name="registrationNumber" defaultValue={employee?.registrationNumber} placeholder="Ex.: FUNC-001" maxLength={50} required />
            <FieldError errors={state.errors?.registrationNumber} />
          </div>
          <div className="field-group">
            <label htmlFor="position">Cargo <span aria-hidden="true">*</span></label>
            <input id="position" name="position" defaultValue={employee?.position} placeholder="Ex.: Garçom" maxLength={100} required />
            <FieldError errors={state.errors?.position} />
          </div>
          <div className="field-group">
            <label htmlFor="admissionDate">Data de admissão <span aria-hidden="true">*</span></label>
            <input id="admissionDate" name="admissionDate" defaultValue={employee?.admissionDate} type="date" required />
            <FieldError errors={state.errors?.admissionDate} />
          </div>
          {employee ? <div className="field-group"><label htmlFor="status">Status <span aria-hidden="true">*</span></label><select id="status" name="status" defaultValue={employee.status}>{statusOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select><FieldError errors={state.errors?.status} /></div> : null}
        </div>
      </section>

      {state.message ? <p className="form-error" role="alert">{state.message}</p> : null}

      <div className="form-actions">
        <Link className="cancel-button" href={employee ? `/admin/funcionarios/${employee.id}` : "/admin/funcionarios"}>Cancelar</Link>
        <button className="primary-button action-button" type="submit" disabled={pending}>
          {pending ? <LoaderCircle className="spin" size={18} /> : <Save size={18} />}
          {pending ? "Salvando..." : employee ? "Salvar alterações" : "Cadastrar funcionário"}
        </button>
      </div>
    </form>
  );
}
