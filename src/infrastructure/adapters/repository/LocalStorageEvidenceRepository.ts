/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EvidenceRepository } from "../../../domain/repository/EvidenceRepository";
import { EvidencePackage } from "../../../domain/evidence/ReceiptEngine";

const EVIDENCE_PACKAGES_KEY = "kmos_evidence_packages";

export class LocalStorageEvidenceRepository implements EvidenceRepository {
  public async getPackages(): Promise<EvidencePackage[]> {
    const raw = localStorage.getItem(EVIDENCE_PACKAGES_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public async savePackage(pkg: EvidencePackage): Promise<void> {
    const packages = await this.getPackages();
    const idx = packages.findIndex(p => p.id === pkg.id);
    if (idx >= 0) {
      packages[idx] = pkg;
    } else {
      packages.push(pkg);
    }
    localStorage.setItem(EVIDENCE_PACKAGES_KEY, JSON.stringify(packages));
  }

  public async findById(id: string): Promise<EvidencePackage | null> {
    const packages = await this.getPackages();
    return packages.find(p => p.id === id) || null;
  }
}
