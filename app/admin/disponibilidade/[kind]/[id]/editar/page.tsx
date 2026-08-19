import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AvailabilityForm } from "@/components/availability/availability-form";
import { getAvailabilityRecord } from "@/services/availability.service";
import { listEligibleEmployees } from "@/services/work-schedule.service";
import { availabilityIdSchema, availabilityKindSchema } from "@/validations/availability";

export default async function EditAvailabilityPage({ params }: { params: Promise<{ kind: string; id: string }> }) {
  const { kind: rawKind, id: rawId } = await params;
  const parsedKind = availabilityKindSchema.safeParse(rawKind);
  const parsedId = availabilityIdSchema.safeParse(rawId);
  if (!parsedKind.success || !parsedId.success) notFound();
  const [record, employees] = await Promise.all([getAvailabilityRecord(parsedKind.data, parsedId.data), listEligibleEmployees()]);
  if (!record) notFound();
  const editing = {
    id: record.id,
    employeeId: record.employeeId,
    date: "date" in record ? record.date : "dayOffDate" in record ? record.dayOffDate : undefined,
    startDate: "startDate" in record ? record.startDate : undefined,
    endDate: "endDate" in record ? record.endDate : undefined,
    workDate: "workDate" in record ? record.workDate : undefined,
    leaveType: "type" in record ? (record.type as string) : undefined,
    reason: record.reason,
  };
  return <main className="dashboard-page form-page">
    <Link className="back-link" href="/admin/disponibilidade"><ArrowLeft size={17} /> Voltar para disponibilidade</Link>
    <div className="page-heading compact-heading"><div><p className="eyebrow">Planejamento da equipe</p><h1>Editar registro</h1><p>Ajuste as datas ou o motivo sem perder o histórico de auditoria.</p></div></div>
    <AvailabilityForm employees={employees} initialKind={parsedKind.data} editing={editing} />
  </main>;
}
