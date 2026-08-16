export const AFD_LAYOUT_VERSION = "AFD_LAYOUT_004" as const;
export const AFD_LAYOUT_CODE = "004" as const;
export const AFD_ENCODING = "iso-8859-1" as const;
export const AFD_LINE_ENDING = "\r\n" as const;

export type AfdValidationIssue = { severity: "WARNING" | "ERROR"; code: string; message: string; nsr?: string };
export type AfdHeaderRecord = { type: "1"; employerIdType: "1" | "2"; employerId: string; cnoOrCaepf: string; employerName: string; inpiRegistration: string; startDate: string; endDate: string; generatedAt: Date; developerIdType: "1" | "2"; developerId: string };
export type AfdClockRecord = { type: "7"; sourceId: string; nsr: number; markedAt: Date; employeeCpf: string; recordedAt: Date; collectorType: "01" | "02" | "03" | "04" | "05"; offline: boolean };
export type AfdTrailerRecord = { type: "9"; counts: { type2: number; type3: number; type4: number; type5: number; type6: number; type7: number } };
export type AfdSignatureRecord = { type: "SIGNATURE"; value: "ASSINATURA_DIGITAL_EM_ARQUIVO_P7S" };
export type AfdRecord = AfdHeaderRecord | AfdClockRecord | AfdTrailerRecord | AfdSignatureRecord;
export type AfdSource = { registrar: { id: string; name: string; identifier: string; inpiRegistration?: string | null; status: string; mode: string }; establishment: { id: string; name: string; cnpj: string; timezone: string }; employer: { name: string; idType: string; id: string; cno?: string | null; caepf?: string | null }; developer: { idType: string; id: string }; entries: AfdClockRecord[] };
export type AfdArtifact = { records: AfdRecord[]; text: string; bytes: Uint8Array; issues: AfdValidationIssue[]; recordCount: number; firstNsr?: string; lastNsr?: string; recordCountByType: Record<string, number> };
