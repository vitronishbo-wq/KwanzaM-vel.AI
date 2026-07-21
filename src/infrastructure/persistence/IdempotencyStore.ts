/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { IdempotencyRepository, IdempotencyRecord } from "../../domain/repository/IdempotencyRepository";

const IDEMPOTENCY_STORAGE_KEY = "kmos_idempotency_records";

/**
 * IdempotencyStore
 * 
 * Implementação do repositório de idempotência com suporte a persistência local (localStorage).
 * Associa de forma estrita chaves de idempotência a hashes de transações (txHash) e respostas em cache 
 * para assegurar que nenhuma operação financeira duplicada seja processada ou comprometida no ledger do KMOS.
 */
export class IdempotencyStore implements IdempotencyRepository {
  public async find(key: string): Promise<IdempotencyRecord | null> {
    const all = await this.getAll();
    return all.find(r => r.key === key) || null;
  }

  public async exists(key: string): Promise<boolean> {
    const record = await this.find(key);
    return record !== null;
  }

  public async getAll(): Promise<IdempotencyRecord[]> {
    const raw = localStorage.getItem(IDEMPOTENCY_STORAGE_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public async save(record: IdempotencyRecord): Promise<void> {
    const all = await this.getAll();
    const idx = all.findIndex(r => r.key === record.key);
    if (idx !== -1) {
      all[idx] = record;
    } else {
      all.push(record);
    }
    localStorage.setItem(IDEMPOTENCY_STORAGE_KEY, JSON.stringify(all));
  }

  public async saveAll(records: IdempotencyRecord[]): Promise<void> {
    localStorage.setItem(IDEMPOTENCY_STORAGE_KEY, JSON.stringify(records));
  }
}
