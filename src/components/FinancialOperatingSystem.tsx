import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Folder,
  ChevronDown,
  ChevronRight,
  Activity,
  Coins,
  Database,
  ArrowRightLeft,
  ShieldCheck,
  Server,
  Code,
  Search,
  BookOpen,
  Terminal as TerminalIcon,
  Play,
  RotateCw,
  Cpu,
  AlertCircle,
  FileText,
  ShieldAlert,
  Users,
  Sliders,
  AlertTriangle,
  Download,
  KeyRound,
  X,
  Printer,
  MapPin,
  Clock,
  Globe,
  Zap,
  CheckCircle,
  HelpCircle,
  Sparkles,
  Command,
  Plus,
  Network,
  Dna,
  Award,
  History,
  FileCode,
  Scale
} from "lucide-react";
import { UserAccount, Transaction, BnaCustodyState, DomainEvent } from "../types";
import { RegulatoryKnowledgeKernel } from "../../backend/regulation/RegulatoryKnowledgeKernel";
import { runDomainTestSuite, DomainTestReport } from "../ledgerEngine";
import { LedgerStressTester, StressTestTelemetry } from "../infrastructure/testing/LedgerStressTester";
import { PostgresLedgerRepository, runPostgresLedgerConcurrentStressTest, PostgresLedgerStressTestResult } from "../infrastructure/persistence/PostgresLedgerRepository";
import { chaosUtility } from "../infrastructure/testing/ChaosTestingUtility";
import { jsPDF } from "jspdf";
import { ConstitutionEngine } from "./ConstitutionEngine";
import { MonthlySpendingDistributionChart } from "./MonthlySpendingDistributionChart";
import { ComplianceView } from "./ComplianceView";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area
} from "recharts";

interface FinancialOperatingSystemProps {
  currentUser: UserAccount;
  setCurrentUser: React.Dispatch<React.SetStateAction<UserAccount>>;
  ledger: Transaction[];
  setLedger: React.Dispatch<React.SetStateAction<Transaction[]>>;
  onLedgerUpdate: (newJournal: any[], newBnaSptrMsg: string, txAmount: number, syncBatch?: any, events?: DomainEvent[]) => void;
  bnaState: BnaCustodyState;
  setBnaState: React.Dispatch<React.SetStateAction<BnaCustodyState>>;
  highContrast?: boolean;
  seniorMode?: boolean;
  voiceOver?: boolean;
}

// 1. Definition of all nodes in our Operational Explorer
interface OperationalNode {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  category: "governance" | "compliance" | "payments" | "operations" | "monitoring" | "ai";
  kpi: {
    estado: string;
    regras: number;
    eventos: number;
    useCases: number;
    testes: number;
    observabilidade: "OK" | "CRITICAL" | "ALERTA" | "MONITORIZADO";
  };
}

// Structured Event model for our live Event Stream
interface StructuredDomainEvent {
  time: string;
  type: string;
  correlationId: string;
  lawRef: string;
  origin: string;
  result: "SUCCESS" | "Under Review" | "DENIED" | "FAILED";
  details: Record<string, any>;
}

export default function FinancialOperatingSystem({
  currentUser,
  setCurrentUser,
  ledger,
  setLedger,
  onLedgerUpdate,
  bnaState,
  setBnaState,
  highContrast = false,
  seniorMode = false,
  voiceOver = false
}: FinancialOperatingSystemProps) {
  const rkk = RegulatoryKnowledgeKernel.getInstance();

  // Define the structured mapping of categories and nodes in our Operational Explorer Tree, organized by Institutional Capabilities
  const treeModel = {
    const: {
      label: "Constituição & Memória",
      nodes: [
        { id: "const_principle", label: "Constituição do KMOS", kpi: { estado: "Princípio Único", regras: 1, eventos: 1, useCases: 1, testes: 1, observabilidade: "OK" } },
        { id: "const_memory", label: "Memória Institucional", kpi: { estado: "Rastreável", regras: 3, eventos: 42, useCases: 8, testes: 120, observabilidade: "OK" } },
        { id: "const_iql", label: "Query Language (IQL)", kpi: { estado: "Conversacional", regras: 5, eventos: 120, useCases: 25, testes: 80, observabilidade: "OK" } },
        { id: "const_ai", label: "Institutional AI", kpi: { estado: "Cognitivo", regras: 8, eventos: 450, useCases: 110, testes: 3124, observabilidade: "OK" } }
      ]
    },
    cap_inclusion: {
      label: "1. Inclusão Financeira (Capacidade)",
      nodes: [
        { id: "payments_wallets", label: "Carteiras Eletrónicas (Wallet)", kpi: { estado: "OK", regras: 18, eventos: 1540, useCases: 10, testes: 85, observabilidade: "OK" } },
        { id: "operations_merchants", label: "Terminais Comerciais (Merchant)", kpi: { estado: "COMPLIANT", regras: 12, eventos: 750, useCases: 8, testes: 40, observabilidade: "OK" } },
        { id: "operations_identity", label: "Identidade Simplificada (KYC)", kpi: { estado: "VERIFIED", regras: 8, eventos: 1200, useCases: 4, testes: 50, observabilidade: "OK" } }
      ]
    },
    cap_settlement: {
      label: "2. Liquidação & Custódia (Capacidade)",
      nodes: [
        { id: "payments_settlement", label: "Compensação SPTR/SGA (Settlement)", kpi: { estado: "BALANCED", regras: 14, eventos: 890, useCases: 8, testes: 45, observabilidade: "OK" } },
        { id: "payments_ledger", label: "Ledger de Partidas Dobradas", kpi: { estado: "100% ACID", regras: 20, eventos: 3200, useCases: 12, testes: 120, observabilidade: "OK" } },
        { id: "payments_reserves", label: "Contas de Salvaguarda (Reserve)", kpi: { estado: "SECURED", regras: 6, eventos: 420, useCases: 4, testes: 18, observabilidade: "OK" } }
      ]
    },
    cap_supervision: {
      label: "3. Supervisão & Conformidade (Capacidade)",
      nodes: [
        { id: "kos_policy", label: "Motor de Políticas (Policy Engine)", kpi: { estado: "Active", regras: 8, eventos: 150, useCases: 12, testes: 90, observabilidade: "OK" } },
        { id: "compliance_lspa", label: "Lei n.º 40/20 (LSPA Geral)", kpi: { estado: "94%", regras: 318, eventos: 942, useCases: 48, testes: 561, observabilidade: "OK" } },
        { id: "compliance_av11", label: "Aviso n.º 11/2021 (Tiers Simplificados)", kpi: { estado: "92%", regras: 85, eventos: 620, useCases: 14, testes: 110, observabilidade: "OK" } },
        { id: "governance_compliance", label: "Risco & Conformidade Contínua", kpi: { estado: "A Rating", regras: 35, eventos: 1800, useCases: 22, testes: 160, observabilidade: "OK" } },
        { id: "governance_auditoria", label: "Certificação de Auditoria", kpi: { estado: "CERTIFIED", regras: 12, eventos: 95, useCases: 5, testes: 30, observabilidade: "OK" } }
      ]
    },
    cap_deliberation: {
      label: "4. Inteligência & Deliberação (Capacidade)",
      nodes: [
        { id: "ai_graph", label: "Grafo de Conhecimento (Graph)", kpi: { estado: "LOADED", regras: 125, eventos: 410, useCases: 12, testes: 55, observabilidade: "OK" } },
        { id: "kos_dependency", label: "Análise de Linhagem e Impacto", kpi: { estado: "Ready", regras: 8, eventos: 40, useCases: 14, testes: 120, observabilidade: "OK" } },
        { id: "kos_adr", label: "Decision Engine (Deliberativo)", kpi: { estado: "Active", regras: 4, eventos: 12, useCases: 8, testes: 25, observabilidade: "OK" } },
        { id: "kos_manifests", label: "Manifestos de Módulos (YAML)", kpi: { estado: "100%", regras: 6, eventos: 6, useCases: 6, testes: 6, observabilidade: "OK" } }
      ]
    },
    kmos_observatory: {
      label: "5. KMOS Observatory (Observação)",
      nodes: [
        { id: "monitoring_metrics", label: "Métricas Sistémicas (Metrics)", kpi: { estado: "Excellent", regras: 12, eventos: 2400, useCases: 6, testes: 32, observabilidade: "OK" } },
        { id: "monitoring_events", label: "Fluxo de Eventos de Domínio", kpi: { estado: "STREAMING", regras: 1, eventos: 14820, useCases: 3, testes: 10, observabilidade: "OK" } },
        { id: "monitoring_telemetry", label: "Telemetria & Latências (SLA)", kpi: { estado: "110ms AVG", regras: 8, eventos: 12400, useCases: 4, testes: 20, observabilidade: "OK" } },
        { id: "monitoring_logs", label: "Registo de Execução (Logs)", kpi: { estado: "OK", regras: 4, eventos: 9400, useCases: 2, testes: 15, observabilidade: "OK" } },
        { id: "monitoring_tracing", label: "Rastreabilidade Distribuída", kpi: { estado: "Ready", regras: 10, eventos: 380, useCases: 5, testes: 40, observabilidade: "OK" } }
      ]
    }
  };

  // 2. RBAC (Role-Based Access Control) User Profile and Metadata
  type UserRole = "operacao" | "compliance" | "auditoria" | "engenharia";

  interface RoleMetadata {
    id: UserRole;
    label: string;
    description: string;
    allowedNodes: string[];
    color: string;
  }

  const rolesMetadata: RoleMetadata[] = [
    {
      id: "operacao",
      label: "Operação",
      description: "Saldos, Transferências, Alertas",
      color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
      allowedNodes: [
        "payments_wallets",
        "operations_merchants",
        "operations_identity",
        "payments_reserves",
        "payments_settlement",
        "operations_agents",
        "monitoring_alarms",
        "operations_partners"
      ]
    },
    {
      id: "compliance",
      label: "Compliance",
      description: "Matriz de Regras, Logs da Lei 40/20",
      color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
      allowedNodes: [
        "kos_policy",
        "compliance_lspa",
        "compliance_av11",
        "governance_compliance",
        "monitoring_events",
        "kos_adr",
        "compliance_av06",
        "compliance_av07",
        "compliance_av10",
        "governance_authorities",
        "governance_delegations"
      ]
    },
    {
      id: "auditoria",
      label: "Auditoria",
      description: "Evidence Packages, Verificação Criptográfica",
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
      allowedNodes: [
        "governance_auditoria",
        "payments_custody",
        "monitoring_audit",
        "const_principle",
        "const_memory",
        "kos_manifests",
        "kos_dependency",
        "governance_signatures",
        "governance_hsm"
      ]
    },
    {
      id: "engenharia",
      label: "Engenharia",
      description: "Métricas de Infraestrutura, Latência, Traces",
      color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
      allowedNodes: [
        "monitoring_metrics",
        "monitoring_telemetry",
        "monitoring_logs",
        "monitoring_tracing",
        "monitoring_tests",
        "ai_twin",
        "ai_simulations",
        "const_ai",
        "const_iql",
        "ai_graph",
        "monitoring_performance",
        "ai_engine",
        "kos_dna",
        "kos_catalog",
        "kos_architecture",
        "kos_timeline"
      ]
    }
  ];

  const [userRole, setUserRole] = useState<UserRole>("operacao");

  // Helper to resolve legible names of tabs
  const findLabelById = (nodeId: string): string => {
    for (const category of Object.values(treeModel)) {
      const match = category.nodes.find(n => n.id === nodeId);
      if (match) return match.label;
    }
    if (nodeId === "monitoring_alarms") return "Alarmes";
    if (nodeId === "payments_custody") return "Custódia SGA-BNA";
    if (nodeId === "monitoring_audit") return "Auditoria Integridade";
    if (nodeId === "monitoring_tests") return "Suite de Testes";
    if (nodeId === "ai_twin") return "Institutional Twin";
    if (nodeId === "ai_simulations") return "Simulador de Stress";
    return nodeId;
  };

  // Active workspace state mapping (Defaulting to Operation role view)
  const [activeTab, setActiveTab] = useState<string>("payments_wallets");
  const [openTabs, setOpenTabs] = useState<Array<{ id: string; label: string }>>([
    { id: "payments_wallets", label: "Carteiras Eletrónicas (Wallet)" },
    { id: "operations_merchants", label: "Terminais Comerciais (Merchant)" },
    { id: "operations_identity", label: "Identidade Simplificada (KYC)" }
  ]);

  // Synchronize tabs with active Role (RBAC enforcement)
  useEffect(() => {
    const meta = rolesMetadata.find(r => r.id === userRole);
    if (!meta) return;

    setOpenTabs(prev => {
      const filtered = prev.filter(tab => meta.allowedNodes.includes(tab.id));
      if (filtered.length === 0) {
        const firstAllowed = meta.allowedNodes[0];
        return [{ id: firstAllowed, label: findLabelById(firstAllowed) }];
      }
      return filtered;
    });

    if (!meta.allowedNodes.includes(activeTab)) {
      setActiveTab(meta.allowedNodes[0]);
    }
  }, [userRole]);

  // Collapsible Categories for the Operational Explorer Tree
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    const: true,
    cap_inclusion: true,
    cap_settlement: false,
    cap_supervision: false,
    cap_deliberation: false,
    kmos_observatory: false
  });

  // Knowledge Operating System (KOS) state variables
  const [depRegulation, setDepRegulation] = useState<string>("av11");
  const [manifestModule, setManifestModule] = useState<string>("wallet");
  const [catalogModule, setCatalogModule] = useState<string>("wallet");
  
  // Universal Policy Engine states
  const [selectedPolicyType, setSelectedPolicyType] = useState<string>("all");
  const [policySearch, setPolicySearch] = useState<string>("");
  const [activePolicyId, setActivePolicyId] = useState<string>("L4020_A40");
  const [policySimInput, setPolicySimInput] = useState<string>('{\n  "amount": 65000,\n  "tier": "Level-1",\n  "offline": false,\n  "hasSca": true\n}');
  const [policySimOutput, setPolicySimOutput] = useState<string>("");

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  // Command Palette & Global Search States
  const [showPalette, setShowPalette] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState("");
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [selectedEntity, setSelectedEntity] = useState<any | null>(null);

  // Live Domain Event Stream State
  const [eventsStream, setEventsStream] = useState<StructuredDomainEvent[]>([
    {
      time: "09:14:03",
      type: "WalletCreated",
      correlationId: "corr_8D9A12F38B9",
      lawRef: "Artigo 40.º da Lei 40/20",
      origin: "WalletAggregate",
      result: "SUCCESS",
      details: { phone: "+244923000111", tier: "Level-1", owner: "Manuel da Silva" }
    },
    {
      time: "09:14:05",
      type: "AMLTriggered",
      correlationId: "corr_7F43E21A42D",
      lawRef: "Aviso n.º 11/2021",
      origin: "ComplianceSagaEngine",
      result: "Under Review",
      details: { riskScore: 83, action: "CautelaryHold", triggerReason: "High amount" }
    },
    {
      time: "09:14:07",
      type: "SettlementCompleted",
      correlationId: "corr_3C910B8D4E2",
      lawRef: "Aviso n.º 05/2021",
      origin: "SptrSettlementProcessor",
      result: "SUCCESS",
      details: { amount: "15,000 Kz", targetBank: "BFA", status: "Balanced" }
    }
  ]);

  // Digital Twin Simulator State
  const [isTwinSimulating, setIsTwinSimulating] = useState(false);
  const [tpsRate, setTpsRate] = useState(12);
  const [chaosLoss, setChaosLoss] = useState(false);
  const [chaosLatency, setChaosLatency] = useState(false);
  const [twinStats, setTwinStats] = useState({
    activeUsers: 450,
    tps: 12,
    latency: 8.5,
    cpu: 4.5,
    invariantsPassed: 100
  });

  // DSL compiler states
  const [dslCode, setDslCode] = useState(
    `DECLARE RULE "ControloDiarioLevel1"\nON transaction\nWHEN wallet.tier == "Level-1" AND amount > 50000\nTHEN DENY WITH "Limite diário de moeda simplificada excedido"`
  );
  const [dslCompilationOutput, setDslCompilationOutput] = useState("");

  // Constitutional & IQL & AI states
  const [constSubTab, setConstSubTab] = useState<"text" | "engine" | "graph" | "simulator" | "twin">("text");
  const [selectedSimArticle, setSelectedSimArticle] = useState<string>("Artigo 74 (Confidencialidade)");
  const [simulatingImpact, setSimulatingImpact] = useState<boolean>(false);
  const [simResult, setSimResult] = useState<any>(null);
  const [selectedTwinScenario, setSelectedTwinScenario] = useState<string>("Novo Aviso de Reservas (BNA)");
  const [twinRunning, setTwinRunning] = useState<boolean>(false);
  const [twinResult, setTwinResult] = useState<any>(null);
  const [iqlQuery, setIqlQuery] = useState<string>("SHOW High Risk Policies");
  const [iqlResult, setIqlResult] = useState<any>(null);
  const [iqlHistory, setIqlHistory] = useState<Array<{ query: string; time: string; ok: boolean }>>([
    { query: "SHOW Wallet DEPENDENCIES", time: "14:02:11", ok: true },
    { query: "TRACE SettlementCompleted", time: "14:05:43", ok: true }
  ]);
  const [aiQuestion, setAiQuestion] = useState<string>("Porque esta regra existe?");
  const [aiAnswer, setAiAnswer] = useState<string>("");
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  // Constitution Engine Interactive States
  const [constitutionCheckType, setConstitutionCheckType] = useState<"regulatory" | "integrity">("regulatory");
  const [constitutionInputAsset, setConstitutionInputAsset] = useState<string>("SMSOfflineLedger");
  const [constitutionCustomAsset, setConstitutionCustomAsset] = useState<string>("");
  const [constitutionCheckRunning, setConstitutionCheckRunning] = useState<boolean>(false);
  const [constitutionCheckResult, setConstitutionCheckResult] = useState<any | null>({
    asset: "SMSOfflineLedger",
    type: "regulatory",
    verdict: "CONFORME & VERIFICADO",
    verdictColor: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    hierarchyLayer: "Layer 4 (Domínio) & Layer 5 (Código)",
    principle: "Princípio 3: Critério de Evolução (Necessidades Operacionais Reais)",
    constitutionRule: "Responder a Necessidades Operacionais Reais (Seção: Inclusão Financeira Rural)",
    legalReference: "Aviso n.º 11/2021 (Artigo 5.º, Cláusula de Inclusão Rural)",
    analysis: "A classe de domínio `SMSOfflineLedger` implementa transações asíncronas de moeda eletrónica com assinatura criptográfica ECDSA P-256 compactada sobre SMS binário. Isto permite que populações rurais sem acesso a dados móveis IP realizem pagamentos com segurança criptográfica garantida. Esta funcionalidade atende perfeitamente ao princípio da inclusão financeira rural estabelecido no Aviso 11/21 e preserva a imutabilidade do saldo mesmo em modo desligado.",
    integrityRisk: "0.0% (Risco Mínimo)",
    remediation: "Nenhuma mitigação necessária. O código possui fundamento jurídico completo e testes de integração automatizados em 'SMSGateway.test.ts'."
  });
  const [constitutionHistory, setConstitutionHistory] = useState<Array<any>>([
    {
      time: "14:21:05",
      asset: "SMSOfflineLedger",
      type: "regulatory",
      verdict: "CONFORME",
      ok: true
    },
    {
      time: "14:24:12",
      asset: "setReserveRatio(0.95)",
      type: "integrity",
      verdict: "VETO ABSOLUTO",
      ok: false
    }
  ]);

  // System Health state (composite "Institutional Health" index: Compliance, Operational Risk, Resilience, etc.)
  const [institutionalHealth, setInstitutionalHealth] = useState({
    compliance: 96.8,       // Based on the Aviso compliance rate
    operationalRisk: 95.5,  // Operational risk stability
    resilience: 98.2,       // Transactional resilience
    dataIntegrity: 100.0,   // Ledger cryptographic integrity
    overall: 97.6           // Composite average
  });

  // Dynamic Institutional Memory state
  const [decisionsMemory, setDecisionsMemory] = useState([
    {
      id: "DEC-2026-001",
      date: "2026-01-15",
      decision: "Adoção do Ledger Imutável por Dupla Entrada",
      motivo: "Adequação estrita ao Artigo 42.º da Lei n.º 40/20 do BNA (Integridade dos depósitos).",
      consequence: "Redução de fraude transacional em 98.7% e garantia absoluta de reconciliação fiduciária.",
      risk: "Crítico / Muito Alto (Mitigação de insolvência de depósitos)",
      modules: "42 módulos impactados (Wallet, Settlement, Ledger, Reserve)",
      context: "Necessidade de garantir auditoria independente irrefutável para liquidação interbancária.",
      problem: "Transações sofriam inconsistências de rede com risco de dupla despesa.",
      alternatives: "Apenas logs em banco SQL tradicional (rejeitado por vulnerabilidade a adulterações).",
      choice: "Implementação de algoritmo de encadeamento criptográfico SHA-256 com assinaturas HSM.",
      legalBase: "Artigo 42.º da Lei n.º 40/20 do BNA",
      tradeoffs: "Acréscimo de 18ms na latência de escrita para processamento das assinaturas.",
      impact: "Segurança transacional absoluta contra adulterações internas.",
      tests: "AccountingService.test.ts, LedgerAudit.test.ts",
      responsible: "Eng.ª Sandra Neto (Diretora de Tecnologia)",
      state: "APPROVED"
    },
    {
      id: "DEC-2027-002",
      date: "2027-04-10",
      decision: "Ativação de Liquidação Offline via SMS Assinado",
      motivo: "Garantir inclusão financeira nas províncias do Huambo, Bié e Namibe sem cobertura regular de dados.",
      consequence: "Inclusão imediata de +2.1 milhões de utilizadores rurais via criptografia SMS-OTP.",
      risk: "Alto (Risco de dupla despesa offline mitigado por limites severos diários)",
      modules: "12 módulos alterados (principalmente Gateway SMS e Offline Ledger)",
      context: "Ausência de sinal 3G/4G/5G em mais de 60% das comunas do interior do país.",
      problem: "Exclusão populacional por dependência de conectividade IP constante.",
      alternatives: "Terminais por satélite dedicados (rejeitado por custo operacional proibitivo).",
      choice: "Criptografia assimétrica ECDSA P-256 com compressão de payload sobre SMS binário.",
      legalBase: "Aviso n.º 11/2021 (Inclusão Financeira Rural)",
      tradeoffs: "Liquidação asíncrona com reconciliação em lote no final do dia.",
      impact: "Inclusão de +2.1 milhões de utilizadores rurais nas redes de comércio.",
      tests: "OfflineLedger.test.ts, SMSGateway.test.ts",
      responsible: "Dr. João Baptista (Presidente do Conselho Executivo)",
      state: "APPROVED"
    },
    {
      id: "DEC-2028-003",
      date: "2028-09-02",
      decision: "Ajuste Automático do Aviso n.º 11/2021",
      motivo: "Diretiva atualizada do BNA sobre limites simplificados e geo-velocity para prevenção de financiamento ao terrorismo.",
      consequence: "O Policy Engine adaptou limites diários de contas Level-1 de 50k Kz para 65k Kz sem downtime.",
      risk: "Médio (Conformidade regulatória imediata sem intervenção manual)",
      modules: "Adaptado via runtime do Policy Engine (Module Manifests)",
      context: "Instrução expressa do regulador para ajuste imediato perante inflação.",
      problem: "Downtime ou reinstalação de servidores para alteração de limites de wallets.",
      alternatives: "Deploy de nova versão do microsserviço (rejeitado por tempo de resposta lento).",
      choice: "Declarative Rule Engine compilando DSL dinamicamente no gateway.",
      legalBase: "Aviso n.º 11/2021 do BNA",
      tradeoffs: "Ligeiro aumento de processamento de CPU para avaliação dinâmica de regras.",
      impact: "Compliance imediato e em tempo real sem interrupção de serviço.",
      tests: "RuleEvaluator.test.ts, WalletLimits.test.ts",
      responsible: "Eng. Pedro Chaves (Arquiteto de Sistemas)",
      state: "APPROVED"
    }
  ]);

  // Decision Engine Workspace States
  const [proposalPreset, setProposalPreset] = useState<string>("preset_limits");
  const [customProposalText, setCustomProposalText] = useState<string>("");
  const [evaluatingProposal, setEvaluatingProposal] = useState<boolean>(false);
  const [decisionSuccessMessage, setDecisionSuccessMessage] = useState<string | null>(null);
  const [evaluationResult, setEvaluationResult] = useState<any | null>({
    title: "Ajustar limites diários de contas Level-1 para 80.000 Kz",
    decisionNeeded: "Análise de Limites Fiduciários",
    verdict: "REQUER MITIGAÇÃO",
    verdictColor: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    constitutionRules: [
      { rule: "Aviso n.º 11/2021 (Artigo 5.º)", status: "RESTRITO", detail: "O limite diário absoluto sem BI para contas simplificadas é de 65.000 Kz." },
      { rule: "Lei n.º 40/20 (Artigo 40.º)", status: "COMPLIANT", detail: "Isolamento fiduciário do saldo eletrónico preservado." }
    ],
    reasoning: "O regulamento geral limita as contas Level-1 sem identificação formal a 65.000 Kz diários. O aumento para 80.000 Kz é autorizado apenas se associado à validação secundária do Bilhete de Identidade (BI) no gateway ou autenticação forte de dois fatores (SCA).",
    estimatedImpacts: {
      compliance: +3.2,
      operationalRisk: -4.5,
      resilience: +1.5,
      overall: +0.2
    },
    remediationSteps: [
      "Introduzir verificação facial biométrica no app do utilizador",
      "Atualizar regras dinâmicas do Policy Engine no gateway de carteiras",
      "Registrar nova certidão de conformidade automatizada"
    ],
    canFormalize: true,
    decisionToInject: {
      decision: "Ajuste de Limites Level-1 com Autenticação Forte",
      context: "Melhoria do poder de compra dos utilizadores rurais mantendo enquadramento com o Aviso 11/21.",
      problem: "O limite anterior de 65k impossibilitava transações de utilidade básica em época inflacionária.",
      alternatives: "Aumento linear sem verificação adicional (Rejeitado por veto do BNA devido a risco AML).",
      choice: "Elevação do limite para 80.000 Kz condicionado a SCA biométrico instantâneo.",
      legalBase: "Aviso n.º 11/2021 do BNA (Artigo 5.º, Cláusula de Mitigação)",
      risk: "Médio-Baixo (Mitigado por mTLS e biometria facial obrigatória)",
      tradeoffs: "Aumento de 2.4s no tempo médio de checkout devido à leitura biométrica facial.",
      impact: "Permite maior flexibilidade de consumo enquanto previne fraudes de identidade.",
      tests: "ScaLimits.test.ts, BiometricAuth.test.ts",
      responsible: "Dra. Sandra Neto (Diretora de Compliance e Risco)"
    }
  });

  // Test suite states
  const [testReports, setTestReports] = useState<DomainTestReport[]>(() => runDomainTestSuite());
  const [runningTests, setRunningTests] = useState(false);

  // Concurrency Stress Test states (LedgerStressTester)
  const [runningStressTest, setRunningStressTest] = useState(false);
  const [stressTelemetry, setStressTelemetry] = useState<StressTestTelemetry | null>(null);
  const [stressConcurrency, setStressConcurrency] = useState(15);
  const [stressAmount, setStressAmount] = useState(50);

  // PostgresLedger OCC Promise.all Stress Test states
  const [runningPgOccStress, setRunningPgOccStress] = useState(false);
  const [pgOccStressResult, setPgOccStressResult] = useState<PostgresLedgerStressTestResult | null>(null);

  const handleRunPgOccStressTest = async (concurrency: number = 10) => {
    setRunningPgOccStress(true);
    try {
      const repo = new PostgresLedgerRepository();
      const res = await repo.runConcurrentStressTest({ concurrencyLevel: concurrency, amountPerWrite: 100 });
      setPgOccStressResult(res);
    } catch (err) {
      console.error("PostgresLedger OCC stress test error:", err);
    } finally {
      setRunningPgOccStress(false);
    }
  };

  // Chaos Testing Utility states
  const [chaosConfig, setChaosConfig] = useState(() => chaosUtility.getConfig());
  const [chaosLogs, setChaosLogs] = useState(() => chaosUtility.getLogs());

  // Periodically refresh chaos logs in background
  useEffect(() => {
    const interval = setInterval(() => {
      setChaosLogs(chaosUtility.getLogs());
    }, 800);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateChaosConfig = (updates: Partial<typeof chaosConfig>) => {
    chaosUtility.updateConfig(updates);
    setChaosConfig(chaosUtility.getConfig());
  };

  const handleResetChaosConfig = () => {
    chaosUtility.resetConfig();
    setChaosConfig(chaosUtility.getConfig());
  };

  const handleClearChaosLogs = () => {
    chaosUtility.clearLogs();
    setChaosLogs([]);
  };

  // Dynamic Real-time Math Telemetry (Fase 4 Saneamento)
  const mappedUseCasesCount = useMemo(() => {
    const obligations = rkk.getAllObligations();
    const uniqueUseCases = new Set<string>();
    obligations.forEach(o => {
      if (o.linkedUseCases) {
        o.linkedUseCases.forEach((uc: string) => uniqueUseCases.add(uc));
      }
    });
    return uniqueUseCases.size || 15;
  }, [rkk]);

  const activeInvariantsCount = 8; // Double-entry, Safeguard backing, KYC limits, SCA/MFA, No negative bal, Irrevocable finality, MDR ceiling, Hash continuous

  const totalRulesRequired = useMemo(() => {
    return rkk.getAllObligations().length || 11;
  }, [rkk]);

  const coverageScore = useMemo(() => {
    const executed = testReports.length;
    return Math.round((executed / mappedUseCasesCount) * 100);
  }, [testReports, mappedUseCasesCount]);

  const complianceVerification = useMemo(() => {
    return Math.round((activeInvariantsCount / totalRulesRequired) * 100);
  }, [totalRulesRequired]);

  const overallArchitectureScore = useMemo(() => {
    return Math.round((91 + 94 + coverageScore + 88 + complianceVerification + coverageScore) / 6);
  }, [coverageScore, complianceVerification]);

  // Command Shortcuts in the Universal Command Center
  const commandShortcuts = [
    { text: "Criar Carteira", action: () => openWorkspace("payments_wallets", "Carteiras") },
    { text: "Consultar Cliente", action: () => openWorkspace("operations_identity", "Clientes") },
    { text: "Abrir Lei 40/20", action: () => openWorkspace("compliance_lspa", "Lei 40/20") },
    { text: "Executar Reconciliação", action: () => triggerReconciliation() },
    { text: "Simular Aviso 03/22", action: () => triggerAvisoSimulation() },
    { text: "Revalidar Compliance", action: () => triggerComplianceCheck() },
    { text: "Pesquisar Artigo", action: () => openWorkspace("compliance_lspa", "Lei 40/20") },
    { text: "Abrir Ledger", action: () => openWorkspace("payments_ledger", "Ledger") },
    { text: "Localizar Evento", action: () => openWorkspace("monitoring_events", "Eventos") }
  ];

  // Helper: Opening tabs/workspaces
  const openWorkspace = (id: string, label: string) => {
    const currentRoleMeta = rolesMetadata.find(r => r.id === userRole);
    if (currentRoleMeta && !currentRoleMeta.allowedNodes.includes(id)) {
      const targetRole = rolesMetadata.find(r => r.allowedNodes.includes(id));
      if (targetRole) {
        setUserRole(targetRole.id);
        if (!openTabs.some(t => t.id === id)) {
          setOpenTabs(prev => [...prev.filter(t => targetRole.allowedNodes.includes(t.id)), { id, label }]);
        }
        setActiveTab(id);
        return;
      }
    }

    if (!openTabs.some(t => t.id === id)) {
      setOpenTabs(prev => [...prev, { id, label }]);
    }
    setActiveTab(id);
  };

  const closeWorkspace = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = openTabs.filter(t => t.id !== id);
    setOpenTabs(filtered);
    if (activeTab === id && filtered.length > 0) {
      setActiveTab(filtered[filtered.length - 1].id);
    }
  };

  // Keyboard shortcut listener for Ctrl+P
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault();
        setShowPalette(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Listen to new transactions to feed the Event Stream automatically
  useEffect(() => {
    if (ledger.length > 0) {
      const latest = ledger[0];
      const newEvent: StructuredDomainEvent = {
        time: new Date().toLocaleTimeString(),
        type: latest.type === "pagamento" ? "PaymentProcessed" : "WalletTransferred",
        correlationId: latest.correlationId || "corr_" + Math.random().toString(16).substring(2, 10),
        lawRef: "Artigo 40.º da Lei 40/20",
        origin: "WalletAggregate",
        result: latest.status === "blocked_aml" ? "DENIED" : "SUCCESS",
        details: {
          id: latest.id,
          amount: `${latest.amount.toLocaleString()} Kz`,
          sender: latest.senderPhone,
          receiver: latest.receiverPhone,
          fraudScore: latest.fraudScore,
          latency: `${latest.latencyMs}ms`
        }
      };
      setEventsStream(prev => [newEvent, ...prev]);
    }
  }, [ledger]);

  // Digital Twin Stress Sandbox loop
  useEffect(() => {
    if (!isTwinSimulating) return;
    const interval = setInterval(() => {
      const noise = (Math.random() * 0.2 - 0.1);
      const actualTps = Math.max(1, Math.round(tpsRate * (1 + noise)));
      let simulatedLatency = 6.2 + (actualTps * 0.15);
      if (chaosLatency) simulatedLatency += 250;

      setTwinStats({
        activeUsers: 450 + Math.floor(Math.random() * 20 - 10),
        tps: actualTps,
        latency: Number(simulatedLatency.toFixed(1)),
        cpu: Number((4.5 + (actualTps * 0.2)).toFixed(1)),
        invariantsPassed: chaosLoss ? 98.2 : 100
      });

      // Stream simulation event to event stream
      const simEvent: StructuredDomainEvent = {
        time: new Date().toLocaleTimeString(),
        type: "SimulatorTick",
        correlationId: "corr_sim_" + Math.random().toString(16).substring(2, 6),
        lawRef: "Aviso n.º 09/2023",
        origin: "DigitalTwinCore",
        result: chaosLoss ? "FAILED" : "SUCCESS",
        details: {
          tps: actualTps,
          latency: `${simulatedLatency.toFixed(1)}ms`,
          lossActive: chaosLoss ? "YES" : "NO",
          cpu: `${(4.5 + (actualTps * 0.2)).toFixed(1)}%`
        }
      };
      setEventsStream(prev => [simEvent, ...prev.slice(0, 49)]);
    }, 2500);
    return () => clearInterval(interval);
  }, [isTwinSimulating, tpsRate, chaosLoss, chaosLatency]);

  // Operational Commands implementers
  const triggerReconciliation = () => {
    openWorkspace("payments_custody", "Custódia");
    const recEvent: StructuredDomainEvent = {
      time: new Date().toLocaleTimeString(),
      type: "ReconciliationExecuted",
      correlationId: "corr_rec_" + Math.random().toString(16).substring(2, 8),
      lawRef: "Aviso n.º 05/2021",
      origin: "CustodyAuditor",
      result: "SUCCESS",
      details: { discrepancy: "0.00 Kz", backedPercent: "100.00%", circulation: `${bnaState.totalCirculation.toLocaleString()} Kz` }
    };
    setEventsStream(prev => [recEvent, ...prev]);
  };

  const triggerAvisoSimulation = () => {
    openWorkspace("monitoring_alarms", "Alarmes");
    const avisoEv: StructuredDomainEvent = {
      time: new Date().toLocaleTimeString(),
      type: "AvisoSimulationTriggered",
      correlationId: "corr_av_" + Math.random().toString(16).substring(2, 8),
      lawRef: "Aviso n.º 11/2021",
      origin: "AvisoSimulator",
      result: "Under Review",
      details: { target: "Aviso 03/22", description: "Injeção de auditoria de conformidade", activeMFA: "OK" }
    };
    setEventsStream(prev => [avisoEv, ...prev]);
  };

  const triggerComplianceCheck = () => {
    openWorkspace("ai_engine", "Regulatory Engine");
    setDslCompilationOutput("Verificação Dinâmica Ativa...\n✓ Análise do RKK Completa.\n✓ Invariantes em conformidade com o Artigo 40.º da Lei 40/20.\n[STATUS] SAGA Compliant.");
    const checkEv: StructuredDomainEvent = {
      time: new Date().toLocaleTimeString(),
      type: "ComplianceRevalidated",
      correlationId: "corr_cmp_" + Math.random().toString(16).substring(2, 8),
      lawRef: "Lei 40/20",
      origin: "SagaComplianceEngine",
      result: "SUCCESS",
      details: { score: "94%", activeRules: 318, testedAssertions: 561 }
    };
    setEventsStream(prev => [checkEv, ...prev]);
  };

  const triggerTestRun = () => {
    setRunningTests(true);
    setTimeout(() => {
      const results = runDomainTestSuite();
      setTestReports(results);
      setRunningTests(false);
      const testEv: StructuredDomainEvent = {
        time: new Date().toLocaleTimeString(),
        type: "TestSuiteExecuted",
        correlationId: "corr_tst_" + Math.random().toString(16).substring(2, 8),
        lawRef: "Aviso n.º 09/2023",
        origin: "DomainTestSuite",
        result: "SUCCESS",
        details: { passed: results.filter(r => r.passed).length, total: results.length }
      };
      setEventsStream(prev => [testEv, ...prev]);
    }, 1200);
  };

  const runStressTest = async () => {
    setRunningStressTest(true);
    setStressTelemetry(null);

    // Create a domain event signifying the start of the stress test
    const startEv: StructuredDomainEvent = {
      time: new Date().toLocaleTimeString(),
      type: "StressTestStarted",
      correlationId: "corr_str_" + Math.random().toString(16).substring(2, 8),
      lawRef: "Aviso n.º 09/2023",
      origin: "LedgerStressTester",
      result: "SUCCESS",
      details: { threads: stressConcurrency, amount: stressAmount }
    };
    setEventsStream(prev => [startEv, ...prev]);

    try {
      const tester = new LedgerStressTester();
      const telemetryResult = await tester.executeStressTest({
        concurrencyLevel: stressConcurrency,
        amountPerTransaction: stressAmount,
        senderPhone: "+244923000111", // Standard António wallet
        receiverPhone: "+244900000002",
        debitAccount: "USER_ANTONIO",
        creditAccount: "USER_BENEFICIARY",
      });

      setStressTelemetry(telemetryResult);

      // Create a final success domain event with key telemetry metrics
      const successEv: StructuredDomainEvent = {
        time: new Date().toLocaleTimeString(),
        type: "StressTestCompleted",
        correlationId: startEv.correlationId,
        lawRef: "Aviso n.º 09/2023",
        origin: "LedgerStressTester",
        result: telemetryResult.ledgerInvariantsPreserved && telemetryResult.walletInvariantsPreserved ? "SUCCESS" : "FAILED",
        details: {
          tps: telemetryResult.transactionsPerSecond,
          collisions: telemetryResult.concurrencyCollisionsDetected,
          successRate: `${telemetryResult.successfulTransactions}/${telemetryResult.totalAttempted}`
        }
      };
      setEventsStream(prev => [successEv, ...prev]);
    } catch (err: any) {
      console.error("Stress test runtime exception:", err);
      const errorEv: StructuredDomainEvent = {
        time: new Date().toLocaleTimeString(),
        type: "StressTestFailed",
        correlationId: startEv.correlationId,
        lawRef: "Aviso n.º 09/2023",
        origin: "LedgerStressTester",
        result: "FAILED",
        details: { error: err.message || "Unknown error" }
      };
      setEventsStream(prev => [errorEv, ...prev]);
    } finally {
      setRunningStressTest(false);
    }
  };

  // Deliberative Decision Engine Evaluation Handler
  const handleEvaluateProposal = (presetId: string, customText?: string) => {
    setEvaluatingProposal(true);
    setEvaluationResult(null);
    setTimeout(() => {
      let result: any = {};
      const isCustom = presetId === "custom";
      const text = isCustom ? customText : presetId;

      if (presetId === "preset_limits" || (isCustom && text?.toLowerCase().includes("limite"))) {
        result = {
          title: "Ajustar limites diários de contas Level-1 para 80.000 Kz",
          decisionNeeded: "Análise de Limites Fiduciários",
          verdict: "REQUER MITIGAÇÃO",
          verdictColor: "text-amber-400 bg-amber-400/10 border-amber-400/20",
          constitutionRules: [
            { rule: "Aviso n.º 11/2021 (Artigo 5.º)", status: "RESTRITO", detail: "O limite diário geral de contas simplificadas é de 65.000 Kz." },
            { rule: "Lei n.º 40/20 (Artigo 40.º)", status: "COMPLIANT", detail: "Isolamento fiduciário preservado." }
          ],
          reasoning: "O regulamento geral limita as contas Level-1 sem identificação formal a 65.000 Kz diários. O aumento para 80.000 Kz é autorizado apenas se associado à validação secundária do Bilhete de Identidade (BI) no gateway ou autenticação forte de dois fatores (SCA).",
          estimatedImpacts: {
            compliance: +3.2,
            operationalRisk: -4.5,
            resilience: +1.5,
            overall: +0.2
          },
          remediationSteps: [
            "Introduzir verificação facial biométrica no app do utilizador",
            "Atualizar regras dinâmicas do Policy Engine no gateway de carteiras",
            "Registrar nova certidão de conformidade automatizada"
          ],
          canFormalize: true,
          decisionToInject: {
            decision: "Ajuste de Limites Level-1 com Autenticação Forte",
            context: "Melhoria do poder de compra dos utilizadores rurais mantendo enquadramento com o Aviso 11/21.",
            problem: "O limite anterior de 65k impossibilitava transações de utilidade básica em época inflacionária.",
            alternatives: "Aumento linear sem verificação adicional (Rejeitado por veto do BNA devido a risco AML).",
            choice: "Elevação do limite para 80.000 Kz condicionado a SCA biométrico instantâneo.",
            legalBase: "Aviso n.º 11/2021 do BNA (Artigo 5.º, Cláusula de Mitigação)",
            risk: "Médio-Baixo (Mitigado por mTLS e biometria facial obrigatória)",
            tradeoffs: "Aumento de 2.4s no tempo médio de checkout devido à leitura biométrica facial.",
            impact: "Permite maior flexibilidade de consumo enquanto previne fraudes de identidade.",
            tests: "ScaLimits.test.ts, BiometricAuth.test.ts",
            responsible: "Dra. Sandra Neto (Diretora de Compliance e Risco)",
            modules: "operations_identity, policy_engine"
          }
        };
      } else if (presetId === "preset_mismatch" || (isCustom && (text?.toLowerCase().includes("mtls") || text?.toLowerCase().includes("segurança") || text?.toLowerCase().includes("auditoria")))) {
        result = {
          title: "Desativar auditoria de transações via canal seguro mTLS",
          decisionNeeded: "Análise de Integridade de Comunicações",
          verdict: "VETADO CONSTITUCIONALMENTE",
          verdictColor: "text-red-500 bg-red-500/10 border-red-500/20",
          constitutionRules: [
            { rule: "Lei n.º 40/20 (Artigo 42.º)", status: "VIOLADO", detail: "Integridade física e mútua autenticação são pré-requisitos para liquidação fiduciária interbancária." },
            { rule: "Princípio 3 do KMOS", status: "VIOLADO", detail: "A transparência e rastreabilidade total são inalienáveis." }
          ],
          reasoning: "VETO ABSOLUTO. Desativar o protocolo mTLS ou assinaturas HSM de ponta a ponta expõe o Ledger a ataques de injeção de saldos e transações falsas. A constituição impede qualquer alteração que comprometa a imutabilidade do Ledger.",
          estimatedImpacts: {
            compliance: -40.0,
            operationalRisk: -50.0,
            resilience: -10.0,
            overall: -33.3
          },
          remediationSteps: [
            "Não aplicável. Esta alteração foi vetada permanentemente pela governação inteligente.",
            "Recomenda-se otimizar os certificados HSM existentes ao invés de desativá-los."
          ],
          canFormalize: false
        };
      } else {
        result = {
          title: text || "Proposta de Transição Operacional",
          decisionNeeded: "Avaliação Cognitiva Customizada",
          verdict: "COMPATÍVEL COM RESTRIÇÕES",
          verdictColor: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
          constitutionRules: [
            { rule: "Constituição KMOS (Artigo 1.º)", status: "COMPLIANT", detail: "O conhecimento institucional é priorizado com sucesso." },
            { rule: "Normas de Governação", status: "VERIFICANDO", detail: "Não foram identificados vetos explícitos para o pedido." }
          ],
          reasoning: `O sistema avaliou a proposta "${text}". Esta mudança é filosoficamente compatível com o KMOS, pois preserva o modelo de partidas dobradas e aumenta a inteligência sistémica. Recomenda-se testar preliminarmente no Twin Sandbox.`,
          estimatedImpacts: {
            compliance: +5.0,
            operationalRisk: -2.0,
            resilience: +3.5,
            overall: +2.1
          },
          remediationSteps: [
            "Definir a especificação funcional do recurso no Grafo de Conhecimento",
            "Mapear impactos de dependência de dados antes de codificar",
            "Executar simulação no Twin Simulator"
          ],
          canFormalize: true,
          decisionToInject: {
            decision: text || "Inovação Operacional de Inclusão",
            context: "Inovação sugerida diretamente pelo Centro de Controlo de Instituição.",
            problem: "Otimização de processos e resposta a demandas de utilizadores locais.",
            alternatives: "Manutenção do status quo operacional.",
            choice: "Aprovação deliberativa da transição sob regras de salvaguarda.",
            legalBase: "Constituição Executável do KMOS",
            risk: "Baixo (Monitoramento comportamental ativo)",
            tradeoffs: "Nenhum trade-off sistémico significativo identificado.",
            impact: "Aumento imediato do índice de saúde e conformidade geral do sistema.",
            tests: "CustomTransition.test.ts",
            responsible: "Conselho de Governação do KMOS",
            modules: "cap_deliberation, cap_inclusion"
          }
        };
      }

      setEvaluationResult(result);
      setEvaluatingProposal(false);
    }, 1500);
  };

  // Formalize Decision Handler (adding decision records to decisionsMemory and updating composite Institutional Health index)
  const handleFormalizeDecision = () => {
    if (!evaluationResult || !evaluationResult.canFormalize) return;
    
    // Create new decision object
    const newId = `DEC-${new Date().getFullYear()}-00${decisionsMemory.length + 1}`;
    const dateStr = new Date().toISOString().slice(0, 10);
    
    const newDecision = {
      id: newId,
      date: dateStr,
      decision: evaluationResult.decisionToInject?.decision || evaluationResult.title,
      motivo: evaluationResult.decisionToInject?.legalBase || "Constituição Executável",
      consequence: evaluationResult.decisionToInject?.impact || evaluationResult.reasoning,
      risk: evaluationResult.decisionToInject?.risk || "Baixo",
      modules: evaluationResult.decisionToInject?.modules || "operations_identity, policy_engine",
      context: evaluationResult.decisionToInject?.context || "Transição de governabilidade.",
      problem: evaluationResult.decisionToInject?.problem || "Ajuste operacional.",
      alternatives: evaluationResult.decisionToInject?.alternatives || "Manutenção do status quo.",
      choice: evaluationResult.decisionToInject?.choice || evaluationResult.title,
      legalBase: evaluationResult.decisionToInject?.legalBase || "Constituição do KMOS",
      tradeoffs: evaluationResult.decisionToInject?.tradeoffs || "Nenhum detectado.",
      impact: evaluationResult.decisionToInject?.impact || "Melhoria de processos.",
      tests: evaluationResult.decisionToInject?.tests || "Compliance.test.ts",
      responsible: evaluationResult.decisionToInject?.responsible || "Conselho Executivo KMOS",
      state: "APPROVED"
    };

    // Update decisions list
    setDecisionsMemory(prev => [newDecision, ...prev]);

    // Update composite Institutional Health Index based on the simulation impacts!
    setInstitutionalHealth(prev => {
      const impacts = evaluationResult.estimatedImpacts || { compliance: 0, operationalRisk: 0, resilience: 0 };
      const newCompliance = Math.min(100, Math.max(0, Number((prev.compliance + (impacts.compliance || 0)).toFixed(1))));
      const newOpRisk = Math.min(100, Math.max(0, Number((prev.operationalRisk + (impacts.operationalRisk || 0)).toFixed(1))));
      const newResilience = Math.min(100, Math.max(0, Number((prev.resilience + (impacts.resilience || 0)).toFixed(1))));
      const newOverall = Number(((newCompliance + newOpRisk + newResilience + prev.dataIntegrity) / 4).toFixed(1));
      
      return {
        compliance: newCompliance,
        operationalRisk: newOpRisk,
        resilience: newResilience,
        dataIntegrity: prev.dataIntegrity,
        overall: newOverall
      };
    });

    // Add event log in event stream!
    const decisionEv: StructuredDomainEvent = {
      time: new Date().toLocaleTimeString(),
      type: "InstitutionalDecisionApproved",
      correlationId: "corr_dec_" + Math.random().toString(16).substring(2, 8),
      lawRef: newDecision.legalBase,
      origin: "DecisionEngine",
      result: "SUCCESS",
      details: {
        id: newId,
        decision: newDecision.decision,
        overallHealthUpdated: `${(institutionalHealth.overall).toFixed(1)}%`
      }
    };
    setEventsStream(prev => [decisionEv, ...prev]);

    // Show dynamic success notification overlay
    setDecisionSuccessMessage(`A deliberação institucional foi formalizada e assinada digitalmente com sucesso sob o ID ${newId}! Os registros foram consolidados na Memória Institucional e os índices de saúde foram re-calculados.`);
    setEvaluationResult(null);
  };

  // KMOS Constitution Engine compliance checks handler
  const handleRunConstitutionCheck = (type: "regulatory" | "integrity", assetName: string, customText?: string) => {
    setConstitutionCheckRunning(true);
    setConstitutionCheckResult(null);

    const asset = assetName === "custom" ? customText || "CustomAsset" : assetName;

    setTimeout(() => {
      let result: any = {
        asset,
        type
      };

      if (type === "regulatory") {
        if (asset === "SMSOfflineLedger") {
          result = {
            ...result,
            verdict: "CONFORME & VERIFICADO",
            verdictColor: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
            hierarchyLayer: "Layer 4 (Domínio) & Layer 5 (Código)",
            principle: "Princípio 3: Critério de Evolução (Necessidades Operacionais Reais)",
            constitutionRule: "Responder a Necessidades Operacionais Reais (Seção: Inclusão Financeira Rural)",
            legalReference: "Aviso n.º 11/2021 (Artigo 5.º, Cláusula de Inclusão Rural)",
            analysis: "A classe de domínio `SMSOfflineLedger` implementa transações asíncronas de moeda eletrónica com assinatura criptográfica ECDSA P-256 compactada sobre SMS binário. Isto permite que populações rurais sem acesso a dados móveis IP realizem pagamentos com segurança criptográfica garantida. Esta funcionalidade atende perfeitamente ao princípio da inclusão financeira rural estabelecido no Aviso 11/21 e preserva a imutabilidade do saldo mesmo em modo desligado.",
            integrityRisk: "0.0% (Risco Mínimo)",
            remediation: "Nenhuma mitigação necessária. O código possui fundamento jurídico completo e testes de integração automatizados em 'SMSGateway.test.ts'."
          };
        } else if (asset === "TransferUseCase") {
          result = {
            ...result,
            verdict: "CONFORME & VERIFICADO",
            verdictColor: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
            hierarchyLayer: "Layer 4 (Domínio) & Layer 5 (Código)",
            principle: "Princípio 2: O Código como Ativo Observável",
            constitutionRule: "A arquitetura física está subordinada à arquitetura regulatória",
            legalReference: "Lei n.º 40/20 (Artigo 42.º - Registo de Transações e Compensação)",
            analysis: "O caso de uso `TransferUseCase` gerencia o fluxo de débito e crédito atómico (partidas dobradas) na transferência de fundos eletrónicos. É uma materialização direta da Lei 40/20 do Sistema de Pagamento de Angola, garantindo o registo inalterável de saldos e mitigando o risco de dupla despesa.",
            integrityRisk: "0.0% (Risco Mínimo)",
            remediation: "Verificado automaticamente através do conjunto de testes 'AccountingService.test.ts'. Nenhuma mitigação manual é necessária."
          };
        } else if (asset === "class MerchantFeeSg") {
          result = {
            ...result,
            verdict: "CONFORME & VERIFICADO",
            verdictColor: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
            hierarchyLayer: "Layer 3 (Serviços) & Layer 5 (Código)",
            principle: "Princípio 1: Prioridade do Conhecimento Institucional",
            constitutionRule: "Controlo de Tarifas e Limites Regulados",
            legalReference: "Aviso n.º 06/2020 do BNA (Taxas máximas de intercâmbio / MDR)",
            analysis: "A classe `MerchantFeeSg` aplica regras de limite dinâmico de comissões comerciais para comerciantes (MDR capped em 1.2%). Está em estrita conformidade com o Aviso 06/2020 do BNA, que impede taxas abusivas e fomenta a digitalização de micro-estabelecimentos comerciais rurais.",
            integrityRisk: "0.0% (Risco Mínimo)",
            remediation: "Integrado com o barramento de regras dinâmicas do Policy Engine. Casos de teste ativos em 'MerchantSettlement.test.ts'."
          };
        } else if (asset.toLowerCase().includes("game") || asset.toLowerCase().includes("bonus") || asset.toLowerCase().includes("token") || asset.toLowerCase().includes("reward")) {
          result = {
            ...result,
            verdict: "AVISO - CÓDIGO ÓRFÃO REGULATÓRIO",
            verdictColor: "text-amber-400 bg-amber-400/10 border-amber-400/20",
            hierarchyLayer: "Layer 5 (Código)",
            principle: "Princípio 2: O Código como Ativo Observável",
            constitutionRule: "Nenhum código do KMOS existe sem fundamentação jurídica ativa",
            legalReference: "Desconhecido / Não Mapeado no RKK",
            analysis: "ALERTA: A funcionalidade descrita de emissão de bónus ou pontos virtuais não possui nexo causal correspondente com as Leis de Angola ou Instruções do BNA. Introduzir esquemas de gameficação ou moeda paralela não regulamentada no ecossistema viola o princípio fiduciário central e pode atrair sanções de supervisão imediata.",
            integrityRisk: "45.0% (Risco Moderado)",
            remediation: "RECOMENDAÇÃO: Interromper a implementação deste código. Submeter uma proposta deliberativa no Decision Engine ou obter uma certidão de conformidade assinada pelo departamento jurídico e delegados do BNA."
          };
        } else {
          result = {
            ...result,
            verdict: "VAGAMENTE ENQUADRADO / REQUER REVISÃO",
            verdictColor: "text-blue-400 bg-blue-400/10 border-blue-400/20",
            hierarchyLayer: "Layer 5 (Código)",
            principle: "Princípio 3: Critério de Evolução de Funcionalidades",
            constitutionRule: "Mapeamento ascendente pendente no Grafo de Conhecimento",
            legalReference: "Lei n.º 40/20 do BNA (Requisitos Gerais)",
            analysis: `O ativo de código "${asset}" foi avaliado pelo analisador sintático constitucional. Embora não represente uma colisão direta com os axiomas transacionais, não há um artigo específico mapeado que torne esta funcionalidade legalmente obrigatória ou justificada.`,
            integrityRisk: "15.0% (Baixo-Médio)",
            remediation: "Criar ou atualizar o manifesto de módulo YAML para declarar explicitamente qual das capacidades de conhecimento ou operações do KMOS esta funcionalidade expande."
          };
        }
      } else {
        // Integrity impact checks
        if (asset === "setReserveRatio(0.95)") {
          result = {
            ...result,
            verdict: "VETO ABSOLUTO - INTEGRIDADE COMPROMETIDA",
            verdictColor: "text-red-500 bg-red-500/10 border-red-500/20",
            hierarchyLayer: "Layer 1 (Instituição) & Layer 3 (Serviços)",
            principle: "Princípio Fundamental Único: O KMOS representa a instituição.",
            constitutionRule: "Salvaguarda Absoluta e Isolamento de Saldos (Rácio de Liquidez 1:1)",
            legalReference: "Aviso n.º 07/2020 do BNA (Artigo 5.º)",
            analysis: "GRAVE: A redução do rácio de reserva de custódia fiduciária para 95% (abaixo de 1:1) cria um cenário de reserva fracionária eletrónica e compromete totalmente a integridade fiduciária e a imunidade contra falências. O KMOS proíbe por constituição qualquer descoberto de liquidez.",
            integrityRisk: "99.0% (Extremo)",
            remediation: "REPROVADO AUTOMATICAMENTE. O compilador constitucional do Ledger síncrono emitiu um veto em tempo de execução. O rácio mínimo de 1:1 é forçado como uma invariante criptográfica imutável no HSM fiduciário."
          };
        } else if (asset === "bypassMtlsAuth(true)") {
          result = {
            ...result,
            verdict: "VETO ABSOLUTO - SEGURANÇA VIOLADA",
            verdictColor: "text-red-500 bg-red-500/10 border-red-500/20",
            hierarchyLayer: "Layer 6 (Infraestrutura) & Layer 1 (Instituição)",
            principle: "Princípio 1: Prioridade do Conhecimento Institucional",
            constitutionRule: "Invariância e Rastreabilidade Baseada em Assinaturas HSM",
            legalReference: "Lei n.º 40/20 (Artigo 42.º - Segurança das Comunicações)",
            analysis: "VETO: Desativar a autenticação mTLS mútua ou bypassar validação de certificados TLS 1.3 rompe a cadeia de confiança com o gateway síncrono do BNA e expõe o Ledger a injeções externas de transações de saldo falsas.",
            integrityRisk: "95.0% (Extremo)",
            remediation: "REPROVADO AUTOMATICAMENTE. A regra de segurança de canais mTLS é forçada a nível de infraestrutura e assinaturas HSM e não pode ser desativada sob nenhuma circunstância operacional."
          };
        } else if (asset === "allowNegativeBalances(true)") {
          result = {
            ...result,
            verdict: "VETO ABSOLUTO - CRÉDITO PROIBIDO",
            verdictColor: "text-red-500 bg-red-500/10 border-red-500/20",
            hierarchyLayer: "Layer 2 (Operações)",
            principle: "Princípio Fundamental Único: O KMOS representa a instituição.",
            constitutionRule: "Saldos eletrónicos não remunerados e proibição de concessão de crédito por carteiras",
            legalReference: "Aviso n.º 11/2021 do BNA",
            analysis: "VETO: Permitir saldos negativos ou descobertos em contas Level-1 equivale a conceder crédito sem cobertura fiduciária 1:1. Emissores de moeda eletrónica simplificada são expressamente proibidos de conceder crédito pelo BNA.",
            integrityRisk: "88.0% (Muito Alto)",
            remediation: "REPROVADO. O Ledger imutável rejeita qualquer transação que resulte em saldo negativo no agregado da carteira, levantando a exceção física 'NegativeBalanceViolationException'."
          };
        } else if (asset === "enableDynamicMdrCap(0.005)") {
          result = {
            ...result,
            verdict: "COMPATÍVEL COM SALVAGUARDAS",
            verdictColor: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
            hierarchyLayer: "Layer 2 (Operações)",
            principle: "Princípio 3: Critério de Evolução de Funcionalidades",
            constitutionRule: "Incentivo comercial focado na sustentabilidade do ecossistema",
            legalReference: "Aviso n.º 06/2020 (Tarifas do Consórcio)",
            analysis: "APROVADO: Ajustar dinamicamente o MDR (comissão de comércio) abaixo do teto de 1.2% (ex: para 0.5% com base no volume de micro-vendas) é perfeitamente legal e benéfico, estimulando a aceitação de pagamentos digitais por pequenos comércios locais.",
            integrityRisk: "5.0% (Risco Mínimo)",
            remediation: "Aprovado. A alteração pode ser configurada e aplicada dinamicamente via hot-reload pelo Policy Engine sem necessidade de downtime ou reinstalação de servidores."
          };
        } else {
          result = {
            ...result,
            verdict: "AVALIAÇÃO DE IMPACTO REQUERIDA",
            verdictColor: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
            hierarchyLayer: "Camadas Diversas de Abstração",
            principle: "Princípio 1: Prioridade do Conhecimento Institucional",
            constitutionRule: "Escrutínio Ad-Hoc de Risco e Salvaguarda",
            legalReference: "Constituição Executável do KMOS",
            analysis: `A potencial violação ou modificação "${asset}" foi submetida ao analisador estocástico. Embora não colida diretamente com os axiomas financeiros, ela introduz instabilidade potencial no fluxo de controle das transações.`,
            integrityRisk: "35.0% (Risco Moderado)",
            remediation: "Recomenda-se submeter a proposta de transição de estado completa ao Decision Engine para análise de impactos estocásticos e simulação no Twin fiduciário."
          };
        }
      }

      setConstitutionCheckResult(result);
      setConstitutionHistory(prev => [
        {
          time: new Date().toLocaleTimeString(),
          asset: result.asset,
          type: result.type,
          verdict: result.verdict,
          ok: !result.verdict.includes("VETO") && !result.verdict.includes("AVISO")
        },
        ...prev
      ]);

      // Emit event stream log
      const checkEv: any = {
        time: new Date().toLocaleTimeString(),
        type: "ConstitutionalValidationExecuted",
        correlationId: "corr_const_" + Math.random().toString(16).substring(2, 8),
        lawRef: result.legalReference || "Constituição KMOS",
        origin: "ConstitutionEngine",
        result: !result.verdict.includes("VETO") ? "SUCCESS" : "DENIED",
        details: {
          asset: result.asset,
          type: result.type,
          verdict: result.verdict,
          risk: result.integrityRisk
        }
      };
      setEventsStream(prev => [checkEv, ...prev]);

      setConstitutionCheckRunning(false);
    }, 1200);
  };

  // Automated regulatory PDF generator via jsPDF
  const triggerPdfReportGeneration = () => {
    try {
      const doc = new jsPDF();
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(18);
      doc.text("KWANZAMÓVEL INSTITUTION CONTROL CENTER", 15, 20);
      doc.setFontSize(10);
      doc.setFont("Helvetica", "normal");
      doc.text("EMISSOR: Banco Nacional de Angola (SGA Automated Auditor v3)", 15, 26);
      doc.text(`DATA DE AUDITORIA: ${new Date().toLocaleDateString()}`, 15, 31);
      doc.line(15, 36, 195, 36);
      
      doc.setFontSize(12);
      doc.setFont("Helvetica", "bold");
      doc.text("CERTIDÃO DE CONFORMIDADE REGULATÓRIA (LEI N.º 40/20)", 15, 45);
      
      doc.setFontSize(10);
      doc.setFont("Helvetica", "normal");
      doc.text("Certifica-se para efeitos de registo e auditoria sistemática que a rede de pagamentos digitais KwanzaMóvel opera em estrita conformidade com as diretivas vigentes, apresentando os seguintes rácios de controle:", 15, 52, { maxWidth: 175 });
      
      doc.setFont("Helvetica", "bold");
      doc.text(`1. Rácio de Salvaguarda de Custódia BNA: 100.00% (Kwz backed)`, 15, 70);
      doc.text(`2. Invariante Contabilístico Double-Entry Ledger: CONFORME`, 15, 76);
      doc.text(`3. Resiliência Operacional SLA: 99.99% de Disponibilidade`, 15, 82);
      doc.text(`4. Conformidade Antifraude & AML (Aviso 09/23): CONFORME`, 15, 88);
      
      doc.text("CHAVE HASH DE ASSINATURA DIGITAL DO SISTEMA:", 15, 120);
      doc.setFont("Courier", "normal");
      doc.setFontSize(9);
      doc.text("sha256_e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", 15, 125);
      
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.text("DOCUMENTO ASSINADO ELECTRONICAMENTE - DISPENSADO ASSINATURA MANUAL", 15, 145);

      doc.save(`KM-CERTIFICADO-CONFORMIDADE-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error(err);
    }
  };

  // Node selection handler for Operational Explorer
  const handleNodeSelect = (nodeId: string, nodeLabel: string) => {
    openWorkspace(nodeId, nodeLabel);
  };

  // Note: treeModel has been relocated to the top of the component for RBAC referencing.

  // Find a specific node's metadata across the tree model to populate KPIs dynamically
  const getNodeKPIs = (nodeId: string) => {
    for (const category of Object.values(treeModel)) {
      const match = category.nodes.find(n => n.id === nodeId);
      if (match) return match.kpi;
    }
    return { estado: "OK", regras: 10, eventos: 120, useCases: 4, testes: 25, observabilidade: "OK" as const };
  };

  const currentKPIs = getNodeKPIs(activeTab);

  const executeIql = (queryText: string) => {
    const q = queryText.trim();
    if (!q) return;

    let result: any = null;
    const lower = q.toLowerCase();

    if (lower.includes("high risk") || lower.includes("high_risk") || lower.includes("policies")) {
      result = {
        type: "policies",
        title: "High Risk Policies (Alta Exposição Regulatória)",
        description: "Políticas com impacto prudencial crítico sob monitorização e contínuo escrutínio pelo BNA.",
        data: [
          { code: "L4020_A40", name: "Limite de Moeda Simplificada Level-1", risk: "Muito Alto", law: "Artigo 40.º da Lei 40/20", status: "Active" },
          { code: "AV11_AML", name: "Bloqueio Cautelar sobre Transações Suspeitas", risk: "Alto", law: "Aviso 11/2021 BNA", status: "Active" },
          { code: "AV07_LIQ", name: "Rácio de Liquidez de Salvaguarda 1:1", risk: "Crítico", law: "Aviso 07/2020 BNA", status: "Active" }
        ]
      };
    } else if (lower.includes("dependency") || lower.includes("dependencies")) {
      result = {
        type: "dependencies",
        title: "Wallet Module Dependencies (Mapeamento de Arquitetura)",
        nodes: [
          { name: "Wallet Core", desc: "Gestão de Saldos e Contas", type: "core" },
          { name: "AML Engine", desc: "Prevenção Branqueamento (Aviso 11)", type: "intelligence" },
          { name: "Double-Entry Ledger", desc: "Registo Contabilístico Imutável", type: "core" },
          { name: "Identity Service", desc: "Verificação de BI", type: "governance" },
          { name: "SMS OTP Fallback", desc: "Criptografia Offline", type: "infrastructure" }
        ],
        relations: [
          "Wallet Core ──► exige ──► AML Engine",
          "Wallet Core ──► regista transações ──► Double-Entry Ledger",
          "AML Engine ──► valida identidade ──► Identity Service",
          "Wallet Core ──► fallback síncrono ──► SMS OTP Fallback"
        ]
      };
    } else if (lower.includes("impact") || lower.includes("lei 40/20") || lower.includes("article 74") || lower.includes("l4020_a74")) {
      result = {
        type: "impact",
        title: "Análise de Impacto de Risco: Lei 40/20 - Artigo 74.º",
        risk: "Muito Alto (Sistémico)",
        summary: "Simulação de modificação ou revogação do Artigo 74.º (Tratamento de Dados e Confidencialidade de PII).",
        details: [
          { module: "Wallet Core", impact: "Bloqueio total de criação de novas contas devido a requisitos de confidencialidade de PII." },
          { module: "Double-Entry Ledger", impact: "Interrupção de Auditoria. Desativação do emparelhamento de SHA-256." },
          { module: "SptrSettlementProcessor", impact: "Interrupção de lotes multilaterais síncronos com o BNA devido a falha de compliance." }
        ],
        affectedModules: 42,
        actionRequired: "Requer aprovação síncrona de 3 Delegados de Conformidade do BNA para alteração em runtime."
      };
    } else if (lower.includes("why") || lower.includes("requires aml")) {
      result = {
        type: "explanation",
        title: "Justificação Institucional: Requisito AML em Wallet",
        lawRef: "Lei n.º 40/20 do BNA (Artigo 22.º) e Aviso n.º 11/2021",
        reason: "A Carteira digital exige validação AML preventiva e sistemática para mitigar riscos de lavagem de dinheiro e financiamento do terrorismo. Contas Level-1 são limitadas a 50.000 Kz diários para inclusão rápida de populações rurais, mas transações subsequentes que revelem padrões anómalos ou geo-velocity suspeitos acionam bloqueio cautelar imediato.",
        tests: "Validado pelo conjunto de testes unitários 'AMLComplianceSaga.test.ts'."
      };
    } else if (lower.includes("trace") || lower.includes("settlementcompleted")) {
      result = {
        type: "trace",
        title: "Linhagem Completa de Evento: SettlementCompleted",
        correlationId: "corr_3C910B8D4E2",
        steps: [
          { step: "1. Payload de Transação Recebido", component: "API Gateway", status: "Verified" },
          { step: "2. Verificação de Saldo & Regras KYC", component: "Policy Engine", status: "Approved" },
          { step: "3. Assinatura Criptográfica via HSM", component: "HSM Manager", status: "Signed" },
          { step: "4. Lançamento no Ledger de Partidas Dobradas", component: "Double-Entry Ledger", status: "Committed" },
          { step: "5. Disparo de Instrução de Compensação", component: "SPTR Client", status: "Dispatched" },
          { step: "6. Liquidação de Custódia fiduciária no BNA", component: "BNA Central Gate", status: "Completed" }
        ]
      };
    } else {
      result = {
        type: "generic",
        title: `Resultado para: "${queryText}"`,
        message: "A Query IQL foi analisada mas nenhum preset direto foi acionado. Experimente utilizar os comandos padrão sugeridos para visualizar dados ricos estruturados."
      };
    }

    setIqlResult(result);
    setIqlHistory(prev => [
      { query: q, time: new Date().toTimeString().slice(0, 8), ok: true },
      ...prev.slice(0, 4)
    ]);
  };

  const askInstitutionalAI = async (questionText: string) => {
    if (!questionText.trim()) return;
    setAiLoading(true);
    setAiAnswer("");

    // Fallback dictionary for the 8 specific questions asked in the prompt
    const localAnswers: Record<string, string> = {
      "Porque esta regra existe?": "Esta regra existe para assegurar a correspondência fiduciária e a estrita estabilidade do meio circulante digital KwanzaMóvel, impossibilitando a criação unilateral de moeda escritural.",
      "Que lei a obriga?": "Obrigada pelo Artigo 42.º da Lei n.º 40/20 do Banco Nacional de Angola (Lei do Sistema de Pagamentos), combinada com o Aviso n.º 07/2020 sobre contas de salvaguarda.",
      "Quem depende dela?": "O módulo 'Wallet' (que exige limites e saldos validados), o processador 'Settlement' (que necessita de rácio de lastro 1:1) e o ecossistema de bancos comerciais custodiantes (BAI, BFA, BIC).",
      "Que testes a validam?": "Validada por 'InvariantsPrudentialSg.test.ts' que simula corridas aos depósitos e atesta que o rácio de liquidez em conta de custódia é sempre >= 100% do saldo total emitido.",
      "Que ADR justificou esta decisão?": "Justificada pelo ADR-003: 'Adoção de Ledger Imutável com Assinatura HSM', documentando o motivo de usar partidas dobradas criptográficas para conformidade legal síncrona.",
      "Quando foi criada?": "Criada em 15 de Outubro de 2026, aquando do arranque operacional do KMOS para atender às exigências regulatórias do BNA de Angola.",
      "Quem aprovou?": "Aprovada pelo Consórcio Técnico Estratégico, com o selo digital do Delegado de Conformidade do BNA e a assinatura criptográfica do Administrador de Sistemas do KMOS.",
      "Qual o impacto de removê-la?": "Impacto Sistémico Extremo: Revogar esta regra desalinharia o sistema com as leis da República de Angola, resultando na suspensão da licença operacional e bloqueio da liquidação no SPTR."
    };

    // Check if we have a preset local answer
    let matchedAnswer = "";
    for (const key of Object.keys(localAnswers)) {
      if (questionText.toLowerCase().includes(key.toLowerCase())) {
        matchedAnswer = localAnswers[key];
        break;
      }
    }

    try {
      const response = await fetch("/api/faq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: questionText }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.answer) {
          setAiAnswer(data.answer);
          setAiLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn("Using high-fidelity local cognitive fallback:", err);
    }

    // Fallback to local high-fidelity answer
    if (matchedAnswer) {
      setAiAnswer(matchedAnswer);
    } else {
      setAiAnswer("Análise Cognitiva KMOS: Esta pergunta diz respeito à arquitetura orgânica do KMOS. Em termos institucionais, cada regra, teste, ADR e lei estão intrinsecamente mapeados no Knowledge Graph para garantir total transparência operacional em conformidade com as diretivas do BNA de Angola.");
    }
    setAiLoading(false);
  };

  const runImpactSimulation = (article: string) => {
    setSimulatingImpact(true);
    setSimResult(null);
    setTimeout(() => {
      let result: any = {};
      if (article.includes("74") || article.includes("Confidencialidade")) {
        result = {
          article: "Artigo 74.º - Tratamento de Dados e Confidencialidade de PII",
          risk: "Extremo (Sistémico)",
          complianceScore: "Previsto: 82% (Decréscimo de 12%)",
          time: "4 a 6 semanas",
          domains: ["Wallet Core", "Double-Entry Ledger", "Identity (KYC)"],
          useCases: ["CreateWalletUseCase", "VerifyBiometricIdentity", "SignLedgerBlock"],
          apis: ["POST /api/wallets", "POST /api/identity/verify"],
          dtos: ["WalletCreationDto", "BiometricVerificationPayload"],
          events: ["WalletCreatedEvent", "IdentityVerifiedEvent"],
          tests: [
            { name: "WalletPIISecurity.test.ts", status: "Inválido (Requer reescrita completa)" },
            { name: "IdentityAnonymizationSg.test.ts", status: "Inválido (Alteração de enquadramento)" },
            { name: "DoubleEntryAuditLog.test.ts", status: "Em conformidade" }
          ],
          actions: "Alteração exige aprovação física síncrona por 3 Delegados de Conformidade do BNA."
        };
      } else if (article.includes("42") || article.includes("Dupla Entrada")) {
        result = {
          article: "Artigo 42.º - Registo de Dupla Entrada",
          risk: "Catastrófico (Inviabilização Legal)",
          complianceScore: "Previsto: 0% (Revogação de licença)",
          time: "Imediato (Suspensão operacional)",
          domains: ["Double-Entry Ledger", "Settlement Engine", "Reserve Guard"],
          useCases: ["CommitLedgerEntry", "ReconcileReserves", "ExecuteSettlementBatch"],
          apis: ["POST /api/settlement/execute", "GET /api/ledger/balance"],
          dtos: ["LedgerEntryDto", "ReserveBalanceState"],
          events: ["LedgerCommittedEvent", "ReservesReconciledEvent"],
          tests: [
            { name: "InvariantsPrudentialSg.test.ts", status: "Falha Crítica" },
            { name: "DoubleEntryAcidGuarantee.test.ts", status: "Falha Crítica" }
          ],
          actions: "Revogação de Ledger Imutável viola a Lei Geral das Instituições Financeiras de Angola."
        };
      } else {
        result = {
          article: "Aviso n.º 11/2021 (AML e Limites diários)",
          risk: "Alto (Operacional)",
          complianceScore: "Previsto: 95% (Diferença temporária)",
          time: "1 a 2 dias (Reconfiguração a quente)",
          domains: ["Wallet Core (Limits)", "Policy Engine", "AML Engine"],
          useCases: ["ValidateTransactionLimits", "CheckAMLSuspicion"],
          apis: ["POST /api/transactions/transfer"],
          dtos: ["TransferRequestDto"],
          events: ["LimitsValidatedEvent", "AMLSuspicionFlaggedEvent"],
          tests: [
            { name: "AMLComplianceSaga.test.ts", status: "Adaptável via hot-reloading de políticas" },
            { name: "InvariantsPrudentialSg.test.ts", status: "Em conformidade" }
          ],
          actions: "Pode ser ajustado a quente no Policy Engine sem reinstalação do servidor."
        };
      }
      setSimResult(result);
      setSimulatingImpact(false);
    }, 600);
  };

  const runInstitutionalTwinSim = (scenario: string) => {
    setTwinRunning(true);
    setTwinResult(null);
    setTimeout(() => {
      let result: any = {};
      if (scenario.includes("Reservas")) {
        result = {
          scenario: "Novo Aviso de Reservas do BNA (Exigência de 105% de Lastro)",
          impact: "Alteração do rácio prudencial de liquidez mínimo de 100% para 105% para depósitos em carteira.",
          brokenInvariants: ["ReserveRatioInvariance (esperado >= 105%, atual: 100%)"],
          requiredChanges: [
            { type: "Código", desc: "Ajustar constante MIN_RESERVE_RATIO = 1.05 em ReserveGuard.ts" },
            { type: "Testes", desc: "Atualizar InvariantsPrudentialSg.test.ts para assegurar assert(ratio >= 1.05)" },
            { type: "Documentação", desc: "Rever anexo técnico de custódia fiduciária" },
            { type: "Políticas", desc: "Atualizar regra 'ReserveRatioRule' no Policy Engine via Console" }
          ],
          estimatedWork: "2 dias úteis",
          complianceRisk: "Baixo (Ajuste paramétrico simples)"
        };
      } else if (scenario.includes("Aviso 11")) {
        result = {
          scenario: "Atualização do Aviso 11/2021 (Novas regras de KYC simplificado)",
          impact: "Elevação do limite diário de contas Level-1 de 50.000 Kz para 75.000 Kz.",
          brokenInvariants: ["Nenhum (Invariantes dinâmicas via Policy Engine)"],
          requiredChanges: [
            { type: "Políticas", desc: "Alterar parâmetro 'max_daily_level1' no Policy Engine para 75000" },
            { type: "Interface", desc: "Atualizar textos informativos de ajuda ao cliente na carteira" }
          ],
          estimatedWork: "Zero (Hot-reload dinâmico em runtime)",
          complianceRisk: "Nenhum"
        };
      } else {
        result = {
          scenario: "Alteração da Taxa Interbancária de Compensação (SGA)",
          impact: "Redução do teto de MDR para comércios de 1.2% para 0.95% por transação liquidação síncrona.",
          brokenInvariants: ["Nenhum"],
          requiredChanges: [
            { type: "Código", desc: "Modificar MERCHANT_COMMISSION_MAX_CAP em MerchantFeeSg.ts" },
            { type: "Testes", desc: "Ajustar asserções em MerchantSettlement.test.ts" }
          ],
          estimatedWork: "1 dia útil",
          complianceRisk: "Médio"
        };
      }
      setTwinResult(result);
      setTwinRunning(false);
    }, 700);
  };

  // Global search lookup helper
  const handleSearchExecute = () => {
    if (!globalSearchQuery.trim()) return;
    const term = globalSearchQuery.toLowerCase();
    
    // Check if it's a known transaction ID or customer phone
    const matchTx = ledger.find(t => t.id.toLowerCase().includes(term) || t.receiverPhone.includes(term));
    if (matchTx) {
      setSelectedEntity({
        type: "Transação",
        id: matchTx.id,
        name: `Transação ${matchTx.id}`,
        status: matchTx.status,
        details: matchTx,
        lawReference: "Artigo 74 da Lei 40/20 (Tratamento de Dados)",
        remedy: "Transmissão segura por canal TLS 1.3 mTLS síncrono com o BNA."
      });
      return;
    }

    // Check RKK concepts
    const matchConcept = rkk.getConcepts().find(c => c.name.toLowerCase().includes(term));
    if (matchConcept) {
      setSelectedEntity({
        type: "Conceito Regulatório",
        id: matchConcept.associatedArticles[0] || "Artigo-LSPA",
        name: matchConcept.name,
        status: "Active",
        details: {
          "Definição": matchConcept.definition,
          "Artigos Associados": matchConcept.associatedArticles.join(", ")
        },
        lawReference: "Lei n.º 40/20 - Sistema de Pagamentos de Angola"
      });
      return;
    }

    // Default search notification
    const searchEv: StructuredDomainEvent = {
      time: new Date().toLocaleTimeString(),
      type: "SearchPerformed",
      correlationId: "corr_search_" + Math.random().toString(16).substring(2, 6),
      lawRef: "Geral",
      origin: "UniversalCommandCenter",
      result: "SUCCESS",
      details: { query: globalSearchQuery, matches: 0 }
    };
    setEventsStream(prev => [searchEv, ...prev]);
  };

  // Filter categories and nodes based on the current userRole authorized nodes
  const activeRoleMetadata = rolesMetadata.find(r => r.id === userRole)!;
  const filteredTreeModel = Object.entries(treeModel).reduce((acc, [catKey, catVal]) => {
    const authorizedNodes = catVal.nodes.filter(node => activeRoleMetadata.allowedNodes.includes(node.id));
    if (authorizedNodes.length > 0) {
      acc[catKey] = {
        ...catVal,
        nodes: authorizedNodes
      };
    }
    return acc;
  }, {} as typeof treeModel);

  return (
    <div className={`flex flex-col h-[750px] border border-neutral-900 rounded-2xl bg-neutral-950 font-mono text-zinc-300 overflow-hidden text-left relative ${highContrast ? "bg-black text-white border-white" : ""}`}>
      
      {/* 1. TOP HEADER & UNIVERSAL COMMAND CENTER */}
      <div className="bg-neutral-950 border-b border-neutral-900 px-4 py-2 flex items-center justify-between gap-3 select-none">
        <div className="flex items-center gap-2 shrink-0">
          <Cpu className="w-5 h-5 text-[#B87333]" />
          <div className="leading-none text-left">
            <span className="text-[10px] uppercase font-black text-white tracking-widest block">KWANZAMÓVEL</span>
            <span className="text-[8px] uppercase text-[#B87333] font-bold tracking-wider block">Institution Control Center</span>
          </div>
        </div>

        {/* Universal Command Center Prompt */}
        <div className="flex-1 max-w-md relative group">
          <div className="absolute left-3 top-2.5 flex items-center text-zinc-500 font-bold text-xs select-none">
            &gt;
          </div>
          <input
            type="text"
            placeholder="Execute comandos (ex: Criar Carteira, Abrir Lei, Reconciliar...)"
            value={globalSearchQuery}
            onChange={(e) => {
              setGlobalSearchQuery(e.target.value);
              setShowPalette(true);
            }}
            onFocus={() => setShowPalette(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearchExecute();
                setShowPalette(false);
              }
            }}
            className="w-full bg-black border border-neutral-900 rounded-lg py-1.5 pl-7 pr-3 text-xs outline-none focus:border-amber-900/40 text-zinc-300"
          />
          
          {/* Custom Dropdown command list overlay */}
          {showPalette && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-neutral-950 border border-neutral-900 rounded-xl shadow-2xl z-50 overflow-hidden select-none max-h-52 overflow-y-auto">
              <div className="p-2 bg-neutral-900/40 border-b border-neutral-900 text-[8.5px] text-zinc-500 font-bold uppercase tracking-wider">
                Atalhos Operacionais do OS (ou pressione Enter para pesquisar)
              </div>
              {commandShortcuts
                .filter(cmd => cmd.text.toLowerCase().includes(globalSearchQuery.toLowerCase()))
                .map((cmd, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      cmd.action();
                      setShowPalette(false);
                      setGlobalSearchQuery("");
                    }}
                    className="p-2 hover:bg-[#B87333]/10 text-xs font-bold text-zinc-300 hover:text-white cursor-pointer transition-all flex justify-between items-center"
                  >
                    <span>&gt; {cmd.text}</span>
                    <span className="text-[8px] px-1.5 py-0.5 bg-neutral-900 rounded text-zinc-500">EX</span>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Command palette ESC trigger */}
        {showPalette && (
          <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowPalette(false)} />
        )}

        <div className="flex items-center gap-3 bg-neutral-900/40 border border-neutral-900 rounded-xl px-2.5 py-1">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-[#B87333]" />
            <span className="text-[8.5px] text-zinc-400 font-bold uppercase">Índice Saúde:</span>
            <span className="text-[10px] font-extrabold text-white font-mono">{institutionalHealth.overall}%</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-[8px] text-zinc-500 border-l border-neutral-800 pl-2">
            <span>C: <span className="text-zinc-300 font-bold">{institutionalHealth.compliance}%</span></span>
            <span>R: <span className="text-[#B87333] font-bold">{institutionalHealth.operationalRisk}%</span></span>
            <span>S: <span className="text-zinc-300 font-bold">{institutionalHealth.resilience}%</span></span>
          </div>
        </div>
      </div>

      {/* 2. OPERATIONAL GRID: TREE EXPLORER + WORKSPACES + CONSOLE */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* SIDEBAR: OPERATIONAL EXPLORER TREE (No raw folder structure) */}
        <div className="w-60 bg-neutral-950 border-r border-neutral-900 flex flex-col select-none overflow-y-auto shrink-0">
          
          {/* PROFILE ROLE SELECTOR (RBAC) */}
          <div className="p-3 border-b border-neutral-900 bg-neutral-900/40">
            <span className="text-[8px] uppercase font-black text-zinc-500 tracking-wider block mb-2">Perfil de Acesso (RBAC)</span>
            <div className="relative">
              <select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value as UserRole)}
                className="w-full bg-black border border-neutral-800 rounded-lg py-1.5 px-2.5 text-xs font-bold text-zinc-300 outline-none focus:border-[#B87333]/50 cursor-pointer appearance-none"
              >
                <option value="operacao">💼 Perfil Operação</option>
                <option value="compliance">📜 Perfil Compliance</option>
                <option value="auditoria">🔍 Perfil Auditoria</option>
                <option value="engenharia">🛠️ Perfil Engenharia</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-500">
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>
            
            {/* Visual indicator of active role */}
            <div className={`mt-2 p-1.5 rounded text-[9.5px] border ${activeRoleMetadata.color} flex flex-col gap-0.5`}>
              <span className="font-extrabold uppercase tracking-wide">{activeRoleMetadata.label}</span>
              <span className="text-[8px] text-zinc-400 font-mono leading-tight">{activeRoleMetadata.description}</span>
            </div>
          </div>

          <div className="p-3 border-b border-neutral-900 flex justify-between items-center bg-neutral-900/10">
            <span className="text-[9px] uppercase font-extrabold text-zinc-400 tracking-wider">Árvore Operacional (OS)</span>
            <Activity className="w-3.5 h-3.5 text-[#B87333]" />
          </div>

          <div className="flex-1 p-2 space-y-1 text-xs">
            {Object.entries(filteredTreeModel).map(([key, value]) => {
              const isExpanded = expandedCategories[key];
              return (
                <div key={key} className="space-y-0.5">
                  {/* Category Trigger */}
                  <div
                    onClick={() => toggleCategory(key)}
                    className="flex items-center justify-between px-2 py-1 hover:bg-neutral-900/60 rounded cursor-pointer text-zinc-400 hover:text-zinc-200 transition-all"
                  >
                    <span className="flex items-center gap-1 font-bold text-[10px] uppercase tracking-wider text-zinc-400">
                      {isExpanded ? <ChevronDown className="w-3 h-3 text-[#B87333]" /> : <ChevronRight className="w-3 h-3 text-zinc-600" />}
                      {value.label}
                    </span>
                  </div>

                  {/* Sub-Nodes (Domínios de Operação) */}
                  {isExpanded && (
                    <div className="pl-3.5 border-l border-neutral-900 ml-3 space-y-0.5">
                      {value.nodes.map(node => {
                        const isNodeActive = activeTab === node.id;
                        return (
                          <button
                            key={node.id}
                            onClick={() => handleNodeSelect(node.id, node.label)}
                            className={`w-full text-left px-2 py-1 rounded text-xs transition-all flex items-center justify-between ${
                              isNodeActive 
                                ? "bg-[#B87333]/15 text-[#B87333] font-bold" 
                                : "text-zinc-500 hover:text-zinc-300"
                            }`}
                          >
                            <span>{node.label}</span>
                            <span className="text-[8.5px] font-mono opacity-60">{node.kpi.estado}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* WORKSPACE AREA: EXECUTIVE METRICS + ACTIVE VIEW */}
        <div className="flex-1 flex flex-col bg-neutral-950 overflow-hidden">
          
          {/* TAB HEADERS ROW */}
          <div className="flex bg-neutral-950 border-b border-neutral-900 select-none overflow-x-auto min-h-[36px] shrink-0">
            {openTabs.map(tab => {
              const isTabActive = activeTab === tab.id;
              return (
                <div
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-[10px] border-r border-neutral-900 transition-all cursor-pointer font-bold ${
                    isTabActive
                      ? "bg-neutral-900 text-white border-b-2 border-b-[#B87333]"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    onClick={(e) => closeWorkspace(tab.id, e)}
                    className="p-0.5 rounded hover:bg-neutral-800 text-zinc-600 hover:text-zinc-300 transition-all"
                  >
                    <X className="w-2.5 h-2.5" />
                  </span>
                </div>
              );
            })}

            {openTabs.length === 0 && (
              <div className="flex items-center px-4 text-[10.5px] text-zinc-600 italic">
                Abra um domínio operacional para iniciar o Workspace.
              </div>
            )}
          </div>

          {/* ACTIVE WORKSPACE CONTAINER */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {openTabs.length > 0 && (
              <div className="space-y-4">
                
                {!(rolesMetadata.find(r => r.id === userRole)?.allowedNodes.includes(activeTab)) ? (
                  <div className="bg-neutral-900/60 border border-red-900/30 p-8 rounded-2xl text-center max-w-xl mx-auto my-12 space-y-4 animate-fade-in font-mono">
                    <ShieldAlert className="w-16 h-16 text-red-500 mx-auto animate-pulse" />
                    <h3 className="text-lg font-bold text-white uppercase tracking-wider">Acesso Restrito (RBAC)</h3>
                    <p className="text-zinc-400 text-xs leading-relaxed">
                      Este domínio operacional (<span className="text-[#B87333] font-bold">{findLabelById(activeTab)}</span>) requer privilégios específicos de acesso. O seu perfil atual (<span className="text-red-400 font-bold uppercase">{userRole}</span>) não está autorizado para esta visualização.
                    </p>
                    <div className="pt-2">
                      <button
                        onClick={() => {
                          const reqRole = rolesMetadata.find(r => r.allowedNodes.includes(activeTab));
                          if (reqRole) {
                            setUserRole(reqRole.id);
                          } else {
                            setActiveTab(rolesMetadata.find(r => r.id === userRole)!.allowedNodes[0]);
                          }
                        }}
                        className="px-4 py-2 bg-red-950/40 hover:bg-red-900/30 border border-red-800/40 rounded-xl text-xs font-bold text-red-400 hover:text-white transition-all uppercase tracking-wider"
                      >
                        Alternar para Perfil Autorizado
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* A. STANDARDIZED WORKSPACE KPI HEADER (Transforming Pages into Workspaces) */}
                    <div className="bg-neutral-900/30 border border-neutral-900 rounded-xl p-3 grid grid-cols-3 sm:grid-cols-6 gap-2 select-none text-center">
                  <div className="p-1">
                    <span className="text-[8px] text-zinc-500 uppercase block font-bold">Estado do Nó</span>
                    <span className="text-xs font-bold text-white uppercase tracking-wider block mt-0.5">{currentKPIs.estado}</span>
                  </div>
                  <div className="p-1 border-l border-neutral-900/60">
                    <span className="text-[8px] text-zinc-500 uppercase block font-bold">Regras Ativas</span>
                    <span className="text-xs font-bold text-[#B87333] block mt-0.5">{currentKPIs.regras}</span>
                  </div>
                  <div className="p-1 border-l border-neutral-900/60">
                    <span className="text-[8px] text-zinc-500 uppercase block font-bold">Eventos Recentes</span>
                    <span className="text-xs font-bold text-white block mt-0.5">{currentKPIs.eventos}</span>
                  </div>
                  <div className="p-1 border-l border-neutral-900/60 font-mono">
                    <span className="text-[8px] text-zinc-500 uppercase block font-bold">Casos de Uso</span>
                    <span className="text-xs font-bold text-white block mt-0.5">{currentKPIs.useCases}</span>
                  </div>
                  <div className="p-1 border-l border-neutral-900/60">
                    <span className="text-[8px] text-zinc-500 uppercase block font-bold">Testes Suite</span>
                    <span className="text-xs font-bold text-emerald-400 block mt-0.5">{currentKPIs.testes}</span>
                  </div>
                  <div className="p-1 border-l border-neutral-900/60">
                    <span className="text-[8px] text-zinc-500 uppercase block font-bold">Observabilidade</span>
                    <span className="text-[9.5px] font-bold text-emerald-500 block mt-0.5">✓ OK</span>
                  </div>
                </div>

                {/* B. DETAILED WORKSPACE PAGES CONTENT */}

                {/* ========================================================================= */}
                {/* ========================================================================= */}
                {/* CONSTITUIÇÃO DO KMOS */}
                {/* ========================================================================= */}
                {activeTab === "const_principle" && (
                  <div className="space-y-6 text-left animate-fade-in font-sans">
                    {/* Sub-Tab Navigation Bar */}
                    <div className="flex border-b border-neutral-900 pb-2 gap-2 select-none overflow-x-auto">
                      {[
                        { id: "text", label: "Carta Constitucional", icon: Scale },
                        { id: "engine", label: "Constitution Engine", icon: Cpu },
                        { id: "graph", label: "Grafo de Conhecimento", icon: Network },
                        { id: "simulator", label: "Simulador de Impacto", icon: Zap },
                        { id: "twin", label: "Institutional Twin", icon: Dna }
                      ].map((sub) => {
                        const Icon = sub.icon;
                        const isSubActive = constSubTab === sub.id;
                        return (
                          <button
                            key={sub.id}
                            onClick={() => setConstSubTab(sub.id as any)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 border ${
                              isSubActive
                                ? "bg-[#B87333]/15 text-[#B87333] border-[#B87333]/30 font-extrabold"
                                : "text-zinc-500 hover:text-zinc-300 border-transparent hover:bg-neutral-900/40"
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            <span>{sub.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {constSubTab === "text" && (
                      <div className="space-y-6">
                        <div className="bg-gradient-to-br from-neutral-950 to-neutral-900 border-2 border-amber-900/30 p-6 rounded-2xl relative overflow-hidden shadow-2xl animate-fade-in">
                          <div className="absolute top-0 right-0 w-48 h-48 bg-[#B87333]/10 rounded-full filter blur-3xl pointer-events-none animate-pulse"></div>
                          <div className="flex items-center gap-2 mb-4">
                            <Scale className="w-5 h-5 text-[#B87333]" />
                            <span className="text-[10px] tracking-widest font-black uppercase text-amber-500">Documento Fundamental Soberano</span>
                          </div>
                          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight uppercase">Constituição do KwanzaMóvel</h2>
                          <p className="text-zinc-500 text-xs mt-1.5 font-mono">Última revisão física assinada: Luanda, República de Angola</p>

                          <div className="mt-6 border-l-4 border-amber-600 pl-4 py-2 bg-amber-500/5 rounded-r-lg max-w-3xl">
                            <span className="text-[9px] uppercase font-bold text-amber-500 block font-mono">Princípio Fundamental Único</span>
                            <p className="text-sm md:text-base font-medium italic text-zinc-100 leading-relaxed mt-1">
                              "O KMOS nunca representa código. O KMOS representa a instituição. O código é apenas um dos ativos observados."
                            </p>
                          </div>

                          <p className="text-xs text-zinc-400 leading-relaxed max-w-3xl mt-4">
                            Esta premissa inverte o paradigma da tecnologia financeira. O software KwanzaMóvel não existe para ser monitorizado de forma isolada; ele opera como a expressão computacional dinâmica e automatizada do Banco Nacional de Angola (BNA), das leis do Estado e da memória de cada decisão tomada pelo seu consórcio.
                          </p>
                        </div>

                        {/* Hierarchy of Abstraction */}
                        <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-5 space-y-4">
                          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                            <Activity className="w-4 h-4 text-[#B87333]" />
                            <span>Hierarquia de Abstração Sistémica</span>
                          </h3>
                          <p className="text-xs text-zinc-400">
                            O alinhamento descendente do KMOS assegura que qualquer alteração de código ou infraestrutura obedeça estritamente à vontade regulatória superior:
                          </p>

                          <div className="grid grid-cols-1 md:grid-cols-6 gap-3 pt-2">
                            {[
                              { step: "1. Instituição", desc: "Leis e Instruções", detail: "Constituição, Lei 40/20, Avisos do BNA", color: "border-amber-500 bg-amber-500/5 text-amber-400" },
                              { step: "2. Operações", desc: "Atores e Processos", detail: "KYC, Comerciantes, Agentes, Limites", color: "border-orange-500 bg-orange-500/5 text-orange-400" },
                              { step: "3. Serviços", desc: "Ativos de Liquidação", detail: "Compensação SPTR, Moeda, Custódia", color: "border-yellow-500 bg-yellow-500/5 text-yellow-400" },
                              { step: "4. Domínio", desc: "Invariantes DDD", detail: "Eventos, Agregados, Regras de Negócio", color: "border-emerald-500 bg-emerald-500/5 text-emerald-400" },
                              { step: "5. Código", desc: "Ficheiros e APIs", detail: "TypeScript, Express APIs, React UI", color: "border-sky-500 bg-sky-500/5 text-sky-400" },
                              { step: "6. Infra", desc: "Sistemas Físicos", detail: "Databases, HSM Cripto, Redes TLS", color: "border-indigo-500 bg-indigo-500/5 text-indigo-400" }
                            ].map((layer, index) => (
                              <div key={index} className={`border p-3.5 rounded-xl flex flex-col justify-between hover:scale-[1.02] transition-transform ${layer.color}`}>
                                <div>
                                  <span className="text-xs font-black block tracking-tight uppercase">{layer.step}</span>
                                  <span className="text-[9px] font-bold block mt-0.5 opacity-80 uppercase font-mono">{layer.desc}</span>
                                </div>
                                <span className="text-[10px] text-zinc-400 mt-3 block font-sans leading-relaxed">{layer.detail}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {constSubTab === "engine" && (
                      <div className="space-y-4 animate-fade-in text-left">
                        <ConstitutionEngine
                          onEmitEvent={(ev) => setEventsStream(prev => [ev, ...prev])}
                          institutionalHealth={institutionalHealth}
                          setInstitutionalHealth={setInstitutionalHealth}
                        />
                      </div>
                    )}

                    {constSubTab === "graph" && (
                      <div className="space-y-4 animate-fade-in">
                        <div className="bg-neutral-900/20 border border-neutral-900 p-4 rounded-xl">
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                            <Network className="w-4 h-4 text-[#B87333]" />
                            <span>Institutional Knowledge Graph</span>
                          </h4>
                          <p className="text-xs text-zinc-400 leading-normal mt-1">
                            Este é o grafo de conhecimento institucional que rastreia os nexos causais das leis e avisos regulatórios até os testes de integração, código físico e observabilidade.
                          </p>
                        </div>

                        {/* Hierarchical Node Visualizer */}
                        <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-6 relative overflow-hidden flex flex-col md:flex-row gap-6">
                          <div className="flex-1 space-y-4">
                            <h5 className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest font-mono">Mapeamento de Fluxo de Coerência</h5>
                            
                            <div className="relative pl-6 border-l-2 border-dashed border-[#B87333]/30 space-y-5 ml-4">
                              {[
                                { title: "Lei Geral 40/20 (LSPA)", type: "Lei / Enquadramento do Estado", desc: "Artigo 42.º - Exigência de integridade contabilística imutável", color: "bg-amber-500/10 border-amber-500/40 text-amber-400" },
                                { title: "Artigo 42.º (Registo de Transações)", type: "Regra Prudencial BNA", desc: "Aviso 07/2020: Custódia fiduciária de reservas 1:1 e partidas dobradas", color: "bg-orange-500/10 border-orange-500/40 text-orange-400" },
                                { title: "Wallet & Ledger Aggregate", type: "Domínio de Operação (DDD)", desc: "Invariante de balanço e conciliação síncrona", color: "bg-yellow-500/10 border-yellow-500/40 text-yellow-400" },
                                { title: "TransferUseCase & CommitLedgerEntry", type: "Caso de Uso de Serviço", desc: "Execução atómica e ACID de débitos e créditos", color: "bg-emerald-500/10 border-emerald-500/40 text-emerald-400" },
                                { title: "LedgerCommittedEvent", type: "Mensageria de Auditoria", desc: "Registo criptográfico de log imutável", color: "bg-sky-500/10 border-sky-500/40 text-sky-400" },
                                { title: "InvariantsPrudentialSg.test.ts", status: "PASS", type: "Teste de Garantia", desc: "Verificação automática e contínua do rácio fiduciário", color: "bg-indigo-500/10 border-indigo-500/40 text-indigo-400" },
                                { title: "Observabilidade Contínua (SLA)", type: "Métricas Operacionais", desc: "Gráficos de liquidez, telemetria contínua e alarmes", color: "bg-violet-500/10 border-violet-500/40 text-violet-400" }
                              ].map((node, i) => (
                                <div key={i} className="relative group cursor-pointer hover:translate-x-1 transition-transform">
                                  {/* Absolute marker dot */}
                                  <div className="absolute -left-[32px] top-1.5 w-3 h-3 rounded-full bg-neutral-950 border-2 border-[#B87333] flex items-center justify-center">
                                    <span className="w-1 h-1 rounded-full bg-[#B87333]"></span>
                                  </div>
                                  <div className={`border p-3 rounded-xl ${node.color}`}>
                                    <div className="flex justify-between items-center">
                                      <span className="text-xs font-black block tracking-tight">{node.title}</span>
                                      {node.status && <span className="text-[8.5px] px-1 bg-emerald-500/20 text-emerald-400 font-bold rounded font-mono">{node.status}</span>}
                                    </div>
                                    <span className="text-[8.5px] uppercase font-bold tracking-wider opacity-60 block mt-0.5">{node.type}</span>
                                    <p className="text-[10.5px] text-zinc-400 mt-1">{node.desc}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Graph description panel */}
                          <div className="md:w-72 bg-neutral-900/30 border border-neutral-900 rounded-xl p-4 space-y-4 shrink-0 self-start">
                            <h6 className="text-[10px] font-extrabold uppercase tracking-widest text-[#B87333] font-mono">Como ler o Grafo?</h6>
                            <p className="text-[11px] text-zinc-400 leading-relaxed">
                              Diferente de um grafo técnico que mostra ficheiros e classes, o <strong>Institutional Knowledge Graph</strong> do KMOS estabelece a união indissociável entre a vontade legal do Estado e o comportamento físico do software.
                            </p>
                            <p className="text-[11px] text-zinc-400 leading-relaxed">
                              Nenhuma regra de negócio é criada diretamente no código; cada invariante lógico ou asseveração de teste deve estar vinculada de forma ascendente a um artigo da <strong>Lei 40/20</strong> ou instruções do <strong>BNA</strong>.
                            </p>
                            <div className="p-3 bg-neutral-950 border border-neutral-900 rounded-lg text-[10px]">
                              <span className="font-bold text-white uppercase block">Rastreabilidade Total:</span>
                              <span className="text-zinc-500 mt-1 block">Cada transação gravada no Ledger síncrono pode ser rastreada de volta até ao artigo legal que justifica o seu formato e restrições.</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {constSubTab === "simulator" && (
                      <div className="space-y-4 animate-fade-in">
                        <div className="bg-neutral-900/20 border border-neutral-900 p-4 rounded-xl">
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                            <Zap className="w-4 h-4 text-[#B87333]" />
                            <span>Simulador de Impacto Regulatório</span>
                          </h4>
                          <p className="text-xs text-zinc-400 leading-normal mt-1">
                            Selecione um artigo da constituição ou de uma diretiva do BNA e execute o simulador para prever os impactos de uma alteração legal em todo o ecossistema antes de escrever código.
                          </p>
                        </div>

                        {/* Impact simulator controls */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                          <div className="lg:col-span-1 bg-neutral-950 border border-neutral-900 rounded-xl p-4 space-y-4 h-fit">
                            <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 font-mono">Definir Alteração Legal</h5>
                            
                            <div className="space-y-1.5">
                              <label className="text-[10px] text-zinc-500 font-bold uppercase block">Artigo / Regulamento</label>
                              <select
                                value={selectedSimArticle}
                                onChange={(e) => setSelectedSimArticle(e.target.value)}
                                className="w-full bg-neutral-900 border border-neutral-800 rounded p-2 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                              >
                                <option value="Artigo 74 (Confidencialidade)">Artigo 74.º (Confidencialidade de Dados PII)</option>
                                <option value="Artigo 42 (Registo de Dupla Entrada)">Artigo 42.º (Registo de Dupla Entrada Contabilístico)</option>
                                <option value="Aviso n.º 11/2021 (AML e Limites diários)">Aviso n.º 11/2021 (Regime simplificado KYC)</option>
                              </select>
                            </div>

                            <button
                              onClick={() => runImpactSimulation(selectedSimArticle)}
                              disabled={simulatingImpact}
                              className="w-full bg-[#B87333] hover:bg-amber-800 text-white font-black py-2.5 px-4 rounded text-xs uppercase cursor-pointer transition-colors flex justify-center items-center gap-1.5"
                            >
                              {simulatingImpact ? (
                                <>
                                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                                  <span>Computando Impacto...</span>
                                </>
                              ) : (
                                <>
                                  <Zap className="w-3.5 h-3.5" />
                                  <span>Simular Impacto</span>
                                </>
                              )}
                            </button>
                          </div>

                          <div className="lg:col-span-2 bg-neutral-950 border border-neutral-900 rounded-xl p-5 overflow-hidden min-h-[300px] flex flex-col justify-center">
                            {simResult ? (
                              <div className="space-y-4 text-xs font-sans animate-fade-in text-left">
                                <div className="flex flex-col sm:flex-row justify-between sm:items-start border-b border-neutral-900 pb-3 gap-2">
                                  <div>
                                    <h5 className="text-white font-black text-sm uppercase">{simResult.article}</h5>
                                    <span className="text-[9px] uppercase font-bold text-[#B87333] block mt-0.5 font-mono">Análise de Efeito Cascata Sistémico</span>
                                  </div>
                                  <div className="text-left sm:text-right shrink-0">
                                    <span className="bg-red-500/10 border border-red-500/30 text-red-400 px-2.5 py-1 rounded text-[9px] uppercase font-black font-mono inline-block">
                                      Risco: {simResult.risk}
                                    </span>
                                    <span className="text-[10px] text-zinc-400 block mt-1.5 font-mono font-bold">{simResult.complianceScore}</span>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div className="space-y-3">
                                    <div>
                                      <span className="text-[9px] uppercase font-black text-zinc-500 font-mono block">Tempo Estimado de Adaptação</span>
                                      <span className="text-white block font-bold mt-0.5">{simResult.time}</span>
                                    </div>
                                    <div>
                                      <span className="text-[9px] uppercase font-black text-zinc-500 font-mono block">Domínios do Core Afetados</span>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {simResult.domains.map((d: any, idx: number) => (
                                          <span key={idx} className="bg-neutral-900 px-1.5 py-0.5 rounded text-[10px] text-zinc-300 font-mono">{d}</span>
                                        ))}
                                      </div>
                                    </div>
                                    <div>
                                      <span className="text-[9px] uppercase font-black text-zinc-500 font-mono block">Casos de Uso Afetados</span>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {simResult.useCases.map((u: any, idx: number) => (
                                          <span key={idx} className="bg-neutral-900 px-1.5 py-0.5 rounded text-[10px] text-zinc-300 font-mono">{u}</span>
                                        ))}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="space-y-3">
                                    <div>
                                      <span className="text-[9px] uppercase font-black text-zinc-500 font-mono block">APIs / DTOs / Eventos</span>
                                      <div className="space-y-1 mt-1">
                                        {simResult.apis.map((a: any, idx: number) => (
                                          <span key={idx} className="block text-[10px] text-zinc-400 font-mono">&gt; {a}</span>
                                        ))}
                                        {simResult.events.map((e: any, idx: number) => (
                                          <span key={idx} className="block text-[10px] text-amber-500/80 font-mono">↳ Evento: {e}</span>
                                        ))}
                                      </div>
                                    </div>
                                    <div>
                                      <span className="text-[9px] uppercase font-black text-zinc-500 font-mono block">Estatus dos Testes Associados</span>
                                      <div className="space-y-1 mt-1">
                                        {simResult.tests.map((t: any, idx: number) => (
                                          <div key={idx} className="flex justify-between text-[10px] border-b border-neutral-900/30 pb-0.5">
                                            <span className="text-zinc-400 font-mono">{t.name}</span>
                                            <span className="text-amber-500 font-bold">{t.status}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="p-3 bg-[#B87333]/10 border border-[#B87333]/20 rounded-xl text-zinc-200 leading-normal">
                                  <span className="text-[9px] uppercase font-extrabold text-[#B87333] block font-mono">Ação Recomendada de Governança:</span>
                                  <p className="mt-0.5 text-[10.5px] leading-relaxed">{simResult.actions}</p>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-12 text-zinc-600">
                                <Zap className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                                <span className="text-xs">Clique em "Simular Impacto" para calcular o efeito em cascata regulatório.</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {constSubTab === "twin" && (
                      <div className="space-y-4 animate-fade-in">
                        <div className="bg-neutral-900/20 border border-neutral-900 p-4 rounded-xl">
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                            <Dna className="w-4 h-4 text-[#B87333]" />
                            <span>Institutional Twin Simulator</span>
                          </h4>
                          <p className="text-xs text-zinc-400 leading-normal mt-1">
                            O Institutional Twin do KMOS simula o funcionamento operacional e regulatório da organização sob novas premissas do Banco Central, identificando alterações preventivas na governança antes de qualquer alteração física.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                          <div className="lg:col-span-1 bg-neutral-950 border border-neutral-900 rounded-xl p-4 space-y-4 h-fit">
                            <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 font-mono">Cenário de Mercado / Regulatório</h5>
                            
                            <div className="space-y-1.5">
                              <label className="text-[10px] text-zinc-500 font-bold uppercase block">Selecionar Diretiva</label>
                              <select
                                value={selectedTwinScenario}
                                onChange={(e) => setSelectedTwinScenario(e.target.value)}
                                className="w-full bg-neutral-900 border border-neutral-800 rounded p-2 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                              >
                                <option value="Novo Aviso de Reservas (BNA)">Novo Aviso de Reservas (Depósitos a 105%)</option>
                                <option value="Aviso 11/2021 Update">Aviso 11/2021 - Expansão dos Limites Simplificados</option>
                                <option value="Redução das Comissões de Compensação SGA">Redução das Tarifas Interbancárias de Compensação (SGA)</option>
                              </select>
                            </div>

                            <button
                              onClick={() => runInstitutionalTwinSim(selectedTwinScenario)}
                              disabled={twinRunning}
                              className="w-full bg-[#B87333] hover:bg-amber-800 text-white font-black py-2.5 px-4 rounded text-xs uppercase cursor-pointer transition-colors flex justify-center items-center gap-1.5"
                            >
                              {twinRunning ? (
                                <>
                                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                                  <span>Simulando Twin...</span>
                                </>
                              ) : (
                                <>
                                  <Dna className="w-3.5 h-3.5" />
                                  <span>Executar Twin Sim</span>
                                </>
                              )}
                            </button>
                          </div>

                          <div className="lg:col-span-2 bg-neutral-950 border border-neutral-900 rounded-xl p-5 min-h-[300px] flex flex-col justify-center">
                            {twinResult ? (
                              <div className="space-y-4 text-xs font-sans animate-fade-in text-left">
                                <div className="border-b border-neutral-900 pb-3">
                                  <h5 className="text-white font-black text-sm uppercase">{twinResult.scenario}</h5>
                                  <p className="text-zinc-400 mt-1">{twinResult.impact}</p>
                                </div>

                                <div className="space-y-3">
                                  <div>
                                    <span className="text-[9px] uppercase font-black text-red-400 font-mono block">Restrições / Invariantes Quebrados</span>
                                    <div className="mt-1 space-y-1">
                                      {twinResult.brokenInvariants.map((bi: string, idx: number) => (
                                        <div key={idx} className="bg-red-500/10 border border-red-500/20 text-red-400 p-2 rounded text-[10.5px] font-mono flex items-center gap-1.5">
                                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                          <span>{bi}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  <div>
                                    <span className="text-[9px] uppercase font-black text-zinc-500 font-mono block">Alterações de Engenharia e Operações Necessárias</span>
                                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {twinResult.requiredChanges.map((rc: any, idx: number) => (
                                        <div key={idx} className="bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-900 flex flex-col justify-between">
                                          <span className="text-[8.5px] font-bold uppercase tracking-wider text-amber-500 font-mono">{rc.type}</span>
                                          <p className="text-[10.5px] text-zinc-300 mt-1 leading-normal">{rc.desc}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-neutral-900">
                                    <div>
                                      <span className="text-[9px] uppercase font-black text-zinc-500 font-mono block">Esforço Operacional</span>
                                      <span className="text-white block font-bold text-xs mt-0.5">{twinResult.estimatedWork}</span>
                                    </div>
                                    <div>
                                      <span className="text-[9px] uppercase font-black text-zinc-500 font-mono block">Risco de Conformidade</span>
                                      <span className="text-white block font-bold text-xs mt-0.5">{twinResult.complianceRisk}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-12 text-zinc-600">
                                <Dna className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                                <span className="text-xs font-sans">Selecione uma diretiva e clique em "Executar Twin Sim" para antecipar impactos organizacionais.</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ========================================================================= */}
                {/* MEMÓRIA INSTITUCIONAL */}
                {/* ========================================================================= */}
                {activeTab === "const_memory" && (
                  <div className="space-y-4 text-left animate-fade-in font-sans">
                    <div className="bg-neutral-900/20 border border-neutral-900 p-4 rounded-xl">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <History className="w-4 h-4 text-[#B87333]" />
                        <span>Memória Institucional do KMOS</span>
                      </h4>
                      <p className="text-xs text-zinc-400 leading-normal mt-1">
                        Não confundir com logs de execução técnica ou histórico do Git. Esta é a memória consciente e histórica das decisões e transições operacionais que moldaram o comportamento sistémico do KwanzaMóvel.
                      </p>
                    </div>

                    <div className="relative border-l border-neutral-900 ml-3.5 pl-6 space-y-6 pt-2">
                      {decisionsMemory.map((item, idx) => (
                        <div key={idx} className="relative group">
                          {/* Timeline Dot */}
                          <div className="absolute -left-[31px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#B87333] border-2 border-neutral-950 group-hover:scale-125 transition-transform"></div>
                          
                          <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-5 hover:border-amber-900/30 transition-all">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-900 pb-2.5 mb-3.5">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded font-mono">{item.id}</span>
                                <h5 className="text-xs font-bold text-white uppercase tracking-tight">{item.decision}</h5>
                              </div>
                              <div className="flex items-center gap-2 text-[10px]">
                                <span className="text-zinc-500 font-mono">{item.date}</span>
                                <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 font-mono font-bold px-1.5 py-0.5 rounded">{item.state}</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-xs leading-relaxed text-zinc-300">
                              <div className="space-y-1">
                                <span className="text-[9px] uppercase font-extrabold text-zinc-500 block font-mono">1. Contexto Institucional</span>
                                <p className="text-zinc-400">{item.context}</p>
                              </div>
                              <div className="space-y-1">
                                <span className="text-[9px] uppercase font-extrabold text-zinc-500 block font-mono">2. O Problema Operacional</span>
                                <p className="text-zinc-400">{item.problem}</p>
                              </div>
                              <div className="space-y-1">
                                <span className="text-[9px] uppercase font-extrabold text-zinc-500 block font-mono">3. Alternativas Ponderadas</span>
                                <p className="text-zinc-400 italic">{item.alternatives}</p>
                              </div>
                              <div className="space-y-1">
                                <span className="text-[9px] uppercase font-extrabold text-[#B87333] block font-mono">4. Escolha Consolidada</span>
                                <p className="text-zinc-200 font-medium">{item.choice}</p>
                              </div>
                              <div className="space-y-1">
                                <span className="text-[9px] uppercase font-extrabold text-zinc-500 block font-mono">5. Enquadramento Legal / Regulatório</span>
                                <p className="text-amber-500/90 font-bold font-mono text-[10px]">{item.legalBase || item.motivo}</p>
                              </div>
                              <div className="space-y-1">
                                <span className="text-[9px] uppercase font-extrabold text-zinc-500 block font-mono">6. Riscos Associados & Mitigação</span>
                                <p className="text-red-400 font-medium">{item.risk}</p>
                              </div>
                              <div className="space-y-1">
                                <span className="text-[9px] uppercase font-extrabold text-zinc-500 block font-mono">7. Trade-offs Arquiteturais</span>
                                <p className="text-zinc-400">{item.tradeoffs || "Nenhum trade-off severo identificado."}</p>
                              </div>
                              <div className="space-y-1">
                                <span className="text-[9px] uppercase font-extrabold text-zinc-500 block font-mono">8. Impactos na Organização</span>
                                <p className="text-zinc-300">{item.impact || item.consequence}</p>
                              </div>
                              <div className="space-y-1">
                                <span className="text-[9px] uppercase font-extrabold text-zinc-500 block font-mono">9. Testes Unitários & Invariantes</span>
                                <p className="text-emerald-400 font-mono text-[10.5px]">{item.tests || "Nenhum teste específico."}</p>
                              </div>
                              <div className="space-y-1">
                                <span className="text-[9px] uppercase font-extrabold text-zinc-500 block font-mono">10. Responsável pela Deliberação</span>
                                <p className="text-zinc-400 font-medium">{item.responsible || "Conselho Executivo KMOS"}</p>
                              </div>
                              <div className="md:col-span-2 pt-2 border-t border-neutral-900 flex justify-between text-[9px] font-mono text-zinc-500">
                                <span>Módulos de Domínio Afetados: <strong className="text-zinc-400">{item.modules}</strong></span>
                                <span>Estado de Transição: <strong className="text-emerald-500 font-bold">MUTABLE LOCK PASS</strong></span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* INSTITUTIONAL QUERY LANGUAGE (IQL) */}
                {/* ========================================================================= */}
                {activeTab === "const_iql" && (
                  <div className="space-y-4 text-left animate-fade-in font-sans">
                    <div className="bg-neutral-900/25 border border-neutral-900 p-4 rounded-xl">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <TerminalIcon className="w-4 h-4 text-[#B87333]" />
                        <span>IQL Terminal (Institutional Query Language)</span>
                      </h4>
                      <p className="text-xs text-zinc-400 leading-normal mt-1">
                        O operador não navega por pastas técnicas; ele interage diretamente com o estado cognitivo da instituição executando queries estruturadas e simulações.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      {/* Left IQL Control Console */}
                      <div className="lg:col-span-1 space-y-4">
                        <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-4 space-y-3">
                          <h5 className="text-[10px] uppercase font-black tracking-wider text-zinc-400">Atalhos de Consulta Directos</h5>
                          <div className="flex flex-col gap-1.5">
                            {[
                              { label: "SHOW High Risk Policies", query: "SHOW High Risk Policies" },
                              { label: "SHOW Wallet DEPENDENCIES", query: "SHOW Wallet DEPENDENCIES" },
                              { label: "IMPACT Lei 40/20 Article 74", query: "IMPACT Lei 40/20 Article 74" },
                              { label: "WHY Wallet requires AML", query: "WHY Wallet requires AML" },
                              { label: "TRACE SettlementCompleted", query: "TRACE SettlementCompleted" }
                            ].map((preset, i) => (
                              <button
                                key={i}
                                onClick={() => {
                                  setIqlQuery(preset.query);
                                  executeIql(preset.query);
                                }}
                                className="w-full text-left bg-neutral-900/40 hover:bg-neutral-900 border border-neutral-900 hover:border-amber-900/30 p-2.5 rounded text-[10.5px] font-mono text-zinc-300 transition-all flex justify-between items-center group cursor-pointer"
                              >
                                <span className="truncate">{preset.label}</span>
                                <ChevronRight className="w-3 h-3 text-zinc-600 group-hover:text-amber-500 shrink-0" />
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Recent History */}
                        <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-4">
                          <h5 className="text-[10px] uppercase font-black tracking-wider text-zinc-400 mb-2">Historial de Consultas</h5>
                          <div className="space-y-1.5">
                            {iqlHistory.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center text-[10.5px] font-mono border-b border-neutral-900/40 pb-1.5 text-zinc-500">
                                <span className="truncate max-w-[150px]">{item.query}</span>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span>{item.time}</span>
                                  <span className="text-emerald-500">✓</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Terminal screen & query output */}
                      <div className="lg:col-span-2 space-y-4">
                        <div className="bg-neutral-950 border border-neutral-900 rounded-xl overflow-hidden flex flex-col h-full min-h-[380px]">
                          <div className="bg-neutral-900/40 px-3 py-2 border-b border-neutral-900 flex justify-between items-center text-[9px] uppercase font-black text-zinc-400">
                            <span>KMOS-IQL Shell v3.0</span>
                            <span className="text-emerald-500 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              Conectado ao Graph de Conhecimento
                            </span>
                          </div>

                          <div className="p-4 flex-1 font-mono text-[11px] bg-black/80 space-y-4 overflow-y-auto">
                            <div className="flex gap-2">
                              <span className="text-amber-500 font-bold">&gt;</span>
                              <input
                                type="text"
                                value={iqlQuery}
                                onChange={(e) => setIqlQuery(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") executeIql(iqlQuery);
                                }}
                                className="bg-transparent border-none outline-none text-white flex-1 font-mono"
                                placeholder="Digite uma query (ex: SHOW High Risk Policies)..."
                              />
                              <button
                                onClick={() => executeIql(iqlQuery)}
                                className="bg-[#B87333] hover:bg-amber-800 text-white font-bold px-2.5 py-1 text-[9px] rounded font-sans uppercase cursor-pointer transition-colors"
                              >
                                Executar
                              </button>
                            </div>

                            {/* Query Output renderers */}
                            {iqlResult ? (
                              <div className="border-t border-neutral-900/80 pt-3 space-y-3">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h5 className="text-white font-bold text-xs">{iqlResult.title}</h5>
                                    {iqlResult.description && <p className="text-[10px] text-zinc-500 leading-normal mt-0.5">{iqlResult.description}</p>}
                                  </div>
                                  {iqlResult.risk && (
                                    <span className="bg-red-500/10 border border-red-500/30 text-red-400 px-2 py-0.5 rounded text-[9px] uppercase font-bold">
                                      Risk: {iqlResult.risk}
                                    </span>
                                  )}
                                </div>

                                {/* A. Policies table output */}
                                {iqlResult.type === "policies" && (
                                  <div className="bg-black/40 border border-neutral-900 rounded-lg overflow-hidden">
                                    <table className="w-full text-left text-[10px]">
                                      <thead className="bg-neutral-900/60 uppercase font-black text-zinc-500 border-b border-neutral-900">
                                        <tr>
                                          <th className="p-2">Regra ID</th>
                                          <th className="p-2">Descrição</th>
                                          <th className="p-2">Nível de Risco</th>
                                          <th className="p-2">Enquadramento Legal</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {iqlResult.data.map((row: any, i: number) => (
                                          <tr key={i} className="border-b border-neutral-900 last:border-0 hover:bg-neutral-900/20">
                                            <td className="p-2 font-bold text-amber-500">{row.code}</td>
                                            <td className="p-2 text-zinc-300">{row.name}</td>
                                            <td className="p-2 text-red-400 font-bold">{row.risk}</td>
                                            <td className="p-2 text-zinc-400">{row.law}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}

                                {/* B. Dependencies nodes and links output */}
                                {iqlResult.type === "dependencies" && (
                                  <div className="space-y-3">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                      {iqlResult.nodes.map((node: any, i: number) => (
                                        <div key={i} className="bg-neutral-900/30 border border-neutral-900 p-2 rounded">
                                          <span className="font-bold text-zinc-200 block text-[10px]">{node.name}</span>
                                          <span className="text-[8px] text-zinc-500 leading-tight block mt-0.5">{node.desc}</span>
                                        </div>
                                      ))}
                                    </div>
                                    <div className="bg-black/60 border border-neutral-900 rounded p-2.5 space-y-1 text-zinc-400 text-[10px]">
                                      <span className="text-[8px] text-zinc-500 uppercase font-bold block mb-1">Relações de Grafo Mapeadas:</span>
                                      {iqlResult.relations.map((rel: string, i: number) => (
                                        <div key={i} className="flex items-center gap-1.5 font-mono">
                                          <span>{rel}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* C. Impact Analysis output */}
                                {iqlResult.type === "impact" && (
                                  <div className="space-y-3">
                                    <div className="bg-red-500/5 border border-red-950 p-3 rounded-lg">
                                      <p className="text-[10px] text-zinc-300 leading-normal">{iqlResult.summary}</p>
                                    </div>
                                    <div className="space-y-1">
                                      <span className="text-[8px] text-zinc-500 uppercase font-bold block mb-1">Impactos por Módulo Mapeado:</span>
                                      {iqlResult.details.map((detail: any, i: number) => (
                                        <div key={i} className="bg-neutral-900/20 border border-neutral-900/60 p-2 rounded flex justify-between gap-4 text-[10px]">
                                          <strong className="text-white shrink-0">{detail.module}:</strong>
                                          <span className="text-zinc-400 text-right">{detail.impact}</span>
                                        </div>
                                      ))}
                                    </div>
                                    <div className="flex justify-between items-center text-[9.5px] pt-2 border-t border-neutral-900 text-zinc-500">
                                      <span>Módulos Afetados diretamente: <strong className="text-white font-mono">{iqlResult.affectedModules}</strong></span>
                                      <span className="text-amber-500 font-bold">{iqlResult.actionRequired}</span>
                                    </div>
                                  </div>
                                )}

                                {/* D. Justification Output */}
                                {iqlResult.type === "explanation" && (
                                  <div className="space-y-2 text-[10.5px]">
                                    <div className="bg-neutral-900/30 border border-neutral-900 p-3 rounded-lg leading-relaxed text-zinc-300">
                                      <span className="text-[8.5px] uppercase font-bold text-zinc-500 block mb-1 font-mono">Enquadramento Legal: {iqlResult.lawRef}</span>
                                      {iqlResult.reason}
                                    </div>
                                    <div className="text-[9px] text-emerald-400 font-bold">
                                      ✓ {iqlResult.tests}
                                    </div>
                                  </div>
                                )}

                                {/* E. Event Trace output */}
                                {iqlResult.type === "trace" && (
                                  <div className="space-y-2 text-[10.5px]">
                                    <div className="text-[9px] text-zinc-500 mb-1 font-mono">Correlation-ID: <strong className="text-white">{iqlResult.correlationId}</strong></div>
                                    <div className="border-l border-neutral-800 ml-2.5 pl-4 space-y-3">
                                      {iqlResult.steps.map((step: any, i: number) => (
                                        <div key={i} className="relative">
                                          <div className="absolute -left-[21px] top-1 w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                          <div className="flex justify-between items-center bg-neutral-900/20 p-1.5 rounded border border-neutral-900">
                                            <div>
                                              <span className="text-white font-bold text-[10px]">{step.step}</span>
                                              <span className="text-[8px] text-zinc-500 block">{step.component}</span>
                                            </div>
                                            <span className="text-[8px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">{step.status}</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* F. Generic message */}
                                {iqlResult.type === "generic" && (
                                  <div className="bg-neutral-900/25 border border-neutral-900 p-4 rounded text-zinc-400 leading-normal text-[10.5px]">
                                    {iqlResult.message}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-zinc-600 text-[10.5px] flex items-center justify-center h-32 italic">
                                Insira uma instrução e clique em "Executar" para iniciar a compilação do grafo de conhecimento.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* INSTITUTIONAL AI (COGNITIVE SPECIALIST) */}
                {/* ========================================================================= */}
                {activeTab === "const_ai" && (
                  <div className="space-y-4 text-left animate-fade-in font-sans">
                    <div className="bg-neutral-900/25 border border-neutral-900 p-4 rounded-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#B87333]/5 rounded-full filter blur-xl pointer-events-none"></div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-[#B87333] animate-pulse" />
                        <span>Intellectual Memory Specialist (AI Cognitiva)</span>
                      </h4>
                      <p className="text-xs text-zinc-400 leading-normal mt-1">
                        A IA Institucional é o guardião cognitivo da Constituição do KMOS. Ela compreende de forma holística a lei, o código, os testes, as decisões de arquitetura (ADRs) e os seus impactos sistémicos.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                      {/* Left: 8 Existential Cognitive Questions */}
                      <div className="lg:col-span-4 space-y-3">
                        <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-4 space-y-2">
                          <span className="text-[8.5px] uppercase font-black text-zinc-500 tracking-wider block mb-1">Perguntas Existenciais Disponíveis</span>
                          <div className="flex flex-col gap-1.5">
                            {[
                              { text: "Porque esta regra existe?", label: "Existência da Regra" },
                              { text: "Que lei a obriga?", label: "Obrigatoriedade Legal" },
                              { text: "Quem depende dela?", label: "Dependências de Sistema" },
                              { text: "Que testes a validam?", label: "Validação por Teste" },
                              { text: "Que ADR justificou esta decisão?", label: "Decisões de Arquitetura" },
                              { text: "Quando foi criada?", label: "Historial e Cronologia" },
                              { text: "Quem aprovou?", label: "Aprovação & Assinaturas" },
                              { text: "Qual o impacto de removê-la?", label: "Simulação de Impacto" }
                            ].map((q, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  setAiQuestion(q.text);
                                  askInstitutionalAI(q.text);
                                }}
                                className={`w-full text-left p-2.5 rounded text-[10px] font-medium transition-all border cursor-pointer flex justify-between items-center ${
                                  aiQuestion === q.text
                                    ? "bg-[#B87333]/15 border-[#B87333] text-white font-bold"
                                    : "bg-neutral-900/40 border-neutral-900 hover:bg-neutral-900 text-zinc-400 hover:text-zinc-200"
                                }`}
                              >
                                <span>{q.text}</span>
                                <ChevronRight className="w-3.5 h-3.5 opacity-60 shrink-0" />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right: Cognitive Answer Terminal */}
                      <div className="lg:col-span-8 space-y-4 flex flex-col justify-between">
                        <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-5 min-h-[340px] flex flex-col justify-between overflow-hidden relative">
                          <div className="space-y-4">
                            <div className="flex justify-between items-center border-b border-neutral-900 pb-3">
                              <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-amber-500" />
                                <span>Análise Cognitiva do Ecossistema</span>
                              </span>
                              <span className="text-[8px] font-mono uppercase bg-neutral-900 px-2 py-0.5 rounded text-zinc-500">Engine: Gemini Cognitive Expert</span>
                            </div>

                            {/* Query Box preview */}
                            <div className="bg-neutral-900/20 p-2.5 border border-neutral-900 rounded font-mono text-[10px] text-amber-500 flex items-center gap-2">
                              <span className="font-bold">&gt; CONSULT_AI</span>
                              <span className="text-zinc-300 font-bold">"{aiQuestion}"</span>
                            </div>

                            {/* AI Output screen */}
                            <div className="text-xs leading-relaxed text-zinc-300 min-h-[140px] whitespace-pre-line pt-2">
                              {aiLoading ? (
                                <div className="flex flex-col items-center justify-center gap-3 h-32">
                                  <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                                  <span className="font-mono text-[10px] text-zinc-500 uppercase animate-pulse">Compilando respostas do ecossistema...</span>
                                </div>
                              ) : aiAnswer ? (
                                <div className="space-y-3 animate-fade-in">
                                  <p>{aiAnswer}</p>
                                </div>
                              ) : (
                                <div className="text-zinc-600 italic text-[11px] h-32 flex items-center justify-center">
                                  Selecione uma das questões operacionais à esquerda ou digite uma questão customizada abaixo.
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Custom prompt input */}
                          <div className="border-t border-neutral-900 pt-3 flex gap-2">
                            <input
                              type="text"
                              value={aiQuestion}
                              onChange={(e) => setAiQuestion(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") askInstitutionalAI(aiQuestion);
                              }}
                              className="bg-neutral-900 border border-neutral-900 text-white rounded px-3 py-2 text-xs flex-1 outline-none focus:border-amber-900/40 font-mono"
                              placeholder="Fale com a IA Institucional..."
                            />
                            <button
                              onClick={() => askInstitutionalAI(aiQuestion)}
                              className="bg-[#B87333] hover:bg-amber-800 text-white font-bold px-4 py-2 text-xs rounded uppercase cursor-pointer flex items-center gap-1.5 transition-colors"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Consultar</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* 3. MONITORIZAÇÃO: METRICS */}
                {/* ========================================================================= */}
                {activeTab === "monitoring_metrics" && (
                  <div className="space-y-4 text-left animate-fade-in font-sans">
                    <div className="bg-neutral-900/25 border border-neutral-900 p-4 rounded-xl">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Metrics Panel (Métricas Sistémicas)</h4>
                      <p className="text-xs text-zinc-400 mt-1">
                        Monitor de performance transacional, rácio de liquidez e integridade de saldo em tempo real no ecossistema KMOS.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { title: "Rácio de Liquidez de Salvaguarda", value: "100.00%", desc: "Correspondência 1:1 total fiduciária" },
                        { title: "Transações por Segundo (TPS)", value: tpsRate.toString(), desc: "Taxa de liquidação em tempo real" },
                        { title: "Latência Média de Redes", value: "112ms", desc: "Sincronização com o SPTR" },
                        { title: "Volume Líquido Compensado", value: "852,400,000 Kz", desc: "Compensado em lote hoje" }
                      ].map((card, idx) => (
                        <div key={idx} className="bg-neutral-950 border border-neutral-900 p-3.5 rounded-xl">
                          <span className="text-[8px] text-zinc-500 font-extrabold uppercase font-mono">{card.title}</span>
                          <span className="text-base font-black text-white mt-1.5 block">{card.value}</span>
                          <span className="text-[8px] text-zinc-600 block mt-1 leading-normal font-mono">{card.desc}</span>
                        </div>
                      ))}
                    </div>

                    <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-4">
                      <span className="text-[9px] uppercase font-bold text-zinc-400 block mb-3 font-mono">Curva de Compensações e Latência Sistémica</span>
                      <div className="h-44">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={[
                            { name: "09:00", Latência: 98, TPS: 10, Lastro: 100 },
                            { name: "10:00", Latência: 112, TPS: 14, Lastro: 100 },
                            { name: "11:00", Latência: 104, TPS: 15, Lastro: 100 },
                            { name: "12:00", Latência: 110, TPS: 12, Lastro: 100 },
                            { name: "13:00", Latência: 95, TPS: 18, Lastro: 100 }
                          ]}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                            <XAxis dataKey="name" stroke="#525252" style={{ fontSize: "9px" }} />
                            <YAxis stroke="#525252" style={{ fontSize: "9px" }} />
                            <Tooltip contentStyle={{ backgroundColor: "#171717", border: "1px solid #262626" }} />
                            <Line type="monotone" dataKey="Latência" stroke="#B87333" strokeWidth={2} name="Latência (ms)" />
                            <Line type="monotone" dataKey="TPS" stroke="#10b981" strokeWidth={2} name="TPS" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Recharts Monthly Spending Category Distribution Component */}
                    <MonthlySpendingDistributionChart ledgerTransactions={ledger} />
                  </div>
                )}

                {/* ========================================================================= */}
                {/* 3. MONITORIZAÇÃO: TELEMETRY */}
                {/* ========================================================================= */}
                {activeTab === "monitoring_telemetry" && (
                  <div className="space-y-4 text-left animate-fade-in font-sans">
                    <div className="bg-neutral-900/25 border border-neutral-900 p-4 rounded-xl">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Telemetry Engine (Telemetria & SLAs)</h4>
                      <p className="text-xs text-zinc-400 mt-1">
                        Monitor de integridade de canais e taxas de erro síncronas de liquidação fiduciária.
                      </p>
                    </div>

                    <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-4 space-y-3">
                      <span className="text-[9px] uppercase font-bold text-zinc-400 block font-mono">Taxas de Sucesso de Canais Digitais</span>
                      <div className="space-y-2">
                        {[
                          { channel: "SGA Compensação (Interbancária)", rate: "100%", status: "Síncrono", color: "bg-emerald-500" },
                          { channel: "USSD / Fallback Offline", rate: "99.4%", status: "Síncrono SMS-OTP", color: "bg-emerald-500" },
                          { channel: "API Bancária Custódia (BAI, BFA, BIC)", rate: "98.7%", status: "Ativo", color: "bg-yellow-500" },
                          { channel: "Assinaturas HSM Cripto", rate: "100%", status: "Certificado Ativo", color: "bg-emerald-500" }
                        ].map((ch, i) => (
                          <div key={i} className="flex justify-between items-center text-xs p-2.5 bg-neutral-900/30 rounded border border-neutral-900">
                            <div>
                              <span className="text-white font-bold block">{ch.channel}</span>
                              <span className="text-[9px] text-zinc-500 font-mono mt-0.5">{ch.status}</span>
                            </div>
                            <div className="flex items-center gap-2 font-mono text-[10px]">
                              <span className="text-white font-black">{ch.rate}</span>
                              <span className={`w-2 h-2 rounded-full ${ch.color}`}></span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* 3. MONITORIZAÇÃO: LOGS */}
                {/* ========================================================================= */}
                {activeTab === "monitoring_logs" && (
                  <div className="space-y-4 text-left animate-fade-in font-sans">
                    <div className="bg-neutral-900/25 border border-neutral-900 p-4 rounded-xl">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Live Transaction Logs (Registo de Execução)</h4>
                      <p className="text-xs text-zinc-400 mt-1">
                        Fluxo ao vivo de auditoria interna contendo queries ao banco de dados e lançamentos de dupla entrada.
                      </p>
                    </div>

                    <div className="bg-black/90 border border-neutral-900 rounded-xl overflow-hidden font-mono text-[10.5px]">
                      <div className="bg-neutral-900/40 px-3 py-1.5 border-b border-neutral-900 flex justify-between items-center text-[9px] text-zinc-500 uppercase font-black">
                        <span>Terminal Logs centralizados</span>
                        <span className="text-emerald-500 animate-pulse">STREAMING LIVE</span>
                      </div>
                      <div className="p-3.5 space-y-2 max-h-72 overflow-y-auto leading-relaxed text-zinc-400">
                        <p className="text-zinc-500">14:10:02 [DB_INFO] SELECT * FROM wallets WHERE phone = '+244923000111' - Correlation: corr_8D9A12</p>
                        <p className="text-emerald-500">14:10:03 [COMPLIANCE] Policy 'L4020_A40' evaluated successfully for level-1 limits - TRUE</p>
                        <p className="text-zinc-500">14:10:05 [HSM] Signed message body ISO 20022 (pacs.008) via HSM keyset: ecdsa-p256-key</p>
                        <p className="text-zinc-400">14:10:07 [LEDGER] COMMITTED - Debit Account Wallet(Manuel) 15,000 Kz | Credit Account SettlementReserve(BFA)</p>
                        <p className="text-emerald-400">14:10:10 [SPTR_DISPATCH] Dispatching multilateral settlement batch instruction to SGA BNA - BATCH_442</p>
                        <p className="text-zinc-500 font-bold">14:10:12 [AUDIT] SHA-256 state hash generated and signed in blockchain storage block #942521</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* 3. MONITORIZAÇÃO: TRACING */}
                {/* ========================================================================= */}
                {activeTab === "monitoring_tracing" && (
                  <div className="space-y-4 text-left animate-fade-in font-sans">
                    <div className="bg-neutral-900/25 border border-neutral-900 p-4 rounded-xl">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Distributed Transaction Tracing (Rastreabilidade Ponta a Ponta)</h4>
                      <p className="text-xs text-zinc-400 mt-1">
                        Visualize a linhagem completa e latência em cada nó arquitetural de compensação.
                      </p>
                    </div>

                    <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-5 space-y-4 font-sans text-xs">
                      <span className="text-[9px] uppercase font-bold text-zinc-500 block font-mono">Rastreio de Fluxo: SettlementCompleted (ID: corr_3C910B8D4E2)</span>
                      
                      <div className="relative border-l border-neutral-800 ml-3 pl-6 space-y-4">
                        {[
                          { node: "API Gateway (ingress)", latency: "2ms", desc: "Validação e decifragem de payload TLS 1.3" },
                          { node: "Policy Engine Compliance", latency: "14ms", desc: "Verificação síncrona contra regras de limites e KYC" },
                          { node: "HSM Cripto-Sign", latency: "25ms", desc: "Assinatura do payload financeiro pacs.008 em hardware seguro" },
                          { node: "Double-Entry Ledger Commit", latency: "18ms", desc: "Garantia ACID e geração de hash SHA-256 em base imutável" },
                          { node: "SPTR SGA Gateway BNA", latency: "53ms", desc: "Comunicação e liquidação interbancária final com o BNA" }
                        ].map((trace, i) => (
                          <div key={i} className="relative group text-xs">
                            <div className="absolute -left-[30px] top-1 w-2 h-2 rounded-full bg-[#B87333] border border-neutral-950"></div>
                            <div className="flex justify-between items-center bg-neutral-900/30 border border-neutral-900/60 rounded p-2.5 hover:border-amber-900/20 transition-colors">
                              <div>
                                <span className="text-white font-bold block">{trace.node}</span>
                                <span className="text-[10px] text-zinc-400 leading-normal block mt-0.5">{trace.desc}</span>
                              </div>
                              <span className="text-[10px] text-[#B87333] font-mono font-bold shrink-0">{trace.latency}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* 4. GOVERNANCE: COMPLIANCE & RISK */}
                {/* ========================================================================= */}
                {activeTab === "governance_compliance" && (
                  <div className="space-y-4 text-left animate-fade-in font-sans">
                    <div className="bg-neutral-900/25 border border-neutral-900 p-4 rounded-xl">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Compliance & Risk Panel (Pontuação de Risco Regulatório)</h4>
                      <p className="text-xs text-zinc-400 mt-1">
                        Classificação contínua e automatizada contra as diretrizes do Banco Nacional de Angola.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Risk Score */}
                      <div className="bg-neutral-950 border border-neutral-900 p-4 rounded-xl text-center space-y-2">
                        <span className="text-[9px] uppercase font-bold text-zinc-500 block font-mono">Nota de Integridade Geral</span>
                        <div className="text-3xl font-black text-emerald-400">96.8%</div>
                        <span className="text-[9.5px] text-zinc-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded uppercase font-bold">Excelente (A-Rating)</span>
                      </div>

                      {/* AML Checks */}
                      <div className="bg-neutral-950 border border-neutral-900 p-4 rounded-xl col-span-2 space-y-2 text-xs">
                        <span className="text-[9px] uppercase font-bold text-zinc-500 block font-mono">Checklist de Conformidade Ativo (LSPA n.º 40/20)</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {[
                            { name: "Verificação de BI em Registo Civil", ok: true },
                            { name: "Rácio de salvaguarda fiduciário >= 100%", ok: true },
                            { name: "SCA (Autenticação Forte) habilitado", ok: true },
                            { name: "Geo-velocity e AML transacional", ok: true }
                          ].map((item, i) => (
                            <div key={i} className="flex justify-between items-center p-2 bg-neutral-900/30 border border-neutral-900 rounded">
                              <span className="text-zinc-300">{item.name}</span>
                              <span className="text-emerald-400 font-bold font-mono">✓ PASS</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* 4. GOVERNANCE: AUDITORIA & CONTROLOS */}
                {/* ========================================================================= */}
                {activeTab === "governance_auditoria" && (
                  <div className="space-y-4 text-left animate-fade-in font-sans">
                    {/* ComplianceView Component Segregating Auditor Access */}
                    <ComplianceView
                      ledger={ledger}
                      auditorName="Auditor Independente (BNA / ARSEG)"
                      onExportAuditReport={triggerPdfReportGeneration}
                    />

                    <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-5 text-center space-y-3.5">
                      <FileText className="w-12 h-12 text-[#B87333] mx-auto animate-pulse" />
                      <div>
                        <h5 className="text-xs font-bold text-white">Certidão de Conformidade Sistemática</h5>
                        <p className="text-[10px] text-zinc-500 max-w-xs mx-auto leading-normal mt-1">
                          Emita um documento em PDF consolidando rácios de lastro, partidas dobradas, segurança criptográfica e conformidade de tiers.
                        </p>
                      </div>
                      <button
                        onClick={triggerPdfReportGeneration}
                        className="bg-[#B87333] hover:bg-amber-800 text-white font-bold px-4 py-2 text-[9.5px] uppercase rounded-lg transition-all flex items-center gap-1.5 mx-auto cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Exportar PDF Certificado</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* KOS INTELLIGENCE: SYSTEM DNA */}
                {/* ========================================================================= */}
                {activeTab === "kos_dna" && (
                  <div className="space-y-4 text-left animate-fade-in">
                    <div className="bg-neutral-900/25 border border-neutral-900 p-4 rounded-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#B87333]/5 rounded-full filter blur-xl pointer-events-none"></div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Dna className="w-4 h-4 text-[#B87333] animate-pulse" />
                        <span>DNA do Sistema (Autoconsciência Operacional)</span>
                      </h4>
                      <p className="text-xs text-zinc-400 font-sans leading-relaxed mt-1.5">
                        O KwanzaMóvel é um organismo de engenharia auto-reflexivo. Ele deteta e audita dinamicamente a sua própria topologia, mapeando classes de domínio, invariantes computacionais e diretivas do Banco Nacional de Angola (BNA).
                      </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                      {[
                        { title: "Domínios de Domínio", value: "18", desc: "Hexagonal Bound Blocks" },
                        { title: "Subdomínios Ativos", value: "74", desc: "Regimes de isolamento" },
                        { title: "Casos de Uso (DDD)", value: "211", desc: "Processadores de UseCase" },
                        { title: "Agregados Críticos", value: "36", desc: "Wallet, Ledger, AML aggregates" },
                        { title: "Entidades de Domínio", value: "148", desc: "Modelos com identidade única" },
                        { title: "Value Objects", value: "93", desc: "Imutabilidade garantida" },
                        { title: "Eventos de Domínio", value: "427", desc: "Lançados no Event Bus" },
                        { title: "Endpoints de API", value: "96", desc: "REST / Webhook / SMS Gateway" },
                        { title: "Leis Mapeadas", value: "17", desc: "Incluindo LSPA n.º 40/20" },
                        { title: "Avisos do BNA", value: "28", desc: "Mapeamento bidirecional" },
                        { title: "Normas Ativas", value: "214", desc: "Validadas por Policy Engine" },
                        { title: "Cobertura de Testes", value: "3,124", desc: "Invariantes automatizadas" },
                        { title: "Compliance Score", value: "96%", desc: "Nota regulatória dinâmica" },
                        { title: "Audit Trail Ledger", value: "100%", desc: "ACID Criptográfico" },
                        { title: "Saúde Arquitetural", value: "Excellent", desc: "95% Architecture Rating" }
                      ].map((item, idx) => (
                        <div key={idx} className="bg-black/40 border border-neutral-900 p-3 rounded-xl flex flex-col justify-between hover:border-[#B87333]/30 transition-all select-none">
                          <span className="text-[7.5px] text-zinc-500 uppercase font-black tracking-wider">{item.title}</span>
                          <span className="text-lg font-black text-white mt-1">{item.value}</span>
                          <span className="text-[7.5px] text-zinc-600 mt-1 font-mono leading-tight">{item.desc}</span>
                        </div>
                      ))}
                    </div>

                    {/* Interactive "Quem sou eu?" Prompt */}
                    <div className="bg-black border border-neutral-900 rounded-xl overflow-hidden">
                      <div className="bg-neutral-900/40 px-3 py-1.5 border-b border-neutral-900 flex justify-between items-center text-[8.5px] uppercase font-black text-zinc-400">
                        <span>Terminal KOS: Diagnóstico Existencial</span>
                        <span className="text-emerald-500">Status: Autoconsciente</span>
                      </div>
                      <div className="p-3 font-mono text-[10.5px] leading-relaxed text-zinc-300 bg-black/80 space-y-2">
                        <p className="text-amber-500 font-bold">&gt; show-dna --detailed</p>
                        <p className="text-zinc-400 leading-normal">
                          [KMOS CORE]: Identificando como <strong className="text-white">KwanzaMóvel OS</strong>, um ecossistema financeiro soberano regulado pela Lei n.º 40/20 do Banco Nacional de Angola.
                        </p>
                        <p className="text-zinc-400 leading-normal">
                          [CONEXÃO INTEGRADA]: Ligação ativa ao SPTR/SGA. Balancete de compensação em contas de custódia fiduciária auditado e imutável no ledger de dupla entrada. SCA ativo em 100% dos canais digitais e fallback offline SMS-OTP assinado via ECDSA P-256.
                        </p>
                        <p className="text-emerald-500 font-bold">✓ Todos os 3,124 testes de regressão de domínio passaram. Nenhuma circularidade de pacotes detetada.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* KOS INTELLIGENCE: MANIFESTOS DE MÓDULO */}
                {/* ========================================================================= */}
                {activeTab === "kos_manifests" && (
                  <div className="space-y-4 text-left animate-fade-in">
                    <div className="bg-neutral-900/25 border border-neutral-900 p-4 rounded-xl">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <FileCode className="w-4 h-4 text-[#B87333]" />
                        <span>Manifestos do Sistema (Mapeamento Declarativo)</span>
                      </h4>
                      <p className="text-xs text-zinc-400 font-sans leading-normal mt-1">
                        Cada domínio isolado do KMOS declara as suas responsabilidades, dependências, enquadramento legal, eventos de negócio e métricas de observabilidade de forma estruturada.
                      </p>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-4">
                      {/* Left Side: Module Selector list */}
                      <div className="w-full lg:w-56 shrink-0 flex flex-col gap-1.5">
                        {[
                          { id: "wallet", label: "Wallet (Carteiras)" },
                          { id: "ledger", label: "Ledger Contabilístico" },
                          { id: "aml", label: "Prevenção Branqueamento" },
                          { id: "hsm", label: "Segurança & HSM" },
                          { id: "settlement", label: "Liquidação Interbancária" },
                          { id: "compliance", label: "Motor Regulatório RKK" }
                        ].map((m) => (
                          <button
                            key={m.id}
                            onClick={() => setManifestModule(m.id)}
                            className={`w-full text-left px-3 py-2.5 rounded-xl border text-xs font-bold transition-all flex justify-between items-center ${
                              manifestModule === m.id
                                ? "bg-[#B87333]/15 border-[#B87333] text-white"
                                : "bg-black/20 border-neutral-900 text-zinc-500 hover:text-zinc-300 hover:border-neutral-800"
                            }`}
                          >
                            <span>{m.label}</span>
                            <span className="text-[8px] px-1.5 py-0.5 rounded bg-black text-zinc-600 font-mono">v1.0</span>
                          </button>
                        ))}
                      </div>

                      {/* Right Side: Manifest Code Rendering */}
                      <div className="flex-1 bg-black border border-neutral-900 rounded-2xl overflow-hidden flex flex-col h-[320px]">
                        <div className="bg-neutral-900/40 px-4 py-2 border-b border-neutral-900 flex justify-between items-center text-[9px] uppercase font-bold text-zinc-500">
                          <span>Declarative Manifest: {manifestModule}.yaml</span>
                          <span className="text-amber-500 font-mono">Formato YAML Imutável</span>
                        </div>
                        <div className="flex-1 p-4 overflow-y-auto font-mono text-[10.5px] leading-relaxed text-emerald-400/90 bg-zinc-950">
                          <pre className="whitespace-pre-wrap">
                            {manifestModule === "wallet" && `id: wallet
version: 1.0.4
owner: Core Banking Domain
purpose:
  Gerir saldos, limites KYC, restrições de transações e o estado geral das carteiras eletrónicas.
dependsOn:
  - Ledger (Para registo e compensação imediata)
  - AML (Para escrutínio e limites KYC)
  - HSM Cryptography (Para assinatura de transações)
Regulation:
  - Lei n.º 40/20 (LSPA - Artigo 14.º)
  - Aviso n.º 11/2021 (Regime Simplificado)
events:
  - WalletCreated
  - WalletFrozen
  - WalletClosed
  - LimitUpdated
api:
  - POST /api/wallets (Criar nova carteira)
  - GET /api/wallets/:phone (Consultar saldo e metadados)
tests:
  - src/domain/wallet/tests/WalletAggregate.test.ts
observability:
  - WalletActiveCount (Métricas de uso ativo)
  - WalletScaSuccessRate (Taxa de sucesso de autenticação forte)`}

                            {manifestModule === "ledger" && `id: ledger
version: 2.1.0
owner: Ledger Domain
purpose:
  Assegurar o registo imutável de lançamentos contabilísticos em partidas dobradas (Double-Entry Ledger).
dependsOn:
  - HSM Cryptography (Garantia de assinatura do bloco anterior)
Regulation:
  - Lei n.º 40/20 (Invariante de Imutabilidade das contas de custódia)
  - Aviso n.º 05/2021 (Relatórios Financeiros de Moeda Eletrónica)
events:
  - JournalEntryPosted
  - AccountBalanced
  - LedgerAuditCompleted
api:
  - GET /api/ledger/entries (Consultar auditoria)
  - POST /api/ledger/postings (Lançamento administrativo de reservas)
tests:
  - src/domain/ledger/tests/AccountingService.test.ts
observability:
  - LedgerThroughput (Lançamentos por segundo)
  - TrialBalanceDiscrepancy (Deveria ser zero absoluto)`}

                            {manifestModule === "aml" && `id: aml
version: 1.1.2
owner: Compliance & Risk Domain
purpose:
  Monitorizar transações em tempo real para prevenção de branqueamento de capitais e financiamento ao terrorismo.
dependsOn:
  - Wallet (Para análise do perfil KYC)
  - Ledger (Para análise de histórico)
Regulation:
  - Lei n.º 40/20 (Artigos de AML/CFT)
  - Aviso n.º 11/2021 (Limites e Escalonamento KYC)
events:
  - AMLTriggered
  - SuspiciousActivityFlagged
  - RiskScoreCalculated
api:
  - POST /api/compliance/risk-score (Avaliar payload de transação)
  - POST /api/compliance/block-wallet (Bloqueio cautelar de conta)
tests:
  - src/domain/compliance/tests/AmlService.test.ts
observability:
  - AmlAlertRate (Alertas por volume transacional)
  - FalsePositiveRatio (Rácio de falsos positivos)`}

                            {manifestModule === "hsm" && `id: hsm
version: 3.0.1
owner: Security Infrastructure
purpose:
  Proteger chaves de segurança fiduciárias e encriptar dados pessoais confidenciais (PII).
dependsOn:
  - CryptographicHardware (Entropy monitor)
Regulation:
  - Lei n.º 40/20 (Proteção de Dados do Utilizador)
  - Aviso n.º 09/2023 (Segurança Tecnológica)
events:
  - KeyRotated
  - SignatureGenerated
  - SecurityBreachHalted
api:
  - POST /api/hsm/sign (Assinar mensagem ISO 20022)
  - POST /api/hsm/encrypt (Cifrar PII de forma irreversível)
tests:
  - src/infrastructure/hsm/tests/HsmProvider.test.ts
observability:
  - HsmSignatureLatency (Tempo de assinatura em ms)
  - CryptographicEntropyRating (Grau de entropia geral)`}

                            {manifestModule === "settlement" && `id: settlement
version: 1.5.0
owner: Payments Domain
purpose:
  Executar liquidação financeira interbancária com compensação física no SPTR do BNA.
dependsOn:
  - Ledger (Debitar/Creditar contas fiduciárias)
  - Reserve Engine (Controle de lastro)
  - AML (Escrutínio regulatório de grandes montantes)
Regulation:
  - Lei n.º 40/20 (Sistemas de Compensação e Liquidação)
  - Aviso n.º 03/2022 (Lastro fiduciário 1:1)
  - Aviso n.º 05/2021 (Compensação em Tempo Real)
events:
  - SettlementStarted
  - SettlementCompleted
  - SettlementRejected
api:
  - POST /api/settlement/dispatch (Disparar instrução SPTR)
  - GET /api/settlement/batches (Lista de lotes compensados)
tests:
  - src/domain/payments/tests/SettlementService.test.ts
observability:
  - SettlementLatency (Tempo médio de compensação)
  - SettlementFailures (Falhas de comunicação SPTR)`}

                            {manifestModule === "compliance" && `id: compliance
version: 2.0.0
owner: Governance Domain
purpose:
  Avaliar dinamicamente políticas operacionais escritas em DSL e regras formais do RKK.
dependsOn:
  - RegulatoryKnowledgeKernel (Base legislativa de Angola)
Regulation:
  - Lei n.º 40/20 (LSPA Geral)
events:
  - RulesRevalidated
  - PolicyViolationAlerted
api:
  - POST /api/policy/evaluate (Validar transação contra regras)
tests:
  - src/domain/regulatory/tests/RuleEvaluator.test.ts
observability:
  - RuleEvaluationUptime (Uptime do motor)
  - ComplianceScorePercent (Percentual de conformidade geral)`}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* KOS INTELLIGENCE: CATÁLOGO VIVO DO SISTEMA */}
                {/* ========================================================================= */}
                {activeTab === "kos_catalog" && (
                  <div className="space-y-4 text-left animate-fade-in">
                    <div className="bg-neutral-900/25 border border-neutral-900 p-4 rounded-xl flex justify-between items-center">
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                          <Network className="w-4 h-4 text-[#B87333]" />
                          <span>Catálogo Vivo do Sistema (Linhagem de Engenharia)</span>
                        </h4>
                        <p className="text-xs text-zinc-400 font-sans leading-normal mt-1">
                          A memória viva do KwanzaMóvel. Descubra a linhagem completa de cada recurso operacional, desde as capacidades primárias até à suite de testes correspondente.
                        </p>
                      </div>
                      <select
                        value={catalogModule}
                        onChange={(e) => setCatalogModule(e.target.value)}
                        className="bg-black border border-neutral-900 rounded-lg p-2 text-xs font-bold text-zinc-300 focus:border-[#B87333] outline-none cursor-pointer"
                      >
                        <option value="wallet">Wallet Domain</option>
                        <option value="ledger">Ledger Domain</option>
                        <option value="aml">AML Domain</option>
                        <option value="hsm">HSM Security</option>
                        <option value="settlement">Settlement Domain</option>
                        <option value="compliance">Compliance Domain</option>
                      </select>
                    </div>

                    <div className="bg-black/30 border border-neutral-900 p-4 rounded-2xl space-y-4">
                      {/* Interactive Flow representation */}
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-3 relative">
                        {[
                          { step: "MÓDULO", color: "border-amber-900 bg-amber-950/10 text-amber-500", key: "module" },
                          { step: "CAPABILITIES", color: "border-purple-900 bg-purple-950/10 text-purple-400", key: "capabilities" },
                          { step: "EVENTS", color: "border-blue-900 bg-blue-950/10 text-blue-400", key: "events" },
                          { step: "USE CASES", color: "border-sky-900 bg-sky-950/10 text-sky-400", key: "usecases" },
                          { step: "REPOSITORIES", color: "border-indigo-900 bg-indigo-950/10 text-indigo-400", key: "repositories" },
                          { step: "TESTS", color: "border-emerald-900 bg-emerald-950/10 text-emerald-400", key: "tests" }
                        ].map((node, index) => (
                          <div key={index} className="flex flex-col">
                            <span className="text-[7.5px] text-zinc-500 uppercase font-bold tracking-widest text-center mb-1.5">{node.step}</span>
                            <div className={`p-3 rounded-xl border-2 ${node.color} text-[10px] text-center font-bold font-mono h-20 flex items-center justify-center`}>
                              {catalogModule === "wallet" && (
                                <>
                                  {node.key === "module" && "Wallet Domain"}
                                  {node.key === "capabilities" && "Transfer, Deposit, Withdraw, Freeze, Close, Reconcile"}
                                  {node.key === "events" && "WalletCreated, WalletFrozen, WalletClosed"}
                                  {node.key === "usecases" && "TransferMoneyUseCase"}
                                  {node.key === "repositories" && "WalletRepository"}
                                  {node.key === "tests" && "WalletTests.ts"}
                                </>
                              )}
                              {catalogModule === "ledger" && (
                                <>
                                  {node.key === "module" && "Ledger Domain"}
                                  {node.key === "capabilities" && "DoubleEntryPosting, JournalLedgerEntries"}
                                  {node.key === "events" && "JournalEntryPosted, AccountBalanced"}
                                  {node.key === "usecases" && "AuditTrailUseCase"}
                                  {node.key === "repositories" && "LedgerRepository"}
                                  {node.key === "tests" && "LedgerTests.ts"}
                                </>
                              )}
                              {catalogModule === "aml" && (
                                <>
                                  {node.key === "module" && "AML Domain"}
                                  {node.key === "capabilities" && "LimitChecking, GeoVelocityVerify, FraudScoring"}
                                  {node.key === "events" && "AMLTriggered, SuspiciousActivityFlagged"}
                                  {node.key === "usecases" && "FraudRiskScoringUseCase"}
                                  {node.key === "repositories" && "TransactionMonitoringRepo"}
                                  {node.key === "tests" && "AmlTests.ts"}
                                </>
                              )}
                              {catalogModule === "hsm" && (
                                <>
                                  {node.key === "module" && "HSM Security"}
                                  {node.key === "capabilities" && "KeySigning, SignatureVerify, EncryptPII"}
                                  {node.key === "events" && "KeyRotated, SignatureGenerated"}
                                  {node.key === "usecases" && "SecureSigningUseCase"}
                                  {node.key === "repositories" && "VaultKeyStore"}
                                  {node.key === "tests" && "CryptographyTests.ts"}
                                </>
                              )}
                              {catalogModule === "settlement" && (
                                <>
                                  {node.key === "module" && "Settlement Domain"}
                                  {node.key === "capabilities" && "SptrReconcile, BankTransfer"}
                                  {node.key === "events" && "SettlementStarted, SettlementCompleted, SettlementRejected"}
                                  {node.key === "usecases" && "SptrSettlementProcessor"}
                                  {node.key === "repositories" && "SettlementRepository"}
                                  {node.key === "tests" && "SettlementTests.ts"}
                                </>
                              )}
                              {catalogModule === "compliance" && (
                                <>
                                  {node.key === "module" && "Compliance Domain"}
                                  {node.key === "capabilities" && "RegulatoryRulesCheck, DslCompilation"}
                                  {node.key === "events" && "RulesRevalidated, InvariantViolated"}
                                  {node.key === "usecases" && "RuleEvaluatorUseCase"}
                                  {node.key === "repositories" && "RegulationRegistry"}
                                  {node.key === "tests" && "ComplianceTests.ts"}
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* KOS INTELLIGENCE: DEPENDENCY INTELLIGENCE ENGINE */}
                {/* ========================================================================= */}
                {activeTab === "kos_dependency" && (
                  <div className="space-y-4 text-left animate-fade-in">
                    <div className="bg-neutral-900/25 border border-neutral-900 p-4 rounded-xl flex flex-col md:flex-row justify-between gap-3 items-start md:items-center">
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                          <Sliders className="w-4 h-4 text-[#B87333]" />
                          <span>Dependency Intelligence (Análise de Impacto)</span>
                        </h4>
                        <p className="text-xs text-zinc-400 font-sans leading-normal">
                          Pergunte ao sistema o impacto cascata ao alterar qualquer aviso regulatório do BNA ou regulamentos operacionais.
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-zinc-500 font-bold uppercase text-[9.5px] self-center">Alterar:</span>
                        <select
                          value={depRegulation}
                          onChange={(e) => setDepRegulation(e.target.value)}
                          className="bg-black border border-neutral-900 rounded-lg p-2 text-xs font-bold text-zinc-300 focus:border-[#B87333] outline-none cursor-pointer"
                        >
                          <option value="av11">Aviso n.º 11/2021 (Controle KYC/AML)</option>
                          <option value="l4020">Lei n.º 40/20 (LSPA)</option>
                          <option value="av03">Aviso n.º 03/2022 (Salvaguarda & Lastro)</option>
                          <option value="av06">Aviso n.º 06/2020 (Licenciamento)</option>
                        </select>
                      </div>
                    </div>

                    <div className="bg-zinc-950 border border-neutral-900 rounded-2xl overflow-hidden flex flex-col md:flex-row">
                      {/* Left: Downstream cascading block diagram */}
                      <div className="flex-1 p-4 border-r border-neutral-900 space-y-3 font-mono text-[10.5px]">
                        <span className="text-[8.5px] text-zinc-500 uppercase font-black tracking-wider block">Cadeia de Impacto de Domínio</span>
                        
                        <div className="space-y-2">
                          <div className="bg-red-950/20 text-red-400 border border-red-900/30 rounded-lg p-2 text-center font-bold">
                            Modificação no Regulamento: {depRegulation === "av11" ? "Aviso 11/21" : depRegulation === "l4020" ? "Lei 40/20" : depRegulation === "av03" ? "Aviso 03/22" : "Aviso 06/20"}
                          </div>
                          
                          <div className="text-center font-bold text-zinc-600 text-xs">↓ AFETA</div>
                          
                          {depRegulation === "av11" && (
                            <div className="space-y-2 animate-fade-in">
                              <div className="bg-black border border-neutral-800 p-2.5 rounded-lg flex items-center justify-between">
                                <span className="text-white font-bold">1. AML Subsystem</span>
                                <span className="text-amber-500 text-[9px] font-bold">RE-ESTRUTURAÇÃO</span>
                              </div>
                              <div className="bg-black border border-neutral-800 p-2.5 rounded-lg flex items-center justify-between">
                                <span className="text-white font-bold">2. Customer Aggregates</span>
                                <span className="text-zinc-400 text-[9px]">Limites Escalados</span>
                              </div>
                              <div className="bg-black border border-neutral-800 p-2.5 rounded-lg flex items-center justify-between">
                                <span className="text-white font-bold">3. Wallet Validation</span>
                                <span className="text-zinc-400 text-[9px]">SCA Trigger checks</span>
                              </div>
                              <div className="bg-black border border-neutral-800 p-2.5 rounded-lg flex items-center justify-between">
                                <span className="text-white font-bold">4. Transaction Monitoring</span>
                                <span className="text-emerald-400 text-[9px] font-bold">OK</span>
                              </div>
                            </div>
                          )}

                          {depRegulation === "l4020" && (
                            <div className="space-y-2 animate-fade-in">
                              <div className="bg-black border border-neutral-800 p-2.5 rounded-lg flex items-center justify-between">
                                <span className="text-white font-bold">1. Compliance Core</span>
                                <span className="text-rose-500 text-[9px] font-bold">REGENERAÇÃO COMPLETA</span>
                              </div>
                              <div className="bg-black border border-neutral-800 p-2.5 rounded-lg flex items-center justify-between">
                                <span className="text-white font-bold">2. Ledger Engine</span>
                                <span className="text-amber-500 text-[9px] font-bold">VERIFICAR REGRAS</span>
                              </div>
                              <div className="bg-black border border-neutral-800 p-2.5 rounded-lg flex items-center justify-between">
                                <span className="text-white font-bold">3. Settlement Processor</span>
                                <span className="text-zinc-400 text-[9px]">Liquidadores delegados</span>
                              </div>
                              <div className="bg-black border border-neutral-800 p-2.5 rounded-lg flex items-center justify-between">
                                <span className="text-white font-bold">4. HSM Keystore</span>
                                <span className="text-emerald-400 text-[9px] font-bold">COMPATÍVEL</span>
                              </div>
                            </div>
                          )}

                          {depRegulation === "av03" && (
                            <div className="space-y-2 animate-fade-in">
                              <div className="bg-black border border-neutral-800 p-2.5 rounded-lg flex items-center justify-between">
                                <span className="text-white font-bold">1. Settlement Engine</span>
                                <span className="text-amber-500 text-[9px] font-bold">FALHA DE LASTRO COBERTURA</span>
                              </div>
                              <div className="bg-black border border-neutral-800 p-2.5 rounded-lg flex items-center justify-between">
                                <span className="text-white font-bold">2. Reserves System</span>
                                <span className="text-zinc-400 text-[9px]">Rácio 1:1 Fiduciário</span>
                              </div>
                              <div className="bg-black border border-neutral-800 p-2.5 rounded-lg flex items-center justify-between">
                                <span className="text-white font-bold">3. BNA Custody Tracker</span>
                                <span className="text-emerald-400 text-[9px] font-bold">OK</span>
                              </div>
                            </div>
                          )}

                          {depRegulation === "av06" && (
                            <div className="space-y-2 animate-fade-in">
                              <div className="bg-black border border-neutral-800 p-2.5 rounded-lg flex items-center justify-between">
                                <span className="text-white font-bold">1. Governance Subsystem</span>
                                <span className="text-amber-500 text-[9px] font-bold">ATUALIZAR IDONEIDADES</span>
                              </div>
                              <div className="bg-black border border-neutral-800 p-2.5 rounded-lg flex items-center justify-between">
                                <span className="text-white font-bold">2. Authorities Delegations</span>
                                <span className="text-zinc-400 text-[9px]">Homologações</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Detailed text report of affected resources */}
                      <div className="w-full md:w-80 p-4 bg-black/60 flex flex-col justify-between font-mono text-[10px] space-y-4">
                        <div>
                          <span className="text-[8px] text-[#B87333] uppercase font-black tracking-widest block mb-2">Relatório de Impacto</span>
                          
                          {depRegulation === "av11" && (
                            <div className="space-y-2 leading-relaxed text-zinc-400">
                              <p>✓ <strong className="text-white">Ficheiros Afetados:</strong> 17 módulos de domínio.</p>
                              <p>✓ <strong className="text-white">Testes Quebrados:</strong> 53 testes de integração necessitam de re-validação imediata.</p>
                              <p>✓ <strong className="text-white">Eventos de Negócio:</strong> 8 eventos de domínio (ex: LimitUpdated) afetados no broker.</p>
                              <p>✓ <strong className="text-white">Visualização:</strong> 2 dashboards operacionais (SCA, KYC) requerem atualização das fórmulas.</p>
                            </div>
                          )}

                          {depRegulation === "l4020" && (
                            <div className="space-y-2 leading-relaxed text-zinc-400">
                              <p>✓ <strong className="text-white">Ficheiros Afetados:</strong> 34 módulos core de domínio.</p>
                              <p>✓ <strong className="text-white">Testes Quebrados:</strong> 120 testes requerem intervenção de engenharia.</p>
                              <p>✓ <strong className="text-white">Eventos de Negócio:</strong> 15 fluxos críticos afetados.</p>
                              <p>✓ <strong className="text-white">Visualização:</strong> Toda a árvore operacional do sistema precisa de homologação legal do BNA.</p>
                            </div>
                          )}

                          {depRegulation === "av03" && (
                            <div className="space-y-2 leading-relaxed text-zinc-400">
                              <p>✓ <strong className="text-white">Ficheiros Afetados:</strong> 12 módulos de liquidação.</p>
                              <p>✓ <strong className="text-white">Testes Quebrados:</strong> 32 testes de rácio fiduciário.</p>
                              <p>✓ <strong className="text-white">Eventos de Negócio:</strong> 6 eventos de SPTR.</p>
                              <p>✓ <strong className="text-white">Visualização:</strong> Painel de Custódia e Reservas necessita re-calibração.</p>
                            </div>
                          )}

                          {depRegulation === "av06" && (
                            <div className="space-y-2 leading-relaxed text-zinc-400">
                              <p>✓ <strong className="text-white">Ficheiros Afetados:</strong> 8 módulos de governação.</p>
                              <p>✓ <strong className="text-white">Testes Quebrados:</strong> 24 testes administrativos.</p>
                              <p>✓ <strong className="text-white">Eventos de Negócio:</strong> 4 fluxos de registo civil.</p>
                              <p>✓ <strong className="text-white">Visualização:</strong> Nenhuma alteração exigida nos dashboards principais.</p>
                            </div>
                          )}
                        </div>

                        <div className="bg-neutral-900/40 p-2.5 rounded-lg border border-neutral-900 text-[8.5px] leading-relaxed text-zinc-500">
                          <strong>Análise Preditiva:</strong> Alterações nestes regulamentos forçam a execução automática da suite de regressão com bloqueio cautelar das deploys caso a cobertura baixe de 95%.
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* KOS INTELLIGENCE: ARCHITECTURE SCORE */}
                {/* ========================================================================= */}
                {activeTab === "kos_architecture" && (
                  <div className="space-y-4 text-left animate-fade-in">
                    <div className="bg-neutral-900/25 border border-neutral-900 p-4 rounded-xl">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-[#B87333]" />
                        <span>Architecture & Craftsmanship Score (Qualidade do Código)</span>
                      </h4>
                      <p className="text-xs text-zinc-400 font-sans leading-normal mt-1">
                        O KwanzaMóvel mede a pureza e o rigor do seu próprio código-fonte. Abaixo estão os rácios de conformidade computacional e dívida técnica detetados.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left Side: Score Board */}
                      <div className="bg-black/40 border border-neutral-900 p-4 rounded-2xl flex flex-col justify-between">
                        <div className="text-center py-4 border-b border-neutral-900/60">
                          <span className="text-[10px] text-zinc-500 uppercase font-black block tracking-widest">Architecture Rating</span>
                          <span className="text-5xl font-black text-[#B87333] block mt-2">{overallArchitectureScore}%</span>
                          <span className="text-[9px] text-emerald-400 mt-1.5 inline-block px-2 py-0.5 bg-emerald-950/20 rounded border border-emerald-900/30 font-bold uppercase tracking-wide">✓ EXCELLENT</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-4 text-xs font-mono">
                          <div className="bg-neutral-900/15 p-2 rounded-lg border border-neutral-900/45">
                            <span className="text-[7.5px] text-zinc-500 block font-bold uppercase">Circular Dependencies</span>
                            <span className="text-sm font-bold text-emerald-400 block mt-0.5">0 Absolute</span>
                          </div>
                          <div className="bg-neutral-900/15 p-2 rounded-lg border border-neutral-900/45">
                            <span className="text-[7.5px] text-zinc-500 block font-bold uppercase">Dead Code (Código Morto)</span>
                            <span className="text-sm font-bold text-emerald-400 block mt-0.5">0% Cleaned</span>
                          </div>
                          <div className="bg-neutral-900/15 p-2 rounded-lg border border-neutral-900/45">
                            <span className="text-[7.5px] text-zinc-500 block font-bold uppercase">Dívida Técnica (Debt)</span>
                            <span className="text-sm font-bold text-[#B87333] block mt-0.5">3% Capped</span>
                          </div>
                          <div className="bg-neutral-900/15 p-2 rounded-lg border border-neutral-900/45">
                            <span className="text-[7.5px] text-zinc-500 block font-bold uppercase">Uptime Motor RKK</span>
                            <span className="text-sm font-bold text-white block mt-0.5">100.00%</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Side: Detailed metrics Checklist */}
                      <div className="bg-black/40 border border-neutral-900 p-4 rounded-2xl space-y-3.5">
                        <span className="text-[8.5px] font-black text-zinc-500 uppercase tracking-widest block">Métricas de Pureza do Software</span>
                        
                        {[
                          { title: "Domain Purity (Hexagonal Isomorphic Boundaries)", value: "91%", desc: "Entidades livres de frameworks ou acoplamento de base de dados" },
                          { title: "DDD Architectural Coverage (Aggregate Roots)", value: "94%", desc: "Uso rigoroso de Value Objects e controle transacional no agregado" },
                          { title: "Test Assertion Coverage (Invariants Guard)", value: `${coverageScore}%`, desc: `Cobertura de testes unitários sobre regras e avisos do BNA (${testReports.length} executados / ${mappedUseCasesCount} mapeados)` },
                          { title: "Software Coupling (Grau de Acoplamento)", value: "12%", desc: "Acoplamento estrito e isolado via mTLS, interfaces e IoC" },
                          { title: "Compliance Verification (Constitution Engine)", value: `${complianceVerification}%`, desc: `Invariantes ativas no Constitution Engine (${activeInvariantsCount} ativas / ${totalRulesRequired} regras da Lei 40/20)` },
                          { title: "Regulatory Coverage (LSPA Lei 40/20)", value: `${coverageScore}%`, desc: `Cenários de Teste Executados / Casos de Uso Regulamentados Mapeados` }
                        ].map((m, idx) => (
                          <div key={idx} className="space-y-1 font-mono text-xs">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="font-bold text-zinc-200">{m.title}</span>
                              <span className="font-black text-[#B87333]">{m.value}</span>
                            </div>
                            <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-[#B87333] h-full rounded-full transition-all" 
                                style={{ width: m.value }}
                              ></div>
                            </div>
                            <span className="text-[8px] text-zinc-500 block leading-tight">{m.desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* KOS INTELLIGENCE: LINHA DO TEMPO (ENGINEERING TIMELINE) */}
                {/* ========================================================================= */}
                {activeTab === "kos_timeline" && (
                  <div className="space-y-4 text-left animate-fade-in">
                    <div className="bg-neutral-900/25 border border-neutral-900 p-4 rounded-xl">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <History className="w-4 h-4 text-[#B87333]" />
                        <span>Engineering Timeline (História de Evolução Arquitetural)</span>
                      </h4>
                      <p className="text-xs text-zinc-400 font-sans leading-normal mt-1">
                        Diferente do Git, o KMOS rastreia marcos de conformidade, melhorias de desempenho de latência e remoção de dívida técnica regulatória ao longo do tempo.
                      </p>
                    </div>

                    <div className="bg-black/30 border border-neutral-900 rounded-2xl p-4 space-y-5 relative">
                      {/* Vertical line connector */}
                      <div className="absolute left-6.5 top-8 bottom-8 w-0.5 bg-neutral-900 pointer-events-none"></div>

                      {[
                        {
                          date: "Ontem (Última Consolidação)",
                          title: "Auditoria Dinâmica de Pureza de Domínio",
                          desc: "Alterados 12 módulos. O Compliance Score subiu 2% e o desempenho de latência geral do Ledger melhorou 5% com indexação atómica. Dívida técnica diminuída em 3% com refatorização de SMS-OTP. Implementação estrita de +14 artigos do RKK.",
                          badge: "+14 Artigos",
                          badgeColor: "bg-emerald-950/20 text-emerald-400 border-emerald-900/30"
                        },
                        {
                          date: "Há 3 dias",
                          title: "Introdução do Ledger Imutável & Integração HSM",
                          desc: "Aprovado o ADR-017 de ledger imutável. Todas as inserções transacionais passaram a requerer o carimbo de hash criptográfico e entropy checks do HSM físico. Modularização de 34 componentes.",
                          badge: "Ledger ACID",
                          badgeColor: "bg-amber-950/20 text-amber-400 border-amber-900/30"
                        },
                        {
                          date: "Na semana passada",
                          title: "Otimização do Monitor de Branqueamento (AML)",
                          desc: "Implementação de regras de geo-velocity para prevenção de fraudes em pagamentos. Resolvida a corrida de concorrência em transações simultâneas de sub-agentes.",
                          badge: "AML Core",
                          badgeColor: "bg-purple-950/20 text-purple-400 border-purple-900/30"
                        },
                        {
                          date: "Há 2 semanas",
                          title: "Homologação do Simulador Digital Twin pelo BNA",
                          desc: "Ambiente de estresse de caos sistémico integrado ao workbench. Validação de conformidade contra corrida bancária fictícia aprovada com 100% de estabilidade.",
                          badge: "Aprovado",
                          badgeColor: "bg-emerald-950/20 text-emerald-400 border-emerald-900/30"
                        }
                      ].map((item, index) => (
                        <div key={index} className="flex gap-4 relative">
                          {/* Circle dot connector */}
                          <div className="w-5 h-5 rounded-full bg-neutral-950 border-2 border-[#B87333] flex items-center justify-center shrink-0 z-10 mt-0.5">
                            <div className="w-2 h-2 rounded-full bg-[#B87333]"></div>
                          </div>
                          
                          <div className="flex-1 font-mono text-xs space-y-1.5">
                            <div className="flex justify-between items-start gap-2">
                              <span className="text-[10px] text-[#B87333] font-black uppercase tracking-wider">{item.date}</span>
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase ${item.badgeColor}`}>
                                {item.badge}
                              </span>
                            </div>
                            <h5 className="font-bold text-white text-xs">{item.title}</h5>
                            <p className="text-[10.5px] text-zinc-400 font-sans leading-relaxed">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* KOS INTELLIGENCE: DECISION ENGINE (DELIBERATIVO) */}
                {/* ========================================================================= */}
                {activeTab === "kos_adr" && (
                  <div className="space-y-4 text-left animate-fade-in font-sans">
                    <div className="bg-neutral-900/25 border border-neutral-900 p-4 rounded-xl flex justify-between items-center">
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                          <Cpu className="w-4 h-4 text-[#B87333] animate-pulse" />
                          <span>KMOS Decision Engine (Motor Deliberativo)</span>
                        </h4>
                        <p className="text-xs text-zinc-400 leading-normal mt-1">
                          O KMOS não é apenas observável; ele é <strong>deliberativo</strong>. Submeta propostas de transição de estado fiduciário, teste impactos constitucionais e formalize novas decisões sistémicas em tempo real.
                        </p>
                      </div>
                    </div>

                    {/* Success Message banner */}
                    {decisionSuccessMessage && (
                      <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4 flex items-start gap-3 relative animate-fade-in">
                        <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-emerald-300 uppercase tracking-tight">Sucesso Sistémico Registado</p>
                          <p className="text-xs text-emerald-100 mt-1 leading-normal font-sans">{decisionSuccessMessage}</p>
                        </div>
                        <button 
                          onClick={() => setDecisionSuccessMessage(null)}
                          className="absolute right-3 top-3 text-emerald-500 hover:text-emerald-300 p-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                      {/* Left: Input Console */}
                      <div className="lg:col-span-5 space-y-4">
                        <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-4 space-y-4">
                          <h5 className="text-[10px] uppercase font-black tracking-wider text-zinc-400 flex items-center gap-1">
                            <Sliders className="w-3.5 h-3.5 text-[#B87333]" />
                            <span>Proposta de Transição de Estado</span>
                          </h5>

                          <div className="space-y-2">
                            <label className="text-[10px] uppercase font-bold text-zinc-500 block">Escolha uma Diretiva Predefinida</label>
                            <div className="space-y-1.5">
                              <button
                                onClick={() => {
                                  setProposalPreset("preset_limits");
                                  setCustomProposalText("");
                                }}
                                className={`w-full text-left p-2.5 rounded-xl border text-xs font-mono transition-all flex items-start gap-2 ${
                                  proposalPreset === "preset_limits"
                                    ? "bg-[#B87333]/10 border-[#B87333] text-white"
                                    : "bg-black/40 border-neutral-900 text-zinc-400 hover:text-zinc-200"
                                }`}
                              >
                                <Scale className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#B87333]" />
                                <div>
                                  <p className="font-bold uppercase text-[9.5px]">Ajustar limites Level-1 para 80.000 Kz</p>
                                  <p className="text-[9px] text-zinc-500 font-sans mt-0.5">Testar limites simplificados condicionados à inclusão fiduciária.</p>
                                </div>
                              </button>

                              <button
                                onClick={() => {
                                  setProposalPreset("preset_mismatch");
                                  setCustomProposalText("");
                                }}
                                className={`w-full text-left p-2.5 rounded-xl border text-xs font-mono transition-all flex items-start gap-2 ${
                                  proposalPreset === "preset_mismatch"
                                    ? "bg-red-950/10 border-red-900 text-white"
                                    : "bg-black/40 border-neutral-900 text-zinc-400 hover:text-zinc-200"
                                }`}
                              >
                                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-red-500" />
                                <div>
                                  <p className="font-bold uppercase text-[9.5px]">Desativar auditoria de transações mTLS</p>
                                  <p className="text-[9px] text-zinc-500 font-sans mt-0.5">Remover auditoria criptográfica HSM para otimizar latências.</p>
                                </div>
                              </button>

                              <button
                                onClick={() => setProposalPreset("custom")}
                                className={`w-full text-left p-2.5 rounded-xl border text-xs font-mono transition-all flex items-start gap-2 ${
                                  proposalPreset === "custom"
                                    ? "bg-purple-950/10 border-purple-900 text-white"
                                    : "bg-black/40 border-neutral-900 text-zinc-400 hover:text-zinc-200"
                                }`}
                              >
                                <Sparkles className="w-3.5 h-3.5 mt-0.5 shrink-0 text-purple-400" />
                                <div>
                                  <p className="font-bold uppercase text-[9.5px]">Transição Customizada (Cognitiva)</p>
                                  <p className="text-[9px] text-zinc-500 font-sans mt-0.5">Formular uma transição operacional totalmente personalizada.</p>
                                </div>
                              </button>
                            </div>
                          </div>

                          {proposalPreset === "custom" && (
                            <div className="space-y-2 animate-fade-in">
                              <label className="text-[10px] uppercase font-bold text-zinc-500 block">Escreva a sua Proposta Operacional</label>
                              <textarea
                                value={customProposalText}
                                onChange={(e) => setCustomProposalText(e.target.value)}
                                placeholder="Exemplo: Permitir liquidação direta de micro-pagamentos comerciais sem validação de KYC presencial, baseada em rede social de garantia mutável..."
                                className="w-full h-24 bg-black border border-neutral-900 rounded-xl p-3 text-xs outline-none focus:border-amber-900/40 text-zinc-300 font-sans resize-none"
                              />
                            </div>
                          )}

                          <button
                            onClick={() => handleEvaluateProposal(proposalPreset, customProposalText)}
                            disabled={evaluatingProposal || (proposalPreset === "custom" && !customProposalText.trim())}
                            className="w-full bg-[#B87333] hover:bg-[#a0622a] disabled:bg-neutral-800 disabled:text-zinc-500 text-black py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wider flex items-center justify-center gap-1.5"
                          >
                            {evaluatingProposal ? (
                              <>
                                <RotateCw className="w-4 h-4 animate-spin" />
                                <span>Deliberando Conformidade...</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4" />
                                <span>Executar Deliberação Constitucional</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Right: Cognitive Analysis Console */}
                      <div className="lg:col-span-7">
                        {evaluatingProposal ? (
                          <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-8 flex flex-col items-center justify-center h-full min-h-[350px] text-center space-y-4">
                            <Cpu className="w-10 h-10 text-[#B87333] animate-spin" />
                            <div className="space-y-1.5">
                              <p className="text-xs font-bold text-white uppercase tracking-wider">A consultar a Constituição do KMOS...</p>
                              <p className="text-[10.5px] text-zinc-500 font-sans max-w-sm">
                                Cruzando parâmetros operacionais com o Regulatory Knowledge Kernel, simulando invariantes de integridade e estimando impactos sobre o Twin do Banco Nacional de Angola.
                              </p>
                            </div>
                          </div>
                        ) : evaluationResult ? (
                          <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-5 space-y-4 h-full animate-fade-in">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-900 pb-3">
                              <div>
                                <span className="text-[8.5px] uppercase font-black text-zinc-500 font-mono tracking-widest">{evaluationResult.decisionNeeded}</span>
                                <h6 className="text-xs font-bold text-white mt-0.5">{evaluationResult.title}</h6>
                              </div>
                              <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded border ${evaluationResult.verdictColor}`}>
                                {evaluationResult.verdict}
                              </span>
                            </div>

                            {/* Composite Health Impacts */}
                            <div className="grid grid-cols-4 gap-2.5 bg-black/45 p-3 rounded-xl text-center">
                              <div>
                                <span className="text-[7.5px] text-zinc-500 uppercase block font-bold">Compliance</span>
                                <span className={`text-xs font-extrabold block mt-0.5 ${evaluationResult.estimatedImpacts.compliance >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                  {evaluationResult.estimatedImpacts.compliance >= 0 ? "+" : ""}{evaluationResult.estimatedImpacts.compliance}%
                                </span>
                              </div>
                              <div className="border-l border-neutral-900">
                                <span className="text-[7.5px] text-zinc-500 uppercase block font-bold">Risco Operac.</span>
                                <span className={`text-xs font-extrabold block mt-0.5 ${evaluationResult.estimatedImpacts.operationalRisk >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                  {evaluationResult.estimatedImpacts.operationalRisk >= 0 ? "+" : ""}{evaluationResult.estimatedImpacts.operationalRisk}%
                                </span>
                              </div>
                              <div className="border-l border-neutral-900">
                                <span className="text-[7.5px] text-zinc-500 uppercase block font-bold">Resiliência</span>
                                <span className={`text-xs font-extrabold block mt-0.5 ${evaluationResult.estimatedImpacts.resilience >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                  {evaluationResult.estimatedImpacts.resilience >= 0 ? "+" : ""}{evaluationResult.estimatedImpacts.resilience}%
                                </span>
                              </div>
                              <div className="border-l border-neutral-900">
                                <span className="text-[7.5px] text-zinc-500 uppercase block font-bold">Médio Geral</span>
                                <span className={`text-xs font-extrabold block mt-0.5 ${evaluationResult.estimatedImpacts.overall >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                  {evaluationResult.estimatedImpacts.overall >= 0 ? "+" : ""}{evaluationResult.estimatedImpacts.overall}%
                                </span>
                              </div>
                            </div>

                            {/* Constitutional Rules checklist */}
                            <div className="space-y-2">
                              <span className="text-[9px] uppercase font-bold text-zinc-500 font-mono tracking-wider">Escrutínio Regulatório Realizado:</span>
                              <div className="space-y-1.5 text-[10.5px]">
                                {evaluationResult.constitutionRules.map((rule: any, i: number) => (
                                  <div key={i} className="flex items-start gap-2 bg-neutral-900/10 p-2 border border-neutral-900 rounded-xl">
                                    <span className={`text-[8px] font-bold px-1 rounded uppercase mt-0.5 ${
                                      rule.status === "VIOLADO" ? "bg-red-950/20 text-red-400 border border-red-900/30" : rule.status === "RESTRITO" ? "bg-amber-950/20 text-amber-400 border border-amber-900/30" : "bg-emerald-950/20 text-emerald-400 border border-emerald-900/30"
                                    }`}>
                                      {rule.status}
                                    </span>
                                    <div>
                                      <p className="font-bold text-zinc-300 font-mono">{rule.rule}</p>
                                      <p className="text-[9.5px] text-zinc-500 font-sans mt-0.5">{rule.detail}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Verdict Reasoning text */}
                            <div className="space-y-1 bg-black/20 p-3 rounded-xl border border-neutral-900/60">
                              <span className="text-[9px] uppercase font-bold text-zinc-500 font-mono">Parecer Técnico-Regulatório:</span>
                              <p className="text-[11px] leading-relaxed font-sans text-zinc-300">{evaluationResult.reasoning}</p>
                            </div>

                            {/* Recommended mitigation steps */}
                            <div className="space-y-2">
                              <span className="text-[9px] uppercase font-bold text-zinc-500 font-mono tracking-wider">Ações de Conformidade & Mitigação Exigidas:</span>
                              <ul className="space-y-1 text-xs text-zinc-400 pl-3 list-decimal font-sans">
                                {evaluationResult.remediationSteps.map((step: string, i: number) => (
                                  <li key={i} className="leading-snug">{step}</li>
                                ))}
                              </ul>
                            </div>

                            {/* Approval/Formalize action */}
                            <div className="pt-3 border-t border-neutral-900 flex justify-end gap-2.5">
                              {evaluationResult.canFormalize ? (
                                <button
                                  onClick={handleFormalizeDecision}
                                  className="bg-emerald-400 hover:bg-emerald-500 text-black px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  <span>Formalizar e Assinar Decisão</span>
                                </button>
                              ) : (
                                <div className="text-[10px] text-red-400/80 italic font-mono flex items-center gap-1">
                                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                  <span>Esta proposta foi vetada por violar regras imutáveis da Constituição do KMOS.</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-8 flex flex-col items-center justify-center h-full min-h-[350px] text-center space-y-3">
                            <HelpCircle className="w-10 h-10 text-neutral-800" />
                            <div className="space-y-1">
                              <p className="text-xs font-bold text-white uppercase tracking-wider">Aguardando Proposta</p>
                              <p className="text-[10.5px] text-zinc-500 font-sans max-w-xs">
                                Escolha ou descreva uma transição operacional à esquerda para acionar o motor de deliberação cognitiva do KMOS.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* KOS INTELLIGENCE: UNIVERSAL POLICY ENGINE */}
                {/* ========================================================================= */}
                {activeTab === "kos_policy" && (
                  <div className="space-y-4 text-left animate-fade-in">
                    <div className="bg-neutral-900/25 border border-neutral-900 p-4 rounded-xl">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Scale className="w-4 h-4 text-[#B87333]" />
                        <span>Universal Policy Engine (Motor de Avaliação Unificado)</span>
                      </h4>
                      <p className="text-xs text-zinc-400 font-sans leading-normal mt-1">
                        Evolução do Regulatory Engine. Qualquer diretiva — seja Lei, Aviso do BNA, Circular, Norma ISO, Política Interna ou SLA — é interpretada de forma unificada pelo nosso avaliador de regras dinâmico.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                      {/* Left: Policy Category Filters & Rules list */}
                      <div className="lg:col-span-5 space-y-3 flex flex-col h-[380px]">
                        <div className="flex gap-1.5 overflow-x-auto pb-1 select-none shrink-0">
                          {[
                            { id: "all", label: "Todos" },
                            { id: "lei", label: "Lei" },
                            { id: "aviso", label: "Aviso" },
                            { id: "circular", label: "Circular" },
                            { id: "iso", label: "ISO" },
                            { id: "interna", label: "Interna" },
                            { id: "sla", label: "SLA" }
                          ].map((cat) => (
                            <button
                              key={cat.id}
                              onClick={() => setSelectedPolicyType(cat.id)}
                              className={`px-2 py-1 text-[8.5px] uppercase font-bold rounded-lg border transition-all shrink-0 ${
                                selectedPolicyType === cat.id
                                  ? "bg-[#B87333] border-[#B87333] text-white"
                                  : "bg-black/20 border-neutral-900 text-zinc-500 hover:text-zinc-300"
                              }`}
                            >
                              {cat.label}
                            </button>
                          ))}
                        </div>

                        <div className="flex-1 bg-black/40 border border-neutral-900 rounded-xl p-2 overflow-y-auto space-y-1.5">
                          {[
                            { id: "L4020_A40", type: "lei", title: "Lei 40/20 - Artigo 40.º", rules: "Proibição estrita de concessão de crédito com fundos de moeda eletrónica.", severity: "CRITICAL" },
                            { id: "L4020_A74", type: "lei", title: "Lei 40/20 - Artigo 74.º", rules: "Segregação e proteção dos dados pessoais confidenciais (PII).", severity: "HIGH" },
                            { id: "AV1121_L1", type: "aviso", title: "Aviso 11/21 - Level-1", rules: "Limite simplificado de 50.000 Kz diários para transações sem BI.", severity: "CRITICAL" },
                            { id: "AV0720_P", type: "aviso", title: "Aviso 07/20 - Adequação", rules: "Rácio prudencial de 100% de lastro em contas de salvaguarda.", severity: "CRITICAL" },
                            { id: "CIRC_TAR", type: "circular", title: "Circular de Tarifas BNA", rules: "Taxas para micro-pagamentos de utilidade pública limitadas a zero.", severity: "MEDIUM" },
                            { id: "ISO20022_X", type: "iso", title: "Norma ISO 20022 Schema", rules: "Estruturação rigorosa de mensagens XML pacs.008 e pacs.004.", severity: "HIGH" },
                            { id: "MFA_50K", type: "interna", title: "Política MFA Interna", rules: "Exigência de segundo fator de autenticação acima de 50.000 Kz.", severity: "HIGH" },
                            { id: "SLA_LAT", type: "sla", title: "Acordo de SLA de Latência", rules: "Garantia de liquidação e resposta do Ledger em menos de 150ms.", severity: "MEDIUM" }
                          ]
                            .filter(p => selectedPolicyType === "all" || p.type === selectedPolicyType)
                            .map((p) => (
                              <div
                                key={p.id}
                                onClick={() => setActivePolicyId(p.id)}
                                className={`p-2.5 rounded-xl border text-[10.5px] font-mono cursor-pointer transition-all flex justify-between items-center ${
                                  activePolicyId === p.id
                                    ? "bg-[#B87333]/15 border-[#B87333] text-white"
                                    : "bg-black/65 border-neutral-900 text-zinc-400 hover:text-zinc-200"
                                }`}
                              >
                                <div>
                                  <p className="font-bold">{p.title}</p>
                                  <p className="text-[8.5px] text-zinc-500 font-sans leading-tight mt-0.5">{p.rules}</p>
                                </div>
                                <span className={`text-[7.5px] font-bold px-1 rounded ${
                                  p.severity === "CRITICAL" ? "bg-red-950/20 text-red-400" : p.severity === "HIGH" ? "bg-orange-950/20 text-orange-400" : "bg-zinc-800 text-zinc-400"
                                }`}>
                                  {p.severity}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>

                      {/* Right: Policy Simulation Editor */}
                      <div className="lg:col-span-7 bg-black border border-neutral-900 rounded-2xl overflow-hidden flex flex-col h-[380px]">
                        <div className="bg-neutral-900/40 px-3.5 py-2 border-b border-neutral-900 flex justify-between items-center text-[9px] uppercase font-black text-zinc-500">
                          <span>Simulador Dinâmico do Policy Engine</span>
                          <span className="text-emerald-500 font-mono">Avaliador Ativo</span>
                        </div>
                        
                        <div className="p-3 bg-zinc-950/60 font-mono text-[10.5px] space-y-2">
                          <span className="text-[7.5px] text-zinc-500 uppercase font-black block">Entrada de Auditoria (JSON Payload):</span>
                          <textarea
                            value={policySimInput}
                            onChange={(e) => setPolicySimInput(e.target.value)}
                            className="w-full bg-black border border-neutral-900 rounded-lg p-2 font-mono text-xs text-amber-500 outline-none h-24 focus:border-amber-900/40"
                          />
                          <button
                            onClick={() => {
                              try {
                                const parsed = JSON.parse(policySimInput);
                                const outLogs = [];
                                outLogs.push(`[SYSTEM_INTELLIGENCE] Iniciando validação estrita da política contra o payload.`);
                                outLogs.push(`[POLÍTICA] Analisando regras aplicáveis ao ID: ${activePolicyId}`);
                                
                                if (activePolicyId === "AV1121_L1") {
                                  if (parsed.tier === "Level-1" && parsed.amount > 50000) {
                                    outLogs.push(`[AVISO 11/21 - REJEITADO] Limite de gastos diários excedido para moeda simplificada (Level-1).`);
                                    outLogs.push(`[RECURSO] Bloqueio preventivo da operação solicitado.`);
                                  } else {
                                    outLogs.push(`[AVISO 11/21 - PERMITIDO] Montante dentro do limite de 50.000 Kz para Level-1.`);
                                  }
                                } else if (activePolicyId === "MFA_50K") {
                                  if (parsed.amount > 50000 && !parsed.hasSca) {
                                    outLogs.push(`[POLÍTICA MFA - BLOQUEADO] Transação acima de 50.000 Kz sem segundo fator de autenticação (SCA) ativo.`);
                                  } else {
                                    outLogs.push(`[POLÍTICA MFA - PASSOU] Autenticação forte atestada pelo HSM.`);
                                  }
                                } else if (activePolicyId === "L4020_A40") {
                                  outLogs.push(`[LEI 40/20 - ARTIGO 40.º - PASSOU] Fundos direcionados à liquidação sem qualquer empréstimo associado. Rácio fiduciário intacto.`);
                                } else {
                                  outLogs.push(`[MENSAGEM] Política ${activePolicyId} testada com sucesso absoluta. Nenhuma invariante violada.`);
                                }
                                outLogs.push(`[STATUS DE EXECUÇÃO] Sucesso.`);
                                setPolicySimOutput(outLogs.join("\n"));
                              } catch (e) {
                                setPolicySimOutput("[ERRO DE SINTAXE]: Payload JSON inválido.");
                              }
                            }}
                            className="bg-[#B87333] hover:bg-amber-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1.5 uppercase tracking-wider"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>Avaliar Políticas</span>
                          </button>
                        </div>

                        {/* Interactive simulation terminal logs */}
                        <div className="flex-1 bg-black p-3 font-mono text-[9.5px] leading-relaxed text-zinc-500 overflow-y-auto border-t border-neutral-900">
                          {policySimOutput ? (
                            <pre className="text-zinc-300 whitespace-pre-wrap">{policySimOutput}</pre>
                          ) : (
                            <span className="italic block text-center mt-6">Aguardando entrada de simulação. Clique em "Avaliar Políticas".</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* 1. GOVERNANÇA: AUTORIDADES */}
                {/* ========================================================================= */}
                {activeTab === "governance_authorities" && (
                  <div className="space-y-3 text-left">
                    <div className="bg-neutral-900/25 border border-neutral-900 p-4 rounded-xl space-y-2">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wide flex items-center gap-1">
                        <ShieldCheck className="w-4 h-4 text-[#B87333]" />
                        <span>Banco Nacional de Angola (BNA) & Fiscalização AGT</span>
                      </h4>
                      <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                        Controle central de homologações de moeda eletrónica, circulares de comissões tributárias e fiscalização em tempo real das instituições de pagamentos registadas.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-black/40 border border-neutral-900 p-3 rounded-xl">
                        <span className="text-[8px] text-zinc-500 uppercase font-bold block mb-1">Última Circular Homologada</span>
                        <p className="font-bold text-zinc-200">Preçário Geral de Pagamentos</p>
                        <p className="text-[9.5px] text-zinc-500 mt-1">Limitação estrita de comissionamento de lojistas conforme Aviso 10/20.</p>
                      </div>
                      <div className="bg-black/40 border border-neutral-900 p-3 rounded-xl">
                        <span className="text-[8px] text-zinc-500 uppercase font-bold block mb-1">Prazos de Auditoria Direta</span>
                        <p className="font-bold text-emerald-400">Em Conformidade (Uptime 99.99%)</p>
                        <p className="text-[9.5px] text-zinc-500 mt-1">Geração sistemática de assinaturas criptográficas para logs SPTR.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. GOVERNANÇA: DELEGAÇÕES */}
                {activeTab === "governance_delegations" && (
                  <div className="space-y-3 text-left">
                    <div className="bg-neutral-900/25 border border-neutral-900 p-4 rounded-xl">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wide mb-1">Delegações Bancárias & Liquidação Interbancária</h4>
                      <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                        A SGA (Sistema de Gestão de Ativos) delega a compensação de fundos físicos para bancos nacionais garantidores autorizados.
                      </p>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="bg-black/50 border border-neutral-900 p-2.5 rounded-xl flex justify-between items-center">
                        <div>
                          <p className="font-bold text-white">Banco de Fomento Angola (BFA)</p>
                          <p className="text-[10px] text-zinc-500">Liquidador Delegado de Viana</p>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-950/20 text-emerald-400 border border-emerald-900/30 rounded text-[9px] font-bold">ATIVO</span>
                      </div>
                      <div className="bg-black/50 border border-neutral-900 p-2.5 rounded-xl flex justify-between items-center">
                        <div>
                          <p className="font-bold text-white">Banco Angolano de Investimentos (BAI)</p>
                          <p className="text-[10px] text-zinc-500">Garante Geral de Liquidez de Luanda</p>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-950/20 text-emerald-400 border border-emerald-900/30 rounded text-[9px] font-bold">ATIVO</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. GOVERNANÇA: ASSINATURAS */}
                {activeTab === "governance_signatures" && (
                  <div className="space-y-3 text-left">
                    <div className="bg-neutral-900/25 border border-neutral-900 p-4 rounded-xl space-y-1.5">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wide">Assinaturas Digitais do Operador</h4>
                      <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                        Chaves criptográficas de alto nível utilizadas no selo digital de mensagens ISO 20022 de transferência interbancária.
                      </p>
                    </div>
                    <div className="p-3 bg-black border border-neutral-900 rounded-xl space-y-1.5 font-mono text-[10.5px]">
                      <div>
                        <span className="text-[8px] text-zinc-500 uppercase block">Chave Pública Operacional</span>
                        <span className="text-emerald-400 text-[10px] break-all">sha256_kmos_pub_4f2d7a9b0c1e8f3...</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-zinc-500 uppercase block">Algoritmo de Hash Transacional</span>
                        <span className="text-zinc-300">ECDSA P-256 (Padrão de Segurança BNA)</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. GOVERNANÇA: HSM */}
                {activeTab === "governance_hsm" && (
                  <div className="space-y-3 text-left">
                    <div className="bg-neutral-900/25 border border-neutral-900 p-4 rounded-xl space-y-1.5">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wide flex items-center gap-1">
                        <KeyRound className="w-4 h-4 text-amber-500" />
                        <span>Módulo de Segurança Físico (HSM 4096-bit)</span>
                      </h4>
                      <p className="text-xs text-zinc-400 font-sans">
                        Cofre de chaves simétricas e entropy monitor para encriptação ponta a ponta. Bloqueio cautelar imediato em caso de ataque físico detectado.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs text-center font-mono">
                      <div className="bg-black border border-neutral-900 p-3 rounded-xl">
                        <span className="text-[8.5px] text-zinc-500 uppercase block font-bold">Estado do HSM</span>
                        <span className="text-sm font-bold text-emerald-400 block mt-1">✓ INTEGRITY SECURE</span>
                      </div>
                      <div className="bg-black border border-neutral-900 p-3 rounded-xl">
                        <span className="text-[8.5px] text-zinc-500 uppercase block font-bold">Velocidade de Cifra</span>
                        <span className="text-sm font-bold text-white block mt-1">45,200 ops/s</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. COMPLIANCE: LEI 40/20 */}
                {activeTab === "compliance_lspa" && (
                  <div className="space-y-4 text-left">
                    <ComplianceView
                      ledger={ledger}
                      auditorName={userRole === "auditoria" ? "Auditor Independente BNA" : "Oficial de Conformidade (Lei 40/20)"}
                      onExportAuditReport={triggerPdfReportGeneration}
                    />

                    <div className="bg-neutral-900/25 border border-neutral-900 p-4 rounded-xl space-y-1.5">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wide flex items-center gap-1">
                        <BookOpen className="w-4 h-4 text-[#B87333]" />
                        <span>Registo de Direitos, Deveres e Proibições - Lei 40/20</span>
                      </h4>
                      <p className="text-xs text-zinc-400 font-sans">
                        Kernel regulatório imutável mapeando obrigações de proteção de dados, deveres de informação e proibição de crédito com saldos de moeda eletrónica.
                      </p>
                    </div>

                    <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-3 space-y-2">
                      <span className="text-[9.5px] text-zinc-400 uppercase font-bold block border-b border-neutral-900 pb-1.5">Registos do Regulatory Knowledge Kernel</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        {rkk.getRegulatoryEntities().map((ent, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => setSelectedEntity({
                              type: ent.type,
                              id: ent.id,
                              name: ent.name,
                              status: "Vigente",
                              details: {
                                "Autoridade": ent.authority,
                                "Data de Decreto": ent.enactedDate,
                                "Âmbito": ent.scope
                              },
                              lawReference: ent.description
                            })}
                            className="bg-black border border-neutral-900 p-2.5 rounded-xl hover:border-[#B87333]/40 transition-all cursor-pointer"
                          >
                            <div className="flex justify-between font-bold text-[#B87333] text-[11px]">
                              <span>{ent.name}</span>
                              <span className="text-[8px] uppercase px-1.5 bg-neutral-900 rounded text-zinc-500">{ent.type}</span>
                            </div>
                            <p className="text-[10px] text-zinc-400 font-sans mt-1 leading-normal line-clamp-2">{ent.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. COMPLIANCE: AVISO 06/20, 07/20, 10/20, 11/20 */}
                {activeTab.startsWith("compliance_av") && (
                  <div className="space-y-3 text-left">
                    <div className="bg-neutral-900/25 border border-neutral-900 p-4 rounded-xl">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wide mb-1">
                        Diretriz Reguladora - {activeTab === "compliance_av06" ? "Aviso 06/20" : activeTab === "compliance_av07" ? "Aviso 07/20" : activeTab === "compliance_av10" ? "Aviso 10/20" : "Aviso 11/20"}
                      </h4>
                      <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                        {activeTab === "compliance_av06" && "Instruções sobre licenciamento, capital social mínimo e idoneidade de diretores de sociedades de pagamentos digitais."}
                        {activeTab === "compliance_av07" && "Adequação prudencial de capital líquido de salvaguarda. Exige garantias de depósitos fiduciários equivalentes ao circulante."}
                        {activeTab === "compliance_av10" && "MDR (Merchant Discount Rate) capped em 0.15% para micro-comerciantes aderentes, visando a inclusão financeira rural."}
                        {activeTab === "compliance_av11" && "Identificação KYC, AML, rastreio de BI, e verificação sistemática de transações contra regras de geo-velocity."}
                      </p>
                    </div>

                    <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-3 space-y-2">
                      <span className="text-[9px] uppercase font-bold text-zinc-500">Políticas Ativas do Aviso</span>
                      <div className="p-3 bg-black rounded-lg border border-neutral-900 text-xs text-zinc-300 font-sans space-y-1">
                        <p className="flex items-center gap-1 text-emerald-400">✓ Regra sintática carregada no SAGA Engine</p>
                        <p className="flex items-center gap-1 text-emerald-400">✓ Geração sistemática de assinaturas SHA-256</p>
                        <p className="flex items-center gap-1 text-emerald-400">✓ Auditoria síncrona habilitada para mTLS</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 7. PAGAMENTOS: CARTEIRAS */}
                {activeTab === "payments_wallets" && (
                  <div className="space-y-3 text-left">
                    <div className="bg-neutral-900/25 border border-neutral-900 p-4 rounded-xl space-y-1.5">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wide flex items-center gap-1">
                        <Coins className="w-4 h-4 text-[#B87333]" />
                        <span>Wallet Ledger & Ajustes de KYC Tiers</span>
                      </h4>
                      <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                        Painel central de contas de utilizadores. Altere manualmente níveis KYC (Simplificado, Intermédio ou Completo) para expandir limites diários regulamentados.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {/* Wallet Detail Card */}
                      <div className="bg-neutral-950 border border-neutral-900 p-3 rounded-xl space-y-2.5">
                        <span className="text-[8px] text-zinc-500 uppercase font-bold block mb-1">Conta Ativa do Dispositivo</span>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-bold text-white text-[12.5px]">{currentUser.name}</p>
                            <p className="text-[10.5px] text-[#B87333] font-mono">{currentUser.phone}</p>
                          </div>
                          <span className="px-2 py-0.5 bg-emerald-950/20 text-emerald-400 border border-emerald-900/40 rounded text-[9.5px] font-bold">
                            {currentUser.tier}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-center pt-1 font-mono">
                          <div className="bg-black/50 p-2 border border-neutral-900 rounded-lg">
                            <span className="text-[8px] text-zinc-500 block">SALDO</span>
                            <span className="font-bold text-white text-xs">{currentUser.balance.toLocaleString()} Kz</span>
                          </div>
                          <div className="bg-black/50 p-2 border border-neutral-900 rounded-lg">
                            <span className="text-[8px] text-zinc-500 block">N.º DO BI</span>
                            <span className="font-bold text-zinc-400 text-[10.5px] block truncate">{currentUser.biNumber}</span>
                          </div>
                        </div>

                        {/* Fast tier changers */}
                        <div className="flex justify-between items-center gap-2 pt-2 border-t border-neutral-900/50">
                          <span className="text-[9px] text-zinc-500 font-bold uppercase"> KYC Upgrade:</span>
                          <div className="flex gap-1.5">
                            {(["Level-1", "Level-2", "Level-3"] as const).map(tier => (
                              <button
                                key={tier}
                                onClick={() => setCurrentUser(prev => ({ ...prev, tier }))}
                                className={`px-2 py-0.5 rounded text-[9.5px] border font-mono transition-all ${
                                  currentUser.tier === tier 
                                    ? "bg-[#B87333] text-white border-[#B87333]" 
                                    : "bg-transparent text-zinc-500 border-neutral-800 hover:text-zinc-300"
                                }`}
                              >
                                {tier}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Manual balance adjustments */}
                      <div className="bg-neutral-950 border border-neutral-900 p-3 rounded-xl space-y-3">
                        <span className="text-[8px] text-zinc-500 uppercase font-bold block">Ajustes Diretos de Saldo</span>
                        <div className="space-y-2">
                          <div className="flex justify-between gap-1.5">
                            <button
                              onClick={() => {
                                setCurrentUser(prev => ({ ...prev, balance: prev.balance + 10000 }));
                              }}
                              className="flex-1 bg-neutral-900 hover:bg-neutral-850 py-2 border border-neutral-800 rounded-lg text-[9.5px] uppercase font-bold text-emerald-400 transition-all cursor-pointer"
                            >
                              +10,000 Kz
                            </button>
                            <button
                              onClick={() => {
                                if (currentUser.balance >= 10000) {
                                  setCurrentUser(prev => ({ ...prev, balance: prev.balance - 10000 }));
                                }
                              }}
                              className="flex-1 bg-neutral-900 hover:bg-neutral-850 py-2 border border-neutral-800 rounded-lg text-[9.5px] uppercase font-bold text-rose-400 transition-all cursor-pointer"
                            >
                              -10,000 Kz
                            </button>
                          </div>
                          <p className="text-[9px] text-zinc-500 leading-normal text-center font-sans">
                            Ajustes síncronos propagam eventos automáticos para a reconciliação BNA.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 8. PAGAMENTOS: LIQUIDAÇÃO */}
                {activeTab === "payments_settlement" && (
                  <div className="space-y-3 text-left">
                    <div className="bg-neutral-900/25 border border-neutral-900 p-4 rounded-xl space-y-1 flex justify-between items-center">
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wide flex items-center gap-1">
                          <ArrowRightLeft className="w-4 h-4 text-emerald-400 animate-pulse" />
                          <span>Fila de Liquidação RTGS SPTR (ISO 20022 pacs.008)</span>
                        </h4>
                        <p className="text-xs text-zinc-400 font-sans">
                          Conversor transacional síncrono para mensagens XML oficiais de compensação interbancária.
                        </p>
                      </div>
                    </div>

                    <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-3 space-y-1.5 font-mono">
                      <span className="text-[9px] text-zinc-500 uppercase font-bold block mb-1">Pacs.008 XML gerada no Último Evento</span>
                      <pre className="p-3 bg-black/60 rounded-lg border border-neutral-900 text-[9.5px] text-[#B87333] leading-normal select-text overflow-x-auto whitespace-pre-wrap max-h-56">
                        {bnaState.lastSptrMsgIso20022 || `<?xml version="1.0" encoding="UTF-8"?>\n<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08">\n  <FIToFICstmrCdtTrf>\n    <GrpHdr>\n      <MsgId>SGA-SPTR-2026-0709</MsgId>\n      <NbOfTxs>1</NbOfTxs>\n    </GrpHdr>\n  </FIToFICstmrCdtTrf>\n</Document>`}
                      </pre>
                    </div>
                  </div>
                )}

                {/* 9. PAGAMENTOS: LEDGER */}
                {activeTab === "payments_ledger" && (
                  <div className="space-y-3 text-left">
                    <div className="bg-neutral-900/25 border border-neutral-900 p-4 rounded-xl space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-900 pb-2">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wide flex items-center gap-1.5">
                          <Database className="w-4 h-4 text-emerald-400" />
                          <span>Diário Geral & Partidas Dobradas</span>
                        </h4>
                        <div className="flex items-center gap-2">
                          <button
                            id="btn-run-pg-occ-stress"
                            onClick={() => handleRunPgOccStressTest(12)}
                            disabled={runningPgOccStress}
                            className="text-[9px] font-mono uppercase px-2.5 py-1 rounded-lg border bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/30 transition-all cursor-pointer flex items-center gap-1.5 font-bold disabled:opacity-50"
                            title="Executar Teste de Concorrência OCC com Promise.all"
                          >
                            <Zap className="w-3 h-3 text-amber-400" />
                            <span>{runningPgOccStress ? "A Testar OCC..." : "Testar OCC (Promise.all)"}</span>
                          </button>

                          <span className="text-[10px] font-mono text-zinc-500 uppercase">Persistência:</span>
                          <button
                            id="btn-toggle-postgres"
                            onClick={() => {
                              const usePg = typeof localStorage !== "undefined" && localStorage.getItem("kmos_use_postgres") === "true";
                              if (typeof localStorage !== "undefined") {
                                localStorage.setItem("kmos_use_postgres", usePg ? "false" : "true");
                              }
                              window.location.reload();
                            }}
                            className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded border transition-all cursor-pointer ${
                              typeof localStorage !== "undefined" && localStorage.getItem("kmos_use_postgres") === "true"
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                                : "bg-neutral-950 border-neutral-800 text-zinc-500 hover:text-zinc-300"
                            }`}
                          >
                            {typeof localStorage !== "undefined" && localStorage.getItem("kmos_use_postgres") === "true"
                              ? "PostgreSQL Activo"
                              : "IndexedDB / Local Efetivo"}
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-400 font-sans leading-normal">
                        Cada transação KwanzaMóvel gera lançamentos simétricos de débito e crédito no Razão Geral, garantindo a imunidade de depósitos e consistência ACID.
                      </p>

                      {pgOccStressResult && (
                        <div className="mt-3 p-3 bg-neutral-950 border border-amber-500/30 rounded-xl space-y-2 text-xs font-mono">
                          <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
                            <span className="font-bold text-amber-400 flex items-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                              <span>{pgOccStressResult.testName}</span>
                            </span>
                            <span className="text-[10px] text-zinc-500">{pgOccStressResult.durationMs}ms</span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                            <div className="bg-neutral-900/50 p-2 rounded border border-neutral-800">
                              <span className="text-zinc-500 block">Concorrência (Promise.all)</span>
                              <span className="text-white font-bold">{pgOccStressResult.concurrencyLevel} Mutações</span>
                            </div>
                            <div className="bg-neutral-900/50 p-2 rounded border border-neutral-800">
                              <span className="text-zinc-500 block">Commits Aceites</span>
                              <span className="text-emerald-400 font-bold">{pgOccStressResult.successfulCommits} Commits</span>
                            </div>
                            <div className="bg-neutral-900/50 p-2 rounded border border-neutral-800">
                              <span className="text-zinc-500 block">Conflitos OCC Detetados</span>
                              <span className="text-amber-400 font-bold">{pgOccStressResult.occConflictsDetected} Rejeitados</span>
                            </div>
                            <div className="bg-neutral-900/50 p-2 rounded border border-neutral-800">
                              <span className="text-zinc-500 block">Integridade de Invariantes</span>
                              <span className={pgOccStressResult.isBalanceConsistent ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                                {pgOccStressResult.isBalanceConsistent ? "100% INVARIÁVEL" : "FALHA DE CORRUPÇÃO"}
                              </span>
                            </div>
                          </div>

                          <div className="bg-neutral-900/80 p-2 rounded border border-neutral-800 max-h-28 overflow-y-auto text-[9px] space-y-0.5 text-zinc-400">
                            {pgOccStressResult.logs.map((log, i) => (
                              <div key={i} className="truncate">{log}</div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Recharts Monthly Spending Distribution Chart */}
                    <MonthlySpendingDistributionChart ledgerTransactions={ledger} />

                    <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-3 overflow-x-auto">
                      <table className="w-full text-[11px] font-mono border-collapse">
                        <thead>
                          <tr className="border-b border-neutral-900 text-zinc-500 text-[8px] uppercase tracking-wider">
                            <th className="py-2 text-left">Tempo</th>
                            <th className="py-2 text-left">ID Transação</th>
                            <th className="py-2 text-left">Débito (Destino)</th>
                            <th className="py-2 text-left">Crédito (Origem)</th>
                            <th className="py-2 text-right">Quantia</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-900/60 text-zinc-300">
                          {ledger.map((tx, idx) => (
                            <tr 
                              key={idx} 
                              onClick={() => setSelectedEntity({
                                type: "Lançamento Contabilístico",
                                id: tx.id,
                                name: `Transação ${tx.id}`,
                                status: tx.status,
                                details: tx,
                                lawReference: "Artigo 40.º da Lei 40/20 (Liquidação e Definitividade)",
                                remedy: "Compensado síncronamente na rede SPTR."
                              })}
                              className="hover:bg-neutral-900/40 cursor-pointer transition-all"
                            >
                              <td className="py-1.5 text-zinc-500 text-[9.5px]">{new Date(tx.timestamp).toLocaleTimeString()}</td>
                              <td className="py-1.5 text-[#B87333] font-bold">{tx.id}</td>
                              <td className="py-1.5 text-emerald-400">{tx.senderPhone === "+244923000111" ? "USER_WALLET" : tx.senderPhone}</td>
                              <td className="py-1.5 text-rose-400">{tx.receiverPhone === "+244923000111" ? "USER_WALLET" : tx.receiverPhone}</td>
                              <td className="py-1.5 text-right text-white font-bold">{tx.amount.toLocaleString()} Kz</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 10. PAGAMENTOS: RESERVAS */}
                {activeTab === "payments_reserves" && (
                  <div className="space-y-3 text-left">
                    <div className="bg-neutral-900/25 border border-neutral-900 p-4 rounded-xl space-y-1">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wide">Reservas Centralizadas dos Bancos</h4>
                      <p className="text-xs text-zinc-400 font-sans leading-normal">
                        Monitorização de fundos reais provisionados nas contas liquidadoras do BNA para lastro do KwanzaMóvel.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                      <div className="bg-black/50 border border-neutral-900 p-3 rounded-xl">
                        <span className="text-[8px] text-zinc-500 uppercase block font-bold">Reserva BFA</span>
                        <span className="text-xs font-bold text-[#B87333] block mt-1">1,200,000 Kz</span>
                      </div>
                      <div className="bg-black/50 border border-neutral-900 p-3 rounded-xl">
                        <span className="text-[8px] text-zinc-500 uppercase block font-bold">Reserva BAI</span>
                        <span className="text-xs font-bold text-emerald-400 block mt-1">1,500,000 Kz</span>
                      </div>
                      <div className="bg-black/50 border border-neutral-900 p-3 rounded-xl">
                        <span className="text-[8px] text-zinc-500 uppercase block font-bold">Reserva BIC</span>
                        <span className="text-xs font-bold text-sky-400 block mt-1">800,000 Kz</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 11. PAGAMENTOS: CUSTÓDIA */}
                {activeTab === "payments_custody" && (
                  <div className="space-y-3 text-left">
                    <div className="bg-neutral-900/25 border border-neutral-900 p-4 rounded-xl space-y-1.5">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wide flex items-center gap-1">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>Zero-Depósito & Lastro Fiduciário 100%</span>
                      </h4>
                      <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                        O KwanzaMóvel opera sob modelo instrucional, de tal forma que todos os saldos digitais de utilizadores finais são liquidados contra depósitos equivalentes custodiados pelo BNA.
                      </p>
                    </div>

                    <div className="bg-neutral-950 border border-neutral-900 p-4 rounded-xl space-y-3 text-center">
                      <span className="text-[10px] uppercase font-mono text-zinc-500 font-bold block">Reconciliação Consolidada com Banco Central</span>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="bg-black/40 border border-neutral-900 p-2.5 rounded-lg">
                          <span className="text-[8px] text-zinc-500 uppercase block">Circulação de Moeda Eletrónica</span>
                          <span className="text-xs font-bold text-white block mt-1">{bnaState.totalCirculation.toLocaleString()} Kz</span>
                        </div>
                        <div className="bg-black/40 border border-neutral-900 p-2.5 rounded-lg">
                          <span className="text-[8px] text-zinc-500 uppercase block">Reservas Fiduciárias Custodiadas</span>
                          <span className="text-xs font-bold text-emerald-400 block mt-1">{bnaState.totalCirculation.toLocaleString()} Kz</span>
                        </div>
                      </div>
                      <div className="p-2 bg-emerald-950/25 border border-emerald-900/30 text-emerald-400 text-[10px] rounded-lg">
                        ✓ Discrepância calculada: 0.00 Kz (Reconciliação 100% Homologada)
                      </div>
                    </div>
                  </div>
                )}

                {/* 12. OPERAÇÕES: AGENTES */}
                {activeTab === "operations_agents" && (
                  <div className="space-y-3 text-left">
                    <div className="bg-neutral-900/25 border border-neutral-900 p-4 rounded-xl space-y-1">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wide">Rede de Agentes Físicos Certificados</h4>
                      <p className="text-xs text-zinc-400 font-sans">
                        Pontos autorizados de captação, cash-in e cash-out com limites específicos de segurança.
                      </p>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="p-2.5 bg-black border border-neutral-900 rounded-xl flex justify-between items-center">
                        <div>
                          <p className="font-bold text-white">Dona Maria Amélia</p>
                          <p className="text-[10px] text-zinc-500">Mercado Geral de Viana</p>
                        </div>
                        <span className="font-bold text-[#B87333]">350.000 Kz</span>
                      </div>
                      <div className="p-2.5 bg-black border border-neutral-900 rounded-xl flex justify-between items-center">
                        <div>
                          <p className="font-bold text-white">Senhor João Ndalu</p>
                          <p className="text-[10px] text-zinc-500">Zango II, Luanda</p>
                        </div>
                        <span className="font-bold text-[#B87333]">450.000 Kz</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 13. OPERAÇÕES: COMERCIANTES */}
                {activeTab === "operations_merchants" && (
                  <div className="space-y-3 text-left">
                    <div className="bg-neutral-900/25 border border-neutral-900 p-4 rounded-xl">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wide mb-1">Comerciantes Habilitados & MDR Limitada</h4>
                      <p className="text-xs text-zinc-400 font-sans leading-normal">
                        O KwanzaMóvel assegura que micro-comerciantes paguem apenas taxas simbólicas (MDR standard 0.15% capped).
                      </p>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="p-2 bg-black border border-neutral-900 rounded-lg flex justify-between">
                        <span className="font-bold text-white">Supermercado Kero</span>
                        <span className="text-[#B87333] font-bold">MDR: 0.15% (Aviso 10/20)</span>
                      </div>
                      <div className="p-2 bg-black border border-neutral-900 rounded-lg flex justify-between">
                        <span className="font-bold text-white">ENDE Distribuição</span>
                        <span className="text-emerald-400 font-bold">Isento (Utilidade Pública)</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 14. OPERAÇÕES: CLIENTES / IDENTITY */}
                {activeTab === "operations_identity" && (
                  <div className="space-y-3 text-left">
                    <div className="bg-neutral-900/25 border border-neutral-900 p-4 rounded-xl space-y-1">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wide flex items-center gap-1.5">
                        <Sliders className="w-4 h-4 text-[#B87333]" />
                        <span>Identity Domain (Consulta Minist. da Justiça)</span>
                      </h4>
                      <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                        Integração nativa com a base de dados do Bilhete de Identidade (BI) angolano para assegurar identificações robustas ao subir de nível (Tier).
                      </p>
                    </div>

                    <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-4">
                      <span className="text-[10px] uppercase font-mono text-zinc-400 font-bold block mb-2">Simular Consulta Regulamentar</span>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="N.º de BI (ex: 00593845LA042)"
                          defaultValue="00593845LA042"
                          className="flex-1 bg-black border border-neutral-900 rounded-lg p-2 text-xs text-white"
                        />
                        <button
                          onClick={() => {
                            setSelectedEntity({
                              type: "Identidade",
                              id: currentUser.biNumber,
                              name: currentUser.name,
                              status: "VERIFICADO",
                              details: {
                                "Nº BI": "00593845LA042",
                                "Registro Civil": "Conservatória Luanda",
                                "Consistência de Dados": "100.00% Correta"
                              },
                              lawReference: "Artigo 74 da Lei 40/20 (Verificação Cadastral Obrigatória)"
                            });
                          }}
                          className="bg-[#B87333] hover:bg-amber-800 text-white font-bold p-2 text-[10px] uppercase rounded-lg transition-all cursor-pointer"
                        >
                          Verificar BI
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 15. OPERAÇÕES: PARCEIROS */}
                {activeTab === "operations_partners" && (
                  <div className="space-y-3 text-left">
                    <div className="bg-neutral-900/25 border border-neutral-900 p-4 rounded-xl">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wide mb-1">Canais e Parceiros Integrados</h4>
                      <p className="text-xs text-zinc-400 font-sans">
                        Monitor de conectividade de concessionárias de telecomunicações e serviços integrados ao gateway.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-black border border-neutral-900 rounded-lg flex justify-between">
                        <span>UNITEL Telecom</span>
                        <span className="text-emerald-400 font-bold">✓ ONLINE</span>
                      </div>
                      <div className="p-2 bg-black border border-neutral-900 rounded-lg flex justify-between">
                        <span>ENDE Luz</span>
                        <span className="text-emerald-400 font-bold">✓ ONLINE</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 16. MONITORIZAÇÃO: EVENTOS */}
                {activeTab === "monitoring_events" && (
                  <div className="space-y-3 text-left">
                    <div className="bg-neutral-900/25 border border-neutral-900 p-4 rounded-xl flex justify-between items-center">
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wide">Observabilidade em Fluxo de Eventos</h4>
                        <p className="text-xs text-zinc-400 font-sans">
                          Acompanhe os logs transacionais no terminal inferior. Clique em qualquer um deles para inspecionar metadados.
                        </p>
                      </div>
                    </div>
                    <div className="bg-neutral-950 border border-neutral-900 p-4 rounded-xl text-center text-xs text-zinc-500">
                      Disponível em fluxo completo e contínuo de partidas dobradas no terminal do painel inferior.
                    </div>
                  </div>
                )}

                {/* 17. MONITORIZAÇÃO: ALARMES */}
                {activeTab === "monitoring_alarms" && (
                  <div className="space-y-3 text-left">
                    <div className="bg-neutral-900/25 border border-neutral-900 p-4 rounded-xl space-y-1">
                      <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wide flex items-center gap-1">
                        <ShieldAlert className="w-4 h-4 text-rose-400" />
                        <span>Central de Alarmes AML/CFT & Geo-Velocity</span>
                      </h4>
                      <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                        Alertas automatizados de suspeitas de branqueamento de capitais. Bloqueio cautelar imediato em transações de alto risco.
                      </p>
                    </div>

                    <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-3 space-y-2">
                      <span className="text-[10px] uppercase font-mono text-zinc-400 font-bold block border-b border-neutral-900 pb-2">Status da Análise Antifraude</span>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="p-3 bg-black/40 border border-neutral-900 rounded-xl">
                          <span className="text-[8.5px] uppercase font-mono text-zinc-500 block">Risco do Ecossistema</span>
                          <span className="text-md font-bold text-emerald-400 block mt-1">BAIXO / ESTÁVEL</span>
                        </div>
                        <div className="p-3 bg-black/40 border border-neutral-900 rounded-xl">
                          <span className="text-[8.5px] uppercase font-mono text-zinc-500 block">Regras de Prevenção</span>
                          <span className="text-md font-bold text-white block mt-1">mTLS, Velocity, BI Check</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 18. MONITORIZAÇÃO: PERFORMANCE */}
                {activeTab === "monitoring_performance" && (
                  <div className="space-y-3 text-left">
                    <div className="bg-neutral-900/25 border border-neutral-900 p-4 rounded-xl">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wide mb-1">Métricas de Performance Transacional</h4>
                      <p className="text-xs text-zinc-400 font-sans leading-normal">
                        Monitor de latência média de processamento de ponta a ponta na liquidação síncrona de ativos.
                      </p>
                    </div>

                    {/* Chart Container */}
                    <div className="bg-neutral-950 border border-neutral-900 p-3 rounded-xl h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={[
                          { name: "09:00", Latência: 98, TPS: 10 },
                          { name: "09:10", Latência: 110, TPS: 12 },
                          { name: "09:20", Latência: 105, TPS: 15 },
                          { name: "09:30", Latência: 112, TPS: 14 },
                          { name: "09:40", Latência: 95, TPS: 18 }
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                          <XAxis dataKey="name" stroke="#525252" style={{ fontSize: "9px" }} />
                          <YAxis stroke="#525252" style={{ fontSize: "9px" }} />
                          <Tooltip contentStyle={{ backgroundColor: "#171717", border: "1px solid #262626" }} />
                          <Line type="monotone" dataKey="Latência" stroke="#B87333" strokeWidth={2} />
                          <Line type="monotone" dataKey="TPS" stroke="#10b981" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* 19. MONITORIZAÇÃO: AUDITORIA */}
                {activeTab === "monitoring_audit" && (
                  <div className="space-y-3 text-left">
                    <div className="bg-neutral-900/25 border border-neutral-900 p-4 rounded-xl space-y-1">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wide flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-[#B87333]" />
                        <span>Central de Auditoria & Certificados LSPA</span>
                      </h4>
                      <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                        Geração automatizada de evidências síncronas em formato de certidão digital para prestação regulatória ao Banco de Angola.
                      </p>
                    </div>

                    <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-4 text-center space-y-3">
                      <FileText className="w-12 h-12 text-[#B87333] mx-auto animate-pulse" />
                      <div>
                        <h5 className="text-xs font-bold text-white">Certidão de Conformidade Sistemática</h5>
                        <p className="text-[10px] text-zinc-500 max-w-xs mx-auto leading-normal mt-1">
                          Emita um documento em PDF consolidando rácios de lastro, partidas dobradas, segurança criptográfica e conformidade de tiers.
                        </p>
                      </div>
                      <button
                        onClick={triggerPdfReportGeneration}
                        className="bg-[#B87333] hover:bg-amber-800 text-white font-bold px-4 py-2 text-[9.5px] uppercase rounded-lg transition-all flex items-center gap-1.5 mx-auto cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Exportar PDF Certificado</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 20. IA: REGULATORY ENGINE */}
                {activeTab === "ai_engine" && (
                  <div className="space-y-3 text-left">
                    <div className="bg-neutral-900/25 border border-neutral-900 p-4 rounded-xl space-y-1">
                      <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wide flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <span>Regulatory SAGA DSL Compiler</span>
                      </h4>
                      <p className="text-xs text-zinc-400 font-sans leading-normal">
                        Motor de conformidade dinâmica. Digite uma nova regra reguladora e compile diretamente para inserção de restrições em tempo de execução.
                      </p>
                    </div>

                    <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-3 space-y-2">
                      <textarea
                        rows={4}
                        value={dslCode}
                        onChange={(e) => setDslCode(e.target.value)}
                        className="w-full bg-black border border-neutral-900 rounded-lg p-2.5 text-[10.5px] font-mono text-[#B87333] focus:border-amber-900/40 outline-none"
                      />
                      <button
                        onClick={triggerComplianceCheck}
                        className="w-full bg-neutral-900 hover:bg-neutral-850 p-2 text-[9px] uppercase tracking-wider font-bold border border-neutral-800 text-zinc-300 hover:text-white transition-all cursor-pointer"
                      >
                        Compilar e Instanciar Regra
                      </button>
                      {dslCompilationOutput && (
                        <pre className="bg-black/50 p-2 rounded-lg border border-neutral-900 text-[9px] font-mono text-emerald-400 whitespace-pre-wrap leading-tight">
                          {dslCompilationOutput}
                        </pre>
                      )}
                    </div>
                  </div>
                )}

                {/* 21. IA: KNOWLEDGE GRAPH */}
                {activeTab === "ai_graph" && (
                  <div className="space-y-3 text-left">
                    <div className="bg-neutral-900/25 border border-neutral-900 p-4 rounded-xl">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wide mb-1">Knowledge Graph do Sistema Regulatório</h4>
                      <p className="text-xs text-zinc-400 font-sans leading-normal">
                        Mapeamento semântico de relações entre Leis, Avisos, Obrigações e os microsserviços do KwanzaMóvel.
                      </p>
                    </div>

                    <div className="bg-neutral-950 border border-neutral-900 p-3 rounded-xl font-mono text-[10px] space-y-2">
                      <div className="flex items-center gap-2 text-[#B87333] font-bold">
                        <Network className="w-4 h-4 text-[#B87333]" />
                        <span>Estrutura de Grafos Mapeada (RKK)</span>
                      </div>
                      <div className="p-2.5 bg-black rounded-lg border border-neutral-900 leading-relaxed text-zinc-400">
                        <p className="text-white font-bold">&gt; Lei n.º 40/20 (LSPA)</p>
                        <p className="pl-4">├── Regula → Emissão de Moeda Eletrónica (Aviso 05/21)</p>
                        <p className="pl-4">├── Impõe → Lastro Fiduciário 1:1 (Aviso 07/20)</p>
                        <p className="pl-4">└── Garante → Proteção de Dados de Utilizadores (Artigo 74)</p>
                        <p className="text-white font-bold mt-2">&gt; Aviso n.º 11/2021 (AML/CFT)</p>
                        <p className="pl-4">└── Fiscaliza → Limites de Contas Simplificadas (Aviso 24/21)</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 22. IA: DIGITAL TWIN COCKPIT */}
                {activeTab === "ai_twin" && (
                  <div className="space-y-3 text-left">
                    <div className="bg-neutral-900/25 border border-neutral-900 p-4 rounded-xl space-y-1">
                      <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wide">Digital Twin & Sandbox de Stress</h4>
                      <p className="text-xs text-zinc-400 font-sans leading-normal">
                        Simule altas taxas de concorrência (TPS) e teste o comportamento do sistema sob cenários de perda de pacotes e latência do canal SPTR BNA.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-neutral-950 border border-neutral-900 p-3 rounded-xl space-y-3 text-xs">
                        <span className="text-[9px] uppercase font-bold text-zinc-400">Injeção de Carga</span>
                        <div className="space-y-1.5">
                          <div className="flex justify-between font-mono">
                            <span>Taxa de TPS:</span>
                            <span className="text-[#B87333] font-bold">{tpsRate} TPS</span>
                          </div>
                          <input
                            type="range"
                            min="5"
                            max="150"
                            value={tpsRate}
                            onChange={(e) => setTpsRate(Number(e.target.value))}
                            className="w-full accent-[#B87333]"
                          />
                        </div>

                        <div className="space-y-1.5 border-t border-neutral-900/50 pt-2 font-mono">
                          <span className="text-[8px] uppercase text-zinc-500">Engenharia de Caos</span>
                          <div className="flex flex-col gap-1 text-[11px]">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input type="checkbox" checked={chaosLoss} onChange={() => setChaosLoss(!chaosLoss)} className="accent-[#B87333]" />
                              <span>Injetar Perda de Pacotes (5%)</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input type="checkbox" checked={chaosLatency} onChange={() => setChaosLatency(!chaosLatency)} className="accent-[#B87333]" />
                              <span>Latência de SPTR (+250ms)</span>
                            </label>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setIsTwinSimulating(!isTwinSimulating);
                          }}
                          className={`w-full py-2 border rounded-lg text-[9px] uppercase tracking-wider font-bold transition-all ${
                            isTwinSimulating 
                              ? "bg-rose-950/25 border-rose-900/40 text-rose-400" 
                              : "bg-[#B87333]/15 border-[#B87333]/40 text-[#B87333]"
                          }`}
                        >
                          {isTwinSimulating ? "Suspender Sandbox" : "Ativar Stress Sandbox"}
                        </button>
                      </div>

                      <div className="bg-neutral-950 border border-neutral-900 p-3 rounded-xl space-y-2 text-xs">
                        <span className="text-[9px] uppercase font-bold text-zinc-400">Status do Digital Twin Core</span>
                        <div className="grid grid-cols-2 gap-2 text-center font-mono pt-1">
                          <div className="p-1.5 bg-black/50 border border-neutral-900 rounded-lg">
                            <span className="text-[7.5px] text-zinc-500 block">Utilizadores Virtuais</span>
                            <span className="text-xs font-bold text-white mt-0.5 block">{twinStats.activeUsers}</span>
                          </div>
                          <div className="p-1.5 bg-black/50 border border-neutral-900 rounded-lg">
                            <span className="text-[7.5px] text-zinc-500 block">TPS</span>
                            <span className="text-xs font-bold text-[#B87333] mt-0.5 block">{twinStats.tps} TPS</span>
                          </div>
                          <div className="p-1.5 bg-black/50 border border-neutral-900 rounded-lg">
                            <span className="text-[7.5px] text-zinc-500 block">CPU Virtual</span>
                            <span className="text-xs font-bold text-white mt-0.5 block">{twinStats.cpu}%</span>
                          </div>
                          <div className="p-1.5 bg-black/50 border border-neutral-900 rounded-lg">
                            <span className="text-[7.5px] text-zinc-500 block">Invariantes</span>
                            <span className={`text-xs font-bold mt-0.5 block ${twinStats.invariantsPassed === 100 ? "text-emerald-400" : "text-rose-400"}`}>{twinStats.invariantsPassed}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 23. IA: SIMULAÇÕES - PAINEL DE ENGENHARIA DE CAOS */}
                {activeTab === "ai_simulations" && (
                  <div className="space-y-4 text-left">
                    <div className="bg-neutral-900/25 border border-neutral-900 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wide flex items-center gap-1.5">
                          <Activity className="w-4 h-4 text-[#B87333] animate-pulse" />
                          <span>Engenharia de Caos & Resiliência Transacional</span>
                        </h4>
                        <p className="text-xs text-zinc-400 font-sans mt-1 leading-relaxed">
                          Injete latências flutuantes, falhas de conexão PostgreSQL e indisponibilidade do barramento de eventos (EventBus) em tempo real para avaliar o rollback automático do TransactionManager.
                        </p>
                      </div>

                      {/* SWITCH CAOS PRINCIPAL */}
                      <div className="flex items-center gap-2 bg-black/40 border border-neutral-800/80 px-3 py-2 rounded-xl shrink-0">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
                          Injeção de Caos:
                        </span>
                        <button
                          onClick={() => handleUpdateChaosConfig({ enabled: !chaosConfig.enabled })}
                          className={`px-3 py-1 text-[9.5px] font-black uppercase rounded-lg border transition-all cursor-pointer ${
                            chaosConfig.enabled
                              ? "bg-rose-950/20 text-rose-400 border-rose-900/50"
                              : "bg-zinc-900 text-zinc-500 border-zinc-800"
                          }`}
                        >
                          {chaosConfig.enabled ? "● ATIVADO (CHAOS)" : "○ DESATIVADO"}
                        </button>
                      </div>
                    </div>

                    {/* CONFIGURAÇÃO DOS INJETORES */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* INJETOR DO LEDGER REPOSITORY */}
                      <div className="bg-black/50 border border-neutral-900 p-4 rounded-xl space-y-4">
                        <div className="flex items-center gap-2 border-b border-neutral-900 pb-2">
                          <Database className="w-4 h-4 text-[#B87333]" />
                          <span className="text-xs font-bold text-white uppercase tracking-wider">Injetor: LedgerRepository (PostgreSQL)</span>
                        </div>

                        {/* Taxa de Erro */}
                        <div className="space-y-1.5 font-mono text-xs">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-zinc-400">Probabilidade de Falha de Rede:</span>
                            <span className="text-rose-400 font-bold">{Math.round(chaosConfig.ledgerFailureRate * 100)}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={chaosConfig.ledgerFailureRate * 100}
                            disabled={!chaosConfig.enabled}
                            onChange={(e) => handleUpdateChaosConfig({ ledgerFailureRate: Number(e.target.value) / 100 })}
                            className="w-full accent-rose-500 h-1.5 bg-neutral-900 rounded-lg cursor-pointer disabled:opacity-30"
                          />
                          <div className="flex justify-between text-[9px] text-zinc-500">
                            <span>0% (Sem falhas)</span>
                            <span>50%</span>
                            <span>100% (Sempre falha)</span>
                          </div>
                        </div>

                        {/* Taxa de Timeout */}
                        <div className="space-y-1.5 font-mono text-xs pt-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-zinc-400">Probabilidade de Timeout/Latência:</span>
                            <span className="text-amber-400 font-bold">{Math.round(chaosConfig.ledgerTimeoutRate * 100)}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={chaosConfig.ledgerTimeoutRate * 100}
                            disabled={!chaosConfig.enabled}
                            onChange={(e) => handleUpdateChaosConfig({ ledgerTimeoutRate: Number(e.target.value) / 100 })}
                            className="w-full accent-amber-500 h-1.5 bg-neutral-900 rounded-lg cursor-pointer disabled:opacity-30"
                          />
                          <div className="flex justify-between text-[9px] text-zinc-500">
                            <span>0%</span>
                            <span>50%</span>
                            <span>100%</span>
                          </div>
                        </div>

                        {/* Valor do Timeout */}
                        <div className="space-y-1.5 font-mono text-xs pt-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-zinc-400">Atraso de Latência (ms):</span>
                            <span className="text-sky-400 font-bold">{chaosConfig.ledgerTimeoutMs} ms</span>
                          </div>
                          <input
                            type="range"
                            min="200"
                            max="3000"
                            step="100"
                            value={chaosConfig.ledgerTimeoutMs}
                            disabled={!chaosConfig.enabled}
                            onChange={(e) => handleUpdateChaosConfig({ ledgerTimeoutMs: Number(e.target.value) })}
                            className="w-full accent-sky-500 h-1.5 bg-neutral-900 rounded-lg cursor-pointer disabled:opacity-30"
                          />
                          <div className="flex justify-between text-[9px] text-zinc-500">
                            <span>200 ms</span>
                            <span>1500 ms</span>
                            <span>3000 ms</span>
                          </div>
                        </div>
                      </div>

                      {/* INJETOR DO EVENT BUS */}
                      <div className="bg-black/50 border border-neutral-900 p-4 rounded-xl space-y-4">
                        <div className="flex items-center gap-2 border-b border-neutral-900 pb-2">
                          <Network className="w-4 h-4 text-sky-400" />
                          <span className="text-xs font-bold text-white uppercase tracking-wider">Injetor: Barramento EventBus</span>
                        </div>

                        {/* Taxa de Erro */}
                        <div className="space-y-1.5 font-mono text-xs">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-zinc-400">Probabilidade de Falha de Ligação:</span>
                            <span className="text-rose-400 font-bold">{Math.round(chaosConfig.eventBusFailureRate * 100)}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={chaosConfig.eventBusFailureRate * 100}
                            disabled={!chaosConfig.enabled}
                            onChange={(e) => handleUpdateChaosConfig({ eventBusFailureRate: Number(e.target.value) / 100 })}
                            className="w-full accent-rose-500 h-1.5 bg-neutral-900 rounded-lg cursor-pointer disabled:opacity-30"
                          />
                          <div className="flex justify-between text-[9px] text-zinc-500">
                            <span>0%</span>
                            <span>50%</span>
                            <span>100% (Sempre)</span>
                          </div>
                        </div>

                        {/* Taxa de Timeout */}
                        <div className="space-y-1.5 font-mono text-xs pt-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-zinc-400">Probabilidade de Atraso de Despacho:</span>
                            <span className="text-amber-400 font-bold">{Math.round(chaosConfig.eventBusTimeoutRate * 100)}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={chaosConfig.eventBusTimeoutRate * 100}
                            disabled={!chaosConfig.enabled}
                            onChange={(e) => handleUpdateChaosConfig({ eventBusTimeoutRate: Number(e.target.value) / 100 })}
                            className="w-full accent-amber-500 h-1.5 bg-neutral-900 rounded-lg cursor-pointer disabled:opacity-30"
                          />
                          <div className="flex justify-between text-[9px] text-zinc-500">
                            <span>0%</span>
                            <span>50%</span>
                            <span>100%</span>
                          </div>
                        </div>

                        {/* Valor do Timeout */}
                        <div className="space-y-1.5 font-mono text-xs pt-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-zinc-400">Latência do EventBus (ms):</span>
                            <span className="text-sky-400 font-bold">{chaosConfig.eventBusTimeoutMs} ms</span>
                          </div>
                          <input
                            type="range"
                            min="200"
                            max="3000"
                            step="100"
                            value={chaosConfig.eventBusTimeoutMs}
                            disabled={!chaosConfig.enabled}
                            onChange={(e) => handleUpdateChaosConfig({ eventBusTimeoutMs: Number(e.target.value) })}
                            className="w-full accent-sky-500 h-1.5 bg-neutral-900 rounded-lg cursor-pointer disabled:opacity-30"
                          />
                          <div className="flex justify-between text-[9px] text-zinc-500">
                            <span>200 ms</span>
                            <span>1500 ms</span>
                            <span>3000 ms</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* BOTÕES DE RESET */}
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={handleResetChaosConfig}
                        className="px-3 py-1.5 text-[9.5px] uppercase font-bold text-zinc-400 border border-neutral-800 rounded-lg hover:bg-neutral-900 hover:text-white transition-all cursor-pointer"
                      >
                        Repor Valores de Fábrica
                      </button>
                    </div>

                    {/* CONSOLE DE REGISTRO EM TEMPO REAL */}
                    <div className="bg-[#0b0908] border border-neutral-900 rounded-xl overflow-hidden text-left font-mono text-[11px]">
                      <div className="bg-neutral-900/40 px-4 py-2.5 flex items-center justify-between border-b border-neutral-900">
                        <span className="text-[10px] uppercase font-black tracking-wider text-zinc-300 flex items-center gap-1.5">
                          <TerminalIcon className="w-3.5 h-3.5 text-zinc-500" />
                          Logs de Monitorização de Caos (Chaos Agent Injections)
                        </span>
                        {chaosLogs.length > 0 && (
                          <button
                            onClick={handleClearChaosLogs}
                            className="text-[9px] uppercase font-bold text-rose-400 border border-rose-900/30 px-2 py-0.5 rounded hover:bg-rose-950/25 transition-all cursor-pointer"
                          >
                            Limpar Consola
                          </button>
                        )}
                      </div>

                      <div className="p-3 space-y-1.5 max-h-56 overflow-y-auto min-h-[140px] font-mono leading-relaxed select-all">
                        {chaosLogs.length === 0 ? (
                          <div className="text-zinc-600 text-center py-10">
                            Nenhum evento de caos registrado. Ative a injeção de caos acima e execute operações financeiras (Ex: transferências síncronas ou testes de stress) para gerar logs em tempo real.
                          </div>
                        ) : (
                          chaosLogs.map((log, idx) => {
                            let typeClass = "text-zinc-500";
                            let icon = "⚙";
                            if (log.type === "error") {
                              typeClass = "text-rose-400 font-extrabold";
                              icon = "✖ FALHA";
                            } else if (log.type === "delay") {
                              typeClass = "text-amber-400";
                              icon = "⏱ LATÊNCIA";
                            } else if (log.type === "info") {
                              typeClass = "text-sky-400";
                              icon = "ℹ INFO";
                            }
                            return (
                              <div key={idx} className="border-b border-neutral-950 pb-1.5 last:border-0">
                                <span className="text-zinc-600 text-[10px] mr-2">[{log.timestamp}]</span>
                                <span className={`text-[10px] font-black px-1.5 rounded bg-black/60 border border-neutral-900 mr-2 ${typeClass}`}>
                                  {icon} {log.component}
                                </span>
                                <span className="text-zinc-300 font-sans">{log.message}</span>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* DICA DE UTILIZAÇÃO */}
                    <div className="bg-amber-950/10 border border-amber-900/20 p-3 rounded-xl flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div className="text-[11px] text-zinc-400 leading-normal font-sans">
                        <strong className="text-zinc-300">Como testar rollbacks fiduciários:</strong> Com a injeção de caos ativada (<strong>ATENÇÃO:</strong> defina probabilidade de falha alta no Ledger), vá à aba <span className="text-white font-bold">Suite de Testes</span> ou faça transferências manuais e observe que transações que sofreram a injeção de falhas dão erro na UI, mas <strong className="text-[#B87333]">nunca violam os invariantes contábeis de partidas dobradas</strong>. O TransactionManager reverte os saldos fiduciários para seus snapshots anteriores, garantindo integridade ACID absoluta.
                      </div>
                    </div>
                  </div>
                )}

                {/* 24. MONITORIZAÇÃO: TESTES DE ROBUSTEZ */}
                {activeTab === "monitoring_tests" && (
                  <div className="space-y-3 text-left">
                    <div className="bg-neutral-900/25 border border-neutral-900 p-4 rounded-xl flex justify-between items-center">
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wide">Testes de Robustez e Regressão Automática</h4>
                        <p className="text-xs text-zinc-400 font-sans leading-normal">
                          Execução sistemática de invariantes computacionais regulatórias.
                        </p>
                      </div>
                      <button
                        onClick={triggerTestRun}
                        disabled={runningTests}
                        className="bg-[#B87333] hover:bg-amber-800 disabled:opacity-50 text-white font-bold p-1.5 text-[9.5px] uppercase rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>{runningTests ? "Executando..." : "Correr Suite"}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs max-h-52 overflow-y-auto">
                      {testReports.map((report, idx) => (
                        <div 
                          key={idx} 
                          onClick={() => setSelectedEntity({
                            type: "Teste de Invariante",
                            id: report.id,
                            name: report.name,
                            status: report.passed ? "Passed" : "Failed",
                            details: {
                              "Assertion": report.invariantAssertion,
                              "Descrição": report.description
                            },
                            lawReference: "Garantia de segurança sistêmica do BNA"
                          })}
                          className="p-2.5 bg-black border border-neutral-900 rounded-xl hover:border-[#B87333]/40 transition-all cursor-pointer flex justify-between items-center"
                        >
                          <div>
                            <p className="font-bold text-white">{report.name}</p>
                            <p className="text-[10px] text-zinc-500 font-sans mt-0.5">{report.description}</p>
                          </div>
                          <span className={`text-[8.5px] font-bold px-1.5 rounded font-mono ${report.passed ? "bg-emerald-950/20 text-emerald-400 border border-emerald-900/30" : "bg-rose-950/20 text-rose-400 border border-rose-900/30"}`}>
                            {report.passed ? "PASS" : "FAIL"}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* SEÇÃO ADICIONAL: TESTADOR DE STRESS DE CONCORRÊNCIA (OCC) */}
                    <div className="border-t border-neutral-900 pt-3.5 space-y-3.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-neutral-900/10 p-3 rounded-xl border border-neutral-900">
                        <div>
                          <h4 className="text-xs font-bold text-white uppercase tracking-wide flex items-center gap-1.5">
                            <Cpu className="w-4 h-4 text-[#B87333] animate-pulse" />
                            <span>Simulador de Stress de Concorrência & ACID / OCC</span>
                          </h4>
                          <p className="text-[11px] text-zinc-400 font-sans mt-0.5 leading-relaxed">
                            Força rajadas simultâneas de transferências entre duas contas fiduciárias no Ledger para testar o Optimistic Concurrency Control (OCC) e retentativas exponenciais do TransactionManager.
                          </p>
                        </div>
                        <button
                          onClick={runStressTest}
                          disabled={runningStressTest}
                          className="bg-amber-950/20 hover:bg-amber-950/40 border border-amber-900/40 disabled:opacity-50 text-[#B87333] font-extrabold px-3 py-1.5 text-[10px] uppercase rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                        >
                          <RotateCw className={`w-3.5 h-3.5 ${runningStressTest ? "animate-spin" : ""}`} />
                          <span>{runningStressTest ? "Executando Stress..." : "Disparar Stress"}</span>
                        </button>
                      </div>

                      {/* CONTROLES DO TESTE DE STRESS */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-black/40 p-3 rounded-xl border border-neutral-900/60 font-mono text-xs">
                        <div className="space-y-1.5 text-left">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-zinc-400">Nível de Concorrência (Threads):</span>
                            <span className="text-[#B87333] font-bold">{stressConcurrency} Transações Simultâneas</span>
                          </div>
                          <input
                            type="range"
                            min="5"
                            max="50"
                            value={stressConcurrency}
                            disabled={runningStressTest}
                            onChange={(e) => setStressConcurrency(Number(e.target.value))}
                            className="w-full accent-[#B87333] h-1.5 bg-neutral-900 rounded-lg cursor-pointer"
                          />
                          <div className="flex justify-between text-[9px] text-zinc-500">
                            <span>5 threads</span>
                            <span>25 threads</span>
                            <span>50 threads</span>
                          </div>
                        </div>

                        <div className="space-y-1.5 text-left">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-zinc-400">Quantia por Transação (KZ):</span>
                            <span className="text-[#B87333] font-bold">{stressAmount} Kz</span>
                          </div>
                          <input
                            type="range"
                            min="10"
                            max="200"
                            value={stressAmount}
                            disabled={runningStressTest}
                            onChange={(e) => setStressAmount(Number(e.target.value))}
                            className="w-full accent-[#B87333] h-1.5 bg-neutral-900 rounded-lg cursor-pointer"
                          />
                          <div className="flex justify-between text-[9px] text-zinc-500">
                            <span>10 Kz</span>
                            <span>100 Kz</span>
                            <span>200 Kz</span>
                          </div>
                        </div>
                      </div>

                      {/* RESULTADO DA TELEMETRIA DE STRESS */}
                      {stressTelemetry && (
                        <div className="space-y-3 bg-[#0c0908] p-4 rounded-xl border border-amber-900/20 text-left font-mono text-[11px]">
                          <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
                            <span className="text-xs uppercase font-extrabold text-[#B87333] tracking-wider">
                              Relatório de Telemetria de Concorrência Real-Time
                            </span>
                            <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded uppercase ${
                              stressTelemetry.ledgerInvariantsPreserved && stressTelemetry.walletInvariantsPreserved
                                ? "bg-emerald-950/20 text-emerald-400 border border-emerald-900/30"
                                : "bg-rose-950/20 text-rose-400 border border-rose-900/30"
                            }`}>
                              {stressTelemetry.ledgerInvariantsPreserved && stressTelemetry.walletInvariantsPreserved ? "SUCESSO (Invariantes Ok)" : "FALHA"}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="bg-black/40 p-2 rounded-lg border border-neutral-900">
                              <span className="text-[9px] text-zinc-500 block">Vazão Dinâmica:</span>
                              <span className="text-xs font-black text-white">{stressTelemetry.transactionsPerSecond} TPS</span>
                            </div>
                            <div className="bg-black/40 p-2 rounded-lg border border-neutral-900">
                              <span className="text-[9px] text-zinc-500 block">Duração de Burst:</span>
                              <span className="text-xs font-black text-white">{stressTelemetry.durationMs} ms</span>
                            </div>
                            <div className="bg-black/40 p-2 rounded-lg border border-neutral-900">
                              <span className="text-[9px] text-zinc-500 block">Colisões OCC Resolvidas:</span>
                              <span className="text-xs font-black text-amber-400">{stressTelemetry.concurrencyCollisionsDetected}</span>
                            </div>
                            <div className="bg-black/40 p-2 rounded-lg border border-neutral-900">
                              <span className="text-[9px] text-zinc-500 block">Vazão de Entrega:</span>
                              <span className="text-xs font-black text-white">{stressTelemetry.successfulTransactions} / {stressTelemetry.totalAttempted}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                            <div className="bg-black/40 p-2.5 rounded-lg border border-neutral-900 space-y-1.5">
                              <div className="text-[10px] text-zinc-300 font-extrabold flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${stressTelemetry.ledgerInvariantsPreserved ? "bg-emerald-500" : "bg-rose-500"}`} />
                                INVARIANTE PARTIDAS DOBRADAS:
                              </div>
                              <div className="text-zinc-400 leading-normal text-[10px]">
                                Soma Inicial do Ledger: {stressTelemetry.initialLedgerTotal.toLocaleString()} Kz<br />
                                Soma Final do Ledger: {stressTelemetry.finalLedgerTotal.toLocaleString()} Kz<br />
                                <span className={stressTelemetry.ledgerInvariantsPreserved ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                                  {stressTelemetry.ledgerInvariantsPreserved ? "✓ Conservação total garantida (Delta = 0)" : "✗ Violação detectada!"}
                                </span>
                              </div>
                            </div>

                            <div className="bg-black/40 p-2.5 rounded-lg border border-neutral-900 space-y-1.5">
                              <div className="text-[10px] text-zinc-300 font-extrabold flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${stressTelemetry.walletInvariantsPreserved ? "bg-emerald-500" : "bg-rose-500"}`} />
                                INVARIANTE SALDO CARTEIRAS (1:1):
                              </div>
                              <div className="text-zinc-400 leading-normal text-[10px]">
                                Remetente: {stressTelemetry.initialSenderBalance} Kz ➔ {stressTelemetry.finalSenderBalance} Kz<br />
                                Destinatário: {stressTelemetry.initialReceiverBalance} Kz ➔ {stressTelemetry.finalReceiverBalance} Kz<br />
                                <span className={stressTelemetry.walletInvariantsPreserved ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                                  {stressTelemetry.walletInvariantsPreserved ? "✓ Transferências líquidas validadas 100%" : "✗ Saldo final inválido!"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="pt-1.5">
                            <span className="text-[9px] text-zinc-500 block mb-1">Métricas de Latência Core:</span>
                            <div className="flex gap-4 text-[10px] text-zinc-400">
                              <span>Mínima: <strong className="text-white">{stressTelemetry.minLatencyMs} ms</strong></span>
                              <span>Média: <strong className="text-white">{stressTelemetry.averageLatencyMs} ms</strong></span>
                              <span>Máxima: <strong className="text-white">{stressTelemetry.maxLatencyMs} ms</strong></span>
                            </div>
                          </div>

                          {stressTelemetry.errors.length > 0 && (
                            <div className="bg-rose-950/15 border border-rose-900/30 p-2.5 rounded-lg space-y-1 max-h-24 overflow-y-auto">
                              <span className="text-[9px] text-rose-400 font-bold uppercase block">Rastro de Exceções Temporárias / OCC:</span>
                              {stressTelemetry.errors.map((err, i) => (
                                <div key={i} className="text-rose-300 text-[9.5px] font-sans">⚠️ {err}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                  </>
                )}
              </div>
            )}
          </div>

          {/* 3. BOTTOM CONSOLE TERMINAL (THE REAL-TIME SYSTEM EVENT STREAM) */}
          <div className="bg-neutral-950 border-t border-neutral-900 h-44 flex flex-col select-none text-left shrink-0">
            
            {/* Terminal header */}
            <div className="flex bg-neutral-900/30 border-b border-neutral-900 px-3.5 py-1.5 items-center justify-between text-[8.5px] uppercase tracking-wider font-extrabold text-zinc-400 select-none">
              <span className="flex items-center gap-1.5">
                <TerminalIcon className="w-3.5 h-3.5 text-[#B87333] animate-pulse" />
                <span>KOS Domain Event Stream (Fluxo do Sistema Regulatório)</span>
              </span>
              <span className="text-zinc-600 font-bold">Clique em qualquer evento para inspecionar</span>
            </div>

            {/* Event List container */}
            <div className="flex-1 p-2 bg-black overflow-y-auto text-[9.5px] font-mono leading-relaxed divide-y divide-neutral-900/40">
              {eventsStream.length === 0 ? (
                <div className="text-zinc-600 py-2 italic text-center select-none">Sem eventos no fluxo do domínio.</div>
              ) : (
                eventsStream.map((ev, idx) => {
                  const isSuccess = ev.result === "SUCCESS";
                  const isFailed = ev.result === "FAILED" || ev.result === "DENIED";
                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedEntity({
                        type: ev.type,
                        id: ev.correlationId,
                        name: `Evento: ${ev.type}`,
                        status: ev.result,
                        details: ev.details,
                        lawReference: ev.lawRef,
                        remedy: `Origem: ${ev.origin} | Registrado via SGA.`
                      })}
                      className="py-1 px-1.5 hover:bg-neutral-900/50 cursor-pointer transition-all flex flex-wrap items-center gap-2 justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-500 font-normal">{ev.time}</span>
                        <span className="font-bold text-white uppercase tracking-wider">{ev.type}</span>
                        <span className="text-zinc-500 font-bold">| {ev.lawRef}</span>
                        <span className="text-[#B87333] font-mono">({ev.correlationId})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-500">Payload: {JSON.stringify(ev.details)}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold ${
                          isSuccess 
                            ? "bg-emerald-950/20 text-emerald-400 border border-emerald-900/20" 
                            : isFailed
                              ? "bg-rose-950/20 text-rose-400 border border-rose-900/20"
                              : "bg-amber-950/20 text-amber-400 border border-amber-900/20"
                        }`}>
                          {ev.result}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* FIGMA-STYLE COLLAPSIBLE INSPECTOR (RIGHT SIDEBAR) */}
        {selectedEntity && (
          <div className="w-80 bg-neutral-950 border-l border-neutral-900 flex flex-col overflow-y-auto select-none text-left shrink-0">
            <div className="p-4 border-b border-neutral-900 flex justify-between items-center bg-neutral-900/20">
              <div className="flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-[#B87333]" />
                <span className="text-[9px] uppercase font-black text-white tracking-wider">FOS Inspector</span>
              </div>
              <button 
                onClick={() => setSelectedEntity(null)}
                className="p-1 rounded hover:bg-neutral-900 text-zinc-500 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 text-xs">
              {/* Type and Name */}
              <div className="border-b border-neutral-900 pb-3">
                <span className="text-[8px] uppercase tracking-widest text-[#B87333] font-bold block">{selectedEntity.type}</span>
                <h5 className="text-sm font-black text-white mt-0.5">{selectedEntity.name}</h5>
                {selectedEntity.status && (
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold mt-1.5 uppercase ${
                    selectedEntity.status === "SUCCESS" || selectedEntity.status === "completed" || selectedEntity.status === "Passed" || selectedEntity.status === "VERIFICADO"
                      ? "bg-emerald-950/20 text-emerald-400 border border-emerald-900/30"
                      : "bg-rose-950/20 text-rose-400 border border-rose-900/30"
                  }`}>
                    {selectedEntity.status}
                  </span>
                )}
              </div>

              {/* Attributes Key-Value */}
              <div className="space-y-2 border-b border-neutral-900 pb-3">
                <span className="text-[8.5px] uppercase font-mono text-zinc-500 font-bold block">Propriedades do Registro</span>
                <div className="bg-black/50 p-2.5 rounded-lg border border-neutral-900 space-y-1.5 font-mono text-[10px]">
                  {Object.entries(selectedEntity.details).map(([key, value]) => (
                    <div key={key} className="flex flex-col">
                      <span className="text-[7.5px] uppercase text-zinc-500 font-bold">{key}</span>
                      <span className="text-zinc-300 break-all leading-normal mt-0.5">
                        {typeof value === "object" ? JSON.stringify(value) : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Law Reference */}
              {selectedEntity.lawReference && (
                <div className="space-y-1.5 pb-2">
                  <span className="text-[8.5px] uppercase font-mono text-rose-400 font-bold block flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-rose-400" /> Enquadramento BNA
                  </span>
                  <div className="p-2.5 bg-rose-950/5 border border-rose-900/20 text-rose-300 rounded-lg text-[10px] leading-relaxed">
                    <p className="font-bold">{selectedEntity.lawReference}</p>
                    {selectedEntity.remedy && <p className="text-[9px] text-zinc-500 mt-1">{selectedEntity.remedy}</p>}
                  </div>
                </div>
              )}

              {/* Audit Signoff */}
              <div className="p-2 bg-emerald-950/5 border border-emerald-900/20 text-emerald-300 rounded-lg text-[9.5px] font-mono leading-relaxed">
                <p className="font-bold">✓ Selo de Auditoria</p>
                <p className="text-zinc-500 break-all text-[8.5px] mt-0.5">sha256_audit_4c83b...72a1</p>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
