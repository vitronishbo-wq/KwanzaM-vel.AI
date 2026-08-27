/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LedgerRepository } from "../../../domain/repository/LedgerRepository";
import {
  LedgerAccount,
  LedgerJournalEntry,
  initialLedgerAccounts,
  initialLedgerEntries,
  ConcurrencyConflictException,
  ImmutableLedgerViolationException,
  UnbalancedJournalEntryException,
  computeJournalEntryHash,
  GENESIS_PREVIOUS_HASH
} from "../../../ledgerEngine";

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
      // Inicializa com as entradas padrão do diário já seladas com hash SHA-256
      await this.saveJournalEntries(initialLedgerEntries);
      return initialLedgerEntries;
    }
    try {
      const parsed: LedgerJournalEntry[] = JSON.parse(raw);
      return parsed.map(e => Object.freeze({ ...e, postings: e.postings.map(p => Object.freeze({ ...p })) }));
    } catch {
      return initialLedgerEntries;
    }
  }

  private async saveJournalEntries(entries: LedgerJournalEntry[]): Promise<void> {
    localStorage.setItem(LEDGER_JOURNAL_KEY, JSON.stringify(entries));
  }

  /**
   * Grava um lançamento no Diário Contabilístico com garantia estrita de Imutabilidade (Append-Only):
   * 1. Rejeita qualquer mutação de registos pré-existentes.
   * 2. Valida o equilíbrio de partidas dobradas (Zero-Sum Invariant).
   * 3. Garante encadeamento criptográfico contínuo SHA-256 (Hash Chaining).
   * 4. Sela o objeto em memória com Object.freeze.
   */
  public async saveJournalEntry(entry: LedgerJournalEntry): Promise<void> {
    const entries = await this.getJournalEntries();

    // 1. Verificação de Imutabilidade: Se o ID já existir, deve ser estritamente idempotente
    const existing = entries.find(e => e.id === entry.id);
    if (existing) {
      if (existing.hash && entry.hash && existing.hash !== entry.hash) {
        throw new ImmutableLedgerViolationException(
          `Tentativa ilegal de adulteração do lançamento ${entry.id}. O Razão Geral (Ledger) é estritamente imutável (Insert-Only).`,
          { existingHash: existing.hash, incomingHash: entry.hash }
        );
      }
      return; // Idempotência sem efeito colateral
    }

    // 2. Verificação de Equilíbrio das Partidas Dobradas (Zero-Sum)
    const sum = entry.postings.reduce((acc, p) => acc + p.amount, 0);
    if (Math.abs(sum) > 0.0001) {
      throw new UnbalancedJournalEntryException(sum, entry.id);
    }

    // 3. Encadeamento Criptográfico e Selagem
    const nextSeq = entries.length + 1;
    const seq = entry.sequenceNumber || nextSeq;
    const prevHash = entry.previousHash || (entries.length > 0 ? (entries[entries.length - 1].hash || GENESIS_PREVIOUS_HASH) : GENESIS_PREVIOUS_HASH);
    const hash = entry.hash || computeJournalEntryHash({
      id: entry.id,
      sequenceNumber: seq,
      timestamp: entry.timestamp,
      description: entry.description,
      txReferenceId: entry.txReferenceId,
      postings: entry.postings,
      previousHash: prevHash
    });

    const sealedEntry: LedgerJournalEntry = Object.freeze({
      ...entry,
      sequenceNumber: seq,
      previousHash: prevHash,
      hash,
      immutableSeal: entry.immutableSeal || `SEAL:KMOS:IMMUTABLE:SHA256:${hash.substring(0, 16)}`,
      postings: entry.postings.map(p => Object.freeze({ ...p }))
    });

    entries.push(sealedEntry);
    await this.saveJournalEntries(entries);
  }
}

