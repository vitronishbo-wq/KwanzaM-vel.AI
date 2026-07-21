/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EvidencePackage } from "./EvidencePackage";

export class EvidenceRepository {
  private static packages: Map<string, EvidencePackage> = new Map();

  public static save(pkg: EvidencePackage): void {
    this.packages.set(pkg.id, pkg);
  }

  public static findById(id: string): EvidencePackage | null {
    return this.packages.get(id) || null;
  }

  public static findByTransactionId(transactionId: string): EvidencePackage | null {
    for (const pkg of this.packages.values()) {
      if (pkg.transactionId === transactionId) {
        return pkg;
      }
    }
    return null;
  }

  public static getAll(): EvidencePackage[] {
    return Array.from(this.packages.values());
  }

  /**
   * Enforces the retention policy by identifying and purging expired evidence packages.
   * Under Angolan Law 40/20, these must be held for 5 years.
   */
  public static purgeExpiredPackages(): string[] {
    const purgedIds: string[] = [];
    const now = new Date();

    for (const [id, pkg] of this.packages.entries()) {
      const purgeDate = new Date(pkg.retentionPolicy.purgeDate);
      if (now > purgeDate) {
        this.packages.delete(id);
        purgedIds.push(id);
      }
    }
    return purgedIds;
  }

  public static clear(): void {
    this.packages.clear();
  }
}
