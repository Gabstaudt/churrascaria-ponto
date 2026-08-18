import { execFile } from "node:child_process";
import { promisify } from "node:util";
const execute = promisify(execFile);
export async function openssl(args: string[], environment: Record<string, string | undefined> = {}) { return execute("openssl", args, { env: { ...process.env, ...environment }, timeout: 30_000, maxBuffer: 1024 * 1024 }); }
