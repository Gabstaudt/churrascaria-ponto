import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

async function sourceFiles(directory: string): Promise<string[]> { const entries = await readdir(directory, { withFileTypes: true }); const nested = await Promise.all(entries.map((entry) => entry.isDirectory() ? sourceFiles(join(directory, entry.name)) : /\.(ts|tsx)$/.test(entry.name) ? [join(directory, entry.name)] : [])); return nested.flat(); }
describe("REP-P original entry immutability", () => { it("não expõe update ou delete de timeEntries em serviços, ações ou endpoints", async () => { const files = (await Promise.all([sourceFiles("src/services"), sourceFiles("src/actions"), sourceFiles("app")])).flat(); const violations: string[] = []; for (const file of files) { const source = await readFile(file, "utf8"); if (/\.(update|delete)\(timeEntries\)/.test(source)) violations.push(file); } expect(violations).toEqual([]); }); });
