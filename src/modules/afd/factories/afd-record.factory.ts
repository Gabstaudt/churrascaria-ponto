import type { AfdHeaderRecord, AfdSource, AfdTrailerRecord } from "../types";

export function createAfdHeader(source: AfdSource, startDate: string, endDate: string, generatedAt: Date): AfdHeaderRecord {
  return { type: "1", employerIdType: source.employer.idType === "CPF" ? "2" : "1", employerId: source.employer.id, cnoOrCaepf: source.employer.cno ?? source.employer.caepf ?? "", employerName: source.employer.name, inpiRegistration: source.registrar.inpiRegistration ?? "", startDate, endDate, generatedAt, developerIdType: source.developer.idType === "CPF" ? "2" : "1", developerId: source.developer.id };
}
export function createAfdTrailer(type7Count: number): AfdTrailerRecord { return { type: "9", counts: { type2: 0, type3: 0, type4: 0, type5: 0, type6: 0, type7: type7Count } }; }
