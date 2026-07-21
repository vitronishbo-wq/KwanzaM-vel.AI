/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReceiptAggregate } from "../evidence/ReceiptEngine";

/**
 * Port: ReceiptRepository
 * 
 * Contrato abstrato para gerir o ciclo de vida e auditoria de Recibos emitidos.
 */
export interface ReceiptRepository {
  getReceipts(): Promise<ReceiptAggregate[]>;
  saveReceipt(receipt: ReceiptAggregate): Promise<void>;
  findById(id: string): Promise<ReceiptAggregate | null>;
}
