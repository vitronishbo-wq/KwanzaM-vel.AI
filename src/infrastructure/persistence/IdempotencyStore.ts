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
  private memoryCache: Map<string, IdempotencyRecord> = new Map();

  public async find(key: string): Promise<IdempotencyRecord | null> {
    const all = await this.getAll();
    const found = all.find(r => r.key === key);
    return found ? { ...found } : null;
  }

  public async exists(key: string): Promise<boolean> {
    const record = await this.find(key);
    return record !== null;
  }

  public async getAll(): Promise<IdempotencyRecord[]> {
    if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(IDEMPOTENCY_STORAGE_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        } catch {
          // fallback to memory
        }
      }
    }
    return Array.from(this.memoryCache.values());
  }

  public async save(record: IdempotencyRecord): Promise<void> {
    const recordToSave: IdempotencyRecord = {
      ...record,
      updatedAt: record.updatedAt || new Date().toISOString()
    };

    this.memoryCache.set(record.key, recordToSave);

    if (typeof localStorage !== "undefined") {
      try {
        const all = await this.getAll();
        const idx = all.findIndex(r => r.key === record.key);
        if (idx !== -1) {
          all[idx] = recordToSave;
        } else {
          all.push(recordToSave);
        }
        localStorage.setItem(IDEMPOTENCY_STORAGE_KEY, JSON.stringify(all));
      } catch (err) {
        console.warn("[IdempotencyStore] Falha ao persistir em localStorage:", err);
      }
    }
  }

  public async saveAll(records: IdempotencyRecord[]): Promise<void> {
    this.memoryCache.clear();
    for (const r of records) {
      this.memoryCache.set(r.key, { ...r });
    }

    if (typeof localStorage !== "undefined") {
      try {
        localStorage.setItem(IDEMPOTENCY_STORAGE_KEY, JSON.stringify(records));
      } catch (err) {
        console.warn("[IdempotencyStore] Falha ao salvar lote em localStorage:", err);
      }
    }
  }

  public async delete(key: string): Promise<void> {
    this.memoryCache.delete(key);
    if (typeof localStorage !== "undefined") {
      try {
        const all = await this.getAll();
        const filtered = all.filter(r => r.key !== key);
        localStorage.setItem(IDEMPOTENCY_STORAGE_KEY, JSON.stringify(filtered));
      } catch (err) {
        console.warn("[IdempotencyStore] Falha ao deletar chave de idempotência:", err);
      }
    }
  }
}
