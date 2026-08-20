import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { repCollectors, repRegistrars } from "@/db/schema";
import { generateRepCredential, hashRepCredential } from "@/rep/credential";
import { recordRepPEvent } from "@/rep-p/audit.service";
export async function setCollectorStatus(collectorId: string, status: "ACTIVE" | "BLOCKED") { return db.transaction(async (tx) => { const [collector] = await tx.update(repCollectors).set({ status, activeInstanceId: status === "ACTIVE" ? null : undefined, activeInstanceSeenAt: status === "ACTIVE" ? null : undefined, updatedAt: new Date() }).where(eq(repCollectors.id, collectorId)).returning({ id: repCollectors.id, registrarId: repCollectors.registrarId }); if (collector) await recordRepPEvent(tx, { eventType: status === "BLOCKED" ? "COLLECTOR_BLOCKED" : "COLLECTOR_UNBLOCKED", outcome: "SUCCESS", collectorId: collector.id, registrarId: collector.registrarId }); return collector; }); }

export class TerminalDeviceConflictError extends Error {
  constructor() { super("Já existe um terminal com este identificador de dispositivo."); this.name = "TerminalDeviceConflictError"; }
}
function pepper() { const value = process.env.REP_CREDENTIAL_PEPPER; if (!value || value.length < 32) throw new Error("REP_CREDENTIAL_PEPPER não configurado com segurança."); return value; }

export async function createTerminal(input: { name: string; deviceIdentifier: string }) {
  const [registrar] = await db.select({ id: repRegistrars.id }).from(repRegistrars).where(eq(repRegistrars.status, "ACTIVE")).limit(1);
  if (!registrar) throw new Error("Nenhum registrador REP-P ativo encontrado.");
  const placeholder = generateRepCredential();
  try {
    return await db.transaction(async (tx) => {
      const [collector] = await tx.insert(repCollectors).values({ registrarId: registrar.id, name: input.name, deviceIdentifier: input.deviceIdentifier, status: "INACTIVE", credentialHash: hashRepCredential(placeholder.token, pepper()), credentialPrefix: placeholder.prefix }).returning();
      if (!collector) throw new Error("Não foi possível criar o terminal.");
      await recordRepPEvent(tx, { eventType: "REP_P_COLLECTOR_AUTHORIZED", outcome: "SUCCESS", collectorId: collector.id, registrarId: registrar.id });
      return collector;
    });
  } catch (error) {
    const candidate = error as { code?: string; constraint_name?: string; constraint?: string };
    if (candidate?.code === "23505" && (candidate.constraint_name ?? candidate.constraint) === "rep_collectors_device_unique") throw new TerminalDeviceConflictError();
    throw error;
  }
}
