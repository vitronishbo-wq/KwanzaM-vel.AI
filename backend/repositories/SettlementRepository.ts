/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReconciliationLog, BnaCustodyState } from '../../src/types';

export interface SettlementRepository {
  saveReconciliationLog(log: ReconciliationLog): Promise<void>;
  getReconciliationLogs(): Promise<ReconciliationLog[]>;
  getCustodyState(): Promise<BnaCustodyState>;
  saveCustodyState(state: BnaCustodyState): Promise<void>;
}
