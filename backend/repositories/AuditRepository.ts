/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  component: string;
  details: any;
  userId?: string;
  correlationId?: string;
  ipAddress?: string;
  statusCode?: number;
}

export interface AuditRepository {
  saveAuditLog(log: AuditLog): Promise<void>;
  getAuditLogs(limit?: number): Promise<AuditLog[]>;
}
