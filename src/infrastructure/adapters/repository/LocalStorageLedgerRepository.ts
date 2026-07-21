/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LedgerRepository } from "../../../domain/repository/LedgerRepository";
import { LedgerAccount, LedgerJournalEntry, initialLedgerAccounts, initialLedgerEntries, ConcurrencyConflictException } from "../../../ledgerEngine";

const LEDGER_ACCOUNTS_KEY = "kmos_ledger_accounts";
const LEDGER_JOURNAL_KEY = "kmos_ledger_journal_entries";

export class LocalStorageLedgerRepository implements LedgerRepository {
  public async getAccounts(): Promise<LedgerAccount[]> {
    const raw = localStorage.getItem(LEDGER_ACCOUNTS_KEY);
    if (!raw) {
      // Inicializa com as contas padrão
      const accountsWithVersion = initialLedgerAccounts.map(a => ({ ...a, version: a.version || 1 }));
      localStorage.setItem(LEDGER_ACCOUNTS_KEY, JSON.stringify(accountsWithVersion));
      return accountsWithVersion;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return initialLedgerAccounts;
    }
  }

  public async saveAccounts(accounts: LedgerAccount[]): Promise<void> {
    const raw = localStorage.getItem(LEDGER_ACCOUNTS_KEY);
    const currentStored: LedgerAccount[] = raw ? JSON.parse(raw) : [];

    for (const updated of accounts) {
      const stored = currentStored.find(a => a.id === updated.id);
      if (stored) {
        // Se houve alteração de saldo, validamos a concorrência fiduciária
        if (stored.balance !== updated.balance) {
          if (stored.version > updated.version) {
            throw new ConcurrencyConflictException(updated.id, updated.version, stored.version);
          }
          // Incrementa a versão para o commit bem-sucedido
          updated.version = stored.version + 1;
        }
      } else {
        updated.version = updated.version || 1;
      }
    }

    localStorage.setItem(LEDGER_ACCOUNTS_KEY, JSON.stringify(accounts));
  }

  public async getJournalEntries(): Promise<LedgerJournalEntry[]> {
    const raw = localStorage.getItem(LEDGER_JOURNAL_KEY);
    if (!raw) {
      // Inicializa com as entradas padrão do diário
      await this.saveJournalEntries(initialLedgerEntries);
      return initialLedgerEntries;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return initialLedgerEntries;
    }
  }

  private async saveJournalEntries(entries: LedgerJournalEntry[]): Promise<void> {
    localStorage.setItem(LEDGER_JOURNAL_KEY, JSON.stringify(entries));
  }

  public async saveJournalEntry(entry: LedgerJournalEntry): Promise<void> {
    const entries = await this.getJournalEntries();
    // Evita duplicados
    if (!entries.some(e => e.id === entry.id)) {
      entries.push(entry);
      await this.saveJournalEntries(entries);
    }
  }
}
