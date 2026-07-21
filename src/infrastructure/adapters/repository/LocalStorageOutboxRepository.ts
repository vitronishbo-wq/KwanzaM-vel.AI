/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OutboxRepository, OutboxMessage } from "../../../domain/repository/OutboxRepository";

const OUTBOX_MESSAGES_KEY = "kmos_outbox_messages";

export class LocalStorageOutboxRepository implements OutboxRepository {
  public async getPending(): Promise<OutboxMessage[]> {
    const all = await this.getAll();
    return all.filter(m => m.status === "PENDING");
  }

  public async getAll(): Promise<OutboxMessage[]> {
    const raw = localStorage.getItem(OUTBOX_MESSAGES_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public async add(message: OutboxMessage): Promise<void> {
    const all = await this.getAll();
    all.push(message);
    localStorage.setItem(OUTBOX_MESSAGES_KEY, JSON.stringify(all));
  }

  public async save(message: OutboxMessage): Promise<void> {
    const all = await this.getAll();
    const idx = all.findIndex(m => m.id === message.id);
    if (idx !== -1) {
      all[idx] = message;
    } else {
      all.push(message);
    }
    localStorage.setItem(OUTBOX_MESSAGES_KEY, JSON.stringify(all));
  }

  public async saveAll(messages: OutboxMessage[]): Promise<void> {
    localStorage.setItem(OUTBOX_MESSAGES_KEY, JSON.stringify(messages));
  }

  public async clearAll(): Promise<void> {
    localStorage.removeItem(OUTBOX_MESSAGES_KEY);
  }
}
