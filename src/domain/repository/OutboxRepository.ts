/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DomainEvent } from "../../types";

export interface OutboxMessage {
  id: string;
  event: DomainEvent;
  status: "PENDING" | "PROCESSED" | "FAILED";
  createdAt: string;
  processedAt?: string;
  attempts: number;
  lastError?: string;
}

/**
 * Port: OutboxRepository
 * 
 * Contrato abstrato para a persistência transacional de mensagens do Outbox.
 * Garante que os eventos de domínio gerados por operações de negócio possam ser
 * mantidos de forma resiliente na mesma unidade de persistência atómica.
 */
export interface OutboxRepository {
  getPending(): Promise<OutboxMessage[]>;
  getAll(): Promise<OutboxMessage[]>;
  add(message: OutboxMessage): Promise<void>;
  save(message: OutboxMessage): Promise<void>;
  saveAll(messages: OutboxMessage[]): Promise<void>;
  clearAll(): Promise<void>;
}
