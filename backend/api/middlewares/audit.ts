/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response, NextFunction } from 'express';
import { Logger } from '../../shared/logger';

export function auditMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const path = req.path;
  const method = req.method;

  // Wait for the request to complete to capture the final status code and latency
  res.on('finish', () => {
    const latencyMs = Date.now() - start;
    const statusCode = res.statusCode;

    // We only audit mutation requests (POST, PUT, DELETE) or sensitive GET endpoints
    const isSensitive = 
      method !== 'GET' || 
      path.includes('reserves') || 
      path.includes('auth') || 
      path.includes('private');

    if (isSensitive) {
      const auditPayload = {
        component: 'AuditLogger',
        method,
        path,
        statusCode,
        latencyMs,
        clientIp: req.ip || req.socket.remoteAddress || 'unknown-ip',
        userAgent: req.headers['user-agent'],
        correlationId: (req as any).correlationId,
        requestId: (req as any).requestId,
      };

      if (statusCode >= 400) {
        Logger.security(`Operação falhou ou foi rejeitada com status ${statusCode}`, auditPayload);
      } else {
        Logger.audit(`Operação executada com sucesso e auditada`, auditPayload);
      }
    }
  });

  next();
}
