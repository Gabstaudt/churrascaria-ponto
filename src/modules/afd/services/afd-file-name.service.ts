import { digits } from "../layout/afd-layout-004";
export function afdFileName(inpiRegistration: string, employerId: string) { return `AFD${digits(inpiRegistration)}${digits(employerId)}REP_P.txt`; }
