/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import apiRoutes from './api/routes/index';
import { correlationMiddleware } from './api/middlewares/correlation';
import { securityHeadersMiddleware, corsMiddleware } from './api/middlewares/security';
import { Logger } from './shared/logger';
import { configManager } from './config/environment';
import { PostgresConfig } from './infrastructure/database/postgresConfig';

// Load environment variables for local development
dotenv.config();

const app = express();

// Parse incoming request payloads
app.use(express.json());

// Set up Request Correlation, Trace, and session-state propagation
app.use(correlationMiddleware);

// Apply strict enterprise-level security HTTP headers and CORS configuration
app.use(securityHeadersMiddleware);
app.use(corsMiddleware);

// Log requests passing through the entrypoint
app.use((req: Request, res: Response, next: NextFunction) => {
  Logger.info(`Recebido pedido: ${req.method} ${req.path}`, {
    component: 'ExpressServer',
    ip: req.ip || req.socket.remoteAddress,
  });
  next();
});

// Map modular API controllers under /api endpoint prefix
app.use('/api', apiRoutes);

// Direct mapping fallback for root level /health/readiness telemetry
app.get('/health/readiness', (req, res) => {
  res.redirect('/api/health/readiness');
});

// Generic Global Error Interceptor to prevent leaking technical stack details
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  Logger.error('Erro global não tratado intercetado pelo middleware', {
    component: 'GlobalErrorInterceptor',
    error: err.message,
    stack: err.stack,
  });

  res.status(500).json({
    error: 'Erro de Servidor Interno',
    message: 'Ocorreu um erro inesperado no processamento do seu pedido.',
    correlationId: (req as any).correlationId,
  });
});

// Implement Vite middleware for local development, and serve static assets in production
async function setupViteOrStatic() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Bind to port 3000 as strictly required by AI Studio runtime constraints
  const PORT = configManager.getConfig().port || 3000;
  
  const server = app.listen(PORT, '0.0.0.0', async () => {
    Logger.info(`[KwanzaMóvel Backend] Servidor iniciado com sucesso. Perfil: ${configManager.getConfig().profile}. Correndo em http://0.0.0.0:${PORT}`, {
      component: 'ExpressServer',
      profile: configManager.getConfig().profile,
      port: PORT,
    });

    // Run basic Postgres connection probe on bootup
    try {
      await PostgresConfig.getInstance().testConnection(2, 500);
    } catch (e: any) {
      Logger.warn('[KwanzaMóvel Backend] Aviso de ligação ao PostgreSQL omitido no arranque (lazy connection).', {
        error: e.message,
      });
    }
  });

  // Graceful Server Shutdown logic to cleanup active connections and sockets
  const handleGracefulShutdown = async (signal: string) => {
    Logger.warn(`Iniciando encerramento gracioso do servidor express sob sinal ${signal}...`, {
      component: 'ExpressServer',
    });

    server.close(async () => {
      Logger.info('[ExpressServer] Servidor HTTP encerrado.', { component: 'ExpressServer' });
      
      try {
        await PostgresConfig.getInstance().closePool();
        Logger.info('[ExpressServer] Encerramento completo concluído com sucesso.', { component: 'ExpressServer' });
        process.exit(0);
      } catch (err: any) {
        Logger.error('[ExpressServer] Erro ao desligar dependências durante encerramento gracioso.', {
          error: err.message,
        });
        process.exit(1);
      }
    });

    // Force shutdown after 10 seconds timeout
    setTimeout(() => {
      Logger.error('[ExpressServer] Tempo limite excedido para encerramento gracioso. Forçando encerramento imediato.', {
        component: 'ExpressServer',
      });
      process.exit(1);
    }, 10000);
  };

  process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
}

setupViteOrStatic();
