/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { pgTable, text, doublePrecision, integer, timestamp } from "drizzle-orm/pg-core";

// Users / Wallets table
export const dbUsers = pgTable("users", {
  phone: text("phone").primaryKey(),
  name: text("name").notNull(),
  biNumber: text("bi_number").notNull(),
  balance: doublePrecision("balance").notNull().default(0),
  tier: text("tier").notNull().default("Level-1"),
  pinHash: text("pin_hash").notNull(),
  deviceId: text("device_id").notNull(),
  shortCode: text("short_code"),
  dailySpendingLimit: doublePrecision("daily_spending_limit"),
});

// Transactions table
export const dbTransactions = pgTable("transactions", {
  id: text("id").primaryKey(),
  senderPhone: text("sender_phone"),
  receiverPhone: text("receiver_phone"),
  amount: doublePrecision("amount").notNull(),
  type: text("type").notNull(), // 'envio', 'recebimento', 'pagamento'
  status: text("status").notNull(), // 'completed', etc.
  timestamp: text("timestamp").notNull(),
  latencyMs: integer("latency_ms").notNull(),
  fraudScore: integer("fraud_score").notNull(),
  correlationId: text("correlation_id"),
  traceId: text("trace_id"),
  requestId: text("request_id"),
  sessionId: text("session_id"),
  failReason: text("fail_reason"),
  deviceUserAgent: text("device_user_agent"),
  systemVersion: text("system_version"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Journal entries (Double-entry ledger partidas dobradas)
export const dbJournalEntries = pgTable("journal_entries", {
  id: text("id").primaryKey(),
  txId: text("tx_id").notNull(),
  timestamp: text("timestamp").notNull(),
  description: text("description").notNull(),
  debitAccount: text("debit_account").notNull(),
  creditAccount: text("credit_account").notNull(),
  amount: doublePrecision("amount").notNull(),
});

// BNA Reconciliation and custody logs
export const dbReconciliationLogs = pgTable("reconciliation_logs", {
  id: text("id").primaryKey(),
  timestamp: text("timestamp").notNull(),
  cycleId: text("cycle_id").notNull(),
  totalInstructionsBalance: doublePrecision("total_instructions_balance").notNull(),
  bnaCustodyBalance: doublePrecision("bna_custody_balance").notNull(),
  bfaReserveBalance: doublePrecision("bfa_reserve_balance").notNull(),
  baiReserveBalance: doublePrecision("bai_reserve_balance").notNull(),
  bicReserveBalance: doublePrecision("bic_reserve_balance").notNull(),
  totalCustodyReserves: doublePrecision("total_custody_reserves").notNull(),
  discrepancy: doublePrecision("discrepancy").notNull(),
  status: text("status").notNull(),
  complianceStatement: text("compliance_statement").notNull(),
  auditedBy: text("audited_by").notNull(),
  remarks: text("remarks"),
});

// Ledger accounts representing the double-entry charts of accounts
export const dbLedgerAccounts = pgTable("ledger_accounts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // "ASSET" | "LIABILITY" | "REVENUE" | "EXPENSE" | "EQUITY"
  balance: doublePrecision("balance").notNull().default(0),
  description: text("description").notNull(),
  version: integer("version").notNull().default(1),
});

// Ledger journal entries representing balanced, immutable accounting logs
export const dbLedgerJournalEntries = pgTable("ledger_journal_entries", {
  id: text("id").primaryKey(),
  timestamp: text("timestamp").notNull(),
  description: text("description").notNull(),
  txReferenceId: text("tx_reference_id").notNull(),
  postings: text("postings").notNull(), // JSON-serialized LedgerPosting[]
});

// Transaction Outbox table ensuring atomic event generation for external brokers (Kafka/Redpanda)
export const dbEventsOutbox = pgTable("events_outbox", {
  id: text("id").primaryKey(),
  eventType: text("event_type").notNull(),
  aggregateId: text("aggregate_id").notNull(),
  payload: text("payload").notNull(), // JSON-serialized event body
  status: text("status").notNull().default("PENDING"), // 'PENDING' | 'PROCESSED' | 'FAILED'
  createdAt: text("created_at").notNull(),
  processedAt: text("processed_at"),
  attempts: integer("attempts").notNull().default(0),
  lastError: text("last_error"),
});
