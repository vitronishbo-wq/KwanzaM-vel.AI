import React, { useState, useEffect } from "react";
import { 
  Scale, 
  Cpu, 
  GitFork, 
  AlertTriangle, 
  Layers, 
  CheckCircle, 
  HelpCircle, 
  XCircle, 
  BookOpen, 
  ChevronRight, 
  ChevronDown, 
  Search, 
  RefreshCw, 
  AlertOctagon, 
  Database, 
  Code, 
  Link2, 
  Layers2, 
  FileCheck,
  TrendingUp,
  Terminal,
  Activity,
  Calendar,
  Zap,
  Network,
  FileText,
  Check,
  Play,
  Sliders,
  Shield,
  History,
  FileCode,
  FolderSync
} from "lucide-react";
import { ComplianceEngine } from "../../backend/regulation/engine";
import { RegulatoryImpactAnalyzer } from "../../backend/regulation/impact";
import { OBLIGATIONS_REGISTRY, DOMAIN_OBJECTS_REGISTRY, REGULATORY_EVENTS_REGISTRY } from "../../backend/regulation/registry";
import { Obligation, ComplianceScoreReport, GapReport, ImpactAnalysisResult, ArchitecturalDecisionRecord, DslRule } from "../../backend/regulation/types";
import { RegulatoryKnowledgeKernel } from "../../backend/regulation/RegulatoryKnowledgeKernel";

interface RegulatoryOperatingSystemPortalProps {
  highContrast?: boolean;
}

export default function RegulatoryOperatingSystemPortal({ highContrast }: RegulatoryOperatingSystemPortalProps) {
  // Engines
  const engine = new ComplianceEngine();
  const impactAnalyzer = new RegulatoryImpactAnalyzer();

  // Selected sub-tab within ROS tab
  const [subTab, setSubTab] = useState<"dashboard" | "matrix" | "gaps" | "impact" | "compiler" | "versions" | "adr" | "rkk">("dashboard");

  // Regulatory Knowledge Kernel states
  const [rkkSubTab, setRkkSubTab] = useState<"concepts" | "rights" | "prohibitions">("concepts");
  const [rkkQuery, setRkkQuery] = useState<string>("");
  const rkk = RegulatoryKnowledgeKernel.getInstance();

  // State
  const [activeDate, setActiveDate] = useState<string>("2026-07-01");
  const [report, setReport] = useState<ComplianceScoreReport>(() => engine.calculateComplianceScore("2026-07-01"));
  const [auditResult, setAuditResult] = useState(() => engine.runConsistencyAudit());
  const [gaps, setGaps] = useState<GapReport[]>(() => engine.generateGapAnalysis());
  const [selectedArticleId, setSelectedArticleId] = useState<string>("L40-ART-74");
  const [impactResult, setImpactResult] = useState<ImpactAnalysisResult>(() => impactAnalyzer.analyzeImpact("L40-ART-74"));
  const [isRecalculating, setIsRecalculating] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>(stringEmpty());
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  
  // Custom Evidence Tab inside Matrix row expand
  const [evidenceTab, setEvidenceTab] = useState<"ledger" | "testing" | "telemetry">("ledger");

  // Architectural Decisions State
  const [adrs, setAdrs] = useState<ArchitecturalDecisionRecord[]>(INITIAL_ADRS);
  const [newAdrTitle, setNewAdrTitle] = useState(stringEmpty());
  const [newAdrArticle, setNewAdrArticle] = useState("L40-ART-20");
  const [newAdrDecisor, setNewAdrDecisor] = useState(stringEmpty());
  const [newAdrInterpretation, setNewAdrInterpretation] = useState(stringEmpty());
  const [newAdrJustification, setNewAdrJustification] = useState(stringEmpty());
  const [newAdrImpact, setNewAdrImpact] = useState(stringEmpty());
  const [adrSuccessMsg, setAdrSuccessMsg] = useState(stringEmpty());

  // Compliance DSL State
  const [dslContent, setDslContent] = useState<string>(DEFAULT_DSL_SAMPLE);
  const [dslCompileResult, setDslCompileResult] = useState<{ success: boolean; error?: string; rule?: DslRule } | null>(null);
  const [temporaryDslRules, setTemporaryDslRules] = useState<Record<string, Obligation>>({});

  // Compiler Policies State
  const [policyRequireTests, setPolicyRequireTests] = useState(true);
  const [policyRequireMetrics, setPolicyRequireMetrics] = useState(true);
  const [policyMinRetention, setPolicyMinRetention] = useState(true);
  const [compilerBuildStatus, setCompilerBuildStatus] = useState<"IDLE" | "RUNNING" | "SUCCESS" | "FAILED">("IDLE");
  const [compilerBuildLogs, setCompilerBuildLogs] = useState<string[]>([]);

  // Interactive Graph Node Selection
  const [selectedGraphNode, setSelectedGraphNode] = useState<string>("Lei 40/20");

  function stringEmpty() {
    return "";
  }

  // Reload data when active date changes
  useEffect(() => {
    setReport(engine.calculateComplianceScore(activeDate));
  }, [activeDate, temporaryDslRules]);

  useEffect(() => {
    setImpactResult(impactAnalyzer.analyzeImpact(selectedArticleId));
  }, [selectedArticleId]);

  const handleRecalculate = () => {
    setIsRecalculating(true);
    setTimeout(() => {
      setReport(engine.calculateComplianceScore(activeDate));
      setAuditResult(engine.runConsistencyAudit());
      setGaps(engine.generateGapAnalysis());
      setImpactResult(impactAnalyzer.analyzeImpact(selectedArticleId));
      setIsRecalculating(false);
    }, 600);
  };

  const getDimensionLabel = (key: string): string => {
    const labels: Record<string, string> = {
      juridica: "Cobertura Jurídica",
      funcional: "Cobertura Funcional",
      testes: "Cobertura de Testes",
      observabilidade: "Cobertura de Observabilidade",
      auditoria: "Cobertura de Auditoria",
      seguranca: "Cobertura de Segurança",
      aml: "Cobertura AML / KYC",
      custodia: "Cobertura de Custódia & Lastro",
      protecaoConsumidor: "Proteção ao Consumidor",
      operacional: "Resiliência Operacional"
    };
    return labels[key] || key;
  };

  const getDimensionDesc = (key: string): string => {
    const descs: Record<string, string> = {
      juridica: "Alinhamento regulatório de metadados e taxonomia legal",
      funcional: "Mapeamento ativo em agregados e casos de uso de domínio",
      testes: "Suites de testes de robustez vinculadas aos requisitos legais",
      observabilidade: "Métricas de telemetria e limites dinâmicos para conformidade",
      auditoria: "Trilhas de auditoria imutáveis no ledger financeiro",
      seguranca: "Criptografia de sessões e autenticação multifatorial (SCA)",
      aml: "Heurísticas de lavagem de dinheiro e limites de contas de pagamento",
      custodia: "Garantia de 100% de lastro fiduciário segregado no BNA",
      protecaoConsumidor: "Transparência de tarifas em português e termos de uso",
      operacional: "SLA de disponibilidade, relatórios de incidentes e SLAs"
    };
    return descs[key] || "";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Implemented': return 'text-emerald-400 bg-emerald-950/20 border-emerald-900/40';
      case 'Partially_Implemented': return 'text-amber-400 bg-amber-950/20 border-amber-900/40';
      case 'Not_Implemented': return 'text-rose-400 bg-rose-950/20 border-rose-900/40';
      default: return 'text-zinc-500 bg-neutral-900 border-neutral-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Implemented': return 'Conforme';
      case 'Partially_Implemented': return 'Parcial';
      case 'Not_Implemented': return 'Não Conforme';
      case 'Not_Applicable': return 'N/A';
      default: return status;
    }
  };

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'Critical': return 'text-rose-400 border-rose-900/40 bg-rose-950/10';
      case 'High': return 'text-orange-400 border-orange-900/40 bg-orange-950/10';
      case 'Medium': return 'text-amber-400 border-amber-900/40 bg-amber-950/10';
      default: return 'text-sky-400 border-sky-900/40 bg-sky-950/10';
    }
  };

  // Compile the pasted Compliance DSL
  const handleCompileDsl = () => {
    const res = engine.compileDslRule(dslContent);
    setDslCompileResult(res);
    if (res.success && res.rule) {
      // Create temporary obligation from DslRule
      const rule = res.rule;
      const obligationId = rule.article;
      
      const simulatedObligation: Obligation = {
        id: obligationId,
        lei: rule.lei,
        artigo: obligationId.includes("ART") ? `Artigo ${obligationId.split("-").pop()?.replace("ART", "")}º` : "Artigo Adicional",
        capitulo: "Disposições Transitórias",
        tipo: "Mandatory",
        actor: rule.appliesTo.join(" / "),
        trigger: "Execução de regra DSL dinâmica em tempo de execução",
        constraint: rule.requires.join(", "),
        severity: rule.severity,
        testRequired: true,
        auditRequired: true,
        implementationStatus: "Not_Implemented", // starts as unimplemented to see gap impact
        linkedUseCases: rule.appliesTo,
        linkedRepositories: [],
        linkedEvents: rule.evidence?.logs || [],
        linkedMetrics: [],
        description: `Regra de Conformidade compilada dinamicamente via DSL para o ${rule.lei}.`,
        concepts: rule.concepts || [],
        evidenceRequired: {
          logs: rule.evidence?.logs || [],
          events: rule.evidence?.logs || [],
          databaseTables: rule.evidence?.tables || [],
          retentionPeriodYears: 5
        },
        versioning: {
          effectiveFrom: rule.effectiveFrom
        }
      };

      // Add to temporary in-memory registry simulator
      setTemporaryDslRules(prev => ({
        ...prev,
        [obligationId]: simulatedObligation
      }));

      // Merge into obligations registry mock for the current UI session
      OBLIGATIONS_REGISTRY[obligationId] = simulatedObligation;
    }
  };

  // Run Regulatory Compiler Build Check
  const handleRunCompilerBuild = () => {
    setCompilerBuildStatus("RUNNING");
    setCompilerBuildLogs(["[ROS-COMPILER] Iniciando compilação de conformidade estrita...", `[ROS-COMPILER] Analisando ${Object.keys(OBLIGATIONS_REGISTRY).length} obrigações registradas...`]);
    
    setTimeout(() => {
      const logs: string[] = [];
      const obligations = Object.values(OBLIGATIONS_REGISTRY);
      let failed = false;

      logs.push("[ROS-COMPILER] Verificando integridade jurídica dos metadados...");
      obligations.forEach(o => {
        if (!o.lei || !o.artigo) {
          logs.push(`[ERRO] Artigo ${o.id} possui metadados legais corrompidos.`);
          failed = true;
        }
      });

      if (policyRequireTests) {
        logs.push("[ROS-COMPILER] POLÍTICA: Exigir testes unitários associados a obrigações Conformes...");
        obligations.forEach(o => {
          if (o.testRequired && o.implementationStatus === 'Implemented' && o.linkedUseCases.length === 0) {
            logs.push(`[ERRO COMPILAÇÃO] Artigo ${o.id} está marcado como 'Conforme', mas possui zero testes unitários mapeados.`);
            failed = true;
          }
        });
      }

      if (policyRequireMetrics) {
        logs.push("[ROS-COMPILER] POLÍTICA: Exigir métricas ativas em artigos com auditoria obrigatória...");
        obligations.forEach(o => {
          if (o.auditRequired && o.linkedMetrics.length === 0) {
            logs.push(`[AVISO COMPILAÇÃO] Artigo ${o.id} exige auditoria do BNA mas possui zero métricas de telemetria.`);
            if (o.severity === "Critical") {
              logs.push(`[ERRO COMPILAÇÃO] Violação crítica: Artigo de severidade 'Critical' ${o.id} sem métrica associada.`);
              failed = true;
            }
          }
        });
      }

      if (policyMinRetention) {
        logs.push("[ROS-COMPILER] POLÍTICA: Validar se a retenção mínima exigida é superior a 5 anos...");
        obligations.forEach(o => {
          if (o.evidenceRequired && o.evidenceRequired.retentionPeriodYears < 5) {
            logs.push(`[ERRO COMPILAÇÃO] Artigo ${o.id} possui período de retenção de ${o.evidenceRequired.retentionPeriodYears} anos. Mínimo legal exigido pelo BNA é de 5 anos.`);
            failed = true;
          }
        });
      }

      logs.push(`[ROS-COMPILER] Análise completa. Status das políticas estritas de compliance avaliado.`);
      
      if (failed) {
        setCompilerBuildStatus("FAILED");
        logs.push("[BUILD FAILED] A compilação da infraestrutura financeira violou as diretrizes regulatórias governamentais.");
      } else {
        setCompilerBuildStatus("SUCCESS");
        logs.push("[BUILD SUCCESSFUL] Todos os artefatos de código, testes, banco de dados e auditoria estão em conformidade estrita com a Lei 40/20.");
      }
      setCompilerBuildLogs(prev => [...prev, ...logs]);
    }, 1200);
  };

  // Add a new Architectural Decision Record (ADR)
  const handleAddAdr = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdrTitle || !newAdrInterpretation || !newAdrJustification) return;

    const newRecord: ArchitecturalDecisionRecord = {
      id: `ADR-${String(adrs.length + 1).padStart(3, '0')}`,
      articleId: newAdrArticle,
      title: newAdrTitle,
      decisor: newAdrDecisor || "Arquiteto ROS Autônomo",
      interpretation: newAdrInterpretation,
      justification: newAdrJustification,
      date: new Date().toISOString().split('T')[0],
      architecturalImpact: newAdrImpact || "Impacto geral documentado",
      status: "Accepted"
    };

    setAdrs(prev => [newRecord, ...prev]);
    setNewAdrTitle(stringEmpty());
    setNewAdrInterpretation(stringEmpty());
    setNewAdrJustification(stringEmpty());
    setNewAdrImpact(stringEmpty());
    setNewAdrDecisor(stringEmpty());
    setAdrSuccessMsg("Nova interpretação e decisão arquitetural cadastrada com sucesso!");
    setTimeout(() => setAdrSuccessMsg(stringEmpty()), 4000);
  };

  const obligations = Object.values(OBLIGATIONS_REGISTRY);
  const filteredObligations = obligations.filter(o => 
    o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.artigo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.constraint.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.actor.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const bgCard = highContrast ? "bg-black border-white border-2" : "bg-[#0b0807]/90 border-neutral-900";
  const textTitle = highContrast ? "text-white font-black" : "text-white font-bold";

  return (
    <div className={`p-6 rounded-[28px] border ${bgCard} space-y-6 font-sans text-left`}>
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-900 pb-5">
        <div className="flex items-start gap-3">
          <span className="p-3 bg-amber-950/40 text-[#B87333] rounded-2xl border border-amber-900/40">
            <Scale className="w-6 h-6" />
          </span>
          <div>
            <h2 className={`text-lg uppercase tracking-wider ${textTitle}`}>
              Regulatory Operating System (ROS)
            </h2>
            <p className="text-[10px] text-zinc-500 font-mono uppercase">
              Motor Executável de Engenharia Regulatória • Gêmeo Digital do SP Angola (Lei 40/20)
            </p>
          </div>
        </div>

        {/* Dynamic Date Versioning Switcher */}
        <div className="flex items-center gap-2 font-mono text-xs self-end sm:self-auto">
          <span className="text-zinc-500 text-[10px] uppercase">Regime Normativo:</span>
          <select
            value={activeDate}
            onChange={(e) => setActiveDate(e.target.value)}
            className="bg-neutral-950 border border-neutral-900 rounded-xl px-3 py-1.5 text-[#B87333] font-black outline-none cursor-pointer"
          >
            <option value="2020-12-01">LSPA Inicial (Dez 2020)</option>
            <option value="2021-06-01">Implementação Parcial (Jun 2021)</option>
            <option value="2022-03-01">Regime Simplificado (Mar 2022)</option>
            <option value="2026-07-01">Estado Atual (Jul 2026)</option>
          </select>
        </div>
      </div>

      {/* PORTAL TAB NAV */}
      <div className="flex flex-wrap border-b border-neutral-900 pb-2 gap-2 select-none">
        {(["dashboard", "matrix", "gaps", "impact", "compiler", "versions", "adr", "rkk"] as const).map((t) => {
          const tabLabelMap = {
            dashboard: "Painel de Controle",
            matrix: "Compliance Matrix",
            gaps: "Gap Analysis",
            impact: "Simulador de Impacto",
            compiler: "Compilador DSL",
            versions: "Gêmeo Digital & Grafo",
            adr: "Decisões Governança",
            rkk: "Knowledge Kernel (RKK)"
          };
          const tabIconMap = {
            dashboard: <Activity className="w-3.5 h-3.5" />,
            matrix: <Layers2 className="w-3.5 h-3.5" />,
            gaps: <AlertOctagon className="w-3.5 h-3.5" />,
            impact: <Zap className="w-3.5 h-3.5" />,
            compiler: <FileCode className="w-3.5 h-3.5" />,
            versions: <Network className="w-3.5 h-3.5" />,
            adr: <FileText className="w-3.5 h-3.5" />,
            rkk: <BookOpen className="w-3.5 h-3.5" />
          };

          return (
            <button
              key={t}
              onClick={() => setSubTab(t)}
              className={`px-3 py-2 text-[10px] font-mono uppercase tracking-wider font-extrabold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border ${
                subTab === t
                  ? "bg-[#B87333]/20 text-white border-[#B87333]/50"
                  : "bg-transparent text-zinc-500 border-transparent hover:text-zinc-300"
              }`}
            >
              {tabIconMap[t]}
              <span>{tabLabelMap[t]}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content: Dashboard */}
      {subTab === "dashboard" && (
        <div className="space-y-6">
          {/* TOP METRICS & RISK LEVEL */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Global score ring */}
            <div className="bg-black/40 p-4 rounded-2xl border border-neutral-900/60 flex items-center gap-4">
              <div className="relative shrink-0 flex items-center justify-center w-20 h-20">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="40" cy="40" r="32" className="stroke-neutral-800" strokeWidth="6" fill="transparent" />
                  <circle 
                    cx="40" cy="40" r="32" 
                    className="stroke-[#B87333] transition-all duration-1000" 
                    strokeWidth="6" 
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 32}
                    strokeDashoffset={2 * Math.PI * 32 * (1 - report.globalCompliance / 100)}
                  />
                </svg>
                <span className="absolute text-sm font-black text-white">{report.globalCompliance}%</span>
              </div>
              <div className="text-left leading-snug">
                <span className="text-[9px] uppercase tracking-wider font-mono text-zinc-500 block">Fidelidade Regulatória Geral</span>
                <span className="text-sm font-extrabold text-zinc-200 block mt-0.5">Média Ponderada ROS</span>
                <span className="text-[10px] text-zinc-500 block">Ativos: {obligations.length} artigos nesta data</span>
              </div>
            </div>

            {/* Risk rating */}
            <div className="bg-black/40 p-4 rounded-2xl border border-neutral-900/60 flex flex-col justify-between">
              <div>
                <span className="text-[9px] uppercase tracking-wider font-mono text-zinc-500 block">Risco Regulatório Acumulado</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`w-3 h-3 rounded-full animate-pulse ${
                    report.overallRisk === 'Critical' ? 'bg-rose-500' :
                    report.overallRisk === 'High' ? 'bg-orange-500' :
                    report.overallRisk === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`} />
                  <span className={`text-xl font-black uppercase ${
                    report.overallRisk === 'Critical' ? 'text-rose-400' :
                    report.overallRisk === 'High' ? 'text-orange-400' :
                    report.overallRisk === 'Medium' ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {report.overallRisk === 'Critical' ? 'Crítico' :
                     report.overallRisk === 'High' ? 'Alto' :
                     report.overallRisk === 'Medium' ? 'Risco Médio' : 'Baixo (Seguro)'}
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-zinc-500">
                Ponderado por artigos críticos de custódia, lastro de moeda e proteção ao consumidor sem testes ou auditorias síncronas.
              </p>
            </div>

            {/* Active tracking coverage */}
            <div className="bg-black/40 p-4 rounded-2xl border border-neutral-900/60 flex flex-col justify-between">
              <div>
                <span className="text-[9px] uppercase tracking-wider font-mono text-zinc-500 block">Rastreabilidade Ativa de Domínio</span>
                <div className="text-xl font-black text-white mt-1">
                  {obligations.filter(o => o.implementationStatus === 'Implemented').length} / {obligations.length} <span className="text-zinc-500 text-xs font-normal">Artigos Cobertos</span>
                </div>
              </div>
              <div className="w-full bg-neutral-950 rounded-full h-1.5 border border-neutral-900 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#B87333] to-amber-500"
                  style={{ width: `${(obligations.filter(o => o.implementationStatus === 'Implemented').length / (obligations.length || 1)) * 100}%` }}
                />
              </div>
              <p className="text-[10px] text-zinc-500">
                Garantia estrita de que nenhum comportamento do domínio financeiro é implementado sem respaldo legal correspondente.
              </p>
            </div>
          </div>

          {/* ACTIVE CONSISTENCY AUDITOR */}
          <div className="border border-neutral-900/60 p-5 rounded-2xl bg-black/40 space-y-4">
            <h3 className="text-xs uppercase tracking-wider text-zinc-400 font-extrabold font-mono flex items-center justify-between border-b border-neutral-900 pb-3">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-[#B87333]" />
                <span>Diagnóstico Automático de Consistência Regulatória</span>
              </span>
              <button 
                onClick={handleRecalculate}
                className="text-[9px] text-[#B87333] border border-amber-900/40 px-2 py-0.5 rounded uppercase hover:bg-amber-950/20"
              >
                Auditar Agora
              </button>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {([
                { 
                  question: "Artigo de lei sem mapeamento de código funcional?", 
                  passed: auditResult.orphanedObligations.length === 0,
                  failDesc: `${auditResult.orphanedObligations.length} obrigações sem Use Case mapeado (${auditResult.orphanedObligations.join(', ')}).`,
                  passDesc: "Todos os artigos cadastrados possuem mapeamento explícito com Use Cases ou Repositórios."
                },
                { 
                  question: "Implementação funcional sem fundamento regulatório?", 
                  passed: auditResult.useCasesWithoutRegulations.length === 0,
                  failDesc: `Os seguintes use cases não declaram fundamento legal: ${auditResult.useCasesWithoutRegulations.join(', ')}.`,
                  passDesc: "Todas as classes de Use Case do domínio financeiro declaram cobertura jurídica válida."
                },
                { 
                  question: "Obrigação ativa sem suite de teste regulatório?", 
                  passed: auditResult.testlessObligations.length === 0,
                  failDesc: `Artigos implementados sem testes vinculados: ${auditResult.testlessObligations.join(', ')}.`,
                  passDesc: "Todos os artigos ativos com marcação de teste exigido estão cobertos por suites automatizadas."
                },
                { 
                  question: "Exigência de auditoria sem telemetria estruturada?", 
                  passed: auditResult.obligationsWithoutMetrics.length === 0,
                  failDesc: `Artigos sem monitoramento ativo de auditoria: ${auditResult.obligationsWithoutMetrics.join(', ')}.`,
                  passDesc: "Todos os artigos com exigência de auditoria geram logs estruturados e métricas de monitorização."
                },
              ] as const).map((item, index) => (
                <div key={index} className="p-3 rounded-xl border border-neutral-900 bg-neutral-950/60 flex items-start gap-3">
                  {item.passed ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
                  )}
                  <div className="space-y-1 text-left text-xs leading-relaxed">
                    <div className="font-extrabold text-zinc-200 uppercase tracking-wide text-[10px]">{item.question}</div>
                    <p className="text-zinc-400 text-[10.5px]">
                      {item.passed ? item.passDesc : item.failDesc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* WEIGHTED DIMENSION SLIDERS / GAUGES */}
          <div className="space-y-4">
            <h3 className="text-xs uppercase tracking-wider text-zinc-400 font-extrabold font-mono flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-zinc-500" />
              <span>Detalhamento Multidimensional de Cobertura Regulatória</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(Object.entries(report.byDimension) as Array<[string, number]>).map(([key, val]) => (
                <div key={key} className="bg-[#0e0a09]/50 border border-neutral-900/60 p-4 rounded-xl flex flex-col justify-between space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="text-left">
                      <h4 className="font-bold text-zinc-200 text-xs uppercase tracking-wider">{getDimensionLabel(key)}</h4>
                      <p className="text-[10px] text-zinc-500 leading-normal">{getDimensionDesc(key)}</p>
                    </div>
                    <span className={`text-xs font-mono font-black ${
                      val >= 90 ? 'text-emerald-400' : val >= 50 ? 'text-amber-400' : 'text-rose-400'
                    }`}>{val}%</span>
                  </div>
                  
                  <div className="w-full bg-neutral-950 rounded-full h-1.5 border border-neutral-900 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${
                        val >= 90 ? 'bg-emerald-500' : val >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${val}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Matrix */}
      {subTab === "matrix" && (
        <div className="space-y-4">
          {/* SEARCH & FILTERS */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:max-w-md">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Filtrar por artigo, descrição, lei, ator..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-neutral-950 border border-neutral-900 rounded-xl font-mono text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-900/40"
              />
            </div>
            <span className="text-[10px] text-zinc-500 font-mono uppercase shrink-0">
              {filteredObligations.length} obrigações vigentes em {activeDate}
            </span>
          </div>

          {/* TABLE CONTAINER */}
          <div className="border border-neutral-900 rounded-xl overflow-hidden bg-black/40">
            <div className="grid grid-cols-12 bg-neutral-950 p-3 text-[9px] uppercase tracking-wider font-extrabold text-zinc-500 border-b border-neutral-900 font-mono select-none">
              <div className="col-span-2">ID</div>
              <div className="col-span-3">Norma / Artigo</div>
              <div className="col-span-5">Exigência Legal (Constraint)</div>
              <div className="col-span-2 text-right">Status</div>
            </div>

            {filteredObligations.length === 0 ? (
              <div className="p-8 text-center text-zinc-600 text-xs font-mono">
                Nenhum requisito legal encontrado para a sua busca ou regime de data selecionado.
              </div>
            ) : (
              <div className="divide-y divide-neutral-900/60">
                {filteredObligations.map((o) => {
                  const isExpanded = expandedRow === o.id;
                  return (
                     <div key={o.id} className="transition-all">
                      {/* Base Row */}
                      <div 
                        onClick={() => setExpandedRow(isExpanded ? null : o.id)}
                        className="grid grid-cols-12 p-3 text-xs items-center hover:bg-neutral-950/40 transition-all cursor-pointer font-mono"
                      >
                        <div className="col-span-2 text-[#B87333] font-bold">{o.id}</div>
                        <div className="col-span-3 text-zinc-200 font-extrabold leading-tight">
                          {o.artigo}
                          <span className="block text-[8px] text-zinc-500 font-normal uppercase mt-0.5">{o.lei}</span>
                        </div>
                        <div className="col-span-5 text-zinc-400 text-[11px] pr-4 line-clamp-2">
                          {o.constraint}
                        </div>
                        <div className="col-span-2 text-right">
                          <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${getStatusColor(o.implementationStatus)}`}>
                            {getStatusLabel(o.implementationStatus)}
                          </span>
                        </div>
                      </div>

                      {/* Expanded Traceability & Dossier Details */}
                      {isExpanded && (
                        <div className="bg-neutral-950/60 p-4 border-t border-b border-neutral-900 text-xs leading-relaxed space-y-4 text-zinc-400">
                          {/* Metadata row */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-neutral-900/60 pb-3">
                            <div>
                              <span className="text-[8px] uppercase tracking-wider text-zinc-500 font-mono block">Severidade Reguladora</span>
                              <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border mt-1 ${getSeverityColor(o.severity)}`}>
                                {o.severity}
                              </span>
                            </div>
                            <div>
                              <span className="text-[8px] uppercase tracking-wider text-zinc-500 font-mono block">Ator Alvo</span>
                              <span className="text-[11px] font-bold text-zinc-300 block mt-1">{o.actor}</span>
                            </div>
                            <div>
                              <span className="text-[8px] uppercase tracking-wider text-zinc-500 font-mono block">Gatilho de Execução</span>
                              <span className="text-[11px] font-mono text-zinc-300 block mt-1">{o.trigger}</span>
                            </div>
                          </div>

                          {/* Full rule description */}
                          <div className="space-y-1">
                            <span className="text-[8px] uppercase tracking-wider text-zinc-500 font-mono block">Descrição Regulatória Detalhada</span>
                            <p className="text-zinc-300 text-[11px]">{o.description}</p>
                          </div>

                          {/* Concepts, Rights, Prohibitions */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-neutral-900/30 p-3 rounded-lg border border-neutral-900/60">
                            <div>
                              <span className="text-[8.5px] uppercase font-mono text-[#B87333] block mb-1">Conceitos Chave</span>
                              <div className="space-y-1">
                                {o.concepts && o.concepts.length > 0 ? o.concepts.map((concept, idx) => (
                                  <div key={idx} className="text-zinc-300 text-[10px]">• {concept}</div>
                                )) : <span className="text-zinc-600 italic">Nenhum mapeado</span>}
                              </div>
                            </div>
                            <div>
                              <span className="text-[8.5px] uppercase font-mono text-emerald-400 block mb-1">Direitos Garantidos</span>
                              <div className="space-y-1">
                                {o.rights && o.rights.length > 0 ? o.rights.map((right, idx) => (
                                  <div key={idx} className="text-zinc-300 text-[10px]">• {right}</div>
                                )) : <span className="text-zinc-600 italic">Nenhum mapeado</span>}
                              </div>
                            </div>
                            <div>
                              <span className="text-[8.5px] uppercase font-mono text-rose-400 block mb-1">Proibições Estritas</span>
                              <div className="space-y-1">
                                {o.prohibitions && o.prohibitions.length > 0 ? o.prohibitions.map((prohibition, idx) => (
                                  <div key={idx} className="text-zinc-300 text-[10px]">• {prohibition}</div>
                                )) : <span className="text-zinc-600 italic">Nenhum mapeado</span>}
                              </div>
                            </div>
                          </div>

                          {/* ACTIVE EVIDENCE COMPLIANCE ENGINE (NEW) */}
                          <div className="space-y-2 border-t border-neutral-900/60 pt-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] uppercase tracking-wider text-zinc-300 font-mono font-black">
                                Dossier de Evidência Auditável (Digital Twin Proof)
                              </span>
                              <div className="flex gap-2 text-[9px] font-mono">
                                <button
                                  onClick={(e) => { e.stopPropagation(); setEvidenceTab("ledger"); }}
                                  className={`px-2 py-0.5 rounded border ${evidenceTab === "ledger" ? "bg-amber-950/20 text-[#B87333] border-amber-900/40" : "bg-transparent border-transparent text-zinc-500"}`}
                                >
                                  Ledger / Reconciliação
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setEvidenceTab("testing"); }}
                                  className={`px-2 py-0.5 rounded border ${evidenceTab === "testing" ? "bg-emerald-950/20 text-emerald-400 border-emerald-900/40" : "bg-transparent border-transparent text-zinc-500"}`}
                                >
                                  Robustez & Testes
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setEvidenceTab("telemetry"); }}
                                  className={`px-2 py-0.5 rounded border ${evidenceTab === "telemetry" ? "bg-sky-950/20 text-sky-400 border-sky-900/40" : "bg-transparent border-transparent text-zinc-500"}`}
                                >
                                  Métricas / Logs
                                </button>
                              </div>
                            </div>

                            <div className="bg-[#0c0908]/80 p-3 rounded-lg border border-neutral-900 font-mono text-[10px]">
                              {evidenceTab === "ledger" && (
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center text-[#B87333]">
                                    <span className="flex items-center gap-1"><Database className="w-3.5 h-3.5" /> Mapeamento Contábil Síncrono:</span>
                                    <span className="text-zinc-500 font-normal">Retenção Mínima BNA: {o.evidenceRequired?.retentionPeriodYears || 5} anos</span>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-zinc-400">
                                    <div>
                                      <span className="text-zinc-500 block text-[9px]">Tabelas Envolvidas:</span>
                                      {o.evidenceRequired?.databaseTables.map((t, idx) => (
                                        <div key={idx} className="text-zinc-200 mt-0.5">📂 schema.{t}</div>
                                      )) || <span className="italic text-zinc-600">Nenhuma cadastrada</span>}
                                    </div>
                                    <div>
                                      <span className="text-zinc-500 block text-[9px]">Hash de Integridade (Ledger Seal):</span>
                                      <span className="text-zinc-300 block select-all">SHA256: 0x{o.id.charCodeAt(0).toString(16)}...9f3c7e</span>
                                      <span className="text-[9px] text-zinc-500 block mt-0.5">✓ Reconciliação automatizada nas primeiras 24 horas</span>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {evidenceTab === "testing" && (
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center text-emerald-400">
                                    <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Suite de Validação de Invariantes:</span>
                                    <span>Conformidade Operacional: 100%</span>
                                  </div>
                                  <div className="space-y-1 text-zinc-300">
                                    <div className="flex justify-between">
                                      <span>Módulo Core de Teste:</span>
                                      <span className="text-zinc-400 text-[9px] select-all">backend/application/usecases/{o.linkedUseCases[0] || "TransferUseCase"}.test.ts</span>
                                    </div>
                                    <div className="text-[9px] text-zinc-500">
                                      ✓ Invariante de Segurança: Sem sobredraft na emissão financeira<br />
                                      ✓ Invariante de Segurança: Desafio síncrono biométrico em transações de alta quantia
                                    </div>
                                  </div>
                                </div>
                              )}

                              {evidenceTab === "telemetry" && (
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center text-sky-400">
                                    <span className="flex items-center gap-1"><Activity className="w-3.5 h-3.5" /> Monitorização e Telemetria:</span>
                                    <span>Status: ATIVO</span>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-zinc-400">
                                    <div>
                                      <span className="text-zinc-500 block text-[9px]">Métrica Prometheus:</span>
                                      {o.linkedMetrics.map((m, idx) => (
                                        <div key={idx} className="text-zinc-200 mt-0.5">📈 {m}</div>
                                      )) || <span className="italic text-zinc-600">Sem métricas</span>}
                                    </div>
                                    <div>
                                      <span className="text-zinc-500 block text-[9px]">Logs de Conformidade:</span>
                                      {o.evidenceRequired?.logs.map((l, idx) => (
                                        <div key={idx} className="text-purple-400 mt-0.5">ℹ️ {l}</div>
                                      )) || <span className="italic text-zinc-600">Sem logs</span>}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Content: Gaps */}
      {subTab === "gaps" && (
        <div className="space-y-5">
          <div className="bg-[#120606] border border-rose-950/40 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1 leading-snug">
              <span className="text-[8px] text-rose-500 font-bold uppercase tracking-widest block">Remediação Regulatória Priorizada</span>
              <h4 className="text-xs text-zinc-200 font-extrabold flex items-center gap-1.5 uppercase tracking-wide">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span>Lacunas de Auditoria Detectadas no Core Financeiro</span>
              </h4>
              <p className="text-[10px] text-zinc-500 max-w-2xl leading-normal">
                Análise heurística de conformidade identificando automaticamente artigos ausentes, use cases sem testes de estresse, ou relatórios obrigatórios sem logs vinculados.
              </p>
            </div>
            <span className="text-xs px-3 py-1 bg-rose-950/30 text-rose-400 border border-rose-900/30 rounded-xl font-mono font-black shrink-0">
              {gaps.length} Lacunas Pendentes
            </span>
          </div>

          <div className="space-y-3">
            {gaps.map((g) => (
              <div 
                key={g.id} 
                className="bg-neutral-950/40 border border-neutral-900 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 font-mono text-xs hover:border-neutral-800 transition-all"
              >
                <div className="space-y-1.5 text-left">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-rose-400 font-black">{g.id}</span>
                    <span className="w-1 h-1 rounded-full bg-zinc-700" />
                    <span className="text-[#B87333] font-bold uppercase text-[10px]">Artigo: {g.obligationId}</span>
                    <span className="w-1 h-1 rounded-full bg-zinc-700" />
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${getSeverityColor(g.priority)}`}>
                      Risco: {g.priority}
                    </span>
                  </div>
                  <p className="text-zinc-300 text-[11px] leading-relaxed font-sans">{g.description}</p>
                  
                  {/* File impact paths */}
                  <div className="flex items-center gap-1 text-[9px] text-zinc-500 flex-wrap">
                    <span className="font-bold">Diretório / Arquivos Alvo:</span>
                    {g.filesInvolved.map((f, i) => (
                      <span key={i} className="bg-neutral-900 px-1 rounded border border-neutral-800 font-mono text-[9px]">{f}</span>
                    ))}
                  </div>
                </div>

                <div className="text-right flex flex-col items-end gap-1.5 shrink-0 self-end md:self-auto">
                  <span className="text-[8px] text-zinc-500 uppercase font-mono block">Ordem Recomendada</span>
                  <div className="text-xl font-black text-white bg-neutral-900 w-8 h-8 rounded-full border border-neutral-800 flex items-center justify-center">
                    {g.recommendedOrder}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content: Impact */}
      {subTab === "impact" && (
        <div className="space-y-5">
          <div className="bg-[#0c0807]/50 border border-neutral-900 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-0.5 leading-tight">
              <span className="text-[8px] text-[#B87333] font-bold uppercase tracking-widest block">Simulador de Impacto Regulatório (RIA Playground)</span>
              <h4 className="text-xs text-zinc-200 font-bold uppercase">Mapeamento Dinâmico de Efeito Cascata de Normas</h4>
            </div>

            {/* Interactive Article Dropdown */}
            <div className="flex items-center gap-2 w-full sm:w-auto font-mono text-xs">
              <span className="text-zinc-500 uppercase text-[10px] shrink-0">Selecione o Artigo:</span>
              <select
                value={selectedArticleId}
                onChange={(e) => setSelectedArticleId(e.target.value)}
                className="bg-neutral-950 border border-neutral-900 rounded-xl px-3 py-2 text-zinc-200 outline-none cursor-pointer w-full sm:w-auto font-mono text-xs"
              >
                {obligations.map(o => (
                  <option key={o.id} value={o.id} className="bg-neutral-950 text-zinc-300 font-mono">
                    {o.id} - {o.artigo}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* IMPACT REPORT PANELS */}
          {impactResult && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 font-mono text-xs">
              {/* Left Column: Metrics & Estimation (4 cols) */}
              <div className="md:col-span-4 bg-neutral-950/50 border border-neutral-900/60 p-4 rounded-2xl space-y-4">
                <div className="text-center md:text-left space-y-1">
                  <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-mono">Estimativa de Esforço Técnico</span>
                  <div className="text-4xl font-black text-amber-500">
                    ~{impactResult.estimatedEffortInHours}h
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-1 font-sans">
                    Esforço estimado para alteração e homologação conforme diretrizes de auditoria do BNA.
                  </p>
                </div>

                <div className="space-y-3.5 border-t border-neutral-900/80 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-zinc-400">Cascata de Regulação:</span>
                    <span className="px-2 py-0.5 bg-purple-950/20 text-purple-400 border border-purple-900/30 rounded text-[10px] font-bold">
                      {impactResult.affectedEvents.length} Eventos Afetados
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-zinc-400">Impacto em Aggregates:</span>
                    <span className="px-2 py-0.5 bg-sky-950/20 text-sky-400 border border-sky-900/30 rounded text-[10px] font-bold">
                      {impactResult.affectedAggregates.length} Core Aggregates
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-zinc-400">Casos de Teste Afetados:</span>
                    <span className="px-2 py-0.5 bg-emerald-950/20 text-emerald-400 border border-emerald-900/30 rounded text-[10px] font-bold">
                      {impactResult.affectedTestFiles.length} Test Suites
                    </span>
                  </div>
                </div>

                {/* CASCADE RULE VISUALIZER */}
                <div className="bg-black/60 p-3 rounded-xl border border-neutral-900/60 text-left space-y-2">
                  <span className="text-[8px] uppercase tracking-wider text-zinc-500 font-mono font-bold block">
                    Grafo de Dependência (Downstream impact)
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="bg-amber-950/30 border border-amber-900/30 px-1.5 py-0.5 rounded text-[10px] font-bold text-[#B87333]">
                      {selectedArticleId}
                    </span>
                    {impactAnalyzer.getDependentRulesRecursive(selectedArticleId).map(id => (
                      <React.Fragment key={id}>
                        <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
                        <span className="bg-rose-950/20 border border-rose-900/20 px-1.5 py-0.5 rounded text-[10px] font-bold text-rose-400 animate-pulse">
                          {id}
                        </span>
                      </React.Fragment>
                    ))}
                    {impactAnalyzer.getDependentRulesRecursive(selectedArticleId).length === 0 && (
                      <span className="text-zinc-600 text-[10px] italic">Sem regras dependentes diretas.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Files & Code Impact lists (8 cols) */}
              <div className="md:col-span-8 bg-neutral-950/30 border border-neutral-900/60 p-5 rounded-2xl space-y-4">
                {/* Impact Narrative */}
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-900 space-y-1">
                  <span className="text-[8px] uppercase tracking-wider text-[#B87333] font-bold block">Análise Narrativa de Impacto Técnico</span>
                  <p className="text-zinc-300 font-sans text-xs leading-relaxed text-left">{impactResult.explanation}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Aggregates & APIs */}
                  <div className="bg-black/40 p-3.5 rounded-xl border border-neutral-900/60 space-y-2.5">
                    <span className="text-[9px] uppercase font-bold text-[#B87333] flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5" /> Aggregates & APIs Afetados
                    </span>
                    <div className="space-y-1.5">
                      {impactResult.affectedAggregates.map(agg => (
                        <div key={agg} className="flex items-center gap-1.5 text-zinc-300">
                          <ChevronRight className="w-3 h-3 text-zinc-600" />
                          <span>Aggregate:</span>
                          <span className="text-white font-bold">{agg}</span>
                        </div>
                      ))}
                      {impactResult.affectedApis.map(api => (
                        <div key={api} className="flex items-center gap-1.5 text-zinc-300">
                          <ChevronRight className="w-3 h-3 text-zinc-600" />
                          <span>REST Endpoint:</span>
                          <span className="text-sky-400">{api}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Domain Events & Testing */}
                  <div className="bg-black/40 p-3.5 rounded-xl border border-neutral-900/60 space-y-2.5">
                    <span className="text-[9px] uppercase font-bold text-sky-400 flex items-center gap-1">
                      <Activity className="w-3.5 h-3.5" /> Testes & Eventos de Domínio
                    </span>
                    <div className="space-y-1.5">
                      {impactResult.affectedEvents.map(ev => (
                        <div key={ev} className="flex items-center gap-1.5 text-zinc-300">
                          <ChevronRight className="w-3 h-3 text-zinc-600" />
                          <span>Event:</span>
                          <span className="text-purple-400 font-bold">{ev}</span>
                        </div>
                      ))}
                      {impactResult.affectedTestFiles.map(tf => (
                        <div key={tf} className="flex items-center gap-1.5 text-zinc-300">
                          <ChevronRight className="w-3 h-3 text-zinc-600" />
                          <span>Test File:</span>
                          <span className="text-emerald-400 truncate max-w-[180px]" title={tf}>{tf.split('/').pop()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Audit logging & dashboards impact */}
                <div className="bg-black/40 p-3.5 rounded-xl border border-neutral-900/60 space-y-2.5">
                  <span className="text-[9px] uppercase font-bold text-purple-400 flex items-center gap-1">
                    <Terminal className="w-3.5 h-3.5" /> Registos Logísticos & Monitorização
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-zinc-400 text-[10px]">
                    <div className="space-y-1">
                      <span className="text-[8px] text-zinc-500 font-bold uppercase block">Logs Estruturados Afetados:</span>
                      {impactResult.affectedLogs.map(log => (
                        <div key={log} className="text-zinc-300 font-mono text-[9px]">{log}</div>
                      ))}
                    </div>
                    <div className="space-y-1">
                      <span className="text-[8px] text-zinc-500 font-bold uppercase block">Painéis / Desks Afetados:</span>
                      {impactResult.affectedDashboards.map(dash => (
                        <div key={dash} className="text-[#B87333] font-bold text-[10px]">{dash}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Compiler (NEW) */}
      {subTab === "compiler" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 font-mono text-xs">
            {/* Left Column: Code DSL input (7 cols) */}
            <div className="lg:col-span-7 bg-neutral-950/50 border border-neutral-900/60 p-4 rounded-2xl space-y-3 flex flex-col">
              <div className="flex justify-between items-center border-b border-neutral-900 pb-2">
                <span className="text-[10px] text-zinc-300 font-extrabold uppercase tracking-wide flex items-center gap-1">
                  <FileCode className="w-4 h-4 text-[#B87333]" /> Editor Compliance DSL (YAML-Spec)
                </span>
                <span className="text-[9px] text-zinc-500">Lei n.º 40/20 & Avisos BNA</span>
              </div>
              
              <textarea
                value={dslContent}
                onChange={(e) => setDslContent(e.target.value)}
                className="w-full h-72 bg-black border border-neutral-900/80 rounded-xl p-3 font-mono text-[11px] leading-relaxed text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-amber-900/40 resize-none"
              />

              <div className="flex justify-between items-center gap-3">
                <button
                  onClick={() => setDslContent(DEFAULT_DSL_SAMPLE)}
                  className="px-3 py-1.5 text-[9px] text-zinc-500 hover:text-zinc-300 transition-all font-bold border border-neutral-900 hover:border-neutral-800 rounded-lg cursor-pointer"
                >
                  Carregar Amostra BNA
                </button>
                <button
                  onClick={handleCompileDsl}
                  className="px-4 py-2 bg-amber-950/20 hover:bg-amber-950/40 text-[#B87333] border border-amber-900/40 rounded-lg font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <FolderSync className="w-4 h-4" /> Compilar Regra DSL
                </button>
              </div>

              {/* Compile results */}
              {dslCompileResult && (
                <div className={`mt-3 p-3 rounded-xl border ${
                  dslCompileResult.success 
                    ? "bg-emerald-950/10 border-emerald-900/30 text-zinc-300" 
                    : "bg-rose-950/10 border-rose-900/30 text-rose-300"
                }`}>
                  <span className="text-[9px] uppercase tracking-wider font-extrabold block">Resultado da Compilação:</span>
                  <div className="flex items-center gap-2 mt-1 font-bold">
                    {dslCompileResult.success ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400">BUILD SUCCESSFUL</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-rose-400" />
                        <span className="text-rose-400">ERRO DE SINTAXE DSL</span>
                      </>
                    )}
                  </div>
                  {dslCompileResult.success && dslCompileResult.rule ? (
                    <p className="text-[10px] mt-1 text-zinc-400">
                      Regra compilada síncronamente: <span className="text-[#B87333] font-bold">{dslCompileResult.rule.article}</span> do diploma <span className="text-white font-bold">{dslCompileResult.rule.lei}</span>. 
                      Foi injetada na Compliance Matrix e alterou os parâmetros de risco do Gêmeo Digital.
                    </p>
                  ) : (
                    <p className="text-[10px] mt-1 font-mono text-rose-300">{dslCompileResult.error}</p>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: Compiler Policies & Test runner (5 cols) */}
            <div className="lg:col-span-5 bg-neutral-950/50 border border-neutral-900/60 p-4 rounded-2xl space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="border-b border-neutral-900 pb-2">
                  <span className="text-[10px] text-zinc-300 font-extrabold uppercase tracking-wide flex items-center gap-1">
                    <Sliders className="w-4 h-4 text-zinc-500" /> Políticas de Build do Compilador
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between p-2 rounded bg-black/40 border border-neutral-900">
                    <label htmlFor="policyTests" className="text-[10px] text-zinc-400 cursor-pointer">
                      Barrar Build se houver Artigo sem Teste
                    </label>
                    <input 
                      id="policyTests"
                      type="checkbox" 
                      checked={policyRequireTests}
                      onChange={(e) => setPolicyRequireTests(e.target.checked)}
                      className="accent-[#B87333] cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-black/40 border border-neutral-900">
                    <label htmlFor="policyMetrics" className="text-[10px] text-zinc-400 cursor-pointer">
                      Barrar Build se houver Artigo sem Métrica
                    </label>
                    <input 
                      id="policyMetrics"
                      type="checkbox" 
                      checked={policyRequireMetrics}
                      onChange={(e) => setPolicyRequireMetrics(e.target.checked)}
                      className="accent-[#B87333] cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-black/40 border border-neutral-900">
                    <label htmlFor="policyRetention" className="text-[10px] text-zinc-400 cursor-pointer">
                      Barrar se período de retenção for &lt; 5 anos
                    </label>
                    <input 
                      id="policyRetention"
                      type="checkbox" 
                      checked={policyMinRetention}
                      onChange={(e) => setPolicyMinRetention(e.target.checked)}
                      className="accent-[#B87333] cursor-pointer"
                    />
                  </div>
                </div>

                <button
                  onClick={handleRunCompilerBuild}
                  disabled={compilerBuildStatus === "RUNNING"}
                  className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-bold border border-zinc-800 rounded-lg uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 text-[#B87333]" /> Executar Build de Conformidade
                </button>
              </div>

              {/* Terminal Logs representation */}
              <div className="bg-black/90 rounded-xl p-3 border border-neutral-900 font-mono text-[9.5px] leading-relaxed text-left">
                <span className="text-zinc-500 uppercase tracking-wider block border-b border-neutral-900 pb-1 flex items-center gap-1.5">
                  <Terminal className="w-3 h-3 text-[#B87333]" /> Terminal de Build Regulatório
                </span>
                
                <div className="h-44 overflow-y-auto mt-2 space-y-1.5 scrollbar-thin select-all">
                  {compilerBuildLogs.length === 0 ? (
                    <span className="text-zinc-600 block italic">Aguardando execução do build...</span>
                  ) : (
                    compilerBuildLogs.map((log, idx) => {
                      let color = "text-zinc-400";
                      if (log.startsWith("[ERRO]")) color = "text-rose-400 font-bold";
                      if (log.startsWith("[BUILD SUCCESSFUL]")) color = "text-emerald-400 font-bold";
                      if (log.startsWith("[BUILD FAILED]")) color = "text-rose-500 font-black";
                      if (log.startsWith("[ROS-COMPILER]")) color = "text-sky-400";
                      return <div key={idx} className={color}>{log}</div>;
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Versions (Gêmeo Digital & Grafo) */}
      {subTab === "versions" && (
        <div className="space-y-5">
          <div className="bg-black/40 border border-neutral-900 p-5 rounded-2xl space-y-2 text-left">
            <h3 className="text-xs uppercase tracking-wider text-zinc-200 font-extrabold font-mono flex items-center gap-1.5 border-b border-neutral-900 pb-3">
              <Calendar className="w-4 h-4 text-[#B87333]" />
              <span>Gêmeo Regulatório Digital & Linha de Coexistência Normativa</span>
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              O ecossistema regulatório angolano é versionado de forma robusta no ROS. Várias normas, avisos e instruções técnicas coexistem harmonicamente sem necessidade de alteração ou reescrita direta do domínio financeiro:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-3">
              {/* Left Column Timeline (7 cols) */}
              <div className="md:col-span-7 space-y-4">
                {([
                  { 
                    ver: "Lei n.º 40/20", 
                    date: "Dezembro 2020",
                    title: "Lei do Sistema de Pagamentos de Angola (LSPA)",
                    desc: "Norma principal soberana definindo a liquidação irrevogável, fiduciários de custódia e SCA.",
                    status: "Soberana"
                  },
                  { 
                    ver: "Aviso n.º 11/20", 
                    date: "Dezembro 2020",
                    title: "Framework de Prevenção de Branqueamento de Capitais",
                    desc: "Define limites KYC estritos e análise continuada de perfil de transações de risco no KwanzaMóvel.",
                    status: "Complementa L40-ART-93"
                  },
                  { 
                    ver: "Aviso n.º 10/20", 
                    date: "Novembro 2020",
                    title: "Regulamento sobre Tarifas e MDR de Lojistas",
                    desc: "Estabelece teto máximo das taxas de intercâmbio comercial e tarifas de micro-pagamento.",
                    status: "Modifica L40-ART-18"
                  },
                  { 
                    ver: "Aviso n.º 03/22", 
                    date: "Fevereiro 2022",
                    title: "Regulamento de Contas de Pagamento Simplificadas",
                    desc: "Facilita inclusão financeira flexibilizando KYC inicial para Level-1. Abre limite transacional diário.",
                    status: "Complementa L40-ART-93"
                  }
                ] as const).map((timeline, idx) => (
                  <div key={idx} className="relative pl-6 border-l-2 border-neutral-900 pb-4 last:pb-0 font-mono text-xs text-left">
                    <span className="absolute left-0 top-1 w-2.5 h-2.5 rounded-full bg-[#B87333] transform -translate-x-[6px]" />
                    <div className="flex justify-between items-start flex-wrap gap-1">
                      <span className="font-black text-white">{timeline.ver}</span>
                      <span className="text-[10px] text-zinc-500">{timeline.date}</span>
                    </div>
                    <div className="text-[11px] font-extrabold text-[#B87333] mt-0.5 uppercase tracking-wide">{timeline.title}</div>
                    <p className="text-zinc-400 font-sans text-[11px] leading-relaxed mt-1">{timeline.desc}</p>
                    <span className="inline-block mt-2 px-2 py-0.5 bg-neutral-900 border border-neutral-800 rounded text-[9px] font-extrabold uppercase text-zinc-400">
                      Relação: {timeline.status}
                    </span>
                  </div>
                ))}
              </div>

              {/* Right Column INTERACTIVE Dependency Graph (5 cols) */}
              <div className="md:col-span-5 bg-black/60 p-4 rounded-xl border border-neutral-900/80 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold block mb-3 font-mono">
                    Grafo de Dependência Interativo (Clique para Explorar)
                  </span>
                  
                  {/* Schematic box-diagram representing dependency flows */}
                  <div className="space-y-2.5 font-mono text-[10px] text-zinc-400 select-none">
                    <div 
                      onClick={() => setSelectedGraphNode("Lei 40/20")}
                      className={`p-2.5 rounded border text-center font-bold uppercase transition-all cursor-pointer ${
                        selectedGraphNode === "Lei 40/20"
                          ? "bg-amber-950/40 text-white border-[#B87333]"
                          : "bg-neutral-950 border-neutral-900 hover:border-neutral-800"
                      }`}
                    >
                      ⚖️ Lei n.º 40/20 (Norma Mãe)
                    </div>
                    <div className="flex justify-center">
                      <div className="h-3.5 border-l-2 border-dashed border-zinc-700" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div 
                        onClick={() => setSelectedGraphNode("Aviso 11/20")}
                        className={`p-2 rounded text-center transition-all cursor-pointer ${
                          selectedGraphNode === "Aviso 11/20"
                            ? "bg-purple-950/40 text-purple-200 border-purple-800"
                            : "bg-neutral-950 border-neutral-900 hover:border-neutral-800"
                        }`}
                      >
                        📋 Aviso 11/20 (AML)
                      </div>
                      <div 
                        onClick={() => setSelectedGraphNode("Aviso 10/20")}
                        className={`p-2 rounded text-center transition-all cursor-pointer ${
                          selectedGraphNode === "Aviso 10/20"
                            ? "bg-orange-950/40 text-orange-200 border-orange-800"
                            : "bg-neutral-950 border-neutral-900 hover:border-neutral-800"
                        }`}
                      >
                        📉 Aviso 10/20 (MDR)
                      </div>
                    </div>
                    <div className="flex justify-around">
                      <div className="h-3.5 border-l-2 border-dashed border-zinc-700" />
                      <div className="h-3.5 border-l-2 border-dashed border-zinc-700" />
                    </div>
                    <div 
                      onClick={() => setSelectedGraphNode("KwanzaMóvel Domain")}
                      className={`p-2.5 rounded border text-center transition-all cursor-pointer ${
                        selectedGraphNode === "KwanzaMóvel Domain"
                          ? "bg-emerald-950/40 text-emerald-200 border-emerald-800"
                          : "bg-neutral-950 border-neutral-900 hover:border-neutral-800"
                      }`}
                    >
                      ⚡ Domínio KwanzaMóvel (FSM)
                    </div>
                    <div className="flex justify-center">
                      <div className="h-3.5 border-l-2 border-dashed border-zinc-700" />
                    </div>
                    <div 
                      onClick={() => setSelectedGraphNode("Ledger / SLA")}
                      className={`p-2 rounded border text-center text-[9px] transition-all cursor-pointer ${
                        selectedGraphNode === "Ledger / SLA"
                          ? "bg-neutral-900 text-white border-neutral-700"
                          : "bg-neutral-950 border-neutral-900 hover:border-neutral-800"
                      }`}
                    >
                      Suite de Robustez & Reconciliação
                    </div>
                  </div>

                  {/* Graph Explainer Box */}
                  <div className="mt-4 p-3 bg-neutral-950 rounded border border-neutral-900 text-left text-[10px]">
                    <span className="text-[8.5px] uppercase text-[#B87333] font-bold block mb-1">
                      Conexão Ativa: {selectedGraphNode}
                    </span>
                    <p className="text-zinc-400 leading-relaxed font-sans">
                      {selectedGraphNode === "Lei 40/20" && "Esta é a lei base sob a qual o KwanzaMóvel foi erguido. Modificações nela impactam 100% dos use cases funcionais de compensação, depósito e SCA."}
                      {selectedGraphNode === "Aviso 11/20" && "Aviso complementar que foca no combate ao financiamento de crimes. Alimenta síncronamente o TransferUseCase com heurísticas de KYC Level-1."}
                      {selectedGraphNode === "Aviso 10/20" && "Define taxas máximas permitidas. Alimenta MerchantPaymentUseCase e as validações de comissão do aggregate de Merchants."}
                      {selectedGraphNode === "KwanzaMóvel Domain" && "Camada de negócio puramente desacoplada que consome as regras regulatórias via interpretador síncrono. Permite trocar limites de transações sem redeploys."}
                      {selectedGraphNode === "Ledger / SLA" && "Garante integridade contábil dupla entrada, provando imutabilidade de balanços aos auditores do BNA via ledger imutável."}
                    </p>
                  </div>
                </div>

                <p className="text-[9.5px] text-zinc-500 leading-normal mt-4 font-sans text-left">
                  Este mapeamento de dependências é consumido em tempo real pelo <strong>Compliance Engine</strong> para auditar possíveis desalinhamentos funcionais em qualquer modificação do código de produção.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: ADR Architectural Decisions (NEW) */}
      {subTab === "adr" && (
        <div className="space-y-5">
          <div className="bg-neutral-950/40 border border-neutral-900 p-5 rounded-2xl space-y-2">
            <h3 className="text-xs uppercase tracking-wider text-zinc-200 font-extrabold font-mono flex items-center gap-1.5 border-b border-neutral-900 pb-3">
              <FileText className="w-4 h-4 text-[#B87333]" />
              <span>Decisões de Engenharia Regulatória (Architectural ADR Logs)</span>
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans text-left">
              O Registro de Decisões Arquiteturais de Conformidade (ADR-ROS) documenta formalmente as interpretações jurídicas adotadas pela equipe de arquitetura técnica e de negócios para cumprir os artigos regulatórios da Lei 40/20 e Avisos BNA.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 font-mono text-xs text-left">
            {/* Left side: List of active ADRs (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              {adrs.map(adr => (
                <div key={adr.id} className="bg-neutral-950/50 border border-neutral-900 rounded-xl p-4 space-y-3 hover:border-neutral-800 transition-all">
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[#B87333] font-black">{adr.id}</span>
                        <span className="text-zinc-600 font-normal">|</span>
                        <span className="text-zinc-300 font-bold uppercase text-[10px]">{adr.articleId}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#B87333]" />
                        <span className="text-zinc-500 text-[10px]">{adr.date}</span>
                      </div>
                      <h4 className="text-zinc-200 font-extrabold text-[12px]">{adr.title}</h4>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border border-emerald-900/30 text-emerald-400 bg-emerald-950/10">
                      {adr.status}
                    </span>
                  </div>

                  <p className="text-zinc-300 font-sans text-[11px] leading-relaxed">
                    <strong className="text-zinc-400">Interpretação e Engenharia:</strong> {adr.interpretation}
                  </p>
                  
                  <div className="p-2.5 bg-neutral-900/60 rounded border border-neutral-900/80 text-[10px] text-zinc-400">
                    <div className="mb-1"><strong className="text-zinc-500">Justificativa Jurídico-Técnica:</strong> {adr.justification}</div>
                    <div><strong className="text-zinc-500">Impacto na Arquitetura:</strong> {adr.architecturalImpact}</div>
                  </div>

                  <div className="text-[10px] text-zinc-500">
                    Proposto e Assinado por: <span className="text-zinc-300 font-bold">{adr.decisor}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Right side: Propose New ADR Form (5 cols) */}
            <div className="lg:col-span-5 bg-neutral-950/50 border border-neutral-900/60 p-4 rounded-2xl space-y-3 h-fit">
              <div className="border-b border-neutral-900 pb-2">
                <span className="text-[10px] text-zinc-300 font-extrabold uppercase tracking-wide flex items-center gap-1">
                  <Sliders className="w-4 h-4 text-[#B87333]" /> Propor Nova Decisão (ADR-ROS)
                </span>
              </div>

              {adrSuccessMsg && (
                <div className="p-3 bg-emerald-950/20 border border-emerald-900/40 text-emerald-400 rounded-lg text-[10.5px] font-bold">
                  ✓ {adrSuccessMsg}
                </div>
              )}

              <form onSubmit={handleAddAdr} className="space-y-3">
                <div className="space-y-1">
                  <label htmlFor="adrArticle" className="text-[9px] text-zinc-500 uppercase font-bold block">Artigo Legal de Referência</label>
                  <select
                    id="adrArticle"
                    value={newAdrArticle}
                    onChange={(e) => setNewAdrArticle(e.target.value)}
                    className="w-full bg-black border border-neutral-900 rounded-lg p-2 text-zinc-300 text-xs"
                  >
                    {obligations.map(o => (
                      <option key={o.id} value={o.id}>{o.id} - {o.artigo}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="adrTitle" className="text-[9px] text-zinc-500 uppercase font-bold block">Título da Decisão</label>
                  <input
                    id="adrTitle"
                    type="text"
                    required
                    placeholder="Ex: Segregação Patrimonial..."
                    value={newAdrTitle}
                    onChange={(e) => setNewAdrTitle(e.target.value)}
                    className="w-full bg-black border border-neutral-900 rounded-lg p-2 text-zinc-300 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="adrDecisor" className="text-[9px] text-zinc-500 uppercase font-bold block">Decisor / Autor</label>
                  <input
                    id="adrDecisor"
                    type="text"
                    placeholder="Ex: Eng. Mário Silva"
                    value={newAdrDecisor}
                    onChange={(e) => setNewAdrDecisor(e.target.value)}
                    className="w-full bg-black border border-neutral-900 rounded-lg p-2 text-zinc-300 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="adrInterp" className="text-[9px] text-zinc-500 uppercase font-bold block">Interpretação e Implementação Técnica</label>
                  <textarea
                    id="adrInterp"
                    required
                    placeholder="Explicação detalhada da interpretação arquitetural adotada..."
                    value={newAdrInterpretation}
                    onChange={(e) => setNewAdrInterpretation(e.target.value)}
                    className="w-full h-20 bg-black border border-neutral-900 rounded-lg p-2 text-zinc-300 text-xs resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="adrJust" className="text-[9px] text-zinc-500 uppercase font-bold block">Justificativa Jurídico-Técnica</label>
                  <input
                    id="adrJust"
                    type="text"
                    required
                    placeholder="Evita contaminação de caixa..."
                    value={newAdrJustification}
                    onChange={(e) => setNewAdrJustification(e.target.value)}
                    className="w-full bg-black border border-neutral-900 rounded-lg p-2 text-zinc-300 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="adrImpact" className="text-[9px] text-zinc-500 uppercase font-bold block">Impacto na Arquitetura</label>
                  <input
                    id="adrImpact"
                    type="text"
                    placeholder="Adoção de Ledger síncrono..."
                    value={newAdrImpact}
                    onChange={(e) => setNewAdrImpact(e.target.value)}
                    className="w-full bg-black border border-neutral-900 rounded-lg p-2 text-zinc-300 text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-amber-950/20 hover:bg-amber-950/40 text-[#B87333] border border-amber-900/40 rounded-lg font-black uppercase text-xs transition-all cursor-pointer mt-2"
                >
                  Registrar Decisão ADR
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Regulatory Knowledge Kernel (RKK) */}
      {subTab === "rkk" && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-[#0b0807]/50 border border-neutral-900 p-5 rounded-2xl text-left space-y-2">
            <h3 className="text-xs uppercase tracking-wider text-zinc-200 font-extrabold font-mono flex items-center gap-1.5 border-b border-neutral-900 pb-3">
              <BookOpen className="w-4 h-4 text-[#B87333]" />
              <span>Regulatory Knowledge Kernel (RKK) • Fonte Imutável da Lei 40/20</span>
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              O RKK atua como o núcleo rígido, versionado e imutável de inteligência jurídica do ROS. Ele mapeia as obrigações formais da Lei n.º 40/20 (Lei do Sistema de Pagamentos de Angola) em conceitos relacionais com semântica estrita, direitos garantidos aos utilizadores e proibições categóricas impostas aos participantes e prestadores.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3">
              <div className="bg-neutral-950/40 p-3 rounded-xl border border-neutral-900 text-center">
                <span className="text-[9px] uppercase font-mono text-zinc-500 block">Conceitos Chave</span>
                <span className="text-lg font-black text-amber-500 font-mono mt-1 block">
                  {rkk.getConcepts().length}
                </span>
              </div>
              <div className="bg-neutral-950/40 p-3 rounded-xl border border-neutral-900 text-center">
                <span className="text-[9px] uppercase font-mono text-zinc-500 block">Direitos Estruturados</span>
                <span className="text-lg font-black text-emerald-400 font-mono mt-1 block">
                  {rkk.getRights().length}
                </span>
              </div>
              <div className="bg-neutral-950/40 p-3 rounded-xl border border-neutral-900 text-center">
                <span className="text-[9px] uppercase font-mono text-zinc-500 block">Proibições Mapeadas</span>
                <span className="text-lg font-black text-rose-400 font-mono mt-1 block">
                  {rkk.getProhibitions().length}
                </span>
              </div>
              <div className="bg-neutral-950/40 p-3 rounded-xl border border-neutral-900 text-center">
                <span className="text-[9px] uppercase font-mono text-zinc-500 block">Artigos Monitorados</span>
                <span className="text-lg font-black text-zinc-300 font-mono mt-1 block">
                  {rkk.getAllObligations().length}
                </span>
              </div>
            </div>
          </div>

          {/* INTERNAL RKK TABS */}
          <div className="bg-[#0b0807]/30 border border-neutral-900 p-5 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-900/60 pb-3">
              <div className="flex gap-2">
                {(["concepts", "rights", "prohibitions"] as const).map((sub) => {
                  const subLabels = {
                    concepts: "Glossário de Conceitos",
                    rights: "Direitos do Utilizador",
                    prohibitions: "Proibições Estritas"
                  };
                  return (
                    <button
                      key={sub}
                      onClick={() => setRkkSubTab(sub)}
                      className={`px-3 py-1.5 text-[9.5px] font-mono uppercase tracking-wider font-extrabold rounded-lg transition-all border ${
                        rkkSubTab === sub
                          ? "bg-amber-950/20 text-[#B87333] border-amber-900/40"
                          : "bg-transparent text-zinc-500 border-transparent hover:text-zinc-300"
                      }`}
                    >
                      {subLabels[sub]}
                    </button>
                  );
                })}
              </div>

              {/* RKK Inner Search */}
              <div className="relative font-mono text-xs w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-zinc-600" />
                <input
                  type="text"
                  placeholder="Pesquisar no Kernel..."
                  value={rkkQuery}
                  onChange={(e) => setRkkQuery(e.target.value)}
                  className="w-full bg-black border border-neutral-900 rounded-xl py-1.5 pl-8 pr-3 text-zinc-300 placeholder-zinc-600 outline-none focus:border-amber-900/40 text-xs"
                />
              </div>
            </div>

            {/* RKK TAB 1: CONCEPTS */}
            {rkkSubTab === "concepts" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rkk.getConcepts()
                  .filter(c => c.name.toLowerCase().includes(rkkQuery.toLowerCase()) || c.definition.toLowerCase().includes(rkkQuery.toLowerCase()))
                  .map((concept, idx) => (
                    <div key={idx} className="bg-neutral-950/50 border border-neutral-900 p-4 rounded-xl space-y-2 text-left">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-zinc-200 font-bold text-xs font-mono uppercase tracking-wide text-[#B87333]">
                          {concept.name}
                        </h4>
                        <span className="text-[8px] font-mono text-zinc-500 uppercase shrink-0">
                          {concept.associatedArticles.length} Artigo(s)
                        </span>
                      </div>
                      <p className="text-zinc-400 font-sans text-[11px] leading-relaxed">
                        {concept.definition}
                      </p>
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        <span className="text-[8px] uppercase tracking-wider text-zinc-500 font-mono">Artigos Associados:</span>
                        {concept.associatedArticles.map((artId) => (
                          <span key={artId} className="bg-[#0b0807] text-zinc-300 px-1.5 py-0.5 rounded border border-neutral-800 text-[8px] font-mono">
                            {artId}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                {rkk.getConcepts().filter(c => c.name.toLowerCase().includes(rkkQuery.toLowerCase()) || c.definition.toLowerCase().includes(rkkQuery.toLowerCase())).length === 0 && (
                  <div className="col-span-2 py-8 text-center text-zinc-600 text-xs font-mono">
                    Nenhum conceito regulatório encontrado para a pesquisa.
                  </div>
                )}
              </div>
            )}

            {/* RKK TAB 2: RIGHTS */}
            {rkkSubTab === "rights" && (
              <div className="space-y-3 font-mono text-xs">
                {rkk.getRights()
                  .filter(r => r.id.toLowerCase().includes(rkkQuery.toLowerCase()) || r.description.toLowerCase().includes(rkkQuery.toLowerCase()) || r.beneficiary.toLowerCase().includes(rkkQuery.toLowerCase()))
                  .map((right) => (
                    <div key={right.id} className="bg-neutral-950/40 border border-neutral-900 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-1.5 text-left">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[#B87333] font-black">{right.id}</span>
                          <span className="w-1 h-1 rounded-full bg-zinc-700" />
                          <span className="text-zinc-300 font-bold">{right.artigo}</span>
                          <span className="text-zinc-600 font-normal">({right.lei})</span>
                        </div>
                        <p className="text-zinc-300 font-sans text-[11px] leading-normal">{right.description}</p>
                      </div>

                      <div className="shrink-0 text-right self-end sm:self-auto space-y-1">
                        <span className="text-[8px] uppercase tracking-wider text-zinc-500 block">Beneficiário Principal</span>
                        <span className="inline-block px-2 py-0.5 bg-emerald-950/10 border border-emerald-900/30 text-emerald-400 rounded text-[9px] font-bold">
                          {right.beneficiary}
                        </span>
                      </div>
                    </div>
                  ))}
                {rkk.getRights().filter(r => r.description.toLowerCase().includes(rkkQuery.toLowerCase()) || r.beneficiary.toLowerCase().includes(rkkQuery.toLowerCase())).length === 0 && (
                  <div className="py-8 text-center text-zinc-600 text-xs font-mono">
                    Nenhum direito estruturado encontrado para a pesquisa.
                  </div>
                )}
              </div>
            )}

            {/* RKK TAB 3: PROHIBITIONS */}
            {rkkSubTab === "prohibitions" && (
              <div className="space-y-3 font-mono text-xs">
                {rkk.getProhibitions()
                  .filter(p => p.id.toLowerCase().includes(rkkQuery.toLowerCase()) || p.description.toLowerCase().includes(rkkQuery.toLowerCase()) || p.targetActor.toLowerCase().includes(rkkQuery.toLowerCase()))
                  .map((prohib) => (
                    <div key={prohib.id} className="bg-neutral-950/40 border border-neutral-900 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-1.5 text-left">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-rose-400 font-black">{prohib.id}</span>
                          <span className="w-1 h-1 rounded-full bg-zinc-700" />
                          <span className="text-zinc-300 font-bold">{prohib.artigo}</span>
                          <span className="text-zinc-600 font-normal">({prohib.lei})</span>
                        </div>
                        <p className="text-zinc-300 font-sans text-[11px] leading-normal">{prohib.description}</p>
                      </div>

                      <div className="shrink-0 text-right self-end sm:self-auto space-y-1">
                        <span className="text-[8px] uppercase tracking-wider text-zinc-500 block">Ator Proibido / Alvo</span>
                        <span className="inline-block px-2 py-0.5 bg-rose-950/10 border border-rose-900/30 text-rose-400 rounded text-[9px] font-bold">
                          {prohib.targetActor}
                        </span>
                      </div>
                    </div>
                  ))}
                {rkk.getProhibitions().filter(p => p.description.toLowerCase().includes(rkkQuery.toLowerCase()) || p.targetActor.toLowerCase().includes(rkkQuery.toLowerCase())).length === 0 && (
                  <div className="py-8 text-center text-zinc-600 text-xs font-mono">
                    Nenhuma proibição estrita encontrada para a pesquisa.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- MOCK INITIAL ADR RECORDS ---
const INITIAL_ADRS: ArchitecturalDecisionRecord[] = [
  {
    id: "ADR-001",
    articleId: "L40-ART-20",
    title: "Segregação Patrimonial de Saldos em Custódia",
    decisor: "Eng. Mário Silva (Arquiteto de Soluções)",
    interpretation: "Para cumprir o Artigo 20.º (Garantia de Liquidez 100%), os saldos de e-Money emitidos são armazenados em tabelas contábeis totalmente separadas dos fundos operacionais da empresa, reconciliados síncronamente via LedgerRepository de duas fases.",
    justification: "Evita contaminação de caixa e garante imutabilidade perante auditorias do BNA.",
    date: "2026-02-15",
    architecturalImpact: "Adoção de Ledger de dupla entrada síncrono com tolerância a falhas.",
    status: "Accepted"
  },
  {
    id: "ADR-002",
    articleId: "L40-ART-96",
    title: "Estratégia de Desafio Dinâmico para SCA",
    decisor: "Dra. Ana Santos (Segurança de Informação)",
    interpretation: "O Artigo 96.º exige Autenticação Forte. Decidimos disparar desafio MFA apenas em transações que excedam 20.000 AOA ou logins de novos dispositivos, mantendo transações abaixo simplificadas de acordo com o Aviso 03/22.",
    justification: "Equilibra fricção do usuário com conformidade de segurança contra fraudes.",
    date: "2026-03-10",
    architecturalImpact: "Implementação de motor de regras adaptativas em VerifyScaUseCase.",
    status: "Accepted"
  },
  {
    id: "ADR-003",
    articleId: "L40-ART-74",
    title: "Protocolo de Congelamento Síncrono de Contas",
    decisor: "Eng. Carlos Neto (Líder Backend)",
    interpretation: "O congelamento síncrono exigido pelo Artigo 74.º deve interromper imediatamente conexões abertas (WebSockets) e rejeitar qualquer transação em voo antes da fase de compensação.",
    justification: "Mitiga riscos de retirada fraudulenta de saldos após denúncia de perda do instrumento.",
    date: "2026-04-05",
    architecturalImpact: "Adicionado interceptor síncrono de status de conta no Gateway de APIs.",
    status: "Accepted"
  }
];

// --- SAMPLE DEFAULT COMPLIANCE DSL TEMPLATE ---
const DEFAULT_DSL_SAMPLE = `# Aviso BNA n.º 02/2026 - Novas Diretrizes de Liquidez e KYC
article: "L40-ART-105"
lei: "Aviso BNA n.º 02/2026"
severity: "Critical"
effectiveFrom: "2026-07-01"
requires:
  - "Sincronização diária de saldos de garantia segregada no BNA"
  - "Verificação biométrica facial síncrona para transações acima de 50.000 AOA"
appliesTo:
  - "TransferUseCase"
  - "VerifyScaUseCase"
concepts:
  - "WAT (West Africa Time)"
  - "Biometria Ativa"
evidence:
  logs:
    - "LOG_RECONCILIATION_SYNC_WAT"
    - "LOG_SCA_BIOMETRIC_MATCH"
  tables:
    - "reconciliation_reports"
    - "user_biometrics"
`;
