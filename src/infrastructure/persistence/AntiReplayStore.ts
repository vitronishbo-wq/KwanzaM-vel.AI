/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AntiReplayRepository, AntiReplayNonceRecord } from "../../domain/repository/AntiReplayRepository";

const ANTI_REPLAY_STORAGE_KEY = "kmos_anti_replay_nonces";
const SEQUENCE_NUMBERS_STORAGE_KEY = "kmos_anti_replay_sequences";

/**
 * AntiReplayStore (Infrastructure Adapter)
 * 
 * Implementação em memória com sincronização em LocalStorage para rastreamento de nonces
 * e números de sequência monotónicos, assegurando proteção contra Replay Attacks.
 */
export class AntiReplayStore implements AntiReplayRepository {
  private memoryNonces: Map<string, AntiReplayNonceRecord> = new Map();
  private memorySequences: Map<string, number> = new Map();

  constructor() {
    this.hydrateFromStorage();
  }

  private hydrateFromStorage(): void {
    if (typeof localStorage === "undefined") return;
    try {
      const rawNonces = localStorage.getItem(ANTI_REPLAY_STORAGE_KEY);
      if (rawNonces) {
        const parsed = JSON.parse(rawNonces);
        if (Array.isArray(parsed)) {
          const now = Date.now();
          for (const r of parsed) {
            if (r && r.key && r.expiresAt > now) {
              this.memoryNonces.set(r.key, r);
            }
          }
        }
      }

      const rawSeq = localStorage.getItem(SEQUENCE_NUMBERS_STORAGE_KEY);
      if (rawSeq) {
        const parsedSeq = JSON.parse(rawSeq);
        if (parsedSeq && typeof parsedSeq === "object") {
          for (const [sender, seq] of Object.entries(parsedSeq)) {
            if (typeof seq === "number") {
              this.memorySequences.set(sender, seq);
            }
          }
        }
      }
    } catch {
      // Falha graciosa mantendo estado em memória
    }
  }

  public async hasNonce(sender: string, nonce: string): Promise<boolean> {
    const key = `${sender}:${nonce}`;
    await this.purgeExpired();
    return this.memoryNonces.has(key);
  }

  public async recordNonce(record: AntiReplayNonceRecord): Promise<void> {
    this.memoryNonces.set(record.key, { ...record });
    this.persistNonces();
  }

  public async getLastSequenceNumber(sender: string): Promise<number> {
    return this.memorySequences.get(sender) || 0;
  }

  public async updateSequenceNumber(sender: string, sequenceNumber: number): Promise<void> {
    const current = this.memorySequences.get(sender) || 0;
    if (sequenceNumber > current) {
      this.memorySequences.set(sender, sequenceNumber);
      this.persistSequences();
    }
  }

  public async purgeExpired(nowMs: number = Date.now()): Promise<number> {
    let purgedCount = 0;
    for (const [key, record] of this.memoryNonces.entries()) {
      if (record.expiresAt <= nowMs) {
        this.memoryNonces.delete(key);
        purgedCount++;
      }
    }
    if (purgedCount > 0) {
      this.persistNonces();
    }
    return purgedCount;
  }

  public async getAll(): Promise<AntiReplayNonceRecord[]> {
    await this.purgeExpired();
    return Array.from(this.memoryNonces.values());
  }

  public async saveAll(records: AntiReplayNonceRecord[]): Promise<void> {
    this.memoryNonces.clear();
    for (const r of records) {
      this.memoryNonces.set(r.key, { ...r });
    }
    this.persistNonces();
  }

  private persistNonces(): void {
    if (typeof localStorage === "undefined") return;
    try {
      const array = Array.from(this.memoryNonces.values());
      localStorage.setItem(ANTI_REPLAY_STORAGE_KEY, JSON.stringify(array));
    } catch {
      // Ignora erro de cota ou indisponibilidade
    }
  }

  private persistSequences(): void {
    if (typeof localStorage === "undefined") return;
    try {
      const obj: Record<string, number> = {};
      for (const [sender, seq] of this.memorySequences.entries()) {
        obj[sender] = seq;
      }
      localStorage.setItem(SEQUENCE_NUMBERS_STORAGE_KEY, JSON.stringify(obj));
    } catch {
      // Ignora erro de cota ou indisponibilidade
    }
  }
}
