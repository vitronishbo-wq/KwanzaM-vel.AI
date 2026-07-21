/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export class ReceiptRetentionPolicy {
  /**
   * Angolan Law 40/20 requires financial documents and evidence packages
   * to be retained for at least 5 years.
   */
  public static readonly DEFAULT_HOLD_PERIOD_YEARS = 5;

  /**
   * Calculates the purge date based on the transaction date and the required 5-year hold.
   */
  public static calculatePurgeDate(fromDate: Date = new Date()): Date {
    const purgeDate = new Date(fromDate);
    purgeDate.setFullYear(purgeDate.getFullYear() + this.DEFAULT_HOLD_PERIOD_YEARS);
    return purgeDate;
  }

  /**
   * Verifies if an Evidence Package has expired or is still active.
   */
  public static isExpired(purgeDateStr: string): boolean {
    const purgeDate = new Date(purgeDateStr);
    return new Date() > purgeDate;
  }

  /**
   * Evaluates legal holding policy metadata for the Evidence Package.
   */
  public static getLegalHoldingDetails() {
    return {
      lawReference: "Lei n.º 40/20 — Artigo 22 (Salvaguarda de Evidências Financeiras)",
      retentionPeriod: `${this.DEFAULT_HOLD_PERIOD_YEARS} anos`,
      scope: "Integridade de dados monetários, trilhos de auditoria de carteiras simplificadas e conciliações de liquidez.",
      mandatoryBackup: "Arquivo Frio (Cold Storage) replicado geograficamente"
    };
  }
}
