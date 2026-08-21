import "server-only";

import { and, asc, eq, gte, lt } from "drizzle-orm";
import { db } from "@/db";
import {
  employees,
  establishments,
  repCollectors,
  repConfigurations,
  repRegistrars,
  timeEntries,
} from "@/db/schema";
import { generatePointReceipt } from "@/modules/point-receipts/services/point-receipt.service";
import { recordRepPEvent } from "@/rep-p/audit.service";
import { nextRepPNsr } from "@/rep-p/nsr.service";
import {
  officialRecordedAt,
  type OfficialClock,
  systemOfficialClock,
} from "@/rep-p/official-clock.service";
import {
  assertRepPRegistrationContext,
  assertRepPReplayMatches,
  repPRequestFingerprint,
  RepPRegistrationError,
} from "@/rep-p/registration-core";
import { belemDate, officialDateTime } from "./daily-attendance-core";
import { getScheduleCalendar } from "./schedule-calendar.service";

// Janela de registro de entrada: de 10 minutos antes até 2 horas depois do início
// previsto do turno. Fora dela, a entrada é bloqueada — atrasos maiores exigem
// tratamento administrativo (não um registro tardio direto no terminal).
const EARLY_CLOCK_IN_TOLERANCE_MINUTES = 10;
const LATE_CLOCK_IN_TOLERANCE_MINUTES = 120;
// A saída não pode ocorrer mais de 6 horas depois da entrada correspondente.
const MAX_CLOCK_OUT_HOURS_AFTER_ENTRY = 6;

function belemTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Belem" }).format(date);
}

// Marcações já registradas hoje para o funcionário, em ordem cronológica. Índices pares
// (0, 2, 4...) são entradas (início do turno ou volta de intervalo); índices ímpares são
// saídas (início de intervalo ou fim do turno) — o mesmo par entrada/saída alternado usado
// no restante do sistema (ver pairTimeEntries em daily-attendance-core.ts).
async function todaysEntries(employeeId: string, occurredAt: Date) {
  const date = belemDate(occurredAt);
  const dayStart = officialDateTime(date, "00:00");
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60_000);
  return db
    .select({ occurredAt: timeEntries.occurredAt })
    .from(timeEntries)
    .where(and(eq(timeEntries.employeeId, employeeId), gte(timeEntries.occurredAt, dayStart), lt(timeEntries.occurredAt, dayEnd)))
    .orderBy(asc(timeEntries.occurredAt));
}

async function assertClockInWithinWindow(employeeId: string, occurredAt: Date) {
  const entries = await todaysEntries(employeeId, occurredAt);
  if (entries.length % 2 !== 0) {
    throw new RepPRegistrationError(
      "OPEN_CLOCK_IN_PENDING",
      "Já existe uma entrada registrada hoje sem a saída correspondente. Registre a saída antes de uma nova entrada.",
    );
  }
  const date = belemDate(occurredAt);
  const { rows } = await getScheduleCalendar({ start: date, end: date, employeeId });
  const row = rows[0];
  if (!row || row.situation !== "WORK" || !row.startTime) return;

  // 1ª entrada do dia: janela em torno do início do turno. 2ª entrada (volta de
  // intervalo): janela em torno do fim do intervalo previsto na escala. Marcações
  // além dessas duas correspondem a blocos de hora extra programada (na ordem em
  // que foram cadastrados) — cada bloco tem sua própria janela e tolerância.
  // Qualquer marcação que não corresponda a nenhum horário previsto bloqueia e
  // direciona para tratamento administrativo.
  const regularExpectedCount = row.breakEndTime ? 4 : 2;
  let referenceTime: string;
  let referenceLabel: string;
  let toleranceMinutes = EARLY_CLOCK_IN_TOLERANCE_MINUTES;
  if (entries.length === 0) {
    referenceTime = row.startTime;
    referenceLabel = "início do turno";
  } else if (entries.length === 2 && row.breakEndTime) {
    referenceTime = row.breakEndTime;
    referenceLabel = "fim do intervalo";
  } else if (entries.length >= regularExpectedCount && (entries.length - regularExpectedCount) % 2 === 0) {
    const overtimeIndex = (entries.length - regularExpectedCount) / 2;
    const overtimePeriod = row.overtimePeriods[overtimeIndex];
    if (!overtimePeriod) {
      throw new RepPRegistrationError(
        "UNEXPECTED_CLOCK_IN",
        "Esta marcação não corresponde a nenhum horário previsto na escala de hoje. Procure a administração.",
      );
    }
    referenceTime = overtimePeriod.startTime;
    referenceLabel = "início do período de hora extra";
    toleranceMinutes = overtimePeriod.toleranceMinutes;
  } else {
    throw new RepPRegistrationError(
      "UNEXPECTED_CLOCK_IN",
      "Esta marcação não corresponde a nenhum horário previsto na escala de hoje. Procure a administração.",
    );
  }

  const scheduledMoment = officialDateTime(date, referenceTime).getTime();
  const earliestAllowed = scheduledMoment - toleranceMinutes * 60_000;
  const latestAllowed = scheduledMoment + LATE_CLOCK_IN_TOLERANCE_MINUTES * 60_000;
  if (occurredAt.getTime() < earliestAllowed) {
    throw new RepPRegistrationError(
      "TOO_EARLY_FOR_SHIFT",
      `Ainda não é possível registrar entrada. O ${referenceLabel} é às ${referenceTime.slice(0, 5)}.`,
    );
  }
  if (occurredAt.getTime() > latestAllowed) {
    throw new RepPRegistrationError(
      "TOO_LATE_FOR_SHIFT",
      `Não é mais possível registrar entrada por aqui. O prazo terminou às ${belemTime(new Date(latestAllowed))}. Procure a administração.`,
    );
  }
}

async function assertClockOutMatchesOpenEntry(employeeId: string, occurredAt: Date) {
  const entries = await todaysEntries(employeeId, occurredAt);
  if (entries.length % 2 === 0) {
    throw new RepPRegistrationError(
      "NO_OPEN_CLOCK_IN",
      "Não é possível registrar saída sem uma entrada registrada hoje.",
    );
  }
  const lastEntry = entries[entries.length - 1]!.occurredAt;
  const limit = lastEntry.getTime() + MAX_CLOCK_OUT_HOURS_AFTER_ENTRY * 60 * 60_000;
  if (occurredAt.getTime() > limit) {
    throw new RepPRegistrationError(
      "CLOCK_OUT_WINDOW_EXPIRED",
      `A saída deve ser registrada em até ${MAX_CLOCK_OUT_HOURS_AFTER_ENTRY} horas após a entrada. Procure a administração.`,
    );
  }
}

export type RegisterRepPPointInput = {
  employeeId: string;
  collectorId: string;
  eventType: "CLOCK_IN" | "CLOCK_OUT";
  idempotencyKey: string;
  locationValidationId?: string;
  biometricValidationId?: string;
  registrationAttemptId?: string;
  contingencyEventId?: string;
  trustedOccurredAt?: Date;
  contingency?: boolean;
  // Só verdadeiro quando um admin revisou e aprovou explicitamente uma solicitação de
  // contingência (src/actions/contingencies.ts). Nesse caso, o admin já vouches pelo
  // horário fora do padrão, então as janelas de entrada/saída não se aplicam.
  bypassWindowChecks?: boolean;
};

class ConcurrentRepPReplay extends Error {}

function registrationResult(
  entry: typeof timeEntries.$inferSelect,
  eventType: RegisterRepPPointInput["eventType"],
  replay: boolean,
) {
  return {
    id: entry.id,
    employeeId: entry.employeeId,
    establishmentId: entry.establishmentId!,
    registrarId: entry.registrarId!,
    collectorId: entry.collectorId!,
    nsr: entry.nsr!,
    recordedAt: entry.occurredAt,
    eventType,
    replay,
  };
}

type RegistrationResult = ReturnType<typeof registrationResult>;

async function attachReceipt(result: RegistrationResult) {
  try {
    const receipt = await generatePointReceipt(result.id);

    if (!receipt) {
      return { ...result, receipt: undefined };
    }

    return {
      ...result,
      receipt: {
        id: receipt.id,
        receiptNumber: receipt.receiptNumber,
        status: receipt.status,
      },
    };
  } catch {
    // O comprovante é um efeito posterior ao registro oficial. Uma falha
    // inesperada nunca pode desfazer ou ocultar a marcação já persistida.
    return { ...result, receipt: undefined };
  }
}

export async function registerRepPPoint(
  input: RegisterRepPPointInput,
  clock: OfficialClock = systemOfficialClock,
) {
  const requestFingerprint = repPRequestFingerprint(input.employeeId, input.eventType);
  const [existing] = await db
    .select()
    .from(timeEntries)
    .where(
      and(
        eq(timeEntries.collectorId, input.collectorId),
        eq(timeEntries.idempotencyKey, input.idempotencyKey),
      ),
    )
    .limit(1);

  if (existing) {
    assertRepPReplayMatches(existing.metadata, requestFingerprint);
    return attachReceipt(registrationResult(existing, input.eventType, true));
  }

  const [context] = await db
    .select({
      collectorId: repCollectors.id,
      collectorStatus: repCollectors.status,
      deviceIdentifier: repCollectors.deviceIdentifier,
      registrarId: repRegistrars.id,
      registrarStatus: repRegistrars.status,
      registrarMode: repRegistrars.mode,
      establishmentId: establishments.id,
      establishmentActive: establishments.isActive,
      timezone: establishments.timezone,
      registrationEnabled: repConfigurations.registrationEnabled,
    })
    .from(repCollectors)
    .innerJoin(repRegistrars, eq(repRegistrars.id, repCollectors.registrarId))
    .innerJoin(establishments, eq(establishments.id, repRegistrars.establishmentId))
    .innerJoin(repConfigurations, eq(repConfigurations.registrarId, repRegistrars.id))
    .where(eq(repCollectors.id, input.collectorId))
    .limit(1);

  if (!context) {
    throw new RepPRegistrationError("COLLECTOR_NOT_FOUND", "Coletor não encontrado.");
  }

  const [employee] = await db
    .select({ id: employees.id, isActive: employees.isActive, status: employees.status })
    .from(employees)
    .where(eq(employees.id, input.employeeId))
    .limit(1);

  if (!employee) {
    throw new RepPRegistrationError("EMPLOYEE_NOT_FOUND", "Funcionário não encontrado.");
  }

  assertRepPRegistrationContext({
    ...context,
    employeeActive: employee.isActive,
    employeeStatus: employee.status,
  });

  const occurredAt = input.trustedOccurredAt ?? officialRecordedAt(clock);

  if (!input.bypassWindowChecks) {
    if (input.eventType === "CLOCK_IN") await assertClockInWithinWindow(employee.id, occurredAt);
    else await assertClockOutMatchesOpenEntry(employee.id, occurredAt);
  }

  let result: RegistrationResult;

  try {
    result = await db.transaction(async (tx) => {
      const nsr = await nextRepPNsr(tx, context.establishmentId);
      await recordRepPEvent(tx, {
        eventType: "REP_P_NSR_ASSIGNED",
        outcome: "SUCCESS",
        registrarId: context.registrarId,
        collectorId: context.collectorId,
        employeeId: employee.id,
        nsr,
        occurredAt,
      });

      const [entry] = await tx
        .insert(timeEntries)
        .values({
          employeeId: employee.id,
          occurredAt,
          source: "REP_P",
          externalId: `rep-p:${context.registrarId}:${nsr}`,
          deviceIdentifier: context.deviceIdentifier,
          establishmentId: context.establishmentId,
          registrarId: context.registrarId,
          collectorId: context.collectorId,
          nsr,
          idempotencyKey: input.idempotencyKey,
          locationValidationId: input.locationValidationId,
          biometricValidationId: input.biometricValidationId,
          registrationAttemptId: input.registrationAttemptId,
          contingencyEventId: input.contingencyEventId,
          metadata: {
            eventType: input.eventType,
            timezone: context.timezone,
            original: true,
            authenticationMethod: input.contingency ? "CONTINGENCY" : "BIOMETRIC",
            capturedOffline: Boolean(input.trustedOccurredAt),
            requestFingerprint,
          },
        })
        .onConflictDoNothing({
          target: [timeEntries.collectorId, timeEntries.idempotencyKey],
        })
        .returning();

      if (!entry) throw new ConcurrentRepPReplay();

      await recordRepPEvent(tx, {
        eventType: "REP_P_ENTRY_CREATED",
        outcome: "SUCCESS",
        registrarId: context.registrarId,
        collectorId: context.collectorId,
        employeeId: employee.id,
        nsr,
        metadata: {
          timeEntryId: entry.id,
          eventType: input.eventType,
          contingencyEventId: input.contingencyEventId,
        },
        occurredAt,
      });

      return registrationResult(entry, input.eventType, false);
    });
  } catch (error) {
    if (!(error instanceof ConcurrentRepPReplay)) throw error;

    const [replayed] = await db
      .select()
      .from(timeEntries)
      .where(
        and(
          eq(timeEntries.collectorId, input.collectorId),
          eq(timeEntries.idempotencyKey, input.idempotencyKey),
        ),
      )
      .limit(1);

    if (!replayed) throw new Error("Reenvio concorrente não localizado.");
    assertRepPReplayMatches(replayed.metadata, requestFingerprint);
    result = registrationResult(replayed, input.eventType, true);
  }

  return attachReceipt(result);
}
