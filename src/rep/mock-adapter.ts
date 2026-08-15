import type { REPAdapter } from "./contracts";
import { mockRepBatchSchema } from "@/validations/rep";

export class MockREPAdapter implements REPAdapter { readonly id = "MOCK"; parse(payload: unknown) { const parsed = mockRepBatchSchema.parse(payload); return { source: parsed.version, records: parsed.records }; } }
