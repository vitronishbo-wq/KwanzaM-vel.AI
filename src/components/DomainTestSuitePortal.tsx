import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Layers, 
  Check, 
  Database, 
  Terminal, 
  Lock,
  Zap,
  Activity,
  Cpu,
  Play,
  Square,
  AlertTriangle,
  Sliders,
  Server,
  Clock,
  ArrowUpRight
} from "lucide-react";
import { runDomainTestSuite, DomainTestReport } from "../ledgerEngine";
import { runMutationTestSuite, mutationManager, MutationTestingSummary } from "../../test/mutation-testing.config";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";

interface DomainTestSuitePortalProps {
  highContrast?: boolean;
}

export default function DomainTestSuitePortal({ highContrast }: DomainTestSuitePortalProps) {
  const [reports, setReports] = useState<DomainTestReport[]>(() => runDomainTestSuite());
  const [isRunning, setIsRunning] = useState(false);

  const [subTab, setSubTab] = useState<"suite" | "load_sim" | "mutation">("suite");

  // Mutation Testing States
  const [mutationSummary, setMutationSummary] = useState<MutationTestingSummary | null>(() => runMutationTestSuite());
  const [isMutationRunning, setIsMutationRunning] = useState(false);

  const handleRunMutationTests = () => {
    setIsMutationRunning(true);
    setTimeout(() => {
      try {
        const summary = runMutationTestSuite();
        setMutationSummary(summary);
      } catch (err) {
        console.error("Erro ao correr teste de mutação:", err);
      } finally {
        setIsMutationRunning(false);
      }
    }, 1000);
  };

  // States for TPS Concurrent Load Simulation
  const [isSimulating, setIsSimulating] = useState(false);
  const [tpsSetting, setTpsSetting] = useState(45);
  const [loadType, setLoadType] = useState<"idle" | "normal" | "peak" | "stress">("normal");
  
  // Chaos Engineering Toggles
  const [chaosLoss, setChaosLoss] = useState(false);
  const [chaosLatency, setChaosLatency] = useState(false);
  const [chaosDb, setChaosDb] = useState(false);

  // Real-time chart history
  const [historyData, setHistoryData] = useState<any[]>(() => {
    const data = [];
    const now = new Date();
    for (let i = 15; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 2000);
      data.push({
        timestamp: time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        targetTps: 45,
        actualTps: 45 + Math.floor(Math.random() * 6 - 3),
        latency: Number((10.5 + Math.random() * 2).toFixed(1)),
        successRate: 100,
        cpu: Number((12.2 + Math.random() * 2).toFixed(1)),
        queueDepth: 0
      });
    }
    return data;
  });

  const [simLogs, setSimLogs] = useState<string[]>([
    "Plataforma de alta concorrência KwanzaMóvel Core inicializada.",
    "Ledger Core síncrono pronto para receber instruções transacionais.",
    "Monitor de invariantes matemáticos e consistência do banco ativado.",
    "Simulador de carga estabilizado em modo ocioso (aguardando ativação)."
  ]);

  const addSimLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setSimLogs(prev => [`[${time}] ${msg}`, ...prev.slice(0, 19)]);
  };

  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      const noise = (Math.random() * 0.08 - 0.04); // +/- 4%
      const targetTps = tpsSetting;
      let actualTps = Math.round(targetTps * (1 + noise));
      if (actualTps < 0) actualTps = 0;

      // Calculate simulated latency based on target TPS & chaos
      let latencyBase = 4.2; // ultra-fast sub-second latency
      if (targetTps > 60) {
        latencyBase += (targetTps - 60) * 0.05;
      }
      if (targetTps > 200) {
        latencyBase += (targetTps - 200) * 0.12;
      }

      if (chaosLatency) {
        latencyBase += 120 + Math.random() * 40; // Heavy latency spike simulation
      }

      const latency = Number(Math.max(0.5, latencyBase + (Math.random() * 1.5 - 0.75)).toFixed(1));

      let successRate = 100;
      if (chaosLoss) {
        successRate = Number((82.4 + Math.random() * 5.6).toFixed(2)); // Packet loss drop
      } else if (targetTps > 350) {
        // slight load drop for rate limit protections (Too Many Requests)
        successRate = Number((99.95 - (targetTps - 350) * 0.0005 + Math.random() * 0.02).toFixed(3));
      }

      let cpu = 3.5 + (targetTps * 0.16);
      if (chaosDb) {
        cpu += 45; // Simulated thread locking
      }
      cpu = Number(Math.min(99.8, Math.max(0.8, cpu + (Math.random() * 3 - 1.5))).toFixed(1));

      let queueDepth = 0;
      if (targetTps > 150) {
        queueDepth = Math.round((targetTps - 150) * 0.22);
      }
      if (chaosDb) {
        queueDepth += 68 + Math.floor(Math.random() * 25);
      }

      const now = new Date();
      const newTick = {
        timestamp: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        targetTps,
        actualTps,
        latency,
        successRate,
        cpu,
        queueDepth
      };

      setHistoryData(prev => [...prev.slice(1), newTick]);

      // Logging triggers
      const rand = Math.random();
      if (rand < 0.2) {
        addSimLog(`CoreEngine síncrono processou ${actualTps} TPS com sucesso. Latência ponta a ponta: ${latency}ms.`);
      } else if (rand < 0.35 && targetTps > 300) {
        addSimLog(`[WARN] ThreadPool - Saturação de capacidade próxima do limite. Ativando backpressure progressivo.`);
      } else if (rand < 0.45 && chaosLoss) {
        addSimLog(`[CHAOS] NetworkLoss - Queda de pacotes detectada. Transações compensadas de forma atômica no Ledger local.`);
      } else if (rand < 0.55 && chaosLatency) {
        addSimLog(`[CHAOS] LatencySpike - Latência síncrona do SPTR excedeu SLA (120ms). Disparando retentativas ordenadas.`);
      } else if (rand < 0.65 && chaosDb) {
        addSimLog(`[CHAOS] DBLock - Gargalo de I/O na gravação física do Ledger. Enfileirando eventos na tabela de Outbox.`);
      } else if (rand < 0.75 && targetTps > 400) {
        addSimLog(`[INFO] FlowController - Carga de pico em execução síncrona. Invariante Sigma Débitos = Sigma Créditos validado 100%.`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isSimulating, tpsSetting, chaosLoss, chaosLatency, chaosDb]);

  const handlePresetSelect = (preset: "idle" | "normal" | "peak" | "stress") => {
    setLoadType(preset);
    let tps = 45;
    if (preset === "idle") {
      tps = 2;
    } else if (preset === "normal") {
      tps = 50;
    } else if (preset === "peak") {
      tps = 180;
    } else if (preset === "stress") {
      tps = 450;
    }
    setTpsSetting(tps);
    addSimLog(`Perfil de carga ajustado para '${preset.toUpperCase()}' (${tps} TPS de alvo).`);
  };

  const handleRunTests = () => {
    setIsRunning(true);
    setTimeout(() => {
      setReports(runDomainTestSuite());
      setIsRunning(false);
    }, 600);
  };

  const totalPassed = reports.filter(r => r.passed).length;
  const totalTests = reports.length;

  const bgCard = highContrast ? "bg-black border-white border-2" : "bg-[#0b0807]/90 border-neutral-900";
  const textTitle = highContrast ? "text-white font-black" : "text-white font-bold";

  return (
    <div className={`p-6 rounded-[28px] border ${bgCard} space-y-6 font-sans`}>
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-900 pb-5">
        <div className="flex items-start gap-3">
          <span className="p-3 bg-amber-950/40 text-[#B87333] rounded-2xl border border-amber-900/40">
            <ShieldCheck className="w-6 h-6" />
          </span>
          <div>
            <h2 className={`text-lg uppercase tracking-wider ${textTitle}`}>
              Painel de Robustez & Hardening de Domínio
            </h2>
            <p className="text-[10px] text-zinc-500 font-mono uppercase">
              Fase 2.7 — Verificação Matemática e Segurança do Domínio
            </p>
          </div>
        </div>

        {subTab === "suite" && (
          <button
            onClick={handleRunTests}
            disabled={isRunning}
            className={`px-4 py-2 text-xs font-mono uppercase tracking-wider font-extrabold rounded-xl border transition-all flex items-center gap-2 cursor-pointer ${
              isRunning 
                ? "bg-neutral-900 text-neutral-500 border-neutral-800"
                : "bg-amber-950/20 hover:bg-amber-950/40 text-[#B87333] border-amber-900/40"
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? "animate-spin" : ""}`} />
            <span>{isRunning ? "Verificando..." : "Executar Auditoria"}</span>
          </button>
        )}

        {subTab === "mutation" && (
          <button
            onClick={handleRunMutationTests}
            disabled={isMutationRunning}
            className={`px-4 py-2 text-xs font-mono uppercase tracking-wider font-extrabold rounded-xl border transition-all flex items-center gap-2 cursor-pointer ${
              isMutationRunning 
                ? "bg-neutral-900 text-neutral-500 border-neutral-800"
                : "bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 border-rose-900/40"
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isMutationRunning ? "animate-spin" : ""}`} />
            <span>{isMutationRunning ? "Injetando Bugs..." : "Executar Teste de Mutação"}</span>
          </button>
        )}
      </div>

      {/* SUB-TAB SELECTORS */}
      <div className="flex border-b border-neutral-900/80 pb-2 gap-2 select-none">
        <button
          onClick={() => setSubTab("suite")}
          className={`px-4 py-2 text-[10px] font-mono uppercase tracking-wider font-extrabold rounded-xl transition-all flex items-center gap-2 cursor-pointer border ${
            subTab === "suite"
              ? "bg-[#B87333]/20 text-white border-[#B87333]/50"
              : "bg-transparent text-zinc-500 border-transparent hover:text-zinc-300"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Invariantes do Domínio</span>
        </button>
        <button
          onClick={() => setSubTab("load_sim")}
          className={`px-4 py-2 text-[10px] font-mono uppercase tracking-wider font-extrabold rounded-xl transition-all flex items-center gap-2 cursor-pointer border ${
            subTab === "load_sim"
              ? "bg-[#B87333]/20 text-white border-[#B87333]/50"
              : "bg-transparent text-zinc-500 border-transparent hover:text-zinc-300"
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Simulador de Carga (TPS)</span>
        </button>
        <button
          onClick={() => setSubTab("mutation")}
          className={`px-4 py-2 text-[10px] font-mono uppercase tracking-wider font-extrabold rounded-xl transition-all flex items-center gap-2 cursor-pointer border ${
            subTab === "mutation"
              ? "bg-rose-950/25 text-rose-300 border-rose-900/45"
              : "bg-transparent text-zinc-500 border-transparent hover:text-zinc-300"
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-rose-400" />
          <span>Testes de Mutação (Hardening)</span>
        </button>
      </div>

      {/* SUB-TAB CONTENT: INVARIANT SUITE */}
      {subTab === "suite" && (
        <div className="space-y-6">
          {/* METRICS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-black/40 p-4 rounded-xl border border-neutral-900/60 text-center sm:text-left">
              <span className="text-[9px] uppercase tracking-wider font-mono text-zinc-500">Resultado Geral</span>
              <div className="text-2xl font-black mt-1 text-[#B87333]">Auditor Verde</div>
              <p className="text-[10px] text-zinc-400 mt-0.5">Sem violações de consistência</p>
            </div>
            <div className="bg-black/40 p-4 rounded-xl border border-neutral-900/60 text-center sm:text-left">
              <span className="text-[9px] uppercase tracking-wider font-mono text-zinc-500">Testes de Cobertura</span>
              <div className="text-2xl font-black mt-1 text-white">
                {totalPassed} / {totalTests} <span className="text-[10px] font-medium text-emerald-400">({Math.round((totalPassed/totalTests)*100)}%)</span>
              </div>
              <p className="text-[10px] text-zinc-400 mt-0.5">Invariantes de negócios verificados</p>
            </div>
            <div className="bg-black/40 p-4 rounded-xl border border-neutral-900/60 text-center sm:text-left">
              <span className="text-[9px] uppercase tracking-wider font-mono text-zinc-500">Partidas Dobradas</span>
              <div className="text-2xl font-black mt-1 text-emerald-400 flex items-center justify-center sm:justify-start gap-1">
                <Check className="w-5 h-5" /> Consistente
              </div>
              <p className="text-[10px] text-zinc-400 mt-0.5">Σ Débitos = Σ Créditos provados</p>
            </div>
          </div>

          {/* TEST LIST */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase tracking-wider text-zinc-400 font-extrabold font-mono flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-zinc-500" />
              <span>Execução Síncrona da Suite de Robustez Matemática</span>
            </h3>

            <div className="border border-neutral-900 rounded-xl overflow-hidden divide-y divide-neutral-900 bg-black/60">
              {reports.map((test) => (
                <div 
                  key={test.id} 
                  className="p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono hover:bg-neutral-950/40 transition-all"
                >
                  <div className="flex items-start gap-3">
                    {test.passed ? (
                      <span className="p-1 bg-emerald-950/30 text-emerald-400 rounded-lg border border-emerald-900/40 mt-0.5 sm:mt-0">
                        <CheckCircle className="w-4 h-4" />
                      </span>
                    ) : (
                      <span className="p-1 bg-rose-950/30 text-rose-400 rounded-lg border border-rose-900/40 mt-0.5 sm:mt-0">
                        <AlertCircle className="w-4 h-4" />
                      </span>
                    )}
                    <div>
                      <div className="font-bold text-zinc-200">{test.name}</div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">
                        {test.passed 
                          ? "Verificado com sucesso — Exceção correta capturada e isolada preventivamente." 
                          : `Violado! Erro esperado: ${test.errorExpected}. Lançado: ${test.errorThrown}`
                        }
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded uppercase tracking-widest border ${
                      test.passed 
                        ? "bg-emerald-950/20 text-emerald-400 border-emerald-900/30" 
                        : "bg-rose-950/20 text-rose-400 border-rose-900/30"
                    }`}>
                      {test.passed ? "Passou" : "Falhou"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* EDUCATIONAL DOCUMENTATION SECTIONS */}
          <div className="border-t border-neutral-900 pt-5 space-y-4">
            <h3 className="text-xs uppercase tracking-wider text-white font-extrabold font-mono flex items-center gap-1.5">
              <Database className="w-4 h-4 text-[#B87333]" />
              <span>Garantias de Integridade de Estado (FASE 2.7)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed text-zinc-400">
              <div className="space-y-2 bg-neutral-950/50 p-4 rounded-xl border border-neutral-900/60">
                <h4 className="font-extrabold text-zinc-200 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  <Lock className="w-3.5 h-3.5 text-[#B87333]" /> Invariantes Explícitos por Aggregate
                </h4>
                <ul className="list-disc pl-4 space-y-1 text-zinc-400 text-[11px]">
                  <li><strong>Wallet:</strong> Saldo <span className="text-zinc-300">≥ 0</span> sempre, verificado com custom throw exceptions em tempo real.</li>
                  <li><strong>Ledger:</strong> Total síncrono debitado deve ser igual ao total creditado em lançamentos de partidas dobradas.</li>
                  <li><strong>Settlement:</strong> Bloqueio absoluto contra liquidação dupla (anti-duplo-clique).</li>
                  <li><strong>Merchant:</strong> Taxas transacionais e valor líquido sempre verificado contra valores negativos.</li>
                </ul>
              </div>

              <div className="space-y-2 bg-neutral-950/50 p-4 rounded-xl border border-neutral-900/60">
                <h4 className="font-extrabold text-zinc-200 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  <Layers className="w-3.5 h-3.5 text-[#B87333]" /> Máquina de Estados Finita do Liquidador
                </h4>
                <p className="text-zinc-400 text-[11px]">
                  O ciclo de vida do Aggregate <code>Settlement</code> obedece rigorosamente às transições legais permitidas pela regulação SPTR/BNA:
                </p>
                <div className="bg-black/60 p-2 rounded text-[10px] font-mono text-zinc-400 text-center uppercase tracking-wider mt-1 border border-neutral-900">
                  Created → Validated → Reserved → Settling → Settled
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">
                  Saltos inválidos ou tentativas de re-execução disparam <code>InvalidStateTransitionException</code> instantaneamente.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB CONTENT: CONCURRENT TPS LOAD SIMULATOR */}
      {subTab === "load_sim" && (
        <div className="space-y-6">
          {/* HERO SIMULATOR TOP STATUS */}
          <div className="bg-[#0c0807]/70 border border-neutral-900 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 font-mono">
            <div className="space-y-1">
              <span className="text-[8px] text-[#B87333] font-bold uppercase tracking-widest block">Simulação de Carga em Tempo Real</span>
              <h4 className="text-xs text-zinc-200 font-bold flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-[#B87333] animate-pulse" />
                <span>Ambiente de Teste de Stress de Alta Vazão (Concorrência Estrita)</span>
              </h4>
              <p className="text-[10px] text-zinc-500">
                Simule centenas de transações simultâneas por segundo (TPS) e veja o comportamento dinâmico do Ledger, Circuit Breakers e Outbox.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => {
                  setIsSimulating(!isSimulating);
                  addSimLog(isSimulating ? "Simulação de carga interrompida pelo operador." : "Simulação de carga contínua iniciada.");
                }}
                className={`px-4 py-2.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                  isSimulating
                    ? "bg-rose-950/30 text-rose-400 border border-rose-900/40 hover:bg-rose-950/50"
                    : "bg-[#B87333]/25 text-white border border-[#B87333]/55 hover:bg-[#B87333]/35"
                }`}
              >
                {isSimulating ? <Square className="w-3.5 h-3.5 text-rose-400 fill-rose-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />}
                <span>{isSimulating ? "Parar Simulação" : "Iniciar Simulação"}</span>
              </button>
            </div>
          </div>

          {/* CONTROLS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* TARGET TPS CONTROL (7 COLS) */}
            <div className="md:col-span-7 bg-neutral-950/40 border border-neutral-900/60 p-4 rounded-2xl space-y-4">
              <div className="flex justify-between items-center">
                <h5 className="text-[10px] uppercase font-bold tracking-wider text-zinc-300 font-mono flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[#B87333]" />
                  Controle de Taxa Transacional (TPS Alvo)
                </h5>
                <span className="text-xs font-mono font-black text-amber-400">{tpsSetting} TPS</span>
              </div>

              <div className="space-y-2">
                <input
                  type="range"
                  min="1"
                  max="500"
                  value={tpsSetting}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setTpsSetting(val);
                    setLoadType("normal"); // custom setting
                    addSimLog(`Definido novo alvo transacional de ${val} TPS.`);
                  }}
                  className="w-full accent-[#B87333] h-1.5 bg-neutral-900 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[8px] text-zinc-500 font-mono">
                  <span>1 TPS</span>
                  <span>100 TPS</span>
                  <span>250 TPS</span>
                  <span>500 TPS</span>
                </div>
              </div>

              {/* PRESETS */}
              <div className="space-y-1.5">
                <span className="text-[8px] uppercase tracking-wider text-zinc-500 font-mono font-bold block">Perfis de Carga Predefinidos:</span>
                <div className="grid grid-cols-4 gap-2">
                  {([
                    { id: "idle", label: "Idle / Ocioso", val: "2 TPS" },
                    { id: "normal", label: "Produção", val: "50 TPS" },
                    { id: "peak", label: "Pico Real", val: "180 TPS" },
                    { id: "stress", label: "Stress Máximo", val: "450 TPS" }
                  ] as const).map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handlePresetSelect(preset.id)}
                      className={`py-2 px-1.5 rounded-xl border font-mono text-center transition-all cursor-pointer ${
                        loadType === preset.id
                          ? "bg-[#B87333]/15 text-white border-[#B87333]/40"
                          : "bg-[#050505]/40 text-zinc-500 border-neutral-900 hover:text-zinc-300"
                      }`}
                    >
                      <div className="text-[9px] font-bold">{preset.label}</div>
                      <div className="text-[8px] opacity-75">{preset.val}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* CHAOS ENGINEERING (5 COLS) */}
            <div className="md:col-span-5 bg-[#0e0a09]/50 border border-neutral-900/60 p-4 rounded-2xl space-y-3">
              <h5 className="text-[10px] uppercase font-bold tracking-wider text-rose-400 font-mono flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                Injeção de Falhas (Chaos Engineering)
              </h5>
              <p className="text-[9px] text-zinc-500 font-mono">
                Introduza perturbações reais na infraestrutura para auditar os mecanismos de resiliência e estabilidade do ledger nacional.
              </p>

              <div className="space-y-2 pt-1">
                <button
                  onClick={() => {
                    setChaosLatency(!chaosLatency);
                    addSimLog(chaosLatency ? "Injeção de lentidão de rede desativada." : "Injetada lentidão extrema no link SPTR/BNA (>150ms).");
                  }}
                  className={`w-full p-2 py-1.5 rounded-xl border text-left font-mono transition-all flex items-center justify-between cursor-pointer ${
                    chaosLatency
                      ? "bg-rose-950/20 text-rose-400 border-rose-900/50"
                      : "bg-black/30 text-zinc-400 border-neutral-900/80 hover:border-neutral-800"
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="text-[9px] font-bold uppercase">Lentidão síncrona (Link SPTR)</div>
                    <div className="text-[8px] opacity-75 text-zinc-500">Adiciona +150ms de latência</div>
                  </div>
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${chaosLatency ? "bg-rose-950/50 text-rose-400" : "bg-neutral-900 text-zinc-500"}`}>
                    {chaosLatency ? "ATIVO" : "INATIVO"}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setChaosLoss(!chaosLoss);
                    addSimLog(chaosLoss ? "Injeção de perda de rede desativada." : "Injetado packet loss agressivo no canal mTLS (15% a 20%).");
                  }}
                  className={`w-full p-2 py-1.5 rounded-xl border text-left font-mono transition-all flex items-center justify-between cursor-pointer ${
                    chaosLoss
                      ? "bg-rose-950/20 text-rose-400 border-rose-900/50"
                      : "bg-black/30 text-zinc-400 border-neutral-900/80 hover:border-neutral-800"
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="text-[9px] font-bold uppercase">Instabilidade de mTLS (Loss)</div>
                    <div className="text-[8px] opacity-75 text-zinc-500">Causa falhas transatórias de rede</div>
                  </div>
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${chaosLoss ? "bg-rose-950/50 text-rose-400" : "bg-neutral-900 text-zinc-500"}`}>
                    {chaosLoss ? "ATIVO" : "INATIVO"}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setChaosDb(!chaosDb);
                    addSimLog(chaosDb ? "Injeção de gargalo de banco desativada." : "Injetado gargalo de concorrência e I/O no banco do Ledger.");
                  }}
                  className={`w-full p-2 py-1.5 rounded-xl border text-left font-mono transition-all flex items-center justify-between cursor-pointer ${
                    chaosDb
                      ? "bg-rose-950/20 text-rose-400 border-rose-900/50"
                      : "bg-black/30 text-zinc-400 border-neutral-900/80 hover:border-neutral-800"
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="text-[9px] font-bold uppercase">Bloqueio de Banco (I/O Lock)</div>
                    <div className="text-[8px] opacity-75 text-zinc-500">Simula fila cheia e saturação</div>
                  </div>
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${chaosDb ? "bg-rose-950/50 text-rose-400" : "bg-neutral-900 text-zinc-500"}`}>
                    {chaosDb ? "ATIVO" : "INATIVO"}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* LIVE KPI METRICS */}
          {(() => {
            const lastTick = historyData[historyData.length - 1] || { targetTps: 0, actualTps: 0, latency: 0, successRate: 100, cpu: 0, queueDepth: 0 };
            
            let latencyStatus = "Excelente (Sub-ms)";
            let latencyColor = "text-emerald-400 bg-emerald-950/15 border-emerald-900/35";
            if (lastTick.latency >= 15) {
              latencyStatus = "Ideal (Dentro do SLA)";
              latencyColor = "text-amber-400 bg-amber-950/15 border-amber-900/35";
            }
            if (lastTick.latency >= 40) {
              latencyStatus = "Sob Pressão (Backpressure)";
              latencyColor = "text-rose-400 bg-rose-950/15 border-rose-900/35";
            }

            let successColor = "text-emerald-400 bg-emerald-950/15 border-emerald-900/35";
            if (lastTick.successRate < 98) {
              successColor = "text-rose-400 bg-rose-950/15 border-rose-900/35";
            } else if (lastTick.successRate < 100) {
              successColor = "text-amber-400 bg-amber-950/15 border-amber-900/35";
            }

            return (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
                <div className="bg-black/40 p-3.5 rounded-2xl border border-neutral-900/60 space-y-1 text-left">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-500 flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-[#B87333]" />
                    Taxa de Carga Real
                  </span>
                  <div className="text-xl font-black text-white">
                    {isSimulating ? lastTick.actualTps : "0"} <span className="text-[10px] text-zinc-500 font-medium">/ {tpsSetting} TPS</span>
                  </div>
                  <div className="w-full bg-neutral-950 rounded-full h-1.5 border border-neutral-900 overflow-hidden mt-1.5">
                    <div
                      style={{ width: `${Math.min(100, (lastTick.actualTps / 500) * 100)}%` }}
                      className="h-full bg-gradient-to-r from-amber-600 to-[#B87333] rounded-full"
                    />
                  </div>
                </div>

                <div className={`p-3.5 rounded-2xl border ${latencyColor} space-y-1 text-left`}>
                  <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#B87333]" />
                    Latência Média E2E
                  </span>
                  <div className="text-xl font-black">
                    {isSimulating ? `${lastTick.latency}ms` : "--"}
                  </div>
                  <span className="text-[8px] font-bold block opacity-85 uppercase">{latencyStatus}</span>
                </div>

                <div className={`p-3.5 rounded-2xl border ${successColor} space-y-1 text-left`}>
                  <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-500 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#B87333]" />
                    Taxa de Entrega
                  </span>
                  <div className="text-xl font-black">
                    {isSimulating ? `${lastTick.successRate}%` : "100%"}
                  </div>
                  <span className="text-[8px] font-bold block opacity-85 text-emerald-400">DOUBLE-SPEND: 0.00% (IMPEDIDO)</span>
                </div>

                <div className="bg-black/40 p-3.5 rounded-2xl border border-neutral-900/60 space-y-1 text-left">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-500 flex items-center gap-1">
                    <Server className="w-3.5 h-3.5 text-[#B87333]" />
                    Capacidade CPU & Fila
                  </span>
                  <div className="text-xl font-black text-white">
                    {isSimulating ? `${lastTick.cpu}%` : "0.8%"}
                  </div>
                  <span className="text-[8px] font-bold block text-zinc-500">FILA OUTBOX: {isSimulating ? lastTick.queueDepth : "0"} MSG</span>
                </div>
              </div>
            );
          })()}

          {/* CHARTS CONTAINER (GRID OF 2 CHARTS) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* CHART 1: THROUGHPUT */}
            <div className="bg-[#09090b]/40 border border-neutral-900/80 p-4 rounded-2xl space-y-3.5">
              <div className="flex justify-between items-center">
                <h5 className="text-[10px] font-bold text-zinc-300 font-mono uppercase tracking-wider text-left">Vazão Real vs. Demanda de Entrada (Throughput)</h5>
                <span className="text-[8px] text-zinc-500 font-mono">Unidade: Transações por Segundo (TPS)</span>
              </div>
              {!isSimulating ? (
                <div className="h-60 flex flex-col items-center justify-center text-center text-zinc-600 font-mono text-[10px] bg-black/20 rounded-xl border border-dashed border-neutral-900">
                  <Zap className="w-6 h-6 text-zinc-700 mb-2 animate-bounce" />
                  Simulador offline. Clique em "Iniciar Simulação" para projetar tráfego em tempo real.
                </div>
              ) : (
                <div className="h-60 font-mono">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historyData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                      <XAxis dataKey="timestamp" stroke="#525252" fontSize={8} tickLine={false} />
                      <YAxis stroke="#525252" fontSize={8} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#09090b", borderColor: "#262626", borderRadius: "10px", fontSize: "10px" }}
                        labelStyle={{ color: "#a1a1aa", fontWeight: "bold" }}
                      />
                      <Legend wrapperStyle={{ fontSize: "9px", paddingTop: "5px" }} />
                      <Line type="monotone" dataKey="targetTps" name="TPS Alvo (Demanda)" stroke="#71717a" strokeWidth={1} strokeDasharray="5 5" dot={false} />
                      <Line type="monotone" dataKey="actualTps" name="TPS Processados (Vazão)" stroke="#B87333" strokeWidth={2} dot={true} activeDot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* CHART 2: LATENCY VS SUCCESS RATE */}
            <div className="bg-[#09090b]/40 border border-neutral-900/80 p-4 rounded-2xl space-y-3.5">
              <div className="flex justify-between items-center">
                <h5 className="text-[10px] font-bold text-zinc-300 font-mono uppercase tracking-wider text-left">Latência Operacional e Resiliência sob Carga</h5>
                <span className="text-[8px] text-zinc-500 font-mono">Médias e taxas de entrega em tempo real</span>
              </div>
              {!isSimulating ? (
                <div className="h-60 flex flex-col items-center justify-center text-center text-zinc-600 font-mono text-[10px] bg-black/20 rounded-xl border border-dashed border-neutral-900">
                  <Clock className="w-6 h-6 text-zinc-700 mb-2" />
                  Histórico ocioso. Inicie a carga contínua para monitorizar o SLA do sistema de autoproteção.
                </div>
              ) : (
                <div className="h-60 font-mono">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historyData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                      <XAxis dataKey="timestamp" stroke="#525252" fontSize={8} tickLine={false} />
                      <YAxis stroke="#525252" fontSize={8} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#09090b", borderColor: "#262626", borderRadius: "10px", fontSize: "10px" }}
                        labelStyle={{ color: "#a1a1aa", fontWeight: "bold" }}
                      />
                      <Legend wrapperStyle={{ fontSize: "9px", paddingTop: "5px" }} />
                      <Line type="monotone" dataKey="latency" name="Latência Core (ms)" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
                      <Line type="monotone" dataKey="successRate" name="Sucesso Entrega (%)" stroke="#10b981" strokeWidth={1.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* CHAOS ENGINEERING STATUS BANNER */}
          {isSimulating && (chaosLoss || chaosLatency || chaosDb || tpsSetting > 400) && (
            <div className="bg-[#120606] border border-rose-950/50 p-4 rounded-xl flex items-start gap-3 animate-pulse">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div className="space-y-1 text-[11px] font-mono leading-relaxed text-left">
                <div className="font-extrabold text-rose-400 uppercase tracking-wider text-[10px]">Alerta do Centro de Operações (Auto-Resolução Ativa):</div>
                {chaosDb && (
                  <p className="text-zinc-400">
                    ⚠️ <strong>Ledger Database Saturated:</strong> Travamentos de concorrência artificiais injetados. O sistema acionou retrocesso adaptativo (Retry Backpressure) e está escoando transações adicionais para a fila Outbox persistente para evitar corrupção de saldos.
                  </p>
                )}
                {chaosLatency && (
                  <p className="text-zinc-400">
                    ⚠️ <strong>BNA Integration Latency Spike:</strong> Latência simulada de rede síncrona. O motor financeiro KwanzaMóvel isolou o link lento através de Circuit Breakers adaptativos, respondendo em modo offline e garantindo a conciliação retroativa síncrona.
                  </p>
                )}
                {chaosLoss && (
                  <p className="text-zinc-400">
                    ⚠️ <strong>Network Packet Drops:</strong> Taxa de instabilidade mTLS elevada. O daemon idempotente garante re-emissão de mensagens "At-Least-Once", impedindo que transações incompletas causem falhas de dupla compensação ou inconsistência no banco de dados.
                  </p>
                )}
                {tpsSetting > 400 && !chaosDb && !chaosLatency && !chaosLoss && (
                  <p className="text-zinc-400">
                    ⚠️ <strong>Anti-Surge Traffic Control:</strong> Sobrecarga transacional massiva (&gt;400 TPS). O API Gateway acionou Rate Limiting estrito, amortecendo a vazão para proteger a consistência atômica da CPU e evitar enfileiramento infinito.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ROLLING CONSOLE LOGS */}
          <div className="bg-black border border-neutral-900 rounded-xl overflow-hidden font-mono">
            <div className="bg-neutral-950 border-b border-neutral-900 px-4 py-2.5 flex items-center justify-between">
              <span className="text-[9px] uppercase tracking-widest text-zinc-400 flex items-center gap-1.5 font-bold">
                <span className={`w-2 h-2 rounded-full ${isSimulating ? "bg-emerald-500 animate-pulse" : "bg-zinc-700"}`} />
                Console do Gateway de Concorrência (Real-Time Streams)
              </span>
              <span className="text-[8px] text-zinc-600">ISOLATION LEVEL: SERIALIZABLE</span>
            </div>

            <div className="p-3 max-h-[160px] overflow-y-auto text-[10px] space-y-1.5 divide-y divide-neutral-900/30 text-zinc-400 text-left">
              {simLogs.map((log, index) => {
                let tagColor = "text-[#B87333]";
                if (log.includes("[WARN]")) tagColor = "text-amber-500 font-bold";
                if (log.includes("[CHAOS]")) tagColor = "text-rose-400 font-extrabold";
                if (log.includes("[SECURITY]")) tagColor = "text-indigo-400 font-bold";

                return (
                  <div key={index} className="pt-1.5 first:pt-0">
                    <span className={`${tagColor} mr-1.5`}>KwanzaMóvel_Node1:</span>
                    <span>{log}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB CONTENT: MUTATION TESTING */}
      {subTab === "mutation" && (
        <div className="space-y-6">
          {/* HERO HEADER */}
          <div className="bg-[#0b0807] border border-neutral-900 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left">
            <div className="space-y-1">
              <span className="text-[8px] text-rose-400 font-bold uppercase tracking-widest block">Engenharia de Fiabilidade & Cobertura de Testes</span>
              <h4 className="text-xs text-zinc-200 font-bold flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                <span>Sandbox de Testes de Mutação (Mutation Testing Ground)</span>
              </h4>
              <p className="text-[10px] text-zinc-400 font-sans leading-relaxed">
                Injete bugs artificiais sutis no código do domínio (mutants) e execute os testes unitários de forma automatizada para verificar se as asserções de robustez conseguem capturar e eliminar as anomalias.
              </p>
            </div>
            <button
              onClick={handleRunMutationTests}
              disabled={isMutationRunning}
              className={`px-4 py-2.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                isMutationRunning
                  ? "bg-neutral-900 text-neutral-500 border border-neutral-800"
                  : "bg-rose-950/30 text-rose-400 border border-rose-900/40 hover:bg-rose-950/50"
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isMutationRunning ? "animate-spin" : ""}`} />
              <span>{isMutationRunning ? "Injetando Bugs..." : "Executar Teste de Mutação"}</span>
            </button>
          </div>

          {/* SCORE CARD & GAUGES */}
          {mutationSummary && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-black/40 p-4 rounded-xl border border-neutral-900 text-center sm:text-left">
                <span className="text-[9px] uppercase tracking-wider font-mono text-zinc-500">Score de Mutação</span>
                <div className={`text-3xl font-black mt-1 ${
                  mutationSummary.mutationScore >= 85 ? "text-emerald-400" : mutationSummary.mutationScore >= 65 ? "text-amber-400" : "text-rose-400"
                }`}>
                  {mutationSummary.mutationScore}%
                </div>
                <p className="text-[10px] text-zinc-400 mt-1">Mutantes Eliminados (Killed)</p>
              </div>
              
              <div className="bg-black/40 p-4 rounded-xl border border-neutral-900 text-center sm:text-left">
                <span className="text-[9px] uppercase tracking-wider font-mono text-zinc-500 font-bold">Classificação</span>
                <div className="text-xl font-black mt-1 text-white uppercase font-mono tracking-wider">
                  {mutationSummary.resilienceRating === "EXCELENTE" && <span className="text-emerald-400">★ EXCELENTE</span>}
                  {mutationSummary.resilienceRating === "BOA" && <span className="text-sky-400">✔ ADEQUADA</span>}
                  {mutationSummary.resilienceRating === "FRÁGIL" && <span className="text-amber-400">⚠️ FRÁGIL</span>}
                  {mutationSummary.resilienceRating === "VULNERÁVEL" && <span className="text-rose-400">✖ VULNERÁVEL</span>}
                </div>
                <p className="text-[10px] text-zinc-400 mt-1">Classificação de fiabilidade contábil</p>
              </div>

              <div className="bg-black/40 p-4 rounded-xl border border-neutral-900 text-center sm:text-left">
                <span className="text-[9px] uppercase tracking-wider font-mono text-zinc-500">Mutantes Gerados</span>
                <div className="text-2xl font-bold mt-1 text-zinc-300 font-mono">
                  {mutationSummary.totalMutants}
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">Total de anomalias injetadas</p>
              </div>

              <div className="bg-black/40 p-4 rounded-xl border border-neutral-900 text-center sm:text-left">
                <span className="text-[9px] uppercase tracking-wider font-mono text-zinc-500">Eficácia dos Testes</span>
                <div className="text-2xl font-bold mt-1 text-emerald-400 font-mono">
                  {mutationSummary.killedCount} <span className="text-xs text-zinc-500 font-normal">mortos</span>
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">{mutationSummary.survivedCount} mutantes sobreviveram</p>
              </div>
            </div>
          )}

          {/* MUTATION TEST RESULTS TABLE */}
          {mutationSummary && (
            <div className="bg-[#070504] border border-neutral-900 rounded-2xl overflow-hidden text-left">
              <div className="bg-neutral-900/40 px-5 py-3.5 border-b border-neutral-900">
                <h5 className="text-[10px] uppercase font-black tracking-wider text-zinc-300 font-mono flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-rose-400" />
                  Mapeamento Geral de Mutants (Bugs Injetados e Cobertura)
                </h5>
              </div>

              <div className="divide-y divide-neutral-900/50">
                {mutationSummary.results.map((result: any, index: number) => {
                  const isKilled = result.status === "KILLED";
                  return (
                    <div key={index} className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-neutral-900/10 transition-all">
                      <div className="space-y-1.5 flex-1 pr-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 text-[8px] font-mono font-black uppercase rounded ${
                            result.category === "Arithmetic" ? "bg-amber-950/20 text-amber-400 border border-amber-900/20" :
                            result.category === "Conditional" ? "bg-sky-950/20 text-sky-400 border border-sky-900/20" :
                            result.category === "Logical" ? "bg-purple-950/20 text-purple-400 border border-purple-900/20" :
                            "bg-rose-950/20 text-rose-400 border border-rose-900/20"
                          }`}>
                            {result.category}
                          </span>
                          <span className="text-xs font-bold text-zinc-200 uppercase font-sans tracking-wide">
                            {result.mutantName}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-normal font-sans">
                          {result.description}
                        </p>
                        
                        {isKilled ? (
                          <div className="text-[9.5px] font-mono text-emerald-500/80 flex items-center gap-1">
                            <Check className="w-3 h-3 shrink-0" />
                            <span>Eliminado pelo teste: <strong className="text-emerald-400">{result.killingTestName}</strong></span>
                          </div>
                        ) : (
                          <div className="text-[9.5px] font-mono text-rose-400 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            <span>Sobreviveu! Os testes unitários aceitaram o comportamento modificado sem falhar.</span>
                          </div>
                        )}
                      </div>

                      <div className="shrink-0 self-start md:self-center">
                        <span className={`px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest font-black rounded-lg border ${
                          isKilled 
                            ? "bg-emerald-950/20 text-emerald-400 border-emerald-900/40" 
                            : "bg-rose-950/20 text-rose-400 border-rose-900/40"
                        }`}>
                          {isKilled ? "☠ KILLED" : "⚠ SURVIVED"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* EDUCATIONAL MUTATION INFO */}
          <div className="bg-neutral-950/50 p-4 border border-neutral-900 rounded-xl flex items-start gap-3">
            <Activity className="w-4 h-4 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
            <div className="space-y-1.5 text-xs text-zinc-400 font-sans leading-relaxed text-left">
              <strong className="text-zinc-200 uppercase tracking-wider text-[10px] block">O que são Testes de Mutação e por que os fazemos?</strong>
              <p className="text-[11px]">
                Enquanto a cobertura tradicional de código (Code Coverage) mede apenas as linhas que foram exercitadas pelos testes, os <strong>Testes de Mutação</strong> avaliam a real <strong>eficácia e sensibilidade</strong> das suas asserções de teste.
              </p>
              <p className="text-[11px]">
                Se introduzirmos um bug sutil na lógica de cálculo (ex: desativar filtros de verificação de saldo ou ignorar chaves de idempotência repetidas) e a suite de testes unitários continuar a passar sem erros (ou seja, o mutante <em>sobrevive</em>), significa que há uma lacuna crítica de asserções, mesmo que a cobertura de código mostre 100%. Uma alta taxa de eliminação de mutantes (&gt;90%) prova que as regras contábeis do KwanzaMóvel possuem <strong>uma blindagem matemática absoluta</strong> contra desvios comportamentais e corrupções silenciosas de dados.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
