/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LedgerAccount, LedgerJournalEntry } from "../../ledgerEngine";

/**
 * Port: LedgerRepository
 * 
 * Contrato abstrato para a persistência e reconciliação das contas do razão (Ledger).
 */
export interface LedgerRepository {
  getAccounts(): Promise<LedgerAccount[]>;
  saveAccounts(accounts: LedgerAccount[]): Promise<void>;
  getJournalEntries(): Promise<LedgerJournalEntry[]>;
  saveJournalEntry(entry: LedgerJournalEntry): Promise<void>;
}

export type ILedgerRepository = LedgerRepository;
