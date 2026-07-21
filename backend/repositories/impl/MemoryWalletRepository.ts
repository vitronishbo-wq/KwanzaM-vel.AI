/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WalletRepository } from '../WalletRepository';
import { Transaction, JournalEntry, TAccount } from '../../../src/types';

export class MemoryWalletRepository implements WalletRepository {
  private static balances = new Map<string, number>([
    ['+244923000111', 25000],
    ['+244931999222', 450000],
  ]);

  private static transactions: Transaction[] = [];
  private static journalEntries: JournalEntry[] = [];

  public async getBalance(phone: string): Promise<number> {
    return MemoryWalletRepository.balances.get(phone) ?? 0;
  }

  public async updateBalance(phone: string, amount: number): Promise<void> {
    MemoryWalletRepository.balances.set(phone, amount);
  }

  public async saveTransaction(tx: Transaction): Promise<void> {
    MemoryWalletRepository.transactions.unshift({ ...tx });
  }

  public async getTransactionById(id: string): Promise<Transaction | null> {
    const tx = MemoryWalletRepository.transactions.find((t) => t.id === id);
    return tx ? { ...tx } : null;
  }

  public async getTransactions(phone?: string, limit: number = 50): Promise<Transaction[]> {
    let list = MemoryWalletRepository.transactions;
    if (phone) {
      list = list.filter((t) => t.senderPhone === phone || t.receiverPhone === phone);
    }
    return list.slice(0, limit).map((t) => ({ ...t }));
  }

  public async saveJournalEntry(entry: JournalEntry): Promise<void> {
    MemoryWalletRepository.journalEntries.push({ ...entry });
  }

  public async getJournalEntries(): Promise<JournalEntry[]> {
    return [...MemoryWalletRepository.journalEntries];
  }

  public async getTAccounts(): Promise<TAccount[]> {
    // Generate simple dynamic T-Accounts based on journal entries
    const accountMap = new Map<string, { debits: any[]; credits: any[] }>();

    for (const entry of MemoryWalletRepository.journalEntries) {
      if (!accountMap.has(entry.debitAccount)) {
        accountMap.set(entry.debitAccount, { debits: [], credits: [] });
      }
      if (!accountMap.has(entry.creditAccount)) {
        accountMap.set(entry.creditAccount, { debits: [], credits: [] });
      }

      accountMap.get(entry.debitAccount)!.debits.push({
        id: entry.id,
        txId: entry.txId,
        timestamp: entry.timestamp,
        description: entry.description,
        amount: entry.amount,
        type: 'debit' as const,
      });

      accountMap.get(entry.creditAccount)!.credits.push({
        id: entry.id,
        txId: entry.txId,
        timestamp: entry.timestamp,
        description: entry.description,
        amount: entry.amount,
        type: 'credit' as const,
      });
    }

    const tAccounts: TAccount[] = [];

    for (const [name, data] of accountMap.entries()) {
      const totalDebit = data.debits.reduce((sum, item) => sum + item.amount, 0);
      const totalCredit = data.credits.reduce((sum, item) => sum + item.amount, 0);

      // Simple ledger balance calculation: Assets/Expenses are debit positive, Liabilities/Equity/Revenue are credit positive.
      // For this model, we'll use simple subtraction.
      const isAssetOrExpense = name.toLowerCase().includes('ativo') || name.toLowerCase().includes('caixa') || name.toLowerCase().includes('reserva');
      const balance = isAssetOrExpense ? (totalDebit - totalCredit) : (totalCredit - totalDebit);

      tAccounts.push({
        accountName: name,
        accountType: isAssetOrExpense ? 'Asset' : 'Liability',
        lines: [...data.debits, ...data.credits].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
        totalDebit,
        totalCredit,
        balance,
      });
    }

    return tAccounts;
  }
}
