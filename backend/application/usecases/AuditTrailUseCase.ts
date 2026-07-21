/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { auditRepository } from '../../repositories/Registry';
import { AuditLog } from '../../repositories/AuditRepository';

export class AuditTrailUseCase {
  public async execute(limit: number = 50): Promise<AuditLog[]> {
    return auditRepository.getAuditLogs(limit);
  }
}
