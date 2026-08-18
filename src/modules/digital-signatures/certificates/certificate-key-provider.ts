import type { CertificatePublicInfo } from "../types";
export type CertificateMaterial = { certificatePath: string; privateKeyPath: string; info: CertificatePublicInfo };
export interface CertificateKeyProvider { withMaterial<T>(callback: (material: CertificateMaterial) => Promise<T>): Promise<T>; publicInfo(): Promise<CertificatePublicInfo>; }
