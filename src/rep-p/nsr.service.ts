import { sql } from "drizzle-orm";
import type { Database } from "@/db";
import { formatRepPNsr } from "./nsr-core";

type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

export async function nextRepPNsr(tx: Transaction, establishmentId: string) {
  const rows = await tx.execute<{ current_value: string | number | bigint }>(sql`insert into rep_nsr_sequences (establishment_id, current_value, updated_at) values (${establishmentId}::uuid, 1, now()) on conflict (establishment_id) do update set current_value = rep_nsr_sequences.current_value + 1, updated_at = now() returning current_value`);
  const value = rows[0]?.current_value;
  // tx.execute() e SQL bruto: o driver postgres.js retorna colunas bigint como string,
  // ignorando o mode:"number" do Drizzle (que so se aplica ao query builder tipado).
  const numeric = typeof value === "bigint" ? Number(value) : typeof value === "string" ? Number(value) : value;
  if (value === undefined || !Number.isSafeInteger(numeric) || numeric < 1) throw new Error("Não foi possível reservar o NSR.");
  return formatRepPNsr(BigInt(value));
}

export async function exerciseConcurrentNsr(reserve: () => Promise<string>, requests: number) { return Promise.all(Array.from({ length: requests }, reserve)); }
