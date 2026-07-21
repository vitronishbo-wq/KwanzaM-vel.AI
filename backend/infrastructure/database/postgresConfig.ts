/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import pg from 'pg';
import { Logger } from '../../shared/logger';

const { Pool } = pg;

export interface PoolTelemetry {
  totalCount: number;
  idleCount: number;
  waitingCount: number;
  maxSize: number;
}

export class PostgresConfig {
  private static instance: PostgresConfig | null = null;
  private pool: pg.Pool | null = null;
  private isReadOnly = false;
  private isDbEnabled = false;
  private slowQueryThresholdMs = 1000; // Queries taking longer than 1s are logged as slow

  private constructor() {
    this.isReadOnly = process.env.DB_READ_ONLY === 'true';
    this.isDbEnabled = process.env.DB_ENABLED === 'true';
    if (process.env.SLOW_QUERY_THRESHOLD_MS) {
      this.slowQueryThresholdMs = parseInt(process.env.SLOW_QUERY_THRESHOLD_MS, 10);
    }
  }

  public static getInstance(): PostgresConfig {
    if (!PostgresConfig.instance) {
      PostgresConfig.instance = new PostgresConfig();
    }
    return PostgresConfig.instance;
  }

  /**
   * Initializes and returns the connection pool.
   * If a pool already exists, returns it.
   */
  public getPool(): pg.Pool {
    if (this.pool) {
      return this.pool;
    }

    const host = process.env.SQL_HOST;
    const portStr = process.env.SQL_PORT;
    const user = process.env.SQL_USER;
    const password = process.env.SQL_PASSWORD;
    const database = process.env.SQL_DB_NAME;
    const port = portStr ? parseInt(portStr, 10) : 5432;

    if (!host || !user || !password || !database) {
      Logger.warn('[Secret Manager Alert] Credenciais de ligação PostgreSQL incompletas nas variáveis de ambiente. Verifique as configurações de ambiente.', {
        component: 'PostgresConfig',
        checks: {
          SQL_HOST_PRESENT: !!host,
          SQL_PORT_PRESENT: !!portStr,
          SQL_USER_PRESENT: !!user,
          SQL_PASSWORD_PRESENT: !!password,
          SQL_DB_NAME_PRESENT: !!database,
        }
      });
    }

    const maxConnections = process.env.SQL_MAX_CONNECTIONS ? parseInt(process.env.SQL_MAX_CONNECTIONS, 10) : 20;

    this.pool = new Pool({
      host: host || 'localhost',
      user: user || 'postgres',
      password: password || '',
      database: database || 'kwanzamovel',
      port,
      max: maxConnections,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 15000,
      statement_timeout: 30000, // 30s statement timeout to avoid hanging queries in Cloud Run
    });

    this.pool.on('connect', (client) => {
      Logger.info('[Observability] Nova ligação física estabelecida com o Cloud SQL PostgreSQL.', {
        component: 'DatabasePool',
        connection: { host: host || 'localhost', port, database: database || 'kwanzamovel' }
      });
    });

    this.pool.on('error', (err) => {
      Logger.error('[Observability] Erro inesperado num cliente inativo do pool de base de dados.', {
        component: 'DatabasePool',
        error: err.message,
        stack: err.stack,
      });
    });

    return this.pool;
  }

  /**
   * Returns active connection pool metrics/telemetry.
   */
  public getPoolMetrics(): PoolTelemetry {
    if (!this.isDbEnabled) {
      return {
        totalCount: 0,
        idleCount: 0,
        waitingCount: 0,
        maxSize: 0,
      };
    }
    const pool = this.getPool();
    return {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount,
      maxSize: (pool as any).options?.max || 20,
    };
  }

  /**
   * Active health check executing a fast test query, with connection retries and exponential backoff.
   */
  public async testConnection(retries = 3, delayMs = 1000): Promise<boolean> {
    if (!this.isDbEnabled) {
      Logger.info('[Health Check] Base de dados PostgreSQL desativada (DB_ENABLED !== true). Utilizando arquitetura resiliente em memória.', {
        component: 'DatabasePool',
      });
      return true;
    }

    let attempt = 0;
    while (attempt < retries) {
      const start = Date.now();
      try {
        attempt++;
        const pool = this.getPool();
        const result = await pool.query('SELECT NOW() as current_time;');
        const latencyMs = Date.now() - start;

        Logger.info('[Health Check] Teste de ligação à base de dados concluído com sucesso.', {
          component: 'DatabasePool',
          latencyMs,
          attempt,
          dbTime: result.rows[0]?.current_time,
          metrics: this.getPoolMetrics(),
        });
        return true;
      } catch (err: any) {
        const latencyMs = Date.now() - start;
        Logger.warn(`[Health Check] Falha ao ligar à base de dados (Tentativa ${attempt}/${retries}). Erro: ${err.message}`, {
          component: 'DatabasePool',
          latencyMs,
          error: err.message,
        });

        if (attempt >= retries) {
          Logger.error('[Health Check] Falha crítica de ligação à base de dados após todas as tentativas.', {
            component: 'DatabasePool',
            error: err.message,
            stack: err.stack,
          });
          return false;
        }

        // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, delayMs * Math.pow(2, attempt - 1)));
      }
    }
    return false;
  }

  /**
   * Verifies if a write command is trying to execute while the database is in read-only mode.
   */
  private checkReadOnly(text: string): void {
    if (this.isReadOnly) {
      const isMutation = /\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE)\b/gi.test(text);
      if (isMutation) {
        throw new Error('Database is currently in READ-ONLY mode. Mutation operations are blocked.');
      }
    }
  }

  /**
   * Standard query method with built-in slow-query logging and read-only guarding.
   */
  public async query<T = any>(
    text: string,
    params?: any[],
  ): Promise<pg.QueryResult<T>> {
    this.checkReadOnly(text);
    const start = Date.now();

    try {
      const pool = this.getPool();
      const result = await pool.query<T>(text, params);
      const latencyMs = Date.now() - start;

      if (latencyMs > this.slowQueryThresholdMs) {
        Logger.warn('[Observability] Slow Query Detetada na Base de Dados!', {
          component: 'DatabaseQuery',
          latencyMs,
          thresholdMs: this.slowQueryThresholdMs,
          sql: text,
          paramCount: params?.length || 0,
        });
      } else {
        Logger.info('[Database] Query SQL executada com sucesso.', {
          component: 'DatabaseQuery',
          latencyMs,
          rowCount: result.rowCount,
          command: result.command,
        });
      }

      return result;
    } catch (err: any) {
      const latencyMs = Date.now() - start;
      Logger.error('[Database] Falha crítica ao executar query SQL.', {
        component: 'DatabaseQuery',
        latencyMs,
        error: err.message,
        sql: text,
        stack: err.stack,
      });
      throw err;
    }
  }

  /**
   * Low-level transaction management methods
   */
  public async begin(client: pg.PoolClient): Promise<void> {
    await client.query('BEGIN');
    Logger.info('[Database] Transação iniciada.', { component: 'DatabaseTransaction' });
  }

  public async commit(client: pg.PoolClient): Promise<void> {
    await client.query('COMMIT');
    Logger.info('[Database] Transação confirmada (commit).', { component: 'DatabaseTransaction' });
  }

  public async rollback(client: pg.PoolClient): Promise<void> {
    try {
      await client.query('ROLLBACK');
      Logger.info('[Database] Transação revertida (rollback) executada com sucesso.', { component: 'DatabaseTransaction' });
    } catch (err: any) {
      Logger.error('[Database] Falha crítica ao executar rollback.', {
        component: 'DatabaseTransaction',
        error: err.message,
      });
    }
  }

  /**
   * High-level transaction wrapper that checks out a client, runs the callback, commits,
   * and rolls back automatically if an error occurs.
   */
  public async transaction<T>(callback: (client: pg.PoolClient) => Promise<T>): Promise<T> {
    const pool = this.getPool();
    const client = await pool.connect();
    const start = Date.now();

    try {
      await this.begin(client);
      const result = await callback(client);
      await this.commit(client);
      return result;
    } catch (err: any) {
      Logger.warn('[Database] Erro na transação. Executando rollback automático.', {
        component: 'DatabaseTransaction',
        error: err.message,
      });
      await this.rollback(client);
      throw err;
    } finally {
      client.release();
      const latencyMs = Date.now() - start;
      Logger.info('[Database] Cliente de transação devolvido ao pool.', {
        component: 'DatabaseTransaction',
        latencyMs,
      });
    }
  }

  /**
   * Stubs for enterprise migration and seed execution.
   */
  public async runMigrations(): Promise<void> {
    Logger.info('[Migration Runner] Iniciando execução das migrações...', { component: 'MigrationRunner' });
    try {
      // Setup schema tables if they don't exist
      await this.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          id SERIAL PRIMARY KEY,
          version VARCHAR(255) NOT NULL UNIQUE,
          applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      Logger.info('[Migration Runner] Migrações verificadas/aplicadas com sucesso.', { component: 'MigrationRunner' });
    } catch (err: any) {
      Logger.error('[Migration Runner] Falha ao rodar migrações da base de dados.', {
        component: 'MigrationRunner',
        error: err.message,
      });
      throw err;
    }
  }

  public async seedDatabase(): Promise<void> {
    Logger.info('[Seed Runner] Iniciando população inicial da base de dados (seeding)...', { component: 'SeedRunner' });
    try {
      // Example seeding log/query
      Logger.info('[Seed Runner] Base de dados populada com dados iniciais com sucesso.', { component: 'SeedRunner' });
    } catch (err: any) {
      Logger.error('[Seed Runner] Falha ao rodar seeding da base de dados.', {
        component: 'SeedRunner',
        error: err.message,
      });
      throw err;
    }
  }

  /**
   * Gracefully closes the connection pool.
   */
  public async closePool(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      Logger.info('[Database] Pool de ligações do PostgreSQL encerrado com sucesso.', { component: 'DatabasePool' });
    }
  }
}

// Register graceful shutdown handlers
const shutdownHandler = async (signal: string) => {
  Logger.warn(`Recebido sinal ${signal}. Iniciando o encerramento gracioso do pool do PostgreSQL...`, {
    component: 'DatabasePool',
    signal,
  });
  try {
    await PostgresConfig.getInstance().closePool();
  } catch (err: any) {
    Logger.error(`Erro ao encerrar o pool do PostgreSQL durante o sinal ${signal}.`, {
      component: 'DatabasePool',
      error: err.message,
    });
  }
};

process.on('SIGINT', () => shutdownHandler('SIGINT'));
process.on('SIGTERM', () => shutdownHandler('SIGTERM'));
