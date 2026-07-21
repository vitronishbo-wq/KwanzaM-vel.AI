/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EvidencePackage } from "../evidence/ReceiptEngine";

/**
 * Port: EvidenceRepository
 * 
 * Contrato abstrato para a gestão de pacotes de evidência regulatória (EVP).
 */
export interface EvidenceRepository {
  getPackages(): Promise<EvidencePackage[]>;
  savePackage(pkg: EvidencePackage): Promise<void>;
  findById(id: string): Promise<EvidencePackage | null>;
}
