/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response, NextFunction } from 'express';
import { Logger } from '../../shared/logger';
import { configManager } from '../../config/environment';

// Simple in-memory rate limiter to protect against brute-force or DDoS
interface RateLimitBucket {
  tokens: number;
  lastRefill: number;
}
const rateLimitCache = new Map<string, RateLimitBucket>();
const RATE_LIMIT_MAX = 200; // max 200 requests per window
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute window
const REFILL_RATE = RATE_LIMIT_MAX / RATE_LIMIT_WINDOW_MS; // tokens per ms

export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction) {
  // Helmet-equivalent security headers - adjusted to support iframe embedding in AI Studio preview
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  next();
}

export function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  const allowedOrigin = configManager.getConfig().corsOrigin;
  const origin = req.headers.origin as string;

  if (allowedOrigin === '*') {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else if (origin === allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Correlation-ID, X-Trace-ID, X-Request-ID, X-Session-ID'
  );

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  next();
}

export function rateLimiterMiddleware(req: Request, res: Response, next: NextFunction) {
  // Bypass rate limiting in local development if desired, but keep it on for security demo
  const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
  const now = Date.now();

  let bucket = rateLimitCache.get(ip);
  if (!bucket) {
    bucket = { tokens: RATE_LIMIT_MAX, lastRefill: now };
    rateLimitCache.set(ip, bucket);
  } else {
    // Refill tokens based on time passed
    const delta = now - bucket.lastRefill;
    bucket.tokens = Math.min(RATE_LIMIT_MAX, bucket.tokens + delta * REFILL_RATE);
    bucket.lastRefill = now;
  }

  // Set standard rate limit headers
  res.setHeader('X-RateLimit-Limit', RATE_LIMIT_MAX);
  res.setHeader('X-RateLimit-Remaining', Math.floor(bucket.tokens));

  if (bucket.tokens < 1) {
    Logger.security('Rate limit exceeded by IP client', {
      component: 'RateLimiter',
      clientIp: ip,
      path: req.path,
    });
    res.setHeader('Retry-After', Math.ceil((1 - bucket.tokens) / REFILL_RATE / 1000));
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Limite de pedidos excedido. Por favor tente novamente mais tarde.',
    });
    return;
  }

  // Consume 1 token
  bucket.tokens -= 1;
  next();
}

// Simple input sanitizer middleware against injection attacks
export function inputSanitizationMiddleware(req: Request, res: Response, next: NextFunction) {
  const checkSuspiciousPatterns = (obj: any, pathName: string): boolean => {
    if (!obj || typeof obj !== 'object') return false;

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        if (typeof value === 'string') {
          // Look for dangerous tags, SQL commands or script tags
          const hasXss = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(value);
          const hasSql = /\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|UNION)\b/gi.test(value);
          const hasHtml = /<[^>]*>/g.test(value);

          if (hasXss || hasSql) {
            Logger.security('Intercetado padrão de payload suspeito na requisição', {
              component: 'InputSanitizer',
              paramKey: key,
              payloadPart: pathName,
              detectedPattern: hasXss ? 'XSS' : 'SQL_INJECTION',
            });
            return true;
          }
        } else if (typeof value === 'object') {
          if (checkSuspiciousPatterns(value, `${pathName}.${key}`)) {
            return true;
          }
        }
      }
    }
    return false;
  };

  if (
    checkSuspiciousPatterns(req.body, 'body') ||
    checkSuspiciousPatterns(req.query, 'query') ||
    checkSuspiciousPatterns(req.params, 'params')
  ) {
    res.status(400).json({
      error: 'Requisição Inválida',
      message: 'O conteúdo enviado contém caracteres ou termos não permitidos por motivos de segurança.',
    });
    return;
  }

  next();
}

// Request Payload validation decorator/helper
export function validateRequestBody(schema: Record<string, 'string' | 'number' | 'boolean' | 'array' | 'object'>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const missingFields: string[] = [];
    const invalidTypes: string[] = [];

    for (const [key, expectedType] of Object.entries(schema)) {
      const value = req.body[key];
      if (value === undefined || value === null) {
        missingFields.push(key);
      } else {
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (actualType !== expectedType) {
          invalidTypes.push(`${key} (esperado: ${expectedType}, recebido: ${actualType})`);
        }
      }
    }

    if (missingFields.length > 0 || invalidTypes.length > 0) {
      res.status(400).json({
        error: 'Erro de Validação',
        message: 'A estrutura do corpo do pedido não é válida.',
        missingFields: missingFields.length > 0 ? missingFields : undefined,
        invalidTypes: invalidTypes.length > 0 ? invalidTypes : undefined,
      });
      return;
    }

    next();
  };
}
