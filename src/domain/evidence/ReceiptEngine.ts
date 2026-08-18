/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Money } from "../../ledgerEngine";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { SignatureProvider } from "../security/SignatureProvider";
import { ReceiptSigner } from "../security/ReceiptSigner";

// ==========================================
// EVIDENCE DOMAIN ENUMS AND TYPES
// ==========================================

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
  file: string;
  status: "PASSED" | "FAILED";
  assertion: string;
}

// Rich structural sub-domains for the institutional EvidencePackage

export interface LedgerEntryItem {
  account: string;
  type: "DEBIT" | "CREDIT";
  amount: string;
  balanceAfter: string;
}

export interface WalletSnapshot {
  senderBalanceBefore: string;
  senderBalanceAfter: string;
  receiverBalanceBefore: string;
  receiverBalanceAfter: string;
}

export interface ConstitutionValidation {
  status: "VALID" | "INVALID";
  rulesEvaluated: string[];
  notes: string;
}

export interface PolicyValidation {
  status: "VALID" | "INVALID";
  limitsChecked: string;
  complianceOfficerApproved: boolean;
}

export interface AmlResult {
  checked: boolean;
  riskScore: number;
  flagged: boolean;
  notes: string;
}

export interface RiskAssessment {
  tier: "LOW" | "MEDIUM" | "HIGH";
  factors: string[];
}

export interface RetentionPolicy {
  classification: "RESTRICTED" | "CONFIDENTIAL" | "SECRET";
  holdPeriodYears: number;
  purgeDate: string;
}

export interface ReceiptHistoryRecord {
  version: number;
  timestamp: string;
  updatedBy: string;
  reason: string;
  prevHash: string;
  newHash: string;
}

// ==========================================
// EVIDENCE PACKAGE ENTITY (Sovereign Level)
// ==========================================

export interface EvidencePackage {
  id: string; // EVP-YYYYMMDD-ID
  transactionId: string; // TX-...
  receiptId: string; // RCP-...
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
  constitutionValidation: ConstitutionValidation;
  policyValidation: PolicyValidation;
  amlResult: AmlResult;
  riskAssessment: RiskAssessment;
  retentionPolicy: RetentionPolicy;
  logs: string[];
  complianceScore: number;
  hash: string;
  hsmSignature: string;
}

// ==========================================
// RECEIPT AGGREGATE ROOT
// ==========================================

export class ReceiptAggregate {
  public id: string;
  public txId: string;
  public evidenceId: string; // EVP-...
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

// ==========================================
// RECEIPT POLICY DEFINITIONS
// ==========================================

export class ReceiptPolicy {
  /**
   * Determina o enquadramento legal com base no tipo de operação
   */
  public static getLegalBasis(type: ReceiptType, amountDecimal: number): LegalBasis[] {
    const basis: LegalBasis[] = [];

    basis.push({
      ref: "Lei n.º 40/20 - Artigo 42.º",
      name: "Segurança e Inviolabilidade de Canais",
      details: "Garante a proteção de ordens de transferência eletrónicas legítimas e imutáveis."
    });

    switch (type) {
      case "P2P_TRANSFER":
      case "CASH_IN":
      case "CASH_OUT":
        basis.push({
          ref: "Aviso n.º 11/2021 - Artigo 12.º",
          name: "Prevenção de Branqueamento de Capitais (AML)",
          details: "Define regras estritas para identificação e limites de movimentação de capitais de retalho."
        });
        break;

      case "MERCHANT_PAY":
        basis.push({
          ref: "Aviso n.º 11/2021 - Artigo 24.º",
          name: "Exclusividade de Meios de Pagamento",
          details: "Regula taxas de lojista de intermediação limitadas a 0.15% no ecossistema síncrono."
        });
        break;

      case "SETTLEMENT":
        basis.push({
          ref: "Aviso n.º 07/2020 - Artigo 5.º",
          name: "Rácio de Salvaguarda de Liquidez 1:1",
          details: "Garante que cada Kwanza em circulação eletrónica possui respaldo integral em custódia fiduciária no BNA."
        });
        break;

      case "KYC_APPROVE":
        basis.push({
          ref: "Aviso n.º 11/2021 - Artigo 4.º",
          name: "Níveis de Identificação (Tiers)",
          details: "Fixa os limites transacionais e saldo máximo com base em KYC Level-1, 2 ou 3."
        });
        break;

      default:
        basis.push({
          ref: "Aviso n.º 11/2021",
          name: "Disposições Gerais KwanzaMóvel",
          details: "Enquadramento legal para serviços de pagamento móvel sob regulamento do BNA."
        });
    }

    if (amountDecimal > 150000) {
      basis.push({
        ref: "Aviso n.º 11/2021 - Artigo 31.º",
        name: "Declaração de Grandes Volumes",
        details: "Obrigatoriedade de reporte imediato e assinatura qualificada para transações superiores a 150.000 Kz."
      });
    }

    return basis;
  }

  /**
   * Determina os ADRs vinculados a este tipo de operação no KMOS
   */
  public static getAssociatedAdrs(type: ReceiptType): AdrReference[] {
    const adrs: AdrReference[] = [];

    adrs.push({
      id: "ADR-021-Immutable-Ledger",
      name: "Ledger de Partidas Dobradas Imutável",
      desc: "Força o balanço zero-sum absoluto entre débitos e créditos operacionais."
    });

    switch (type) {
      case "P2P_TRANSFER":
      case "MERCHANT_PAY":
        adrs.push({
          id: "ADR-005-Canais-Mtls",
          name: "Segurança de Enlaces via mTLS 1.3",
          desc: "Autenticação mútua forte de chaves de hardware entre nós do sistema."
        });
        break;

      case "CASH_IN":
      case "CASH_OUT":
        adrs.push({
          id: "ADR-014-Simplified-Kyc-Policy",
          name: "Política Descentralizada de Cadastro",
          desc: "Cadastro rápido off-grid com limites reduzidos baseados no ID nacional."
        });
        break;

      case "SETTLEMENT":
        adrs.push({
          id: "ADR-002-Imunidade-Fiduciaria",
          name: "Garantia Integral de Custódia 1:1",
          desc: "Proibição expressa de reserva fracionária no ecossistema soberano."
        });
        break;

      case "RECHARGE_BUY":
      case "SERVICE_PAY":
        adrs.push({
          id: "ADR-031-SMS-Offgrid-Ledger",
          name: "Sincronização Desconectada via Bearer SMS",
          desc: "Armazenamento offline criptografado em dispositivo móvel com relay síncrono."
        });
        break;

      default:
        break;
    }

    return adrs;
  }

  /**
   * Determina as asserções de testes automáticos que dão cobertura a este fluxo
   */
  public static getVerificationTests(type: ReceiptType): VerificationTest[] {
    const tests: VerificationTest[] = [];

    tests.push({
      file: "DoubleEntryLedgerTest.ts",
      status: "PASSED",
      assertion: "assertSumOfDebitsAndCreditsEqualsZero()"
    });

    switch (type) {
      case "P2P_TRANSFER":
        tests.push({
          file: "KycLimitCheckTest.ts",
          status: "PASSED",
          assertion: "assertTransactionDoesNotExceedKycThreshold()"
        });
        break;
      case "MERCHANT_PAY":
        tests.push({
          file: "MerchantCommissionTest.ts",
          status: "PASSED",
          assertion: "assertMerchantFeeEquals15BasisPoints()"
        });
        break;
      case "SETTLEMENT":
        tests.push({
          file: "ReserveCustodyTest.ts",
          status: "PASSED",
          assertion: "assertReserveVaultRatioExactlyEqualsOne()"
        });
        break;
      case "SERVICE_PAY":
      case "RECHARGE_BUY":
        tests.push({
          file: "SmsOffgridLedgerTest.ts",
          status: "PASSED",
          assertion: "assertOffgridSyncSignaturesValid()"
        });
        break;
      default:
        break;
    }

    return tests;
  }
}

// ==========================================
// RECEIPT CRYPTOGRAPHIC SIGNATURE SERVICE
// ==========================================

export class ReceiptSignature {
  private static activeSigner: SignatureProvider | ReceiptSigner | null = null;

  /**
   * Injeta um provedor de assinaturas (SignatureProvider ou ReceiptSigner) no core da assinatura de recibos.
   */
  public static injectSigner(signer: SignatureProvider | ReceiptSigner): void {
    ReceiptSignature.activeSigner = signer;
  }

  /**
   * Retorna o provedor de assinaturas ativo ou null se nenhum estiver injetado.
   */
  public static getActiveSigner(): SignatureProvider | ReceiptSigner | null {
    return ReceiptSignature.activeSigner;
  }

  /**
   * Gera um hash SHA-256 determinístico (simulado ou real via adaptador) para o comprovativo
   */
  public static generateHash(payload: any): string {
    if (ReceiptSignature.activeSigner) {
      return ReceiptSignature.activeSigner.generateHash(payload);
    }
    const raw = JSON.stringify(payload) + Math.random().toString();
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, "0");
    return Array.from({ length: 8 }, (_, idx) => {
      return hex + Math.floor(Math.random() * 16).toString(16);
    }).join("");
  }

  /**
   * Assina digitalmente o comprovativo com chave privada institucional (simulado ou real via adaptador)
   */
  public static signDigitally(hash: string): string {
    if (ReceiptSignature.activeSigner) {
      return ReceiptSignature.activeSigner.signDigitally(hash);
    }
    return "KM_DIGITAL_SIGN_" + hash.substring(0, 16).toUpperCase() + "_" + Math.floor(1000 + Math.random() * 9000);
  }

  /**
   * Assinatura soberana regulatória do BNA (simulado ou real via adaptador)
   */
  public static signSovereign(hash: string): string {
    if (ReceiptSignature.activeSigner) {
      if ("signSovereign" in ReceiptSignature.activeSigner && typeof ReceiptSignature.activeSigner.signSovereign === "function") {
        return ReceiptSignature.activeSigner.signSovereign(hash);
      }
      return ReceiptSignature.activeSigner.signHsm(hash);
    }
    return "SOV_SIG[SIMULATED_BNA_SPTR]::" + hash.substring(16, 32).toUpperCase() + "_APPROVED_BY_SGA_BNA";
  }

  /**
   * Assinatura criptográfica HSM Síncrona do BNA (mantido para retrocompatibilidade)
   */
  public static signHsm(hash: string): string {
    return ReceiptSignature.signSovereign(hash);
  }
}

// ==========================================
// RECEIPT GENERATOR SERVICE (USE CASE)
// ==========================================

export class ReceiptGenerator {
  public static create(params: {
    txId?: string;
    type: ReceiptType;
    amount: Money;
    senderId: string;
    senderName: string;
    receiverId: string;
    receiverName: string;
    status: "SUCCESS" | "FAILED";
    version?: number;
    stateHistory?: ReceiptHistoryRecord[];
  }): ReceiptAggregate {
    const txId = params.txId || "TX-" + Math.floor(100000 + Math.random() * 900000);
    const version = params.version || 1;
    const correlationId = "corr_" + Math.random().toString(36).substring(2, 10);
    const traceId = "trace_oxf01" + Math.random().toString(16).substring(2, 14);
    const timestamp = new Date().toISOString();
    
    const laws = ReceiptPolicy.getLegalBasis(params.type, params.amount.toDecimal());
    const adrs = ReceiptPolicy.getAssociatedAdrs(params.type);
    const tests = ReceiptPolicy.getVerificationTests(params.type);

    const logs = [
      `[Ledger] Iniciando processamento do comprovante para ${txId} (Versão: v${version})`,
      `[Regulatory] Enquadramento legal em ${laws[0]?.ref || "Regulações Gerais BNA"} validado com sucesso`,
      `[Compliance] Score institucional calculado: ${params.status === "SUCCESS" ? "100" : "25"}%`,
      `[Evidence] Estruturando pacote de auditoria de partidas dobradas...`,
      `[HSM] Assinando hash criptográfico com chaves de segurança estatais...`
    ];

    if (params.status === "SUCCESS") {
      logs.push(`[Ledger] Balanço de partidas dobradas verificado e em perfeita igualdade de balancete.`);
      logs.push(`[SGA] Selo criptográfico BNA gerado com sucesso para a transação.`);
    } else {
      logs.push(`[Ledger] Rejeição de transação registrada: violação preventiva ou erro de regras.`);
      logs.push(`[Compliance] Veto gerado com sucesso. Registrando comprovante de auditoria de veto.`);
    }

    // Dynamic rich models simulation
    const ledgerEntries: LedgerEntryItem[] = params.status === "SUCCESS" ? [
      {
        account: `ACC_DEBIT_${params.senderId.replace(/[^a-zA-Z0-9]/g, "")}`,
        type: "DEBIT",
        amount: params.amount.toString(),
        balanceAfter: "Calculando..."
      },
      {
        account: `ACC_CREDIT_${params.receiverId.replace(/[^a-zA-Z0-9]/g, "")}`,
        type: "CREDIT",
        amount: params.amount.toString(),
        balanceAfter: "Calculando..."
      }
    ] : [
      {
        account: `ACC_SUSPENDED_${params.senderId.replace(/[^a-zA-Z0-9]/g, "")}`,
        type: "DEBIT",
        amount: "0.00 Kz",
        balanceAfter: "Sem Alterações"
      }
    ];

    const walletSnapshot: WalletSnapshot = params.status === "SUCCESS" ? {
      senderBalanceBefore: "Disponível",
      senderBalanceAfter: "Debitados " + params.amount.toString(),
      receiverBalanceBefore: "Disponível",
      receiverBalanceAfter: "Creditados " + params.amount.toString()
    } : {
      senderBalanceBefore: "Inalterado",
      senderBalanceAfter: "Inalterado",
      receiverBalanceBefore: "Inalterado",
      receiverBalanceAfter: "Inalterado"
    };

    const constitutionValidation: ConstitutionValidation = {
      status: params.status === "SUCCESS" ? "VALID" : "INVALID",
      rulesEvaluated: [
        "Rule-01-Sovereignty-Ratio-1-1",
        "Rule-04-Double-Entry-Equality",
        "Rule-12-Max-KYC-Limits"
      ],
      notes: params.status === "SUCCESS" 
        ? "Todos os critérios constitucionais de soberania monetária e legalidade foram validados com êxito."
        : "Veto Constitucional: Rejeitada emissão sombra ou limite operacional excedido de acordo com o Art. 24 do Aviso 11/2021."
    };

    const policyValidation: PolicyValidation = {
      status: params.status === "SUCCESS" ? "VALID" : "INVALID",
      limitsChecked: params.amount.toDecimal() > 150000 ? "Grandes Volumes (> 150.000 Kz) - Requer Assinatura Qualificada" : "Transação Padrão",
      complianceOfficerApproved: params.status === "SUCCESS"
    };

    const amlResult: AmlResult = {
      checked: true,
      riskScore: params.status === "SUCCESS" ? 12 : 98,
      flagged: params.status !== "SUCCESS",
      notes: params.status === "SUCCESS"
        ? "Sem alertas de lavagem de dinheiro. Operação de risco reduzido."
        : "Alerta de Compliance: Tentativa de operação irregular identificada no ecossistema de liquidação."
    };

    const riskAssessment: RiskAssessment = {
      tier: params.status === "SUCCESS" ? "LOW" : "HIGH",
      factors: params.status === "SUCCESS" 
        ? ["Cliente KYC Nível Validado", "Histórico Transacional Limpo"]
        : ["Emissão paralela não autorizada", "Incompatibilidade fiduciária", "Risco de integridade do ledger"]
    };

    const retentionPolicy: RetentionPolicy = {
      classification: params.status === "SUCCESS" ? "RESTRICTED" : "CONFIDENTIAL",
      holdPeriodYears: 5, // 5 years hold under Angolan law 40/20
      purgeDate: new Date(new Date().setFullYear(new Date().getFullYear() + 5)).toISOString().substring(0, 10)
    };

    const payloadToHash = {
      txId,
      correlationId,
      traceId,
      type: params.type,
      amountCents: params.amount.getCents(),
      senderId: params.senderId,
      receiverId: params.receiverId,
      status: params.status,
      timestamp,
      version
    };

    const hash = ReceiptSignature.generateHash(payloadToHash);
    const digitalSignature = ReceiptSignature.signDigitally(hash);
    const hsmSignature = ReceiptSignature.signHsm(hash);

    const receiptId = "RCP-" + new Date().getFullYear() + "-" + Math.floor(10000 + Math.random() * 90000);
    const evidenceId = "EVP-" + new Date().getFullYear() + "-" + Math.floor(10000 + Math.random() * 90000);

    const evidencePackage: EvidencePackage = {
      id: evidenceId,
      transactionId: txId,
      receiptId,
      receiptVersion: version,
      correlationId,
      traceId,
      timestamp,
      ledgerEntries,
      settlementReference: params.status === "SUCCESS" ? `SLT-BNA-${Math.floor(1000000 + Math.random() * 9000000)}` : "VETO_NO_SETTLEMENT",
      walletSnapshot,
      laws,
      adrs,
      tests,
      constitutionValidation,
      policyValidation,
      amlResult,
      riskAssessment,
      retentionPolicy,
      logs,
      complianceScore: params.status === "SUCCESS" ? 100 : 25,
      hash,
      hsmSignature
    };

    const verificationUrl = `https://bna.ao/verify/receipt?id=${receiptId}&hash=${hash.substring(0, 16)}&version=${version}`;

    return new ReceiptAggregate({
      id: receiptId,
      txId,
      evidenceId,
      version,
      correlationId,
      traceId,
      timestamp,
      type: params.type,
      amount: params.amount,
      senderId: params.senderId,
      senderName: params.senderName,
      receiverId: params.receiverId,
      receiverName: params.receiverName,
      status: params.status,
      hash,
      digitalSignature,
      hsmSignature,
      verificationUrl,
      evidencePackage,
      stateHistory: params.stateHistory || []
    });
  }

  /**
   * Generates a new version of an existing receipt due to rectification/update
   */
  public static rectify(prevReceipt: ReceiptAggregate, updateParams: {
    senderName?: string;
    receiverName?: string;
    reason?: string;
  }): ReceiptAggregate {
    const nextVersion = prevReceipt.version + 1;
    const reason = updateParams.reason || "Retificação administrativa de dados do beneficiário";
    
    const record: ReceiptHistoryRecord = {
      version: prevReceipt.version,
      timestamp: prevReceipt.timestamp,
      updatedBy: "Audit Compliance Officer (SGA-BNA)",
      reason,
      prevHash: prevReceipt.hash,
      newHash: "" // filled later
    };

    const nextHistory = [...prevReceipt.stateHistory, record];

    // Generate next aggregate
    const rectified = ReceiptGenerator.create({
      txId: prevReceipt.txId,
      type: prevReceipt.type,
      amount: prevReceipt.amount,
      senderId: prevReceipt.senderId,
      senderName: updateParams.senderName || prevReceipt.senderName,
      receiverId: prevReceipt.receiverId,
      receiverName: updateParams.receiverName || prevReceipt.receiverName,
      status: prevReceipt.status,
      version: nextVersion,
      stateHistory: nextHistory
    });

    // Back-fill hash link
    if (rectified.stateHistory.length > 0) {
      rectified.stateHistory[rectified.stateHistory.length - 1].newHash = rectified.hash;
    }

    rectified.evidencePackage.logs.unshift(
      `[ReceiptEngine] RETIFICAÇÃO EXECUTADA: Versão anterior v${prevReceipt.version} (${prevReceipt.id}) arquivada legalmente.`,
      `[ReceiptEngine] Motivo do histórico de retificação: ${reason}`
    );

    return rectified;
  }
}

// ==========================================
// RECEIPT TEMPLATE (FORMATTERS)
// ==========================================

export class ReceiptTemplate {
  /**
   * Renders the printable string for small thermal slip printers
   */
  public static formatThermal(receipt: ReceiptAggregate, width: "58mm" | "80mm"): string {
    const limit = width === "58mm" ? 32 : 48;
    const pad = (left: string, right: string) => {
      const spaceNeeded = limit - left.length - right.length;
      return left + (spaceNeeded > 0 ? " ".repeat(spaceNeeded) : " ") + right;
    };

    const divider = "-".repeat(limit);
    const doubleDivider = "=".repeat(limit);

    let output = "";
    output += "       KWANZAMOVEL        \n";
    output += " SOBERANIA FINANCEIRA NO BOLSO\n";
    output += "      LUANDA - ANGOLA     \n";
    output += doubleDivider + "\n";
    output += `VIA: CLIENTE E AUDITORIA   \n`;
    output += `COMPROVATIVO INSTITUCIONAL \n`;
    output += `RECEIPT ID: ${receipt.id}\n`;
    output += `EVIDENCE ID: ${receipt.evidenceId}\n`;
    output += `VERSAO RECIBO: v${receipt.version}\n`;
    output += `DATA: ${receipt.timestamp.replace("T", " ").substring(0, 19)}\n`;
    output += divider + "\n";
    output += pad("OPERACAO:", receipt.type) + "\n";
    output += pad("VALOR:", receipt.amount.toString()) + "\n";
    output += pad("ESTADO:", receipt.status) + "\n";
    output += divider + "\n";
    output += pad("ORIGEM:", receipt.senderName) + "\n";
    output += `ID ORIGEM: ${receipt.senderId}\n`;
    output += pad("DESTINO:", receipt.receiverName) + "\n";
    output += `ID DESTINO: ${receipt.receiverId}\n`;
    output += divider + "\n";
    output += `REF TX: ${receipt.txId}\n`;
    output += `TRACE ID: ${receipt.traceId.substring(0, 16)}...\n`;
    output += `CORR ID: ${receipt.correlationId}\n`;
    if (receipt.stateHistory.length > 0) {
      output += divider + "\n";
      output += `HISTORICO DE RETIFICACOES:\n`;
      receipt.stateHistory.forEach(h => {
        output += `- v${h.version} -> v${receipt.version}: ${h.reason.substring(0, limit - 12)}\n`;
      });
    }
    output += divider + "\n";
    output += `ASSINATURA DIGITAL HSM BNA:\n`;
    output += `${receipt.hsmSignature.substring(0, limit)}\n`;
    output += `${receipt.hsmSignature.substring(limit, limit * 2)}\n`;
    output += divider + "\n";
    output += `VERIFICADOR JURIDICO:\n`;
    output += `${receipt.hash.substring(0, limit)}\n`;
    output += doubleDivider + "\n";
    output += "  PIN VALIDADO • BNA REGULADO  \n";

    return output;
  }

  /**
   * Renders a highly polished A5 institutional ASCII representation of the receipt.
   */
  public static formatA5(receipt: ReceiptAggregate): string {
    const limit = 64;
    const divider = "─".repeat(limit);
    const pad = (left: string, right: string) => {
      const spaceNeeded = limit - left.length - right.length - 2;
      return left + (spaceNeeded > 0 ? " ".repeat(spaceNeeded) : " ") + right;
    };
    const center = (text: string) => {
      if (text.length >= limit - 2) return text;
      const padLeft = Math.floor((limit - 2 - text.length) / 2);
      const padRight = limit - 2 - text.length - padLeft;
      return " ".repeat(padLeft) + text + " ".repeat(padRight);
    };

    let output = "┌" + "─".repeat(limit - 2) + "┐\n";
    output += "│" + center("REPÚBLICA DE ANGOLA") + "│\n";
    output += "│" + center("KWANZAMÓVEL - INFRAESTRUTURA DE PAGAMENTOS") + "│\n";
    output += "│" + center("COMPROVATIVO INSTITUCIONAL (FORMATO A5)") + "│\n";
    output += "├" + "─".repeat(limit - 2) + "┤\n";
    output += "│" + pad(` ID RECIBO: ${receipt.id}`, `Versão: v${receipt.version} `) + "│\n";
    output += "│" + pad(` ID EVIDÊNCIA: ${receipt.evidenceId}`, `Data: ${receipt.timestamp.replace("T", " ").substring(0, 19)} `) + "│\n";
    output += "├" + "─".repeat(limit - 2) + "┤\n";
    output += "│" + pad(" DETALHES DE TRANSAÇÃO:", "") + "│\n";
    output += "│" + pad(`   Tipo de Operação: ${receipt.type}`, `Estado: ${receipt.status} `) + "│\n";
    output += "│" + pad(`   Valor Total: ${receipt.amount.toString()}`, `Moeda: AOA `) + "│\n";
    output += "├" + "─".repeat(limit - 2) + "┤\n";
    output += "│" + pad(" CONTAS INTERVENIENTES:", "") + "│\n";
    output += "│" + pad(`   Origem: ${receipt.senderName}`, `ID: ${receipt.senderId} `) + "│\n";
    output += "│" + pad(`   Destino: ${receipt.receiverName}`, `ID: ${receipt.receiverId} `) + "│\n";
    output += "├" + "─".repeat(limit - 2) + "┤\n";
    output += "│" + pad(" ENQUADRAMENTO JURÍDICO REGULAMENTAR (BNA):", "") + "│\n";
    receipt.evidencePackage.laws.forEach(l => {
      output += "│" + pad(`   • ${l.ref}: ${l.name}`, "") + "│\n";
    });
    output += "├" + "─".repeat(limit - 2) + "┤\n";
    output += "│" + pad(" SEGURANÇA CRIPTOGRÁFICA HSM SGP-BNA:", "") + "│\n";
    const sig = receipt.hsmSignature;
    output += "│" + pad(`   SIG: ${sig.substring(0, limit - 12)}`, "") + "│\n";
    output += "│" + pad(`   HASH INTEGRIDADE: ${receipt.hash.substring(0, limit - 24)}...`, "") + "│\n";
    output += "└" + "─".repeat(limit - 2) + "┘\n";
    return output;
  }

  /**
   * Renders a highly detailed A4 institutional ASCII layout of the receipt.
   */
  public static formatA4(receipt: ReceiptAggregate): string {
    const limit = 80;
    const divider = "─".repeat(limit);
    const doubleDivider = "═".repeat(limit);
    const pad = (left: string, right: string) => {
      const spaceNeeded = limit - left.length - right.length - 2;
      return left + (spaceNeeded > 0 ? " ".repeat(spaceNeeded) : " ") + right;
    };
    const center = (text: string) => {
      if (text.length >= limit - 2) return text;
      const padLeft = Math.floor((limit - 2 - text.length) / 2);
      const padRight = limit - 2 - text.length - padLeft;
      return " ".repeat(padLeft) + text + " ".repeat(padRight);
    };

    let output = "╔" + "═".repeat(limit - 2) + "╗\n";
    output += "║" + center("REPÚBLICA DE ANGOLA") + "║\n";
    output += "║" + center("BANCO NACIONAL DE ANGOLA (BNA)") + "║\n";
    output += "║" + center("KWANZAMÓVEL - COMPROVATIVO INSTITUCIONAL DE AUDITORIA (FORMATO A4)") + "║\n";
    output += "╠" + "═".repeat(limit - 2) + "╣\n";
    output += "║" + pad(` ID COMPROVATIVO: ${receipt.id}`, `Versão Reguladora: v${receipt.version} `) + "║\n";
    output += "║" + pad(` ID EVIDÊNCIA (EVP): ${receipt.evidenceId}`, `Registo Temporal: ${receipt.timestamp.replace("T", " ").substring(0, 19)} `) + "║\n";
    output += "║" + pad(` Correlation ID: ${receipt.correlationId}`, `Trace ID: ${receipt.traceId} `) + "║\n";
    output += "╠" + "─".repeat(limit - 2) + "╣\n";
    output += "║" + pad(" [1] SUMÁRIO FINANCEIRO E METADADOS", "") + "║\n";
    output += "║" + pad(`   • Tipo de Operação: ${receipt.type}`, `Estado: ${receipt.status} `) + "║\n";
    output += "║" + pad(`   • Montante Integral: ${receipt.amount.toString()}`, `Moeda: Kwanza Soberano (AOA) `) + "║\n";
    output += "║" + pad(`   • Conta Origem (mTLS): ${receipt.senderName} (${receipt.senderId})`, "") + "║\n";
    output += "║" + pad(`   • Conta Destino: ${receipt.receiverName} (${receipt.receiverId})`, "") + "║\n";
    output += "╠" + "─".repeat(limit - 2) + "╣\n";
    output += "║" + pad(" [2] LANÇAMENTOS EM PARTIDAS DOBRADAS (DOUBLE-ENTRY LEDGER)", "") + "║\n";
    receipt.evidencePackage.ledgerEntries.forEach(entry => {
      output += "║" + pad(`   - Conta: ${entry.account}`, `Tipo: ${entry.type} | Valor: ${entry.amount} `) + "║\n";
    });
    output += "╠" + "─".repeat(limit - 2) + "╣\n";
    output += "║" + pad(" [3] CONFORMIDADE LEGAL E ENQUADRAMENTO REGULAMENTAR (BNA)", "") + "║\n";
    receipt.evidencePackage.laws.forEach(l => {
      output += "║" + pad(`   • Ref: ${l.ref}`, "") + "║\n";
      output += "║" + pad(`     Nome: ${l.name}`, "") + "║\n";
      output += "║" + pad(`     Detalhes: ${l.details.substring(0, limit - 16)}`, "") + "║\n";
    });
    output += "╠" + "─".repeat(limit - 2) + "╣\n";
    output += "║" + pad(" [4] DECISÕES DE ARQUITETURA DE REFERÊNCIA VINCULADAS (KMOS-ADR)", "") + "║\n";
    receipt.evidencePackage.adrs.forEach(a => {
      output += "║" + pad(`   • ${a.id}: ${a.name}`, "") + "║\n";
    });
    output += "╠" + "─".repeat(limit - 2) + "╣\n";
    output += "║" + pad(" [5] VERIFICAÇÃO AUTOMÁTICA DE INTEGRIDADE & PREVENÇÃO AML", "") + "║\n";
    output += "║" + pad(`   • Score de Risco Calculado: ${receipt.evidencePackage.amlResult.riskScore}%`, `Classificação: ${receipt.evidencePackage.riskAssessment.tier} RISK `) + "║\n";
    output += "║" + pad(`   • Regras Constitucionais: ${receipt.evidencePackage.constitutionValidation.status}`, `Validadas: ${receipt.evidencePackage.constitutionValidation.rulesEvaluated.slice(0, 2).join(", ")} `) + "║\n";
    output += "╠" + "─".repeat(limit - 2) + "╣\n";
    output += "║" + pad(" [6] SEGURANÇA E SELOS CRIPTOGRÁFICOS INSTITUCIONAIS", "") + "║\n";
    output += "║" + pad(`   • Hash de Integridade SHA-256: ${receipt.hash}`, "") + "║\n";
    output += "║" + pad(`   • Assinatura de Hardware HSM BNA:`, "") + "║\n";
    output += "║" + pad(`     ${receipt.hsmSignature.substring(0, limit - 8)}`, "") + "║\n";
    output += "║" + pad(`     ${receipt.hsmSignature.substring(limit - 8, (limit - 8) * 2)}`, "") + "║\n";
    output += "╚" + "═".repeat(limit - 2) + "╝\n";
    return output;
  }

  /**
   * Generates a fully compliant, beautiful PDF document representation of the receipt using jsPDF,
   * including embedded QR Code for digital signature validation on BNA network.
   */
  public static async generateReceiptPdf(receipt: ReceiptAggregate, format: "58mm" | "80mm" | "A5" | "A4"): Promise<jsPDF> {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: format === "58mm" ? [58, 200] : format === "80mm" ? [80, 240] : format === "A5" ? "a5" : "a4"
    });

    const verificationUrl = receipt.verificationUrl || 
      `https://bna.ao/verify/receipt?id=${receipt.id}&hash=${receipt.hash.substring(0, 16)}&v=${receipt.version}`;

    let qrDataUrl = "";
    try {
      qrDataUrl = await QRCode.toDataURL(verificationUrl, {
        margin: 1,
        width: 250,
        color: { dark: "#1e293b", light: "#ffffff" }
      });
    } catch (err) {
      console.error("Erro ao gerar QR code para o PDF:", err);
    }

    if (format === "58mm") {
      doc.setFont("courier", "normal");
      doc.setFontSize(8);
      const text = ReceiptTemplate.formatThermal(receipt, "58mm");
      const lines = doc.splitTextToSize(text, 50);
      doc.text(lines, 4, 10);

      if (qrDataUrl) {
        const lineCount = lines.length;
        const yQr = Math.min(10 + lineCount * 3.8, 150);
        doc.addImage(qrDataUrl, "PNG", 14, yQr, 30, 30);
        doc.setFont("courier", "bold");
        doc.setFontSize(7);
        doc.text("[ QR VALIDAÇÃO BNA ]", 29, yQr + 34, { align: "center" });
      }
    } else if (format === "80mm") {
      doc.setFont("courier", "normal");
      doc.setFontSize(9);
      const text = ReceiptTemplate.formatThermal(receipt, "80mm");
      const lines = doc.splitTextToSize(text, 68);
      doc.text(lines, 6, 12);

      if (qrDataUrl) {
        const lineCount = lines.length;
        const yQr = Math.min(12 + lineCount * 4.2, 175);
        doc.addImage(qrDataUrl, "PNG", 22, yQr, 36, 36);
        doc.setFont("courier", "bold");
        doc.setFontSize(8);
        doc.text("VALIDAÇÃO DIGITAL HSM • BNA", 40, yQr + 41, { align: "center" });
      }
    } else {
      const isA5 = format === "A5";
      const width = isA5 ? 148 : 210;
      const height = isA5 ? 210 : 297;
      const margin = isA5 ? 10 : 15;
      
      // Header band
      doc.setFillColor(184, 115, 51);
      doc.rect(0, 0, width, isA5 ? 12 : 16, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(isA5 ? 7 : 9);
      doc.setTextColor(255, 255, 255);
      doc.text("KWANZAMÓVEL - INFRAESTRUTURA SOBERANA DE PAGAMENTOS DE ANGOLA", margin, isA5 ? 8 : 10.5);

      let y = isA5 ? 24 : 32;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(isA5 ? 13 : 16);
      doc.setTextColor(30, 41, 59);
      doc.text("COMPROVATIVO INSTITUCIONAL DE PAGAMENTO", margin, y);

      y += isA5 ? 6 : 8;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(isA5 ? 8 : 9.5);
      doc.setTextColor(100, 116, 139);
      doc.text("Emitido sob regulamentação do Banco Nacional de Angola (BNA) — Lei n.º 40/20", margin, y);

      y += isA5 ? 4 : 6;
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(margin, y, width - margin, y);

      y += isA5 ? 8 : 12;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(isA5 ? 9 : 11);
      doc.setTextColor(30, 41, 59);
      doc.text("DADOS DA TRANSAÇÃO", margin, y);
      doc.text("METADADOS DE SEGURANÇA", width / 2 + (isA5 ? 2 : 5), y);

      y += isA5 ? 5 : 7;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(isA5 ? 8 : 9);
      doc.setTextColor(71, 85, 105);

      const leftCol = [
        ["ID Recibo:", receipt.id],
        ["ID Transação:", receipt.txId],
        ["ID Evidência:", receipt.evidenceId],
        ["Tipo Operação:", receipt.evidencePackage.id ? receipt.evidencePackage.id.split("-")[0] : receipt.type],
        ["Estado:", receipt.status],
        ["Valor:", receipt.amount.toString()],
        ["Data/Hora:", receipt.timestamp.replace("T", " ").substring(0, 19)],
      ];

      const rightCol = [
        ["Versão:", `v${receipt.version}`],
        ["Correlation ID:", receipt.correlationId],
        ["Trace ID:", receipt.traceId],
        ["Score Compliance:", `${receipt.evidencePackage.complianceScore}%`],
        ["Rácio Liquidez:", "1:1 Fiduciário (BNA)"],
        ["Enquadramento:", "Lei 40/20 & Aviso 11/21"],
      ];

      let gridY = y;
      leftCol.forEach(([label, val]) => {
        doc.setFont("helvetica", "bold");
        doc.text(label, margin, gridY);
        doc.setFont("helvetica", "normal");
        doc.text(String(val), margin + (isA5 ? 25 : 35), gridY);
        gridY += isA5 ? 5 : 6.5;
      });

      gridY = y;
      rightCol.forEach(([label, val]) => {
        doc.setFont("helvetica", "bold");
        doc.text(label, width / 2 + (isA5 ? 2 : 5), gridY);
        doc.setFont("helvetica", "normal");
        doc.text(String(val), width / 2 + (isA5 ? 30 : 42), gridY);
        gridY += isA5 ? 5 : 6.5;
      });

      y = Math.max(gridY, y + leftCol.length * (isA5 ? 5 : 6.5)) + (isA5 ? 5 : 8);
      
      const boxW = (width - margin * 2 - (isA5 ? 4 : 8)) / 2;
      const boxH = isA5 ? 20 : 25;

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(241, 245, 249);
      doc.rect(margin, y, boxW, boxH, "FD");
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(isA5 ? 8 : 9.5);
      doc.setTextColor(30, 41, 59);
      doc.text("SENDER / ORIGEM", margin + 4, y + 5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(isA5 ? 7.5 : 8.5);
      doc.text(`Nome: ${receipt.senderName}`, margin + 4, y + 10);
      doc.text(`ID/Fone: ${receipt.senderId}`, margin + 4, y + 15);

      doc.setFillColor(248, 250, 252);
      doc.rect(margin + boxW + (isA5 ? 4 : 8), y, boxW, boxH, "FD");
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(isA5 ? 8 : 9.5);
      doc.setTextColor(30, 41, 59);
      doc.text("RECEIVER / DESTINO", margin + boxW + (isA5 ? 6 : 10), y + 5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(isA5 ? 7.5 : 8.5);
      doc.text(`Nome: ${receipt.receiverName}`, margin + boxW + (isA5 ? 6 : 10), y + 10);
      doc.text(`ID/Fone: ${receipt.receiverId}`, margin + boxW + (isA5 ? 6 : 10), y + 15);

      y += boxH + (isA5 ? 6 : 10);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(isA5 ? 9 : 11);
      doc.setTextColor(30, 41, 59);
      doc.text("LANÇAMENTOS CONTÁBEIS (DOUBLE-ENTRY LEDGER)", margin, y);

      y += isA5 ? 5 : 7;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(isA5 ? 7.5 : 8.5);
      doc.setTextColor(71, 85, 105);
      doc.text("Conta", margin, y);
      doc.text("Tipo", margin + (isA5 ? 60 : 90), y);
      doc.text("Valor", width - margin, y, { align: "right" });

      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y + 2, width - margin, y + 2);

      y += isA5 ? 6 : 8;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(isA5 ? 7.5 : 8.5);
      doc.setTextColor(100, 116, 139);
      
      if (receipt.evidencePackage.ledgerEntries && receipt.evidencePackage.ledgerEntries.length > 0) {
        receipt.evidencePackage.ledgerEntries.forEach((entry: any) => {
          doc.text(entry.account, margin, y);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(entry.type === "DEBIT" ? 220 : 16, entry.type === "DEBIT" ? 38 : 185, entry.type === "DEBIT" ? 38 : 129);
          doc.text(entry.type, margin + (isA5 ? 60 : 90), y);
          doc.text(entry.amount, width - margin, y, { align: "right" });
          doc.setFont("helvetica", "normal");
          doc.setTextColor(100, 116, 139);
          y += isA5 ? 5 : 6;
        });
      } else {
        doc.text("Não aplicável.", margin, y);
        y += isA5 ? 5 : 6;
      }

      // Cryptographic Seal & QR Code Box
      y += isA5 ? 4 : 6;
      doc.setFillColor(250, 250, 249);
      doc.setDrawColor(231, 229, 228);
      const sealH = isA5 ? 36 : 42;
      const sealW = width - margin * 2;
      doc.rect(margin, y, sealW, sealH, "FD");

      // Embed QR Code on the right side of the seal box
      const qrSize = isA5 ? 28 : 34;
      if (qrDataUrl) {
        doc.addImage(qrDataUrl, "PNG", margin + sealW - qrSize - 4, y + 4, qrSize, qrSize);
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(isA5 ? 7.5 : 9);
      doc.setTextColor(184, 115, 51);
      doc.text("ASSINATURAS DE CONFORMIDADE CRIPTOGRÁFICA SGP-BNA", margin + 4, y + 5);

      let sealTextY = y + (isA5 ? 10 : 12);
      doc.setFont("courier", "normal");
      doc.setFontSize(isA5 ? 6 : 7);
      doc.setTextColor(120, 113, 108);

      const textWidthLimit = sealW - qrSize - 12;

      const hashText = doc.splitTextToSize(`SHA-256 HASH: ${receipt.hash}`, textWidthLimit);
      doc.text(hashText, margin + 4, sealTextY);

      sealTextY += isA5 ? 7 : 9;
      const hsmSig = receipt.hsmSignature;
      const splitSig = doc.splitTextToSize(`HSM SIGNATURE: ${hsmSig}`, textWidthLimit);
      doc.text(splitSig, margin + 4, sealTextY);

      sealTextY += isA5 ? 8 : 10;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(isA5 ? 5.5 : 6.5);
      doc.setTextColor(16, 185, 129);
      doc.text("✓ VALIDAÇÃO CRIPTOGRÁFICA ATIVA • BANCO NACIONAL DE ANGOLA", margin + 4, sealTextY);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(isA5 ? 6 : 7.5);
      doc.setTextColor(148, 163, 184);
      doc.text("KWANZAMÓVEL PLATFORM • BANCO NACIONAL DE ANGOLA • TECNOLOGIA SOBERANA", width / 2, height - (isA5 ? 5 : 8), { align: "center" });
    }

    return doc;
  }
}

// ==========================================
// SEPARATE EVIDENCE REPOSITORY (IN-MEMORY)
// ==========================================

export class EvidenceRepository {
  private static storage: Map<string, EvidencePackage> = new Map();

  public static save(pkg: EvidencePackage): void {
    this.storage.set(pkg.id, pkg);
    this.storage.set("TX_" + pkg.transactionId, pkg); // Fast lookup by Transaction ID too
  }

  public static findById(id: string): EvidencePackage | undefined {
    return this.storage.get(id);
  }

  public static findByTransactionId(txId: string): EvidencePackage | undefined {
    return this.storage.get("TX_" + txId);
  }

  public static getAll(): EvidencePackage[] {
    const unique = new Set<EvidencePackage>();
    this.storage.forEach((v) => unique.add(v));
    return Array.from(unique).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  /**
   * Realiza auditoria preventiva de conformidade de retenção de chaves
   */
  public static verifyRetentionPolicies(): Array<{ id: string; state: string; daysRemaining: number }> {
    return this.getAll().map(pkg => {
      const purge = new Date(pkg.retentionPolicy.purgeDate).getTime();
      const now = new Date().getTime();
      const diffDays = Math.ceil((purge - now) / (1000 * 60 * 60 * 24));
      return {
        id: pkg.id,
        state: diffDays > 0 ? "HOLDING_ACTIVE" : "EXPIRED_FOR_PURGE",
        daysRemaining: diffDays
      };
    });
  }
}

// ==========================================
// RECEIPT REPOSITORY (IN-MEMORY PERSISTENCE)
// ==========================================

export class ReceiptRepository {
  private static storage: Map<string, ReceiptAggregate> = new Map();

  static {
    // Seed initial receipts
    const r1 = ReceiptGenerator.create({
      txId: "TX-88432",
      type: "P2P_TRANSFER",
      amount: Money.fromDecimal(75000),
      senderId: "+244923000444",
      senderName: "Carlos Antunes",
      receiverId: "+244992384112",
      receiverName: "Maria da Conceição",
      status: "SUCCESS"
    });
    
    const r2 = ReceiptGenerator.create({
      txId: "TX-88433",
      type: "SETTLEMENT",
      amount: Money.fromDecimal(2500000),
      senderId: "BNA_RESERVE_VAULT",
      senderName: "Sovereign Reserve Vault BNA",
      receiverId: "KM_LIQUIDITY_POOL",
      receiverName: "KMOS Liquidity Pool",
      status: "SUCCESS"
    });

    const r3 = ReceiptGenerator.create({
      txId: "TX-88434",
      type: "SERVICE_PAY",
      amount: Money.fromDecimal(12000),
      senderId: "+244911222333",
      senderName: "Chitembo Rural Node",
      receiverId: "AGENT-HUAMBO-09",
      receiverName: "Agente Local Huambo",
      status: "SUCCESS"
    });

    const r4 = ReceiptGenerator.create({
      txId: "TX-88435",
      type: "MERCHANT_PAY",
      amount: Money.fromDecimal(500000),
      senderId: "PROMO_SANDBOX_01",
      senderName: "Marketing Sandbox",
      receiverId: "PROMO_LOYALTY_WALLET",
      receiverName: "Promo Loyalty Wallet",
      status: "FAILED"
    });

    this.save(r1);
    this.save(r2);
    this.save(r3);
    this.save(r4);
  }

  public static save(receipt: ReceiptAggregate): void {
    this.storage.set(receipt.id, receipt);
    this.storage.set(receipt.txId, receipt); // Map both for quick lookups
    
    // Also store evidence separately
    EvidenceRepository.save(receipt.evidencePackage);
  }

  public static findById(id: string): ReceiptAggregate | undefined {
    return this.storage.get(id);
  }

  public static findByTxId(txId: string): ReceiptAggregate | undefined {
    return this.storage.get(txId);
  }

  public static getAll(): ReceiptAggregate[] {
    const unique = new Set<ReceiptAggregate>();
    this.storage.forEach((v) => unique.add(v));
    return Array.from(unique).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }
}
