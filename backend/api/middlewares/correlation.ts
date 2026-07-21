/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response, NextFunction } from 'express';
import { requestContextStorage } from '../../shared/logger';

function generateShortId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 11)}`;
}

export function correlationMiddleware(req: Request, res: Response, next: NextFunction) {
  const correlationId = (req.headers['x-correlation-id'] as string) || generateShortId('corr');
  const traceId = (req.headers['x-trace-id'] as string) || generateShortId('trace');
  const requestId = generateShortId('req');
  const sessionId = (req.headers['x-session-id'] as string) || (req.query.sessionId as string) || undefined;

  // Set response headers so the caller also gets these tracking tokens
  res.setHeader('x-correlation-id', correlationId);
  res.setHeader('x-trace-id', traceId);
  res.setHeader('x-request-id', requestId);
  if (sessionId) {
    res.setHeader('x-session-id', sessionId);
  }

  // Bind parameters inside our request storage
  const store = new Map<string, string>();
  store.set('correlationId', correlationId);
  store.set('traceId', traceId);
  store.set('requestId', requestId);
  if (sessionId) {
    store.set('sessionId', sessionId);
  }

  // Set properties directly on req for ease of access
  (req as any).correlationId = correlationId;
  (req as any).traceId = traceId;
  (req as any).requestId = requestId;
  if (sessionId) {
    (req as any).sessionId = sessionId;
  }

  // Run downstream handlers inside the context storage container
  requestContextStorage.run(store, () => {
    next();
  });
}
