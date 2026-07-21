/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuditRepository, AuditLog } from '../AuditRepository';

export class MemoryAuditRepository implements AuditRepository {
  private static logs: AuditLog[] = [
    {
      id: 'AUD-001',
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      action: 'SERVER_BOOT',
      component: 'ExpressServer',
      details: { profile: 'production', message: 'Servidor KwanzaMóvel Enterprise inicializado.' },
      userId: 'system',
      correlationId: 'corr-system-init',
    },
  ];

  public async saveAuditLog(log: AuditLog): Promise<void> {
    MemoryAuditRepository.logs.unshift({ ...log });
  }

  public async getAuditLogs(limit: number = 50): Promise<AuditLog[]> {
    return MemoryAuditRepository.logs.slice(0, limit).map((l) => ({ ...l }));
  }
}
