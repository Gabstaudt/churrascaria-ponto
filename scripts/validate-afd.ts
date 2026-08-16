import { readFile } from "node:fs/promises";
import { validateSerializedAfd } from "../src/modules/afd/validators/afd.validator";

const path = process.argv[2];
if (!path) throw new Error("Uso: npm run afd:validate -- /caminho/AFD.txt");
const bytes = new Uint8Array(await readFile(path));
const issues = validateSerializedAfd(bytes);
console.info(JSON.stringify({ valid: !issues.some((item) => item.severity === "ERROR"), issues }, null, 2));
if (issues.some((item) => item.severity === "ERROR")) process.exitCode = 1;
