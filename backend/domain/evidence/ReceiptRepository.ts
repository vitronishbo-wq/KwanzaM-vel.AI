/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReceiptAggregate } from "./ReceiptEngine";

export class ReceiptRepository {
  private static receipts: Map<string, ReceiptAggregate> = new Map();

  public static save(receipt: ReceiptAggregate): void {
    this.receipts.set(receipt.id, receipt);
  }

  public static findById(id: string): ReceiptAggregate | null {
    return this.receipts.get(id) || null;
  }

  public static findByTxId(txId: string): ReceiptAggregate | null {
    for (const receipt of this.receipts.values()) {
      if (receipt.txId === txId) {
        return receipt;
      }
    }
    return null;
  }

  public static getAll(): ReceiptAggregate[] {
    return Array.from(this.receipts.values());
  }

  public static clear(): void {
    this.receipts.clear();
  }
}
