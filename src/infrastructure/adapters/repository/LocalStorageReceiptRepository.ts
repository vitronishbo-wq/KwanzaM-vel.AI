/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReceiptRepository } from "../../../domain/repository/ReceiptRepository";
import { ReceiptAggregate } from "../../../domain/evidence/ReceiptEngine";

const RECEIPTS_KEY = "kmos_receipts";

export class LocalStorageReceiptRepository implements ReceiptRepository {
  public async getReceipts(): Promise<ReceiptAggregate[]> {
    const raw = localStorage.getItem(RECEIPTS_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public async saveReceipt(receipt: ReceiptAggregate): Promise<void> {
    const receipts = await this.getReceipts();
    const idx = receipts.findIndex(r => r.id === receipt.id);
    if (idx >= 0) {
      receipts[idx] = receipt;
    } else {
      receipts.push(receipt);
    }
    localStorage.setItem(RECEIPTS_KEY, JSON.stringify(receipts));
  }

  public async findById(id: string): Promise<ReceiptAggregate | null> {
    const receipts = await this.getReceipts();
    return receipts.find(r => r.id === id) || null;
  }
}
