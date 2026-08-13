"use client";

import { FileUp, LoaderCircle, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { confirmMedicalCertificateAction, prepareMedicalCertificateUploadAction } from "@/actions/medical-certificates";
import { MEDICAL_CERTIFICATE_MAX_BYTES, MEDICAL_CERTIFICATE_TYPES } from "@/validations/medical-certificate";

type Employee = { id: string; fullName: string; registrationNumber: string };

export function MedicalCertificateForm({ employees, employeeId, absenceId, date }: { employees: Employee[]; employeeId?: string; absenceId?: string; date?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage(undefined);
    const form = new FormData(event.currentTarget); const file = form.get("file");
    if (!(file instanceof File) || !file.size) { setMessage("Selecione o arquivo do atestado."); setBusy(false); return; }
    if (file.size > MEDICAL_CERTIFICATE_MAX_BYTES) { setMessage("O arquivo deve ter no máximo 8 MB."); setBusy(false); return; }
    const input = { employeeId: form.get("employeeId"), absenceId: form.get("absenceId") || undefined, startDate: form.get("startDate"), endDate: form.get("endDate"), description: form.get("description"), fileName: file.name, contentType: file.type, fileSize: file.size };
    const prepared = await prepareMedicalCertificateUploadAction(input);
    if (!prepared.ok || !prepared.uploadUrl || !prepared.key) { setMessage(prepared.ok ? "Não foi possível preparar o envio." : prepared.message); setBusy(false); return; }
    try {
      const uploaded = await fetch(prepared.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!uploaded.ok) throw new Error("O armazenamento recusou o arquivo.");
      const confirmed = await confirmMedicalCertificateAction({ ...input, fileKey: prepared.key });
      if (!confirmed.ok) throw new Error(confirmed.message);
      router.push(`/admin/atestados?saved=1`); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível enviar o atestado."); setBusy(false); }
  }
  return <form className="employee-form certificate-form" onSubmit={submit}><input name="absenceId" type="hidden" value={absenceId ?? ""} /><section className="form-section"><div className="form-section-heading"><span><ShieldCheck size={20} /></span><div><h2>Vínculo e período</h2><p>Registre apenas as informações necessárias para justificar o afastamento.</p></div></div><div className="form-grid"><div className="field-group field-span-2"><label htmlFor="employeeId">Funcionário *</label><select id="employeeId" name="employeeId" defaultValue={employeeId ?? ""} required><option value="" disabled>Selecione</option>{employees.map((employee) => <option value={employee.id} key={employee.id}>{employee.fullName} · {employee.registrationNumber}</option>)}</select></div><div className="field-group"><label htmlFor="startDate">Início *</label><input id="startDate" name="startDate" type="date" defaultValue={date} required /></div><div className="field-group"><label htmlFor="endDate">Fim *</label><input id="endDate" name="endDate" type="date" defaultValue={date} required /></div><div className="field-group field-span-2"><label htmlFor="description">Descrição administrativa</label><textarea id="description" name="description" maxLength={300} rows={3} placeholder="Informação mínima, sem detalhar diagnóstico." /></div></div></section><section className="form-section"><div className="form-section-heading"><span><FileUp size={20} /></span><div><h2>Arquivo protegido</h2><p>PDF, JPG ou PNG, com no máximo 8 MB.</p></div></div><div className="certificate-upload"><input id="file" name="file" type="file" accept={MEDICAL_CERTIFICATE_TYPES.join(",")} required /><small>O arquivo será enviado diretamente ao bucket privado e não passará pelo banco de dados.</small></div></section>{message ? <p className="form-error" role="alert">{message}</p> : null}<div className="form-actions"><button className="primary-button" disabled={busy} type="submit">{busy ? <LoaderCircle className="spin" size={18} /> : <FileUp size={18} />}{busy ? "Enviando com segurança..." : "Anexar e aprovar atestado"}</button></div></form>;
}
