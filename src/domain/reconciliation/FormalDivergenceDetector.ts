/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LedgerRepository } from "../repository/LedgerRepository";
import { WalletRepository } from "../repository/WalletRepository";
import { SettlementRepository } from "../repository/SettlementRepository";
import { EventBus } from "../events/EventBus";
import { UserAccount, BnaCustodyState, Transaction } from "../../types";
import { 
  LedgerAccount, 
  LedgerJournalEntry, 
  toKwanzaCents, 
  fromKwanzaCents, 
  computeTrialBalance, 
  verifyLedgerChainIntegrity,
  TrialBalanceReport,
  LedgerIntegrityReport
} from "../../ledgerEngine";

/**
 * Severidade formal de divergência fiduciária
 */
export type DivergenceSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

/**
 * Taxonomia formal de códigos de divergência do ecossistema KMOS
 */
export enum FormalDivergenceCode {
  /** Desvio de saldo entre carteira operacional e conta do razão */
  OPERATIONAL_LEDGER_MISMATCH = "KMV-DIV-001-OP-LEDGER-MISMATCH",
  /** Violação da equação fundamental de partidas dobradas no balancete */
  TRIAL_BALANCE_UNBALANCED = "KMV-DIV-002-TRIAL-BALANCE-UNBALANCED",
  /** Déficit nas reservas de salvaguarda fiduciária face à circulação emitida */
  SOLVENCY_COLLATERAL_DEFICIT = "KMV-DIV-003-SOLVENCY-DEFICIT",
  /** Transação operacional sem correspondente lançamento atómico no diário do razão */
  ORPHAN_TRANSACTION_DETECTED = "KMV-DIV-004-ORPHAN-TRANSACTION",
  /** Corrupção ou quebra na cadeia criptográfica SHA-256 de blocos do razão */
  CRYPTOGRAPHIC_CHAIN_CORRUPTION = "KMV-DIV-005-CHAIN-CORRUPTED",
  /** Saldo negativo ilegal em conta ou carteira de utilizador/comerciante */
  NEGATIVE_BALANCE_VIOLATION = "KMV-DIV-006-NEGATIVE-BALANCE",
  /** Desvio agregado entre a soma de carteiras e os passivos totais no razão */
  AGGREGATE_LIABILITY_MISMATCH = "KMV-DIV-007-AGGREGATE-MISMATCH",
  /** Lançamento contábil isolado com soma de débitos e créditos diferente de zero */
  ATOMIC_POSTING_UNBALANCED = "KMV-DIV-008-UNBALANCED-POSTING"
}

/**
 * Estrutura formal de um item de inconsistência detectada
 */
export interface DivergenceItem {
  id: string;
  code: FormalDivergenceCode;
  severity: DivergenceSeverity;
  title: string;
  description: string;
  mathematicalProof: {
    expectedValue: number | string;
    actualValue: number | string;
    discrepancyDelta: number;
    unit: string;
  };
  affectedEntities: {
    entityType: "WALLET" | "LEDGER_ACCOUNT" | "JOURNAL_ENTRY" | "CUSTODY_RESERVE" | "TRANSACTION";
    entityId: string;
    entityName?: string;
  }[];
  detectedAt: string;
  isResolved: boolean;
  recommendedAction: string;
}

/**
 * Relatório formal de detecção de divergências
 */
export interface FormalDivergenceReport {
  reportId: string;
  timestamp: string;
  totalAuditedEntities: {
    walletsCount: number;
    ledgerAccountsCount: number;
    journalEntriesCount: number;
    transactionsCount: number;
  };
  invariantsAudit: {
    doubleEntryBalanced: boolean;
    operationalParityBalanced: boolean;
    solvencyReserveCompliant: boolean;
    hashChainImmutable: boolean;
    noNegativeBalances: boolean;
    transactionAtomicityGuaranteed: boolean;
  };
  systemStatus: "STRICTLY_ALIGNED" | "DIVERGENCES_DETECTED" | "CRITICAL_INVARIANT_BREACH";
  totalDivergencesCount: number;
  divergencesBySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  items: DivergenceItem[];
  trialBalance: TrialBalanceReport;
  chainIntegrity: LedgerIntegrityReport;
  durationMs: number;
}

/**
 * FormalDivergenceDetector (Domain Service)
 * 
 * Mecanismo de verificação formal e detecção de inconsistências matemáticas, contábeis,
 * fiduciárias e criptográficas entre o Razão Geral (Ledger) e os Saldos Operacionais.
 */
export class FormalDivergenceDetector {
  constructor(
    private readonly walletRepo: WalletRepository,
    private readonly ledgerRepo: LedgerRepository,
    private readonly settlementRepo: SettlementRepository,
    private readonly eventBus?: EventBus
  ) {}

  /**
   * Executa a auditoria completa de invariantes do sistema e detecta qualquer inconsistência formal.
   */
  public async detectAllDivergences(options?: { transactions?: Transaction[] }): Promise<FormalDivergenceReport> {
    const tStart = Date.now();
    const timestamp = new Date().toISOString();
    const reportId = `KMV-FDD-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const items: DivergenceItem[] = [];

    // 1. Obter dados dos repositórios
    const [wallets, ledgerAccounts, journalEntries, custodyState] = await Promise.all([
      this.walletRepo.getAll(),
      this.ledgerRepo.getAccounts(),
      this.ledgerRepo.getJournalEntries(),
      this.settlementRepo.getBnaCustodyState()
    ]);

    const transactions = options?.transactions || [];

    // =========================================================================
    // VETOR 1: INVARIANTE DAS PARTIDAS DOBRADAS (TRIAL BALANCE EQUILIBRIUM)
    // Regra: \sum Débitos == \sum Créditos em centavos inteiros exatos
    // =========================================================================
    const trialBalance = computeTrialBalance(ledgerAccounts);
    const debitCents = toKwanzaCents(trialBalance.totalDebits);
    const creditCents = toKwanzaCents(trialBalance.totalCredits);
    const tbDiffCents = Math.abs(debitCents - creditCents);

    const isDoubleEntryBalanced = trialBalance.isBalanced && tbDiffCents === 0;

    if (!isDoubleEntryBalanced) {
      items.push({
        id: `DIV-TB-${Date.now()}`,
        code: FormalDivergenceCode.TRIAL_BALANCE_UNBALANCED,
        severity: "CRITICAL",
        title: "Violação da Equação Fundamental de Partidas Dobradas",
        description: `O Razão Contábil encontra-se desbalanceado. Soma de Débitos (${trialBalance.totalDebits} Kz) diverge da Soma de Créditos (${trialBalance.totalCredits} Kz).`,
        mathematicalProof: {
          expectedValue: trialBalance.totalCredits,
          actualValue: trialBalance.totalDebits,
          discrepancyDelta: fromKwanzaCents(tbDiffCents),
          unit: "Kz"
        },
        affectedEntities: ledgerAccounts.map(a => ({
          entityType: "LEDGER_ACCOUNT",
          entityId: a.id,
          entityName: a.name
        })),
        detectedAt: timestamp,
        isResolved: false,
        recommendedAction: "Congelar liquidação externa e executar rollback ou injeção de contrapartida compensatória autorizada."
      });
    }

    // =========================================================================
    // VETOR 2: PARIDADE DE SALDOS INDIVIDUAIS (OPERATIONAL WALLET VS LEDGER ACCOUNT)
    // Regra: Saldo(Carteira_i) == Saldo(Conta_Ledger_USER_i)
    // =========================================================================
    let totalOperationalCents = 0;
    let totalLedgerUserLiabilityCents = 0;

    for (const w of wallets) {
      const opCents = toKwanzaCents(w.balance);
      totalOperationalCents += opCents;

      // Localiza a conta correspondente no razão (USER_<telefone> ou USER_<identificador>)
      const directId = `USER_${w.phone.replace(/[^0-9]/g, "")}`;
      const matchedAcc = ledgerAccounts.find(a => 
        a.id === directId ||
        a.id === `USER_${w.phone}` ||
        a.name.toLowerCase().includes(w.name.toLowerCase()) ||
        (a.id === "USER_ANTONIO" && w.phone === "+244923000111")
      );

      if (matchedAcc) {
        const ledgerCents = toKwanzaCents(matchedAcc.balance);
        const diffCents = opCents - ledgerCents;

        if (diffCents !== 0) {
          items.push({
            id: `DIV-OP-ACC-${w.phone}-${Date.now()}`,
            code: FormalDivergenceCode.OPERATIONAL_LEDGER_MISMATCH,
            severity: "HIGH",
            title: `Divergência de Saldo na Carteira ${w.name} (${w.phone})`,
            description: `O saldo operacional na carteira (${w.balance} Kz) diverge do passivo registrado no Ledger (${matchedAcc.balance} Kz) por ${fromKwanzaCents(diffCents)} Kz.`,
            mathematicalProof: {
              expectedValue: matchedAcc.balance,
              actualValue: w.balance,
              discrepancyDelta: fromKwanzaCents(Math.abs(diffCents)),
              unit: "Kz"
            },
            affectedEntities: [
              { entityType: "WALLET", entityId: w.phone, entityName: w.name },
              { entityType: "LEDGER_ACCOUNT", entityId: matchedAcc.id, entityName: matchedAcc.name }
            ],
            detectedAt: timestamp,
            isResolved: false,
            recommendedAction: "Executar conciliação forçada sincronizando o saldo da carteira operacional a partir dos lançamentos imutáveis do Ledger."
          });
        }
      }

      // Verificação de saldo negativo em carteira
      if (opCents < 0) {
        items.push({
          id: `DIV-NEG-W-${w.phone}-${Date.now()}`,
          code: FormalDivergenceCode.NEGATIVE_BALANCE_VIOLATION,
          severity: "CRITICAL",
          title: `Saldo Negativo Detectado na Carteira ${w.name}`,
          description: `A carteira operacional ${w.phone} apresenta saldo negativo de ${w.balance} Kz, violando a regra de provisão fiduciária.`,
          mathematicalProof: {
            expectedValue: ">= 0",
            actualValue: w.balance,
            discrepancyDelta: Math.abs(w.balance),
            unit: "Kz"
          },
          affectedEntities: [{ entityType: "WALLET", entityId: w.phone, entityName: w.name }],
          detectedAt: timestamp,
          isResolved: false,
          recommendedAction: "Bloquear transações de débito da carteira e auditar auditoria de outbox."
        });
      }
    }

    // Calcula total de passivos de utilizadores no Ledger
    for (const acc of ledgerAccounts) {
      if (acc.id.startsWith("USER_")) {
        totalLedgerUserLiabilityCents += toKwanzaCents(acc.balance);
      }
      if (toKwanzaCents(acc.balance) < 0 && acc.type !== "EQUITY" && acc.type !== "EXPENSE") {
        items.push({
          id: `DIV-NEG-ACC-${acc.id}-${Date.now()}`,
          code: FormalDivergenceCode.NEGATIVE_BALANCE_VIOLATION,
          severity: "HIGH",
          title: `Saldo Negativo em Conta do Razão [${acc.id}]`,
          description: `A conta ${acc.name} (${acc.id}) possui saldo negativo de ${acc.balance} Kz no razão contábil.`,
          mathematicalProof: {
            expectedValue: ">= 0",
            actualValue: acc.balance,
            discrepancyDelta: Math.abs(acc.balance),
            unit: "Kz"
          },
          affectedEntities: [{ entityType: "LEDGER_ACCOUNT", entityId: acc.id, entityName: acc.name }],
          detectedAt: timestamp,
          isResolved: false,
          recommendedAction: "Verificar autorizações e reverter débito a descoberto."
        });
      }
    }

    // =========================================================================
    // VETOR 3: PARIDADE AGREGADA DE PASSIVOS (AGGREGATE LIABILITIES VS WALLETS)
    // =========================================================================
    const aggDiffCents = Math.abs(totalOperationalCents - totalLedgerUserLiabilityCents);
    const isOperationalParityBalanced = aggDiffCents === 0;

    if (!isOperationalParityBalanced && items.every(i => i.code !== FormalDivergenceCode.OPERATIONAL_LEDGER_MISMATCH)) {
      items.push({
        id: `DIV-AGG-${Date.now()}`,
        code: FormalDivergenceCode.AGGREGATE_LIABILITY_MISMATCH,
        severity: "HIGH",
        title: "Desalinhamento Agregado de Passivos e Carteiras",
        description: `A soma de todas as carteiras operacionais (${fromKwanzaCents(totalOperationalCents)} Kz) não coincide com o total de passivos USER_* no Ledger (${fromKwanzaCents(totalLedgerUserLiabilityCents)} Kz).`,
        mathematicalProof: {
          expectedValue: fromKwanzaCents(totalLedgerUserLiabilityCents),
          actualValue: fromKwanzaCents(totalOperationalCents),
          discrepancyDelta: fromKwanzaCents(aggDiffCents),
          unit: "Kz"
        },
        affectedEntities: [],
        detectedAt: timestamp,
        isResolved: false,
        recommendedAction: "Auditar contas de clientes não mapeadas ou registros pendentes de liquidação."
      });
    }

    // =========================================================================
    // VETOR 4: SALVAGUARDA E SOLVÊNCIA FIDUCIÁRIA (BNA DIRECTIVE 06/2021)
    // Regra: Reservas_Custodia (BNA + BFA + BAI + BIC) >= Circulação_Emitida
    // =========================================================================
    const custodyReservesCents = 
      toKwanzaCents(custodyState.bnaCustodyBalance || 0) +
      toKwanzaCents(custodyState.bfaReserveBalance || 0) +
      toKwanzaCents(custodyState.baiReserveBalance || 0) +
      toKwanzaCents(custodyState.bicReserveBalance || 0);

    const circulationDeclaredCents = toKwanzaCents(custodyState.totalCirculation || fromKwanzaCents(totalOperationalCents));
    const solvencyDeltaCents = custodyReservesCents - circulationDeclaredCents;
    const isSolvencyReserveCompliant = solvencyDeltaCents >= 0;

    if (!isSolvencyReserveCompliant) {
      items.push({
        id: `DIV-SOLV-${Date.now()}`,
        code: FormalDivergenceCode.SOLVENCY_COLLATERAL_DEFICIT,
        severity: "CRITICAL",
        title: "Déficit Crítico de Salvaguarda Fiduciária BNA",
        description: `As reservas colateralizadas em custódia (${fromKwanzaCents(custodyReservesCents)} Kz) são insuficientes para lastrear a moeda em circulação (${fromKwanzaCents(circulationDeclaredCents)} Kz). Déficit: ${fromKwanzaCents(Math.abs(solvencyDeltaCents))} Kz.`,
        mathematicalProof: {
          expectedValue: fromKwanzaCents(circulationDeclaredCents),
          actualValue: fromKwanzaCents(custodyReservesCents),
          discrepancyDelta: fromKwanzaCents(Math.abs(solvencyDeltaCents)),
          unit: "Kz"
        },
        affectedEntities: [{ entityType: "CUSTODY_RESERVE", entityId: "BNA_ESCROW_RESERVE", entityName: "Reserva de Custódia BNA" }],
        detectedAt: timestamp,
        isResolved: false,
        recommendedAction: "Notificar mesa de liquidação SPTR e solicitar injeção imediata de liquidez de custódia."
      });
    }

    // =========================================================================
    // VETOR 5: INTEGRIDADE CRIPTOGRÁFICA DA CADEIA DO RAZÃO (HASH CHAIN)
    // Regra: Hash_n == SHA-256(Hash_{n-1} || Lançamento_n)
    // =========================================================================
    const chainIntegrity = verifyLedgerChainIntegrity(journalEntries);
    const isHashChainImmutable = chainIntegrity.isValid;

    if (!isHashChainImmutable) {
      items.push({
        id: `DIV-CHAIN-${Date.now()}`,
        code: FormalDivergenceCode.CRYPTOGRAPHIC_CHAIN_CORRUPTION,
        severity: "CRITICAL",
        title: "Corrupção Criptográfica na Cadeia de Blocos do Diário",
        description: `A cadeia de integridade SHA-256 do Razão foi violada. Detalhe: ${chainIntegrity.errorMessage || "Hash inconsistente"}.`,
        mathematicalProof: {
          expectedValue: "Válida (SHA-256 Chain)",
          actualValue: "Corrompida",
          discrepancyDelta: 1,
          unit: "Blocos"
        },
        affectedEntities: journalEntries.map(e => ({ entityType: "JOURNAL_ENTRY", entityId: e.id })),
        detectedAt: timestamp,
        isResolved: false,
        recommendedAction: "Iniciar auditoria forense no Evidence Vault e restaurar estado a partir de recibos assinados pelo HSM."
      });
    }

    // =========================================================================
    // VETOR 6: EQUILÍBRIO ATÓMICO DE CADA LANÇAMENTO DO DIÁRIO
    // Regra: \sum(Lançamentos de Linhas do Diário) == 0 Kz
    // =========================================================================
    let isTransactionAtomicityGuaranteed = true;
    for (const entry of journalEntries) {
      if (entry.postings && entry.postings.length > 0) {
        let entryDebits = 0;
        let entryCredits = 0;
        for (const posting of entry.postings) {
          if (posting.type === "DEBIT") entryDebits += toKwanzaCents(posting.amount);
          if (posting.type === "CREDIT") entryCredits += toKwanzaCents(posting.amount);
        }
        if (entryDebits !== entryCredits) {
          isTransactionAtomicityGuaranteed = false;
          items.push({
            id: `DIV-ENTRY-${entry.id}-${Date.now()}`,
            code: FormalDivergenceCode.ATOMIC_POSTING_UNBALANCED,
            severity: "CRITICAL",
            title: `Lançamento Desbalanceado no Diário [${entry.id}]`,
            description: `O lançamento contábil ${entry.id} não equilibra débitos (${fromKwanzaCents(entryDebits)} Kz) e créditos (${fromKwanzaCents(entryCredits)} Kz).`,
            mathematicalProof: {
              expectedValue: fromKwanzaCents(entryCredits),
              actualValue: fromKwanzaCents(entryDebits),
              discrepancyDelta: fromKwanzaCents(Math.abs(entryDebits - entryCredits)),
              unit: "Kz"
            },
            affectedEntities: [{ entityType: "JOURNAL_ENTRY", entityId: entry.id }],
            detectedAt: timestamp,
            isResolved: false,
            recommendedAction: "Anular lançamento via estorno compensatório e registrar no log de exceção contábil."
          });
        }
      }
    }

    // =========================================================================
    // CONSOLIDAÇÃO DO RELATÓRIO
    // =========================================================================
    const criticalCount = items.filter(i => i.severity === "CRITICAL").length;
    const highCount = items.filter(i => i.severity === "HIGH").length;
    const mediumCount = items.filter(i => i.severity === "MEDIUM").length;
    const lowCount = items.filter(i => i.severity === "LOW").length;

    let systemStatus: "STRICTLY_ALIGNED" | "DIVERGENCES_DETECTED" | "CRITICAL_INVARIANT_BREACH" = "STRICTLY_ALIGNED";
    if (criticalCount > 0) {
      systemStatus = "CRITICAL_INVARIANT_BREACH";
    } else if (items.length > 0) {
      systemStatus = "DIVERGENCES_DETECTED";
    }

    const report: FormalDivergenceReport = {
      reportId,
      timestamp,
      totalAuditedEntities: {
        walletsCount: wallets.length,
        ledgerAccountsCount: ledgerAccounts.length,
        journalEntriesCount: journalEntries.length,
        transactionsCount: transactions.length
      },
      invariantsAudit: {
        doubleEntryBalanced: isDoubleEntryBalanced,
        operationalParityBalanced: isOperationalParityBalanced,
        solvencyReserveCompliant: isSolvencyReserveCompliant,
        hashChainImmutable: isHashChainImmutable,
        noNegativeBalances: items.every(i => i.code !== FormalDivergenceCode.NEGATIVE_BALANCE_VIOLATION),
        transactionAtomicityGuaranteed: isTransactionAtomicityGuaranteed
      },
      systemStatus,
      totalDivergencesCount: items.length,
      divergencesBySeverity: {
        critical: criticalCount,
        high: highCount,
        medium: mediumCount,
        low: lowCount
      },
      items,
      trialBalance,
      chainIntegrity,
      durationMs: Date.now() - tStart
    };

    // Publica evento caso divergências críticas sejam identificadas
    if (this.eventBus && items.length > 0) {
      this.eventBus.publish("DivergenceDetected", {
        reportId,
        timestamp,
        totalDivergences: items.length,
        criticalCount,
        items
      });
    }

    return report;
  }

  /**
   * Realiza auditoria cirúrgica sobre uma conta contábil e a carteira associada.
   */
  public async auditSingleAccount(accountId: string): Promise<{
    isConsistent: boolean;
    operationalBalance: number;
    ledgerBalance: number;
    discrepancy: number;
    divergences: DivergenceItem[];
  }> {
    const [wallets, ledgerAccounts] = await Promise.all([
      this.walletRepo.getAll(),
      this.ledgerRepo.getAccounts()
    ]);

    const acc = ledgerAccounts.find(a => a.id === accountId);
    const cleanPhone = accountId.replace("USER_", "");
    const wallet = wallets.find(w => w.phone.replace(/[^0-9]/g, "") === cleanPhone || `USER_${w.phone.replace(/[^0-9]/g, "")}` === accountId);

    const ledgerBalance = acc ? acc.balance : 0;
    const operationalBalance = wallet ? wallet.balance : 0;
    const diffCents = toKwanzaCents(operationalBalance) - toKwanzaCents(ledgerBalance);
    const discrepancy = fromKwanzaCents(Math.abs(diffCents));

    const divergences: DivergenceItem[] = [];
    if (diffCents !== 0) {
      divergences.push({
        id: `DIV-SINGLE-${accountId}-${Date.now()}`,
        code: FormalDivergenceCode.OPERATIONAL_LEDGER_MISMATCH,
        severity: "HIGH",
        title: `Divergência Específica na Conta ${accountId}`,
        description: `Saldo operacional (${operationalBalance} Kz) diverge do razão (${ledgerBalance} Kz).`,
        mathematicalProof: {
          expectedValue: ledgerBalance,
          actualValue: operationalBalance,
          discrepancyDelta: discrepancy,
          unit: "Kz"
        },
        affectedEntities: [
          { entityType: "LEDGER_ACCOUNT", entityId: accountId },
          ...(wallet ? [{ entityType: "WALLET" as const, entityId: wallet.phone, entityName: wallet.name }] : [])
        ],
        detectedAt: new Date().toISOString(),
        isResolved: false,
        recommendedAction: "Reconciliar saldo operacional com base nos lançamentos imutáveis do Ledger."
      });
    }

    return {
      isConsistent: diffCents === 0,
      operationalBalance,
      ledgerBalance,
      discrepancy,
      divergences
    };
  }
}
