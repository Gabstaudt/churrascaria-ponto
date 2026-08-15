import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { PontoSyncState } from "./types";

const EMPTY_STATE: PontoSyncState = { version: 1, queue: [] };

export class FileStateStore {
  constructor(private readonly path: string) {}

  async read(): Promise<PontoSyncState> {
    try {
      const parsed: unknown = JSON.parse(await readFile(this.path, "utf8"));
      if (!parsed || typeof parsed !== "object" || (parsed as PontoSyncState).version !== 1 || !Array.isArray((parsed as PontoSyncState).queue)) throw new Error("Estado local incompatível.");
      return parsed as PontoSyncState;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return structuredClone(EMPTY_STATE);
      throw error;
    }
  }

  async write(state: PontoSyncState) {
    await mkdir(dirname(this.path), { recursive: true, mode: 0o700 });
    const temporary = `${this.path}.${process.pid}.tmp`;
    await writeFile(temporary, `${JSON.stringify(state)}\n`, { encoding: "utf8", mode: 0o600 });
    await rename(temporary, this.path);
  }
}
