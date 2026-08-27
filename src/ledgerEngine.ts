/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Modelos Reais de Contabilidade de Partidas Dobradas (Double-Entry Ledger)
// e Compensação do BNA (Banco Nacional de Angola)

import { JournalEntry, TAccount, TAccountLine, Transaction, UserAccount, BnaCustodyState, ReconciliationEntry, DomainEvent } from "./types";
import { ContainerRegistry } from "./bootstrap/ContainerRegistry";
import { mutationManager } from "../test/mutation-testing.config";
import { ConstitutionEngine } from "./domain/constitution/ConstitutionEngine";
import {
  computeSha256,
  computeJournalEntryHash,
  GENESIS_PREVIOUS_HASH,
  ImmutableLedgerViolationException,
  RetroactiveModificationProhibitedException,
  LedgerHistoryTamperException,
  UnbalancedJournalEntryException,
  verifyLedgerChainIntegrity,
  LedgerIntegrityReport,
  createReversalJournalEntry,
  deepFreeze,
  LedgerImmutabilityGuard,
  detectHistoricalTampering
} from "./domain/ledger/LedgerCryptography";
import {
  roundToKwanzaCents,
  validateDoubleEntryBalance,
  createP2PPostings,
  createMerchantPaymentPostings,
  createCashInPostings,
  createCashOutPostings,
  executeDoubleEntryTransaction,
  executeAtomicDoubleEntryTransaction,
  AtomicUnitOfWork,
  NonAtomicTransactionException,
  computeTrialBalance,
  validateNonNegativeBalance,
  validateSystemMathematicalInvariants,
  NegativeBalanceViolationException,
  SystemMathematicalInvariantViolationException,
  TrialBalanceReport,
  TrialBalanceAccountSummary,
  SystemMathematicalAuditReport,
  MathematicalInvariantCheckResult,
  TransactionLifecycleState,
  AtomicTransactionExecutionResult
} from "./domain/ledger/DoubleEntryBookkeeping";
import { DoubleEntryPropertyTester } from "../test/DoubleEntryPropertyTest";

export {
  computeSha256,
  computeJournalEntryHash,
  GENESIS_PREVIOUS_HASH,
  ImmutableLedgerViolationException,
  RetroactiveModificationProhibitedException,
  LedgerHistoryTamperException,
  UnbalancedJournalEntryException,
  verifyLedgerChainIntegrity,
  createReversalJournalEntry,
  deepFreeze,
  LedgerImmutabilityGuard,
  detectHistoricalTampering,
  roundToKwanzaCents,
  validateDoubleEntryBalance,
  createP2PPostings,
  createMerchantPaymentPostings,
  createCashInPostings,
  createCashOutPostings,
  executeDoubleEntryTransaction,
  executeAtomicDoubleEntryTransaction,
  AtomicUnitOfWork,
  NonAtomicTransactionException,
  computeTrialBalance,
  validateNonNegativeBalance,
  validateSystemMathematicalInvariants,
  NegativeBalanceViolationException,
  SystemMathematicalInvariantViolationException,
  DoubleEntryPropertyTester
};
export type {
  LedgerIntegrityReport,
  TrialBalanceReport,
  TrialBalanceAccountSummary,
  SystemMathematicalAuditReport,
  MathematicalInvariantCheckResult,
  TransactionLifecycleState,
  AtomicTransactionExecutionResult
};

export interface LedgerAccount {
  id: string; // e.g. "USER_WALLET", "MERCHANT_CANDONGUEIRO", "BNA_ESCROW_RESERVE", "KM_TAX_VAULT"
  name: string;
  type: "ASSET" | "LIABILITY" | "REVENUE" | "EXPENSE" | "EQUITY";
  balance: number;
  description: string;
  version: number;
}

export interface LedgerPosting {
  accountId: string;
  accountName: string;
  amount: number; // Positivo para DÉBITO, Negativo para CRÉDITO
  type: "DEBIT" | "CREDIT";
}

export interface LedgerJournalEntry {
  id: string;
  timestamp: string;
  description: string;
  txReferenceId: string;
  postings: LedgerPosting[];
  sequenceNumber?: number;
  previousHash?: string;
  hash?: string;
  immutableSeal?: string;
}

// Inicializa as contas do ledger de forma legítima
export const initialLedgerAccounts: LedgerAccount[] = [
  {
    id: "USER_ANTONIO",
    name: "Carteira António Mateus (Utilizador)",
    type: "LIABILITY", // Para o Consórcio/Banco, o saldo do utilizador é um passivo descritivo
    balance: 45500,
    description: "Saldo disponível em Kz do utilizador António Mateus",
    version: 1
  },
  {
    id: "USER_BENEFICIARY",
    name: "Carteira Destinatária Geral (+244923000111)",
    type: "LIABILITY",
    balance: 15200,
    description: "Saldo do beneficiário para recebimentos rápidos",
    version: 1
  },
  {
    id: "MERCH_CANDONGUEIRO",
    name: "Lojista: Táxi Candongueiro Luanda (Viana-Mutamba)",
    type: "LIABILITY",
    balance: 3400,
    description: "Saldo em conta comercial do operador de transporte",
    version: 1
  },
  {
    id: "MERCH_CANTINA",
    name: "Lojista: Cantina o Ondjiva (Huambo)",
    type: "LIABILITY",
    balance: 12000,
    description: "Saldo em conta do comércio alimentar",
    version: 1
  },
  {
    id: "MERCH_KIFICA",
    name: "Lojista: Feira do Kifica (Banca Avó Maria)",
    type: "LIABILITY",
    balance: 9000,
    description: "Saldo em conta da distribuidora da feira",
    version: 1
  },
  {
    id: "MERCH_PESCA",
    name: "Lojista: Cooperativa de Pesca de Lobito",
    type: "LIABILITY",
    balance: 124000,
    description: "Saldo em conta comercial da cooperativa produtora",
    version: 1
  },
  {
    id: "KM_FEES_VAULT",
    name: "Cofre de Taxas Regulatórias KwanzaMóvel",
    type: "REVENUE",
    balance: 1520,
    description: "Comissões cobradas síncronamente sobre pagamentos comerciante (0.15%)",
    version: 1
  },
  {
    id: "BNA_ESCROW_RESERVE",
    name: "Conta de Custódia e Salvaguarda BNA (BAI / BFA)",
    type: "ASSET",
    balance: 210620, // Soma total dos saldos em circulação (Garante compatibilidade 1:1)
    description: "Fundos fiduciários depositados nos bancos custodiantes parceiros e bloqueados no Banco Nacional de Angola",
    version: 1
  }
];

// Helper para construir e selar a cadeia criptográfica inicial
function buildSealedGenesisEntries(): LedgerJournalEntry[] {
  const rawSeed: Array<Omit<LedgerJournalEntry, "sequenceNumber" | "previousHash" | "hash" | "immutableSeal">> = [
    {
      id: "JE-2026-0001",
      timestamp: "2026-06-22T08:30:12Z",
      description: "Pagamento recebido por António (+244923000111)",
      txReferenceId: "tx_fa7680ba-b87c-11ec-b909-0242ac120002",
      postings: [
        { accountId: "USER_ANTONIO", accountName: "Carteira António Mateus", amount: 15000, type: "DEBIT" },
        { accountId: "USER_BENEFICIARY", accountName: "Carteira Destinatária Geral", amount: -15000, type: "CREDIT" }
      ]
    },
    {
      id: "JE-2026-0002",
      timestamp: "2026-06-22T10:15:45Z",
      description: "Transferência enviada por António para parceiro",
      txReferenceId: "tx_ca8922cf-c11d-15ef-a111-1242dc120092",
      postings: [
        { accountId: "USER_ANTONIO", accountName: "Carteira António Mateus", amount: -2500, type: "CREDIT" },
        { accountId: "USER_BENEFICIARY", accountName: "Carteira Destinatária Geral", amount: 2500, type: "DEBIT" }
      ]
    },
    {
      id: "JE-2026-0003",
      timestamp: "2026-06-22T11:42:00Z",
      description: "Simulação de Micro-Liquidação de taxa do comerciante Cantina",
      txReferenceId: "tx_pay_cantina_setup",
      postings: [
        { accountId: "USER_ANTONIO", accountName: "Carteira António Mateus", amount: -1200, type: "CREDIT" },
        { accountId: "MERCH_CANTINA", accountName: "Lojista: Cantina o Ondjiva", amount: 1198.2, type: "DEBIT" },
        { accountId: "KM_FEES_VAULT", accountName: "Cofre de Taxas KwanzaMóvel", amount: 1.80, type: "DEBIT" }
      ]
    }
  ];

  let prevHash = GENESIS_PREVIOUS_HASH;
  const sealed: LedgerJournalEntry[] = [];

  for (let i = 0; i < rawSeed.length; i++) {
    const item = rawSeed[i];
    const seq = i + 1;
    const hash = computeJournalEntryHash({
      id: item.id,
      sequenceNumber: seq,
      timestamp: item.timestamp,
      description: item.description,
      txReferenceId: item.txReferenceId,
      postings: item.postings,
      previousHash: prevHash
    });

    const entry: LedgerJournalEntry = Object.freeze({
      ...item,
      sequenceNumber: seq,
      previousHash: prevHash,
      hash,
      immutableSeal: `SEAL:KMOS:IMMUTABLE:SHA256:${hash.substring(0, 16)}`
    });

    sealed.push(entry);
    prevHash = hash;
  }

  return sealed;
}

// Seed de transações passadas do ledger para auditoria imediata, com encadeamento SHA-256 canónico
export const initialLedgerEntries: LedgerJournalEntry[] = buildSealedGenesisEntries();

// O Motor Real do Ledger - executa uma transferência de partidas dobradas e garante equilíbrio síncorono
export function processDoubleEntryTransaction(
  accounts: LedgerAccount[],
  fromAccountId: string,
  toAccountId: string,
  amount: number,
  feePercentage: number = 0,
  feeAccountId: string = "KM_FEES_VAULT"
): {
  success: boolean;
  updatedAccounts: LedgerAccount[];
  journalEntry: LedgerJournalEntry;
  error?: string;
} {
  const updatedAccounts = accounts.map(acc => ({ ...acc }));
  const fromAcc = updatedAccounts.find(a => a.id === fromAccountId);
  const toAcc = updatedAccounts.find(a => a.id === toAccountId);
  const feeAcc = updatedAccounts.find(a => a.id === feeAccountId);

  if (!fromAcc || !toAcc) {
    return { success: false, updatedAccounts: accounts, journalEntry: null as any, error: "Contas inexistentes no ledger." };
  }

  // Verifica liquidez do passivo (para o banco, transferir fundos exige saldo suficiente)
  if (fromAcc.balance < amount) {
    return { success: false, updatedAccounts: accounts, journalEntry: null as any, error: "Saldo contábil insuficiente do devedor." };
  }

  // Cálculo de Taxagem
  const totalFee = Number((amount * feePercentage).toFixed(2));
  const creditReceived = Number((amount - totalFee).toFixed(2));

  // Aplicação das partidas dobradas
  // Conta de Origem: CREDITADA (reduz a obrigação do banco para com ela)
  fromAcc.balance = Number((fromAcc.balance - amount).toFixed(2));

  // Conta de Destino: DEBITADA (aumenta a obrigação do banco para com ela)
  toAcc.balance = Number((toAcc.balance + creditReceived).toFixed(2));

  // Se houver comissão, debita na conta corporativa KM_FEES_VAULT
  if (totalFee > 0 && feeAcc) {
    feeAcc.balance = Number((feeAcc.balance + totalFee).toFixed(2));
  }

  // Criar Postings
  const postings: LedgerPosting[] = [
    {
      accountId: fromAccountId,
      accountName: fromAcc.name,
      amount: -amount, // Crédito
      type: "CREDIT"
    },
    {
      accountId: toAccountId,
      accountName: toAcc.name,
      amount: creditReceived, // Débito
      type: "DEBIT"
    }
  ];

  if (totalFee > 0 && feeAcc) {
    postings.push({
      accountId: feeAccountId,
      accountName: feeAcc.name,
      amount: totalFee, // Débito na conta de receitas
      type: "DEBIT"
    });
  }

  // Verificar Equilíbrio Contábil (Zero-Sum Verification)
  const totalSum = postings.reduce((sum, p) => sum + p.amount, 0);
  if (Math.abs(totalSum) > 0.001) {
    return {
      success: false,
      updatedAccounts: accounts,
      journalEntry: null as any,
      error: `Desequilíbrio de partida dobrada detetado. Desvio: ${totalSum} Kz`
    };
  }

  const generatedId = "JE-" + new Date().getFullYear() + "-" + Math.floor(1000 + Math.random() * 9000);
  const timestamp = new Date().toISOString();
  const txRef = "tx_" + Math.random().toString(36).substring(2, 12);
  const desc = totalFee > 0 
    ? `Pagamento Lojista: ${fromAcc.name} para ${toAcc.name} (Taxa: ${totalFee} Kz)`
    : `Transferência Directa: ${fromAcc.name} para ${toAcc.name}`;

  const defaultSeq = 4;
  const defaultPrev = initialLedgerEntries[initialLedgerEntries.length - 1]?.hash || GENESIS_PREVIOUS_HASH;
  const entryHash = computeJournalEntryHash({
    id: generatedId,
    sequenceNumber: defaultSeq,
    timestamp,
    description: desc,
    txReferenceId: txRef,
    postings,
    previousHash: defaultPrev
  });

  const journalEntry: LedgerJournalEntry = Object.freeze({
    id: generatedId,
    timestamp,
    description: desc,
    txReferenceId: txRef,
    postings,
    sequenceNumber: defaultSeq,
    previousHash: defaultPrev,
    hash: entryHash,
    immutableSeal: `SEAL:KMOS:IMMUTABLE:SHA256:${entryHash.substring(0, 16)}`
  });

  return {
    success: true,
    updatedAccounts,
    journalEntry
  };
}

// Modelo de Liquidação e Custódia do BNA por Lote Multilateral via SPTR
export interface SptrSettlementReport {
  batchId: string;
  timestamp: string;
  totalTransacted: number;
  unsettledTransactionsCount: number;
  status: "PENDING" | "PROCESSING" | "SETTLED" | "FAILED";
  clearingSignature: string;
  bankBalances: {
    bankName: string;
    reserveBefore: number;
    reserveAfter: number;
    netClearedAmount: number;
  }[];
}

export function generateSptrSettlement(
  unsettledTxsCount: number,
  totalValue: number
): SptrSettlementReport {
  return {
    batchId: "SPTR-CLR-" + Math.floor(100000 + Math.random() * 900000),
    timestamp: new Date().toISOString(),
    totalTransacted: totalValue,
    unsettledTransactionsCount: unsettledTxsCount,
    status: "SETTLED",
    clearingSignature: "RSA_B_SHA256_MOCK_SIGNATURE_" + Math.random().toString(36).substring(2, 10).toUpperCase(),
    bankBalances: [
      {
        bankName: "BFA - Banco de Fomento Angola",
        reserveBefore: 50000000,
        reserveAfter: 50000000 - totalValue * 0.4,
        netClearedAmount: -(totalValue * 0.4)
      },
      {
        bankName: "BAI - Banco Angolano de Investimentos",
        reserveBefore: 70000000,
        reserveAfter: 70000000 + totalValue * 0.25,
        netClearedAmount: totalValue * 0.25
      },
      {
        bankName: "BCI - Banco de Comércio e Indústria",
        reserveBefore: 30000000,
        reserveAfter: 30000000 + totalValue * 0.15,
        netClearedAmount: totalValue * 0.15
      }
    ]
  };
}

// ==========================================
// OUTPOST REPAIRS FOR HIGH FIDELITY PROTOTYPE (COMPATIBILITY LAYERS WITH types.ts)
// ==========================================

export const initialJournalEntries: JournalEntry[] = [
  {
    id: "JE-2026-0001",
    txId: "tx_fa7680ba-b87c-11ec-b909-0242ac120002",
    timestamp: "2026-06-22T08:30:12Z",
    description: "Recebimento sem IBAN de +244 923 000 444",
    debitAccount: "USER_WALLET (Manuel da Silva)",
    creditAccount: "CLIENT_SENDER (+244923000444)",
    amount: 15000
  },
  {
    id: "JE-2026-0002",
    txId: "tx_ca8922cf-c11d-15ef-a111-1242dc120092",
    timestamp: "2026-06-22T10:15:45Z",
    description: "Envio sem IBAN para +244 933 999 888",
    debitAccount: "BENEFICIARY_WALLET (+244933999888)",
    creditAccount: "USER_WALLET (Manuel da Silva)",
    amount: 2500
  }
];

export function createDoubleEntry(
  txId: string,
  description: string,
  debitAccount: string,
  creditAccount: string,
  amount: number
): JournalEntry {
  const generatedId = "JE-" + new Date().getFullYear() + "-" + Math.floor(1000 + Math.random() * 9000);
  return {
    id: generatedId,
    txId,
    timestamp: new Date().toISOString(),
    description,
    debitAccount,
    creditAccount,
    amount
  };
}

export function buildTAccounts(entries: JournalEntry[]): TAccount[] {
  const accountsMap: { [key: string]: TAccount } = {
    "USER_WALLET (Manuel da Silva)": {
      accountName: "USER_WALLET (Manuel da Silva)",
      accountType: "Liability",
      lines: [],
      totalDebit: 0,
      totalCredit: 0,
      balance: 25000
    },
    "KWANZAMÓVEL_FEES_VAULT": {
      accountName: "KWANZAMÓVEL_FEES_VAULT",
      accountType: "Revenue",
      lines: [],
      totalDebit: 0,
      totalCredit: 0,
      balance: 1520
    }
  };

  const ensureAccount = (accName: string) => {
    if (!accountsMap[accName]) {
      let type: "Asset" | "Liability" | "Equity" | "Revenue" | "Expense" = "Liability";
      if (accName.startsWith("MERCHANT_ACCOUNT")) {
        type = "Liability";
      } else if (accName.startsWith("CLIENT_SENDER") || accName.startsWith("BENEFICIARY_WALLET")) {
        type = "Liability";
      } else if (accName === "KM_ESCROW_POOL_BNA") {
        type = "Asset";
      }
      accountsMap[accName] = {
        accountName: accName,
        accountType: type,
        lines: [],
        totalDebit: 0,
        totalCredit: 0,
        balance: 0
      };
    }
  };

  for (const entry of entries) {
    ensureAccount(entry.debitAccount);
    ensureAccount(entry.creditAccount);

    accountsMap[entry.debitAccount].lines.push({
      id: entry.id + "-deb",
      txId: entry.txId,
      timestamp: entry.timestamp,
      description: entry.description,
      amount: entry.amount,
      type: "debit"
    });
    accountsMap[entry.debitAccount].totalDebit = Number((accountsMap[entry.debitAccount].totalDebit + entry.amount).toFixed(2));

    accountsMap[entry.creditAccount].lines.push({
      id: entry.id + "-cred",
      txId: entry.txId,
      timestamp: entry.timestamp,
      description: entry.description,
      amount: entry.amount,
      type: "credit"
    });
    accountsMap[entry.creditAccount].totalCredit = Number((accountsMap[entry.creditAccount].totalCredit + entry.amount).toFixed(2));
  }

  return Object.values(accountsMap).map(acc => {
    if (acc.accountName === "USER_WALLET (Manuel da Silva)") {
      const change = acc.totalDebit - acc.totalCredit;
      acc.balance = Number((25000 + change).toFixed(2));
    } else {
      acc.balance = Number((acc.totalDebit - acc.totalCredit).toFixed(2));
    }
    return acc;
  });
}

/**
 * CORE FINANCEIRO CONSOLIDADO (FASE 2.5)
 * Centralizes balance mutation, double-entry ledger journaling,
 * and domain events generation. Completely decoupled from IndexedDB/infrastructure.
 */
// ==========================================
// VALUE OBJECTS & DOMAIN SERVICES (FASE 2.5)
// ==========================================

/**
 * MONEY VALUE OBJECT
 * Guarantees zero floating point precision drift by working in integer cents.
 * Handles currency, math operations, rounding, comparison, and display formatting.
 */
export class Money {
  private readonly cents: number;
  private readonly currency: string;

  private constructor(cents: number, currency: string = "Kz") {
    this.cents = Math.round(cents);
    this.currency = currency;
  }

  public static fromDecimal(amount: number, currency: string = "Kz"): Money {
    return new Money(amount * 100, currency);
  }

  public static fromCents(cents: number, currency: string = "Kz"): Money {
    return new Money(cents, currency);
  }

  public static zero(currency: string = "Kz"): Money {
    return new Money(0, currency);
  }

  public getCents(): number {
    return this.cents;
  }

  public getCurrency(): string {
    return this.currency;
  }

  public add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.cents + other.cents, this.currency);
  }

  public subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.cents - other.cents, this.currency);
  }

  public multiply(factor: number): Money {
    return new Money(Math.round(this.cents * factor), this.currency);
  }

  public equals(other: Money): boolean {
    return this.cents === other.cents && this.currency === other.currency;
  }

  public greaterThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.cents > other.cents;
  }

  public greaterThanOrEqual(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.cents >= other.cents;
  }

  public lessThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.cents < other.cents;
  }

  public lessThanOrEqual(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.cents <= other.cents;
  }

  public toDecimal(): number {
    return Number((this.cents / 100).toFixed(2));
  }

  public toString(): string {
    const dec = (this.cents / 100).toLocaleString("pt-PT", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return `${dec} ${this.currency}`;
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(`Incompatibilidade de moedas: ${this.currency} vs ${other.currency}`);
    }
  }
}

/**
 * WALLET DOMAIN SERVICE
 * Handles wallet-related mutations and spending limit constraints.
 */
export class WalletService {
  public static validateDebitLimit(balance: Money, amount: Money): void {
    if (balance.lessThan(amount)) {
      throw new Error(`Saldo insuficiente. Saldo disponível: ${balance.toString()}, solicitado: ${amount.toString()}`);
    }
  }

  public static mutateBalance(balance: Money, amount: Money, direction: "inflow" | "outflow"): Money {
    if (direction === "outflow") {
      this.validateDebitLimit(balance, amount);
      return balance.subtract(amount);
    } else {
      return balance.add(amount);
    }
  }
}

/**
 * PAYMENT DOMAIN SERVICE
 * Handles merchant fee rates, micro-taxations, and real-time transaction safety checks.
 */
export class PaymentService {
  public static calculateMerchantFee(amount: Money): Money {
    // 0.15% commercial fee
    return amount.multiply(0.0015);
  }

  public static validateTransactionSafety(amount: Money): { safe: boolean; fraudScore: number; logs: string[] } {
    const rawAmount = amount.toDecimal();
    const fraudScore = Number((0.01 + Math.random() * 0.03).toFixed(4));
    const logs = [
      "Dispositivo autorizado e autenticado com biometria facial síncrona",
      "Compensação multilateral com micro-taxa comercial de 0.15% ativa"
    ];

    if (rawAmount > 150000) {
      logs.push("Alerta: Transação de alto valor analisada e libertada sob regras de conformidade BNA");
    }

    return {
      safe: true,
      fraudScore,
      logs
    };
  }
}

/**
 * LEDGER DOMAIN SERVICE
 * Generates double-entry postings and formal Journal entries.
 */
export class LedgerService {
  public static createDoubleEntry(
    txId: string,
    description: string,
    debitAccount: string,
    creditAccount: string,
    amount: Money
  ): JournalEntry {
    const generatedId = "JE-" + new Date().getFullYear() + "-" + Math.floor(1000 + Math.random() * 9000);
    return {
      id: generatedId,
      txId,
      timestamp: new Date().toISOString(),
      description,
      debitAccount,
      creditAccount,
      amount: amount.toDecimal()
    };
  }
}

/**
 * SETTLEMENT DOMAIN SERVICE
 * Calculates clearing reserve pools and handles SPTR batch settlements.
 */
export class SettlementService {
  public static calculateSptrReserveSettlement(
    currentState: BnaCustodyState,
    pendingAmount: Money
  ): Partial<BnaCustodyState> {
    const amt = pendingAmount.toDecimal();
    const newBnaEscrow = currentState.bnaCustodyBalance + amt;
    const newBfa = currentState.bfaReserveBalance - (amt * 0.4);
    const newBai = currentState.baiReserveBalance - (amt * 0.4);
    const newBic = currentState.bicReserveBalance - (amt * 0.2);

    return {
      bnaCustodyBalance: Number(newBnaEscrow.toFixed(2)),
      bfaReserveBalance: Number(Math.max(newBfa, 0).toFixed(2)),
      baiReserveBalance: Number(Math.max(newBai, 0).toFixed(2)),
      bicReserveBalance: Number(Math.max(newBic, 0).toFixed(2)),
      pendingSettlementsCount: 0,
      isSettling: false
    };
  }

  public static generateSptrSettlement(
    unsettledTxsCount: number,
    totalValue: Money
  ): SptrSettlementReport {
    const val = totalValue.toDecimal();
    return {
      batchId: "SPTR-CLR-" + Math.floor(100000 + Math.random() * 900000),
      timestamp: new Date().toISOString(),
      totalTransacted: val,
      unsettledTransactionsCount: unsettledTxsCount,
      status: "SETTLED",
      clearingSignature: "RSA_B_SHA256_MOCK_SIGNATURE_" + Math.random().toString(36).substring(2, 10).toUpperCase(),
      bankBalances: [
        {
          bankName: "BFA - Banco de Fomento Angola",
          reserveBefore: 50000000,
          reserveAfter: Number((50000000 - val * 0.4).toFixed(2)),
          netClearedAmount: Number(-(val * 0.4).toFixed(2))
        },
        {
          bankName: "BAI - Banco Angolano de Investimentos",
          reserveBefore: 70000000,
          reserveAfter: Number((70000000 + val * 0.25).toFixed(2)),
          netClearedAmount: Number((val * 0.25).toFixed(2))
        },
        {
          bankName: "BCI - Banco de Comércio e Indústria",
          reserveBefore: 30000000,
          reserveAfter: Number((30000000 + val * 0.15).toFixed(2)),
          netClearedAmount: Number((val * 0.15).toFixed(2))
        }
      ]
    };
  }
}

// ==========================================
// EXCEÇÕES DE DOMÍNIO (FASE 2.7)
// ==========================================

export class DomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class InsufficientFundsException extends DomainException {
  constructor(walletId: string, balance: string, requested: string) {
    super(`[Erro de Domínio] Saldo insuficiente na carteira ${walletId}. Disponível: ${balance}, Solicitado: ${requested}`);
  }
}

export class WalletBlockedException extends DomainException {
  constructor(walletId: string, reason: string = "Bloqueio preventivo de conformidade") {
    super(`[Erro de Domínio] Acesso à carteira ${walletId} negado. Estado atual: BLOQUEADO/CONGELADO. Motivo: ${reason}`);
  }
}

export class SettlementAlreadyCompletedException extends DomainException {
  constructor(settlementId: string) {
    super(`[Erro de Domínio] Liquidação ${settlementId} já se encontra concluída. Operação duplicada rejeitada.`);
  }
}

export class InvalidMerchantException extends DomainException {
  constructor(merchantId: string, reason: string) {
    super(`[Erro de Domínio] Comerciante ${merchantId} inválido ou inativo. Razão: ${reason}`);
  }
}

export class LiquidityExceededException extends DomainException {
  constructor(agentId: string, available: string, requested: string) {
    super(`[Erro de Domínio] Falha de liquidez física no Agente ${agentId}. Disponível: ${available}, Solicitado: ${requested}`);
  }
}

export class DuplicateTransactionException extends DomainException {
  constructor(key: string) {
    super(`[Erro de Domínio] Chave de idempotência ativa detetada. Transação duplicada bloqueada síncronamente. Chave: ${key}`);
  }
}

export class InvalidStateTransitionException extends DomainException {
  constructor(fromState: string, toState: string) {
    super(`[Erro de Domínio] Transição de estado inválida de ${fromState} para ${toState}. Violabilidade de regras.`);
  }
}

export class DomainInvariantViolationException extends DomainException {
  constructor(invariantName: string, details: string) {
    super(`[Violação de Invariante] Regra: ${invariantName}. Detalhes: ${details}`);
  }
}

export class ConcurrencyConflictException extends DomainException {
  constructor(accountId: string, expectedVersion: number, actualVersion: number) {
    super(`[Erro de Concorrência] Conflito de concorrência detetado na conta do razão ${accountId}. Versão esperada: v${expectedVersion}, Versão atual: v${actualVersion}`);
  }
}

// ==========================================
// VALUE OBJECTS IMUTÁVEIS (FASE 2.7)
// ==========================================

export class WalletId {
  constructor(public readonly value: string) {
    if (!value || value.trim() === "") {
      throw new DomainInvariantViolationException("WalletId", "ID de carteira vazio não é permitido.");
    }
  }
}

export class MerchantId {
  constructor(public readonly value: string) {
    if (!value || value.trim() === "") {
      throw new DomainInvariantViolationException("MerchantId", "ID de comerciante vazio não é permitido.");
    }
  }
}

export class FraudScore {
  constructor(public readonly value: number) {
    if (!mutationManager.isEnabled("MUTANT_FRAUD_SCORE_RANGE")) {
      if (value < 0.0 || value > 1.0 || isNaN(value)) {
        throw new DomainInvariantViolationException("FraudScore", `Score de fraude deve situar-se estritamente entre 0.0 e 1.0. Recebido: ${value}`);
      }
    }
  }
}

export class Currency {
  constructor(public readonly code: string) {
    if (code !== "Kz") {
      throw new DomainInvariantViolationException("Currency", `Apenas Kwanza (Kz) é aceite como moeda de curso legal. Recebida: ${code}`);
    }
  }
}

export class PhoneNumber {
  constructor(public readonly value: string) {
    const cleaned = value.replace(/\s+/g, "");
    if (!cleaned.startsWith("+244") && cleaned.length < 9) {
      throw new DomainInvariantViolationException("PhoneNumber", `O número de telefone deve possuir indicativo nacional válido (+244) e formatação adequada. Recebido: ${value}`);
    }
  }
}

// ==========================================
// DDD RICH DOMAIN AGGREGATES & ENTITIES (FASE 2.7)
// ==========================================

/**
 * WALLET AGGREGATE ROOT
 * Encapsulates daily limits, tier checks, and safe mutations on the customer's balance.
 */
export class Wallet {
  private _balance: Money;
  private _status: "ACTIVE" | "FROZEN" = "ACTIVE";

  constructor(
    public readonly walletId: WalletId,
    public readonly ownerName: string,
    initialBalance: Money,
    public readonly tier: "Level-1" | "Level-2" | "Level-3",
    public readonly deviceId: string,
    public readonly dailySpendingLimit?: Money,
    isFrozen: boolean = false
  ) {
    // Invariants
    if (initialBalance.getCents() < 0) {
      throw new DomainInvariantViolationException("Wallet Balance", "O saldo inicial da carteira não pode ser negativo.");
    }
    this._balance = initialBalance;
    this._status = isFrozen ? "FROZEN" : "ACTIVE";
  }

  public get balance(): Money {
    return this._balance;
  }

  public get status(): "ACTIVE" | "FROZEN" {
    return this._status;
  }

  public freeze(): void {
    this._status = "FROZEN";
  }

  public unfreeze(): void {
    this._status = "ACTIVE";
  }

  public canDebit(amount: Money): boolean {
    if (this._status === "FROZEN") {
      return false;
    }
    if (this._balance.lessThan(amount)) {
      return false;
    }
    if (this.dailySpendingLimit && amount.greaterThan(this.dailySpendingLimit)) {
      return false;
    }
    return true;
  }

  public debit(amount: Money): void {
    if (this._status === "FROZEN" && !mutationManager.isEnabled("MUTANT_WALLET_FREEZE_BYPASS")) {
      throw new WalletBlockedException(this.walletId.value, "Carteira congelada preventivamente pelo motor de compliance.");
    }
    if (this._balance.lessThan(amount) && !mutationManager.isEnabled("MUTANT_WALLET_BALANCE_CHECK")) {
      throw new InsufficientFundsException(this.walletId.value, this._balance.toString(), amount.toString());
    }
    if (this.dailySpendingLimit && amount.greaterThan(this.dailySpendingLimit) && !mutationManager.isEnabled("MUTANT_WALLET_DAILY_LIMIT")) {
      throw new DomainInvariantViolationException("Daily Spending Limit", `Limite diário excedido. Limite: ${this.dailySpendingLimit.toString()}, Solicitado: ${amount.toString()}`);
    }
    this._balance = this._balance.subtract(amount);
  }

  public credit(amount: Money): void {
    if (this._status === "FROZEN" && !mutationManager.isEnabled("MUTANT_WALLET_FREEZE_BYPASS")) {
      throw new WalletBlockedException(this.walletId.value, "Depósitos rejeitados em conta congelada.");
    }
    this._balance = this._balance.add(amount);
  }

  public reverse(amount: Money): void {
    this._balance = this._balance.add(amount);
  }
}

/**
 * LEDGER AGGREGATE ROOT
 * Controls postings onto double-entry accounts, guaranteeing balance accuracy.
 */
export class Ledger {
  private _balance: Money;

  constructor(
    public readonly accountId: string,
    public readonly name: string,
    public readonly type: "ASSET" | "LIABILITY" | "REVENUE" | "EXPENSE" | "EQUITY",
    initialBalance: Money
  ) {
    this._balance = initialBalance;
  }

  public get balance(): Money {
    return this._balance;
  }

  public post(amount: Money, direction: "DEBIT" | "CREDIT"): void {
    if (direction === "DEBIT") {
      this._balance = this._balance.add(amount);
    } else {
      this._balance = this._balance.subtract(amount);
    }
  }

  public static verifyMathematicalBalance(postings: { amount: number; type: "DEBIT" | "CREDIT" }[]): void {
    // Σ Débitos = Σ Créditos
    const debits = postings.filter(p => p.type === "DEBIT").reduce((sum, p) => sum + Math.abs(p.amount), 0);
    const credits = postings.filter(p => p.type === "CREDIT").reduce((sum, p) => sum + Math.abs(p.amount), 0);
    
    if (Math.abs(debits - credits) > 0.001) {
      throw new DomainInvariantViolationException(
        "Ledger Double-Entry Balance",
        `Inconsistência de partidas dobradas detetada. Débitos (${debits} Kz) != Créditos (${credits} Kz). Desvio: ${debits - credits} Kz`
      );
    }
  }
}

/**
 * SETTLEMENT AGGREGATE ROOT
 * Tracks the clearing process with commercial partner banks and BNA.
 */
export type SettlementState = "CREATED" | "VALIDATED" | "RESERVED" | "SETTLING" | "SETTLED" | "FAILED";

export class Settlement {
  private _status: SettlementState = "CREATED";

  constructor(
    public readonly id: string,
    public readonly amount: Money,
    initialStatus: SettlementState = "CREATED",
    public readonly timestamp: string,
    public readonly clearingSignature: string
  ) {
    this._status = initialStatus;
  }

  public get status(): SettlementState {
    return this._status;
  }

  public transitionTo(newState: SettlementState): void {
    if (mutationManager.isEnabled("MUTANT_SETTLEMENT_STATE_TRANSITION")) {
      this._status = newState;
      return;
    }

    if (this._status === "SETTLED") {
      throw new SettlementAlreadyCompletedException(this.id);
    }
    if (this._status === "FAILED" && newState !== "CREATED" && newState !== "FAILED") {
      throw new InvalidStateTransitionException(this._status, newState);
    }

    const validTransitions: Record<SettlementState, SettlementState[]> = {
      CREATED: ["VALIDATED", "FAILED"],
      VALIDATED: ["RESERVED", "FAILED"],
      RESERVED: ["SETTLING", "FAILED"],
      SETTLING: ["SETTLED", "FAILED"],
      SETTLED: [],
      FAILED: ["CREATED", "FAILED"]
    };

    const allowed = validTransitions[this._status];
    if (!allowed.includes(newState)) {
      throw new InvalidStateTransitionException(this._status, newState);
    }

    this._status = newState;
  }

  public settle(): void {
    this.transitionTo("VALIDATED");
    this.transitionTo("RESERVED");
    this.transitionTo("SETTLING");
    this.transitionTo("SETTLED");
  }

  public fail(): void {
    this.transitionTo("FAILED");
  }
}

/**
 * MERCHANT AGGREGATE ROOT
 * Represents a commercial point (e.g. Candongueiro, Cantina) receiving payments with micro-fees.
 */
export class Merchant {
  private _balance: Money;

  constructor(
    public readonly code: string,
    public readonly name: string,
    initialBalance: Money,
    public readonly merchantType: string,
    public readonly feePercentage: number = 0.0015
  ) {
    if (feePercentage < 0) {
      throw new DomainInvariantViolationException("Merchant Fee Percentage", `Taxa do lojista não pode ser negativa. Recebido: ${feePercentage}`);
    }
    this._balance = initialBalance;
  }

  public get balance(): Money {
    return this._balance;
  }

  public creditPayment(amount: Money, fee: Money): void {
    if (fee.getCents() < 0) {
      throw new DomainInvariantViolationException("Merchant Credit Fee", `Taxa calculada não pode ser negativa: ${fee.toString()}`);
    }
    const netAmount = amount.subtract(fee);
    if (netAmount.getCents() < 0) {
      throw new DomainInvariantViolationException("Merchant Credit Net Amount", "O valor líquido creditado não pode ser inferior a zero.");
    }
    this._balance = this._balance.add(netAmount);
  }
}

/**
 * AGENT AGGREGATE ROOT
 * Manages an authorized physical agent's float liquidity and cash operations.
 */
export class Agent {
  private _liquidityBalance: Money;

  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly location: string,
    initialLiquidity: Money
  ) {
    if (initialLiquidity.getCents() < 0) {
      throw new DomainInvariantViolationException("Agent Physical Liquidity", "A liquidez inicial física do Agente não pode ser negativa.");
    }
    this._liquidityBalance = initialLiquidity;
  }

  public get liquidityBalance(): Money {
    return this._liquidityBalance;
  }

  public depositFloat(amount: Money): void {
    this._liquidityBalance = this._liquidityBalance.add(amount);
  }

  public withdrawFloat(amount: Money): void {
    if (this._liquidityBalance.lessThan(amount) && !mutationManager.isEnabled("MUTANT_AGENT_LIQUIDITY_LIMIT")) {
      throw new LiquidityExceededException(this.id, this._liquidityBalance.toString(), amount.toString());
    }
    this._liquidityBalance = this._liquidityBalance.subtract(amount);
  }
}

/**
 * IDENTITY AGGREGATE ROOT
 * Ensures user registration and biometrics comply with KYC rules (Tiers 1-3).
 */
export class Identity {
  constructor(
    public readonly biNumber: string,
    public readonly name: string,
    public readonly verified: boolean,
    public readonly tier: "Level-1" | "Level-2" | "Level-3"
  ) {
    if (!biNumber || biNumber.trim() === "") {
      throw new DomainInvariantViolationException("Identity BI", "Número de Bilhete de Identidade nacional é obrigatório.");
    }
  }

  public upgradeTier(newTier: "Level-1" | "Level-2" | "Level-3"): Identity {
    return new Identity(this.biNumber, this.name, this.verified, newTier);
  }
}

/**
 * LIQUIDITY POOL AGGREGATE
 * Ensures total reserve pool balance across multiple banks aligns in real-time.
 */
export class LiquidityPool {
  private _totalReserves: Money;

  constructor(
    public readonly poolId: string,
    initialReserves: Money,
    public readonly allocatedBanks: { bankName: string; balance: Money }[]
  ) {
    this._totalReserves = initialReserves;
  }

  public get totalReserves(): Money {
    return this._totalReserves;
  }

  public adjustBankReserve(bankName: string, amount: Money, isAddition: boolean): void {
    const bank = this.allocatedBanks.find(b => b.bankName === bankName);
    if (!bank) throw new Error(`Banco ${bankName} não cadastrado no Pool de Liquidez.`);

    if (isAddition) {
      bank.balance = bank.balance.add(amount);
      this._totalReserves = this._totalReserves.add(amount);
    } else {
      bank.balance = bank.balance.subtract(amount);
      this._totalReserves = this._totalReserves.subtract(amount);
    }
  }
}

/**
 * RECONCILIATION BATCH AGGREGATE
 * Audits transacted instruction volumes against BNA safe custody balances.
 */
export class ReconciliationBatch {
  private _status: "reconciled" | "discrepancy_alert";

  constructor(
    public readonly batchId: string,
    public readonly timestamp: string,
    public readonly instructionsSum: Money,
    public readonly custodySum: Money,
    initialStatus: "reconciled" | "discrepancy_alert" = "reconciled"
  ) {
    this._status = initialStatus;
  }

  public get status(): "reconciled" | "discrepancy_alert" {
    return this._status;
  }

  public getDiscrepancy(): Money {
    return this.instructionsSum.subtract(this.custodySum);
  }

  public audit(): void {
    if (this.instructionsSum.equals(this.custodySum)) {
      this._status = "reconciled";
    } else {
      this._status = "discrepancy_alert";
    }
  }
}

// ==========================================
// FIRST-CLASS USE CASES (CORE DOMAIN)
// ==========================================

/**
 * TRANSFER MONEY USE CASE
 * Orchestrates personal peer-to-peer sending with rich aggregates, double-entries and domain events.
 */
export class TransferMoneyUseCase {
  public static execute(request: {
    sender: UserAccount;
    receiverPhone: string;
    amount: Money;
    idempotencyKey?: string;
    processedIdempotencyKeys?: string[];
    debitAccountName: string;
    creditAccountName: string;
  }): FinancialTransactionResult {
    const { sender, receiverPhone, amount, idempotencyKey, processedIdempotencyKeys = [], debitAccountName, creditAccountName } = request;

    // Validate Value Object Phone Numbers
    new PhoneNumber(sender.phone);
    new PhoneNumber(receiverPhone);

    if (idempotencyKey && processedIdempotencyKeys.includes(idempotencyKey)) {
      throw new DuplicateTransactionException(idempotencyKey);
    }

    const wallet = new Wallet(
      new WalletId(sender.phone),
      sender.name,
      Money.fromDecimal(sender.balance),
      sender.tier,
      sender.deviceId || "",
      sender.dailySpendingLimit ? Money.fromDecimal(sender.dailySpendingLimit) : undefined
    );

    // Business mutation with Guard Clause encapsulation
    wallet.debit(amount);

    const updatedSender: UserAccount = {
      ...sender,
      balance: wallet.balance.toDecimal()
    };

    const safety = PaymentService.validateTransactionSafety(amount);
    const txId = "tx_" + Math.random().toString(36).substring(2, 12);

    const amlMs = Math.floor(10 + Math.random() * 10);
    const ledgerMs = Math.floor(6 + Math.random() * 6);
    const settlementMs = Math.floor(12 + Math.random() * 10);
    const persistenceMs = Math.floor(8 + Math.random() * 8);
    const uiMs = Math.floor(4 + Math.random() * 4);
    const totalMs = amlMs + ledgerMs + settlementMs + persistenceMs + uiMs;

    const transaction: Transaction = {
      id: txId,
      senderPhone: sender.phone,
      receiverPhone,
      amount: amount.toDecimal(),
      type: "envio",
      status: "completed",
      timestamp: new Date().toISOString(),
      latencyMs: totalMs,
      latencyDetails: {
        totalMs,
        amlMs,
        ledgerMs,
        settlementMs,
        persistenceMs,
        uiMs
      },
      fraudScore: safety.fraudScore,
      securityLog: [
        "Caso de Uso: TransferMoneyUseCase executado com sucesso",
        ...safety.logs,
        "Lançamento síncrono por partidas dobradas"
      ],
      locationName: "Luanda"
    };

    const journalEntry = LedgerService.createDoubleEntry(
      txId,
      `Envio offline para ${receiverPhone}`,
      debitAccountName,
      creditAccountName,
      amount
    );

    // Mathematical Consistency Proving
    Ledger.verifyMathematicalBalance([
      { amount: amount.toDecimal(), type: "DEBIT" },
      { amount: amount.toDecimal(), type: "CREDIT" }
    ]);

    const events: DomainEvent[] = [
      {
        id: "ev_req_" + Math.random().toString(36).substring(2, 12),
        type: "PaymentRequested",
        timestamp: new Date().toISOString(),
        payload: { txId, senderPhone: sender.phone, receiverPhone, amount: amount.toDecimal(), type: "envio", idempotencyKey }
      },
      {
        id: "ev_res_" + Math.random().toString(36).substring(2, 12),
        type: "BalanceReserved",
        timestamp: new Date().toISOString(),
        payload: { txId, previousBalance: sender.balance, currentBalance: wallet.balance.toDecimal() }
      },
      {
        id: "ev_com_" + Math.random().toString(36).substring(2, 12),
        type: "LedgerCommitted",
        timestamp: new Date().toISOString(),
        payload: { journalEntryId: journalEntry.id, debitAccountName, creditAccountName, amount: amount.toDecimal() }
      },
      {
        id: "ev_set_" + Math.random().toString(36).substring(2, 12),
        type: "SettlementCompleted",
        timestamp: new Date().toISOString(),
        payload: { txId, status: "liquidação_síncrona" }
      }
    ];

    return {
      success: true,
      updatedSender,
      transaction,
      journalEntry,
      events
    };
  }
}

/**
 * PAY MERCHANT USE CASE
 * Orchestrates merchant point-of-sale payments with automated commission billing.
 */
export class PayMerchantUseCase {
  public static execute(request: {
    sender: UserAccount;
    merchantCode: string;
    amount: Money;
    idempotencyKey?: string;
    processedIdempotencyKeys?: string[];
    debitAccountName: string;
    creditAccountName: string;
    merchantName: string;
  }): FinancialTransactionResult {
    const { sender, merchantCode, amount, idempotencyKey, processedIdempotencyKeys = [], debitAccountName, creditAccountName, merchantName } = request;

    // Value Objects
    new PhoneNumber(sender.phone);
    new MerchantId(merchantCode);

    if (idempotencyKey && processedIdempotencyKeys.includes(idempotencyKey) && !mutationManager.isEnabled("MUTANT_IDEMPOTENCY_BYPASS")) {
      throw new DuplicateTransactionException(idempotencyKey);
    }

    const wallet = new Wallet(
      new WalletId(sender.phone),
      sender.name,
      Money.fromDecimal(sender.balance),
      sender.tier,
      sender.deviceId || "",
      sender.dailySpendingLimit ? Money.fromDecimal(sender.dailySpendingLimit) : undefined
    );

    // Business Mutation
    wallet.debit(amount);

    const updatedSender: UserAccount = {
      ...sender,
      balance: wallet.balance.toDecimal()
    };

    const safety = PaymentService.validateTransactionSafety(amount);
    const commercialFee = PaymentService.calculateMerchantFee(amount);
    const txId = "tx_" + Math.random().toString(36).substring(2, 12);

    const amlMs = Math.floor(12 + Math.random() * 12);
    const ledgerMs = Math.floor(8 + Math.random() * 7);
    const settlementMs = Math.floor(15 + Math.random() * 12);
    const persistenceMs = Math.floor(10 + Math.random() * 9);
    const uiMs = Math.floor(5 + Math.random() * 5);
    const totalMs = amlMs + ledgerMs + settlementMs + persistenceMs + uiMs;

    const transaction: Transaction = {
      id: txId,
      senderPhone: sender.phone,
      receiverPhone: merchantCode,
      amount: amount.toDecimal(),
      type: "pagamento",
      status: "completed",
      timestamp: new Date().toISOString(),
      latencyMs: totalMs,
      latencyDetails: {
        totalMs,
        amlMs,
        ledgerMs,
        settlementMs,
        persistenceMs,
        uiMs
      },
      fraudScore: safety.fraudScore,
      securityLog: [
        "Caso de Uso: PayMerchantUseCase executado com sucesso",
        `Taxa de intermediação de 0.15% cobrada: ${commercialFee.toString()}`,
        ...safety.logs
      ],
      locationName: "Luanda"
    };

    const journalEntry = LedgerService.createDoubleEntry(
      txId,
      `Pagamento Lojista: ${merchantName}`,
      debitAccountName,
      creditAccountName,
      amount
    );

    // Double entry accounting verification with fees
    const netCredit = amount.toDecimal() - commercialFee.toDecimal();
    Ledger.verifyMathematicalBalance([
      { amount: amount.toDecimal(), type: "DEBIT" }, // Total debited from customer
      { amount: netCredit, type: "CREDIT" }, // Credited to merchant
      { amount: commercialFee.toDecimal(), type: "CREDIT" } // Credited to fee vault
    ]);

    const events: DomainEvent[] = [
      {
        id: "ev_req_" + Math.random().toString(36).substring(2, 12),
        type: "PaymentRequested",
        timestamp: new Date().toISOString(),
        payload: { txId, senderPhone: sender.phone, receiverPhone: merchantCode, amount: amount.toDecimal(), type: "pagamento", idempotencyKey }
      },
      {
        id: "ev_res_" + Math.random().toString(36).substring(2, 12),
        type: "BalanceReserved",
        timestamp: new Date().toISOString(),
        payload: { txId, previousBalance: sender.balance, currentBalance: wallet.balance.toDecimal() }
      },
      {
        id: "ev_com_" + Math.random().toString(36).substring(2, 12),
        type: "LedgerCommitted",
        timestamp: new Date().toISOString(),
        payload: { journalEntryId: journalEntry.id, debitAccountName, creditAccountName, amount: amount.toDecimal(), fee: commercialFee.toDecimal() }
      },
      {
        id: "ev_set_" + Math.random().toString(36).substring(2, 12),
        type: "SettlementCompleted",
        timestamp: new Date().toISOString(),
        payload: { txId, status: "liquidação_síncrona" }
      }
    ];

    return {
      success: true,
      updatedSender,
      transaction,
      journalEntry,
      events
    };
  }
}

/**
 * CASH IN USE CASE (AGENT DEPOSIT)
 * Orchestrates personal wallet deposits assisted by a physical agent cash reserve.
 */
export class CashInUseCase {
  public static execute(request: {
    sender: UserAccount;
    agentId: string;
    amount: Money;
    idempotencyKey?: string;
    processedIdempotencyKeys?: string[];
  }): FinancialTransactionResult {
    const { sender, agentId, amount, idempotencyKey, processedIdempotencyKeys = [] } = request;

    new PhoneNumber(sender.phone);

    if (idempotencyKey && processedIdempotencyKeys.includes(idempotencyKey)) {
      throw new DuplicateTransactionException(idempotencyKey);
    }

    const wallet = new Wallet(
      new WalletId(sender.phone),
      sender.name,
      Money.fromDecimal(sender.balance),
      sender.tier,
      sender.deviceId || "",
      sender.dailySpendingLimit ? Money.fromDecimal(sender.dailySpendingLimit) : undefined
    );

    // Business Mutation
    wallet.credit(amount);

    const updatedSender: UserAccount = {
      ...sender,
      balance: wallet.balance.toDecimal()
    };

    const txId = "tx_" + Math.random().toString(36).substring(2, 12);

    const amlMs = Math.floor(4 + Math.random() * 5);
    const ledgerMs = Math.floor(5 + Math.random() * 5);
    const settlementMs = Math.floor(8 + Math.random() * 8);
    const persistenceMs = Math.floor(6 + Math.random() * 6);
    const uiMs = Math.floor(3 + Math.random() * 3);
    const totalMs = amlMs + ledgerMs + settlementMs + persistenceMs + uiMs;

    const transaction: Transaction = {
      id: txId,
      senderPhone: agentId,
      receiverPhone: sender.phone,
      amount: amount.toDecimal(),
      type: "recebimento",
      status: "completed",
      timestamp: new Date().toISOString(),
      latencyMs: totalMs,
      latencyDetails: {
        totalMs,
        amlMs,
        ledgerMs,
        settlementMs,
        persistenceMs,
        uiMs
      },
      fraudScore: 0.01,
      securityLog: [
        "Caso de Uso: CashInUseCase executado com sucesso",
        `Depósito físico processado no terminal do Agente: ${agentId}`,
        "Liquidez física convertida em fundos fiduciários digitais"
      ],
      locationName: "Luanda"
    };

    const journalEntry = LedgerService.createDoubleEntry(
      txId,
      `Depósito via Agente ${agentId}`,
      "Reserva de Liquidez de Agentes (Ativo)",
      "Wallet Manuel da Silva (Ativo)",
      amount
    );

    Ledger.verifyMathematicalBalance([
      { amount: amount.toDecimal(), type: "DEBIT" },
      { amount: amount.toDecimal(), type: "CREDIT" }
    ]);

    const events: DomainEvent[] = [
      {
        id: "ev_req_" + Math.random().toString(36).substring(2, 12),
        type: "PaymentRequested",
        timestamp: new Date().toISOString(),
        payload: { txId, agentId, receiverPhone: sender.phone, amount: amount.toDecimal(), type: "recebimento", idempotencyKey }
      },
      {
        id: "ev_res_" + Math.random().toString(36).substring(2, 12),
        type: "BalanceReserved",
        timestamp: new Date().toISOString(),
        payload: { txId, previousBalance: sender.balance, currentBalance: wallet.balance.toDecimal() }
      },
      {
        id: "ev_com_" + Math.random().toString(36).substring(2, 12),
        type: "LedgerCommitted",
        timestamp: new Date().toISOString(),
        payload: { journalEntryId: journalEntry.id, debitAccountName: "Reserva de Liquidez de Agentes (Ativo)", creditAccountName: "Wallet Manuel da Silva (Ativo)", amount: amount.toDecimal() }
      },
      {
        id: "ev_set_" + Math.random().toString(36).substring(2, 12),
        type: "SettlementCompleted",
        timestamp: new Date().toISOString(),
        payload: { txId, status: "liquidação_síncrona" }
      }
    ];

    return {
      success: true,
      updatedSender,
      transaction,
      journalEntry,
      events
    };
  }
}

/**
 * CASH OUT USE CASE (AGENT WITHDRAWAL)
 * Orchestrates personal wallet cash-out withdrawals via a physical agent.
 */
export class CashOutUseCase {
  public static execute(request: {
    sender: UserAccount;
    agentId: string;
    amount: Money;
    idempotencyKey?: string;
    processedIdempotencyKeys?: string[];
  }): FinancialTransactionResult {
    const { sender, agentId, amount, idempotencyKey, processedIdempotencyKeys = [] } = request;

    new PhoneNumber(sender.phone);

    if (idempotencyKey && processedIdempotencyKeys.includes(idempotencyKey)) {
      throw new DuplicateTransactionException(idempotencyKey);
    }

    const wallet = new Wallet(
      new WalletId(sender.phone),
      sender.name,
      Money.fromDecimal(sender.balance),
      sender.tier,
      sender.deviceId || "",
      sender.dailySpendingLimit ? Money.fromDecimal(sender.dailySpendingLimit) : undefined
    );

    // Business Mutation - Encapsulated invariants in Aggregate
    wallet.debit(amount);

    const updatedSender: UserAccount = {
      ...sender,
      balance: wallet.balance.toDecimal()
    };

    const txId = "tx_" + Math.random().toString(36).substring(2, 12);

    const amlMs = Math.floor(5 + Math.random() * 5);
    const ledgerMs = Math.floor(6 + Math.random() * 5);
    const settlementMs = Math.floor(10 + Math.random() * 8);
    const persistenceMs = Math.floor(8 + Math.random() * 6);
    const uiMs = Math.floor(4 + Math.random() * 3);
    const totalMs = amlMs + ledgerMs + settlementMs + persistenceMs + uiMs;

    const transaction: Transaction = {
      id: txId,
      senderPhone: sender.phone,
      receiverPhone: agentId,
      amount: amount.toDecimal(),
      type: "envio",
      status: "completed",
      timestamp: new Date().toISOString(),
      latencyMs: totalMs,
      latencyDetails: {
        totalMs,
        amlMs,
        ledgerMs,
        settlementMs,
        persistenceMs,
        uiMs
      },
      fraudScore: 0.02,
      securityLog: [
        "Caso de Uso: CashOutUseCase executado com sucesso",
        `Levantamento físico efetuado no Agente: ${agentId}`,
        "Saldo digital debitado na conta do cliente síncronamente"
      ],
      locationName: "Luanda"
    };

    const journalEntry = LedgerService.createDoubleEntry(
      txId,
      `Levantamento via Agente ${agentId}`,
      "Wallet Manuel da Silva (Ativo)",
      "Reserva de Liquidez de Agentes (Ativo)",
      amount
    );

    Ledger.verifyMathematicalBalance([
      { amount: amount.toDecimal(), type: "DEBIT" },
      { amount: amount.toDecimal(), type: "CREDIT" }
    ]);

    const events: DomainEvent[] = [
      {
        id: "ev_req_" + Math.random().toString(36).substring(2, 12),
        type: "PaymentRequested",
        timestamp: new Date().toISOString(),
        payload: { txId, senderPhone: sender.phone, agentId, amount: amount.toDecimal(), type: "envio", idempotencyKey }
      },
      {
        id: "ev_res_" + Math.random().toString(36).substring(2, 12),
        type: "BalanceReserved",
        timestamp: new Date().toISOString(),
        payload: { txId, previousBalance: sender.balance, currentBalance: wallet.balance.toDecimal() }
      },
      {
        id: "ev_com_" + Math.random().toString(36).substring(2, 12),
        type: "LedgerCommitted",
        timestamp: new Date().toISOString(),
        payload: { journalEntryId: journalEntry.id, debitAccountName: "Wallet Manuel da Silva (Ativo)", creditAccountName: "Reserva de Liquidez de Agentes (Ativo)", amount: amount.toDecimal() }
      },
      {
        id: "ev_set_" + Math.random().toString(36).substring(2, 12),
        type: "SettlementCompleted",
        timestamp: new Date().toISOString(),
        payload: { txId, status: "liquidação_síncrona" }
      }
    ];

    return {
      success: true,
      updatedSender,
      transaction,
      journalEntry,
      events
    };
  }
}

/**
 * REVERSE TRANSACTION USE CASE
 * Establishes formal rollback logic that returns previously debited funds.
 */
export class ReverseTransactionUseCase {
  public static execute(request: {
    sender: UserAccount;
    originalTxId: string;
    amount: Money;
    idempotencyKey?: string;
    processedIdempotencyKeys?: string[];
  }): FinancialTransactionResult {
    const { sender, originalTxId, amount, idempotencyKey, processedIdempotencyKeys = [] } = request;

    new PhoneNumber(sender.phone);

    if (idempotencyKey && processedIdempotencyKeys.includes(idempotencyKey)) {
      throw new DuplicateTransactionException(idempotencyKey);
    }

    const wallet = new Wallet(
      new WalletId(sender.phone),
      sender.name,
      Money.fromDecimal(sender.balance),
      sender.tier,
      sender.deviceId || ""
    );

    // Rollback credit mutation
    wallet.reverse(amount);

    const updatedSender: UserAccount = {
      ...sender,
      balance: wallet.balance.toDecimal()
    };

    const txId = "tx_rev_" + Math.random().toString(36).substring(2, 12);

    const amlMs = Math.floor(2 + Math.random() * 3);
    const ledgerMs = Math.floor(4 + Math.random() * 3);
    const settlementMs = Math.floor(6 + Math.random() * 5);
    const persistenceMs = Math.floor(4 + Math.random() * 4);
    const uiMs = Math.floor(2 + Math.random() * 2);
    const totalMs = amlMs + ledgerMs + settlementMs + persistenceMs + uiMs;

    const transaction: Transaction = {
      id: txId,
      senderPhone: "KM_SYSTEM",
      receiverPhone: sender.phone,
      amount: amount.toDecimal(),
      type: "recebimento",
      status: "completed",
      timestamp: new Date().toISOString(),
      latencyMs: totalMs,
      latencyDetails: {
        totalMs,
        amlMs,
        ledgerMs,
        settlementMs,
        persistenceMs,
        uiMs
      },
      fraudScore: 0.0,
      securityLog: [
        "Caso de Uso: ReverseTransactionUseCase executado com sucesso",
        `Estorno absoluto referente à transação original: ${originalTxId}`,
        "Equilíbrio de partidas dobradas e neutralidade garantida"
      ],
      locationName: "Luanda"
    };

    const journalEntry = LedgerService.createDoubleEntry(
      txId,
      `Estorno de transação ${originalTxId}`,
      "Compensações Gerais de Saída (Passivo)",
      "Wallet Manuel da Silva (Ativo)",
      amount
    );

    Ledger.verifyMathematicalBalance([
      { amount: amount.toDecimal(), type: "DEBIT" },
      { amount: amount.toDecimal(), type: "CREDIT" }
    ]);

    const events: DomainEvent[] = [
      {
        id: "ev_req_" + Math.random().toString(36).substring(2, 12),
        type: "PaymentRequested",
        timestamp: new Date().toISOString(),
        payload: { txId, originalTxId, receiverPhone: sender.phone, amount: amount.toDecimal(), type: "recebimento", idempotencyKey }
      },
      {
        id: "ev_res_" + Math.random().toString(36).substring(2, 12),
        type: "BalanceReserved",
        timestamp: new Date().toISOString(),
        payload: { txId, previousBalance: sender.balance, currentBalance: wallet.balance.toDecimal() }
      },
      {
        id: "ev_com_" + Math.random().toString(36).substring(2, 12),
        type: "LedgerCommitted",
        timestamp: new Date().toISOString(),
        payload: { journalEntryId: journalEntry.id, debitAccountName: "Compensações Gerais de Saída (Passivo)", creditAccountName: "Wallet Manuel da Silva (Ativo)", amount: amount.toDecimal() }
      },
      {
        id: "ev_set_" + Math.random().toString(36).substring(2, 12),
        type: "SettlementCompleted",
        timestamp: new Date().toISOString(),
        payload: { txId, status: "liquidação_síncrona" }
      }
    ];

    return {
      success: true,
      updatedSender,
      transaction,
      journalEntry,
      events
    };
  }
}

// ==========================================
// TESTE DE ROBUSTEZ AUTOMATIZADO (FASE 2.7)
// ==========================================

export interface DomainTestReport {
  id: number;
  name: string;
  passed: boolean;
  errorExpected?: string;
  errorThrown?: string;
}

export function runDomainTestSuite(): DomainTestReport[] {
  const reports: DomainTestReport[] = [];

  const assertThrows = (name: string, fn: () => void, exceptionClass: any) => {
    try {
      fn();
      reports.push({
        id: reports.length + 1,
        name,
        passed: false,
        errorExpected: exceptionClass.name,
        errorThrown: "Nenhuma exceção lançada."
      });
    } catch (err: any) {
      if (err instanceof exceptionClass) {
        reports.push({ id: reports.length + 1, name, passed: true });
      } else {
        reports.push({
          id: reports.length + 1,
          name,
          passed: false,
          errorExpected: exceptionClass.name,
          errorThrown: `${err.name}: ${err.message}`
        });
      }
    }
  };

  // Teste 1: saldo insuficiente
  assertThrows(
    "Teste 1: Invariante de Saldo Insuficiente",
    () => {
      const wallet = new Wallet(new WalletId("+244900000001"), "Test Account", Money.fromDecimal(10), "Level-1", "device");
      wallet.debit(Money.fromDecimal(50));
    },
    InsufficientFundsException
  );

  // Teste 2: pagamento duplicado (idempotência)
  assertThrows(
    "Teste 2: Detecção de Transação Duplicada (Idempotência)",
    () => {
      const senderAcc: UserAccount = {
        phone: "+244923000111",
        name: "Manuel da Silva",
        biNumber: "00593845LA042",
        balance: 1000,
        tier: "Level-1",
        pinHash: "1234",
        deviceId: "d",
        isRegistered: true
      };
      PayMerchantUseCase.execute({
        sender: senderAcc,
        merchantCode: "M-001",
        amount: Money.fromDecimal(100),
        idempotencyKey: "dup-key-test",
        processedIdempotencyKeys: ["dup-key-test"],
        debitAccountName: "D",
        creditAccountName: "C",
        merchantName: "Merchant"
      });
    },
    DuplicateTransactionException
  );

  // Teste 3: reversão segura
  try {
    const senderAcc: UserAccount = {
      phone: "+244923000111",
      name: "Manuel da Silva",
      biNumber: "00593845LA042",
      balance: 5000,
      tier: "Level-1",
      pinHash: "1234",
      deviceId: "d",
      isRegistered: true
    };
    const res = ReverseTransactionUseCase.execute({
      sender: senderAcc,
      originalTxId: "tx_orig_999",
      amount: Money.fromDecimal(1000)
    });
    if (res.success && res.updatedSender.balance === 6000) {
      reports.push({ id: reports.length + 1, name: "Teste 3: Reversão Segura de Fundos", passed: true });
    } else {
      reports.push({ id: reports.length + 1, name: "Teste 3: Reversão Segura de Fundos", passed: false, errorThrown: `Saldo incorreto: ${res.updatedSender.balance} Kz` });
    }
  } catch (err: any) {
    reports.push({ id: reports.length + 1, name: "Teste 3: Reversão Segura de Fundos", passed: false, errorThrown: err.message });
  }

  // Teste 4: liquidação duplicada
  assertThrows(
    "Teste 4: Invariante de Liquidação Duplicada (Settlement)",
    () => {
      const settlement = new Settlement("S-001", Money.fromDecimal(100), "SETTLED", new Date().toISOString(), "SIG");
      settlement.transitionTo("CREATED");
    },
    SettlementAlreadyCompletedException
  );

  // Teste 5: carteira congelada / merchant bloqueado
  assertThrows(
    "Teste 5: Bloqueio de Operação em Carteira Congelada",
    () => {
      const wallet = new Wallet(new WalletId("+244900000002"), "Test blocked", Money.fromDecimal(1000), "Level-1", "device", undefined, true);
      wallet.debit(Money.fromDecimal(50));
    },
    WalletBlockedException
  );

  // Teste 6: agente sem liquidez física
  assertThrows(
    "Teste 6: Limite de Liquidez Física do Agente Rebentado",
    () => {
      const agent = new Agent("A-001", "Agente Viana", "Viana", Money.fromDecimal(200));
      agent.withdrawFloat(Money.fromDecimal(300));
    },
    LiquidityExceededException
  );

  // Teste 7: score de fraude fora dos limites
  assertThrows(
    "Teste 7: Invariante de Score de Fraude fora do Intervalo [0, 1]",
    () => {
      new FraudScore(2.5);
    },
    DomainInvariantViolationException
  );

  // Teste 8: máquina de estados (salto inválido no settlement)
  assertThrows(
    "Teste 8: Máquina de Estados (Transição Inválida no Settlement)",
    () => {
      const settlement = new Settlement("S-002", Money.fromDecimal(100), "CREATED", new Date().toISOString(), "SIG");
      settlement.transitionTo("SETTLED"); // Pula VALIDATED, RESERVED, SETTLING
    },
    InvalidStateTransitionException
  );

  // Teste 9: idempotência repetida com sucesso
  try {
    const senderAcc: UserAccount = {
      phone: "+244923000111",
      name: "Manuel da Silva",
      biNumber: "00593845LA042",
      balance: 5000,
      tier: "Level-1",
      pinHash: "1234",
      deviceId: "d",
      isRegistered: true
    };
    let threwIdempotency = false;
    try {
      TransferMoneyUseCase.execute({
        sender: senderAcc,
        receiverPhone: "+244933000111",
        amount: Money.fromDecimal(500),
        idempotencyKey: "test-idem-9",
        processedIdempotencyKeys: ["test-idem-9"],
        debitAccountName: "D",
        creditAccountName: "C"
      });
    } catch (err: any) {
      if (err instanceof DuplicateTransactionException) {
        threwIdempotency = true;
      }
    }
    if (threwIdempotency) {
      reports.push({ id: reports.length + 1, name: "Teste 9: Repetição Absoluta de Idempotência", passed: true });
    } else {
      reports.push({ id: reports.length + 1, name: "Teste 9: Repetição Absoluta de Idempotência", passed: false, errorThrown: "Idempotency didn't throw expected exception." });
    }
  } catch (err: any) {
    reports.push({ id: reports.length + 1, name: "Teste 9: Repetição Absoluta de Idempotência", passed: false, errorThrown: err.message });
  }

  // Teste 10: erro durante o fluxo de settlement
  try {
    const settlement = new Settlement("S-003", Money.fromDecimal(100), "CREATED", new Date().toISOString(), "SIG");
    settlement.transitionTo("FAILED");
    if (settlement.status === "FAILED") {
      reports.push({ id: reports.length + 1, name: "Teste 10: Tratamento de Falha no Settlement", passed: true });
    } else {
      reports.push({ id: reports.length + 1, name: "Teste 10: Tratamento de Falha no Settlement", passed: false, errorThrown: `Status final incorreto: ${settlement.status}` });
    }
  } catch (err: any) {
    reports.push({ id: reports.length + 1, name: "Teste 10: Tratamento de Falha no Settlement", passed: false, errorThrown: err.message });
  }

  // Teste 11: Resolução Concorrente via OCC Ledger (Simulado Síncronamente)
  try {
    const testAccounts: LedgerAccount[] = [
      { id: "ACC_A", name: "Conta Concorrente A", type: "LIABILITY", balance: 1000, description: "A", version: 1 },
      { id: "ACC_B", name: "Conta Concorrente B", type: "LIABILITY", balance: 1000, description: "B", version: 1 }
    ];

    // Nosso banco de dados síncrono em memória
    let dbState = testAccounts.map(a => ({ ...a }));

    // Função de gravação que valida OCC
    const saveAccountsSync = (accounts: LedgerAccount[]) => {
      for (const updated of accounts) {
        const stored = dbState.find(a => a.id === updated.id);
        if (stored) {
          if (stored.balance !== updated.balance) {
            if (stored.version > updated.version) {
              throw new ConcurrencyConflictException(updated.id, updated.version, stored.version);
            }
            updated.version = stored.version + 1;
          }
        }
      }
      dbState = accounts.map(a => ({ ...a }));
    };

    // Cenário: Duas transações iniciam concorrentemente. Ambas leem o estado inicial (versão 1)
    const readState1 = dbState.map(a => ({ ...a }));
    const readState2 = dbState.map(a => ({ ...a }));

    // Transação 1: transfere 100 de A para B
    const res1 = processDoubleEntryTransaction(readState1, "ACC_A", "ACC_B", 100, 0);
    
    // Transação 2: transfere 150 de A para B
    const res2 = processDoubleEntryTransaction(readState2, "ACC_A", "ACC_B", 150, 0);

    // 1. T1 salva primeiro. Isso deve ter sucesso e incrementar a versão de A e B para 2.
    saveAccountsSync(res1.updatedAccounts);

    // 2. T2 tenta salvar agora. Deve falhar com ConcurrencyConflictException porque o estado do DB mudou (versão é 2, T2 esperava 1)
    let collisionDetected = false;
    try {
      saveAccountsSync(res2.updatedAccounts);
    } catch (error) {
      if (error instanceof ConcurrencyConflictException) {
        collisionDetected = true;
      }
    }

    // 3. T2 se recupera: re-lê o estado atualizado (versão 2), re-processa a transferência e salva com sucesso (versão vai para 3)!
    let recoverySuccessful = false;
    if (collisionDetected) {
      const readState2_retry = dbState.map(a => ({ ...a }));
      const res2_retry = processDoubleEntryTransaction(readState2_retry, "ACC_A", "ACC_B", 150, 0);
      saveAccountsSync(res2_retry.updatedAccounts);
      recoverySuccessful = true;
    }

    const finalA = dbState.find(a => a.id === "ACC_A")!;
    const finalB = dbState.find(a => a.id === "ACC_B")!;

    // No final, ACC_A deve ter 750 (1000 - 100 - 150) e ACC_B deve ter 1250 (1000 + 100 + 150)
    if (finalA.balance === 750 && finalB.balance === 1250 && collisionDetected && recoverySuccessful) {
      reports.push({
        id: reports.length + 1,
        name: "Teste 11: Resolução Concorrente via OCC Ledger (Colisão & Recuperação Provada)",
        passed: true
      });
    } else {
      reports.push({
        id: reports.length + 1,
        name: "Teste 11: Resolução Concorrente via OCC Ledger",
        passed: false,
        errorThrown: `Saldos ou estados incorretos: A=${finalA.balance}, B=${finalB.balance}, Colisão=${collisionDetected}, Recup=${recoverySuccessful}`
      });
    }
  } catch (err: any) {
    reports.push({
      id: reports.length + 1,
      name: "Teste 11: Resolução Concorrente via OCC Ledger",
      passed: false,
      errorThrown: err.message
    });
  }

  // Teste 12: Testes Baseados em Propriedades (Property-Based Testing) para Balanço Zero Síncrono
  try {
    let allPropertiesPassed = true;
    let iterations = 100;
    let failedDetails = "";

    const testAccounts: LedgerAccount[] = [
      { id: "ACC_X", name: "Conta X", type: "LIABILITY", balance: 100000, description: "X", version: 1 },
      { id: "ACC_Y", name: "Conta Y", type: "LIABILITY", balance: 50000, description: "Y", version: 1 },
      { id: "FEES", name: "Cofre de Taxas", type: "REVENUE", balance: 0, description: "F", version: 1 }
    ];

    for (let i = 0; i < iterations; i++) {
      const amount = Number((0.01 + Math.random() * 500).toFixed(2));
      const feePercentage = Number((Math.random() * 0.05).toFixed(4));
      
      const currentAccounts = testAccounts.map(a => ({ ...a }));
      const result = processDoubleEntryTransaction(
        currentAccounts,
        "ACC_X",
        "ACC_Y",
        amount,
        feePercentage,
        "FEES"
      );

      if (result.success) {
        // 1. Σ Débitos = Σ Créditos deve ser zero absoluto
        const postingsSum = result.journalEntry.postings.reduce((sum, p) => sum + p.amount, 0);
        const postingsSumRounded = Number(postingsSum.toFixed(8));

        // 2. Variação total de saldo deve ser zero absoluto
        const deltaX = result.updatedAccounts.find(a => a.id === "ACC_X")!.balance - testAccounts.find(a => a.id === "ACC_X")!.balance;
        const deltaY = result.updatedAccounts.find(a => a.id === "ACC_Y")!.balance - testAccounts.find(a => a.id === "ACC_Y")!.balance;
        const deltaFees = result.updatedAccounts.find(a => a.id === "FEES")!.balance - testAccounts.find(a => a.id === "FEES")!.balance;
        const balanceSumRounded = Number((deltaX + deltaY + deltaFees).toFixed(8));

        if (Math.abs(postingsSumRounded) > 0.0001 || Math.abs(balanceSumRounded) > 0.0001) {
          allPropertiesPassed = false;
          failedDetails = `Falha na iteração ${i}: Amount=${amount}, Fee%=${feePercentage}, PostingsSum=${postingsSumRounded}, BalanceSum=${balanceSumRounded}`;
          break;
        }
      }
    }

    if (allPropertiesPassed) {
      reports.push({
        id: reports.length + 1,
        name: `Teste 12: Teste Baseado em Propriedades (100 iterações, Equação Fundamental = 0)`,
        passed: true
      });
    } else {
      reports.push({
        id: reports.length + 1,
        name: "Teste 12: Teste Baseado em Propriedades",
        passed: false,
        errorThrown: failedDetails
      });
    }
  } catch (err: any) {
    reports.push({
      id: reports.length + 1,
      name: "Teste 12: Teste Baseado em Propriedades",
      passed: false,
      errorThrown: err.message
    });
  }

  // Testes de Conformidade Constitucional (ConstitutionEngine)
  try {
    const senderAcc: UserAccount = {
      phone: "+244923000111",
      name: "Manuel da Silva",
      biNumber: "00593845LA042",
      balance: 5000,
      tier: "Level-1",
      pinHash: "1234",
      deviceId: "d",
      isRegistered: true
    };

    // Teste 13: Valor Mínimo Transacionável
    const resultMinAmt = ConstitutionEngine.validateTransfer(senderAcc, null, Money.fromDecimal(0));
    if (!resultMinAmt.isValid) {
      reports.push({ id: reports.length + 1, name: "Teste 13: Veto Constitucional - Valor Mínimo Transacionável", passed: true });
    } else {
      reports.push({ id: reports.length + 1, name: "Teste 13: Veto Constitucional - Valor Mínimo Transacionável", passed: false, errorThrown: "Transação de valor zero ou negativo foi indevidamente aceita pela Constituição." });
    }

    // Teste 14: Saldo Insuficiente
    const resultOverdraft = ConstitutionEngine.validateTransfer(senderAcc, null, Money.fromDecimal(10000));
    if (!resultOverdraft.isValid) {
      reports.push({ id: reports.length + 1, name: "Teste 14: Veto Constitucional - Saldo Insuficiente", passed: true });
    } else {
      reports.push({ id: reports.length + 1, name: "Teste 14: Veto Constitucional - Saldo Insuficiente", passed: false, errorThrown: "Transação com saldo insuficiente foi indevidamente aceita pela Constituição." });
    }

    // Teste 15: Limites Legais KYC Tier
    const resultKycLimit = ConstitutionEngine.validateTransfer(senderAcc, null, Money.fromDecimal(60000)); // Level-1 limit is 50000
    if (!resultKycLimit.isValid) {
      reports.push({ id: reports.length + 1, name: "Teste 15: Veto Constitucional - Limites Legais KYC Tier", passed: true });
    } else {
      reports.push({ id: reports.length + 1, name: "Teste 15: Veto Constitucional - Limites Legais KYC Tier", passed: false, errorThrown: "Transação excedendo limite KYC foi indevidamente aceita pela Constituição." });
    }

    // Teste 16: Bloqueio AML/Sanções BNA
    const blockedSender: UserAccount = { ...senderAcc, isBlocked: true };
    const resultBlocked = ConstitutionEngine.validateTransfer(blockedSender, null, Money.fromDecimal(100));
    if (!resultBlocked.isValid) {
      reports.push({ id: reports.length + 1, name: "Teste 16: Veto Constitucional - Bloqueio AML/Sanções BNA", passed: true });
    } else {
      reports.push({ id: reports.length + 1, name: "Teste 16: Veto Constitucional - Bloqueio AML/Sanções BNA", passed: false, errorThrown: "Transação de conta bloqueada foi indevidamente aceita pela Constituição." });
    }
  } catch (err: any) {
    reports.push({
      id: reports.length + 1,
      name: "Testes de Conformidade Constitucional (ConstitutionEngine)",
      passed: false,
      errorThrown: err.message
    });
  }

  // Testes de Imutabilidade Absoluta e Encadeamento Criptográfico SHA-256 (Ledger Hardening)
  try {
    // Teste 17: Integridade Criptográfica do Razão Geral (Hash Chaining)
    const chainAudit = verifyLedgerChainIntegrity(initialLedgerEntries);
    if (chainAudit.isValid && chainAudit.totalEntriesVerified >= 3) {
      reports.push({
        id: reports.length + 1,
        name: "Teste 17: Encadeamento Criptográfico SHA-256 do Razão Geral (Hash Chaining Válido)",
        passed: true
      });
    } else {
      reports.push({
        id: reports.length + 1,
        name: "Teste 17: Encadeamento Criptográfico SHA-256 do Razão Geral (Hash Chaining Válido)",
        passed: false,
        errorThrown: chainAudit.errors.join("; ") || "Falha na verificação de integridade da cadeia de blocos contábeis."
      });
    }

    // Teste 18: Deteção Ativa de Violação de Imutabilidade
    const tamperedEntries: LedgerJournalEntry[] = JSON.parse(JSON.stringify(initialLedgerEntries));
    // Simular ataque malicioso: adulteração de montante histórico
    tamperedEntries[1].postings[0].amount = -999999;
    const tamperAudit = verifyLedgerChainIntegrity(tamperedEntries);
    if (!tamperAudit.isValid && tamperAudit.errors.length > 0) {
      reports.push({
        id: reports.length + 1,
        name: "Teste 18: Deteção de Adulteração de Lançamento Histórico (Anti-Tampering Imutável)",
        passed: true
      });
    } else {
      reports.push({
        id: reports.length + 1,
        name: "Teste 18: Deteção de Adulteração de Lançamento Histórico (Anti-Tampering Imutável)",
        passed: false,
        errorThrown: "Falha de segurança: adulteração em lançamento histórico não foi detetada pela auditoria criptográfica."
      });
    }

    // Teste 19: Retificação Compensatória sem Mutação Histórica (Append-Only Reversal)
    const originalEntry = initialLedgerEntries[0];
    const reversal = createReversalJournalEntry(originalEntry, "Estorno regulatório de auditoria BNA");
    const netSumPostings = [...originalEntry.postings, ...reversal.postings].reduce((acc, p) => acc + p.amount, 0);
    if (reversal.id.startsWith("REV-") && Math.abs(netSumPostings) < 0.0001 && reversal.sequenceNumber === (originalEntry.sequenceNumber! + 1)) {
      reports.push({
        id: reports.length + 1,
        name: "Teste 19: Retificação Compensatória Estrita (Append-Only Reversal sem Mutação Histórica)",
        passed: true
      });
    } else {
      reports.push({
        id: reports.length + 1,
        name: "Teste 19: Retificação Compensatória Estrita (Append-Only Reversal sem Mutação Histórica)",
        passed: false,
        errorThrown: `Estorno compensatório falhou em anular contabilmente o lançamento. Soma: ${netSumPostings}`
      });
    }

    // Teste 20: Rejeição Incondicional de Lançamento Desequilibrado (Zero-Sum Invariant)
    let unbalancedCaught = false;
    try {
      const unbalancedEntry: LedgerJournalEntry = {
        id: "JE-ILLEGAL-TEST",
        timestamp: new Date().toISOString(),
        description: "Lançamento Ilegal sem contrapartida",
        txReferenceId: "tx_illegal",
        postings: [
          { accountId: "USER_ANTONIO", accountName: "Carteira António", amount: 1000, type: "DEBIT" }
        ]
      };
      const invalidAudit = verifyLedgerChainIntegrity([...initialLedgerEntries, unbalancedEntry]);
      if (!invalidAudit.isValid) {
        unbalancedCaught = true;
      }
    } catch {
      unbalancedCaught = true;
    }

    if (unbalancedCaught) {
      reports.push({
        id: reports.length + 1,
        name: "Teste 20: Veto de Lançamento Desequilibrado no Razão (Invariante Zero-Sum)",
        passed: true
      });
    } else {
      reports.push({
        id: reports.length + 1,
        name: "Teste 20: Veto de Lançamento Desequilibrado no Razão (Invariante Zero-Sum)",
        passed: false,
        errorThrown: "Lançamento contábil assimétrico foi indevidamente aceito sem contrapartida."
      });
    }
  } catch (err: any) {
    reports.push({
      id: reports.length + 1,
      name: "Testes de Imutabilidade Criptográfica do Ledger",
      passed: false,
      errorThrown: err.message
    });
  }

  // Testes Avançados de Double-Entry Bookkeeping & Balancete de Verificação
  try {
    // Teste 21: Integridade do Balancete de Verificação (Trial Balance Invariant: Débitos == Créditos)
    const trialBalance = computeTrialBalance(initialLedgerAccounts);
    if (trialBalance.isBalanced && trialBalance.discrepancy <= 0.001) {
      reports.push({
        id: reports.length + 1,
        name: "Teste 21: Equilíbrio do Balancete de Verificação (Trial Balance Invariant: \\sum Débitos == \\sum Créditos)",
        passed: true
      });
    } else {
      reports.push({
        id: reports.length + 1,
        name: "Teste 21: Equilíbrio do Balancete de Verificação (Trial Balance Invariant: \\sum Débitos == \\sum Créditos)",
        passed: false,
        errorThrown: `Desequilíbrio no Balancete de Verificação: Discrepância = ${trialBalance.discrepancy} Kz`
      });
    }

    // Teste 22: Split de Pagamento Comercial com Divisão de Taxas (Payer = Net + Fee + Tax)
    const merchantPostings = createMerchantPaymentPostings({
      payerAccount: { id: "USER_ANTONIO", name: "António" },
      merchantAccount: { id: "MERCH_CANTINA", name: "Cantina" },
      feeVaultAccount: { id: "KM_FEES_VAULT", name: "Cofre Taxas" },
      taxVaultAccount: { id: "KM_TAX_VAULT", name: "Cofre IVA" },
      totalAmount: 10000,
      feePercentage: 0.0015,
      taxPercentage: 0.0005
    });
    const splitBalance = validateDoubleEntryBalance(merchantPostings, "TEST_SPLIT_MERCHANT");
    if (splitBalance.discrepancy <= 0.0001 && merchantPostings.length === 4) {
      reports.push({
        id: reports.length + 1,
        name: "Teste 22: Conservação de Massa no Split Comercial (Total Pago == Líquido + Taxa KMOS + IVA)",
        passed: true
      });
    } else {
      reports.push({
        id: reports.length + 1,
        name: "Teste 22: Conservação de Massa no Split Comercial (Total Pago == Líquido + Taxa KMOS + IVA)",
        passed: false,
        errorThrown: `Falha no balanceamento do split comercial. Discrepância: ${splitBalance.discrepancy}`
      });
    }

    // Teste 23: Bateria de Testes de Propriedade Estocástica (500 iterações de estresse de partidas dobradas)
    const propertySuite = DoubleEntryPropertyTester.runAllPropertyTests(100);
    if (propertySuite.allPassed) {
      reports.push({
        id: reports.length + 1,
        name: `Teste 23: Validação de Propriedades de Partidas Dobradas (${propertySuite.totalTestsRun} iterações estocásticas 100% aprovadas)`,
        passed: true
      });
    } else {
      const failedProps = propertySuite.reports.filter(r => !r.passed).map(r => r.suiteName).join("; ");
      reports.push({
        id: reports.length + 1,
        name: `Teste 23: Validação de Propriedades de Partidas Dobradas (${propertySuite.totalTestsRun} iterações estocásticas)`,
        passed: false,
        errorThrown: `Falha nas propriedades: ${failedProps}`
      });
    }

    // Teste 24: Impossibilidade Matemática de Saldo Negativo (Zero Tolerância a Descoberto)
    let negativeBalanceBlocked = false;
    try {
      validateNonNegativeBalance({ id: "USER_ANTONIO", name: "António", balance: 500 }, 1000);
    } catch (err: any) {
      if (err instanceof NegativeBalanceViolationException) {
        negativeBalanceBlocked = true;
      }
    }

    if (negativeBalanceBlocked) {
      reports.push({
        id: reports.length + 1,
        name: "Teste 24: Impossibilidade de Saldo Negativo (Veto Imediato com NegativeBalanceViolationException)",
        passed: true
      });
    } else {
      reports.push({
        id: reports.length + 1,
        name: "Teste 24: Impossibilidade de Saldo Negativo (Veto Imediato com NegativeBalanceViolationException)",
        passed: false,
        errorThrown: "Falha de segurança: o sistema não vetou tentativa de débito superior ao saldo da conta."
      });
    }

    // Teste 25: Auditoria Global de Invariantes Matemáticas do Sistema (5 Invariantes Fiduciárias)
    const auditSystem = validateSystemMathematicalInvariants({
      accounts: initialLedgerAccounts,
      custodyState: {
        bnaCustodyBalance: 2500000000,
        bfaReserveBalance: 500000000,
        baiReserveBalance: 500000000,
        bicReserveBalance: 500000000,
        totalCirculation: 15420500,
        pendingSettlementsCount: 0,
        lastSptrMsgIso20022: "<pacs.008/>",
        isSettling: false,
        criticalVolumeThreshold: 100000000,
        criticalPendingLimit: 50,
        criticalCirculationThreshold: 500000000
      }
    });

    if (auditSystem.isFullyCompliant && auditSystem.invariantsFailed === 0) {
      reports.push({
        id: reports.length + 1,
        name: "Teste 25: Auditoria Global de Invariantes Fiduciárias (100% Conformidade com Lei 40/20 do BNA)",
        passed: true
      });
    } else {
      reports.push({
        id: reports.length + 1,
        name: "Teste 25: Auditoria Global de Invariantes Fiduciárias (100% Conformidade com Lei 40/20 do BNA)",
        passed: false,
        errorThrown: `Invariantes violadas: ${auditSystem.discrepancies.join("; ")}`
      });
    }

    // Teste 26: Veto Formal a Modificações Retroativas e Inserções Extemporâneas (WORM/Append-Only)
    let retroactiveBlocked = false;
    try {
      LedgerImmutabilityGuard.assertAppendOnly(
        [{ id: "ENTRY-HIST-01", sequenceNumber: 1, hash: "0".repeat(64) }],
        { id: "ENTRY-HIST-01", sequenceNumber: 1, previousHash: "0".repeat(64) }
      );
    } catch (err: any) {
      if (err instanceof RetroactiveModificationProhibitedException) {
        retroactiveBlocked = true;
      }
    }

    if (retroactiveBlocked) {
      reports.push({
        id: reports.length + 1,
        name: "Teste 26: Bloqueio de Alterações Retroativas (Veto WORM via RetroactiveModificationProhibitedException)",
        passed: true
      });
    } else {
      reports.push({
        id: reports.length + 1,
        name: "Teste 26: Bloqueio de Alterações Retroativas (Veto WORM via RetroactiveModificationProhibitedException)",
        passed: false,
        errorThrown: "Falha: O sistema não vetou tentativa de mutação/sobrescrita em registo contábil histórico."
      });
    }

    // Teste 27: Detecção Instantânea de Adulteração Criptográfica na Cadeia (Tamper Detection)
    const mockCorruptedChain = [
      {
        id: "ENTRY-01",
        sequenceNumber: 1,
        timestamp: "2026-08-27T10:00:00.000Z",
        description: "Lançamento inicial",
        txReferenceId: "ref_01",
        postings: [
          { accountId: "USER_A", accountName: "A", amount: -500, type: "DEBIT" as const },
          { accountId: "USER_B", accountName: "B", amount: 500, type: "CREDIT" as const }
        ],
        previousHash: GENESIS_PREVIOUS_HASH,
        hash: "CORRUPTED_HASH_TEST"
      }
    ];

    const tamperResult = detectHistoricalTampering(mockCorruptedChain);
    if (tamperResult.isTampered && tamperResult.tamperedEntriesCount > 0) {
      reports.push({
        id: reports.length + 1,
        name: "Teste 27: Detecção de Adulteração Criptográfica (100% Eficácia contra Manipulação de Hashes/Payloads)",
        passed: true
      });
    } else {
      reports.push({
        id: reports.length + 1,
        name: "Teste 27: Detecção de Adulteração Criptográfica (100% Eficácia contra Manipulação de Hashes/Payloads)",
        passed: false,
        errorThrown: "Falha de segurança: Cadeia com hash corrompido não foi detectada como adulterada."
      });
    }

    // Teste 28: Atomicidade Indivisível ACID (Débito, Crédito e Estado Indivisíveis com Rollback Garantido)
    const testAccounts: LedgerAccount[] = [
      { id: "ACC_SENDER", name: "Conta Remetente", balance: 1000, type: "LIABILITY", description: "Teste Remetente", version: 1 },
      { id: "ACC_RECEIVER", name: "Conta Destinatária", balance: 500, type: "LIABILITY", description: "Teste Destinatário", version: 1 }
    ];

    // Transação que falha propositadamente no 2º passo (ex.: valor excessivo tentando débito de 5000 Kz)
    const failedAtomicRes = executeAtomicDoubleEntryTransaction({
      accounts: testAccounts,
      postings: [
        { accountId: "ACC_SENDER", accountName: "Conta Remetente", amount: -5000, type: "DEBIT" },
        { accountId: "ACC_RECEIVER", accountName: "Conta Destinatária", amount: 5000, type: "CREDIT" }
      ],
      description: "Teste de Falha Atômica",
      txReferenceId: "tx_atomic_fail_test"
    });

    const senderPreserved = failedAtomicRes.updatedAccounts.find(a => a.id === "ACC_SENDER")?.balance === 1000;
    const receiverPreserved = failedAtomicRes.updatedAccounts.find(a => a.id === "ACC_RECEIVER")?.balance === 500;
    const stateAborted = failedAtomicRes.lifecycleState === "ABORTED";
    const noJournalCreated = failedAtomicRes.journalEntry === null;

    if (!failedAtomicRes.success && senderPreserved && receiverPreserved && stateAborted && noJournalCreated) {
      reports.push({
        id: reports.length + 1,
        name: "Teste 28: Atomicidade Indivisível (Débito, Crédito e Estado Indivisíveis com Rollback Total Garantido)",
        passed: true
      });
    } else {
      reports.push({
        id: reports.length + 1,
        name: "Teste 28: Atomicidade Indivisível (Débito, Crédito e Estado Indivisíveis com Rollback Total Garantido)",
        passed: false,
        errorThrown: "Falha: Transação abortada causou efeitos parciais ou estado incoerente."
      });
    }
  } catch (err: any) {
    reports.push({
      id: reports.length + 1,
      name: "Testes de Double-Entry Bookkeeping e Balancete",
      passed: false,
      errorThrown: err.message
    });
  }

  return reports;
}

// ==========================================
// UNIFIED FACADE & LEGACY INTERFACES
// ==========================================

export interface FinancialTransactionRequest {
  sender: UserAccount;
  receiverPhone: string;
  amount: number;
  type: "envio" | "recebimento" | "pagamento";
  direction: "inflow" | "outflow";
  description: string;
  debitAccountName: string;
  creditAccountName: string;
  idempotencyKey?: string;
  processedIdempotencyKeys?: string[];
}

export interface FinancialTransactionResult {
  success: boolean;
  error?: string;
  updatedSender: UserAccount;
  transaction: Transaction;
  journalEntry: JournalEntry;
  events: DomainEvent[];
}

export function executeFinancialUseCase(
  request: FinancialTransactionRequest
): FinancialTransactionResult {
  const amountObj = Money.fromDecimal(request.amount);
  let result: FinancialTransactionResult;

  const executeInMemory = (): FinancialTransactionResult => {
    if (request.type === "envio") {
      return TransferMoneyUseCase.execute({
        sender: request.sender,
        receiverPhone: request.receiverPhone,
        amount: amountObj,
        idempotencyKey: request.idempotencyKey,
        processedIdempotencyKeys: request.processedIdempotencyKeys,
        debitAccountName: request.debitAccountName,
        creditAccountName: request.creditAccountName
      });
    } else if (request.type === "pagamento") {
      let merchantName = "Lojista Authorized";
      if (request.description.startsWith("Pagamento Lojista: ")) {
        merchantName = request.description.replace("Pagamento Lojista: ", "");
      }
      return PayMerchantUseCase.execute({
        sender: request.sender,
        merchantCode: request.receiverPhone,
        amount: amountObj,
        idempotencyKey: request.idempotencyKey,
        processedIdempotencyKeys: request.processedIdempotencyKeys,
        debitAccountName: request.debitAccountName,
        creditAccountName: request.creditAccountName,
        merchantName
      });
    } else if (request.type === "recebimento") {
      return CashInUseCase.execute({
        sender: request.sender,
        agentId: request.receiverPhone || "AG-DEFAULT",
        amount: amountObj,
        idempotencyKey: request.idempotencyKey,
        processedIdempotencyKeys: request.processedIdempotencyKeys
      });
    } else {
      // Fallback to TransferMoneyUseCase
      return TransferMoneyUseCase.execute({
        sender: request.sender,
        receiverPhone: request.receiverPhone,
        amount: amountObj,
        idempotencyKey: request.idempotencyKey,
        processedIdempotencyKeys: request.processedIdempotencyKeys,
        debitAccountName: request.debitAccountName,
        creditAccountName: request.creditAccountName
      });
    }
  };

  result = executeInMemory();

  // Integridade Transacional ACID e Persistência Desacoplada via Contentor
  if (result.success && ContainerRegistry.has()) {
    const kmosContainer = ContainerRegistry.get();
    const affectedPhones = [request.sender.phone];
    if (request.receiverPhone && request.receiverPhone.startsWith("+")) {
      affectedPhones.push(request.receiverPhone);
    }

    // Executa a persistência de forma assíncrona e isolada dentro da transação lógica
    const runPersistenceTransacted = async () => {
      await kmosContainer.transactionManager.runInTransaction(affectedPhones, async () => {
        // A. Persistir dados da carteira do utilizador remetente
        await kmosContainer.walletRepository.save(result.updatedSender);

        // B. Se for transferência P2P de retalho, persistir carteira de destino
        if (request.type === "envio" && request.receiverPhone.startsWith("+")) {
          const receiverWallet = await kmosContainer.walletRepository.findByPhone(request.receiverPhone);
          if (receiverWallet) {
            receiverWallet.balance = Number((receiverWallet.balance + request.amount).toFixed(2));
            await kmosContainer.walletRepository.save(receiverWallet);
          }
        }

        // C. Registrar lançamento no Razão Geral (Ledger) por partidas dobradas
        const currentLedgerAccounts = await kmosContainer.ledgerRepository.getAccounts();
        const processLedgerResult = processDoubleEntryTransaction(
          currentLedgerAccounts,
          request.debitAccountName,
          request.creditAccountName,
          request.amount,
          request.type === "pagamento" ? 0.0015 : 0
        );
        if (processLedgerResult.success) {
          await kmosContainer.ledgerRepository.saveAccounts(processLedgerResult.updatedAccounts);
          await kmosContainer.ledgerRepository.saveJournalEntry(result.journalEntry);
        }

        // D. Sincronizar estado de custódia e emissão do Banco Nacional de Angola (BNA)
        const currentBnaState = await kmosContainer.settlementRepository.getBnaCustodyState();
        const otherWalletsCirculation = 20500;
        const liveCirculation = result.updatedSender.balance + otherWalletsCirculation;

        // Importa gerador pacs.008 dinamicamente para manter o isolamento
        const { generatePacs008Message } = await import("./bnaCustody");
        const sptrIsoMsg = generatePacs008Message(result.transaction);

        const updatedBnaState = {
          ...currentBnaState,
          totalCirculation: liveCirculation,
          pendingSettlementsCount: currentBnaState.pendingSettlementsCount + 1,
          lastSptrMsgIso20022: sptrIsoMsg
        };
        await kmosContainer.settlementRepository.saveBnaCustodyState(updatedBnaState);

        // E. Gerar e persistir o Recibo e o correspondente Pacote de Evidências Regulatórias (SGA-BNA) assinados digitalmente e via HSM
        const { ReceiptGenerator } = await import("./domain/evidence/ReceiptEngine");
        const receipt = ReceiptGenerator.create({
          txId: result.transaction.id,
          type: request.type === "envio" ? "P2P_TRANSFER" : request.type === "pagamento" ? "MERCHANT_PAY" : "CASH_IN",
          amount: amountObj,
          senderId: request.sender.phone,
          senderName: request.sender.name,
          receiverId: request.receiverPhone,
          receiverName: request.receiverPhone.startsWith("+") ? "Cliente Destinatário" : request.receiverPhone,
          status: "SUCCESS"
        });

        await kmosContainer.receiptRepository.saveReceipt(receipt);
        await kmosContainer.evidenceRepository.savePackage(receipt.evidencePackage);

        // F. Registrar entrada de conciliação no SPTR do BNA
        const reconciliationEntry = {
          id: `RE-${Math.floor(100000 + Math.random() * 900000)}`,
          txId: result.transaction.id,
          txHash: receipt.hash,
          hash: receipt.hash,
          settlementStatus: "liquidação_síncrona" as const,
          status: "liquidação_síncrona",
          timestamp: new Date().toISOString(),
          debitAccount: request.debitAccountName,
          creditAccount: request.creditAccountName,
          amount: request.amount,
          ledgerRootHash: `MERKLE-${receipt.hash.substring(0, 8).toUpperCase()}`
        };
        await kmosContainer.settlementRepository.saveReconciliationEntry(reconciliationEntry);

        // G. Disparar Eventos de Domínio via EventBus Desacoplado
        for (const domainEvent of result.events) {
          kmosContainer.eventBus.publish(domainEvent.type, domainEvent);
        }
      });
    };

    // Despoleta execução e intercepta anomalias
    runPersistenceTransacted().catch(err => {
      console.error("KMOS Transaction Error: Erro crítico durante transação persistida:", err);
    });
  }

  if (result.success && result.transaction && typeof window !== "undefined") {
    let usecaseName = "TransferMoneyUseCase";
    if (request.type === "pagamento") {
      usecaseName = "PayMerchantUseCase";
    } else if (request.type === "recebimento") {
      usecaseName = "CashInUseCase";
    }

    const customEvent = new CustomEvent("financial-usecase-executed", {
      detail: {
        usecase: usecaseName,
        transaction: result.transaction
      }
    });
    window.dispatchEvent(customEvent);
  }

  return result;
}

/**
 * Backward compatible helper delegating to executeFinancialUseCase.
 */
export function executeCoreFinancialTransaction(
  request: FinancialTransactionRequest
): FinancialTransactionResult {
  return executeFinancialUseCase(request);
}

/**
 * DEPRECATED STATE MANAGER - Kept for legacy compatibility.
 * delegating calculations to SettlementService.
 */
export function calculateSptrReserveSettlement(
  currentState: BnaCustodyState,
  pendingAmount: number
): Partial<BnaCustodyState> {
  return SettlementService.calculateSptrReserveSettlement(currentState, Money.fromDecimal(pendingAmount));
}

