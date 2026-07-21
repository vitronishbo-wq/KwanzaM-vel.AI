import React, { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import { ReceiptGenerator, ReceiptRepository, ReceiptType, ReceiptTemplate } from "../domain/evidence/ReceiptEngine";
import { Money } from "../ledgerEngine";
import {
  Cpu,
  Play,
  RotateCw,
  ShieldCheck,
  Scale,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRightLeft,
  Search,
  BookOpen,
  FileCode,
  ShieldAlert,
  Sliders,
  History,
  Terminal,
  Activity,
  Copy,
  Check,
  Layers,
  Database,
  GitBranch,
  Network,
  HelpCircle,
  TrendingUp,
  FileText,
  AlertCircle,
  Printer,
  Download,
  QrCode
} from "lucide-react";

interface ConstitutionEngineProps {
  onEmitEvent?: (event: any) => void;
  institutionalHealth?: {
    overall: number;
    compliance: number;
    operationalRisk: number;
    resilience: number;
  };
  setInstitutionalHealth?: React.Dispatch<React.SetStateAction<any>>;
}

// Full asset data structure with answers to constitutional questions, reports and diagnostics
interface InstitutionalAsset {
  id: string;
  name: string;
  category: "Use Case" | "Aggregate" | "Entity" | "Value Object" | "API" | "Domain Event" | "Policy" | "Workflow" | "Test" | "ADR" | "Documentation";
  layer: number;
  description: string;
  definitionCode: string;
  verdict: "CONSTITUTIONALLY COMPLIANT" | "VETO ABSOLUTO" | "COMPATÍVEL COM SALVAGUARDAS" | "VIOLAÇÃO SEVERA" | "REQUER AJUSTE DE NEXO";
  verdictColor: string;
  integrityScore: number;
  
  // Cognitive Questions answers
  questions: {
    hasConstitutionalBasis: { status: boolean; detail: string };
    hasLegalBasis: { status: boolean; detail: string };
    hasTraceability: { status: boolean; detail: string };
    hasPolicyCoverage: { status: boolean; detail: string };
    hasTestCoverage: { status: boolean; detail: string };
    hasObservability: { status: boolean; detail: string };
    hasAdrJustification: { status: boolean; detail: string };
    knownInstitutionalImpact: string;
    constitutionalRisk: number; // 0-100
    principleConflicts: string;
    reducesIntelligence: { status: boolean; detail: string };
  };

  // Report fields
  report: {
    purpose: boolean;
    legalBasisText: string;
    policyCoverage: boolean;
    decisionRecordText: string;
    traceability: boolean;
    tests: boolean;
    observability: boolean;
  };

  // Violation fields (only populated if verdict is not fully compliant)
  violation?: {
    summary: string;
    severity: "CRÍTICA" | "EXTREMA" | "ALTA" | "MODERADA" | "NENHUMA";
    principleViolated: string;
    affectedCapabilities: string;
    affectedDomains: string;
    affectedPolicies: string;
    affectedTests: string;
    affectedRegulations: string;
    riskLevel: string;
    recommendedMitigation: string;
    estimatedEffort: string;
    institutionalImpact: string;
  };
}

export const ConstitutionEngine: React.FC<ConstitutionEngineProps> = ({
  onEmitEvent,
  institutionalHealth,
  setInstitutionalHealth
}) => {
  const [activeTab, setActiveTab] = useState<"auditor" | "runtime" | "graph" | "pipeline" | "evidence" | "hierarchy" | "integrations" | "rules" | "history">("auditor");
  const [selectedAssetId, setSelectedAssetId] = useState<string>("TransferUseCase");
  const [customAssetName, setCustomAssetName] = useState<string>("");
  const [customAssetCategory, setCustomAssetCategory] = useState<string>("Use Case");
  const [customAssetDesc, setCustomAssetDesc] = useState<string>("");
  const [customAssetCode, setCustomAssetCode] = useState<string>("");
  const [isRunningCheck, setIsRunningCheck] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [copied, setCopied] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedLayer, setSelectedLayer] = useState<number | null>(null);

  // ==========================================
  // 1. Regulatory Runtime State
  // ==========================================
  const [runtimeTxType, setRuntimeTxType] = useState<"transfer" | "issue" | "reserve" | "gamified">("transfer");
  const [runtimeAmount, setRuntimeAmount] = useState<number>(50000);
  const [runtimeSourceLevel, setRuntimeSourceLevel] = useState<"Level-1" | "Level-2" | "Level-3">("Level-1");
  const [runtimeDestLevel, setRuntimeDestLevel] = useState<"Level-1" | "Level-2" | "Level-3">("Level-1");
  const [runtimeLocation, setRuntimeLocation] = useState<"Urbano" | "Rural">("Urbano");
  const [runtimeProtocol, setRuntimeProtocol] = useState<"mTLS 1.3" | "Bypass TLS (Dev Mode)">("mTLS 1.3");
  const [runtimeReserveBna, setRuntimeReserveBna] = useState<number>(10000000);
  const [runtimeTotalSupply, setRuntimeTotalSupply] = useState<number>(9500000);
  const [runtimeIsRunning, setRuntimeIsRunning] = useState<boolean>(false);
  const [runtimeLogs, setRuntimeLogs] = useState<string[]>([]);
  const [runtimeResult, setRuntimeResult] = useState<any>(null);

  // ==========================================
  // 2. Institutional Knowledge Graph State
  // ==========================================
  const [graphSelectedNode, setGraphSelectedNode] = useState<string>("Lei-40-20");
  const [graphSearchQuery, setGraphSearchQuery] = useState<string>("");

  // ==========================================
  // 3. PR Guard Pipeline State
  // ==========================================
  const [pipelineSelectedPR, setPipelineSelectedPR] = useState<"pr_mtls" | "pr_reserve" | "pr_gamify" | "pr_secure">("pr_mtls");
  const [pipelineIsRunning, setPipelineIsRunning] = useState<boolean>(false);
  const [pipelineLogs, setPipelineLogs] = useState<string[]>([]);
  const [pipelineVerdict, setPipelineVerdict] = useState<any>(null);

  // ==========================================
  // 4. Institutional Evidence Engine State
  // ==========================================
  const [evidenceSelectedTx, setEvidenceSelectedTx] = useState<string>("tx_88432");
  const [evidenceIsGenerating, setEvidenceIsGenerating] = useState<boolean>(false);
  const [evidenceLogs, setEvidenceLogs] = useState<string[]>([]);
  const [evidencePackage, setEvidencePackage] = useState<any>(null);
  const [currentReceipt, setCurrentReceipt] = useState<any>(null);
  const [evidenceReceiptFormat, setEvidenceReceiptFormat] = useState<"A4" | "A5" | "58mm" | "80mm">("58mm");

  // Core 10 Layers definition
  const layersList = [
    { level: 1, name: "Institution", subtitle: "Fundamento Jurídico e Leis do Estado", desc: "Cláusulas imutáveis da constituição do KMOS, nexo de causalidade primário baseados na Lei n.º 40/20 e Avisos do BNA (ex: Aviso 07/2020, Aviso 11/2021)." },
    { level: 2, name: "Constitution Engine", subtitle: "Validação & Coerência Soberana", desc: "A camada máxima de restrição executável. Garante que nenhum ativo físico ou lógico exista no ecossistema sem validação integral." },
    { level: 3, name: "Governance", subtitle: "Comités e Autorizações Delegadas", desc: "Processos decisórios humanos apoiados pelo Decision Engine, garantindo a rastreabilidade e justificativa operacional das decisões." },
    { level: 4, name: "Decision Engine", subtitle: "Análise Estocástica e Resoluções", desc: "Modela, prevê e simula decisões políticas e de negócios em ambiente sandbox seguro antes de sua execução real." },
    { level: 5, name: "Policy Engine", subtitle: "Políticas Dinâmicas e Restrições", desc: "Regras de negócios configuráveis, limites de transação (ex: tetos de Kwanza Simplificado), regras de MDR e tarifas BNA." },
    { level: 6, name: "Knowledge Graph", subtitle: "Nexo Causal e Mapeamento Semântico", desc: "Grafos de conhecimento que interconectam cada bloco de código, configuração ou teste a um artigo específico da legislação financeira." },
    { level: 7, name: "Capabilities", subtitle: "Serviços e Prerrogativas de Negócios", desc: "As capacidades institucionais que o sistema pode realizar (ex: custódia, liquidação interbancária, emissão de moeda fiduciária digital)." },
    { level: 8, name: "Domain", subtitle: "Agregados, Entidades e Casos de Uso", desc: "O coração do software com isolamento absoluto baseados em Domain-Driven Design (DDD), garantindo invariantes de partidas dobradas e balanço ACID." },
    { level: 9, name: "Infrastructure", subtitle: "Base de Dados, HSM e Protocolos TLS", desc: "Garante a segurança física do ecossistema: chaves criptográficas HSM (P-256), comunicação criptografada mTLS 1.3 e persistência imutável de transações." },
    { level: 10, name: "Observability", subtitle: "Telemetria, Logs e Auditoria Contínua", desc: "Monitoramento contínuo das transações e integridade institucional (Observatory), emitindo eventos em tempo real para o Event Stream." }
  ];

  // Detailed predefined institutional assets conforming to the request
  const assetsDatabase: Record<string, InstitutionalAsset> = {
    TransferUseCase: {
      id: "TransferUseCase",
      name: "TransferUseCase",
      category: "Use Case",
      layer: 8,
      description: "Caso de uso que executa transferências interbancárias em moeda eletrónica garantindo o isolamento ACID transacional e conformidade de partidas dobradas.",
      definitionCode: `class TransferUseCase {
  async execute(fromId: string, toId: string, amount: number) {
    return await LedgerDB.transaction(async (db) => {
      const fromWallet = await db.lock(fromId);
      const toWallet = await db.lock(toId);
      if (fromWallet.balance < amount) throw new BalanceViolationException();
      
      await db.decrement(fromId, amount);
      await db.increment(toId, amount);
      return await db.logDoubleEntry(fromId, toId, amount);
    });
  }
}`,
      verdict: "CONSTITUTIONALLY COMPLIANT",
      verdictColor: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
      integrityScore: 100,
      questions: {
        hasConstitutionalBasis: { status: true, detail: "Garante o princípio fundamental de rastreabilidade contábil e balanço patrimonial imediato sem emissão paralela de moeda." },
        hasLegalBasis: { status: true, detail: "Enquadrado na Lei n.º 40/20 do Sistema de Pagamentos de Angola (Artigo 42.º - Registo e Compensação de Transações)." },
        hasTraceability: { status: true, detail: "Todas as contas e saldos envolvidos são devidamente identificados e registados no Ledger com hash SHA-256 assinado." },
        hasPolicyCoverage: { status: true, detail: "Sujeito às políticas de limites de carteira e KYC do Policy Engine baseadas no tipo de conta (Level 1 / Level 2)." },
        hasTestCoverage: { status: true, detail: "Assegurado pelo conjunto de testes unitários 'DoubleEntryLedgerTest.ts' e testes de integração de estresse." },
        hasObservability: { status: true, detail: "Dispara o evento de domínio 'LedgerCommittedEvent' que é ouvido em tempo real pelo Observatory." },
        hasAdrJustification: { status: true, detail: "Justificado formalmente pelo registro de decisão arquitetural 'ADR-021-Immutable-Ledger-Acid'." },
        knownInstitutionalImpact: "Reduz o risco de fraude de liquidez a zero e garante balanços imediatos auditáveis a qualquer segundo.",
        constitutionalRisk: 0,
        principleConflicts: "Nenhum conflito detetado com os princípios da Carta Magna do KMOS.",
        reducesIntelligence: { status: false, detail: "Aumenta a inteligência contábil, permitindo rastreabilidade perfeita e reconciliação em menos de 100 milisegundos." }
      },
      report: {
        purpose: true,
        legalBasisText: "Lei 40/20 (Artigo 42.º) & Aviso 03/22",
        policyCoverage: true,
        decisionRecordText: "ADR-021 (Immutable Ledger Engine)",
        traceability: true,
        tests: true,
        observability: true
      }
    },
    ReserveBalanceAggregate: {
      id: "ReserveBalanceAggregate",
      name: "ReserveBalanceAggregate",
      category: "Aggregate",
      layer: 8,
      description: "Agregado do domínio de custódia que gerencia o rácio de liquidez 1:1, garantindo o provisionamento fiduciário absoluto de Kwanza Digital contra depósitos físicos no BNA.",
      definitionCode: `class ReserveBalanceAggregate {
  private physicalReserveInBna: number;
  private totalEmittedDigitalKwanza: number;

  verifyCustodyRatio() {
    const ratio = this.physicalReserveInBna / this.totalEmittedDigitalKwanza;
    if (ratio < 1.0) {
      throw new FractionalReserveViolationException("Rácio de custódia fiduciária violado!");
    }
    return ratio;
  }
}`,
      verdict: "CONSTITUTIONALLY COMPLIANT",
      verdictColor: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
      integrityScore: 100,
      questions: {
        hasConstitutionalBasis: { status: true, detail: "Assegura o Princípio Fundamental Único de salvaguarda integral de depósitos fiduciários eletrónicos." },
        hasLegalBasis: { status: true, detail: "Aviso n.º 07/2020 do BNA (Artigo 5.º - Salvaguarda e Proteção de Saldos)." },
        hasTraceability: { status: true, detail: "Monitorado por auditoria contínua de saldos físicos liquidados em tempo real no SPTR do BNA." },
        hasPolicyCoverage: { status: true, detail: "Sujeito à política estrita de liquidez estrita do BNA '100PercentReserveRequirement'." },
        hasTestCoverage: { status: true, detail: "Verificado no suíte 'ReserveCustodyTest.ts' que simula 10,000 cenários de estresse de liquidez extrema." },
        hasObservability: { status: true, detail: "Exporta métricas de rácio de forma síncrona para o Institutional Twin e alertas automáticos ao Observatory." },
        hasAdrJustification: { status: true, detail: "Mapeado no registro 'ADR-005-Absolute-Fiduciary-Reserve-Ratio'." },
        knownInstitutionalImpact: "Elimina qualquer risco de corrida aos depósitos ou falência sistémica do KwanzaMóvel.",
        constitutionalRisk: 0,
        principleConflicts: "Nenhum conflito. É o pilar estrutural que define o KMOS.",
        reducesIntelligence: { status: false, detail: "Consolida a inteligência sistêmica e blinda o projeto contra intervenção regulatória." }
      },
      report: {
        purpose: true,
        legalBasisText: "Aviso n.º 07/2020 do BNA (Artigo 5.º)",
        policyCoverage: true,
        decisionRecordText: "ADR-005 (Reserve Custody Mechanism)",
        traceability: true,
        tests: true,
        observability: true
      }
    },
    MerchantMdrFeePolicy: {
      id: "MerchantMdrFeePolicy",
      name: "MerchantMdrFeePolicy",
      category: "Policy",
      layer: 5,
      description: "Política dinâmica regulatória que capta as comissões MDR e taxas de intercâmbio comercial, forçando tetos máximos legais.",
      definitionCode: `class MerchantMdrFeePolicy {
  calculateMDR(amount: number, isRural: boolean) {
    const baseRate = isRural ? 0.005 : 0.012; // 0.5% rural cap vs 1.2% urbano
    const fee = amount * baseRate;
    return Math.min(fee, 500); // 500 AOA absolute maximum limit
  }
}`,
      verdict: "CONSTITUTIONALLY COMPLIANT",
      verdictColor: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
      integrityScore: 98,
      questions: {
        hasConstitutionalBasis: { status: true, detail: "Assegura que as comissões cobradas são transparentes e favoráveis à expansão do ecossistema e inclusão financeira." },
        hasLegalBasis: { status: true, detail: "Aviso n.º 06/2020 do BNA (Taxas e Limites Máximos de Intercâmbio Comercial)." },
        hasTraceability: { status: true, detail: "Auditável na fatura de taxas anexa a cada transação comercial no ledger." },
        hasPolicyCoverage: { status: true, detail: "Implementação direta das regras de MDR reguladas pelo consórcio financeiro." },
        hasTestCoverage: { status: true, detail: "Mapeado no teste 'MerchantSettlement.test.ts' validando limites em 50 moedas e volumes diferentes." },
        hasObservability: { status: true, detail: "Envia dados de receita operacional das taxas para o módulo de finanças do Observatory." },
        hasAdrJustification: { status: true, detail: "Registado sob o documento decisório 'ADR-011-Commercial-Mdr-Capping'." },
        knownInstitutionalImpact: "Incentiva a adoção da carteira digital por micro-comerciantes no interior do país, reduzindo o custo operacional do dinheiro.",
        constitutionalRisk: 0,
        principleConflicts: "Nenhum.",
        reducesIntelligence: { status: false, detail: "Formaliza a lógica regulada impedindo arbitrariedades no cálculo tarifário." }
      },
      report: {
        purpose: true,
        legalBasisText: "Aviso n.º 06/2020 do BNA",
        policyCoverage: true,
        decisionRecordText: "ADR-011 (Mdr Capping Strategy)",
        traceability: true,
        tests: true,
        observability: true
      }
    },
    RuralOfflineSMSWorkflow: {
      id: "RuralOfflineSMSWorkflow",
      name: "RuralOfflineSMSWorkflow",
      category: "Workflow",
      layer: 8,
      description: "Workflow operacional offline que processa transações assíncronas criptografadas através de pacotes de SMS binários encriptados para inclusão rural extrema.",
      definitionCode: `class RuralOfflineSMSWorkflow {
  async processIncomingSmsPackage(payload: BinarySmsPayload) {
    const verified = await CryptographyHSM.verifySignature(payload.data, payload.signature);
    if (!verified) throw new InvalidSignatureException();
    
    const balanceImmunity = await LedgerDB.checkBalanceImmunity(payload.fromId);
    if (!balanceImmunity) throw new BalanceViolationException();
    
    return await LedgerDB.queueOfflineTransaction(payload);
  }
}`,
      verdict: "CONSTITUTIONALLY COMPLIANT",
      verdictColor: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
      integrityScore: 97,
      questions: {
        hasConstitutionalBasis: { status: true, detail: "Conectado diretamente ao Princípio de Inclusão Social e Rural em áreas desprovidas de cobertura IP fidedigna." },
        hasLegalBasis: { status: true, detail: "Aviso n.º 11/2021 do BNA (Artigo 5.º, Cláusula Especial de Inclusão Financeira Rural)." },
        hasTraceability: { status: true, detail: "Cadeia de assinaturas no próprio SMS com rastreio de porta de saída de operadora (SMS Gateway)." },
        hasPolicyCoverage: { status: true, detail: "Garantida pelas regras estritas de transação assíncrona com assinaturas ECDSA P-256." },
        hasTestCoverage: { status: true, detail: "Validado pelo emulador de modem celular 'OfflineSmsFlowTest.ts'." },
        hasObservability: { status: true, detail: "Monitorado por eventos 'SmsPayloadReceived' no Observatory para identificar spoofing." },
        hasAdrJustification: { status: true, detail: "Apoiado no 'ADR-015-Rural-Offline-Cripto-Sms'." },
        knownInstitutionalImpact: "Abre o mercado de pagamentos digitais móveis a 40% da população rural de Angola fora do sinal de dados 3G/4G.",
        constitutionalRisk: 2,
        principleConflicts: "Desafio técnico no processamento assíncrono atrasado contra reconciliação imediata, mitigado por fila prioritária no BNA.",
        reducesIntelligence: { status: false, detail: "Cria resiliência institucional permitindo que o sistema funcione mesmo durante blackout total da internet IP." }
      },
      report: {
        purpose: true,
        legalBasisText: "Aviso n.º 11/2021 (Artigo 5.º - Inclusão Rural)",
        policyCoverage: true,
        decisionRecordText: "ADR-015 (Offline SMS Protocol)",
        traceability: true,
        tests: true,
        observability: true
      }
    },

    // ----------------------------------------------------
    // CONSTITUTIONAL VIOLATIONS (For showcasing detailed diagnoses)
    // ----------------------------------------------------
    FractionalReserveAdjustment: {
      id: "FractionalReserveAdjustment",
      name: "setReserveRatio(0.95)",
      category: "Policy",
      layer: 5,
      description: "Alteração de política regulatória submetida para reduzir o rácio de liquidez física fiduciária de 1:1 para 0.95 (95%), abrindo espaço para depósitos fracionários no KwanzaMóvel.",
      definitionCode: `// Attempting to modify reserve ratio globally to 95%
function setReserveRatio(ratio: number) {
  if (ratio < 1.0) {
    console.warn("ALERTA CRÍTICO: Rácio abaixo de 100%!");
  }
  global.RESERVE_CUSTODY_RATIO = ratio; 
}`,
      verdict: "VETO ABSOLUTO",
      verdictColor: "text-red-500 bg-red-500/10 border-red-500/20",
      integrityScore: 5,
      questions: {
        hasConstitutionalBasis: { status: false, detail: "TOTALMENTE PROIBIDO. Viola o pilar fundamental do KMOS, que proíbe qualquer operação de reserva fracionária no ecossistema." },
        hasLegalBasis: { status: false, detail: "Inexistente. Viola diretamente o Artigo 5.º do Aviso n.º 07/2020 do BNA." },
        hasTraceability: { status: false, detail: "Gera discrepância entre o total de Kwanza eletrónico e os ativos de liquidez reais em custódia fiduciária no Banco Central." },
        hasPolicyCoverage: { status: false, detail: "Rompe com todas as diretivas de proteção fiduciária e colateralização total do KwanzaMóvel." },
        hasTestCoverage: { status: false, detail: "Nenhum teste legítimo suporta esta aberração contábil." },
        hasObservability: { status: true, detail: "Detectado imediatamente como anomalia grave pela verificação estática do compilador." },
        hasAdrJustification: { status: false, detail: "Totalmente contrário a todos os registros de decisões arquiteturais do KMOS." },
        knownInstitutionalImpact: "Cria passivos sem respaldo físico fiduciário de Kwanza, colocando o ecossistema sob risco iminente de colapso de liquidez e intervenção judicial penal.",
        constitutionalRisk: 100,
        principleConflicts: "Conflito frontal absoluto com o Princípio de Moeda Fiduciária Digital de Respaldo Físico Seguro.",
        reducesIntelligence: { status: true, detail: "Degrada a inteligência institucional e reputação jurídica do ecossistema transformando-o num esquema fracionário insolvente." }
      },
      report: {
        purpose: false,
        legalBasisText: "VIOLAÇÃO GRAVE: Aviso 07/2020 Art. 5.º",
        policyCoverage: false,
        decisionRecordText: "Inexistente (Contraria ADR-005)",
        traceability: false,
        tests: false,
        observability: true
      },
      violation: {
        summary: "Tentativa de rebaixar a salvaguarda de depósitos para um modelo fracionário, emitindo dinheiro eletrônico sem correspondência real de colateralização.",
        severity: "EXTREMA",
        principleViolated: "Princípio Fundamental Único: O KMOS representa a instituição soberana, garantindo reserva de valor integral 1:1.",
        affectedCapabilities: "Custódia Fiduciária de Saldos, Liquidação Interbancária SPTR, Emissão de Moeda e Câmbio.",
        affectedDomains: "Ledger Síncrono, Conta Level-1, Conta Level-2, Banco de Custódia Integrado.",
        affectedPolicies: "100PercentReserveRequirement, BnaSettlementRules, AbsoluteSolvencyPolicy.",
        affectedTests: "ReserveCustodyTest.ts (Gera falhas fatais estritas de invariantes).",
        affectedRegulations: "Aviso n.º 07/2020 do BNA (Artigo 5.º - Penalização de crime financeiro e perda automática de licença operacional).",
        riskLevel: "CRÍTICO - VETO SOBERANO INTRANSPONÍVEL",
        recommendedMitigation: "Rejeitar sumariamente o pedido. Desativar qualquer fluxo de compilação contendo esta instrução. Notificar o conselho de governadores e auditar logs do desenvolvedor por suspeita de sabotagem.",
        estimatedEffort: "Impossível de contornar arquiteturalmente sem autorização física criptografada multipartes das chaves mestre do BNA.",
        institutionalImpact: "Encerramento imediato das operações do KwanzaMóvel pelo BNA, indiciamento criminal de diretores técnicos por fraude fiduciária e destruição completa do ecossistema."
      }
    },
    BypassMtlsInDev: {
      id: "BypassMtlsInDev",
      name: "bypassMtlsAuth(true)",
      category: "Policy",
      layer: 9,
      description: "Ajuste na infraestrutura de rede de comunicações submetido para desativar a autenticação TLS mútua (mTLS) com o gateway de compensação para acelerar o desenvolvimento local.",
      definitionCode: `// Layer 9 bypass: Deactivating mutual TLS authentication
function bypassMtlsAuth(bypass: boolean) {
  if (bypass) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // Bypass validation
    console.warn("mTLS temporariamente desativado para testes de integração.");
  }
}`,
      verdict: "VETO ABSOLUTO",
      verdictColor: "text-red-500 bg-red-500/10 border-red-500/20",
      integrityScore: 12,
      questions: {
        hasConstitutionalBasis: { status: false, detail: "Viola o pilar de integridade de segurança cibernética e soberania de canais transacionais." },
        hasLegalBasis: { status: false, detail: "Viola a Lei n.º 40/20 do Sistema de Pagamentos de Angola (Artigo 42.º - Segurança das Comunicações Interbancárias)." },
        hasTraceability: { status: false, detail: "Abre vulnerabilidade para interceptação de tráfego, eliminando a garantia de autoria mútua." },
        hasPolicyCoverage: { status: false, detail: "Quebra a política estrutural de canais criptográficos rígidos do consórcio financeiro." },
        hasTestCoverage: { status: false, detail: "Nenhum teste legítimo valida o bypass de segurança em ambiente de produção." },
        hasObservability: { status: true, detail: "Detectado imediatamente como risco de segurança pelo compilador estático do barramento de comunicação." },
        hasAdrJustification: { status: false, detail: "Incompatível com o registro 'ADR-009-Communication-Channels-Tls13'." },
        knownInstitutionalImpact: "Expeõe o ledger a ataques de injeção de transações artificiais através de spoofing de roteador.",
        constitutionalRisk: 95,
        principleConflicts: "Conflito frontal com a inviolabilidade de dados e proteção ao consumidor financeiro.",
        reducesIntelligence: { status: true, detail: "Exclui mecanismos de encriptação mútua reduzindo a confiança algorítmica sistêmica do ecossistema." }
      },
      report: {
        purpose: false,
        legalBasisText: "VIOLAÇÃO: Lei n.º 40/20 (Artigo 42.º)",
        policyCoverage: false,
        decisionRecordText: "Inexistente (Contraria ADR-009)",
        traceability: false,
        tests: false,
        observability: true
      },
      violation: {
        summary: "Tentativa de bypass de autenticação mTLS em canais de comunicação com banco de compensação, expondo o core do Ledger.",
        severity: "CRÍTICA",
        principleViolated: "Princípio 1: Prioridade do Conhecimento Institucional e Inviolabilidade Criptográfica de Canais.",
        affectedCapabilities: "Transações em Tempo Real (SPTR), Liquidação Comercial de MDR, Atualização de Balanços.",
        affectedDomains: "Canais de Integração de Rede, Barramento de Integração BNA, Servidores de Produção.",
        affectedPolicies: "NetworkAccessPolicy, CipherSuitesMtlsRule, EnterpriseSecurityControls.",
        affectedTests: "Nenhum. Ignora deliberadamente asserts de validade de certificados.",
        affectedRegulations: "Lei n.º 40/20 do Sistema de Pagamentos (Penalizações para vazamento ou exposição deliberada de infraestruturas financeiras do Estado).",
        riskLevel: "CRÍTICO - IMPEDIDO PELO NÚCLEO DE REDE",
        recommendedMitigation: "Remover imediatamente o bypass. Implementar ambiente local de mock TLS auto-assinado em sandbox que mantenha a integridade do handshake sem bypassar verificações.",
        estimatedEffort: "8 engineering hours (Para restaurar ambiente de chaves seguro e emitir novos certificados de teste).",
        institutionalImpact: "Potencial ataque MitM com manipulação externa de transações, fraude financeira, multa milionária por violação cibernética de canal estatal do SPTR."
      }
    },
    GamifiedBonusTokens: {
      id: "GamifiedBonusTokens",
      name: "GiveGamifiedRewardTokens",
      category: "Use Case",
      layer: 8,
      description: "Implementação de caso de uso para conceder pontos ou tokens de jogo gamificados com possibilidade de resgate de descontos, sem vínculo ou lastro financeiro registrado.",
      definitionCode: `class GiveGamifiedRewardTokens {
  async execute(userId: string, points: number) {
    const user = await UserDB.get(userId);
    user.virtualPoints += points; // Virtual currency generation
    return await UserDB.save(user);
  }
}`,
      verdict: "REQUER AJUSTE DE NEXO",
      verdictColor: "text-amber-400 bg-amber-400/10 border-amber-400/20",
      integrityScore: 74,
      questions: {
        hasConstitutionalBasis: { status: true, detail: "Tenta apoiar a atração de utilizadores do interior rústico através de incentivos operacionais." },
        hasLegalBasis: { status: false, detail: "Desconhecido. O Aviso n.º 11/2021 do BNA proíbe expressamente emissores de moeda eletrônica de criarem representações paralelas de moeda ou passivos paralelos não respaldados." },
        hasTraceability: { status: true, detail: "Registado em tabela de bónus paralela à carteira principal do Ledger." },
        hasPolicyCoverage: { status: false, detail: "Não há política cadastrada no Policy Engine definindo limites ou restrições destas recompensas." },
        hasTestCoverage: { status: true, detail: "Validado no teste unitário básico 'UserGamificationRewardTest.ts'." },
        hasObservability: { status: false, detail: "Estes saldos paralelos não são monitorados pela contabilidade central de custódia." },
        hasAdrJustification: { status: false, detail: "Nenhum registro de decisão arquitetural documenta a viabilidade desta moeda de jogo paralela." },
        knownInstitutionalImpact: "Cria risco de confusão do usuário rural que pode confundir pontos paralelos com saldos fiduciários reais de Kwanza.",
        constitutionalRisk: 35,
        principleConflicts: "Conflito indireto com a união e soberania única do Kwanza como única representação de valor fiduciário.",
        reducesIntelligence: { status: true, detail: "Diminui a inteligência do sistema adicionando passivos virtuais sem nexo de causalidade jurídico claro no grafo." }
      },
      report: {
        purpose: true,
        legalBasisText: "Pendente: Aviso BNA 11/21 Proibições",
        policyCoverage: false,
        decisionRecordText: "Inexistente (Mapear ADR correspondente)",
        traceability: true,
        tests: true,
        observability: false
      },
      violation: {
        summary: "Introdução de tokens virtuais de jogo ou pontos gamificados emitidos paralelamente sem controle fiduciário de lastro ou aprovação legal expressa do BNA.",
        severity: "MODERADA",
        principleViolated: "Princípio 2: O Código como Ativo Observável e Nexo de Causalidade Integral com Leis.",
        affectedCapabilities: "Prerrogativas de Emissão Contábil, Conversão Cambial, Módulos Comerciais de Micro-taxas.",
        affectedDomains: "Domínio de Fidelidade de Usuário, Carteira Eletrónica de Micro-pagamentos.",
        affectedPolicies: "PromoRegulations, UserAcquisitionRules, AbsoluteSolvencyPolicy.",
        affectedTests: "UserGamificationRewardTest.ts.",
        affectedRegulations: "Aviso n.º 11/2021 (Artigo 24.º - Proibições de emissão de instrumentos financeiros paralelos não remunerados ou assemelhados).",
        riskLevel: "ALERTA - REQUER PARECER DO COMITÉ DE GOVERNAÇÃO",
        recommendedMitigation: "Reformular os pontos para funcionarem estritamente como 'descontos promocionais' em taxas MDR, subsidiados de forma clara pelo orçamento de marketing institucional devidamente registado e respaldado em Kwanza físico de custódia no BNA.",
        estimatedEffort: "24 engineering hours (Para re-estruturar a tabela para descontos e mapear o nexo causal no Policy Engine).",
        institutionalImpact: "Notificação pelo BNA por emitir valores eletrônicos alternativos não autorizados, confusão patrimonial e potenciais sanções administrativas de conformidade."
      }
    }
  };

  const [activeAsset, setActiveAsset] = useState<InstitutionalAsset>(assetsDatabase.TransferUseCase);

  // Triggering the audit check log flow
  const handleTriggerAudit = (assetId: string) => {
    setIsRunningCheck(true);
    setLogs([]);

    const logSteps = [
      `[ENGINE] Iniciando compilação de conformidade do ativo institucional: '${assetId}'...`,
      `[KMOS_CONSTITUTION] Carregando diretrizes e restrições executáveis...`,
      `[DECISION_ENGINE] Mapeando nexo regulatório e justificativas de ADRs...`,
      `[POLICY_ENGINE] Verificando limitações de saldo, taxas MDR e regras KYC simplificadas...`,
      `[KNOWLEDGE_GRAPH] Analisando arestas de nexo causal contra Leis de Angola e Avisos do BNA...`,
      `[TEST_VERIFICATION] Auditando relatórios de cobertura de testes e invariantes de partidas dobradas...`,
      `[OBSERVABILITY_CHECK] Verificando barramento de telemetria e integridade de observabilidade do Observatory...`,
      `[SECURITY_AUDIT] Inspecionando conformidade de canais criptográficos mTLS 1.3 e integridade HSM...`,
      `[ANALYSIS_COMPLETE] Auditoria finalizada. Assinando relatório constitucional com hash fiduciário único SHA-256...`
    ];

    let current = 0;
    const interval = setInterval(() => {
      if (current < logSteps.length) {
        setLogs(prev => [...prev, logSteps[current]]);
        current++;
      } else {
        clearInterval(interval);
        setIsRunningCheck(false);
        const result = assetsDatabase[assetId];
        if (result) {
          setActiveAsset(result);

          // Update institutional scores dynamically
          if (setInstitutionalHealth && institutionalHealth) {
            if (result.verdict === "VETO ABSOLUTO" || result.verdict === "VIOLAÇÃO SEVERA") {
              setInstitutionalHealth((prev: any) => ({
                ...prev,
                compliance: Math.max(68, prev.compliance - 6.5),
                operationalRisk: Math.min(100, prev.operationalRisk + 8.0),
                resilience: Math.max(70, prev.resilience - 4.5),
                overall: Math.max(50, Math.round((prev.compliance + prev.resilience + (100 - prev.operationalRisk)) / 3))
              }));
            } else if (result.verdict === "CONSTITUTIONALLY COMPLIANT") {
              setInstitutionalHealth((prev: any) => ({
                ...prev,
                compliance: Math.min(100, prev.compliance + 1.2),
                operationalRisk: Math.max(0, prev.operationalRisk - 1.5),
                resilience: Math.min(100, prev.resilience + 0.8),
                overall: Math.min(100, Math.round((prev.compliance + prev.resilience + (100 - prev.operationalRisk)) / 3))
              }));
            }
          }

          // Emit event stream log
          if (onEmitEvent) {
            onEmitEvent({
              time: new Date().toLocaleTimeString(),
              type: "ConstitutionalValidationExecuted",
              correlationId: "corr_const_" + Math.random().toString(16).substring(2, 8),
              lawRef: result.questions.hasLegalBasis.detail.split(" (")[0] || "Constituição KMOS",
              origin: "ConstitutionEngine",
              result: result.verdict !== "VETO ABSOLUTO" ? "SUCCESS" : "DENIED",
              details: {
                asset: result.name,
                category: result.category,
                layer: `Layer ${result.layer}`,
                verdict: result.verdict,
                integrityScore: `${result.integrityScore}%`,
                risk: `${result.questions.constitutionalRisk}%`
              }
            });
          }
        }
      }
    }, 280);
  };

  // Custom Asset Creator and Validator Handler
  const handleCustomAssetCheck = () => {
    if (!customAssetName.trim()) return;

    const id = "custom_" + Date.now();
    const isViolationText = customAssetCode.toLowerCase().includes("bypass") || 
                            customAssetCode.toLowerCase().includes("disable") || 
                            customAssetCode.toLowerCase().includes("fractional") || 
                            customAssetCode.toLowerCase().includes("reserve") && parseFloat(customAssetCode) < 1.0 ||
                            customAssetDesc.toLowerCase().includes("reserva fracionária") ||
                            customAssetDesc.toLowerCase().includes("bypass");

    const isGamified = customAssetCode.toLowerCase().includes("bonus") || 
                        customAssetCode.toLowerCase().includes("token") || 
                        customAssetCode.toLowerCase().includes("point") ||
                        customAssetDesc.toLowerCase().includes("recompensas") ||
                        customAssetDesc.toLowerCase().includes("gamificação");

    let finalVerdict: any = "CONSTITUTIONALLY COMPLIANT";
    let finalColor = "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
    let score = 100;
    let questionsAnswers: any = {
      hasConstitutionalBasis: { status: true, detail: "Confirmado com base nas diretrizes gerais e memorando estratégico institucional." },
      hasLegalBasis: { status: true, detail: "Atende aos critérios operacionais previstos na regulamentação geral das instituições eletrônicas." },
      hasTraceability: { status: true, detail: "Controle de estado transacional encapsulado com assinaturas lógicas e integridade." },
      hasPolicyCoverage: { status: true, detail: "Adequado às políticas de auditoria e contingenciamento geral de processos." },
      hasTestCoverage: { status: true, detail: "Testes básicos declarados no módulo correspondente." },
      hasObservability: { status: true, detail: "Integrado ao barramento geral e exportando métricas padrão de atividade." },
      hasAdrJustification: { status: true, detail: "Registro implícito alinhado aos padrões e ADRs gerais de desenvolvimento do ecossistema." },
      knownInstitutionalImpact: "Melhoria incremental do fluxo operacional, facilitação da jornada do utilizador e integridade auditável.",
      constitutionalRisk: 4,
      principleConflicts: "Nenhum conflito detetado com as cláusulas constitucionais duras.",
      reducesIntelligence: { status: false, detail: "Mantém a coerência conceitual do KMOS e otimiza processos internos." }
    };

    let violationReport: any = undefined;

    if (isViolationText) {
      finalVerdict = "VETO ABSOLUTO";
      finalColor = "text-red-500 bg-red-500/10 border-red-500/20";
      score = 8;
      questionsAnswers = {
        hasConstitutionalBasis: { status: false, detail: "VIOLAÇÃO: Contraria o fundamento básico de blindagem e insolvabilidade fiduciária 1:1." },
        hasLegalBasis: { status: false, detail: "Violado. Conflita diretamente com a regulação prudencial e integridade contábil do BNA." },
        hasTraceability: { status: false, detail: "Rompido. A alteração de segurança ou rácio de custódia obscurece a auditabilidade imediata de fundos." },
        hasPolicyCoverage: { status: false, detail: "Quebra as restrições e limites regulados pelo compilador soberano." },
        hasTestCoverage: { status: false, detail: "Incompatível com testes contábeis fidedignos de partidas dobradas." },
        hasObservability: { status: true, detail: "Detectado imediatamente como desvio arquitetural estrutural severo." },
        hasAdrJustification: { status: false, detail: "Viola as deliberações de segurança cibernética e de custódia (ADR-005, ADR-009)." },
        knownInstitutionalImpact: "Cria passivos vulneráveis, expondo a instituição a ataques MitM ou fraude de insolvência severa.",
        constitutionalRisk: 98,
        principleConflicts: "Conflito flagrante com os preceitos de salvaguarda de depósitos e canais invioláveis criptográficos.",
        reducesIntelligence: { status: true, detail: "Reduz drasticamente a integridade operacional e segurança lógica do KwanzaMóvel." }
      };

      violationReport = {
        summary: "Tentativa de bypass de controles criptográficos de canal (mTLS/TLS) ou diminuição do rácio de provisionamento fiduciário de Kwanza.",
        severity: "EXTREMA",
        principleViolated: "Princípio Fundamental Único & Princípio 1: Prioridade do Conhecimento Institucional e Inviolabilidade Criptográfica.",
        affectedCapabilities: "Custódia Fiduciária de Saldos, Transações em Tempo Real, Segurança do Ledger, Auditoria SPTR.",
        affectedDomains: "Canais de Integração de Rede, Barramento do BNA, Sistema de Custódia e Liquidação.",
        affectedPolicies: "100PercentReserveRequirement, MtlsCipherSuitesPolicy, SecurityAuditsEngine.",
        affectedTests: "ReserveCustodyTest.ts, CommunicationHandshakeTest.ts.",
        affectedRegulations: "Aviso n.º 07/2020 do BNA (Artigo 5.º) & Lei n.º 40/20 do Sistema de Pagamento.",
        riskLevel: "CRÍTICO - VETO IMEDIATO DO MOTOR CONSTITUCIONAL",
        recommendedMitigation: "Cancelar imediatamente a submissão. Restaurar controles rígidos mTLS 1.3 e manter rácio de liquidez em exatos 1:1 fiduciários.",
        estimatedEffort: "Impossível contornar sem aprovação explícita física multipartes dos Governadores de Custódia do BNA.",
        institutionalImpact: "Intervenção judicial criminal das autoridades estatais angolanas, suspensão irreversível da licença operacional e bloqueio no SPTR."
      };
    } else if (isGamified) {
      finalVerdict = "REQUER AJUSTE DE NEXO";
      finalColor = "text-amber-400 bg-amber-400/10 border-amber-400/20";
      score = 70;
      questionsAnswers = {
        hasConstitutionalBasis: { status: true, detail: "Tenta incentivar a expansão da carteira digital móvel no interior rural do país." },
        hasLegalBasis: { status: false, detail: "Pendente. Aviso BNA 11/2021 restringe a criação de instrumentos que possam mimetizar passivos fiduciários eletrónicos." },
        hasTraceability: { status: true, detail: "Os pontos virtuais são gravados em tabelas de bónus fora do Ledger transacional principal." },
        hasPolicyCoverage: { status: false, detail: "Não há política parametrizada no Policy Engine que limite a emissão destes bónus." },
        hasTestCoverage: { status: true, detail: "Falta testes de estresse contra transações simuladas e conciliação." },
        hasObservability: { status: false, detail: "O Observatory não monitora a variação deste passivo paralelo virtual de fidelidade." },
        hasAdrJustification: { status: false, detail: "Falta de decisão arquitetural registrada para justificar a viabilidade econômica do token promocional." },
        knownInstitutionalImpact: "Cria risco de desvio de nexo causal e distorção regulatória se confundido com saldo em Kwanza real.",
        constitutionalRisk: 38,
        principleConflicts: "Conflito indireto com a exclusividade e soberania do Kwanza fiduciário eletrónico como única moeda do SO.",
        reducesIntelligence: { status: true, detail: "Adiciona ruído de passivo e lógica de gamificação não respaldada por fundamentação regulamentar." }
      };

      violationReport = {
        summary: "Criação de pontos promocionais ou tokens paralelos de fidelidade sem lastro contábil ou decisão arquitetural prévia.",
        severity: "MODERADA",
        principleViolated: "Princípio 2: O Código como Ativo Observável e Nexo de Causalidade com Prerrogativas Jurídicas do BNA.",
        affectedCapabilities: "Prerrogativas de Emissão Contábil de Saldos, Módulos Promocionais.",
        affectedDomains: "Domínio de Campanhas de Usuário, Carteira Móvel Simplificada.",
        affectedPolicies: "PromoRegulations, UserAcquisitionRules, AbsoluteSolvencyPolicy.",
        affectedTests: "Inexistentes para este caso de uso.",
        affectedRegulations: "Aviso n.º 11/2021 (Regula estritamente passivos virtuais e proíbe juros ou saldos remunerados paralelos).",
        riskLevel: "ALERTA - AGUARDANDO RESOLUÇÃO DE ADR",
        recommendedMitigation: "Converter os pontos em lógica de descontos comerciais MDR, subsidiados por orçamento em Kwanza fiduciário real na contabilidade.",
        estimatedEffort: "24 engineering hours (Mapear descontos MDR, criar ADR e cadastrar limites no Policy Engine).",
        institutionalImpact: "Advertência formal ou notificação do BNA por introduzir moedas paralelas virtuais não regulamentadas."
      };
    }

    const customAsset: InstitutionalAsset = {
      id,
      name: customAssetName,
      category: customAssetCategory as any,
      layer: 8,
      description: customAssetDesc || "Ativo institucional personalizado inserido para análise de nexo regulatório.",
      definitionCode: customAssetCode || `// Definição Geral de Ativo Customizado\nclass ${customAssetName.replace(/\s+/g, "")} {\n  // Lógica customizada\n}`,
      verdict: finalVerdict,
      verdictColor: finalColor,
      integrityScore: score,
      questions: questionsAnswers,
      report: {
        purpose: !isViolationText,
        legalBasisText: isViolationText ? "VIOLADO: Aviso 07/20" : isGamified ? "Pendente: Aviso 11/21" : "Geral do KMOS",
        policyCoverage: !isViolationText && !isGamified,
        decisionRecordText: isViolationText ? "Inexistente" : isGamified ? "Pendente ADR" : "Padrão do SO",
        traceability: !isViolationText,
        tests: !isViolationText,
        observability: true
      },
      violation: violationReport
    };

    setIsRunningCheck(true);
    setLogs([]);

    const logSteps = [
      `[ENGINE] Iniciando compilação do ativo institucional customizado: '${customAssetName}'...`,
      `[KMOS_CONSTITUTION] Carregando diretrizes e restrições de conformidade...`,
      `[DECISION_ENGINE] Mapeando correspondência de ADRs e decisões arquiteturais...`,
      `[POLICY_ENGINE] Analisando limites de saldo fiduciário e mitigação de lavagem (AML)...`,
      `[KNOWLEDGE_GRAPH] Buscando arestas de nexo causal e nexo jurídico de Angola...`,
      `[TEST_VERIFICATION] Verificando conformidade com testes de integridade contábil...`,
      `[SECURITY_AUDIT] Inspecionando integridade criptográfica contra desvios...`,
      `[ANALYSIS_COMPLETE] Auditoria finalizada. Emitindo parecer institucional...`
    ];

    let current = 0;
    const interval = setInterval(() => {
      if (current < logSteps.length) {
        setLogs(prev => [...prev, logSteps[current]]);
        current++;
      } else {
        clearInterval(interval);
        setIsRunningCheck(false);
        setActiveAsset(customAsset);

        // Update health scores dynamically if violation
        if (setInstitutionalHealth && institutionalHealth) {
          if (finalVerdict === "VETO ABSOLUTO") {
            setInstitutionalHealth((prev: any) => ({
              ...prev,
              compliance: Math.max(65, prev.compliance - 8.0),
              operationalRisk: Math.min(100, prev.operationalRisk + 12.0),
              resilience: Math.max(68, prev.resilience - 6.0),
              overall: Math.max(50, Math.round((prev.compliance + prev.resilience + (100 - prev.operationalRisk)) / 3))
            }));
          } else if (finalVerdict === "REQUER AJUSTE DE NEXO") {
            setInstitutionalHealth((prev: any) => ({
              ...prev,
              compliance: Math.max(78, prev.compliance - 2.0),
              operationalRisk: Math.min(100, prev.operationalRisk + 3.0),
              overall: Math.round((prev.compliance + prev.resilience + (100 - prev.operationalRisk)) / 3)
            }));
          } else {
            setInstitutionalHealth((prev: any) => ({
              ...prev,
              compliance: Math.min(100, prev.compliance + 1.5),
              operationalRisk: Math.max(0, prev.operationalRisk - 1.0),
              overall: Math.min(100, Math.round((prev.compliance + prev.resilience + (100 - prev.operationalRisk)) / 3))
            }));
          }
        }

        // Emit domain event
        if (onEmitEvent) {
          onEmitEvent({
            time: new Date().toLocaleTimeString(),
            type: "ConstitutionalValidationExecuted",
            correlationId: "corr_const_" + Math.random().toString(16).substring(2, 8),
            lawRef: customAsset.report.legalBasisText || "KMOS Constituição",
            origin: "ConstitutionEngine",
            result: finalVerdict !== "VETO ABSOLUTO" ? "SUCCESS" : "DENIED",
            details: {
              asset: customAsset.name,
              category: customAsset.category,
              layer: "Layer 8 (Domain)",
              verdict: customAsset.verdict,
              integrityScore: `${customAsset.integrityScore}%`,
              risk: `${customAsset.questions.constitutionalRisk}%`
            }
          });
        }
      }
    }, 280);
  };

  const copyReportText = () => {
    if (!activeAsset) return;
    const reportText = `[KMOS CONSTITUTION ENGINE AUDIT REPORT]
Asset: ${activeAsset.name}
Category: ${activeAsset.category}
Verdict: ${activeAsset.verdict} (Integrity: ${activeAsset.integrityScore}%)
Abstraction Layer: Layer ${activeAsset.layer}

=========================================
COGNITIVE QUESTIONING FRAMEWORK RESULTS
=========================================
1. Existe fundamento constitucional para este ativo?
   -> ${activeAsset.questions.hasConstitutionalBasis.status ? "SIM" : "NÃO"}. ${activeAsset.questions.hasConstitutionalBasis.detail}

2. Existe fundamento jurídico?
   -> ${activeAsset.questions.hasLegalBasis.status ? "SIM" : "NÃO"}. ${activeAsset.questions.hasLegalBasis.detail}

3. Existe rastreabilidade?
   -> ${activeAsset.questions.hasTraceability.status ? "SIM" : "NÃO"}. ${activeAsset.questions.hasTraceability.detail}

4. Existe política correspondente?
   -> ${activeAsset.questions.hasPolicyCoverage.status ? "SIM" : "NÃO"}. ${activeAsset.questions.hasPolicyCoverage.detail}

5. Existe cobertura por testes?
   -> ${activeAsset.questions.hasTestCoverage.status ? "SIM" : "NÃO"}. ${activeAsset.questions.hasTestCoverage.detail}

6. Existe observabilidade?
   -> ${activeAsset.questions.hasObservability.status ? "SIM" : "NÃO"}. ${activeAsset.questions.hasObservability.detail}

7. Existe decisão arquitetural que justifique esta implementação?
   -> ${activeAsset.questions.hasAdrJustification.status ? "SIM" : "NÃO"}. ${activeAsset.questions.hasAdrJustification.detail}

8. Existe impacto institucional conhecido?
   -> ${activeAsset.questions.knownInstitutionalImpact}

9. Existe risco constitucional?
   -> ${activeAsset.questions.constitutionalRisk}%

10. Existe conflito com outro princípio?
    -> ${activeAsset.questions.principleConflicts}

11. Esta alteração reduz a inteligência institucional?
    -> ${activeAsset.questions.reducesIntelligence.status ? "SIM" : "NÃO"}. ${activeAsset.questions.reducesIntelligence.detail}

=========================================
CONSTITUTION VALIDATION REPORT CARD
=========================================
Institutional Purpose: ${activeAsset.report.purpose ? "✔" : "✖"}
Legal Basis: ${activeAsset.report.legalBasisText}
Policy Coverage: ${activeAsset.report.policyCoverage ? "✔" : "✖"}
Decision Record: ${activeAsset.report.decisionRecordText}
Traceability: ${activeAsset.report.traceability ? "✔" : "✖"}
Tests: ${activeAsset.report.tests ? "✔" : "✖"}
Observability: ${activeAsset.report.observability ? "✔" : "✖"}
Institutional Integrity: ${activeAsset.integrityScore}%

=========================================
${activeAsset.violation ? `DIAGNOSTIC OF CONSTITUTIONAL DEVIATION
-----------------------------------------
Violation Summary: ${activeAsset.violation.summary}
Severity Level: ${activeAsset.violation.severity} (Risk: ${activeAsset.violation.riskLevel})
Principle Violated: ${activeAsset.violation.principleViolated}
Affected Capabilities: ${activeAsset.violation.affectedCapabilities}
Affected Domains: ${activeAsset.violation.affectedDomains}
Affected Policies: ${activeAsset.violation.affectedPolicies}
Affected Tests: ${activeAsset.violation.affectedTests}
Affected Regulations: ${activeAsset.violation.affectedRegulations}
Recommended Mitigation: ${activeAsset.violation.recommendedMitigation}
Estimated Engineering Effort: ${activeAsset.violation.estimatedEffort}
Institutional Impact: ${activeAsset.violation.institutionalImpact}` : "No deviations found. Clean compliance status."}
=========================================
Signed Verification Hash: ${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;

    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // =========================================================================
  // 1. REGULATORY RUNTIME MOTOR
  // =========================================================================
  const handleRunRegulatoryRuntime = () => {
    setRuntimeIsRunning(true);
    setRuntimeLogs([]);
    setRuntimeResult(null);

    const steps = [
      `[REG_RUNTIME] Inicializando verificação de conformidade de transações...`,
      `[REG_RUNTIME] Carregando regras soberanas da Lei 40/20 e Avisos do BNA...`,
      `[REG_RUNTIME] Parâmetros de Entrada: Tipo: ${runtimeTxType.toUpperCase()} | Valor: ${runtimeAmount.toLocaleString()} AOA`,
      `[REG_RUNTIME] Contexto Operacional: Protocolo: ${runtimeProtocol} | Localização: ${runtimeLocation}`,
      `[REG_RUNTIME] Mapeando limites para carteira de origem: ${runtimeSourceLevel} e destino: ${runtimeDestLevel}...`,
      `[REG_RUNTIME] Analisando rácio de reserva de custódia BNA...`,
      `[REG_RUNTIME] Executando motor regulatório em tempo real contra as cláusulas constitucionais...`
    ];

    let current = 0;
    const interval = setInterval(() => {
      if (current < steps.length) {
        setRuntimeLogs(prev => [...prev, steps[current]]);
        current++;
      } else {
        clearInterval(interval);
        
        const violations: string[] = [];
        const appliedRules: any[] = [];
        
        // C-03: Security Protocol mTLS 1.3
        const isProtocolViolation = runtimeProtocol.includes("Bypass");
        appliedRules.push({
          id: "C-03",
          name: "Prerrogativa de Canais Seguros mTLS 1.3 (Lei 40/20 Art. 42)",
          status: isProtocolViolation ? "REJEITADO" : "CONFORME",
          details: isProtocolViolation 
            ? "ERRO CRÍTICO: Tentativa de bypass ou enfraquecimento das conexões de rede seguras mTLS recomendadas."
            : "Sucesso: Conexão criptografada mTLS 1.3 ativa com gateways bancários."
        });
        if (isProtocolViolation) {
          violations.push("Bypass de autenticação mTLS (Violação de segurança do Artigo 42.º da Lei n.º 40/20).");
        }

        // C-04: MDR Merchant Fee Cap
        const feeRate = runtimeLocation === "Rural" ? 0.005 : 0.012;
        let calculatedFee = runtimeAmount * feeRate;
        const rawFee = calculatedFee;
        if (calculatedFee > 500) {
          calculatedFee = 500; // Cap
        }
        appliedRules.push({
          id: "C-04",
          name: "Capping de Micro-Taxas MDR Comerciais (Aviso 06/2020)",
          status: "CONFORME",
          details: `Taxa calculada: ${rawFee.toFixed(2)} AOA (${(feeRate * 100).toFixed(1)}%). Aplicado capping de 500.00 AOA. Cobrança final: ${calculatedFee.toFixed(2)} AOA.`
        });

        // C-01: 100% Reserve Custody Requirement
        let ratioAfter = runtimeReserveBna / runtimeTotalSupply;
        if (runtimeTxType === "issue") {
          ratioAfter = runtimeReserveBna / (runtimeTotalSupply + runtimeAmount);
        }
        const isReserveViolation = ratioAfter < 1.0;
        
        if (runtimeTxType === "issue") {
          appliedRules.push({
            id: "C-01",
            name: "Imunidade Fiduciária Total 1:1 (Aviso 07/2020 Art. 5)",
            status: isReserveViolation ? "REJEITADO" : "CONFORME",
            details: `Solicitada emissão de ${runtimeAmount.toLocaleString()} Kwanza Digital. Proporção fiduciária BNA após emissão: ${(ratioAfter * 100).toFixed(2)}%.`
          });
          if (isReserveViolation) {
            violations.push(`Reserva fracionária bloqueada. Rácio fiduciário seria de ${(ratioAfter * 100).toFixed(2)}%, violando o requerimento de reserva integral de 100% (Aviso 07/2020).`);
          }
        } else {
          appliedRules.push({
            id: "C-01",
            name: "Imunidade Fiduciária Total 1:1 (Aviso 07/2020 Art. 5)",
            status: "CONFORME",
            details: `Rácio de custódia fiduciária verificado em ${(ratioAfter * 100).toFixed(2)}% (Saldos sob custódia fiduciária: ${runtimeReserveBna.toLocaleString()} AOA).`
          });
        }

        // C-02: KYC Limits checking
        const limitMap = {
          "Level-1": 200000,
          "Level-2": 1500000,
          "Level-3": Infinity
        };

        if (runtimeTxType === "transfer") {
          const sourceLimit = limitMap[runtimeSourceLevel];
          const isSourceOverLimit = runtimeAmount > sourceLimit;
          
          appliedRules.push({
            id: "C-02",
            name: "KYC Simplificado para Inclusão (Aviso 11/2021 Art. 12)",
            status: isSourceOverLimit ? "REJEITADO" : "CONFORME",
            details: `Carteira Origem (${runtimeSourceLevel}): Teto de ${sourceLimit === Infinity ? "Ilimitado" : sourceLimit.toLocaleString() + " AOA"}. Valor solicitado: ${runtimeAmount.toLocaleString()} AOA.`
          });
          if (isSourceOverLimit) {
            violations.push(`Operação excede o teto permitido de carteira simplificada ${runtimeSourceLevel} (Máximo permitido: ${sourceLimit.toLocaleString()} AOA, solicitado: ${runtimeAmount.toLocaleString()} AOA).`);
          }
        }

        // C-05: Exclusividade Monetária
        if (runtimeTxType === "gamified") {
          appliedRules.push({
            id: "C-05",
            name: "Exclusividade Monetária de Curso Legal (Constituição KMOS)",
            status: "REJEITADO",
            details: "REJEITADO: Aviso 11/2021 proíbe a emissão de moedas paralelas promocionais que mimetizem saldos fiduciários em carteira móvel."
          });
          violations.push("Criação de tokens promocionais paralelos sem nexo com depósitos reais fiduciários no BNA.");
        }

        const isOk = violations.length === 0;
        setRuntimeResult({
          ok: isOk,
          violations,
          appliedRules,
          calculatedFee,
          reserveRatioAfter: ratioAfter,
          executionTimeMs: Math.floor(Math.random() * 30) + 8,
          verificationHash: Array.from({ length: 48 }, () => Math.floor(Math.random() * 16).toString(16)).join("")
        });
        setRuntimeIsRunning(false);

        if (onEmitEvent) {
          onEmitEvent({
            time: new Date().toLocaleTimeString(),
            type: "RegulatoryRuntimeExecuted",
            correlationId: "corr_run_" + Math.random().toString(16).substring(2, 8),
            lawRef: isOk ? "Lei 40/20 / Avisos" : "BLOCKED",
            origin: "RegulatoryRuntime",
            result: isOk ? "APPROVED" : "BLOCKED",
            details: {
              txType: runtimeTxType,
              amount: `${runtimeAmount} AOA`,
              ok: isOk ? "TRUE" : "FALSE",
              violationsCount: violations.length,
              calculatedFee: `${calculatedFee} AOA`
            }
          });
        }
      }
    }, 200);
  };

  // =========================================================================
  // 2. BIDIRECTIONAL KNOWLEDGE GRAPH EXPLORER DATASET
  // =========================================================================
  const KNOWLEDGE_GRAPH_NODES: Record<string, {
    id: string;
    label: string;
    type: "law" | "article" | "adr" | "policy" | "domain" | "test" | "observability";
    details: string;
    connections: string[];
    affectedAPIs: string[];
    affectedTests: string[];
    adrRevisions: string[];
    impactReport: string;
  }> = {
    "Lei-40-20": {
      id: "Lei-40-20",
      label: "Lei n.º 40/20 do Sistema de Pagamentos",
      type: "law",
      details: "Lei magna nacional que estabelece os preceitos gerais de liquidação, custódia e compensação no território soberano de Angola.",
      connections: ["Aviso-07-20", "Aviso-11-21", "ADR-005"],
      affectedAPIs: ["/api/ledger/settle", "/api/wallets/transfer"],
      affectedTests: ["DoubleEntryLedgerTest.ts"],
      adrRevisions: ["ADR-005-Canais-Mtls", "ADR-021-Immutable-Ledger-Acid"],
      impactReport: "Impacto Crítico: Define a licença operacional e os ritos de reconciliação soberana com o SPTR."
    },
    "Aviso-07-20": {
      id: "Aviso-07-20",
      label: "Aviso n.º 07/2020 (Salvaguarda e Rácio 1:1)",
      type: "article",
      details: "Artigo 5.º: Exige que cada unidade de moeda eletrónica emitida possua rácio fiduciário de 100% depositado no Banco Nacional de Angola. Proibição absoluta de reserva fracionária.",
      connections: ["Lei-40-20", "ADR-002", "ReserveBalanceAggregate"],
      affectedAPIs: ["/api/custody/reserve", "/api/wallets/create"],
      affectedTests: ["ReserveCustodyTest.ts"],
      adrRevisions: ["ADR-002-Imunidade-Fiduciaria-1-1"],
      impactReport: "Impacto Supremo: Qualquer quebra no rácio gera desvio do balanço patrimonial e intervenção judicial imediata."
    },
    "Aviso-11-21": {
      id: "Aviso-11-21",
      label: "Aviso n.º 11/2021 (Carteiras & KYC Simplificado)",
      type: "article",
      details: "Artigo 12.º: Define os limites e tetos operacionais para carteiras móveis simplificadas Level 1 (200.000 AOA) e Level 2 (1.500.000 AOA) visando inclusão financeira rural.",
      connections: ["Lei-40-20", "TransferUseCase"],
      affectedAPIs: ["/api/wallets/limit", "/api/kyc/verify"],
      affectedTests: ["KycLimitCheckTest.ts"],
      adrRevisions: ["ADR-014-Simplified-Kyc-Policy"],
      impactReport: "Impacto Operacional: Permite o funcionamento legal do aplicativo na área rural sem necessidade de passaporte ou dados complexos, viabilizando o SMS Offline."
    },
    "ADR-002": {
      id: "ADR-002",
      label: "ADR-002-Imunidade-Fiduciaria-1-1",
      type: "adr",
      details: "Registro de Decisão Arquitetural afirmando a imunidade fiduciária de saldo. Bloqueia em código qualquer tentativa de empréstimos fiduciários ou geração de crédito sem lastro.",
      connections: ["Aviso-07-20", "ReserveBalanceAggregate"],
      affectedAPIs: ["/api/custody/reserve"],
      affectedTests: ["ReserveCustodyTest.ts"],
      adrRevisions: ["Nenhuma pendência. Em vigor."],
      impactReport: "Vínculo Jurídico: Transforma a restrição jurídica contábil do BNA em um invariante estático da engenharia de software."
    },
    "ADR-005": {
      id: "ADR-005",
      label: "ADR-005-Canais-Mtls (Segurança TLS)",
      type: "adr",
      details: "Estabelece a exigência absoluta de tráfego transacional protegido por TLS 1.3 recíproco com certificados emitidos pela PKI oficial do BNA.",
      connections: ["Lei-40-20"],
      affectedAPIs: ["/api/ledger/settle"],
      affectedTests: ["CommunicationHandshakeTest.ts"],
      adrRevisions: ["ADR-009-Hsm-Sovereign-Keys"],
      impactReport: "Impacto Técnico: Impede interceptação MitM ou alteração física de pacotes transacionais na rede de compensação."
    },
    "ADR-021": {
      id: "ADR-021",
      label: "ADR-021-Immutable-Ledger-Acid",
      type: "adr",
      details: "Decisão que fixa que o Ledger do KwanzaMóvel opera em partidas dobradas restritas sobre banco relacional com isolamento serializável, garantindo imutabilidade transacional.",
      connections: ["TransferUseCase", "DoubleEntryLedgerTest"],
      affectedAPIs: ["/api/ledger/balance"],
      affectedTests: ["DoubleEntryLedgerTest.ts"],
      adrRevisions: ["Nenhuma. Invariante básico do KMOS."],
      impactReport: "Impacto de Observabilidade: Impede qualquer alteração manual ou fraude de saldo na base de dados."
    },
    "ReserveBalanceAggregate": {
      id: "ReserveBalanceAggregate",
      label: "ReserveBalanceAggregate (Domínio de Custódia)",
      type: "domain",
      details: "Agregado principal de custódia que gerencia os saldos e o provisionamento físico em Kwanza mantido no BNA.",
      connections: ["Aviso-07-20", "ADR-002"],
      affectedAPIs: ["/api/custody/reserve"],
      affectedTests: ["ReserveCustodyTest.ts"],
      adrRevisions: ["ADR-002-Imunidade-Fiduciaria-1-1"],
      impactReport: "Impacto Arquitetural: Isola o controle prudencial do restante do fluxo de pagamento urbano."
    },
    "TransferUseCase": {
      id: "TransferUseCase",
      label: "TransferUseCase (Caso de Uso de Balanço)",
      type: "domain",
      details: "Módulo de aplicação encarregado de registrar o débito e o crédito mútuo entre carteiras em regime ACID.",
      connections: ["Aviso-11-21", "ADR-021", "DoubleEntryLedgerTest", "LedgerCommittedEvent"],
      affectedAPIs: ["/api/wallets/transfer"],
      affectedTests: ["DoubleEntryLedgerTest.ts"],
      adrRevisions: ["ADR-021-Immutable-Ledger-Acid"],
      impactReport: "Impacto Operacional: Garante que nenhuma moeda seja criada ou destruída na transferência simples, eliminando anomalias contábeis."
    },
    "DoubleEntryLedgerTest": {
      id: "DoubleEntryLedgerTest",
      label: "DoubleEntryLedgerTest (Suite de Testes)",
      type: "test",
      details: "Suíte de testes de desenvolvimento que valida exaustivamente se o somatório dos débitos e créditos de todas as carteiras resulta exatamente em zero.",
      connections: ["TransferUseCase", "ADR-021"],
      affectedAPIs: [],
      affectedTests: ["Executado automaticamente em cada PR (CI/CD)"],
      adrRevisions: ["ADR-021-Immutable-Ledger-Acid"],
      impactReport: "Impacto de Garantia: Bloqueia deploys automáticos se houver alteração contábil incompatível com o balanço patrimonial duplo."
    },
    "LedgerCommittedEvent": {
      id: "LedgerCommittedEvent",
      label: "LedgerCommittedEvent (Event Stream / Telemetria)",
      type: "observability",
      details: "Evento disparado para o barramento que alimenta o Observatory com a telemetria em tempo real das transações finalizadas.",
      connections: ["TransferUseCase"],
      affectedAPIs: ["/api/observatory/stream"],
      affectedTests: [],
      adrRevisions: ["ADR-010-Event-Sourcing-Observability"],
      impactReport: "Impacto de Auditoria: Alimenta de forma instantânea a auditoria de SLA e telemetria analítica regulamentada."
    }
  };

  // =========================================================================
  // 3. PIPELINE DE CI/CD - CONSTITUTION PIPELINE GUARD
  // =========================================================================
  const handleRunPRPipeline = () => {
    setPipelineIsRunning(true);
    setPipelineLogs([]);
    setPipelineVerdict(null);

    const prInfo = {
      pr_mtls: {
        title: "PR #104: Bypass mTLS handshake em Dev/Staging para ganho de performance",
        files: ["src/infrastructure/network/mtls.ts", "vite.config.ts"],
        author: "Dev Core-Net",
        verdict: "VETO ABSOLUTO",
        severity: "EXTREMA",
        integrityScore: 12,
        principle: "Princípio 1: Inviolabilidade Criptográfica de Canal.",
        regRef: "Lei 40/20 (Artigo 42.º - Prerrogativa de Canais Seguros)",
        adrRef: "Violou ADR-005 (Canais mTLS com BNA)",
        impact: "Abertura de canal vulnerável a MitM, comprometendo a comunicação com a rede compensadora BNA.",
        mitigation: "Reverter bypass. Restabelecer autenticação mTLS baseada em PKI soberana de Angola em todos os ambientes de teste.",
        effort: "12 horas de engenharia para reconfiguração física de certificados."
      },
      pr_reserve: {
        title: "PR #105: Otimização de Rácio - Ajustar rácio fiduciário de liquidez para 95% para micro-créditos",
        files: ["src/domain/custody/ReserveBalanceAggregate.ts", "src/db/schema.ts"],
        author: "Fintech Innovation Team",
        verdict: "VETO ABSOLUTO",
        severity: "EXTREMA",
        integrityScore: 5,
        principle: "Princípio Fundamental Único: Rácio fiduciário absoluto 1:1.",
        regRef: "Aviso n.º 07/2020 do BNA (Artigo 5.º - Imunidade de Depósitos)",
        adrRef: "Violou ADR-002 (Proibição Total de Reserva Fracionária)",
        impact: "Criação de passivos fiduciários sem respaldo correspondente de Kwanza físico. Exposição contábil grave e cassação imediata da licença de carteira móvel.",
        mitigation: "Bloquear integralmente qualquer modelo de reserva fracionária. Manter rácio absoluto em exatos 100% de cobertura sob custódia.",
        effort: "Impossível contornar por regulação constitucional."
      },
      pr_gamify: {
        title: "PR #106: Inovação - Introduzir Token Virtual 'KMOS Gold' com incentivos de pontos promocionais rurais",
        files: ["src/domain/promotions/LoyaltyEngine.ts", "src/components/WalletView.tsx"],
        author: "Marketing Growth",
        verdict: "REQUER AJUSTE DE NEXO",
        severity: "MODERADA",
        integrityScore: 68,
        principle: "Princípio 5: Exclusividade Monetária do Kwanza.",
        regRef: "Aviso n.º 11/2021 (Artigo 24.º - Restrições de Ativos Virtuais)",
        adrRef: "Falta ADR de justificativa econômica de lastro contábil.",
        impact: "Criação de passivos digitais promocionais fungíveis que podem emular Kwanza fiduciário real.",
        mitigation: "Ajustar o nexo causal. Converter os pontos de fidelidade em descontos comerciais de taxas MDR, subsidiados por um orçamento formal em Kwanza já provisionado na conta contábil urbana.",
        effort: "24 horas (Mapear MDR, cadastrar ADR e registrar limites no Policy Engine)."
      },
      pr_secure: {
        title: "PR #107: Segurança - Assinatura HSM de Chaves em Lote para liquidação interbancária rápida",
        files: ["src/infrastructure/hsm/BatchSigner.ts", "src/infrastructure/ledger/SettlementService.ts"],
        author: "Lead Architect Security",
        verdict: "CONSTITUTIONALLY COMPLIANT",
        severity: "NENHUMA",
        integrityScore: 100,
        principle: "Todos os princípios atendidos.",
        regRef: "Lei 40/20 (Segurança e Rastreabilidade) e Avisos do BNA",
        adrRef: "Alinhado com ADR-021 e ADR-009 (Criptografia e Rastreamento)",
        impact: "Acelera as liquidações em lote de 1.5s para 100ms mantendo a integridade soberana fidedigna das chaves HSM.",
        mitigation: "Nenhuma ação necessária. PR aprovado e pronto para deploy automático.",
        effort: "Pronto para deploy automático no cluster Cloud Run."
      }
    }[pipelineSelectedPR];

    const pipelineSteps = [
      `[CI/CD] [GIT] Gatilho acionado por Pull Request: ${prInfo.title}`,
      `[CI/CD] [STATIC_ANALYSIS] Compilando e lendo arquivos modificados: ${prInfo.files.join(", ")}...`,
      `[CI/CD] [KNOWLEDGE_GRAPH] Rastreando nexo de causalidade estrutural na base de conhecimento viva...`,
      `[CI/CD] [KNOWLEDGE_GRAPH] Analisando impacto regulatório: correlacionando códigos com artigos e testes...`,
      `[CI/CD] [REG_RUNTIME] Executando simulação de teste no Regulatory Runtime do pipeline...`,
      `[CI/CD] [CONSTITUTION_ENGINE] Rodando validador do Guardião Constitucional do KMOS...`,
      `[CI/CD] PARECER EMITIDO. Emitindo relatório institucional de aprovação ou veto...`
    ];

    let current = 0;
    const interval = setInterval(() => {
      if (current < pipelineSteps.length) {
        setPipelineLogs(prev => [...prev, pipelineSteps[current]]);
        current++;
      } else {
        clearInterval(interval);
        
        setPipelineVerdict({
          title: prInfo.title,
          verdict: prInfo.verdict,
          severity: prInfo.severity,
          integrityScore: prInfo.integrityScore,
          principle: prInfo.principle,
          regRef: prInfo.regRef,
          adrRef: prInfo.adrRef,
          impact: prInfo.impact,
          mitigation: prInfo.mitigation,
          effort: prInfo.effort,
          hash: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(""),
          approved: prInfo.verdict === "CONSTITUTIONALLY COMPLIANT"
        });
        setPipelineIsRunning(false);

        if (setInstitutionalHealth && institutionalHealth) {
          if (prInfo.verdict === "VETO ABSOLUTO") {
            setInstitutionalHealth((prev: any) => ({
              ...prev,
              compliance: Math.max(60, prev.compliance - 9.0),
              operationalRisk: Math.min(100, prev.operationalRisk + 15.0),
              overall: Math.max(50, Math.round((prev.compliance + prev.resilience + (100 - prev.operationalRisk)) / 3))
            }));
          } else if (prInfo.verdict === "REQUER AJUSTE DE NEXO") {
            setInstitutionalHealth((prev: any) => ({
              ...prev,
              compliance: Math.max(75, prev.compliance - 3.5),
              overall: Math.round((prev.compliance + prev.resilience + (100 - prev.operationalRisk)) / 3)
            }));
          } else if (prInfo.verdict === "CONSTITUTIONALLY COMPLIANT") {
            setInstitutionalHealth((prev: any) => ({
              ...prev,
              compliance: Math.min(100, prev.compliance + 2.0),
              operationalRisk: Math.max(0, prev.operationalRisk - 2.5),
              overall: Math.min(100, Math.round((prev.compliance + prev.resilience + (100 - prev.operationalRisk)) / 3))
            }));
          }
        }

        if (onEmitEvent) {
          onEmitEvent({
            time: new Date().toLocaleTimeString(),
            type: "PipelineValidationExecuted",
            correlationId: "corr_pr_" + Math.random().toString(16).substring(2, 8),
            lawRef: prInfo.regRef,
            origin: "ConstitutionPipelineGuard",
            result: prInfo.verdict !== "VETO ABSOLUTO" ? "PIPELINE_PASSED" : "PIPELINE_BLOCKED",
            details: {
              pr: prInfo.title,
              verdict: prInfo.verdict,
              integrity: `${prInfo.integrityScore}%`
            }
          });
        }
      }
    }, 200);
  };

  // =========================================================================
  // 4. INSTITUTIONAL EVIDENCE ENGINE MOTOR
  // =========================================================================
  const handleGenerateEvidence = () => {
    setEvidenceIsGenerating(true);
    setEvidenceLogs([]);
    setEvidencePackage(null);
    setCurrentReceipt(null);

    // Dynamic receipt generation using our custom ReceiptEngine
    let receiptType: ReceiptType = "P2P_TRANSFER";
    let amount = Money.fromDecimal(75000);
    let senderId = "+244923000444";
    let senderName = "Carlos Antunes";
    let receiverId = "+244992384112";
    let receiverName = "Maria da Conceição";
    let status: "SUCCESS" | "FAILED" = "SUCCESS";
    let txId = "TX-88432";

    if (evidenceSelectedTx === "tx_88433") {
      receiptType = "SETTLEMENT";
      amount = Money.fromDecimal(2500000);
      senderId = "BNA_RESERVE_VAULT";
      senderName = "Sovereign Reserve Vault BNA";
      receiverId = "KM_LIQUIDITY_POOL";
      receiverName = "KMOS Liquidity Pool";
      status = "SUCCESS";
      txId = "TX-88433";
    } else if (evidenceSelectedTx === "tx_88434") {
      receiptType = "SERVICE_PAY";
      amount = Money.fromDecimal(12000);
      senderId = "+244911222333";
      senderName = "Chitembo Rural Node";
      receiverId = "AGENT-HUAMBO-09";
      receiverName = "Agente Local Huambo";
      status = "SUCCESS";
      txId = "TX-88434";
    } else if (evidenceSelectedTx === "tx_88435") {
      receiptType = "MERCHANT_PAY";
      amount = Money.fromDecimal(500000);
      senderId = "PROMO_SANDBOX_01";
      senderName = "Marketing Sandbox";
      receiverId = "PROMO_LOYALTY_WALLET";
      receiverName = "Promo Loyalty Wallet";
      status = "FAILED";
      txId = "TX-88435";
    }

    // Call the domain generator!
    const receipt = ReceiptGenerator.create({
      txId,
      type: receiptType,
      amount,
      senderId,
      senderName,
      receiverId,
      receiverName,
      status
    });

    // Save in Repository
    ReceiptRepository.save(receipt);

    const steps = [
      `[EVIDENCE_ENGINE] Consultando transação id: ${receipt.txId}...`,
      `[EVIDENCE_ENGINE] Executando ReceiptEngine (ReceiptGenerator.create)...`,
      `[EVIDENCE_ENGINE] Registrando recibo #${receipt.id} no ReceiptRepository...`,
      `[EVIDENCE_ENGINE] Mapeando balancete de partidas dobradas e posições líquidas...`,
      `[EVIDENCE_ENGINE] Rastreando nexo legal: mapeando Leis do Estado e Avisos associados...`,
      `[EVIDENCE_ENGINE] Carregando decisões de arquitetura de software (ADRs) vinculadas...`,
      `[EVIDENCE_ENGINE] Executando verificação de regras fiduciárias e de KYC...`,
      `[EVIDENCE_ENGINE] Coletando métricas e logs de telemetria e rastreabilidade (OpenTelemetry)...`,
      `[EVIDENCE_ENGINE] Assinando pacote de evidência EVP com chave institucional BNA via HSM soberano...`,
      `[EVIDENCE_ENGINE] Comprovativo e Pacote de Evidências EVP montados com sucesso pelo ReceiptEngine.`
    ];

    let current = 0;
    const interval = setInterval(() => {
      if (current < steps.length) {
        setEvidenceLogs(prev => [...prev, steps[current]]);
        current++;
      } else {
        clearInterval(interval);
        
        setCurrentReceipt(receipt);
        setEvidencePackage({
          id: receipt.evidencePackage.id,
          transactionId: receipt.txId,
          receiptId: receipt.id,
          receiptVersion: receipt.version,
          correlationId: receipt.correlationId,
          traceId: receipt.traceId,
          timestamp: receipt.timestamp,
          type: receipt.type === "P2P_TRANSFER" ? "Transferência Interbancária"
                : receipt.type === "SETTLEMENT" ? "Emissão de Custódia Fiduciária (Minting)"
                : receipt.type === "SERVICE_PAY" ? "Micro-Pagamento Rural Descentralizado (SMS)"
                : "Tentativa de Emissão Sombra (Marketing Sandbox)",
          value: receipt.amount.toString(),
          source: receipt.senderName,
          dest: receipt.receiverName,
          status: receipt.status === "SUCCESS" ? "APPROVED" : "BLOCKED",
          laws: receipt.evidencePackage.laws,
          adrs: receipt.evidencePackage.adrs,
          tests: receipt.evidencePackage.tests,
          logs: receipt.evidencePackage.logs,
          complianceScore: receipt.evidencePackage.complianceScore,
          hash: receipt.hash,
          bnaSignature: receipt.evidencePackage.hsmSignature,
          ledgerEntries: receipt.evidencePackage.ledgerEntries,
          settlementReference: receipt.evidencePackage.settlementReference,
          walletSnapshot: receipt.evidencePackage.walletSnapshot,
          constitutionValidation: receipt.evidencePackage.constitutionValidation,
          policyValidation: receipt.evidencePackage.policyValidation,
          amlResult: receipt.evidencePackage.amlResult,
          riskAssessment: receipt.evidencePackage.riskAssessment,
          retentionPolicy: receipt.evidencePackage.retentionPolicy,
          stateHistory: receipt.stateHistory
        });
        setEvidenceIsGenerating(false);

        if (onEmitEvent) {
          onEmitEvent({
            time: new Date().toLocaleTimeString(),
            type: "EvidencePackageGenerated",
            correlationId: receipt.correlationId,
            lawRef: receipt.evidencePackage.laws[0]?.ref || "Lei 40/20",
            origin: "ReceiptEngine",
            result: receipt.status === "SUCCESS" ? "EVIDENCE_SEALED" : "REJECTION_SEALED",
            details: {
              txId: receipt.txId,
              receiptId: receipt.id,
              evidenceId: receipt.evidencePackage.id,
              hash: receipt.hash.substring(0, 16),
              signature: receipt.digitalSignature.substring(0, 20)
            }
          });
        }
      }
    }, 200);
  };

  const handleRectifyReceipt = (reason: string) => {
    if (!currentReceipt) return;
    const rectified = ReceiptGenerator.rectify(currentReceipt, {
      receiverName: currentReceipt.receiverName.includes("(Retificado)") 
        ? currentReceipt.receiverName + " Novo" 
        : currentReceipt.receiverName + " (Retificado)",
      reason
    });
    
    ReceiptRepository.save(rectified);
    setCurrentReceipt(rectified);

    setEvidencePackage({
      id: rectified.evidencePackage.id,
      transactionId: rectified.txId,
      receiptId: rectified.id,
      receiptVersion: rectified.version,
      correlationId: rectified.correlationId,
      traceId: rectified.traceId,
      timestamp: rectified.timestamp,
      type: rectified.type === "P2P_TRANSFER" ? "Transferência Interbancária"
            : rectified.type === "SETTLEMENT" ? "Emissão de Custódia Fiduciária (Minting)"
            : rectified.type === "SERVICE_PAY" ? "Micro-Pagamento Rural Descentralizado (SMS)"
            : "Tentativa de Emissão Sombra (Marketing Sandbox)",
      value: rectified.amount.toString(),
      source: rectified.senderName,
      dest: rectified.receiverName,
      status: rectified.status === "SUCCESS" ? "APPROVED" : "BLOCKED",
      laws: rectified.evidencePackage.laws,
      adrs: rectified.evidencePackage.adrs,
      tests: rectified.evidencePackage.tests,
      logs: rectified.evidencePackage.logs,
      complianceScore: rectified.evidencePackage.complianceScore,
      hash: rectified.hash,
      bnaSignature: rectified.evidencePackage.hsmSignature,
      ledgerEntries: rectified.evidencePackage.ledgerEntries,
      settlementReference: rectified.evidencePackage.settlementReference,
      walletSnapshot: rectified.evidencePackage.walletSnapshot,
      constitutionValidation: rectified.evidencePackage.constitutionValidation,
      policyValidation: rectified.evidencePackage.policyValidation,
      amlResult: rectified.evidencePackage.amlResult,
      riskAssessment: rectified.evidencePackage.riskAssessment,
      retentionPolicy: rectified.evidencePackage.retentionPolicy,
      stateHistory: rectified.stateHistory
    });

    if (onEmitEvent) {
      onEmitEvent({
        time: new Date().toLocaleTimeString(),
        type: "ReceiptRectified",
        correlationId: rectified.correlationId,
        lawRef: "Lei 40/20 - Artigo 42",
        origin: "ReceiptEngine",
        result: `VERSION_v${rectified.version}_SEALED`,
        details: {
          txId: rectified.txId,
          receiptId: rectified.id,
          evidenceId: rectified.evidencePackage.id,
          version: rectified.version,
          reason
        }
      });
    }
  };

  const handleDownloadReceiptPdf = async () => {
    if (!currentReceipt || !evidencePackage) {
      alert("Nenhum recibo ativo para download.");
      return;
    }

    const format = evidenceReceiptFormat; // "58mm" | "80mm" | "A5" | "A4"
    const doc = await ReceiptTemplate.generateReceiptPdf(currentReceipt, format);
    doc.save(`recibo_${currentReceipt.id}_v${currentReceipt.version}.pdf`);
  };

  const handleDownloadDossierPdf = () => {
    if (!evidencePackage) {
      alert("Nenhum pacote de evidência ativo para download.");
      return;
    }

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const width = 210;
    const height = 297;
    const margin = 15;

    // Header Bar
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, width, 22, "F");

    doc.setFillColor(184, 115, 51);
    doc.rect(0, 22, width, 1.5, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text("REPÚBLICA DE ANGOLA", margin, 10);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.text("SISTEMA DE AUDITORIA DE LIQUIDEZ E CONFORMIDADE (SGA-BNA)", margin, 15);

    let y = 36;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42);
    doc.text("DOSSIER DE EVIDÊNCIA REGULATÓRIA", margin, y);

    y += 7;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(184, 115, 51);
    doc.text(`CÓDIGO DE AUDITORIA EVP: ${evidencePackage.id}`, margin, y);

    y += 5;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(margin, y, width - margin, y);

    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    doc.text("Este dossier constitui prova técnica e jurídica incontestável e imutável para a transação descrita, em estrita conformidade com a Lei n.º 40/20 (Lei de Segurança de Sistemas de Informação de Angola) e as demais diretivas de conformidade monetária fixadas pelo Banco Nacional de Angola (BNA).", margin, y, { maxWidth: 180 });

    y += 20;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text("1. IDENTIFICAÇÃO GERAL E RASTREABILIDADE", margin, y);
    doc.line(margin, y + 1.5, width - margin, y + 1.5);

    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const metadataGrid = [
      ["Reference EVP ID:", evidencePackage.id, "Correlation ID:", evidencePackage.correlationId],
      ["Transaction ID:", evidencePackage.transactionId, "Trace ID:", evidencePackage.traceId],
      ["Receipt ID:", evidencePackage.receiptId, "Versão Recibo:", `v${evidencePackage.receiptVersion}`],
      ["Operação:", evidencePackage.type, "Score Compliance:", `${evidencePackage.complianceScore}%`],
      ["Data/Hora Registo:", evidencePackage.timestamp.replace("T", " ").substring(0, 19), "Canal Ingress:", "KwanzaMóvel Core Engine"],
    ];

    metadataGrid.forEach(([l1, v1, l2, v2]) => {
      doc.setFont("helvetica", "bold");
      doc.text(String(l1), margin, y);
      doc.setFont("helvetica", "normal");
      doc.text(String(v1), margin + 40, y);

      doc.setFont("helvetica", "bold");
      doc.text(String(l2), width / 2 + 5, y);
      doc.setFont("helvetica", "normal");
      doc.text(String(v2), width / 2 + 40, y);
      y += 6;
    });

    y += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text("2. ENQUADRAMENTO LEGAL E REGULATÓRIO (LEI 40/20)", margin, y);
    doc.line(margin, y + 1.5, width - margin, y + 1.5);

    y += 7;
    if (evidencePackage.laws && evidencePackage.laws.length > 0) {
      evidencePackage.laws.forEach((law: any) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(184, 115, 51);
        doc.text(law.ref, margin, y);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(51, 65, 85);
        doc.text(`- ${law.name}: ${law.details}`, margin, y + 4, { maxWidth: 180 });
        y += 9.5;
      });
    } else {
      doc.setFont("helvetica", "normal");
      doc.text("Nenhum enquadramento legal diretamente indexado.", margin, y);
      y += 6;
    }

    y += 3;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text("3. DECISÕES DE ARQUITETURA DE SOFTWARE (ADRs VINCULADAS)", margin, y);
    doc.line(margin, y + 1.5, width - margin, y + 1.5);

    y += 7;
    if (evidencePackage.adrs && evidencePackage.adrs.length > 0) {
      evidencePackage.adrs.forEach((adr: any) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(30, 41, 59);
        doc.text(`• ${adr.id}: ${adr.name}`, margin, y);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 116, 139);
        doc.text(adr.desc, margin + 4, y + 4, { maxWidth: 176 });
        y += 9;
      });
    } else {
      doc.text("Sem decisões de arquitetura diretamente vinculadas.", margin, y);
      y += 6;
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("Página 1 de 2", width / 2, height - 10, { align: "center" });

    // Page 2
    doc.addPage();
    
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, width, 12, "F");
    doc.setFillColor(184, 115, 51);
    doc.rect(0, 12, width, 1, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(`DETALHAMENTO DE AUDITORIA CRIPTOGRÁFICA E MONETÁRIA — EVP: ${evidencePackage.id}`, margin, 7);

    y = 22;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text("4. CONCILIAÇÃO DE PARTIDAS DOBRADAS (LEDGER)", margin, y);
    doc.line(margin, y + 1.5, width - margin, y + 1.5);

    y += 7;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text("Conta", margin, y);
    doc.text("Tipo", margin + 90, y);
    doc.text("Valor", width - margin, y, { align: "right" });
    doc.line(margin, y + 1.5, width - margin, y + 1.5);

    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    if (evidencePackage.ledgerEntries && evidencePackage.ledgerEntries.length > 0) {
      evidencePackage.ledgerEntries.forEach((entry: any) => {
        doc.text(entry.account, margin, y);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(entry.type === "DEBIT" ? 220 : 16, entry.type === "DEBIT" ? 38 : 185, entry.type === "DEBIT" ? 38 : 129);
        doc.text(entry.type, margin + 90, y);
        doc.text(entry.amount, width - margin, y, { align: "right" });
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 116, 139);
        y += 5.5;
      });
    } else {
      doc.text("Sem lançamentos contabilizados.", margin, y);
      y += 6;
    }

    y += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text("5. MOTORES DE DECISÃO (CONSTITUTION & POLICY ENGINE)", margin, y);
    doc.line(margin, y + 1.5, width - margin, y + 1.5);

    y += 7;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(184, 115, 51);
    doc.text("Constitution Engine Validation:", margin, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);
    doc.text(`Estado: ${evidencePackage.constitutionValidation?.status || "VALID"}. Regras avaliadas: ${evidencePackage.constitutionValidation?.rulesEvaluated?.join(", ") || "Sem regras"}.`, margin + 4, y + 4, { maxWidth: 176 });

    y += 10;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(184, 115, 51);
    doc.text("Policy Engine Validation:", margin, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);
    doc.text(`Estado: ${evidencePackage.policyValidation?.status || "VALID"}. Limites: ${evidencePackage.policyValidation?.limitsChecked || "OK"}. Aprovação Compliance: ${evidencePackage.policyValidation?.complianceOfficerApproved ? "APROVADO" : "NÃO REQUERIDO"}.`, margin + 4, y + 4, { maxWidth: 176 });

    y += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text("6. AVALIAÇÃO DE RISCO AML/CFT", margin, y);
    doc.line(margin, y + 1.5, width - margin, y + 1.5);

    y += 7;
    const amlNotes = evidencePackage.amlResult?.notes || "Sem riscos detectados.";
    const riskTier = evidencePackage.riskAssessment?.tier || "LOW";
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text(`• Score de Risco Calculado: ${evidencePackage.amlResult?.riskScore || 15}%`, margin, y);
    doc.text(`• Tier de Risco: ${riskTier} RISK`, margin, y + 4);
    doc.text(`• Notas de AML: ${amlNotes}`, margin, y + 8, { maxWidth: 180 });

    y += 14;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text("7. SALVAGUARDA DE PROVAS & HISTÓRICO DE AUDITORIA (LEI 40/20)", margin, y);
    doc.line(margin, y + 1.5, width - margin, y + 1.5);

    y += 7;
    const period = evidencePackage.retentionPolicy?.holdPeriodYears || 5;
    const pDate = evidencePackage.retentionPolicy?.purgeDate || "2031-07-11";
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text(`• Categoria de Retenção Regulamentar: IMPRESCINDÍVEL SOB LEI 40/20`, margin, y);
    doc.text(`• Período de Retenção Exigido: ${period} anos consecutivos.`, margin, y + 4);
    doc.text(`• Data Programada de Expiração/Purga: ${new Date(pDate).toLocaleDateString()}`, margin, y + 8);

    if (evidencePackage.stateHistory && evidencePackage.stateHistory.length > 0) {
      y += 12;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(184, 115, 51);
      doc.text("Histórico de Retificações do Recibo (SGA-BNA):", margin, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(51, 65, 85);
      evidencePackage.stateHistory.forEach((h: any, idx: number) => {
        doc.text(`- Versão v${h.version} -> v${evidencePackage.receiptVersion}: ${h.reason} (${new Date(h.timestamp).toLocaleTimeString()})`, margin + 4, y + 4 + idx * 4, { maxWidth: 176 });
      });
    }

    y = 230;
    doc.setFillColor(250, 250, 249);
    doc.setDrawColor(220, 217, 216);
    doc.rect(margin, y, width - margin * 2, 34, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text("CERTIFICAÇÃO CRIPTOGRÁFICA DE INTEGRIDADE REGULATÓRIA", margin + 4, y + 5);

    y += 12;
    doc.setFont("courier", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`HASH SHA-256: ${evidencePackage.hash}`, margin + 4, y);
    doc.text(`ASSINATURA HSM SGP-BNA:`, margin + 4, y + 4);
    const hsmSig = evidencePackage.bnaSignature || evidencePackage.hsmSignature;
    const splitHsm = doc.splitTextToSize(String(hsmSig), width - margin * 2 - 12);
    doc.text(splitHsm, margin + 4, y + 8);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("Página 2 de 2", width / 2, height - 10, { align: "center" });

    doc.save(`dossier_evidencia_${evidencePackage.id}.pdf`);
  };

  return (
    <div id="constitution-engine-root" className="space-y-4 text-left font-sans">
      
      {/* Dynamic Tab Selector with Custom Style */}
      <div className="flex border-b border-neutral-900 pb-2 gap-2 select-none overflow-x-auto">
        {[
          { id: "auditor", label: "Validador Transversal", icon: Cpu },
          { id: "runtime", label: "1. Regulatory Runtime (Live)", icon: Play },
          { id: "graph", label: "2. Knowledge Graph Explorer", icon: Network },
          { id: "pipeline", label: "3. PR Guard & Pipeline CI/CD", icon: ShieldCheck },
          { id: "evidence", label: "4. Institutional Evidence Engine", icon: FileText },
          { id: "hierarchy", label: "Pilar de Camadas", icon: Layers },
          { id: "integrations", label: "Sistemas Integrados", icon: Network },
          { id: "rules", label: "Grafo Regulatória", icon: BookOpen },
        ].map((tab) => {
          const Icon = tab.icon;
          const isTabActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 border ${
                isTabActive
                  ? "bg-[#B87333]/15 text-[#B87333] border-[#B87333]/30 font-extrabold"
                  : "text-zinc-500 hover:text-zinc-300 border-transparent hover:bg-neutral-900/40"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          SOVEREIGN ENGINE 1: REGULATORY RUNTIME (LIVE)
          ========================================================================= */}
      {activeTab === "runtime" && (
        <div className="space-y-4 animate-fade-in text-left font-sans">
          
          {/* Section Header */}
          <div className="bg-neutral-900/10 border border-neutral-900/60 p-4 rounded-xl flex flex-col md:flex-row justify-between md:items-center gap-3">
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Play className="w-4 h-4 text-[#B87333]" />
                <span>Regulatory Runtime — Motor de Interceptação de Regras em Tempo Real</span>
              </h4>
              <p className="text-xs text-zinc-400 leading-normal mt-1 max-w-3xl">
                Diferente de uma simples consulta estática, o Regulatory Runtime do KwanzaMóvel executa e interpreta as restrições e diretivas do Banco Nacional de Angola (Lei 40/20, Avisos 07/20, 11/21) diretamente no fluxo operacional em tempo real.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                EXECUÇÃO EM RUNTIME ATIVA
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            
            {/* Left Controls - Simulator Inputs */}
            <div className="xl:col-span-5 bg-neutral-950 border border-neutral-900 rounded-xl p-4 space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <span className="text-[10px] uppercase font-black text-[#B87333] tracking-wider font-mono block border-b border-neutral-900 pb-1.5">
                  Parâmetros de Entrada da Transação
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-zinc-500 font-mono">Tipo de Transação</label>
                    <select
                      value={runtimeTxType}
                      onChange={(e: any) => setRuntimeTxType(e.target.value)}
                      className="w-full bg-black border border-neutral-900 rounded-lg p-2 text-xs text-zinc-300 outline-none"
                    >
                      <option value="transfer">Transferência entre Carteiras</option>
                      <option value="issue">Emissão de Kwanza Digital (Mint)</option>
                      <option value="gamified">Emissão de Pontos de Fidelidade</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-zinc-500 font-mono">Valor da Operação (AOA)</label>
                    <input
                      type="number"
                      value={runtimeAmount}
                      onChange={(e) => setRuntimeAmount(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full bg-black border border-neutral-900 rounded-lg p-2 text-xs text-zinc-300 font-mono outline-none"
                    />
                  </div>
                </div>

                {runtimeTxType === "transfer" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-zinc-500 font-mono">KYC Origem</label>
                      <select
                        value={runtimeSourceLevel}
                        onChange={(e: any) => setRuntimeSourceLevel(e.target.value)}
                        className="w-full bg-black border border-neutral-900 rounded-lg p-1.5 text-xs text-zinc-300 outline-none"
                      >
                        <option value="Level-1">Level 1 (Simplificada - Máx 200.000)</option>
                        <option value="Level-2">Level 2 (Parcial - Máx 1.500.000)</option>
                        <option value="Level-3">Level 3 (Completa - Sem limite)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-zinc-500 font-mono">KYC Destino</label>
                      <select
                        value={runtimeDestLevel}
                        onChange={(e: any) => setRuntimeDestLevel(e.target.value)}
                        className="w-full bg-black border border-neutral-900 rounded-lg p-1.5 text-xs text-zinc-300 outline-none"
                      >
                        <option value="Level-1">Level 1 (Máx 200.000)</option>
                        <option value="Level-2">Level 2 (Máx 1.500.000)</option>
                        <option value="Level-3">Level 3 (Sem limite)</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-zinc-500 font-mono">Localização Comercial</label>
                    <select
                      value={runtimeLocation}
                      onChange={(e: any) => setRuntimeLocation(e.target.value)}
                      className="w-full bg-black border border-neutral-900 rounded-lg p-2 text-xs text-zinc-300 outline-none"
                    >
                      <option value="Urbano">Zona Urbana (MDR Máx 1.2%)</option>
                      <option value="Rural">Zona Rural (MDR Reduzido 0.5%)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-zinc-500 font-mono">Protocolo de Rede</label>
                    <select
                      value={runtimeProtocol}
                      onChange={(e: any) => setRuntimeProtocol(e.target.value)}
                      className="w-full bg-black border border-neutral-900 rounded-lg p-2 text-xs text-[#B87333] font-mono outline-none"
                    >
                      <option value="mTLS 1.3">mTLS 1.3 Seguro (Certificado BNA)</option>
                      <option value="Bypass TLS (Dev Mode)">Bypass TLS (Modo de Desenvolvimento)</option>
                    </select>
                  </div>
                </div>

                <div className="bg-black/30 border border-neutral-900 p-3 rounded-lg space-y-2">
                  <span className="text-[9.5px] uppercase font-extrabold text-zinc-400 block font-mono">Estado da Liquidez de Custódia (BNA)</span>
                  <div className="grid grid-cols-2 gap-3 text-[11px] font-mono">
                    <div className="space-y-1">
                      <label className="text-[8px] text-zinc-500 uppercase font-black">Depósitos de Custódia BNA</label>
                      <input
                        type="number"
                        value={runtimeReserveBna}
                        onChange={(e) => setRuntimeReserveBna(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full bg-black border border-neutral-900 rounded p-1 text-[11px] text-zinc-300 text-left"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] text-zinc-500 uppercase font-black">Supply Total de Kwanza</label>
                      <input
                        type="number"
                        value={runtimeTotalSupply}
                        onChange={(e) => setRuntimeTotalSupply(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full bg-black border border-neutral-900 rounded p-1 text-[11px] text-zinc-300 text-left"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleRunRegulatoryRuntime}
                disabled={runtimeIsRunning}
                className="w-full bg-[#B87333] hover:bg-[#A35D22] text-neutral-950 font-black text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg disabled:opacity-50 mt-4 uppercase font-mono"
              >
                {runtimeIsRunning ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>Processando Regras...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Intercetar e Validar Transação</span>
                  </>
                )}
              </button>
            </div>

            {/* Right Panel - Result & Verification Output */}
            <div className="xl:col-span-7 bg-neutral-950 border border-neutral-900 rounded-xl p-4 flex flex-col justify-between min-h-[460px]">
              {runtimeIsRunning ? (
                <div className="flex-1 flex flex-col justify-between">
                  <div className="font-mono text-[10px] text-emerald-400 p-3 bg-black/60 border border-neutral-900 rounded-lg max-h-72 overflow-y-auto space-y-1.5 flex-1">
                    {runtimeLogs.map((log, i) => (
                      <div key={i} className="animate-fade-in flex items-start gap-1.5">
                        <span className="text-[#B87333] font-bold">&gt;</span>
                        <span className="leading-tight">{log}</span>
                      </div>
                    ))}
                    <div className="w-2 h-4 bg-emerald-400 animate-pulse inline-block ml-1"></div>
                  </div>
                  <div className="flex flex-col items-center justify-center py-6">
                    <Terminal className="w-8 h-8 text-[#B87333] animate-pulse" />
                    <span className="text-[9px] uppercase tracking-wider font-mono text-zinc-500 mt-2">
                      Compilador Executável de Regras do BNA
                    </span>
                  </div>
                </div>
              ) : runtimeResult ? (
                <div className="space-y-4 animate-fade-in flex-1 flex flex-col justify-between">
                  
                  {/* Verdict Banner */}
                  <div className={`p-4 rounded-xl border flex items-center gap-3 ${
                    runtimeResult.ok 
                      ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" 
                      : "bg-red-500/5 border-red-500/20 text-red-400"
                  }`}>
                    {runtimeResult.ok ? <CheckCircle className="w-6 h-6 shrink-0" /> : <ShieldAlert className="w-6 h-6 shrink-0 animate-bounce" />}
                    <div>
                      <span className="text-[8px] uppercase font-mono font-black block">Resultado da Avaliação do Guardião</span>
                      <h5 className="text-sm font-black uppercase font-mono">
                        {runtimeResult.ok ? "TRANSAÇÃO CONFORME & AUTORIZADA" : "TRANSAÇÃO VETADA PELO COMPILADOR"}
                      </h5>
                    </div>
                  </div>

                  {/* Violations Block */}
                  {runtimeResult.violations.length > 0 && (
                    <div className="bg-red-500/5 border border-red-500/20 p-3 rounded-lg space-y-1.5">
                      <span className="text-[9px] font-mono font-black uppercase text-red-400 block">Restrições Violadas ({runtimeResult.violations.length})</span>
                      {runtimeResult.violations.map((err: string, i: number) => (
                        <div key={i} className="text-xs text-zinc-300 font-sans flex items-start gap-1.5">
                          <span className="text-red-500 font-bold shrink-0 mt-0.5">•</span>
                          <span className="leading-tight">{err}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Applied Rules Summary */}
                  <div className="space-y-2">
                    <span className="text-[9px] font-mono font-black uppercase text-zinc-400 block border-b border-neutral-900 pb-1">regras aplicadas durante a execução</span>
                    <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                      {runtimeResult.appliedRules.map((rule: any, i: number) => (
                        <div key={i} className="bg-black/40 border border-neutral-900 p-2 rounded-lg flex justify-between items-start gap-2">
                          <div className="text-left space-y-0.5">
                            <span className="text-[8.5px] font-mono text-[#B87333] font-bold block">{rule.id} - {rule.name}</span>
                            <span className="text-[10.5px] text-zinc-400 block leading-tight">{rule.details}</span>
                          </div>
                          <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded font-black border uppercase shrink-0 ${
                            rule.status === "CONFORME" 
                              ? "text-emerald-400 border-emerald-400/20 bg-emerald-500/5"
                              : rule.status === "ADVERTÊNCIA"
                              ? "text-amber-400 border-amber-400/20 bg-amber-500/5"
                              : "text-red-400 border-red-400/20 bg-red-500/5"
                          }`}>
                            {rule.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary Indicators */}
                  <div className="grid grid-cols-3 gap-3 bg-neutral-900/10 border border-neutral-900 p-2.5 rounded-lg text-center font-mono text-xs">
                    <div>
                      <span className="text-[8px] text-zinc-500 block uppercase font-bold">Taxa MDR Cobrada</span>
                      <span className="text-[#B87333] font-extrabold">{runtimeResult.calculatedFee.toFixed(2)} AOA</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-zinc-500 block uppercase font-bold">Rácio Liquidez Após</span>
                      <span className={runtimeResult.reserveRatioAfter < 1.0 ? "text-red-400 font-extrabold" : "text-emerald-400 font-extrabold"}>
                        {(runtimeResult.reserveRatioAfter * 100).toFixed(2)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-[8px] text-zinc-500 block uppercase font-bold">Tempo de Resposta</span>
                      <span className="text-zinc-300 font-semibold">{runtimeResult.executionTimeMs} ms</span>
                    </div>
                  </div>

                  {/* Cryptographic Proof Signature */}
                  <div className="bg-black/80 border border-neutral-900 p-2 rounded text-[8.5px] font-mono text-zinc-500 flex justify-between items-center">
                    <span>ASSINATURA DIGITAL HSM REGULATÓRIA:</span>
                    <span className="truncate max-w-[280px] text-zinc-400 font-bold ml-2">{runtimeResult.verificationHash}</span>
                  </div>

                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 space-y-2">
                  <Sliders className="w-8 h-8 opacity-40 text-zinc-400" />
                  <span className="text-xs">Configure os parâmetros e clique no botão para executar o motor regulatório em tempo real.</span>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* =========================================================================
          SOVEREIGN ENGINE 2: INSTITUTIONAL KNOWLEDGE GRAPH (LIVE)
          ========================================================================= */}
      {activeTab === "graph" && (
        <div className="space-y-4 animate-fade-in text-left font-sans">
          
          {/* Section Header */}
          <div className="bg-neutral-900/10 border border-neutral-900/60 p-4 rounded-xl flex flex-col md:flex-row justify-between md:items-center gap-3">
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Network className="w-4 h-4 text-[#B87333]" />
                <span>Institutional Knowledge Graph — Rastreabilidade Bidirecional de Causalidade</span>
              </h4>
              <p className="text-xs text-zinc-400 leading-normal mt-1 max-w-3xl">
                O KwanzaMóvel organiza sua base de conhecimento ligando as Leis do Estado de Angola, artigos, decisões arquiteturais (ADRs), agregados de domínio de software, testes contínuos e métricas de observabilidade.
              </p>
            </div>
            <div className="relative w-52 shrink-0">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Filtrar nós do grafo..."
                value={graphSearchQuery}
                onChange={(e) => setGraphSearchQuery(e.target.value)}
                className="w-full bg-black border border-neutral-900 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-zinc-300 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            
            {/* Left Graph Node Index / Cards Grid */}
            <div className="lg:col-span-6 space-y-2 max-h-[500px] overflow-y-auto pr-1">
              <span className="text-[10px] font-mono font-extrabold text-zinc-500 uppercase block mb-1">Dicionário Semântico de Ativos</span>
              
              {Object.values(KNOWLEDGE_GRAPH_NODES)
                .filter(node => node.label.toLowerCase().includes(graphSearchQuery.toLowerCase()) || node.details.toLowerCase().includes(graphSearchQuery.toLowerCase()))
                .map((node) => {
                  const isSelected = graphSelectedNode === node.id;
                  const borderTypeColor = {
                    law: "border-amber-500/20 bg-amber-500/5 text-amber-400 hover:bg-amber-500/10",
                    article: "border-amber-500/15 bg-amber-500/5 text-amber-300 hover:bg-amber-500/10",
                    adr: "border-purple-500/20 bg-purple-500/5 text-purple-400 hover:bg-purple-500/10",
                    policy: "border-orange-500/20 bg-orange-500/5 text-orange-400 hover:bg-orange-500/10",
                    domain: "border-blue-500/20 bg-blue-500/5 text-blue-400 hover:bg-blue-500/10",
                    test: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10",
                    observability: "border-rose-500/20 bg-rose-500/5 text-rose-400 hover:bg-rose-500/10"
                  }[node.type];

                  const badgeLabel = {
                    law: "LEI MAGNA",
                    article: "ARTIGO BNA",
                    adr: "DECISÃO (ADR)",
                    policy: "POLÍTICA",
                    domain: "DOMÍNIO (DDD)",
                    test: "TEST SUITE",
                    observability: "OBSERVABILIDADE"
                  }[node.type];

                  return (
                    <button
                      key={node.id}
                      onClick={() => setGraphSelectedNode(node.id)}
                      className={`w-full border px-4 py-3 rounded-xl flex flex-col text-left transition-all cursor-pointer ${borderTypeColor} ${
                        isSelected ? "ring-2 ring-white border-white scale-[1.01]" : ""
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="text-[8px] font-mono font-extrabold tracking-wider uppercase border border-current/25 px-1.5 py-0.5 rounded leading-none">
                          {badgeLabel}
                        </span>
                        <span className="text-[9px] font-mono font-bold opacity-60">ID: {node.id}</span>
                      </div>
                      <h5 className="text-xs font-black text-white mt-1.5 font-sans truncate">{node.label}</h5>
                      <p className="text-[10.5px] text-zinc-400 leading-tight mt-1 truncate">{node.details}</p>
                    </button>
                  );
                })}
            </div>

            {/* Right Graph Inspector - Resolves the exact questions asked by the user */}
            <div className="lg:col-span-6 bg-neutral-950 border border-neutral-900 rounded-xl p-4 flex flex-col justify-between min-h-[460px]">
              {graphSelectedNode && KNOWLEDGE_GRAPH_NODES[graphSelectedNode] ? (
                <div className="space-y-4 animate-fade-in text-left">
                  
                  {/* Node Header */}
                  <div className="border-b border-neutral-900 pb-2.5">
                    <span className="text-[9px] font-mono font-black text-[#B87333] uppercase">INSPETOR DE NEXO CAUSAL</span>
                    <h4 className="text-sm font-black text-zinc-100 font-mono mt-1">
                      {KNOWLEDGE_GRAPH_NODES[graphSelectedNode].label}
                    </h4>
                    <p className="text-xs text-zinc-400 leading-relaxed font-sans mt-1">
                      {KNOWLEDGE_GRAPH_NODES[graphSelectedNode].details}
                    </p>
                  </div>

                  {/* Coherence Traverse Output (The exact answers to user's questions) */}
                  <div className="space-y-3">
                    <span className="text-[9px] font-mono font-black uppercase text-zinc-500 block">Relação e Impacto Operacional do Ativo</span>

                    {/* Que artigos da Lei 40/20 são afetados? */}
                    <div className="bg-black/50 border border-neutral-900 p-2.5 rounded-lg">
                      <span className="text-[8.5px] font-mono font-black uppercase text-zinc-500 block">Leis e Artigos Reguladores Vinculados</span>
                      <div className="flex gap-1.5 flex-wrap mt-1">
                        {KNOWLEDGE_GRAPH_NODES[graphSelectedNode].connections.filter(c => KNOWLEDGE_GRAPH_NODES[c]?.type === "law" || KNOWLEDGE_GRAPH_NODES[c]?.type === "article").map((c, i) => (
                          <span key={i} className="text-[9.5px] font-mono text-[#B87333] font-bold bg-[#B87333]/10 border border-[#B87333]/20 px-2 py-0.5 rounded">
                            {KNOWLEDGE_GRAPH_NODES[c]?.label || c}
                          </span>
                        ))}
                        {KNOWLEDGE_GRAPH_NODES[graphSelectedNode].connections.filter(c => KNOWLEDGE_GRAPH_NODES[c]?.type === "law" || KNOWLEDGE_GRAPH_NODES[c]?.type === "article").length === 0 && (
                          <span className="text-[9.5px] text-zinc-500 italic">Vínculo regulatório indireto herdado por hierarquia.</span>
                        )}
                      </div>
                    </div>

                    {/* Que testes deixam de ser válidos? */}
                    <div className="bg-black/50 border border-neutral-900 p-2.5 rounded-lg">
                      <span className="text-[8.5px] font-mono font-black uppercase text-zinc-500 block">Suítes de Testes de CI/CD que Seriam Afetados</span>
                      <div className="flex flex-col gap-1 mt-1 font-mono text-[10.5px]">
                        {KNOWLEDGE_GRAPH_NODES[graphSelectedNode].affectedTests.map((test, i) => (
                          <span key={i} className="text-emerald-400 font-bold flex items-center gap-1.5">
                            <CheckCircle className="w-3 h-3" /> {test}
                          </span>
                        ))}
                        {KNOWLEDGE_GRAPH_NODES[graphSelectedNode].affectedTests.length === 0 && (
                          <span className="text-zinc-500 italic">Nenhum teste unitário diretamente sensível a modificações básicas.</span>
                        )}
                      </div>
                    </div>

                    {/* Que APIs ficam em incumprimento? */}
                    <div className="bg-black/50 border border-neutral-900 p-2.5 rounded-lg">
                      <span className="text-[8.5px] font-mono font-black uppercase text-zinc-500 block">APIs e Portas Lógicas Sob Custódia</span>
                      <div className="flex flex-wrap gap-1.5 mt-1 font-mono text-[10px]">
                        {KNOWLEDGE_GRAPH_NODES[graphSelectedNode].affectedAPIs.map((api, i) => (
                          <span key={i} className="bg-zinc-900 border border-neutral-800 text-zinc-300 px-2 py-0.5 rounded">
                            {api}
                          </span>
                        ))}
                        {KNOWLEDGE_GRAPH_NODES[graphSelectedNode].affectedAPIs.length === 0 && (
                          <span className="text-zinc-500 italic text-[9.5px]">Nenhum endpoint de API exposto diretamente nesta abstração.</span>
                        )}
                      </div>
                    </div>

                    {/* Que decisões arquiteturais precisam ser revistas? */}
                    <div className="bg-black/50 border border-neutral-900 p-2.5 rounded-lg">
                      <span className="text-[8.5px] font-mono font-black uppercase text-zinc-500 block">Decisões Arquiteturais (ADRs) de Alinhamento</span>
                      <div className="flex flex-col gap-1 mt-1 font-mono text-[10.5px]">
                        {KNOWLEDGE_GRAPH_NODES[graphSelectedNode].adrRevisions.map((adr, i) => (
                          <span key={i} className="text-purple-400 font-bold flex items-center gap-1.5">
                            <BookOpen className="w-3 h-3" /> {adr}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Qual o impacto operacional e regulatório desta mudança? */}
                    <div className="bg-[#B87333]/5 border border-[#B87333]/20 p-2.5 rounded-lg">
                      <span className="text-[8.5px] font-mono font-black uppercase text-[#B87333] block">Parecer de Impacto Institucional Estimado</span>
                      <p className="text-[10.5px] text-zinc-400 leading-normal mt-1 font-sans">
                        {KNOWLEDGE_GRAPH_NODES[graphSelectedNode].impactReport}
                      </p>
                    </div>

                  </div>

                  <div className="text-[8px] font-mono text-zinc-500 text-center pt-2">
                    Arestas de Conhecimento Ativas no Cluster de Metadados KMOS: {Object.keys(KNOWLEDGE_GRAPH_NODES).length}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 py-12">
                  <Network className="w-8 h-8 opacity-30 text-zinc-500" />
                  <span className="text-xs text-center">Selecione qualquer nó na lista do Grafo para inspecionar seu nexo causal, testes associados e APIs afetadas.</span>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* =========================================================================
          SOVEREIGN ENGINE 3: CONSTITUTION ENGINE PIPELINE GUARD
          ========================================================================= */}
      {activeTab === "pipeline" && (
        <div className="space-y-4 animate-fade-in text-left font-sans">
          
          {/* Section Header */}
          <div className="bg-neutral-900/10 border border-neutral-900/60 p-4 rounded-xl flex flex-col md:flex-row justify-between md:items-center gap-3">
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#B87333]" />
                <span>Constitution Pipeline Guard — Validador de Pull Requests</span>
              </h4>
              <p className="text-xs text-zinc-400 leading-normal mt-1 max-w-3xl">
                O guardião definitivo integrado ao pipeline de CI/CD. Qualquer Pull Request ou alteração estrutural de código é inspecionada estaticamente e gera automaticamente um parecer institucional conclusivo.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded">
                GATE KEEPER DE INTEGRIDADE
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            
            {/* Left Column - PR Selection & Runner */}
            <div className="xl:col-span-5 bg-neutral-950 border border-neutral-900 rounded-xl p-4 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <span className="text-[10px] uppercase font-black text-[#B87333] tracking-wider font-mono block border-b border-neutral-900 pb-1.5">
                  Fila de Pull Requests Pendentes
                </span>

                <div className="space-y-2">
                  {[
                    { id: "pr_mtls", num: "#104", title: "Bypass mTLS em Dev", desc: "Tenta remover mTLS em desenvolvimento", severity: "EXTREMA", author: "Dev Core-Net" },
                    { id: "pr_reserve", num: "#105", title: "Ajuste de Rácio fiduciário para 95%", desc: "Tenta libertar liquidez para concessão de crédito", severity: "EXTREMA", author: "Fintech Innovation" },
                    { id: "pr_gamify", num: "#106", title: "Novo Token Virtual 'KMOS Gold'", desc: "Implementa lógica de pontos promocionais", severity: "MODERADA", author: "Marketing Growth" },
                    { id: "pr_secure", num: "#107", title: "BatchSigner HSM para Liquidação", desc: "Otimiza a assinatura HSM em lotes rápidos", severity: "NENHUMA", author: "Security Architect" }
                  ].map((pr) => {
                    const isSelected = pipelineSelectedPR === pr.id;
                    return (
                      <button
                        key={pr.id}
                        onClick={() => setPipelineSelectedPR(pr.id as any)}
                        className={`w-full border p-3 rounded-lg flex flex-col text-left transition-all cursor-pointer ${
                          isSelected 
                            ? "border-[#B87333] bg-[#B87333]/10" 
                            : "border-neutral-900 bg-black/40 hover:bg-neutral-900/30"
                        }`}
                      >
                        <div className="flex justify-between items-center w-full">
                          <span className="text-[9px] font-mono text-zinc-400 font-bold">{pr.num} - {pr.author}</span>
                          <span className={`text-[7.5px] font-mono px-1.5 rounded font-black uppercase ${
                            pr.severity === "EXTREMA" ? "text-red-400 bg-red-500/10" : pr.severity === "MODERADA" ? "text-amber-400 bg-amber-500/10" : "text-emerald-400 bg-emerald-500/10"
                          }`}>
                            {pr.severity} Risk
                          </span>
                        </div>
                        <h5 className="text-xs font-bold text-white mt-1">{pr.title}</h5>
                        <span className="text-[10px] text-zinc-500 block leading-tight mt-0.5">{pr.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={handleRunPRPipeline}
                disabled={pipelineIsRunning}
                className="w-full bg-[#B87333] hover:bg-[#A35D22] text-neutral-950 font-black text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg disabled:opacity-50 mt-4 uppercase font-mono"
              >
                {pipelineIsRunning ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>Inspecionando Pull Request...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Executar Parecer do Guardião (CI/CD)</span>
                  </>
                )}
              </button>
            </div>

            {/* Right Column - CI/CD Execution Console & Final Official Verdict */}
            <div className="xl:col-span-7 bg-neutral-950 border border-neutral-900 rounded-xl p-4 flex flex-col justify-between min-h-[460px]">
              {pipelineIsRunning ? (
                <div className="flex-1 flex flex-col justify-between">
                  <div className="font-mono text-[10px] text-emerald-400 p-3 bg-black/60 border border-neutral-900 rounded-lg max-h-72 overflow-y-auto space-y-1.5 flex-1">
                    {pipelineLogs.map((log, i) => (
                      <div key={i} className="animate-fade-in flex items-start gap-1.5">
                        <span className="text-[#B87333] font-bold">&gt;</span>
                        <span className="leading-tight">{log}</span>
                      </div>
                    ))}
                    <div className="w-2 h-4 bg-emerald-400 animate-pulse inline-block ml-1"></div>
                  </div>
                  <div className="flex flex-col items-center justify-center py-6">
                    <Activity className="w-8 h-8 text-[#B87333] animate-pulse" />
                    <span className="text-[9px] uppercase tracking-wider font-mono text-zinc-500 mt-2">
                      Analisador Estático de Repositório do KMOS
                    </span>
                  </div>
                </div>
              ) : pipelineVerdict ? (
                <div className="space-y-4 animate-fade-in flex-1 flex flex-col justify-between text-left">
                  
                  {/* Verdict Banner */}
                  <div className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    pipelineVerdict.approved 
                      ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" 
                      : "bg-red-500/5 border-red-500/20 text-red-400"
                  }`}>
                    <div className="flex items-center gap-3">
                      {pipelineVerdict.approved ? <CheckCircle className="w-6 h-6 shrink-0" /> : <ShieldAlert className="w-6 h-6 shrink-0" />}
                      <div>
                        <span className="text-[8px] uppercase font-mono font-black block">Status da Integração de Código</span>
                        <h5 className="text-sm font-black uppercase font-mono">{pipelineVerdict.verdict}</h5>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[8px] text-zinc-500 block uppercase font-mono font-bold">Score de Integridade</span>
                      <span className="text-sm font-black font-mono">{pipelineVerdict.integrityScore}%</span>
                    </div>
                  </div>

                  {/* Parecer Institucional (The exact answers to user's questions) */}
                  <div className="bg-neutral-900/10 border border-neutral-900 p-3.5 rounded-xl space-y-3 text-xs leading-normal">
                    <span className="text-[9.5px] font-mono font-black uppercase text-zinc-400 block border-b border-neutral-900 pb-1">parecer institucional de engenharia</span>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <span className="text-zinc-500 font-bold block">Fundamento Jurídico</span>
                        <p className="text-zinc-300 font-sans mt-0.5">{pipelineVerdict.regRef}</p>
                      </div>
                      <div>
                        <span className="text-zinc-500 font-bold block">Decisão de Arquitetura (ADR)</span>
                        <p className="text-zinc-300 font-sans mt-0.5">{pipelineVerdict.adrRef}</p>
                      </div>
                    </div>

                    <div>
                      <span className="text-zinc-500 font-bold block">Impacto Regulatório Detetado</span>
                      <p className="text-zinc-300 font-sans mt-0.5 leading-snug">{pipelineVerdict.impact}</p>
                    </div>

                    <div>
                      <span className="text-zinc-500 font-bold block">Ação Mitigadora Recomendada</span>
                      <p className="text-emerald-400 font-sans mt-0.5 leading-snug font-semibold">{pipelineVerdict.mitigation}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1 border-t border-neutral-900/40 text-[11px] font-mono">
                      <div>
                        <span className="text-zinc-500 font-bold block uppercase text-[8px]">Nível de Risco</span>
                        <span className="text-red-400 uppercase font-black">{pipelineVerdict.severity}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 font-bold block uppercase text-[8px]">Esforço de Engenharia</span>
                        <span className="text-[#B87333] font-black">{pipelineVerdict.effort}</span>
                      </div>
                    </div>

                  </div>

                  {/* Signed Commit Prove */}
                  <div className="bg-black/90 border border-neutral-900 p-2.5 rounded text-[8.5px] font-mono text-zinc-500 flex justify-between items-center">
                    <span>SELO CONSTITUCIONAL CI/CD HASH:</span>
                    <span className="truncate max-w-[280px] text-zinc-400 font-bold ml-2">{pipelineVerdict.hash}</span>
                  </div>

                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 space-y-2">
                  <ShieldCheck className="w-8 h-8 opacity-40 text-zinc-400" />
                  <span className="text-xs">Selecione um Pull Request na fila e execute o Gate de Integridade Constitucional.</span>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* =========================================================================
          SOVEREIGN ENGINE 4: INSTITUTIONAL EVIDENCE ENGINE
          ========================================================================= */}
      {activeTab === "evidence" && (
        <div className="space-y-4 animate-fade-in text-left font-sans">
          
          {/* Section Header */}
          <div className="bg-neutral-900/10 border border-neutral-900/60 p-4 rounded-xl flex flex-col md:flex-row justify-between md:items-center gap-3">
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#B87333]" />
                <span>Institutional Evidence & Receipt Engine — Garantia Jurídica e Provabilidade</span>
              </h4>
              <p className="text-xs text-zinc-400 leading-normal mt-1 max-w-3xl">
                O motor de comprovativos de primeira classe do KwanzaMóvel. Cada operação gera automaticamente um recibo adaptado ao utilizador final e, simultaneamente, um pacote completo de evidências operacionais (leis, ADRs, testes e logs) assinado criptograficamente via HSM soberano para auditorias do BNA.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[9.5px] font-mono font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded">
                RECEIPT SECURE ENGINE : LIVE
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            
            {/* Left Column - Parameters */}
            <div className="xl:col-span-4 bg-neutral-950 border border-neutral-900 rounded-xl p-4 space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <span className="text-[10px] uppercase font-black text-[#B87333] tracking-wider font-mono block border-b border-neutral-900 pb-1.5">
                  Seleção de Operações & Formatos
                </span>

                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase font-bold text-zinc-500 font-mono block">Escolher Transação do Histórico</label>
                  <select
                    value={evidenceSelectedTx}
                    onChange={(e: any) => setEvidenceSelectedTx(e.target.value)}
                    className="w-full bg-black border border-neutral-900 rounded-lg p-2.5 text-xs text-zinc-300 outline-none focus:border-amber-900/40"
                  >
                    <option value="tx_88432">TX-88432: Transferência P2P (75.000 AOA)</option>
                    <option value="tx_88433">TX-88433: Emissão de Custódia (2.500.000 AOA)</option>
                    <option value="tx_88434">TX-88434: SMS Micro-Pagamento Rural (12.000 AOA)</option>
                    <option value="tx_88435">TX-88435: Tentativa Emissão Sombra (Bloqueada)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase font-bold text-zinc-500 font-mono block">Formato de Saída do Recibo</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "58mm", label: "Talão Térmico 58mm" },
                      { id: "80mm", label: "Talão Térmico 80mm" },
                      { id: "A5", label: "Comprovante A5" },
                      { id: "A4", label: "Relatório A4" }
                    ].map((fmt) => (
                      <button
                        key={fmt.id}
                        type="button"
                        onClick={() => setEvidenceReceiptFormat(fmt.id as any)}
                        className={`text-center py-2 px-1 rounded border text-[10px] font-mono font-bold transition-all ${
                          evidenceReceiptFormat === fmt.id
                            ? "bg-[#B87333] text-neutral-950 border-[#B87333]"
                            : "bg-black border-neutral-900 text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        {fmt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-neutral-900/20 border border-neutral-900 p-3 rounded-lg space-y-2 text-xs text-zinc-400 font-sans leading-normal">
                  <div className="flex items-center gap-1.5 text-[#B87333] font-bold">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-[10px] uppercase font-mono font-extrabold">Provabilidade Total KMOS</span>
                  </div>
                  <p className="text-[11px]">
                    Ao selar um pacote de evidências, o KMOS gera um arquivo unificado contendo o rastro de depósitos, as asserções de testes executadas no momento do commit e as assinaturas HSM para fins regulatórios imediatos.
                  </p>
                </div>

                {evidencePackage && evidencePackage.status === "APPROVED" && (
                  <div className="bg-neutral-950 border border-neutral-900 p-3 rounded-lg space-y-2 mt-2 animate-fade-in text-[11px] leading-relaxed">
                    <span className="text-[9px] uppercase font-bold text-[#B87333] font-mono block">Simular Retificação (v2)</span>
                    <p className="text-zinc-500 text-[10px] leading-tight">
                      Os Avisos do BNA permitem retificar beneficiários de transações operacionais mantendo o mesmo Transaction ID, gerando uma nova versão de recibo ligada à anterior.
                    </p>
                    <button
                      onClick={() => {
                        const reason = prompt("Indique o motivo administrativo para a retificação:", "Correção ortográfica do beneficiário");
                        if (reason) handleRectifyReceipt(reason);
                      }}
                      className="w-full py-1.5 px-2 bg-neutral-900 border border-neutral-800 text-[#B87333] hover:text-white rounded font-mono font-black text-[9.5px] transition-all uppercase cursor-pointer text-center"
                    >
                      Retificar Dados (Gerar v2)
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={handleGenerateEvidence}
                disabled={evidenceIsGenerating}
                className="w-full bg-[#B87333] hover:bg-[#A35D22] text-neutral-950 font-black text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg disabled:opacity-50 mt-4 uppercase font-mono"
              >
                {evidenceIsGenerating ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>Construindo Comprovativos...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    <span>Gerar Evidências & Recibo</span>
                  </>
                )}
              </button>
            </div>

            {/* Right Column - Multi-format Output & Sovereign Evidence Package */}
            <div className="xl:col-span-8 bg-neutral-950 border border-neutral-900 rounded-xl p-4 flex flex-col justify-between min-h-[500px]">
              {evidenceIsGenerating ? (
                <div className="flex-1 flex flex-col justify-between">
                  <div className="font-mono text-[10px] text-emerald-400 p-3 bg-black/60 border border-neutral-900 rounded-lg max-h-72 overflow-y-auto space-y-1.5 flex-1">
                    {evidenceLogs.map((log, i) => (
                      <div key={i} className="animate-fade-in flex items-start gap-1.5">
                        <span className="text-[#B87333] font-bold">&gt;</span>
                        <span className="leading-tight">{log}</span>
                      </div>
                    ))}
                    <div className="w-2 h-4 bg-emerald-400 animate-pulse inline-block ml-1"></div>
                  </div>
                  <div className="flex flex-col items-center justify-center py-6">
                    <FileCode className="w-8 h-8 text-[#B87333] animate-pulse" />
                    <span className="text-[9px] uppercase tracking-wider font-mono text-zinc-500 mt-2">
                      Sovereign Cryptographic Proof Sealer
                    </span>
                  </div>
                </div>
              ) : evidencePackage ? (
                <div className="space-y-4 animate-fade-in flex-1">
                  
                  {/* Top Bar with export actions */}
                  <div className="flex justify-between items-center border-b border-neutral-900 pb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span className="text-[10px] font-mono font-extrabold text-zinc-300 uppercase">
                        PACOTE DE EVIDÊNCIAS SELADO & ASSINADO
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleDownloadReceiptPdf}
                        className="bg-zinc-900 border border-neutral-800 text-zinc-300 hover:text-white px-2.5 py-1 rounded text-[10px] font-mono font-bold flex items-center gap-1 transition-all"
                      >
                        <Printer className="w-3.5 h-3.5 text-[#B87333]" />
                        <span>Imprimir Recibo</span>
                      </button>
                      <button
                        onClick={handleDownloadDossierPdf}
                        className="bg-[#B87333]/10 border border-[#B87333]/20 text-[#B87333] hover:bg-[#B87333]/20 px-2.5 py-1 rounded text-[10px] font-mono font-bold flex items-center gap-1 transition-all"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Dossier</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    
                    {/* Visual Receipt Column */}
                    <div className="lg:col-span-5 flex flex-col justify-center items-center py-2 bg-neutral-900/10 border border-neutral-900 p-3 rounded-xl">
                      <span className="text-[9px] font-mono font-black text-zinc-500 uppercase tracking-widest mb-3 block text-center">
                        Reticulado de Impressão do Recibo
                      </span>

                      {/* 58mm and 80mm Thermal Slip Rendering */}
                      {(evidenceReceiptFormat === "58mm" || evidenceReceiptFormat === "80mm") && (
                        <div className={`bg-[#fbfbf8] text-[#1a1a1a] p-4 shadow-2xl border-x border-zinc-300 font-mono text-[10.5px] text-left leading-normal relative rounded-sm ${
                          evidenceReceiptFormat === "58mm" ? "max-w-[260px]" : "max-w-[310px]"
                        }`} style={{ backgroundImage: "linear-gradient(#fbfbf8 0%, #fafaf4 100%)" }}>
                          
                          {/* Top Jagged Edge decoration */}
                          <div className="absolute top-0 left-0 right-0 h-1 bg-repeat-x" style={{
                            backgroundImage: "radial-gradient(circle, transparent, transparent 50%, #1a1a1a 50%, #1a1a1a 100%)",
                            backgroundSize: "6px 6px",
                            transform: "rotate(180deg)"
                          }}></div>

                          <div className="text-center space-y-1 pb-3 pt-2 border-b border-dashed border-zinc-400">
                            <h5 className="font-black text-xs tracking-widest uppercase">KWANZAMÓVEL</h5>
                            <span className="text-[9px] opacity-75 uppercase">Soberania Financeira no Bolso</span>
                            <div className="text-[8px] opacity-65 font-sans mt-0.5">Angola, Luanda</div>
                          </div>

                          <div className="py-2.5 space-y-1.5 text-[9.5px]">
                            <div className="flex justify-between font-black border-b border-zinc-300 pb-1">
                              <span>TIPO:</span>
                              <span className="text-right uppercase">{evidencePackage.type}</span>
                            </div>
                            <div className="flex justify-between font-bold text-xs py-1">
                              <span>VALOR:</span>
                              <span className="text-right text-black font-black">{evidencePackage.value}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>ESTADO:</span>
                              <span className={`text-right font-black ${evidencePackage.status === "APPROVED" ? "text-emerald-700" : "text-red-600"}`}>
                                {evidencePackage.status}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>ORIGEM:</span>
                              <span className="text-right truncate max-w-[140px]">{evidencePackage.source}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>DESTINO:</span>
                              <span className="text-right truncate max-w-[140px]">{evidencePackage.dest}</span>
                            </div>
                            <div className="flex justify-between text-[8px] opacity-75">
                              <span>DATA:</span>
                              <span className="text-right">{evidencePackage.timestamp.substring(0, 16).replace("T", " ")}</span>
                            </div>
                            <div className="border-t border-dashed border-zinc-300 my-1 pt-1 space-y-0.5 text-[7.5px] opacity-80">
                              <div className="flex justify-between">
                                <span>RECIBO ID:</span>
                                <span className="font-bold">{evidencePackage.receiptId} (v{evidencePackage.receiptVersion})</span>
                              </div>
                              <div className="flex justify-between">
                                <span>TRANSACTION ID:</span>
                                <span className="font-bold">{evidencePackage.transactionId}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>EVIDENCE ID:</span>
                                <span className="font-bold">{evidencePackage.id}</span>
                              </div>
                            </div>
                          </div>

                          <div className="border-t border-dashed border-zinc-400 pt-3 flex flex-col items-center justify-center space-y-1.5">
                            
                            {/* Realistic Simulated QR Code Grid */}
                            <div className="bg-white p-1.5 border border-zinc-300 rounded shadow-sm">
                              <div className="grid grid-cols-11 gap-[1px]">
                                {Array.from({ length: 121 }).map((_, idx) => {
                                  // Determinsitc patterns to mimic finder squares and modules
                                  const r = Math.floor(idx / 11);
                                  const c = idx % 11;
                                  const isFinder = (r < 3 && c < 3) || (r < 3 && c >= 8) || (r >= 8 && c < 3);
                                  const isFinderCore = (r === 1 && c === 1) || (r === 1 && c === 9) || (r === 9 && c === 1);
                                  const drawBlack = isFinder ? !isFinderCore : (idx % 3 === 0 || idx % 7 === 2);
                                  return (
                                    <div
                                      key={idx}
                                      className={`w-3.5 h-3.5 transition-all ${drawBlack ? "bg-black" : "bg-white"}`}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                            
                            <span className="text-[7.5px] opacity-75 uppercase tracking-wider font-bold">VERIFICAR ASSINATURA</span>
                            <span className="text-[6.5px] text-zinc-500 break-all text-center">{evidencePackage.hash.substring(0, 32)}...</span>
                          </div>

                          <div className="text-center pt-3 mt-2 border-t border-dashed border-zinc-300 text-[8px] opacity-60">
                            PIN VALIDADO • BNA REGULADO
                          </div>
                        </div>
                      )}

                      {/* A5 / A4 Printable Document Template */}
                      {(evidenceReceiptFormat === "A5" || evidenceReceiptFormat === "A4") && (
                        <div className="bg-white text-zinc-800 p-5 rounded-lg border border-zinc-300 shadow-xl font-sans text-xs w-full max-w-[360px] text-left leading-normal relative">
                          <div className="flex justify-between items-center border-b border-zinc-300 pb-3 mb-3">
                            <div>
                              <h5 className="font-black text-zinc-950 uppercase tracking-wider text-[11px] leading-tight">BANCO NACIONAL DE ANGOLA</h5>
                              <span className="text-[8px] text-zinc-500 uppercase font-mono tracking-widest block mt-0.5">REDE DE LIQUIDAÇÃO KWANZAMÓVEL</span>
                            </div>
                            <div className="bg-[#B87333]/10 border border-[#B87333]/20 px-1.5 py-0.5 rounded text-[8.5px] font-mono text-[#B87333] font-bold">
                              {evidenceReceiptFormat.toUpperCase()} DOCUMENT
                            </div>
                          </div>

                          <div className="bg-zinc-50 border border-zinc-200/60 p-2.5 rounded mb-3 space-y-1">
                            <div className="flex justify-between">
                              <span className="text-zinc-500 font-bold">Ref. Transação:</span>
                              <span className="font-mono text-zinc-900 font-bold">{evidencePackage.transactionId}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-zinc-500 font-bold">Ref. Recibo:</span>
                              <span className="font-mono text-zinc-900 font-bold">{evidencePackage.receiptId} (v{evidencePackage.receiptVersion})</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-zinc-500 font-bold">Ref. Evidência EVP:</span>
                              <span className="font-mono text-[#B87333] font-bold">{evidencePackage.id}</span>
                            </div>
                            <div className="flex justify-between border-t border-zinc-200/40 pt-1 mt-1">
                              <span className="text-zinc-500">Correlation ID:</span>
                              <span className="font-mono text-zinc-600">{evidencePackage.traceId.substring(6, 20)}...</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-zinc-500">Estado regulatório:</span>
                              <span className="text-emerald-600 font-bold uppercase">{evidencePackage.status}</span>
                            </div>
                          </div>

                          <div className="space-y-2 border-b border-zinc-200 pb-3 mb-3 text-[11px]">
                            <div className="grid grid-cols-2">
                              <span className="text-zinc-500">Categoria:</span>
                              <span className="text-zinc-900 font-medium text-right">{evidencePackage.type}</span>
                            </div>
                            <div className="grid grid-cols-2">
                              <span className="text-zinc-500">Valor líquido:</span>
                              <span className="text-zinc-950 font-extrabold text-right">{evidencePackage.value}</span>
                            </div>
                            <div className="grid grid-cols-2">
                              <span className="text-zinc-500">Origem autorizada:</span>
                              <span className="text-zinc-900 text-right font-mono truncate">{evidencePackage.source}</span>
                            </div>
                            <div className="grid grid-cols-2">
                              <span className="text-zinc-500">Destino liquidado:</span>
                              <span className="text-zinc-900 text-right font-mono truncate">{evidencePackage.dest}</span>
                            </div>
                          </div>

                          <div className="text-[8.5px] text-zinc-500 space-y-1 font-mono">
                            <div className="flex justify-between items-center bg-zinc-50 p-1.5 rounded border border-zinc-200/50">
                              <span>CARIMBO DE AUDITORIA BNA:</span>
                              <span className="text-zinc-800 font-bold">{evidencePackage.bnaSignature.substring(0, 18)}</span>
                            </div>
                            <div className="text-[7.5px] leading-tight text-zinc-400 mt-1">
                              Emitido e armazenado pelo Receipt Engine em perfeita conformidade com as regras de imutabilidade de partidas dobradas e o Aviso 07/2020.
                            </div>
                          </div>
                        </div>
                      )}

                    </div>

                    {/* Compliances and Institutional Dossier Column */}
                    <div className="lg:col-span-7 space-y-3">
                      
                      {/* Section Title */}
                      <span className="text-[10px] font-mono font-black text-[#B87333] uppercase block border-b border-neutral-900 pb-1">
                        Soberania & Evidências Legais de Conformidade
                      </span>

                      {/* 1. Legal Basis Cards */}
                      <div className="bg-black/40 border border-neutral-900 p-3 rounded-xl space-y-1.5 text-left">
                        <span className="text-[8.5px] font-mono font-black uppercase text-zinc-500 block">1. Enquadramento Legal (Lei n.º 40/20 e Avisos BNA)</span>
                        {evidencePackage.laws.map((law: any, i: number) => (
                          <div key={i} className="bg-black/60 border border-neutral-900 p-2 rounded-lg flex items-start gap-2">
                            <span className="text-[#B87333] font-bold text-xs mt-0.5">§</span>
                            <div>
                              <span className="text-[11px] font-bold text-zinc-200 block">{law.ref} — {law.name}</span>
                              <span className="text-[10.5px] text-zinc-400 block leading-tight">{law.details}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* 2. ADR Mapping */}
                      <div className="bg-black/40 border border-neutral-900 p-3 rounded-xl space-y-1.5 text-left">
                        <span className="text-[8.5px] font-mono font-black uppercase text-purple-400 block">2. Decisões Arquiteturais Coerentes (ADRs Vinculadas)</span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {evidencePackage.adrs.map((adr: any, i: number) => (
                            <div key={i} className="bg-black/60 border border-neutral-900 p-2 rounded-lg text-left">
                              <span className="text-[10px] font-mono text-purple-400 font-bold block">{adr.id}</span>
                              <span className="text-[11px] font-bold text-zinc-300 block leading-tight mt-0.5">{adr.name}</span>
                              <span className="text-[9.5px] text-zinc-500 block leading-tight mt-0.5">{adr.desc}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 3. Automated CI/CD Tests */}
                      <div className="bg-black/40 border border-neutral-900 p-3 rounded-xl space-y-1.5 text-left">
                        <span className="text-[8.5px] font-mono font-black uppercase text-emerald-400 block">3. Garantia de Software de Engenharia (Testes de Regressão)</span>
                        <div className="space-y-1.5 font-mono text-[10px]">
                          {evidencePackage.tests.map((test: any, i: number) => (
                            <div key={i} className="bg-black/60 border border-neutral-900 p-2 rounded-lg flex justify-between items-center">
                              <div className="space-y-0.5">
                                <span className="text-zinc-300 font-bold block">{test.file}</span>
                                <span className="text-[8.5px] text-zinc-500 block">{test.assertion}</span>
                              </div>
                              <span className="text-[8.5px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-black uppercase flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                <span>{test.status}</span>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 4. Telemetry and Transaction Logs */}
                      <div className="bg-black/40 border border-neutral-900 p-3 rounded-xl space-y-1.5 text-left">
                        <span className="text-[8.5px] font-mono font-black uppercase text-zinc-500 block">4. Logs de Auditoria Transacional & Telemetria</span>
                        <div className="bg-black/80 border border-neutral-900 p-2 rounded-lg font-mono text-[9px] text-zinc-400 space-y-1 max-h-24 overflow-y-auto pr-1">
                          {evidencePackage.logs.map((log: string, i: number) => (
                            <div key={i} className="flex items-start gap-1">
                              <span className="text-zinc-600 font-bold shrink-0">&gt;</span>
                              <span className="leading-tight break-all">{log}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 5. Motores Executivos de Regras (Runtime Preemptivo) */}
                      <div className="bg-black/40 border border-neutral-900 p-3 rounded-xl space-y-1.5 text-left">
                        <span className="text-[8.5px] font-mono font-black uppercase text-[#B87333] block">5. Motores Executivos de Regras (Runtime Preemptivo)</span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10.5px]">
                          {/* Constitution Engine */}
                          <div className="bg-black/60 border border-neutral-900 p-2.5 rounded-lg space-y-1">
                            <div className="flex justify-between items-center border-b border-neutral-900 pb-1">
                              <span className="font-bold text-zinc-300">Constitution Engine</span>
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${evidencePackage.constitutionValidation?.constitutionPassed ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                                {evidencePackage.constitutionValidation?.constitutionPassed ? "PASSED" : "FAILED"}
                              </span>
                            </div>
                            <div className="text-[9.5px] text-zinc-400 space-y-0.5 mt-1">
                              {evidencePackage.constitutionValidation?.validatedRules?.map((rule: string, i: number) => (
                                <div key={i} className="flex items-center gap-1">
                                  <span className="text-[#B87333] font-bold">✓</span>
                                  <span className="truncate">{rule}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          {/* Policy Engine */}
                          <div className="bg-black/60 border border-neutral-900 p-2.5 rounded-lg space-y-1">
                            <div className="flex justify-between items-center border-b border-neutral-900 pb-1">
                              <span className="font-bold text-zinc-300">Policy Engine</span>
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${evidencePackage.policyValidation?.policyPassed ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                                {evidencePackage.policyValidation?.policyPassed ? "COMPLIANT" : "VIOLATION"}
                              </span>
                            </div>
                            <div className="text-[9.5px] text-zinc-400 space-y-1 mt-1">
                              <div className="flex justify-between">
                                <span>Verificação de Limites:</span>
                                <span className="font-semibold text-zinc-200">{evidencePackage.policyValidation?.limitsOk ? "OK" : "EXCEDE_TETO"}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>MDR / Tarifa BNA:</span>
                                <span className="font-semibold text-[#B87333]">{evidencePackage.policyValidation?.feesCollected?.toString() || "0.00 Kz"}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Rácio de Reserva:</span>
                                <span className="font-semibold text-emerald-400">1:1 Fiduciário</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 6. Partidas Dobradas & Posições de Liquidez */}
                      <div className="bg-black/40 border border-neutral-900 p-3 rounded-xl space-y-1.5 text-left">
                        <span className="text-[8.5px] font-mono font-black uppercase text-blue-400 block">6. Partidas Dobradas & Posições de Liquidez</span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10.5px]">
                          {/* Ledger Entries */}
                          <div className="bg-black/60 border border-neutral-900 p-2.5 rounded-lg space-y-1">
                            <span className="font-bold text-zinc-300 block border-b border-neutral-900 pb-1">Rastro Contábil Imutável (Ledger)</span>
                            <div className="space-y-1 font-mono text-[9px] mt-1">
                              {evidencePackage.ledgerEntries?.map((entry: any, i: number) => (
                                <div key={i} className="flex justify-between items-center text-zinc-400">
                                  <span className="truncate max-w-[110px]">{entry.account}</span>
                                  <span className={`font-bold ${entry.type === "DEBIT" ? "text-red-400" : "text-emerald-400"}`}>
                                    {entry.type === "DEBIT" ? "D" : "C"} {entry.amount.toString()}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          {/* Balance Snapshots */}
                          <div className="bg-black/60 border border-neutral-900 p-2.5 rounded-lg space-y-1">
                            <span className="font-bold text-zinc-300 block border-b border-neutral-900 pb-1">Saldos Disponíveis (Snapshots)</span>
                            <div className="text-[9.5px] text-zinc-400 space-y-1 mt-1">
                              <div className="flex justify-between">
                                <span className="text-zinc-500 font-mono">ID Carteira:</span>
                                <span className="font-mono text-zinc-300 truncate max-w-[100px]">{evidencePackage.walletSnapshot?.walletId}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Saldo Anterior:</span>
                                <span className="font-semibold text-zinc-300">{evidencePackage.walletSnapshot?.balanceBefore?.toString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Saldo Atual:</span>
                                <span className="font-bold text-emerald-400">{evidencePackage.walletSnapshot?.balanceAfter?.toString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 7. Prevenção ao Branqueamento de Capitais (AML/CFT) */}
                      <div className="bg-black/40 border border-neutral-900 p-3 rounded-xl space-y-1.5 text-left">
                        <span className="text-[8.5px] font-mono font-black uppercase text-amber-400 block">7. Prevenção ao Branqueamento de Capitais (AML/CFT)</span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10.5px]">
                          <div className="bg-black/60 border border-neutral-900 p-2.5 rounded-lg space-y-1">
                            <span className="font-bold text-zinc-300 block border-b border-neutral-900 pb-1">Análise de Risco Quantitativa</span>
                            <div className="flex items-center gap-3 mt-1">
                              <div className="relative flex items-center justify-center">
                                <svg className="w-10 h-10">
                                  <circle className="text-neutral-800" strokeWidth="2.5" stroke="currentColor" fill="transparent" r="16" cx="20" cy="20" />
                                  <circle className="text-amber-500" strokeWidth="2.5" strokeDasharray="100" strokeDashoffset={100 - (100 * (evidencePackage.riskAssessment?.riskScore || 15)) / 100} strokeLinecap="round" stroke="currentColor" fill="transparent" r="16" cx="20" cy="20" />
                                </svg>
                                <span className="absolute font-mono text-[9px] text-zinc-200 font-black">{evidencePackage.riskAssessment?.riskScore}%</span>
                              </div>
                              <div className="space-y-0.5">
                                <span className="text-zinc-500 block text-[8px] tracking-wider uppercase">Classificação</span>
                                <span className={`font-black uppercase text-[11px] ${evidencePackage.riskAssessment?.riskLevel === "LOW" ? "text-emerald-400" : "text-amber-400"}`}>
                                  {evidencePackage.riskAssessment?.riskLevel} RISK
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-black/60 border border-neutral-900 p-2.5 rounded-lg space-y-1.5 text-[9.5px]">
                            <span className="font-bold text-zinc-300 block border-b border-neutral-900 pb-1">Fatores de Conformidade AML</span>
                            <div className="space-y-1 text-zinc-400 mt-1">
                              <div className="flex justify-between items-center">
                                <span>Listas de PEP / Sanções:</span>
                                <span className="text-emerald-400 font-bold font-mono">CONFORME</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span>Verificação de Beneficiário:</span>
                                <span className="text-emerald-400 font-bold font-mono">NEGATIVO</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 8. Política de Salvaguarda de Provas (Lei 40/20) */}
                      <div className="bg-black/40 border border-neutral-900 p-3 rounded-xl space-y-1.5 text-left">
                        <span className="text-[8.5px] font-mono font-black uppercase text-zinc-500 block">8. Política de Salvaguarda de Provas (Lei 40/20)</span>
                        <div className="bg-black/60 border border-neutral-900 p-2.5 rounded-lg flex justify-between items-center text-[10px]">
                          <div>
                            <span className="text-zinc-300 font-bold block">Categoria de Retenção Regulamentar</span>
                            <span className="text-zinc-500 text-[9px] block">Imposto de Selo e Auditoria Geral de Liquidações</span>
                          </div>
                          <div className="text-right font-mono text-[9.5px]">
                            <span className="text-[#B87333] font-bold block">{evidencePackage.retentionPolicy?.retentionPeriodYears || 5} ANOS DE RETENÇÃO</span>
                            <span className="text-zinc-500 block text-[8px]">Purga Agendada: {new Date(evidencePackage.retentionPolicy?.purgeDate || Date.now()).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* 9. Histórico de Retificações do Recibo */}
                      {evidencePackage.receiptVersion > 1 && (
                        <div className="bg-neutral-900/40 border border-[#B87333]/30 p-3 rounded-xl space-y-2 text-left animate-fade-in">
                          <span className="text-[8.5px] font-mono font-black uppercase text-[#B87333] block">9. Histórico de Retificações do Recibo (Auditoria BNA)</span>
                          <div className="space-y-2.5 relative pl-3 border-l border-[#B87333]/40 ml-1.5 mt-2">
                            {evidencePackage.stateHistory?.map((record: any, idx: number) => (
                              <div key={idx} className="relative text-[10px]">
                                <span className="absolute -left-[16.5px] top-1 w-2 h-2 rounded-full bg-[#B87333] border border-black"></span>
                                <div className="flex justify-between items-center font-mono">
                                  <span className="text-white font-extrabold">Versão v{record.version} — {record.action}</span>
                                  <span className="text-zinc-500 text-[8.5px]">{new Date(record.timestamp).toLocaleTimeString()}</span>
                                </div>
                                <p className="text-zinc-400 mt-0.5 leading-tight text-[9.5px]">{record.reason}</p>
                                <div className="text-[7.5px] text-zinc-500 font-mono mt-0.5 truncate max-w-[280px]">
                                  Selo Hash: {record.hash}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>

                  </div>

                  {/* Sovereign Cryptographic Signature Panel */}
                  <div className="bg-neutral-900/15 border border-[#B87333]/20 p-3 rounded-xl space-y-1.5 text-left">
                    <span className="text-[8.5px] font-mono font-black uppercase text-[#B87333] block">selo de segurança digital institucional (hsm Bna)</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[10px] font-mono">
                      <div className="bg-black/40 border border-neutral-900 p-2 rounded">
                        <span className="text-zinc-500 block text-[8px]">SHA-256 EVIDENCE DIGITAL SEAL:</span>
                        <span className="text-zinc-300 font-semibold break-all leading-tight block mt-0.5">{evidencePackage.hash}</span>
                      </div>
                      <div className="bg-black/40 border border-neutral-900 p-2 rounded">
                        <span className="text-zinc-500 block text-[8px]">SOVEREIGN KEY SIGNATURE:</span>
                        <span className="text-[#B87333] font-black break-all leading-tight block mt-0.5">{evidencePackage.bnaSignature}</span>
                      </div>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 space-y-2">
                  <QrCode className="w-8 h-8 opacity-40 text-zinc-400" />
                  <span className="text-xs">Selecione uma transação operacional no painel esquerdo e clique em "Gerar Evidências & Recibo" para selar o dossier.</span>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* 1. VALIDADOR TRANSVERSAL DE ATIVOS */}
      {activeTab === "auditor" && (
        <div className="space-y-4 animate-fade-in">
          
          {/* Sovereign Top Badge */}
          <div className="bg-neutral-900/10 border border-neutral-900/60 p-4 rounded-xl flex flex-col md:flex-row justify-between md:items-center gap-3">
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#B87333]" />
                <span>Mapeador de Nexo e Conformidade Sobeana — ConstitutionEngine</span>
              </h4>
              <p className="text-xs text-zinc-400 leading-normal mt-1 max-w-3xl">
                O Constitution Engine atua como a autoridade máxima do KwanzaMóvel. Ele valida transversalmente qualquer ativo institucional (casos de uso, agregados, políticas, ADRs, documentações, testes e configurações), forçando a imutabilidade jurídica contra desvios arquiteturais.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[9.5px] font-mono font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded">
                RESTRIÇÃO EXECUTÁVEL ATIVA
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            
            {/* Left Control Panel */}
            <div className="xl:col-span-4 bg-neutral-950 border border-neutral-900 rounded-xl p-4 space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-black text-zinc-400 tracking-wider font-mono">1. Selecionar Ativo Institucional</span>
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase font-bold text-zinc-500">Ativos do Ecossistema</label>
                    <select
                      value={selectedAssetId}
                      onChange={(e) => {
                        setSelectedAssetId(e.target.value);
                        if (e.target.value !== "custom") {
                          setActiveAsset(assetsDatabase[e.target.value]);
                        }
                      }}
                      className="w-full bg-black border border-neutral-900 rounded-lg p-2.5 text-xs outline-none focus:border-amber-900/40 text-zinc-300"
                    >
                      <optgroup label="Casos de Uso e Fluxos">
                        <option value="TransferUseCase">TransferUseCase (Caso de Uso de Balanço)</option>
                        <option value="RuralOfflineSMSWorkflow">RuralOfflineSMSWorkflow (Offline Rural)</option>
                      </optgroup>
                      <optgroup label="Agregados e Entidades">
                        <option value="ReserveBalanceAggregate">ReserveBalanceAggregate (Liquidez fiduciária BNA)</option>
                      </optgroup>
                      <optgroup label="Políticas e Configurações">
                        <option value="MerchantMdrFeePolicy">MerchantMdrFeePolicy (Regras de MDR de Comércio)</option>
                      </optgroup>
                      <optgroup label="Desvios e Violações Severas (Simulações)">
                        <option value="FractionalReserveAdjustment">setReserveRatio(0.95) (Violação de Liquidez)</option>
                        <option value="BypassMtlsInDev">bypassMtlsAuth(true) (Violação de Canais TLS)</option>
                        <option value="GamifiedBonusTokens">GiveGamifiedRewardTokens (Emissão Paralela)</option>
                      </optgroup>
                      <option value="custom">-- Inserir Ativo Personalizado (ADRs, Workflows, Código) --</option>
                    </select>
                  </div>
                </div>

                {selectedAssetId === "custom" ? (
                  <div className="space-y-3 animate-fade-in bg-black/30 border border-neutral-900/60 p-3 rounded-lg">
                    <span className="text-[9.5px] uppercase font-extrabold text-[#B87333] tracking-wider font-mono block">Nova Declaração de Ativo</span>
                    
                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase font-bold text-zinc-500">Nome do Ativo</label>
                      <input
                        type="text"
                        placeholder="Ex: LimitKycWorkflow, ADR-042-Sms-Cipher"
                        value={customAssetName}
                        onChange={(e) => setCustomAssetName(e.target.value)}
                        className="w-full bg-black border border-neutral-900 rounded-lg p-2 text-xs text-zinc-300 outline-none focus:border-amber-900/40"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-zinc-500">Categoria</label>
                        <select
                          value={customAssetCategory}
                          onChange={(e) => setCustomAssetCategory(e.target.value)}
                          className="w-full bg-black border border-neutral-900 rounded-lg p-1.5 text-xs text-zinc-300 outline-none"
                        >
                          <option value="Use Case">Use Case</option>
                          <option value="Aggregate">Aggregate</option>
                          <option value="Policy">Policy</option>
                          <option value="Workflow">Workflow</option>
                          <option value="ADR">ADR</option>
                          <option value="Test">Test Case</option>
                          <option value="Documentation">Documentation</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-zinc-500">Camada Alvo</label>
                        <select className="w-full bg-black border border-neutral-900 rounded-lg p-1.5 text-xs text-zinc-300 outline-none">
                          <option value="1">Layer 1 (Institution)</option>
                          <option value="5">Layer 5 (Policy)</option>
                          <option value="8">Layer 8 (Domain)</option>
                          <option value="9">Layer 9 (Infrastructure)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-zinc-500">Finalidade / Descrição do Ativo</label>
                      <textarea
                        rows={2}
                        placeholder="Insira o que este ativo executa ou sua finalidade..."
                        value={customAssetDesc}
                        onChange={(e) => setCustomAssetDesc(e.target.value)}
                        className="w-full bg-black border border-neutral-900 rounded-lg p-2 text-xs text-zinc-300 outline-none focus:border-amber-900/40"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-zinc-500">Lógica, ADR ou Manifesto (Código / Texto)</label>
                      <textarea
                        rows={4}
                        placeholder="Paste code or ADR text here..."
                        value={customAssetCode}
                        onChange={(e) => setCustomAssetCode(e.target.value)}
                        className="w-full bg-black border border-neutral-900 rounded-lg p-2 text-xs text-zinc-300 font-mono outline-none focus:border-amber-900/40"
                      />
                    </div>

                    <button
                      onClick={handleCustomAssetCheck}
                      disabled={isRunningCheck || !customAssetName.trim()}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-black font-extrabold text-[10.5px] py-2 rounded-lg cursor-pointer transition-colors"
                    >
                      Processar & Validar Ativo Customizado
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 font-mono block">Especificação do Ativo Selecionado</span>
                    <pre className="p-3 bg-black/60 border border-neutral-900 rounded-lg text-[10px] font-mono text-zinc-400 overflow-x-auto max-h-48 leading-relaxed">
                      <code>{activeAsset.definitionCode}</code>
                    </pre>
                  </div>
                )}
              </div>

              {selectedAssetId !== "custom" && (
                <button
                  onClick={() => handleTriggerAudit(selectedAssetId)}
                  disabled={isRunningCheck}
                  className="w-full bg-[#B87333] hover:bg-[#A35D22] text-neutral-950 font-black text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                >
                  {isRunningCheck ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      <span>Verificando Fundamentação...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      <span>Auditar Ativo com Constituição</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Right Audit Results Dashboard */}
            <div className="xl:col-span-8 bg-neutral-950 border border-neutral-900 rounded-xl p-4 flex flex-col justify-between min-h-[500px] relative overflow-hidden">
              
              {isRunningCheck ? (
                <div className="flex-1 flex flex-col justify-between py-4">
                  <div className="space-y-2 flex-1 font-mono text-[10.5px] text-emerald-400/90 p-3 overflow-y-auto bg-black/50 border border-neutral-900 rounded-lg max-h-72">
                    {logs.map((log, i) => (
                      <div key={i} className="leading-relaxed animate-fade-in flex items-center gap-1.5">
                        <span className="text-[#B87333]">&gt;</span>
                        <span>{log}</span>
                      </div>
                    ))}
                    <div className="w-2.5 h-4 bg-emerald-400 animate-pulse inline-block ml-1"></div>
                  </div>
                  <div className="flex flex-col items-center justify-center space-y-2 pt-6">
                    <Terminal className="w-8 h-8 text-[#B87333] animate-pulse" />
                    <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 font-mono">
                      Compilador Constitucional KMOS Ativo
                    </span>
                  </div>
                </div>
              ) : activeAsset ? (
                <div className="space-y-4 animate-fade-in flex-1 flex flex-col justify-between text-left">
                  
                  {/* Result Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-900/60">
                    <div className="text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[8.5px] text-zinc-500 font-extrabold uppercase font-mono bg-neutral-900 px-1.5 py-0.5 rounded">
                          {activeAsset.category}
                        </span>
                        <span className="text-[8.5px] text-zinc-500 font-extrabold uppercase font-mono bg-neutral-900 px-1.5 py-0.5 rounded">
                          Layer {activeAsset.layer}
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-zinc-100 font-mono mt-1.5">
                        {activeAsset.name}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black px-3 py-1 rounded border uppercase tracking-wider ${activeAsset.verdictColor}`}>
                        {activeAsset.verdict}
                      </span>
                      <button
                        onClick={copyReportText}
                        className="p-2 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                        title="Copiar Parecer Completo"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* 1. REPORT CARD PATTERN (As requested) */}
                  <div className="bg-neutral-900/20 border border-neutral-900 p-3 rounded-xl space-y-2">
                    <span className="text-[9px] uppercase font-black text-zinc-400 tracking-wider font-mono block border-b border-neutral-950 pb-1.5">
                      Constitution Validation Report Card
                    </span>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] pt-1">
                      <div className="flex items-center justify-between bg-black/40 border border-neutral-900 px-2.5 py-1.5 rounded-lg">
                        <span className="text-zinc-500 font-bold">Purpose</span>
                        <span className={`font-mono font-black ${activeAsset.report.purpose ? "text-emerald-400" : "text-red-500"}`}>
                          {activeAsset.report.purpose ? "✔" : "✖"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between bg-black/40 border border-neutral-900 px-2.5 py-1.5 rounded-lg col-span-1">
                        <span className="text-zinc-500 font-bold">Policy Cvg</span>
                        <span className={`font-mono font-black ${activeAsset.report.policyCoverage ? "text-emerald-400" : "text-red-500"}`}>
                          {activeAsset.report.policyCoverage ? "✔" : "✖"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between bg-black/40 border border-neutral-900 px-2.5 py-1.5 rounded-lg">
                        <span className="text-zinc-500 font-bold">Traceability</span>
                        <span className={`font-mono font-black ${activeAsset.report.traceability ? "text-emerald-400" : "text-red-500"}`}>
                          {activeAsset.report.traceability ? "✔" : "✖"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between bg-black/40 border border-neutral-900 px-2.5 py-1.5 rounded-lg">
                        <span className="text-zinc-500 font-bold">Tests</span>
                        <span className={`font-mono font-black ${activeAsset.report.tests ? "text-emerald-400" : "text-red-500"}`}>
                          {activeAsset.report.tests ? "✔" : "✖"}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] pt-1">
                      <div className="bg-black/40 border border-neutral-900 px-2.5 py-1.5 rounded-lg">
                        <span className="text-[9px] text-zinc-500 font-bold block uppercase font-mono mb-0.5">Legal Basis</span>
                        <span className="font-semibold text-zinc-300 truncate block">{activeAsset.report.legalBasisText}</span>
                      </div>
                      <div className="bg-black/40 border border-neutral-900 px-2.5 py-1.5 rounded-lg">
                        <span className="text-[9px] text-zinc-500 font-bold block uppercase font-mono mb-0.5">Decision Record</span>
                        <span className="font-semibold text-zinc-300 truncate block">{activeAsset.report.decisionRecordText}</span>
                      </div>
                      <div className="bg-black/40 border border-neutral-900 px-2.5 py-1.5 rounded-lg flex items-center justify-between">
                        <div>
                          <span className="text-[9px] text-zinc-500 font-bold block uppercase font-mono mb-0.5">Integrity</span>
                          <span className="font-extrabold text-[#B87333]">{activeAsset.integrityScore}%</span>
                        </div>
                        <div className="w-12 h-1.5 bg-neutral-900 rounded-full overflow-hidden shrink-0 ml-2">
                          <div className="h-full bg-[#B87333]" style={{ width: `${activeAsset.integrityScore}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. THE COGNITIVE QUESTIONING FRAMEWORK ANSWER PANEL */}
                  <div className="bg-neutral-900/10 border border-neutral-900 p-3 rounded-xl space-y-3">
                    <div className="flex justify-between items-center border-b border-neutral-900 pb-1.5">
                      <span className="text-[9px] uppercase font-black text-zinc-400 tracking-wider font-mono">
                        Perguntas Cognitivas Constitucionais
                      </span>
                      <HelpCircle className="w-3.5 h-3.5 text-zinc-600" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] max-h-48 overflow-y-auto pr-1">
                      <div className="space-y-1">
                        <span className="text-zinc-500 font-bold">Existe fundamento constitucional para este ativo?</span>
                        <p className="text-zinc-300 leading-tight">
                          {activeAsset.questions.hasConstitutionalBasis.status ? "✔ " : "✖ "}
                          {activeAsset.questions.hasConstitutionalBasis.detail}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-zinc-500 font-bold">Existe fundamento jurídico?</span>
                        <p className="text-zinc-300 leading-tight">
                          {activeAsset.questions.hasLegalBasis.status ? "✔ " : "✖ "}
                          {activeAsset.questions.hasLegalBasis.detail}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-zinc-500 font-bold">Existe rastreabilidade?</span>
                        <p className="text-zinc-300 leading-tight">
                          {activeAsset.questions.hasTraceability.status ? "✔ " : "✖ "}
                          {activeAsset.questions.hasTraceability.detail}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-zinc-500 font-bold">Existe cobertura por testes?</span>
                        <p className="text-zinc-300 leading-tight">
                          {activeAsset.questions.hasTestCoverage.status ? "✔ " : "✖ "}
                          {activeAsset.questions.hasTestCoverage.detail}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-zinc-500 font-bold">Existe decisão arquitetural que justifica?</span>
                        <p className="text-zinc-300 leading-tight">
                          {activeAsset.questions.hasAdrJustification.status ? "✔ " : "✖ "}
                          {activeAsset.questions.hasAdrJustification.detail}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-zinc-500 font-bold">Reduz inteligência ou traz riscos de conflito?</span>
                        <p className="text-zinc-300 leading-tight">
                          {activeAsset.questions.reducesIntelligence.status ? "SIM (Prejudicial). " : "NÃO. "}
                          {activeAsset.questions.principleConflicts}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 3. DIAGNOSIS OF CONSTITUTIONAL DEVIATIONS (Only when violation is present) */}
                  {activeAsset.violation && (
                    <div className="bg-red-500/5 border border-red-500/20 p-4 rounded-xl space-y-3 animate-pulse">
                      <div className="flex items-center gap-2 border-b border-red-500/10 pb-2">
                        <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
                        <div>
                          <span className="text-[8px] uppercase font-mono text-red-500 font-black block">Anomalia Estrutural Encontrada</span>
                          <span className="text-xs font-black text-red-400 font-mono">
                            Diagnostic of Constitutional Deviation ({activeAsset.violation.severity})
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                        <div>
                          <span className="text-zinc-500 block font-bold uppercase text-[9px] font-mono">Desvio Identificado</span>
                          <p className="text-zinc-300 font-sans leading-tight mt-0.5">{activeAsset.violation.summary}</p>
                        </div>
                        <div>
                          <span className="text-zinc-500 block font-bold uppercase text-[9px] font-mono">Princípio Violado</span>
                          <p className="text-red-400 font-sans leading-tight mt-0.5 font-semibold">{activeAsset.violation.principleViolated}</p>
                        </div>
                        <div>
                          <span className="text-zinc-500 block font-bold uppercase text-[9px] font-mono">Domínios Afetados</span>
                          <p className="text-zinc-300 font-sans leading-tight mt-0.5">{activeAsset.violation.affectedDomains}</p>
                        </div>
                        <div>
                          <span className="text-zinc-500 block font-bold uppercase text-[9px] font-mono">Regulamentações em Risco</span>
                          <p className="text-zinc-300 font-sans leading-tight mt-0.5">{activeAsset.violation.affectedRegulations}</p>
                        </div>
                        <div>
                          <span className="text-zinc-500 block font-bold uppercase text-[9px] font-mono">Impacto Institucional Real</span>
                          <p className="text-red-400/90 font-sans leading-tight mt-0.5 font-bold">{activeAsset.violation.institutionalImpact}</p>
                        </div>
                        <div>
                          <span className="text-zinc-500 block font-bold uppercase text-[9px] font-mono">Ação Mitigadora Recomendada</span>
                          <p className="text-emerald-400 font-sans leading-tight mt-0.5 font-semibold">{activeAsset.violation.recommendedMitigation}</p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-[10px] bg-black/30 border border-neutral-900 p-2 rounded-lg font-mono">
                        <span className="text-zinc-500">Esforço Estimado de Engenharia:</span>
                        <span className="font-extrabold text-[#B87333]">{activeAsset.violation.estimatedEffort}</span>
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center space-y-2 text-zinc-500">
                  <Scale className="w-8 h-8 opacity-40 text-zinc-400" />
                  <span className="text-xs">Aguardando Execução do Analisador...</span>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* 2. PILAR DE CAMADAS (HIERARCHY AS REQUESTED) */}
      {activeTab === "hierarchy" && (
        <div className="space-y-4 animate-fade-in text-left">
          
          <div className="bg-neutral-900/10 border border-neutral-900/60 p-4 rounded-xl flex items-start gap-3">
            <Layers className="w-5 h-5 text-[#B87333] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider">
                Hierarquia de Abstração Sistémica — Prerrogativa Constitucional Sobeana
              </h4>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Nenhum ativo operacional ou técnico pode existir de forma isolada sem submeter-se à restrição vertical de conformidade. A Constituição está situada no topo da pirâmide organizacional do KMOS, governando todas as camadas inferiores.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            
            {/* Layers Vertical Stack */}
            <div className="lg:col-span-6 space-y-1.5">
              <span className="text-[10px] font-mono font-extrabold text-zinc-500 uppercase block mb-1">Pilha Organizacional do Sistema Operativo</span>
              {layersList.map((layer) => (
                <button
                  key={layer.level}
                  onClick={() => setSelectedLayer(layer.level === selectedLayer ? null : layer.level)}
                  className={`w-full border px-4 py-3 rounded-xl flex items-center justify-between text-left transition-all cursor-pointer ${
                    layer.level === 1 || layer.level === 2
                      ? "border-amber-500/30 bg-amber-500/5 text-amber-400 hover:bg-amber-500/10"
                      : layer.level <= 5
                      ? "border-orange-500/20 bg-orange-500/5 text-orange-400 hover:bg-orange-500/10"
                      : "border-neutral-900 bg-neutral-950/40 text-zinc-400 hover:bg-neutral-900/40"
                  } ${selectedLayer === layer.level ? "ring-2 ring-white border-white scale-[1.01]" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-extrabold opacity-60">L{layer.level}</span>
                    <div>
                      <span className="text-xs font-black block text-white">{layer.name}</span>
                      <span className="text-[9px] font-mono text-zinc-500 block leading-none mt-0.5">{layer.subtitle}</span>
                    </div>
                  </div>
                  <ArrowRightLeft className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                </button>
              ))}
            </div>

            {/* Layer Detail Focus card */}
            <div className="lg:col-span-6 bg-neutral-950 border border-neutral-900 rounded-xl p-4 flex flex-col justify-between">
              {selectedLayer ? (
                <div className="space-y-4 animate-fade-in text-left">
                  <div className="border-b border-neutral-900 pb-2">
                    <span className="text-[9px] font-mono font-black text-zinc-500 uppercase">INSPECTOR DE CAMADAS INSTITUCIONAIS</span>
                    <h5 className="text-sm font-black text-[#B87333] font-mono mt-1">
                      Layer {selectedLayer}: {layersList[selectedLayer - 1].name}
                    </h5>
                    <span className="text-[10px] text-zinc-400 block mt-0.5 italic">
                      {layersList[selectedLayer - 1].subtitle}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[9.5px] font-bold text-zinc-500 uppercase font-mono block">Âmbito Técnico e Jurídico</span>
                    <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                      {layersList[selectedLayer - 1].desc}
                    </p>
                  </div>

                  <div className="bg-black/50 border border-neutral-900 p-3 rounded-lg space-y-2">
                    <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase block">Restrições e Invariantes na Camada</span>
                    
                    {selectedLayer === 1 && (
                      <p className="text-[11px] text-zinc-400">
                        Invariantes prudenciais rígidos, imunidade fiduciária de Kwanza 1:1, salvaguarda de depósitos segregados e proibição total de qualquer descoberto ou taxa usurária.
                      </p>
                    )}
                    {selectedLayer === 2 && (
                      <p className="text-[11px] text-zinc-400">
                        Compilador constitucional contínuo que intercepta novas diretrizes, variáveis ou submissões de código, impedindo falhas estruturais de conformidade.
                      </p>
                    )}
                    {selectedLayer === 5 && (
                      <p className="text-[11px] text-zinc-400">
                        Políticas parametrizáveis de MDR, tetos de KYC simplificados por nível de conta (200,000 AOA Level-1, 1,500,000 AOA Level-2) aplicadas em runtime.
                      </p>
                    )}
                    {selectedLayer > 5 && (
                      <p className="text-[11px] text-zinc-400">
                        O nexo causal desta camada inferior deve sempre subir hierarquicamente através do Grafo de Conhecimento, justificando seu alinhamento com a Constituição do KMOS.
                      </p>
                    )}
                  </div>

                  <div className="p-3 bg-[#B87333]/5 border border-[#B87333]/20 rounded-lg flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#B87333] shrink-0" />
                    <span className="text-[10.5px] text-zinc-400">Camada integrada à árvore de controle estático do compilador.</span>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center space-y-2 text-zinc-500 py-12">
                  <Layers className="w-8 h-8 opacity-30 text-zinc-500" />
                  <span className="text-xs text-center">Clique em qualquer camada da pilha ao lado para inspecionar os detalhes arquiteturais integrados.</span>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* 3. SISTEMAS INTEGRADOS (REDE) */}
      {activeTab === "integrations" && (
        <div className="space-y-4 animate-fade-in text-left">
          
          <div className="bg-neutral-900/10 border border-neutral-900/60 p-4 rounded-xl">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Malha de Integrações e Sincronismo Sistémico
            </h4>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Como o núcleo do Sistema Operativo Institucional, o Constitution Engine não opera em silos. Ele interliga de forma contínua múltiplos serviços analíticos e de governança para manter a imunidade operacional do KwanzaMóvel.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { name: "KMOS Constitution", status: "Sincronizado", desc: "Fornece os preceitos de imutabilidade de dados, rácio 1:1 e inclusão financeira rural baseados no KMOS_CONSTITUTION.md." },
              { name: "Regulatory Engine", status: "Interceptação Ativa", desc: "Verifica e intercepta transações financeiras em tempo real contra as restrições e diretivas do Banco Nacional de Angola." },
              { name: "Policy Engine", status: "Regras Cadastradas", desc: "Aplica de forma dinâmica as políticas de limites KYC, MDR comercial capped em 1.2% e as regras tarifárias." },
              { name: "Knowledge Graph", status: "Nexo Causal Mapeado", desc: "Grafo de conhecimento que interconecta as arestas de lógica física e as de finalidade institucional das leis de Angola." },
              { name: "Institutional Memory", status: "Logs HSM Ativos", desc: "Garante que todo parecer ou verificação efetuada seja gravado de forma imutável com assinatura digital criptográfica única." },
              { name: "ADR Repository", status: "14 ADRs Rastreados", desc: "Repositório de decisões de arquitetura que fornece justificativa técnica e histórica às classes e fluxos criados." },
              { name: "Observatory", status: "Espelhamento Ativo", desc: "Barramento de telemetria contínua de integridade do ledger que ouve e analisa anomalias ou falhas de saldo." },
              { name: "Decision Engine", status: "Comités Online", desc: "Coordena deliberações de comités humanos delegados que resolvem alertas amarelos ou alterações de taxas promocionais." },
              { name: "Institutional Twin", status: "Modelo Estocástico", desc: "Garante simulações estocásticas de estresse de liquidez extrema em sandboxes lógicos antes da implantação real." }
            ].map((sys, idx) => (
              <div key={idx} className="bg-neutral-950 border border-neutral-900 rounded-xl p-3.5 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-zinc-100 font-mono">{sys.name}</span>
                    <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded uppercase">
                      {sys.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-normal mt-1.5">{sys.desc}</p>
                </div>
                <div className="flex items-center gap-1.5 pt-2 border-t border-neutral-900 text-[10px] text-zinc-500 font-mono">
                  <Activity className="w-3 h-3 text-[#B87333]" />
                  <span>Conexão Segura Ativa (mTLS 1.3)</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* 4. CONSTITUIÇÃO & GRAFO REGULATÓRIA */}
      {activeTab === "rules" && (
        <div className="space-y-4 animate-fade-in text-left">
          
          <div className="bg-neutral-900/10 border border-neutral-900/60 p-4 rounded-xl flex justify-between items-center gap-3">
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Grafo de Regras & Cláusulas Constitucionais Ativas
              </h4>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed font-sans">
                Visualize as cláusulas duras e leis que fundamentam a arquitetura lógica do KMOS. Cada pilar é modelado como uma aresta obrigatória de nexo causal no Knowledge Graph.
              </p>
            </div>
            <div className="relative w-48 shrink-0">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Filtrar diretivas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black border border-neutral-900 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-zinc-300 outline-none focus:border-amber-900/40"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { id: "C-01", title: "Imunidade Fiduciária Total 1:1", ref: "Aviso n.º 07/2020 (Artigo 5.º)", desc: "Exige que cada unidade de Kwanza móvel eletrónico emitida possua respaldo físico segregado correspondente em moeda nacional depositada no Banco Nacional de Angola. Proíbe qualquer emissão paralela ou modelo de reserva fracionária no ecossistema." },
              { id: "C-02", title: "KYC Simplificado para Inclusão", ref: "Aviso n.º 11/2021 (Artigo 12.º)", desc: "Estabelece os tetos de transações e saldo para as carteiras simplificadas Level 1 (Até 200,000 AOA de saldo máximo) e Level 2 (Até 1,500,000 AOA), reduzindo barreiras de adoção e promovendo a inclusão financeira rural." },
              { id: "C-03", title: "Prerrogativa de Canais Seguros mTLS 1.3", ref: "Lei n.º 40/20 (Artigo 42.º)", desc: "Impedimento técnico absoluto de tráfego de dados transacionais com gateways de compensação de bancos sem autenticação de certificados digitais mútuos baseados em infraestrutura de chaves fidedignas regulamentada pelo Estado." },
              { id: "C-04", title: "Capping de Micro-Taxas MDR Comerciais", ref: "Aviso n.º 06/2020", desc: "Regula que a taxa máxima de intercâmbio comercial praticada por estabelecimentos comerciais integrados não excederá 1.2% em áreas urbanas e 0.5% em mercados rurais para proteger micro-vendedores." },
              { id: "C-05", title: "Exclusividade Monetária de Curso Legal", ref: "Lei do BNA & Constituição do KMOS", desc: "Impede o software de suportar, transacionar ou validar qualquer token paralelo, pontos gamificados fungíveis ou moedas de jogo não respaldadas pelo Banco Central angolano." }
            ].filter(r => r.title.toLowerCase().includes(searchQuery.toLowerCase()) || r.desc.toLowerCase().includes(searchQuery.toLowerCase())).map((rule, idx) => (
              <div key={idx} className="bg-neutral-950 border border-neutral-900 rounded-xl p-4 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[9.5px] font-mono font-black text-[#B87333] uppercase">{rule.id}</span>
                    <span className="text-[9px] font-mono text-zinc-500 font-semibold">{rule.ref}</span>
                  </div>
                  <h5 className="text-xs font-black text-zinc-200 mt-1 font-sans">{rule.title}</h5>
                  <p className="text-[11px] text-zinc-400 leading-relaxed mt-2">{rule.desc}</p>
                </div>
                <div className="pt-2 border-t border-neutral-900 flex items-center justify-between text-[9px] text-zinc-500 font-mono">
                  <span>Status: RESTRIÇÃO EXECUTÁVEL</span>
                  <span className="text-emerald-500">✔ Ativa</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

    </div>
  );
};
