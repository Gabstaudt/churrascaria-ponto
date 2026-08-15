export function minimalEmployeeName(fullName: string) { const parts = fullName.trim().split(/\s+/); return parts.length < 2 ? parts[0] ?? "Funcionário" : `${parts[0]} ${parts.at(-1)}`; }
