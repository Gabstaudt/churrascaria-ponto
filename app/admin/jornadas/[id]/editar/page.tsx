import { ArrowLeft, PencilLine } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { WorkScheduleForm } from "@/components/schedules/work-schedule-form";
import { getWorkScheduleById, listEligibleEmployees } from "@/services/work-schedule.service";
import { employeeIdSchema } from "@/validations/employee";

export default async function EditSchedulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!employeeIdSchema.safeParse(id).success) notFound();
  const [schedule, eligibleEmployees] = await Promise.all([getWorkScheduleById(id), listEligibleEmployees()]);
  if (!schedule) notFound();
  const employees = eligibleEmployees.some((employee) => employee.id === schedule.employeeId)
    ? eligibleEmployees
    : [{ id: schedule.employeeId, fullName: schedule.employeeName, registrationNumber: schedule.registrationNumber }, ...eligibleEmployees];

  return <main className="dashboard-page schedule-form-page">
    <Link className="back-link" href={`/admin/jornadas/${schedule.id}`}><ArrowLeft size={17} /> Voltar para a jornada</Link>
    <header className="schedule-form-header"><span><PencilLine size={24} /></span><div><p className="eyebrow">Editar jornada</p><h1>{schedule.name}</h1><p>Atualize a vigência e os horários semanais de {schedule.employeeName}.</p></div></header>
    <WorkScheduleForm employees={employees} schedule={schedule} />
  </main>;
}
