/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface LegalBasis {
  ref: string;
  name: string;
  details: string;
}

export interface AdrReference {
  id: string;
  name: string;
  desc: string;
}

export interface VerificationTest {
  name: string;
  passed: boolean;
  notes: string;
}

export interface LedgerEntryItem {
  account: string;
  type: "DEBIT" | "CREDIT";
  amount: string;
}

export interface WalletSnapshot {
  sender: {
    phone: string;
    before: string;
    after: string;
  };
  receiver: {
    phone: string;
    before: string;
    after: string;
  };
}

export interface EvidencePackage {
  id: string;
  transactionId: string;
  receiptId: string;
  receiptVersion: number;
  correlationId: string;
  traceId: string;
  timestamp: string;
  ledgerEntries: LedgerEntryItem[];
  settlementReference: string;
  walletSnapshot: WalletSnapshot;
  laws: LegalBasis[];
  adrs: AdrReference[];
  tests: VerificationTest[];
  constitutionValidation: {
    status: string;
    rulesEvaluated: string[];
  };
  policyValidation: {
    status: string;
    limitsChecked: string;
    complianceOfficerApproved: boolean;
  };
  amlResult: {
    riskScore: number;
    notes: string;
  };
  riskAssessment: {
    tier: "LOW" | "MEDIUM" | "HIGH";
  };
  retentionPolicy: {
    holdPeriodYears: number;
    purgeDate: string;
  };
  logs: string[];
  complianceScore: number;
  hash: string;
  hsmSignature: string;
}
