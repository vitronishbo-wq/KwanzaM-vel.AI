/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.ts";

const { Pool } = pg;

// Lazy initialization of pool and db to prevent crash on startup if PostgreSQL is not configured
let dbInstance: any = null;

function getDb() {
  if (!dbInstance) {
    const sqlHost = process.env.SQL_HOST;
    const sqlDbName = process.env.SQL_DB_NAME;
    const user = process.env.SQL_ADMIN_USER || process.env.SQL_USER;
    const password = process.env.SQL_ADMIN_PASSWORD || process.env.SQL_PASSWORD;

    if (!sqlHost || !sqlDbName) {
      // Return a proxy/mock during design phase so it doesn't fail compilation or startup
      console.warn("[Database Warning] SQL_HOST or SQL_DB_NAME is not set. Database operations will fail if called.");
      
      const mockDb = new Proxy({}, {
        get() {
          return () => {
            throw new Error("Base de dados PostgreSQL não está configurada ou ativa neste perfil.");
          };
        }
      });
      dbInstance = mockDb;
    } else {
      const pool = new Pool({
        host: sqlHost,
        port: process.env.SQL_PORT ? parseInt(process.env.SQL_PORT, 10) : 5432,
        user,
        password,
        database: sqlDbName,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      dbInstance = drizzle(pool, { schema });
    }
  }
  return dbInstance;
}

// Export a proxy for 'db' that delegates to the lazily initialized dbInstance
export const db = new Proxy({}, {
  get(target, prop) {
    const database = getDb();
    return Reflect.get(database, prop);
  }
}) as ReturnType<typeof drizzle<typeof schema>>;
