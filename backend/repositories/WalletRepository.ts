/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Transaction, JournalEntry, TAccount } from '../../src/types';

export interface WalletRepository {
  getBalance(phone: string): Promise<number>;
  updateBalance(phone: string, amount: number): Promise<void>;
  saveTransaction(tx: Transaction): Promise<void>;
  getTransactionById(id: string): Promise<Transaction | null>;
  getTransactions(phone?: string, limit?: number): Promise<Transaction[]>;
  saveJournalEntry(entry: JournalEntry): Promise<void>;
  getJournalEntries(): Promise<JournalEntry[]>;
  getTAccounts(): Promise<TAccount[]>;
}
