import { readFile } from "node:fs/promises";
import type { REPRecord } from "@/rep/contracts";
import { mockRepBatchSchema } from "@/validations/rep";
import type { PontoSyncSourceAdapter } from "./types";

export class FixtureSourceAdapter implements PontoSyncSourceAdapter {
  readonly id = "FIXTURE";
  constructor(private readonly path: string) {}

  async fetchAfter(lastConfirmedNsr: string | undefined, limit: number): Promise<REPRecord[]> {
    const payload: unknown = JSON.parse(await readFile(this.path, "utf8"));
    const records = mockRepBatchSchema.parse(payload).records;
    const current = lastConfirmedNsr === undefined ? undefined : BigInt(lastConfirmedNsr);
    return records.filter((record) => current === undefined || BigInt(record.nsr) > current).sort((a, b) => BigInt(a.nsr) < BigInt(b.nsr) ? -1 : BigInt(a.nsr) > BigInt(b.nsr) ? 1 : 0).slice(0, limit);
  }
}
