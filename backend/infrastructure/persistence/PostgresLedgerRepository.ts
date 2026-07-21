/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { eq, desc } from "drizzle-orm";
import { db } from "../../db/index.ts";
import { 
  dbUsers, 
  dbTransactions, 
  dbJournalEntries, 
  dbReconciliationLogs,
  dbLedgerAccounts,
  dbLedgerJournalEntries
} from "../../db/schema.ts";
import { UserAccount, Transaction, JournalEntry, ReconciliationLog } from "../../../src/types.ts";
import { LedgerRepository } from "../../domain/ledger/repositories/LedgerRepository";
import { Posting } from "../../domain/ledger/entities/Posting";
import { UniqueEntityId } from "../../domain/shared/UniqueEntityId";
import { Result } from "../../domain/shared/Result";
import { Money } from "../../domain/shared/Money";
import { Currency } from "../../domain/shared/Currency";
import { PostingLineType } from "../../domain/ledger/value-objects/PostingLineType";
import { PostingLine } from "../../domain/ledger/value-objects/PostingLine";

/**
 * Concrete PostgreSQL implementation of the Ledger and Financial persistence engine
 * following the Clean Architecture pattern (Infrastructure Layer).
 */
export class PostgresLedgerRepository implements LedgerRepository {
  
  // ==========================================
  // WALLET / USER DATA OPERATIONS
  // ==========================================

  /**
   * Fetches a wallet by telephone number.
   * Translates PostgreSQL schema to pure Domain schema.
   */
  async getWalletByPhone(phone: string): Promise<UserAccount | null> {
    try {
      const results = await db.select().from(dbUsers).where(eq(dbUsers.phone, phone)).limit(1);
      if (results.length === 0) return null;

      const user = results[0];
      return {
        phone: user.phone,
        name: user.name,
        biNumber: user.biNumber,
        balance: user.balance,
        tier: user.tier as "Level-1" | "Level-2" | "Level-3",
        pinHash: user.pinHash,
        deviceId: user.deviceId,
        isRegistered: true,
        shortCode: user.shortCode || undefined,
        dailySpendingLimit: user.dailySpendingLimit || undefined,
      };
    } catch (error) {
      console.error(`[Query Layer Error] Falha ao ler carteira para ${phone}:`, error);
      throw new Error(`Erro na base de dados ao aceder à carteira ${phone}.`, { cause: error });
    }
  }

  /**
   * Saves or updates a user wallet using safe concurrent upserts.
   */
  async saveWallet(wallet: UserAccount): Promise<void> {
    try {
      await db.insert(dbUsers)
        .values({
          phone: wallet.phone,
          name: wallet.name,
          biNumber: wallet.biNumber,
          balance: wallet.balance,
          tier: wallet.tier,
          pinHash: wallet.pinHash,
          deviceId: wallet.deviceId,
          shortCode: wallet.shortCode || null,
          dailySpendingLimit: wallet.dailySpendingLimit || null,
        })
        .onConflictDoUpdate({
          target: dbUsers.phone,
          set: {
            name: wallet.name,
            biNumber: wallet.biNumber,
            balance: wallet.balance,
            tier: wallet.tier,
            pinHash: wallet.pinHash,
            deviceId: wallet.deviceId,
            shortCode: wallet.shortCode || null,
            dailySpendingLimit: wallet.dailySpendingLimit || null,
          }
        });
    } catch (error) {
      console.error(`[Query Layer Error] Falha ao registar/atualizar carteira ${wallet.phone}:`, error);
      throw new Error(`Erro na base de dados ao persistir carteira do utilizador.`, { cause: error });
    }
  }

  // ==========================================
  // TRANSACTION LOG OPERATIONS
  // ==========================================

  /**
   * Appends a new financial transaction log into SQL with transactional integrity.
   */
  async saveTransaction(tx: Transaction): Promise<void> {
    try {
      await db.insert(dbTransactions).values({
        id: tx.id,
        senderPhone: tx.senderPhone || null,
        receiverPhone: tx.receiverPhone || null,
        amount: tx.amount,
        type: tx.type,
        status: tx.status,
        timestamp: tx.timestamp,
        latencyMs: tx.latencyMs,
        fraudScore: tx.fraudScore,
        correlationId: tx.correlationId || null,
        traceId: tx.traceId || null,
        requestId: tx.requestId || null,
        sessionId: tx.sessionId || null,
        failReason: tx.failReason || null,
        deviceUserAgent: tx.deviceUserAgent || null,
        systemVersion: tx.systemVersion || null,
      });
    } catch (error) {
      console.error(`[Query Layer Error] Falha ao gravar transação ${tx.id}:`, error);
      throw new Error(`Erro ao registar histórico transacional no repositório.`, { cause: error });
    }
  }

  /**
   * Retrieves high audit transactions for review.
   */
  async getLatestTransactions(limitCount: number = 50): Promise<Transaction[]> {
    try {
      const rows = await db.select().from(dbTransactions).orderBy(desc(dbTransactions.createdAt)).limit(limitCount);
      return rows.map(r => ({
        id: r.id,
        senderPhone: r.senderPhone || "",
        receiverPhone: r.receiverPhone || "",
        amount: r.amount,
        type: r.type as "envio" | "recebimento" | "pagamento",
        status: r.status as any,
        timestamp: r.timestamp,
        latencyMs: r.latencyMs,
        fraudScore: r.fraudScore,
        correlationId: r.correlationId || undefined,
        traceId: r.traceId || undefined,
        requestId: r.requestId || undefined,
        sessionId: r.sessionId || undefined,
        failReason: r.failReason || undefined,
        deviceUserAgent: r.deviceUserAgent || undefined,
        systemVersion: r.systemVersion || undefined,
        securityLog: ["Registo carregado do arquivo frio Cloud SQL."]
      }));
    } catch (error) {
      console.error("[Query Layer Error] Falha ao recuperar últimas transações:", error);
      throw new Error("Erro de base de dados ao listar histórico operacional.", { cause: error });
    }
  }

  // ==========================================
  // JOURNAL ENTRIES (DOUBLE-ENTRY PARTIDAS DOBRADAS)
  // ==========================================

  async saveJournalEntry(entry: JournalEntry): Promise<void> {
    try {
      await db.insert(dbJournalEntries).values({
        id: entry.id,
        txId: entry.txId,
        timestamp: entry.timestamp,
        description: entry.description,
        debitAccount: entry.debitAccount,
        creditAccount: entry.creditAccount,
        amount: entry.amount,
      });
    } catch (error) {
      console.error(`[Query Layer Error] Falha ao gravar partida dobrada para txId ${entry.txId}:`, error);
      throw new Error("Inconsistência de partidas dobradas: Erro ao persistir diário do ledger.", { cause: error });
    }
  }

  // ==========================================
  // BNA RECONCILIATION LOGS
  // ==========================================

  async saveReconciliationLog(log: ReconciliationLog): Promise<void> {
    try {
      await db.insert(dbReconciliationLogs).values({
        id: log.id,
        timestamp: log.timestamp,
        cycleId: log.cycleId,
        totalInstructionsBalance: log.totalInstructionsBalance,
        bnaCustodyBalance: log.bnaCustodyBalance,
        bfaReserveBalance: log.bfaReserveBalance,
        baiReserveBalance: log.baiReserveBalance,
        bicReserveBalance: log.bicReserveBalance,
        totalCustodyReserves: log.totalCustodyReserves,
        discrepancy: log.discrepancy,
        status: log.status,
        complianceStatement: log.complianceStatement,
        auditedBy: log.auditedBy,
        remarks: log.remarks || null,
      });
    } catch (error) {
      console.error(`[Query Layer Error] Falha ao persistir ciclo de conciliação ${log.cycleId}:`, error);
      throw new Error("Erro ao salvar logs de conciliação e custódia do regulador.", { cause: error });
    }
  }

  // ==========================================
  // DOMAIN LEDGER REPOSITORY IMPLEMENTATION
  // ==========================================

  async save(posting: Posting): Promise<Result<void>> {
    try {
      const postingsJson = JSON.stringify(
        posting.lines.map((line) => ({
          accountId: line.accountCode,
          accountName: line.accountCode.split(':').pop() || line.accountCode,
          amount: line.isDebit() ? line.amount.toFormatNumber() : -line.amount.toFormatNumber(),
          type: line.isDebit() ? "DEBIT" : "CREDIT",
        }))
      );

      await db.insert(dbLedgerJournalEntries).values({
        id: posting.id.toString(),
        timestamp: posting.createdAt.toISOString(),
        description: posting.description,
        txReferenceId: posting.externalReference || "",
        postings: postingsJson,
      });

      return Result.ok<void>();
    } catch (error: any) {
      console.error(`[PostgresLedgerRepository] Falha ao persistir Posting:`, error);
      return Result.fail<void>(`Erro de persistência no banco de dados: ${error.message}`);
    }
  }

  async findById(id: UniqueEntityId): Promise<Result<Posting>> {
    try {
      const rows = await db
        .select()
        .from(dbLedgerJournalEntries)
        .where(eq(dbLedgerJournalEntries.id, id.toString()))
        .limit(1);

      if (rows.length === 0) {
        return Result.fail<Posting>(`Lançamento com ID ${id.toString()} não encontrado.`);
      }

      return this.mapToDomain(rows[0]);
    } catch (error: any) {
      console.error(`[PostgresLedgerRepository] Falha ao buscar Posting por ID:`, error);
      return Result.fail<Posting>(`Erro ao buscar lançamento por ID: ${error.message}`);
    }
  }

  async findByReference(reference: string): Promise<Result<Posting[]>> {
    try {
      const rows = await db
        .select()
        .from(dbLedgerJournalEntries)
        .where(eq(dbLedgerJournalEntries.txReferenceId, reference));

      const postings: Posting[] = [];
      for (const row of rows) {
        const mappedResult = this.mapToDomain(row);
        if (mappedResult.isFailure) {
          return Result.fail<Posting[]>(mappedResult.error!);
        }
        postings.push(mappedResult.getValue());
      }

      return Result.ok<Posting[]>(postings);
    } catch (error: any) {
      console.error(`[PostgresLedgerRepository] Falha ao buscar Posting por referência:`, error);
      return Result.fail<Posting[]>(`Erro ao buscar lançamentos por referência: ${error.message}`);
    }
  }

  async getAccountBalance(accountCode: string): Promise<Result<Money>> {
    try {
      const rows = await db.select().from(dbLedgerJournalEntries);
      
      let totalDebitSubunits = 0n;
      let totalCreditSubunits = 0n;

      for (const row of rows) {
        const parsedPostings = JSON.parse(row.postings);
        for (const parsed of parsedPostings) {
          if (parsed.accountId === accountCode) {
            const amountResult = Money.fromMainUnit(Math.abs(parsed.amount), Currency.AOA());
            if (amountResult.isFailure) {
              return Result.fail<Money>(`Falha ao converter valor monetário durante cálculo de saldo: ${amountResult.error}`);
            }
            const value = amountResult.getValue();
            if (parsed.type === "DEBIT") {
              totalDebitSubunits += value.amount;
            } else {
              totalCreditSubunits += value.amount;
            }
          }
        }
      }

      const isDebitTypical = accountCode.toLowerCase().startsWith("assets:") || accountCode.toLowerCase().startsWith("expenses:");
      const balanceSubunits = isDebitTypical 
        ? (totalDebitSubunits - totalCreditSubunits) 
        : (totalCreditSubunits - totalDebitSubunits);

      return Money.create(balanceSubunits, Currency.AOA(), true);
    } catch (error: any) {
      console.error(`[PostgresLedgerRepository] Falha ao calcular saldo da conta:`, error);
      return Result.fail<Money>(`Erro ao calcular saldo: ${error.message}`);
    }
  }

  async getAllPostings(): Promise<Result<Posting[]>> {
    try {
      const rows = await db.select().from(dbLedgerJournalEntries);
      
      const postings: Posting[] = [];
      for (const row of rows) {
        const mappedResult = this.mapToDomain(row);
        if (mappedResult.isFailure) {
          return Result.fail<Posting[]>(mappedResult.error!);
        }
        postings.push(mappedResult.getValue());
      }

      return Result.ok<Posting[]>(postings);
    } catch (error: any) {
      console.error(`[PostgresLedgerRepository] Falha ao listar lançamentos:`, error);
      return Result.fail<Posting[]>(`Erro ao obter lançamentos: ${error.message}`);
    }
  }

  private mapToDomain(row: any): Result<Posting> {
    try {
      const parsedPostings = JSON.parse(row.postings);
      const postingLines: PostingLine[] = [];

      for (const parsed of parsedPostings) {
        const type = parsed.type === "DEBIT" ? PostingLineType.DEBIT : PostingLineType.CREDIT;
        const amountResult = Money.fromMainUnit(Math.abs(parsed.amount), Currency.AOA());
        if (amountResult.isFailure) {
          return Result.fail<Posting>(`Falha ao converter valor monetário no mapeamento: ${amountResult.error}`);
        }

        const lineResult = PostingLine.create(parsed.accountId, type, amountResult.getValue());
        if (lineResult.isFailure) {
          return Result.fail<Posting>(`Falha ao recriar linha no mapeamento: ${lineResult.error}`);
        }

        postingLines.push(lineResult.getValue());
      }

      return Posting.create({
        description: row.description,
        lines: postingLines,
        createdAt: new Date(row.timestamp),
        externalReference: row.txReferenceId || undefined
      }, new UniqueEntityId(row.id));
    } catch (error: any) {
      return Result.fail<Posting>(`Erro ao mapear linha para o domínio: ${error.message}`);
    }
  }
}
