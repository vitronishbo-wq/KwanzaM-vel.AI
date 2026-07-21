/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// Load environment variables for configuration
dotenv.config();

const sqlHost = process.env.SQL_HOST;
const sqlDbName = process.env.SQL_DB_NAME;
const user = process.env.SQL_ADMIN_USER;
const password = process.env.SQL_ADMIN_PASSWORD;

// Fail-safe validation for migrations tool configuration
if (!sqlHost) {
  console.warn("[Drizzle Kit Warning] SQL_HOST is not defined in the environment.");
}
if (!sqlDbName) {
  console.warn("[Drizzle Kit Warning] SQL_DB_NAME is not defined in the environment.");
}
if (!user) {
  console.warn("[Drizzle Kit Warning] SQL_ADMIN_USER is not defined in the environment.");
}
if (!password) {
  console.warn("[Drizzle Kit Warning] SQL_ADMIN_PASSWORD is not defined in the environment.");
}

export default defineConfig({
  schema: "./backend/db/schema.ts",
  out: "./drizzle", // Migrations generation folder
  dialect: "postgresql",
  schemaFilter: ["public"],
  dbCredentials: {
    host: sqlHost || "localhost",
    user: user || "admin",
    password: password || "",
    database: sqlDbName || "kwanzamovel",
    ssl: false, // Set to true if connecting over external TLS instead of local Auth Proxy
  },
  verbose: true,
});
