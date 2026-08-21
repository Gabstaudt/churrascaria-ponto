import { ArrowLeft, CalendarCog, History, Plus, Timer, Trash2, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { createOvertimePeriodAction, deleteOvertimePeriodAction } from "@/actions/overtime-periods";
import { ScheduleExceptionForm } from "@/components/schedules/schedule-exception-form";
import { listScheduledOvertimePeriods } from "@/services/overtime-period.service";
import { getTimeBankAccumulatedBalance } from "@/services/time-bank.service";
import { listEligibleEmployees } from "@/services/work-schedule.service";

function formatMinutes(value: number) { const sign = value > 0 ? "+" : value < 0 ? "−" : ""; const absolute = Math.abs(value); const hours = Math.floor(absolute / 60); const minutes = absolute % 60; return hours ? `${sign}${hours}h ${String(minutes).padStart(2, "0")}min` : `${sign}${minutes} min`; }

const overtimeErrorLabels = { invalid: "Revise o horário e o motivo.", closed: "O período está fechado para alterações.", create: "Não foi possível registrar o período.", delete: "Não foi possível excluir o período." } as const;

export default async function ScheduleAdjustmentPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const employeeId = typeof query.employeeId === "string" ? query.employeeId : undefined;
  const date = typeof query.date === "string" ? query.date : undefined;
  const [employees, balance, overtimePeriods] = await Promise.all([
    listEligibleEmployees(),
    employeeId ? getTimeBankAccumulatedBalance(employeeId) : Promise.resolve(undefined),
    employeeId && date ? listScheduledOvertimePeriods(employeeId, date) : Promise.resolve([]),
  ]);
  const overtimeError = query.error ? overtimeErrorLabels[query.error as keyof typeof overtimeErrorLabels] : undefined;
  return <main className="dashboard-page schedule-form-page">
    <Link className="back-link" href="/admin/escalas"><ArrowLeft size={17} /> Voltar para escalas</Link>
    <header className="schedule-form-header"><span><CalendarCog size={24} /></span><div><p className="eyebrow">Exceção por data</p><h1>Ajustar escala</h1><p>Registre uma mudança pontual sem alterar a jornada semanal do funcionário. Útil também para escalas de compensação de horas — o próprio horário estendido já credita o banco de horas quando o período for processado.</p></div></header>
    {balance !== undefined ? <div className={`form-alert${balance < 0 ? " warning" : ""}`}><History size={18} /><span>Saldo atual do banco de horas: <strong>{formatMinutes(balance)}</strong>. <Link href="/admin/banco-horas">Ver extrato</Link></span></div> : null}
    <ScheduleExceptionForm employees={employees} employeeId={employeeId} date={date} />

    <section className="data-panel terminal-create-panel">
      <header><div><h2>Hora extra programada</h2><p>Um bloco de trabalho somado ao dia já normal (ex.: sábado com dois turnos). É creditado integralmente no banco de horas, sem descontar do horário previsto.</p></div></header>
      <form className="time-entry-filters" action="/admin/escalas/ajuste">
        <select name="employeeId" defaultValue={employeeId ?? ""} required><option value="" disabled>Selecione o funcionário</option>{employees.map((employee) => <option value={employee.id} key={employee.id}>{employee.fullName} · {employee.registrationNumber}</option>)}</select>
        <input name="date" type="date" defaultValue={date} required />
        <button type="submit">Gerenciar horas extras</button>
      </form>
      {!employeeId || !date ? (
        <div className="empty-state"><Timer size={28} /><h2>Selecione funcionário e data</h2><p>Escolha um funcionário e uma data acima para gerenciar os blocos de hora extra daquele dia.</p></div>
      ) : (
        <>
          {query.saved === "overtime" ? <p className="success-message">Período de hora extra registrado.</p> : null}
          {query.deleted === "overtime" ? <p className="success-message">Período de hora extra removido.</p> : null}
          {overtimeError ? <div className="form-alert danger"><TriangleAlert /><span>{overtimeError}</span></div> : null}
          <div className="terminal-admin-list">
            {overtimePeriods.map((period) => <article key={period.id}>
              <span className="terminal-admin-icon"><Timer size={20} /></span>
              <div><strong>{period.startTime.slice(0, 5)} — {period.endTime.slice(0, 5)}</strong><small>{period.reason}</small></div>
              <form action={deleteOvertimePeriodAction}>
                <input type="hidden" name="id" value={period.id} />
                <input type="hidden" name="employeeId" value={employeeId} />
                <input type="hidden" name="date" value={date} />
                <button className="danger" type="submit"><Trash2 size={14} /> Excluir</button>
              </form>
            </article>)}
            {!overtimePeriods.length && <p className="terminal-admin-empty">Nenhum período de hora extra programado para esta data.</p>}
          </div>
          <form className="terminal-create-form" action={createOvertimePeriodAction}>
            <input type="hidden" name="employeeId" value={employeeId} />
            <input type="hidden" name="date" value={date} />
            <div className="field-group"><label htmlFor="overtimeStartTime">Início *</label><input id="overtimeStartTime" name="startTime" type="time" required /></div>
            <div className="field-group"><label htmlFor="overtimeEndTime">Fim *</label><input id="overtimeEndTime" name="endTime" type="time" required /></div>
            <div className="field-group field-span-2"><label htmlFor="overtimeReason">Motivo *</label><input id="overtimeReason" name="reason" maxLength={500} placeholder="Ex.: segundo turno de sábado" required /></div>
            <button className="primary-button action-button" type="submit"><Plus size={16} /> Adicionar período</button>
          </form>
        </>
      )}
    </section>
  </main>;
}
