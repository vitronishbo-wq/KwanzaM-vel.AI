/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface IdempotencyRecord {
  key: string;
  requestHash?: string;
  txId?: string;
  txHash?: string;
  responsePayload?: any;
  status: "PENDING" | "COMPLETED" | "FAILED";
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

/**
 * Port: IdempotencyRepository
 * 
 * Contrato abstrato para evitar duplicação de requisições financeiras (Idempotência).
 * Permite que operações críticas guardem as suas respostas para que retentativas
 * regressem o mesmo resultado sem re-executar as mutações fiduciárias.
 */
export interface IdempotencyRepository {
  find(key: string): Promise<IdempotencyRecord | null>;
  exists(key: string): Promise<boolean>;
  getAll(): Promise<IdempotencyRecord[]>;
  save(record: IdempotencyRecord): Promise<void>;
  saveAll(records: IdempotencyRecord[]): Promise<void>;
  delete?(key: string): Promise<void>;
}
