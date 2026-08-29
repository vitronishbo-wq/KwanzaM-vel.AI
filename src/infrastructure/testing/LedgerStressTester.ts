/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { container } from "../../bootstrap/container";
import { TransactionManager } from "../../domain/transaction/TransactionManager";
import { WalletRepository } from "../../domain/repository/WalletRepository";
import { LedgerRepository } from "../../domain/repository/LedgerRepository";
import { Money, LedgerAccount, toKwanzaCents, fromKwanzaCents } from "../../ledgerEngine";
import { computeSha256 } from "../../domain/ledger/LedgerCryptography";

export interface StressTestTelemetry {
  startTime: string;
  endTime: string;
  durationMs: number;
  concurrencyLevel: number;
  amountPerTransaction: number;
  totalAttempted: number;
  successfulTransactions: number;
  failedTransactions: number;
  concurrencyCollisionsDetected: number;
  transactionsPerSecond: number;
  averageLatencyMs: number;
  minLatencyMs: number;
  maxLatencyMs: number;
  initialSenderBalance: number;
  initialReceiverBalance: number;
  finalSenderBalance: number;
  finalReceiverBalance: number;
  initialLedgerTotal: number;
  finalLedgerTotal: number;
  ledgerInvariantsPreserved: boolean;
  walletInvariantsPreserved: boolean;
  errors: string[];
}

/**
 * Utilitário de Teste de Stress para o Ledger do KMOS
 * Simula rajadas de transações altamente concorrentes executadas de forma assíncrona
 * para validar a integridade atómica e o mecanismo de Optimistic Concurrency Control (OCC).
 */
export class LedgerStressTester {
  private transactionManager: TransactionManager;
  private walletRepo: WalletRepository;
  private ledgerRepo: LedgerRepository;

  constructor(
    transactionManager = container.transactionManager,
    walletRepo = container.walletRepository,
    ledgerRepo = container.ledgerRepository
  ) {
    this.transactionManager = transactionManager;
    this.walletRepo = walletRepo;
    this.ledgerRepo = ledgerRepo;
  }

  /**
   * Executa uma rajada concorrente de transferências de uma carteira de origem para uma carteira de destino.
   * Ambas as contas correspondentes no Ledger de partidas dobradas são afetadas em paralelo.
   */
  public async executeStressTest(options: {
    concurrencyLevel: number;
    amountPerTransaction: number;
    senderPhone: string;
    receiverPhone: string;
    debitAccount: string;
    creditAccount: string;
  }): Promise<StressTestTelemetry> {
    const {
      concurrencyLevel = 10,
      amountPerTransaction = 50,
      senderPhone = "+244900000001",
      receiverPhone = "+244900000002",
      debitAccount = "USER_ANTONIO",
      creditAccount = "USER_BENEFICIARY",
    } = options;

    const errors: string[] = [];
    let collisionsDetected = 0;

    // 1. Garantir que as contas e carteiras participantes existem com saldo suficiente para aguentar o stress
    const initialFundsNeeded = concurrencyLevel * amountPerTransaction * 2.5;

    // Carregar ou inicializar carteira do remetente
    let senderWallet = await this.walletRepo.findByPhone(senderPhone);
    if (!senderWallet) {
      senderWallet = {
        phone: senderPhone,
        name: "António Stress Test Remetente",
        biNumber: "000123456LA01",
        balance: initialFundsNeeded,
        tier: "Level-1",
        pinHash: computeSha256("stress_sender_pin_2026"),
        deviceId: "dev_stress_sender",
        isRegistered: true,
      };
      await this.walletRepo.save(senderWallet);
    } else if (senderWallet.balance < initialFundsNeeded) {
      senderWallet.balance = initialFundsNeeded;
      await this.walletRepo.save(senderWallet);
    }

    // Carregar ou inicializar carteira do destinatário
    let receiverWallet = await this.walletRepo.findByPhone(receiverPhone);
    if (!receiverWallet) {
      receiverWallet = {
        phone: receiverPhone,
        name: "Mateus Stress Test Destinatário",
        biNumber: "000123456LA02",
        balance: 1000,
        tier: "Level-1",
        pinHash: computeSha256("stress_receiver_pin_2026"),
        deviceId: "dev_stress_receiver",
        isRegistered: true,
      };
      await this.walletRepo.save(receiverWallet);
    }

    // Ajustar saldo e garantir a versão inicial das contas do Ledger fiduciárias correspondentes para garantir invariante
    const initialLedgerAccounts = await this.ledgerRepo.getAccounts();
    const updatedAccounts = initialLedgerAccounts.map(acc => {
      if (acc.id === debitAccount) {
        return { ...acc, balance: Math.max(acc.balance, initialFundsNeeded), version: acc.version || 1 };
      }
      if (acc.id === creditAccount) {
        return { ...acc, version: acc.version || 1 };
      }
      return acc;
    });
    await this.ledgerRepo.saveAccounts(updatedAccounts);

    // Snapshot inicial de balanço
    const snapSenderWallet = await this.walletRepo.findByPhone(senderPhone);
    const snapReceiverWallet = await this.walletRepo.findByPhone(receiverPhone);
    const initialSenderBal = snapSenderWallet?.balance || 0;
    const initialReceiverBal = snapReceiverWallet?.balance || 0;

    const ledgerAccountsBefore = await this.ledgerRepo.getAccounts();
    const initialLedgerTotal = ledgerAccountsBefore.reduce((acc, a) => acc + a.balance, 0);

    // Capturar a quantidade de colisões registadas nos logs/consoles antes do teste
    const originalConsoleWarn = console.warn;
    console.warn = (...args: any[]) => {
      const msg = args.join(" ");
      if (msg.includes("[OCC] Conflito de concorrência") || msg.includes("ConcurrencyConflictException")) {
        collisionsDetected++;
      }
      originalConsoleWarn.apply(console, args);
    };

    const startTime = new Date();
    const latencies: number[] = [];

    // 2. Disparar rajada de transações simultâneas de forma assíncrona
    const transactionPromises = Array.from({ length: concurrencyLevel }).map(async (_, idx) => {
      const txStart = Date.now();
      try {
        const result = await this.transactionManager.executeTransaction({
          senderPhone,
          receiverPhone,
          amount: Money.fromDecimal(amountPerTransaction),
          type: "envio",
          debitAccountName: debitAccount,
          creditAccountName: creditAccount,
          description: `Rajada de Stress Concorrente #${idx + 1}`,
        });
        const latency = Date.now() - txStart;
        latencies.push(latency);
        return { success: true, latency };
      } catch (err: any) {
        const latency = Date.now() - txStart;
        latencies.push(latency);
        errors.push(`Transação concorrente #${idx + 1} falhou após tentativas: ${err.message}`);
        return { success: false, latency, error: err.message };
      }
    });

    const results = await Promise.all(transactionPromises);
    const endTime = new Date();

    // Restaurar console.warn original
    console.warn = originalConsoleWarn;

    const durationMs = endTime.getTime() - startTime.getTime();
    const successfulTransactions = results.filter(r => r.success).length;
    const failedTransactions = results.filter(r => !r.success).length;

    // Obter estados finais pós-stress
    const finalSenderWallet = await this.walletRepo.findByPhone(senderPhone);
    const finalReceiverWallet = await this.walletRepo.findByPhone(receiverPhone);
    const finalSenderBal = finalSenderWallet?.balance || 0;
    const finalReceiverBal = finalReceiverWallet?.balance || 0;

    const ledgerAccountsAfter = await this.ledgerRepo.getAccounts();
    const finalLedgerTotalCents = ledgerAccountsAfter.reduce((acc, a) => acc + toKwanzaCents(a.balance), 0);
    const finalLedgerTotal = fromKwanzaCents(finalLedgerTotalCents);

    // Invariantes fiduciárias em cêntimos inteiros determinísticos
    // A soma total de balanços do ledger deve permanecer balanceada (double-entry invariant)
    const initialLedgerTotalCents = toKwanzaCents(initialLedgerTotal);
    const ledgerInvariantsPreserved = initialLedgerTotalCents === finalLedgerTotalCents;

    // Carteiras devem somar o mesmo dinheiro (transferido de forma limpa)
    const walletFundsMovedCents = successfulTransactions * toKwanzaCents(amountPerTransaction);
    const initialSenderBalCents = toKwanzaCents(initialSenderBal);
    const initialReceiverBalCents = toKwanzaCents(initialReceiverBal);
    const expectedSenderBalCents = initialSenderBalCents - walletFundsMovedCents;
    const expectedReceiverBalCents = initialReceiverBalCents + walletFundsMovedCents;
    const expectedSenderBal = fromKwanzaCents(expectedSenderBalCents);
    const expectedReceiverBal = fromKwanzaCents(expectedReceiverBalCents);

    const finalSenderBalCents = toKwanzaCents(finalSenderBal);
    const finalReceiverBalCents = toKwanzaCents(finalReceiverBal);
    const walletInvariantsPreserved = 
      finalSenderBalCents === expectedSenderBalCents && 
      finalReceiverBalCents === expectedReceiverBalCents;

    const transactionsPerSecond = Number(((successfulTransactions / (durationMs / 1000)) || 0).toFixed(2));
    const minLatencyMs = latencies.length > 0 ? Math.min(...latencies) : 0;
    const maxLatencyMs = latencies.length > 0 ? Math.max(...latencies) : 0;
    const averageLatencyMs = latencies.length > 0 
      ? Number((latencies.reduce((sum, val) => sum + val, 0) / latencies.length).toFixed(1)) 
      : 0;

    return {
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      durationMs,
      concurrencyLevel,
      amountPerTransaction,
      totalAttempted: concurrencyLevel,
      successfulTransactions,
      failedTransactions,
      concurrencyCollisionsDetected: collisionsDetected,
      transactionsPerSecond,
      averageLatencyMs,
      minLatencyMs,
      maxLatencyMs,
      initialSenderBalance: initialSenderBal,
      initialReceiverBalance: initialReceiverBal,
      finalSenderBalance: finalSenderBal,
      finalReceiverBalance: finalReceiverBal,
      initialLedgerTotal,
      finalLedgerTotal,
      ledgerInvariantsPreserved,
      walletInvariantsPreserved,
      errors,
    };
  }
}
