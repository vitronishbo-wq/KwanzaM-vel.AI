/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SettlementRepository } from "../../../domain/repository/SettlementRepository";
import { ReconciliationEntry, BnaCustodyState, ReconciliationLog } from "../../../types";
import { getReconciliationEntries, addReconciliationEntry, getReconciliationLogs, saveReconciliationLog } from "../../../indexedDB";
import { defaultBnaCustodyState } from "../../../bnaCustody";

const CUSTODY_STATE_KEY = "kmos_bna_custody_state";

export class LocalStorageSettlementRepository implements SettlementRepository {
  public async getReconciliationEntries(): Promise<ReconciliationEntry[]> {
    return getReconciliationEntries();
  }

  public async saveReconciliationEntry(entry: ReconciliationEntry): Promise<void> {
    await addReconciliationEntry(entry);
  }

  public async getBnaCustodyState(): Promise<BnaCustodyState> {
    const raw = localStorage.getItem(CUSTODY_STATE_KEY);
    if (!raw) {
      await this.saveBnaCustodyState(defaultBnaCustodyState);
      return defaultBnaCustodyState;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return defaultBnaCustodyState;
    }
  }

  public async saveBnaCustodyState(state: BnaCustodyState): Promise<void> {
    localStorage.setItem(CUSTODY_STATE_KEY, JSON.stringify(state));
  }

  public async getReconciliationLogs(): Promise<ReconciliationLog[]> {
    return getReconciliationLogs();
  }

  public async saveReconciliationLog(log: ReconciliationLog): Promise<void> {
    await saveReconciliationLog(log);
  }
}
