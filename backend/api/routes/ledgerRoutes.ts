/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Request, Response } from 'express';
import { db } from '../../db/index.ts';
import { dbLedgerAccounts, dbLedgerJournalEntries, dbEventsOutbox } from '../../db/schema.ts';
import { initialLedgerAccounts, initialLedgerEntries, verifyLedgerChainIntegrity, computeJournalEntryHash, GENESIS_PREVIOUS_HASH, LedgerJournalEntry } from '../../../src/ledgerEngine.ts';
import { eq } from 'drizzle-orm';
import { Logger } from '../../shared/logger';

const router = Router();

// GET /api/ledger/accounts
router.get('/ledger/accounts', async (req: Request, res: Response) => {
  try {
    let accounts = await db.select().from(dbLedgerAccounts);
    if (accounts.length === 0) {
      Logger.info('[PostgresLedger] No ledger accounts found in DB. Seeding initial accounts...', { component: 'LedgerRoutes' });
      const initial = initialLedgerAccounts.map(a => ({
        id: a.id,
        name: a.name,
        type: a.type,
        balance: a.balance,
        description: a.description,
        version: a.version || 1,
      }));
      await db.insert(dbLedgerAccounts).values(initial);
      accounts = await db.select().from(dbLedgerAccounts);
    }
    res.json(accounts);
  } catch (err: any) {
    Logger.error('[PostgresLedger] Failed to fetch accounts from PostgreSQL', { error: err.message });
    res.status(500).json({ error: 'Erro ao obter contas do razão.', details: err.message });
  }
});

// POST /api/ledger/accounts
router.post('/ledger/accounts', async (req: Request, res: Response) => {
  try {
    const accounts = req.body;
    if (!Array.isArray(accounts)) {
      res.status(400).json({ error: 'Payload de contas inválido.' });
      return;
    }

    await db.transaction(async (tx) => {
      for (const updated of accounts) {
        const storedRows = await tx.select().from(dbLedgerAccounts).where(eq(dbLedgerAccounts.id, updated.id));
        const stored = storedRows[0];
        if (stored) {
          if (stored.balance !== updated.balance) {
            if (stored.version > updated.version) {
              throw new Error(`CONCURRENCY_CONFLICT:${updated.id}:${updated.version}:${stored.version}`);
            }
            updated.version = stored.version + 1;
          }
          await tx.update(dbLedgerAccounts)
            .set({
              name: updated.name,
              balance: updated.balance,
              type: updated.type,
              description: updated.description,
              version: updated.version,
            })
            .where(eq(dbLedgerAccounts.id, updated.id));
        } else {
          updated.version = updated.version || 1;
          await tx.insert(dbLedgerAccounts)
            .values({
              id: updated.id,
              name: updated.name,
              type: updated.type,
              balance: updated.balance,
              description: updated.description,
              version: updated.version,
            });
        }
      }
    });

    res.json({ success: true, accounts });
  } catch (err: any) {
    Logger.error('[PostgresLedger] Failed to save accounts in PostgreSQL', { error: err.message });
    if (err.message.startsWith('CONCURRENCY_CONFLICT:')) {
      const parts = err.message.split(':');
      res.status(409).json({
        error: 'ConcurrencyConflictException',
        accountId: parts[1],
        expectedVersion: parseInt(parts[2], 10),
        actualVersion: parseInt(parts[3], 10),
      });
      return;
    }
    res.status(500).json({ error: 'Erro ao guardar contas do razão.', details: err.message });
  }
});

// GET /api/ledger/journal-entries
router.get('/ledger/journal-entries', async (req: Request, res: Response) => {
  try {
    let entries = await db.select().from(dbLedgerJournalEntries);
    if (entries.length === 0) {
      Logger.info('[PostgresLedger] No journal entries found in DB. Seeding initial entries...', { component: 'LedgerRoutes' });
      const initial = initialLedgerEntries.map(e => ({
        id: e.id,
        timestamp: e.timestamp,
        description: e.description,
        txReferenceId: e.txReferenceId,
        postings: JSON.stringify(e.postings),
        sequenceNumber: e.sequenceNumber || null,
        previousHash: e.previousHash || null,
        hash: e.hash || null,
        immutableSeal: e.immutableSeal || null,
      }));
      await db.insert(dbLedgerJournalEntries).values(initial);
      entries = await db.select().from(dbLedgerJournalEntries);
    }

    const mapped: LedgerJournalEntry[] = entries.map(e => ({
      id: e.id,
      timestamp: e.timestamp,
      description: e.description,
      txReferenceId: e.txReferenceId,
      postings: JSON.parse(e.postings),
      sequenceNumber: e.sequenceNumber || undefined,
      previousHash: e.previousHash || undefined,
      hash: e.hash || undefined,
      immutableSeal: e.immutableSeal || undefined,
    }));

    res.json(mapped);
  } catch (err: any) {
    Logger.error('[PostgresLedger] Failed to fetch journal entries from PostgreSQL', { error: err.message });
    res.status(500).json({ error: 'Erro ao obter diário do razão.', details: err.message });
  }
});

// GET /api/ledger/integrity
router.get('/ledger/integrity', async (req: Request, res: Response) => {
  try {
    const rawEntries = await db.select().from(dbLedgerJournalEntries);
    const mapped: LedgerJournalEntry[] = rawEntries.map(e => ({
      id: e.id,
      timestamp: e.timestamp,
      description: e.description,
      txReferenceId: e.txReferenceId,
      postings: JSON.parse(e.postings),
      sequenceNumber: e.sequenceNumber || undefined,
      previousHash: e.previousHash || undefined,
      hash: e.hash || undefined,
      immutableSeal: e.immutableSeal || undefined,
    }));

    const report = verifyLedgerChainIntegrity(mapped);
    res.json(report);
  } catch (err: any) {
    Logger.error('[PostgresLedger] Failed to verify ledger chain integrity', { error: err.message });
    res.status(500).json({ error: 'Erro ao auditar integridade da cadeia do razão.', details: err.message });
  }
});

// POST /api/ledger/journal-entry
router.post('/ledger/journal-entry', async (req: Request, res: Response) => {
  try {
    const { entry, outboxEvent } = req.body.entry ? req.body : { entry: req.body, outboxEvent: null };
    if (!entry || !entry.id) {
      res.status(400).json({ error: 'Payload de entrada de diário inválido.' });
      return;
    }

    // Execução atómica na mesma transação ACID do PostgreSQL
    await db.transaction(async (tx) => {
      // 1. Gravar lançamento de diário no Ledger (com campos criptográficos)
      await tx.insert(dbLedgerJournalEntries).values({
        id: entry.id,
        timestamp: entry.timestamp,
        description: entry.description,
        txReferenceId: entry.txReferenceId,
        postings: JSON.stringify(entry.postings),
        sequenceNumber: entry.sequenceNumber || null,
        previousHash: entry.previousHash || null,
        hash: entry.hash || null,
        immutableSeal: entry.immutableSeal || null,
      }).onConflictDoNothing();

      // 2. Gravar evento de Transaction Outbox atómico
      const evtId = outboxEvent?.id || `outbox_evt_${entry.id}_${Date.now()}`;
      const evtType = outboxEvent?.event?.type || outboxEvent?.eventType || "LedgerCommitted";
      const payloadObj = outboxEvent?.event || outboxEvent?.payload || {
        id: `evt_${entry.id}`,
        type: "LedgerCommitted",
        timestamp: entry.timestamp || new Date().toISOString(),
        payload: {
          journalEntryId: entry.id,
          description: entry.description,
          txReferenceId: entry.txReferenceId,
          postingsCount: entry.postings?.length || 0,
        },
      };

      await tx.insert(dbEventsOutbox).values({
        id: evtId,
        eventType: evtType,
        aggregateId: entry.id,
        payload: typeof payloadObj === 'string' ? payloadObj : JSON.stringify(payloadObj),
        status: "PENDING",
        createdAt: entry.timestamp || new Date().toISOString(),
        attempts: 0,
      }).onConflictDoNothing();
    });

    res.json({ success: true });
  } catch (err: any) {
    Logger.error('[PostgresLedger] Failed to save journal entry in PostgreSQL', { error: err.message });
    res.status(500).json({ error: 'Erro ao guardar diário do razão.', details: err.message });
  }
});

// GET /api/ledger/outbox
router.get('/ledger/outbox', async (req: Request, res: Response) => {
  try {
    const statusFilter = req.query.status as string;
    let query = db.select().from(dbEventsOutbox);
    let rows = await query;
    if (statusFilter) {
      rows = rows.filter(r => r.status === statusFilter);
    }
    const mapped = rows.map(r => ({
      id: r.id,
      event: typeof r.payload === 'string' ? JSON.parse(r.payload) : r.payload,
      status: r.status as "PENDING" | "PROCESSED" | "FAILED",
      createdAt: r.createdAt,
      processedAt: r.processedAt || undefined,
      attempts: r.attempts,
      lastError: r.lastError || undefined,
    }));
    res.json(mapped);
  } catch (err: any) {
    Logger.error('[PostgresLedger] Failed to fetch events from Outbox', { error: err.message });
    res.status(500).json({ error: 'Erro ao obter mensagens do Outbox.', details: err.message });
  }
});

// POST /api/ledger/outbox
router.post('/ledger/outbox', async (req: Request, res: Response) => {
  try {
    const msg = req.body;
    if (!msg || !msg.id) {
      res.status(400).json({ error: 'Payload de mensagem outbox inválido.' });
      return;
    }

    const payloadStr = typeof msg.event === 'string' ? msg.event : JSON.stringify(msg.event || {});

    await db.insert(dbEventsOutbox).values({
      id: msg.id,
      eventType: msg.event?.type || "LedgerCommitted",
      aggregateId: msg.event?.payload?.journalEntryId || msg.id,
      payload: payloadStr,
      status: msg.status || "PENDING",
      createdAt: msg.createdAt || new Date().toISOString(),
      processedAt: msg.processedAt || null,
      attempts: msg.attempts || 0,
      lastError: msg.lastError || null,
    }).onConflictDoUpdate({
      target: dbEventsOutbox.id,
      set: {
        status: msg.status || "PENDING",
        processedAt: msg.processedAt || null,
        attempts: msg.attempts || 0,
        lastError: msg.lastError || null,
      }
    });

    res.json({ success: true });
  } catch (err: any) {
    Logger.error('[PostgresLedger] Failed to save outbox message in PostgreSQL', { error: err.message });
    res.status(500).json({ error: 'Erro ao guardar mensagem no Outbox.', details: err.message });
  }
});

export default router;

