/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AsyncLocalStorage } from 'async_hooks';

export interface LogContext {
  service?: string;
  component?: string;
  correlationId?: string;
  traceId?: string;
  requestId?: string;
  sessionId?: string;
  latencyMs?: number;
  userId?: string;
  details?: any;
  error?: string;
  stack?: string;
  [key: string]: any;
}

// Global context tracker for Request-scoped variables
export const requestContextStorage = new AsyncLocalStorage<Map<string, string>>();

export class Logger {
  private static serviceName = 'KwanzaMóvel-Backend';

  private static getStoreValue(key: string): string | undefined {
    const store = requestContextStorage.getStore();
    return store?.get(key);
  }

  private static buildLogObject(level: string, message: string, context: LogContext = {}): any {
    const correlationId = context.correlationId || Logger.getStoreValue('correlationId') || 'no-correlation-id';
    const traceId = context.traceId || Logger.getStoreValue('traceId') || 'no-trace-id';
    const requestId = context.requestId || Logger.getStoreValue('requestId') || 'no-request-id';
    const sessionId = context.sessionId || Logger.getStoreValue('sessionId');

    return {
      timestamp: new Date().toISOString(),
      level,
      service: Logger.serviceName,
      message,
      correlationId,
      traceId,
      requestId,
      ...(sessionId ? { sessionId } : {}),
      ...context,
    };
  }

  private static writeLog(level: string, message: string, context: LogContext = {}) {
    const logObj = Logger.buildLogObject(level, message, context);
    
    // In production, write strictly structured JSON for Google Cloud Logging
    // In local development, we can print it in a beautifully formatted structure
    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify(logObj));
    } else {
      const colorMap: Record<string, string> = {
        INFO: '\x1b[32m',     // Green
        WARN: '\x1b[33m',     // Yellow
        ERROR: '\x1b[31m',    // Red
        AUDIT: '\x1b[36m',    // Cyan
        SECURITY: '\x1b[35m', // Magenta
      };
      const color = colorMap[level] || '\x1b[37m';
      const reset = '\x1b[0m';
      const metaStr = `[Corr: ${logObj.correlationId}] [Req: ${logObj.requestId}]`;
      console.log(
        `${logObj.timestamp} ${color}[${level}]${reset} ${metaStr} - ${logObj.message}`,
        Object.keys(context).length > 0 ? JSON.stringify(context, null, 2) : ''
      );
    }
  }

  public static info(message: string, context: LogContext = {}) {
    Logger.writeLog('INFO', message, context);
  }

  public static warn(message: string, context: LogContext = {}) {
    Logger.writeLog('WARN', message, context);
  }

  public static error(message: string, context: LogContext = {}) {
    Logger.writeLog('ERROR', message, context);
  }

  public static audit(message: string, context: LogContext = {}) {
    Logger.writeLog('AUDIT', message, context);
  }

  public static security(message: string, context: LogContext = {}) {
    Logger.writeLog('SECURITY', message, context);
  }
}
