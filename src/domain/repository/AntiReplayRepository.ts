/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AntiReplayNonceRecord {
  key: string;            // Formato determinístico: `${sender}:${nonce}`
  sender: string;
  nonce: string;
  txId?: string;
  sequenceNumber?: number;
  createdAt: number;      // Timestamp epoch ms
  expiresAt: number;      // Timestamp epoch ms (createdAt + TTL)
}

/**
 * AntiReplayRepository (Port de Domínio)
 * 
 * Contrato abstrato para persistência e verificação de não-reutilização de nonces,
 * controle de numeração sequencial monotónica e proteção contra ataques de repetição (Replay Attacks).
 */
export interface AntiReplayRepository {
  hasNonce(sender: string, nonce: string): Promise<boolean>;
  recordNonce(record: AntiReplayNonceRecord): Promise<void>;
  getLastSequenceNumber(sender: string): Promise<number>;
  updateSequenceNumber(sender: string, sequenceNumber: number): Promise<void>;
  purgeExpired(nowMs?: number): Promise<number>;
  getAll(): Promise<AntiReplayNonceRecord[]>;
  saveAll(records: AntiReplayNonceRecord[]): Promise<void>;
}
