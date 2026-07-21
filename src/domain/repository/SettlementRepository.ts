/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReconciliationEntry, BnaCustodyState, ReconciliationLog } from "../../types";

/**
 * Port: SettlementRepository
 * 
 * Contrato abstrato para a gestão de liquidação fiduciária e logs de conciliação.
 */
export interface SettlementRepository {
  getReconciliationEntries(): Promise<ReconciliationEntry[]>;
  saveReconciliationEntry(entry: ReconciliationEntry): Promise<void>;
  getBnaCustodyState(): Promise<BnaCustodyState>;
  saveBnaCustodyState(state: BnaCustodyState): Promise<void>;
  getReconciliationLogs(): Promise<ReconciliationLog[]>;
  saveReconciliationLog(log: ReconciliationLog): Promise<void>;
}
