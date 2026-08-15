import { describe, expect, it } from "vitest";
import { terminalConnection } from "./network-status";
describe("terminalConnection", () => { it("só declara online com rede e servidor acessível", () => { expect(terminalConnection(true, true)).toBe("ONLINE"); expect(terminalConnection(false, true)).toBe("OFFLINE"); expect(terminalConnection(true, false)).toBe("OFFLINE"); }); });
