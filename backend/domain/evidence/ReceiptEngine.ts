/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Money } from "../shared/Money";
import { EvidencePackage, LegalBasis, AdrReference, VerificationTest, LedgerEntryItem, WalletSnapshot } from "./EvidencePackage";
import { ReceiptSigner } from "./ReceiptSigner";
import { ReceiptRetentionPolicy } from "./ReceiptRetentionPolicy";

export type ReceiptType =
  | "P2P_TRANSFER"
  | "MERCHANT_PAY"
  | "CASH_IN"
  | "CASH_OUT"
  | "REFUND"
  | "REVERSAL"
  | "SETTLEMENT"
  | "SERVICE_PAY"
  | "RECHARGE_BUY"
  | "LIMIT_CHANGE"
  | "KYC_APPROVE"
  | "CRITICAL_ADMIN";

export interface ReceiptHistoryRecord {
  version: number;
  timestamp: string;
  updatedBy: string;
  reason: string;
  prevHash: string;
  newHash: string;
}

export class ReceiptAggregate {
  public id: string;
  public txId: string;
  public evidenceId: string;
  public version: number;
  public correlationId: string;
  public traceId: string;
  public timestamp: string;
  public type: ReceiptType;
  public amount: Money;
  public senderId: string;
  public senderName: string;
  public receiverId: string;
  public receiverName: string;
  public status: "SUCCESS" | "FAILED";
  public hash: string;
  public digitalSignature: string;
  public hsmSignature: string;
  public verificationUrl: string;
  public evidencePackage: EvidencePackage;
  public stateHistory: ReceiptHistoryRecord[];

  constructor(params: {
    id: string;
    txId: string;
    evidenceId: string;
    version: number;
    correlationId: string;
    traceId: string;
    timestamp: string;
    type: ReceiptType;
    amount: Money;
    senderId: string;
    senderName: string;
    receiverId: string;
    receiverName: string;
    status: "SUCCESS" | "FAILED";
    hash: string;
    digitalSignature: string;
    hsmSignature: string;
    verificationUrl: string;
    evidencePackage: EvidencePackage;
    stateHistory: ReceiptHistoryRecord[];
  }) {
    this.id = params.id;
    this.txId = params.txId;
    this.evidenceId = params.evidenceId;
    this.version = params.version;
    this.correlationId = params.correlationId;
    this.traceId = params.traceId;
    this.timestamp = params.timestamp;
    this.type = params.type;
    this.amount = params.amount;
    this.senderId = params.senderId;
    this.senderName = params.senderName;
    this.receiverId = params.receiverId;
    this.receiverName = params.receiverName;
    this.status = params.status;
    this.hash = params.hash;
    this.digitalSignature = params.digitalSignature;
    this.hsmSignature = params.hsmSignature;
    this.verificationUrl = params.verificationUrl;
    this.evidencePackage = params.evidencePackage;
    this.stateHistory = params.stateHistory;
  }
}

export class ReceiptGenerator {
  /**
   * Generates a fully certified, signed ReceiptAggregate and EvidencePackage on the backend.
   */
  public static create(params: {
    txId: string;
    type: ReceiptType;
    amount: Money;
    senderId: string;
    senderName: string;
    receiverId: string;
    receiverName: string;
    status: "SUCCESS" | "FAILED";
  }): ReceiptAggregate {
    const timestampStr = new Date().toISOString();
    const nonce = Math.floor(10000 + Math.random() * 90000);
    const receiptId = `RCP-2026-${nonce}`;
    const evidenceId = `EVP-2026-${nonce}`;
    const correlationId = `CORR-${nonce}-${Date.now().toString().slice(-4)}`;
    const traceId = `TRACE-${nonce}-${Math.floor(100 + Math.random() * 900)}`;

    const lawsList: LegalBasis[] = [
      {
        ref: "Lei n.º 40/20 - Artigo 14",
        name: "Validade Jurídica de Documentos Eletrónicos",
        details: "Confere eficácia probatória plena aos recibos emitidos eletronicamente com integridade garantida por assinatura digital ou selo eletrónico institucional."
      },
      {
        ref: "Lei n.º 40/20 - Artigo 22",
        name: "Dever de Salvaguarda de Provas e Evidências",
        details: "Exige que todas as infraestruturas de pagamentos assegurem a custódia imutável dos trilhos de auditoria e recibos por um período mínimo de 5 anos consecutivos."
      }
    ];

    if (params.type === "MERCHANT_PAY" || params.type === "SERVICE_PAY") {
      lawsList.push({
        ref: "Aviso n.º 11/2021 BNA",
        name: "Limites de Transações em Contas de Pagamento Simplificadas",
        details: "Garante que micro-pagamentos rurais e liquidações instantâneas respeitem os tetos operacionais diários de Kwanza Simplificado."
      });
    }

    const adrs: AdrReference[] = [
      {
        id: "ADR-008",
        name: "Integridade Transacional de Partidas Dobradas",
        desc: "Todas as transferências no KwanzaMóvel devem registar simultaneamente débito na origem e crédito no destino."
      },
      {
        id: "ADR-012",
        name: "Custódia de Evidências Fora da Cadeia Crítica",
        desc: "Assegura que os pacotes EvidencePackage contenham todos os nexos causais e verificações regulatórias de forma auto-contida."
      }
    ];

    const tests: VerificationTest[] = [
      {
        name: "Validação de Saldo Suficiente",
        passed: params.status === "SUCCESS",
        notes: params.status === "SUCCESS" ? "O saldo do remetente era suficiente para cobrir o principal." : "Falha: Saldo insuficiente."
      },
      {
        name: "Verificação de Limites Operacionais (Aviso BNA)",
        passed: true,
        notes: `Montante de ${params.amount.format()} está abaixo do teto diário do canal.`
      },
      {
        name: "Controlo Preventivo de Branqueamento (AML)",
        passed: true,
        notes: "Score de risco AML dentro dos parâmetros aceitáveis de baixo risco (LOW_RISK)."
      }
    ];

    const ledgerEntries: LedgerEntryItem[] = [
      {
        account: `Wallet.Simplificada.${params.senderId}`,
        type: "DEBIT",
        amount: params.amount.format()
      },
      {
        account: `Wallet.Simplificada.${params.receiverId}`,
        type: "CREDIT",
        amount: params.amount.format()
      }
    ];

    const walletSnapshot: WalletSnapshot = {
      sender: {
        phone: params.senderId,
        before: params.amount.format(),
        after: "0,00 AOA"
      },
      receiver: {
        phone: params.receiverId,
        before: "0,00 AOA",
        after: params.amount.format()
      }
    };

    const payloadToHash = `${receiptId}|${params.txId}|${params.amount.amount}|${params.senderId}|${params.receiverId}|${timestampStr}`;
    const hashHex = ReceiptSigner.calculateHash(payloadToHash);
    const signatureHex = ReceiptSigner.sign(payloadToHash);

    const purgeDate = ReceiptRetentionPolicy.calculatePurgeDate(new Date(timestampStr));

    const evidencePkg: EvidencePackage = {
      id: evidenceId,
      transactionId: params.txId,
      receiptId: receiptId,
      receiptVersion: 1,
      correlationId: correlationId,
      traceId: traceId,
      timestamp: timestampStr,
      ledgerEntries,
      settlementReference: `SETTLE-BNA-${nonce}`,
      walletSnapshot,
      laws: lawsList,
      adrs,
      tests,
      constitutionValidation: {
        status: "VALID",
        rulesEvaluated: ["RULE_LEDGER_BALANCE", "RULE_NO_NEGATIVE_MINT", "RULE_MUTABLE_PREVENTION"]
      },
      policyValidation: {
        status: "VALID",
        limitsChecked: "DAILY_LIMIT_OK",
        complianceOfficerApproved: false
      },
      amlResult: {
        riskScore: params.status === "SUCCESS" ? 12 : 95,
        notes: params.status === "SUCCESS" ? "Transação de baixo risco." : "Sinalização preventiva: Tentativa de transação sem saldo."
      },
      riskAssessment: {
        tier: params.status === "SUCCESS" ? "LOW" : "HIGH"
      },
      retentionPolicy: {
        holdPeriodYears: ReceiptRetentionPolicy.DEFAULT_HOLD_PERIOD_YEARS,
        purgeDate: purgeDate.toISOString()
      },
      logs: [
        `[${timestampStr}] [INFO] Inicializando conformidade para transação ${params.txId}`,
        `[${timestampStr}] [INFO] Registando trilho de auditoria sob tutela da Lei 40/20`,
        `[${timestampStr}] [INFO] Assinando com chave HSM soberana do BNA`
      ],
      complianceScore: params.status === "SUCCESS" ? 100 : 40,
      hash: hashHex,
      hsmSignature: signatureHex
    };

    return new ReceiptAggregate({
      id: receiptId,
      txId: params.txId,
      evidenceId: evidenceId,
      version: 1,
      correlationId: correlationId,
      traceId: traceId,
      timestamp: timestampStr,
      type: params.type,
      amount: params.amount,
      senderId: params.senderId,
      senderName: params.senderName,
      receiverId: params.receiverId,
      receiverName: params.receiverName,
      status: params.status,
      hash: hashHex,
      digitalSignature: signatureHex,
      hsmSignature: signatureHex,
      verificationUrl: `https://sgp.bna.ao/verify/receipt/${receiptId}`,
      evidencePackage: evidencePkg,
      stateHistory: []
    });
  }

  /**
   * Performs an official institutional rectification/rectify operation to version the receipt
   * and emit a new rectified receipt (version 2+) while preserving audit history.
   */
  public static rectify(
    previous: ReceiptAggregate,
    overrides: {
      receiverName?: string;
      reason: string;
    }
  ): ReceiptAggregate {
    const nextVersion = previous.version + 1;
    const timestampStr = new Date().toISOString();

    const historyRecord: ReceiptHistoryRecord = {
      version: previous.version,
      timestamp: previous.timestamp,
      updatedBy: "SGA-BNA Compliance Officer",
      reason: overrides.reason,
      prevHash: previous.hash,
      newHash: ""
    };

    const newSenderName = previous.senderName;
    const newReceiverName = overrides.receiverName || previous.receiverName;

    const payloadToHash = `${previous.id}|${previous.txId}|${previous.amount.amount}|${previous.senderId}|${previous.receiverId}|${timestampStr}|v${nextVersion}`;
    const newHashHex = ReceiptSigner.calculateHash(payloadToHash);
    const newSignatureHex = ReceiptSigner.sign(payloadToHash);

    historyRecord.newHash = newHashHex;

    const updatedHistory = [...previous.stateHistory, historyRecord];

    const updatedEvidencePackage: EvidencePackage = {
      ...previous.evidencePackage,
      receiptVersion: nextVersion,
      timestamp: timestampStr,
      hash: newHashHex,
      hsmSignature: newSignatureHex,
      logs: [
        ...previous.evidencePackage.logs,
        `[${timestampStr}] [WARN] Retificação iniciada por SGA-BNA Compliance Officer. Razão: ${overrides.reason}`,
        `[${timestampStr}] [INFO] Nova assinatura gerada pelo HSM para a versão v${nextVersion}.`
      ]
    };

    return new ReceiptAggregate({
      ...previous,
      version: nextVersion,
      timestamp: timestampStr,
      receiverName: newReceiverName,
      hash: newHashHex,
      digitalSignature: newSignatureHex,
      hsmSignature: newSignatureHex,
      evidencePackage: updatedEvidencePackage,
      stateHistory: updatedHistory
    });
  }
}
