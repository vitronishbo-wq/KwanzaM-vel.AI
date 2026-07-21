/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SpecSection {
  id: string;
  title: string;
  category: "arquitetura" | "regulamentacao" | "seguranca" | "negocio" | "operacao";
  icon: string;
  summary: string;
  content: string; // Extensive markdown text
}

export interface ChatMessage {
  id: string;
  sender: "user" | "gemini";
  text: string;
  timestamp: string;
}

// Double-Entry Ledger Entry (Partidas Dobradas)
export interface JournalEntry {
  id: string;
  txId: string;
  timestamp: string;
  description: string;
  debitAccount: string;  // Account receiving debit
  creditAccount: string; // Account receiving credit
  amount: number;
}

export interface TAccountLine {
  id: string;
  txId: string;
  timestamp: string;
  description: string;
  amount: number;
  type: "debit" | "credit";
}

export interface TAccount {
  accountName: string;
  accountType: "Asset" | "Liability" | "Equity" | "Revenue" | "Expense";
  lines: TAccountLine[];
  totalDebit: number;
  totalCredit: number;
  balance: number;
}

export interface LatencyDetails {
  totalMs: number;
  amlMs: number;
  ledgerMs: number;
  settlementMs: number;
  persistenceMs: number;
  uiMs: number;
}

export interface Transaction {
  id: string;
  senderPhone: string;
  receiverPhone: string;
  amount: number;
  type: "envio" | "recebimento" | "pagamento";
  status: "completed" | "processing" | "queued_offline" | "blocked_aml" | "mfa_required";
  timestamp: string;
  latencyMs: number;
  latencyDetails?: LatencyDetails;
  fraudScore: number;
  securityLog: string[];
  locationName?: string;
  latitude?: number;
  longitude?: number;
  isFraudAlert?: boolean;
  fraudAlertReason?: string;
  balanceAppliedOffline?: boolean;
  syncAttempts?: number;
  batchId?: string;
  correlationId?: string;
  traceId?: string;
  requestId?: string;
  sessionId?: string;
  failReason?: string;
  approvedBy?: string;
  systemVersion?: string;
  deviceUserAgent?: string;
}

export interface AccountRecoveryConfig {
  emailRecovery?: string;
  backupCodesCreated: boolean;
  backupCodesCount: number;
  biometricActive: boolean;
  trustedAgentOverride: boolean;
}

export interface UserAccount {
  phone: string;
  name: string;
  biNumber: string; // Angola ID National
  balance: number;
  tier: "Level-1" | "Level-2" | "Level-3";
  pinHash: string;
  deviceId: string;
  isRegistered: boolean;
  shortCode?: string; // e.g. "KM-4831"
  recoveryConfig?: AccountRecoveryConfig;
  dailySpendingLimit?: number;
  alternativeSmsPhone?: string;
  smsNotificationsEnabled?: boolean;
  biometricPaymentAuthEnabled?: boolean;
  webauthnCredentialsJson?: string;
  isBlocked?: boolean;
}

export interface SyncBatch {
  id: string;
  timestamp: string;
  txCount: number;
  totalAmount: number;
  status: "PENDING" | "SYNCING" | "COMPLETED" | "FAILED";
  networkRetries: number;
  atomicIntegrityVerified: boolean;
  systemMessage: string;
  txIds: string[];
  checksumHash?: string;
  checksumVerified?: boolean;
}

// BNA Custody and Settlement Simulation state
export interface BnaCustodyState {
  bnaCustodyBalance: number;       // Direct backed cash in BNA custody account
  bfaReserveBalance: number;       // Reserves kept in BFA
  baiReserveBalance: number;       // Reserves kept in BAI
  bicReserveBalance: number;       // Reserves kept in BIC
  totalCirculation: number;        // Sum of all user wallets
  pendingSettlementsCount: number; // Count of real-time transactions needing CCI/SPTR batch settlement
  lastSptrMsgIso20022: string;     // ISO 20022 PACS.008 XML format representation
  isSettling: boolean;
  criticalVolumeThreshold: number; // Critical daily transaction volume in Kwanzas
  criticalPendingLimit: number;    // Critical number of pending settlements before alerting
  criticalCirculationThreshold: number; // Critical total circulation volume threshold
  criticalLiquidityThreshold?: number; // Critical liquidity ratio threshold (%)
  largeTxThreshold?: number; // Configurable limit for highlighting high value transactions
  fraudEnabled?: boolean;         // Overall toggle for BNA fraud detection rules
  fraudGeoVelocityLimit?: number; // Maximum speed limit in km/h allowed between subsequent transactions
  fraudTxFrequencyLimit?: number; // Maximum transaction frequency (number of transactions)
  fraudTxTimeWindow?: number;     // Time window in seconds for frequency detection (e.g. 60s)
  syncBatches?: SyncBatch[];
}

export interface ReconciliationLog {
  id: string; // unique identification
  timestamp: string; // ISO string 
  cycleId: string; // e.g. RC-2026-622-001
  totalInstructionsBalance: number; // Sum of user balances / circulation instructed
  bnaCustodyBalance: number; // Direct cash backing in BNA
  bfaReserveBalance: number; // Reserves in BFA
  baiReserveBalance: number; // Reserves in BAI
  bicReserveBalance: number; // Reserves in BIC
  totalCustodyReserves: number; // total backing (bna + bfa + bai + bic)
  discrepancy: number; // totalCustodyReserves - totalInstructionsBalance (must always be positive or equal)
  status: "reconciled" | "discrepancy_alert" | "pending";
  complianceStatement: string; // compliance declaration reaffirming zero-deposit ownership (instruction-only compliance)
  auditedBy: string; // e.g. "SGA BNA Automated Auditor"
  remarks: string; // description
}

export interface ReconciliationEntry {
  id: string; // Unique entry ID (hash or uuid)
  txId: string; // Reference to original transaction ID
  txHash: string; // SHA-256 / SHA-1 cryptographic sequence simulation for imutability
  settlementStatus: "liquidação_síncrona" | "liquidado_custodia" | "pendente" | "reconciliado_bna";
  timestamp: string; // UTC ISO String
  debitAccount: string; // e.g. "Wallet Manuel da Silva (Ativo)"
  creditAccount: string; // e.g. "Compensações Gerais de Saída"
  amount: number; // exact transaction amount in Kwanzas
  ledgerRootHash: string; // Simulated Merkle Root
}

// ==========================================
// PURE DOMAIN & FINANCIAL CORE TYPES (FASE 2.5)
// ==========================================

export interface DomainEvent {
  id: string;
  type: "PaymentRequested" | "BalanceReserved" | "LedgerCommitted" | "SettlementCompleted";
  timestamp: string;
  payload: any;
}

export interface WalletAggregate {
  id: string; // phone
  ownerName: string;
  balance: number;
  tier: "Level-1" | "Level-2" | "Level-3";
  deviceId: string;
  dailySpendingLimit?: number;
}

export interface LedgerAggregate {
  entries: JournalEntry[];
  tAccounts: TAccount[];
}

export interface SettlementAggregate {
  id: string; // batchId or settlementId
  amount: number;
  status: "PENDING" | "PROCESSING" | "SETTLED" | "FAILED";
  timestamp: string;
  clearingSignature: string;
}

export interface MerchantAggregate {
  code: string;
  name: string;
  balance: number;
  type: string;
}

export interface AgentAggregate {
  id: string;
  name: string;
  location: string;
  liquidityBalance: number;
}

export interface IdentityAggregate {
  biNumber: string;
  name: string;
  verified: boolean;
  tier: "Level-1" | "Level-2" | "Level-3";
}

export interface LiquidityPoolAggregate {
  poolId: string;
  totalReserves: number;
  allocatedBanks: { bankName: string; balance: number }[];
}

export interface ReconciliationBatchAggregate {
  batchId: string;
  timestamp: string;
  instructionsSum: number;
  custodySum: number;
  discrepancy: number;
  status: "reconciled" | "discrepancy_alert";
}



