import { describe, expect, it } from "vitest";
import { minimalEmployeeName } from "./privacy";
describe("privacidade no terminal", () => { it("omite nomes intermediários", () => expect(minimalEmployeeName("João Pedro de Souza Silva")).toBe("João Silva")); });
