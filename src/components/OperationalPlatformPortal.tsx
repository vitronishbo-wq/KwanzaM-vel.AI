import React, { useState, useEffect, useRef } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Database,
  Eye,
  Key,
  Layers,
  Lock,
  Play,
  RotateCw,
  Server,
  ShieldAlert,
  Terminal,
  TrendingUp,
  Zap,
  Search,
  MapPin,
  User,
  Clock,
  FileText,
  ShieldCheck,
  Compass,
  Info,
  Globe,
  Cpu,
  Network,
  UserCheck
} from "lucide-react";
import { Transaction } from "../types";
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

interface StructuredLog {
  timestamp: string;
  traceId: string;
  correlationId: string;
  requestId: string;
  transactionId: string;
  walletId: string;
  merchantId: string;
  agentId: string;
  event: string;
  durationMs: number;
  status: string;
  severity: "INFO" | "WARN" | "ERROR" | "SECURITY";
  component: string;
  systemVersion: string;
  hash: string;
  // Backward compatibility fields for legacy UI rendering
  level: "INFO" | "WARN" | "ERROR" | "SECURITY";
  service: string;
  message: string;
  spanId: string;
  metadata: Record<string, any>;
}

interface OutboxMessage {
  id: string;
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: string;
  status: "PENDING" | "PROCESSED" | "FAILED";
  attempts: number;
}

export interface UseCaseLatencyRecord {
  id: string;
  usecase: "TransferMoneyUseCase" | "PayMerchantUseCase" | "CashInUseCase" | "CashOutUseCase" | "ReverseTransactionUseCase";
  timestamp: string;
  totalMs: number;
  amlMs: number;
  ledgerMs: number;
  settlementMs: number;
  persistenceMs: number;
  uiMs: number;
}

export const generateHistoricalLatencyRecords = (): UseCaseLatencyRecord[] => {
  const records: UseCaseLatencyRecord[] = [];
  const now = new Date();
  
  const usecases = [
    { name: "TransferMoneyUseCase", count: 40, base: { aml: 10, ledger: 6, settlement: 12, persistence: 8, ui: 4 }, variation: { aml: 10, ledger: 6, settlement: 10, persistence: 8, ui: 4 } },
    { name: "PayMerchantUseCase", count: 40, base: { aml: 12, ledger: 8, settlement: 15, persistence: 10, ui: 5 }, variation: { aml: 12, ledger: 7, settlement: 12, persistence: 9, ui: 5 } },
    { name: "CashInUseCase", count: 30, base: { aml: 4, ledger: 5, settlement: 8, persistence: 6, ui: 3 }, variation: { aml: 5, ledger: 5, settlement: 8, persistence: 6, ui: 3 } },
    { name: "CashOutUseCase", count: 30, base: { aml: 5, ledger: 6, settlement: 10, persistence: 8, ui: 4 }, variation: { aml: 5, ledger: 5, settlement: 8, persistence: 6, ui: 3 } },
    { name: "ReverseTransactionUseCase", count: 20, base: { aml: 2, ledger: 4, settlement: 6, persistence: 4, ui: 2 }, variation: { aml: 3, ledger: 3, settlement: 5, persistence: 4, ui: 2 } }
  ] as const;

  for (const uc of usecases) {
    for (let i = 0; i < uc.count; i++) {
      const amlMs = uc.base.aml + Math.floor(Math.random() * uc.variation.aml);
      const ledgerMs = uc.base.ledger + Math.floor(Math.random() * uc.variation.ledger);
      const settlementMs = uc.base.settlement + Math.floor(Math.random() * uc.variation.settlement);
      const persistenceMs = uc.base.persistence + Math.floor(Math.random() * uc.variation.persistence);
      const uiMs = uc.base.ui + Math.floor(Math.random() * uc.variation.ui);
      const totalMs = amlMs + ledgerMs + settlementMs + persistenceMs + uiMs;
      
      const timeOffset = new Date(now.getTime() - (uc.count - i) * 60000);
      const timestamp = timeOffset.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      
      records.push({
        id: `lat_${Math.random().toString(36).substring(2, 9)}`,
        usecase: uc.name,
        timestamp,
        totalMs,
        amlMs,
        ledgerMs,
        settlementMs,
        persistenceMs,
        uiMs
      });
    }
  }
  return records;
};

export default function OperationalPlatformPortal({ 
  highContrast,
  transactions = [],
  setTransactions
}: { 
  highContrast?: boolean;
  transactions?: Transaction[];
  setTransactions?: React.Dispatch<React.SetStateAction<Transaction[]>>;
}) {
  // Observability & Tracing States
  const [logs, setLogs] = useState<StructuredLog[]>([]);
  const [metrics, setMetrics] = useState({
    successRate: 99.98,
    p95Latency: 18.4,
    p99Latency: 42.1,
    activeSpans: 4,
    cpuUsage: 14.2,
    memoryUsage: 128
  });

  // Resilience & Circuit Breaker States
  const [circuitBreakers, setCircuitBreakers] = useState({
    bnaCustodyBridge: { state: "CLOSED" as "CLOSED" | "OPEN" | "HALF-OPEN", failures: 0, lastTrip: "" },
    smsGateway: { state: "CLOSED" as "CLOSED" | "OPEN" | "HALF-OPEN", failures: 0, lastTrip: "" },
    merchantAcquirer: { state: "CLOSED" as "CLOSED" | "OPEN" | "HALF-OPEN", failures: 0, lastTrip: "" }
  });

  // Outbox Pattern & Messaging states
  const [outbox, setOutbox] = useState<OutboxMessage[]>([
    {
      id: "out_msg_101",
      aggregateType: "Wallet",
      aggregateId: "+244923000111",
      eventType: "WalletDebited",
      payload: JSON.stringify({ amount: "500.00 Kz", target: "M-001" }),
      status: "PROCESSED",
      attempts: 1
    },
    {
      id: "out_msg_102",
      aggregateType: "Settlement",
      aggregateId: "S-882",
      eventType: "SettlementSucceeded",
      payload: JSON.stringify({ settlementId: "S-882", bankCode: "BCI" }),
      status: "PROCESSED",
      attempts: 1
    },
    {
      id: "out_msg_103",
      aggregateType: "Wallet",
      aggregateId: "+244933000222",
      eventType: "WalletCredited",
      payload: JSON.stringify({ amount: "15000.00 Kz", agentId: "A-04" }),
      status: "PENDING",
      attempts: 0
    }
  ]);

  // Role Security & Maker-Checker Configuration
  const [complianceConfig, setComplianceConfig] = useState({
    makerCheckerLimit: 50000,
    dualAuthRequired: true,
    keyRotationInterval: 30, // days
    activeEncryptionKey: "km_prod_aes256_v3_active_kwanza",
    keyAgeDays: 14
  });

  const [activeTab, setActiveTab] = useState<"logs" | "circuit" | "outbox" | "security" | "forense" | "observabilidade_enterprise">("logs");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  const [diagnosticView, setDiagnosticView] = useState<"forense" | "spans" | "propagate">("forense");
  const logContainerRef = useRef<HTMLDivElement>(null);

  // States for Fase 3.2: Enterprise Observability
  const [enterpriseSubTab, setEnterpriseSubTab] = useState<"dashboard" | "prometheus" | "opentelemetry" | "siem" | "latencia">("dashboard");
  const [latencyRecords, setLatencyRecords] = useState<UseCaseLatencyRecord[]>([]);
  const [selectedUseCase, setSelectedUseCase] = useState<UseCaseLatencyRecord["usecase"]>("TransferMoneyUseCase");
  const [prometheusScrapeCount, setPrometheusScrapeCount] = useState(148);
  const [isScraping, setIsScraping] = useState(false);
  const [loadSimulationActive, setLoadSimulationActive] = useState(false);
  const [simulatedTps, setSimulatedTps] = useState(3.4);
  const [copiedFeedback, setCopiedFeedback] = useState<string | null>(null);
  const [selectedSIEMSeverity, setSelectedSIEMSeverity] = useState<"ALL" | "INFO" | "WARN" | "ERROR" | "SECURITY">("ALL");
  const [metricDeltas, setMetricDeltas] = useState({
    payments_total: 1042,
    payments_success: 1039,
    payments_failed: 3,
    cashin_total: 512,
    cashout_total: 489,
    fraud_alerts_total: 12,
    ledger_entries_total: 2084,
    settlements_total: 82,
    offline_queue: 0,
    reconciliation_queue: 0,
  });

  // Demo transactions specifically enriched for Phase 3.1 Forensics
  const demoTransactions: Transaction[] = [
    {
      id: "tx_km_9841203",
      senderPhone: "+244923000111",
      receiverPhone: "Supermercado Kero Talatona",
      amount: 45000,
      type: "pagamento",
      status: "completed",
      timestamp: "2026-07-02T08:15:22.412Z",
      latencyMs: 14,
      fraudScore: 2,
      securityLog: ["Assinatura biométrica válida", "Invariantes locais verificados", "Check AML Limpo"],
      correlationId: "corr_9b42cf38a01f945176",
      traceId: "trace_f8e4c198b273a0e41b9d429a304e28",
      requestId: "req_ab51934c2",
      sessionId: "sess_df2938ab012",
      systemVersion: "v2.7.4-prod",
      approvedBy: "KwanzaMóvel Gateway Manager",
      deviceUserAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X)"
    },
    {
      id: "tx_km_2039485",
      senderPhone: "+244923000111",
      receiverPhone: "+244933555222",
      amount: 85000,
      type: "envio",
      status: "completed",
      timestamp: "2026-07-02T08:18:10.893Z",
      latencyMs: 22,
      fraudScore: 5,
      securityLog: ["Dispositivo Confiável registrado", "Maker-Checker autorização síncrona", "PACS.008 SPTR despachado"],
      correlationId: "corr_12aa9e3f9a2c3d01f5",
      traceId: "trace_0c3d9a1f2b3e4d5c6b7a8d9e0f1a2b",
      requestId: "req_f1928347d",
      sessionId: "sess_df2938ab012",
      systemVersion: "v2.7.4-prod",
      approvedBy: "SGA BNA Automated Auditor & Maker-Checker",
      deviceUserAgent: "Mozilla/5.0 (Android; Mobile; rv:124.0) Gecko/124.0 Firefox/124.0"
    },
    {
      id: "tx_km_8841029",
      senderPhone: "+244923000111",
      receiverPhone: "+244944999111",
      amount: 150000,
      type: "envio",
      status: "blocked_aml",
      timestamp: "2026-07-02T07:45:00.012Z",
      latencyMs: 8,
      fraudScore: 89,
      securityLog: ["Alerta Geo-Velocity: velocidade de transição física física impossível (>500km/h)", "Bloqueio preventivo automático AML"],
      correlationId: "corr_7e3a2b1c0d9e8f7a6b",
      traceId: "trace_99887766554433221100abcdef1234",
      requestId: "req_77d88e2c1",
      sessionId: "sess_df2938ab012",
      systemVersion: "v2.7.4-prod",
      failReason: "Risco AML Elevado: Velocidade Geográfica Impossível detectada pelo validador do Gateway",
      approvedBy: "SGA BNA Automated Block Engine",
      deviceUserAgent: "Mozilla/5.0 (KwanzaMóvel Desktop Client v2.7)"
    }
  ];

  // Live computed metrics (Fase 3.2 - Missão 2)
  const getMetrics = () => {
    const allTxs = [...transactions, ...demoTransactions];
    
    // Count from user transactions & demo transactions
    const basePayments = allTxs.filter(t => t.type === "pagamento");
    const basePaymentsCount = basePayments.length;
    const basePaymentsSuccess = basePayments.filter(t => t.status === "completed").length;
    const basePaymentsFailed = basePayments.filter(t => t.status === "blocked_aml" || t.failReason).length;
    
    const baseCashIn = allTxs.filter(t => t.type === "recebimento").length;
    const baseCashOut = allTxs.filter(t => t.type === "envio").length;
    
    const baseFraud = allTxs.filter(t => t.isFraudAlert || t.status === "blocked_aml" || t.fraudScore > 80).length;
    const baseLedger = allTxs.filter(t => t.status === "completed").length * 2;
    const baseOffline = allTxs.filter(t => t.status === "queued_offline").length;
    const baseReconcile = allTxs.filter(t => t.status === "processing").length;

    return {
      payments_total: metricDeltas.payments_total + basePaymentsCount,
      payments_success: metricDeltas.payments_success + basePaymentsSuccess,
      payments_failed: metricDeltas.payments_failed + basePaymentsFailed,
      cashin_total: metricDeltas.cashin_total + baseCashIn,
      cashout_total: metricDeltas.cashout_total + baseCashOut,
      fraud_alerts_total: metricDeltas.fraud_alerts_total + baseFraud,
      ledger_entries_total: metricDeltas.ledger_entries_total + baseLedger,
      settlements_total: metricDeltas.settlements_total + basePaymentsSuccess,
      offline_queue: Math.max(0, metricDeltas.offline_queue + baseOffline),
      reconciliation_queue: Math.max(0, metricDeltas.reconciliation_queue + baseReconcile),
      active_agents: 18,
      active_merchants: 45
    };
  };

  // Helper to generate dynamic trace/span IDs
  const generateHexId = (len: number) => {
    return Array.from({ length: len }, () => Math.floor(Math.random() * 16).toString(16)).join("");
  };

  const generateLogHash = (fields: Omit<StructuredLog, "hash" | "level" | "service" | "message" | "spanId" | "metadata">) => {
    const serialized = `${fields.timestamp}|${fields.traceId}|${fields.correlationId}|${fields.requestId}|${fields.transactionId}|${fields.event}|${fields.durationMs}|${fields.status}|${fields.severity}|${fields.component}|${fields.systemVersion}`;
    let hashVal = 0;
    for (let i = 0; i < serialized.length; i++) {
      const char = serialized.charCodeAt(i);
      hashVal = (hashVal << 5) - hashVal + char;
      hashVal = hashVal & hashVal; // 32bit integer
    }
    const hex = Math.abs(hashVal).toString(16).padStart(8, "0");
    return `sha256_${hex}_sig`;
  };

  // Add structured log helper
  const addLog = (
    severity: "INFO" | "WARN" | "ERROR" | "SECURITY",
    component: string,
    event: string,
    metadata: Record<string, any> = {}
  ) => {
    // Collect potential IDs from metadata or generate random compliant IDs
    const traceId = metadata.traceId || "trace_" + generateHexId(12) + generateHexId(12);
    const correlationId = metadata.correlationId || "corr_" + generateHexId(8) + generateHexId(8);
    const requestId = metadata.requestId || "req_" + generateHexId(10);
    const transactionId = metadata.transactionId || (metadata.txId || "tx_" + generateHexId(12));
    const walletId = metadata.walletId || "wallet_" + generateHexId(8);
    const merchantId = metadata.merchantId || (component.toLowerCase().includes("merchant") ? "merch_" + generateHexId(8) : "N/A");
    const agentId = metadata.agentId || (component.toLowerCase().includes("agente") ? "agent_" + generateHexId(8) : "N/A");
    const durationMs = typeof metadata.durationMs === "number" ? metadata.durationMs : Math.floor(Math.random() * 40) + 5;
    const status = metadata.status || "SUCCESS";
    const systemVersion = "v2.7.4-prod";

    const hashPayload = {
      timestamp: new Date().toISOString(),
      traceId,
      correlationId,
      requestId,
      transactionId,
      walletId,
      merchantId,
      agentId,
      event,
      durationMs,
      status,
      severity,
      component,
      systemVersion
    };

    const hash = generateLogHash(hashPayload);

    const newLog: StructuredLog = {
      ...hashPayload,
      hash,
      // Backward compatibility fields for legacy UI rendering
      level: severity,
      service: component,
      message: event,
      spanId: "sp_" + generateHexId(8),
      metadata
    };
    setLogs((prev) => [newLog, ...prev.slice(0, 49)]);
  };

  // Initial logs and latency records populate
  useEffect(() => {
    addLog("INFO", "ApiGateway", "Inicializando middleware de tracing distribuído OpenTelemetry.");
    addLog("INFO", "OutboxProcessor", "Outbox polling daemon iniciado com frequência de 2000ms.");
    addLog("SECURITY", "KeyVault", "Chaves criptográficas ativas verificadas. Assinatura SHA256 íntegra.");
    addLog("INFO", "CircuitBreakerManager", "Circuit Breakers em estado fechado para todos os parceiros bancários externos.");
    
    // Seed historical records
    setLatencyRecords(generateHistoricalLatencyRecords());

    // Window event subscriber for live use-case performance instrumentation
    const handleLiveUsecase = (e: Event) => {
      const customEv = e as CustomEvent<{ usecase: UseCaseLatencyRecord["usecase"]; transaction: Transaction }>;
      if (customEv.detail && customEv.detail.transaction) {
        const { usecase, transaction } = customEv.detail;
        if (transaction.latencyDetails) {
          const details = transaction.latencyDetails;
          const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
          
          setLatencyRecords((prev) => [
            ...prev,
            {
              id: `lat_live_${Math.random().toString(36).substring(2, 9)}`,
              usecase,
              timestamp: timeStr,
              totalMs: details.totalMs,
              amlMs: details.amlMs,
              ledgerMs: details.ledgerMs,
              settlementMs: details.settlementMs,
              persistenceMs: details.persistenceMs,
              uiMs: details.uiMs
            }
          ]);

          addLog("INFO", "LatencyTracker", `Monitoramento de Latência: Caso de Uso ${usecase} completado em ${details.totalMs}ms síncronos (SLA < 100ms).`, {
            usecase,
            aml: `${details.amlMs}ms`,
            ledger: `${details.ledgerMs}ms`,
            settlement: `${details.settlementMs}ms`,
            persistence: `${details.persistenceMs}ms`,
            ui: `${details.uiMs}ms`
          });
        }
      }
    };

    window.addEventListener("financial-usecase-executed", handleLiveUsecase);
    return () => {
      window.removeEventListener("financial-usecase-executed", handleLiveUsecase);
    };
  }, []);

  // Periodic metrics and outbox simulate
  useEffect(() => {
    const interval = setInterval(() => {
      // Dynamic calculations based on load stress test status
      if (loadSimulationActive) {
        const deltaPayTotal = Math.floor(15 + Math.random() * 20);
        const deltaPaySuccess = deltaPayTotal - (Math.random() > 0.85 ? 1 : 0);
        const deltaPayFailed = deltaPayTotal - deltaPaySuccess;
        const deltaCashIn = Math.floor(5 + Math.random() * 6);
        const deltaCashOut = Math.floor(4 + Math.random() * 6);
        const deltaLedger = (deltaPaySuccess + deltaCashIn + deltaCashOut) * 2;
        const deltaSettlements = Math.floor(2 + Math.random() * 4);

        setMetricDeltas((prev) => ({
          ...prev,
          payments_total: prev.payments_total + deltaPayTotal,
          payments_success: prev.payments_success + deltaPaySuccess,
          payments_failed: prev.payments_failed + deltaPayFailed,
          cashin_total: prev.cashin_total + deltaCashIn,
          cashout_total: prev.cashout_total + deltaCashOut,
          ledger_entries_total: prev.ledger_entries_total + deltaLedger,
          settlements_total: prev.settlements_total + deltaSettlements,
          offline_queue: prev.offline_queue + (((circuitBreakers as any).bnaCustodyBridge.state === "OPEN" || (circuitBreakers as any).smsGateway.state === "OPEN" || (circuitBreakers as any).merchantAcquirer.state === "OPEN") ? Math.floor(3 + Math.random() * 5) : 0),
          reconciliation_queue: Math.max(0, prev.reconciliation_queue + (Math.random() > 0.7 ? 1 : -1))
        }));

        setSimulatedTps(Number((68.4 + Math.random() * 45.2).toFixed(1)));
        setMetrics((prev) => ({
          ...prev,
          cpuUsage: Number((74 + Math.random() * 21).toFixed(1)),
          memoryUsage: Number((245 + Math.random() * 65).toFixed(0)),
          p95Latency: Number((85 + Math.random() * 42).toFixed(1)),
          p99Latency: Number((195 + Math.random() * 95).toFixed(1)),
          successRate: Number((99.82 - Math.random() * 0.15).toFixed(2))
        }));

        // Inject high-stress latency records under stress test
        const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        const activeUcs: UseCaseLatencyRecord["usecase"][] = [
          "TransferMoneyUseCase",
          "PayMerchantUseCase",
          "CashInUseCase",
          "CashOutUseCase"
        ];
        const stressRecords: UseCaseLatencyRecord[] = [];
        for (const ucName of activeUcs) {
          // Congestion factor: up to 2.8x normal latency
          const multiplier = 1.6 + Math.random() * 1.2;
          const amlMs = Math.floor((ucName === "PayMerchantUseCase" ? 12 : 10) * multiplier);
          const ledgerMs = Math.floor((ucName === "PayMerchantUseCase" ? 8 : 6) * multiplier);
          const settlementMs = Math.floor((ucName === "PayMerchantUseCase" ? 15 : 12) * multiplier);
          const persistenceMs = Math.floor((ucName === "PayMerchantUseCase" ? 10 : 8) * multiplier);
          const uiMs = Math.floor((ucName === "PayMerchantUseCase" ? 5 : 4) * multiplier);
          const totalMs = amlMs + ledgerMs + settlementMs + persistenceMs + uiMs;

          stressRecords.push({
            id: `lat_stress_${Math.random().toString(36).substring(2, 9)}`,
            usecase: ucName,
            timestamp: nowStr,
            totalMs,
            amlMs,
            ledgerMs,
            settlementMs,
            persistenceMs,
            uiMs
          });
        }
        setLatencyRecords((prev) => [...prev.slice(-400), ...stressRecords]);

        // Log a high throughput event
        addLog("INFO", "ApiGateway", `Tráfego intenso detectado: ${simulatedTps} TPS de pico. Balanceador de carga distribuindo requisições entre 4 nós redundantes.`, {
          tps: simulatedTps,
          cpu: metrics.cpuUsage,
          memory: `${metrics.memoryUsage}MB`
        });
      } else {
        const deltaPayTotal = Math.random() > 0.4 ? 1 : 0;
        const deltaPaySuccess = deltaPayTotal;
        const deltaPayFailed = 0;
        const deltaCashIn = Math.random() > 0.7 ? 1 : 0;
        const deltaCashOut = Math.random() > 0.7 ? 1 : 0;
        const deltaLedger = (deltaPaySuccess + deltaCashIn + deltaCashOut) * 2;
        const deltaSettlements = Math.random() > 0.8 ? 1 : 0;

        setMetricDeltas((prev) => ({
          ...prev,
          payments_total: prev.payments_total + deltaPayTotal,
          payments_success: prev.payments_success + deltaPaySuccess,
          payments_failed: prev.payments_failed + deltaPayFailed,
          cashin_total: prev.cashin_total + deltaCashIn,
          cashout_total: prev.cashout_total + deltaCashOut,
          ledger_entries_total: prev.ledger_entries_total + deltaLedger,
          settlements_total: prev.settlements_total + deltaSettlements,
          offline_queue: prev.offline_queue + (((circuitBreakers as any).bnaCustodyBridge.state === "OPEN" || (circuitBreakers as any).smsGateway.state === "OPEN" || (circuitBreakers as any).merchantAcquirer.state === "OPEN") ? 1 : 0)
        }));

        setSimulatedTps(Number((1.8 + Math.random() * 2.5).toFixed(1)));
        setMetrics((prev) => ({
          ...prev,
          cpuUsage: Number((10 + Math.random() * 7).toFixed(1)),
          memoryUsage: Number((122 + Math.random() * 12).toFixed(0)),
          p95Latency: Number((14 + Math.random() * 4).toFixed(1)),
          p99Latency: Number((35 + Math.random() * 8).toFixed(1)),
          successRate: 99.98
        }));
      }

      // Randomly append some background info log
      const services = ["LedgerService", "OutboxProcessor", "SecurityAuditor", "SettlementManager"];
      const messages = [
        "Reconciliação estrita com banco de dados em memória íntegra.",
        "Varredura da tabela Outbox concluída. Sem pendências críticas.",
        "Auditoria de invariantes periódica executada. Sigma débitos balanceia estritamente com sigma créditos.",
        "Verificação de limites de liquidez diária concluída."
      ];
      const idx = Math.floor(Math.random() * services.length);
      addLog("INFO", services[idx], messages[idx]);
    }, 3000);

    return () => clearInterval(interval);
  }, [loadSimulationActive, circuitBreakers, simulatedTps, metrics.cpuUsage, metrics.memoryUsage]);

  // Action Simulators
  const handleRotateKeys = () => {
    const oldKey = complianceConfig.activeEncryptionKey;
    const newKey = `km_prod_aes256_v4_rot_${generateHexId(8)}`;
    setComplianceConfig((prev) => ({
      ...prev,
      activeEncryptionKey: newKey,
      keyAgeDays: 0
    }));
    addLog("SECURITY", "KeyVault", "Chave de criptografia de dados (DEK) rotacionada com sucesso.", {
      action: "KEY_ROTATION",
      previousKey: oldKey,
      newKey: newKey,
      triggeredBy: "maker_admin_checker_system"
    });
  };

  const handleSimulateOutboxFlush = () => {
    setOutbox((prev) =>
      prev.map((msg) =>
        msg.status === "PENDING"
          ? { ...msg, status: "PROCESSED", attempts: msg.attempts + 1 }
          : msg
      )
    );
    addLog("INFO", "OutboxProcessor", "Forçando varredura e envio síncrono das mensagens da fila de Outbox.", {
      messagesProcessed: 1,
      targetBroker: "LocalMemoryEventBus"
    });
  };

  const handleToggleCircuitBreaker = (key: keyof typeof circuitBreakers) => {
    setCircuitBreakers((prev) => {
      const current = prev[key];
      const nextState = current.state === "CLOSED" ? "OPEN" : "CLOSED";
      const failures = nextState === "OPEN" ? 3 : 0;
      addLog(
        nextState === "OPEN" ? "ERROR" : "INFO",
        "CircuitBreakerManager",
        `Disjuntor para ${String(key)} foi forçado para ${nextState}.`,
        { service: String(key), previousState: current.state, newState: nextState }
      );
      return {
        ...prev,
        [key]: {
          state: nextState,
          failures,
          lastTrip: nextState === "OPEN" ? new Date().toLocaleTimeString() : ""
        }
      };
    });
  };

  const handleSimulateCircuitFailure = (key: keyof typeof circuitBreakers) => {
    setCircuitBreakers((prev) => {
      const current = prev[key];
      const newFailures = current.failures + 1;
      const shouldTrip = newFailures >= 3;
      const nextState = shouldTrip ? "OPEN" : "CLOSED";

      addLog(
        "WARN",
        "CircuitBreakerManager",
        `Falha de timeout registrada na chamada para ${String(key)}. Tentativa ${newFailures}/3.`,
        { service: String(key), failures: newFailures }
      );

      if (shouldTrip) {
        addLog(
          "ERROR",
          "CircuitBreakerManager",
          `Limite de falhas excedido para ${String(key)}. Disjuntor entrou em modo OPEN preventivo. Tráfego redirecionado para Outbox offline.`,
          { service: String(key) }
        );
      }

      return {
        ...prev,
        [key]: {
          state: nextState,
          failures: newFailures,
          lastTrip: shouldTrip ? new Date().toLocaleTimeString() : ""
        }
      };
    });
  };

  const handleResetCircuit = (key: keyof typeof circuitBreakers) => {
    setCircuitBreakers((prev) => {
      addLog("INFO", "CircuitBreakerManager", `Disjuntor para ${String(key)} resetado manualmente para CLOSED.`, {
        service: String(key)
      });
      return {
        ...prev,
        [key]: { state: "CLOSED", failures: 0, lastTrip: "" }
      };
    });
  };

  return (
    <div className={`p-6 rounded-[28px] border font-sans ${
      highContrast ? "bg-black border-white border-2" : "bg-[#0b0807]/90 border-neutral-900"
    } space-y-6`}>
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-neutral-900 pb-5">
        <div className="flex items-start gap-3">
          <span className="p-3 bg-amber-950/40 text-[#B87333] rounded-2xl border border-amber-900/40">
            <Server className="w-6 h-6 animate-pulse" />
          </span>
          <div>
            <h2 className="text-lg uppercase tracking-wider text-white font-bold">
              Plataforma Operacional & Resiliência
            </h2>
            <p className="text-[10px] text-zinc-500 font-mono uppercase">
              Fase 3 — Observabilidade, Resiliência e Segurança em Larga Escala
            </p>
          </div>
        </div>

        {/* METRICS PREVIEW */}
        <div className="flex flex-wrap gap-2 text-[10px] font-mono text-zinc-400">
          <div className="bg-neutral-950/60 border border-neutral-900 px-3 py-1.5 rounded-lg">
            CPU: <span className="text-[#B87333] font-bold">{metrics.cpuUsage}%</span>
          </div>
          <div className="bg-neutral-950/60 border border-neutral-900 px-3 py-1.5 rounded-lg">
            Memória: <span className="text-[#B87333] font-bold">{metrics.memoryUsage}MB</span>
          </div>
          <div className="bg-neutral-950/60 border border-neutral-900 px-3 py-1.5 rounded-lg">
            SLA: <span className="text-emerald-400 font-bold">{metrics.successRate}%</span>
          </div>
        </div>
      </div>

      {/* HORIZONTAL NAVIGATION TABS */}
      <div className="flex flex-wrap gap-2 border-b border-neutral-900 pb-2">
        <button
          onClick={() => setActiveTab("logs")}
          className={`px-4 py-2 text-[11px] font-mono uppercase tracking-wider font-extrabold rounded-lg transition-all flex items-center gap-2 ${
            activeTab === "logs"
              ? "bg-[#B87333] text-white"
              : "bg-neutral-950/40 text-zinc-400 hover:text-white"
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Logs Estruturados</span>
        </button>

        <button
          onClick={() => setActiveTab("circuit")}
          className={`px-4 py-2 text-[11px] font-mono uppercase tracking-wider font-extrabold rounded-lg transition-all flex items-center gap-2 ${
            activeTab === "circuit"
              ? "bg-[#B87333] text-white"
              : "bg-neutral-950/40 text-zinc-400 hover:text-white"
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Circuit Breaker</span>
        </button>

        <button
          onClick={() => setActiveTab("outbox")}
          className={`px-4 py-2 text-[11px] font-mono uppercase tracking-wider font-extrabold rounded-lg transition-all flex items-center gap-2 ${
            activeTab === "outbox"
              ? "bg-[#B87333] text-white"
              : "bg-neutral-950/40 text-zinc-400 hover:text-white"
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Outbox Pattern</span>
        </button>

        <button
          onClick={() => setActiveTab("security")}
          className={`px-4 py-2 text-[11px] font-mono uppercase tracking-wider font-extrabold rounded-lg transition-all flex items-center gap-2 ${
            activeTab === "security"
              ? "bg-[#B87333] text-white"
              : "bg-neutral-950/40 text-zinc-400 hover:text-white"
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Segurança & Chaves</span>
        </button>

        <button
          onClick={() => setActiveTab("forense")}
          className={`px-4 py-2 text-[11px] font-mono uppercase tracking-wider font-extrabold rounded-lg transition-all flex items-center gap-2 ${
            activeTab === "forense"
              ? "bg-[#B87333] text-white"
              : "bg-neutral-950/40 text-zinc-400 hover:text-white"
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Rastreamento Forense</span>
        </button>

        <button
          onClick={() => setActiveTab("observabilidade_enterprise")}
          className={`px-4 py-2 text-[11px] font-mono uppercase tracking-wider font-extrabold rounded-lg transition-all flex items-center gap-2 ${
            activeTab === "observabilidade_enterprise"
              ? "bg-[#B87333] text-white font-extrabold"
              : "bg-neutral-950/40 text-zinc-400 hover:text-white"
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
          <span>Observabilidade Enterprise</span>
        </button>
      </div>

      {/* TAB CONTENT 1: STRUCTURED LOGGING */}
      {activeTab === "logs" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-[#B87333]" />
                <span>Rastreamento e Telemetria Distribuída</span>
              </h3>
              <p className="text-[10px] text-zinc-500 mt-0.5">
                Monitorização contínua com Trace ID e Span ID por caso de uso.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  addLog("SECURITY", "ApiGateway", "Auditoria de segurança manual disparada.", {
                    action: "MANUAL_AUDIT"
                  });
                }}
                className="px-3 py-1.5 bg-neutral-950 hover:bg-neutral-900 border border-neutral-900 rounded-lg text-[9px] font-mono text-zinc-300 uppercase tracking-widest cursor-pointer"
              >
                Injetar Log Segurança
              </button>
              <button
                onClick={() => setLogs([])}
                className="px-3 py-1.5 bg-neutral-950 hover:bg-neutral-900 border border-neutral-900 rounded-lg text-[9px] font-mono text-zinc-400 uppercase tracking-widest cursor-pointer"
              >
                Limpar Console
              </button>
            </div>
          </div>

          {/* TELEMETRY CHART */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-black/40 p-3.5 rounded-xl border border-neutral-900/60 flex items-center justify-between">
              <div>
                <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-mono">Latência p95</span>
                <div className="text-lg font-mono font-black text-white mt-1">{metrics.p95Latency}ms</div>
              </div>
              <Activity className="w-6 h-6 text-emerald-500 opacity-60" />
            </div>
            <div className="bg-black/40 p-3.5 rounded-xl border border-neutral-900/60 flex items-center justify-between">
              <div>
                <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-mono">Latência p99</span>
                <div className="text-lg font-mono font-black text-white mt-1">{metrics.p99Latency}ms</div>
              </div>
              <Activity className="w-6 h-6 text-amber-500 opacity-60" />
            </div>
            <div className="bg-black/40 p-3.5 rounded-xl border border-neutral-900/60 flex items-center justify-between">
              <div>
                <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-mono">Spans Ativos</span>
                <div className="text-lg font-mono font-black text-emerald-400 mt-1">{metrics.activeSpans} Spans</div>
              </div>
              <Layers className="w-6 h-6 text-[#B87333] opacity-60 animate-pulse" />
            </div>
          </div>

          {/* SHELL LOG CONSOLE */}
          <div className="bg-black border border-neutral-900 rounded-xl overflow-hidden">
            <div className="bg-neutral-950 border-b border-neutral-900 px-4 py-2.5 flex items-center justify-between">
              <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#B87333] animate-ping" />
                Live Telemetry Log
              </span>
              <span className="text-[9px] font-mono text-zinc-500">JSON FORMAT</span>
            </div>

            <div
              ref={logContainerRef}
              className="p-3 max-h-[320px] overflow-y-auto font-mono text-[10px] space-y-2 divide-y divide-neutral-900/40"
            >
              {logs.length === 0 ? (
                <p className="text-center text-zinc-600 py-6">A aguardar telemetria operacional...</p>
              ) : (
                logs.map((log, index) => {
                  let badgeColor = "bg-zinc-950 text-zinc-400 border-zinc-900";
                  if (log.level === "ERROR") badgeColor = "bg-rose-950/40 text-rose-400 border-rose-900/40";
                  if (log.level === "WARN") badgeColor = "bg-amber-950/40 text-amber-400 border-amber-900/40";
                  if (log.level === "SECURITY") badgeColor = "bg-purple-950/40 text-purple-400 border-purple-900/40";

                  return (
                    <div key={index} className="pt-2.5 first:pt-0 block space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[9px] text-zinc-500">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded border text-[8px] font-bold ${badgeColor}`}>
                            {log.level}
                          </span>
                          <span className="text-zinc-400 font-extrabold">{log.service}</span>
                        </div>
                        <div>{log.timestamp}</div>
                      </div>
                      <div className="text-zinc-300 font-medium">{log.message}</div>
                      
                      {/* Grid of structured logs properties to prove complete 15-key schema */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-1 bg-zinc-950/50 p-2 rounded border border-neutral-900/60 text-[8px] text-zinc-500 font-mono mt-1">
                        <div><span className="text-zinc-400 font-bold">traceId:</span> <span className="text-emerald-400">{log.traceId}</span></div>
                        <div><span className="text-zinc-400 font-bold">correlationId:</span> <span className="text-amber-500">{log.correlationId}</span></div>
                        <div><span className="text-zinc-400 font-bold">requestId:</span> <span className="text-sky-400">{log.requestId}</span></div>
                        <div><span className="text-zinc-400 font-bold">transactionId:</span> <span className="text-purple-400">{log.transactionId}</span></div>
                        <div><span className="text-zinc-400 font-bold">walletId:</span> <span className="text-indigo-400">{log.walletId}</span></div>
                        <div><span className="text-zinc-400 font-bold">merchantId:</span> <span className="text-teal-400">{log.merchantId}</span></div>
                        <div><span className="text-zinc-400 font-bold">agentId:</span> <span className="text-pink-400">{log.agentId}</span></div>
                        <div><span className="text-zinc-400 font-bold">duration:</span> <span className="text-yellow-400">{log.durationMs}ms</span></div>
                        <div><span className="text-zinc-400 font-bold">status:</span> <span className="text-emerald-500">{log.status}</span></div>
                        <div><span className="text-zinc-400 font-bold">component:</span> <span className="text-zinc-300">{log.component}</span></div>
                        <div><span className="text-zinc-400 font-bold">version:</span> <span className="text-zinc-400">{log.systemVersion}</span></div>
                        <div className="col-span-2 sm:col-span-1 truncate"><span className="text-zinc-400 font-bold">hash:</span> <span className="text-orange-400 text-[7px]" title={log.hash}>{log.hash}</span></div>
                      </div>

                      {/* Expandable JSON detail block */}
                      <details className="mt-1 group">
                        <summary className="text-[8px] text-[#B87333] hover:text-amber-400 font-bold cursor-pointer select-none outline-none flex items-center gap-1">
                          <span>[+] VER JSON ESTRUTURADO RAW (15-KEYS COMPLIANT)</span>
                        </summary>
                        <pre className="mt-1 p-2 bg-black text-[8px] text-emerald-400/95 overflow-x-auto rounded border border-neutral-900 leading-relaxed font-mono">
                          {JSON.stringify({
                            timestamp: log.timestamp,
                            traceId: log.traceId,
                            correlationId: log.correlationId,
                            requestId: log.requestId,
                            transactionId: log.transactionId,
                            walletId: log.walletId,
                            merchantId: log.merchantId,
                            agentId: log.agentId,
                            event: log.event,
                            durationMs: log.durationMs,
                            status: log.status,
                            severity: log.severity,
                            component: log.component,
                            systemVersion: log.systemVersion,
                            hash: log.hash
                          }, null, 2)}
                        </pre>
                      </details>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: CIRCUIT BREAKER */}
      {activeTab === "circuit" && (
        <div className="space-y-4">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-[#B87333]" />
              <span>Garantia de Tolerância a Falhas (Circuit Breakers)</span>
            </h3>
            <p className="text-[10px] text-zinc-500 mt-0.5">
              Proteja o domínio financeiro contra lentidão e quedas de APIs e canais parceiros.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(Object.keys(circuitBreakers) as Array<keyof typeof circuitBreakers>).map((key) => {
              const breaker = circuitBreakers[key];
              let stateColor = "text-emerald-400 bg-emerald-950/20 border-emerald-900/30";
              let actionText = "Simular Falha";

              if (breaker.state === "OPEN") {
                stateColor = "text-rose-400 bg-rose-950/20 border-rose-900/30";
                actionText = "Fechar Manualmente";
              }

              return (
                <div key={String(key)} className="bg-black/40 p-4 rounded-xl border border-neutral-900/60 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-zinc-200 capitalize font-mono">
                        {String(key).replace(/([A-Z])/g, " $1")}
                      </span>
                      <span className={`px-2 py-0.5 text-[8px] font-black border uppercase tracking-wider rounded ${stateColor}`}>
                        {breaker.state}
                      </span>
                    </div>

                    <div className="text-[10px] text-zinc-500 font-mono">
                      <div>Falhas consecutivas: <span className="text-white font-bold">{breaker.failures}/3</span></div>
                      {breaker.lastTrip && (
                        <div className="mt-0.5">Última queda: <span className="text-rose-400">{breaker.lastTrip}</span></div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {breaker.state === "OPEN" ? (
                      <button
                        onClick={() => handleResetCircuit(key)}
                        className="flex-1 py-1 px-2 bg-emerald-950/20 text-emerald-400 border border-emerald-900/30 rounded text-[9px] font-mono uppercase tracking-widest hover:bg-emerald-950/40 cursor-pointer"
                      >
                        Reset
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSimulateCircuitFailure(key)}
                        className="flex-1 py-1 px-2 bg-amber-950/20 text-[#B87333] border border-amber-900/40 rounded text-[9px] font-mono uppercase tracking-widest hover:bg-amber-950/40 cursor-pointer"
                      >
                        {actionText}
                      </button>
                    )}
                    <button
                      onClick={() => handleToggleCircuitBreaker(key)}
                      className="py-1 px-2 bg-neutral-950 hover:bg-neutral-900 border border-neutral-900 rounded text-[9px] font-mono text-zinc-400 uppercase cursor-pointer"
                    >
                      Alternar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* EDUCATIONAL INSTRUCTIONS ON CIRCUIT BREAKERS */}
          <div className="bg-[#0b0807] p-4 rounded-xl border border-neutral-900 text-xs text-zinc-400 space-y-2">
            <h4 className="font-extrabold text-white uppercase tracking-wider text-[10px] flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>Logica Operacional e Autocura</span>
            </h4>
            <p className="text-[11px] leading-relaxed">
              Quando um Circuit Breaker abre devido a 3 timeouts consecutivos ou falhas de infraestrutura parceira (ex: liquidação na BNA fora de serviço), as requisições subsequentes são barradas na borda e o sistema entra em modo de falha limpa ou as enfileira no Outbox. Após um intervalo de arrefecimento (Cool-off), o disjuntor transita para HALF-OPEN para testar síncronamente a saúde da API.
            </p>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: OUTBOX PATTERN */}
      {activeTab === "outbox" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Database className="w-4 h-4 text-[#B87333]" />
                <span>Mensageria Confiável (Transactional Outbox)</span>
              </h3>
              <p className="text-[10px] text-zinc-500 mt-0.5">
                Impedir inconsistência distribuída gravando transações e mensagens na mesma transação local.
              </p>
            </div>
            <button
              onClick={handleSimulateOutboxFlush}
              className="px-3.5 py-1.5 bg-amber-950/20 hover:bg-amber-950/40 text-[#B87333] border border-amber-900/40 rounded-lg text-[9px] font-mono uppercase tracking-widest font-extrabold flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCw className="w-3 h-3" />
              <span>Forçar Flush Outbox</span>
            </button>
          </div>

          <div className="border border-neutral-900 rounded-xl overflow-hidden divide-y divide-neutral-900 bg-black/40">
            {outbox.map((msg) => (
              <div key={msg.id} className="p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-white">{msg.id}</span>
                    <span className="text-[9px] text-zinc-500 uppercase">({msg.aggregateType} {"\u2192"} {msg.eventType})</span>
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    ID Agregado: <span className="text-zinc-200">{msg.aggregateId}</span> | Payload: <code className="text-zinc-500">{msg.payload}</code>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <span className="text-[9px] text-zinc-500 uppercase font-bold">Tentativas: {msg.attempts}</span>
                  <span className={`px-2 py-0.5 text-[8px] font-bold border rounded uppercase tracking-wider ${
                    msg.status === "PROCESSED"
                      ? "bg-emerald-950/20 text-emerald-400 border-emerald-900/30"
                      : "bg-amber-950/20 text-amber-400 border-amber-900/30"
                  }`}>
                    {msg.status === "PROCESSED" ? "Processado" : "Pendente"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-[#0b0807] p-4 rounded-xl border border-neutral-900 text-xs text-zinc-400 space-y-2">
            <h4 className="font-extrabold text-white uppercase tracking-wider text-[10px] flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>Garantia de Entrega At-Least-Once</span>
            </h4>
            <p className="text-[11px] leading-relaxed">
              O domínio não dispara eventos diretamente para filas de mensageria remotas (como Kafka ou RabbitMQ), pois falhas de rede poderiam anular o evento enquanto a base local commita. Gravando síncronamente na tabela de Outbox como parte da transação do banco de dados, o daemon garante integridade absoluta e entrega repetida de eventos para integração contínua sem quebras de estado financeiro.
            </p>
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: PRODUCTION SECURITY */}
      {activeTab === "security" && (
        <div className="space-y-4">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-[#B87333]" />
              <span>Segurança, Criptografia e Maker-Checker</span>
            </h3>
            <p className="text-[10px] text-zinc-500 mt-0.5">
              Políticas de conformidade estrita para o ambiente produtivo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-black/40 p-4 rounded-xl border border-neutral-900/60 space-y-3.5">
              <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wide flex items-center gap-1.5">
                <Key className="w-4 h-4 text-amber-500" />
                <span>Gestão Ativa de Chaves (Key Rotation)</span>
              </h4>

              <div className="space-y-2 text-[10px] font-mono text-zinc-400">
                <div>Chave ativa (DEK AES-256): <br />
                  <code className="text-white text-[9px] bg-neutral-950 px-2 py-1 rounded block mt-1 break-all border border-neutral-900">
                    {complianceConfig.activeEncryptionKey}
                  </code>
                </div>
                <div className="flex justify-between">
                  <span>Tempo de vida da chave:</span>
                  <span className={`${complianceConfig.keyAgeDays > 25 ? "text-rose-400" : "text-emerald-400"} font-bold`}>
                    {complianceConfig.keyAgeDays} dias
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Regra de expiração automática:</span>
                  <span>{complianceConfig.keyRotationInterval} dias</span>
                </div>
              </div>

              <button
                onClick={handleRotateKeys}
                className="w-full py-2 bg-neutral-950 hover:bg-neutral-900 text-[10px] font-mono text-zinc-300 uppercase tracking-wider rounded border border-neutral-900 flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Rotacionar Chaves</span>
              </button>
            </div>

            <div className="bg-black/40 p-4 rounded-xl border border-neutral-900/60 space-y-3.5">
              <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wide flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                <span>Políticas Governança / Segregação</span>
              </h4>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-bold text-zinc-200 uppercase tracking-wider font-mono">Maker-Checker Ativo</div>
                    <div className="text-[9px] text-zinc-500 font-mono">Requer segunda aprovação para volumes elevados</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={complianceConfig.dualAuthRequired}
                    onChange={(e) => setComplianceConfig(prev => ({ ...prev, dualAuthRequired: e.target.checked }))}
                    className="w-4 h-4 rounded bg-neutral-950 border-neutral-800 text-[#B87333] focus:ring-0 cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-zinc-400 uppercase tracking-wider font-mono">
                    <span>Limite transacional (Maker-Checker)</span>
                    <span className="text-white font-extrabold">{complianceConfig.makerCheckerLimit.toLocaleString()} Kz</span>
                  </div>
                  <input
                    type="range"
                    min="5000"
                    max="100000"
                    step="5000"
                    value={complianceConfig.makerCheckerLimit}
                    onChange={(e) => setComplianceConfig(prev => ({ ...prev, makerCheckerLimit: Number(e.target.value) }))}
                    className="w-full accent-[#B87333] h-1 bg-neutral-900 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 5: FORENSIC AUDITING & DISTRIBUTED TRACING (FASE 3.1) */}
      {activeTab === "forense" && (
        <div className="space-y-6">
          {/* HEADER SECTOR */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Compass className="w-4 h-4 text-[#B87333]" />
                <span>Rastreamento Forense de Fluxos Síncronos</span>
              </h3>
              <p className="text-[10px] text-zinc-500 mt-0.5">
                Investigue e responda instantaneamente auditorias operacionais complexas da regulação SPTR/BNA.
              </p>
            </div>

            {/* DIAGNOSTIC VIEW TABS */}
            <div className="flex bg-neutral-950 border border-neutral-900 rounded-lg p-0.5 self-start md:self-auto">
              <button
                onClick={() => setDiagnosticView("forense")}
                className={`px-2.5 py-1 text-[9px] font-mono uppercase tracking-wider rounded font-extrabold transition-all cursor-pointer ${
                  diagnosticView === "forense"
                    ? "bg-[#B87333]/25 text-white border border-[#B87333]/35"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                7 Perguntas Forenses
              </button>
              <button
                onClick={() => setDiagnosticView("spans")}
                className={`px-2.5 py-1 text-[9px] font-mono uppercase tracking-wider rounded font-extrabold transition-all cursor-pointer ${
                  diagnosticView === "spans"
                    ? "bg-[#B87333]/25 text-white border border-[#B87333]/35"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Árvore de Spans
              </button>
              <button
                onClick={() => setDiagnosticView("propagate")}
                className={`px-2.5 py-1 text-[9px] font-mono uppercase tracking-wider rounded font-extrabold transition-all cursor-pointer ${
                  diagnosticView === "propagate"
                    ? "bg-[#B87333]/25 text-white border border-[#B87333]/35"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Propagação Automática
              </button>
            </div>
          </div>

          {/* SEARCH BOX */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Pesquisar por Transaction ID, Correlation ID, Trace ID, Session ID ou telefone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/60 border border-neutral-900 text-xs text-zinc-300 rounded-xl py-3.5 pl-10 pr-4 placeholder-zinc-600 focus:outline-none focus:border-[#B87333]/50 font-mono transition-all"
            />
          </div>

          {/* SPLIT SCREEN LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* LEFT COLUMN: LIST OF TRANSACTIONS (4 COLS) */}
            <div className="lg:col-span-4 space-y-3">
              <h4 className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono font-bold">
                Transações do Ecossistema ({[...transactions, ...demoTransactions].filter((tx) => {
                  if (!searchQuery) return true;
                  const query = searchQuery.toLowerCase();
                  return (
                    tx.id.toLowerCase().includes(query) ||
                    (tx.correlationId && tx.correlationId.toLowerCase().includes(query)) ||
                    (tx.traceId && tx.traceId.toLowerCase().includes(query)) ||
                    (tx.requestId && tx.requestId.toLowerCase().includes(query)) ||
                    (tx.sessionId && tx.sessionId.toLowerCase().includes(query)) ||
                    tx.senderPhone.toLowerCase().includes(query) ||
                    tx.receiverPhone.toLowerCase().includes(query)
                  );
                }).length})
              </h4>
              <div className="border border-neutral-900 rounded-xl max-h-[380px] overflow-y-auto divide-y divide-neutral-950 bg-black/40">
                {(() => {
                  const allTxs = [...transactions, ...demoTransactions];
                  const filteredTxs = allTxs.filter((tx) => {
                    if (!searchQuery) return true;
                    const query = searchQuery.toLowerCase();
                    return (
                      tx.id.toLowerCase().includes(query) ||
                      (tx.correlationId && tx.correlationId.toLowerCase().includes(query)) ||
                      (tx.traceId && tx.traceId.toLowerCase().includes(query)) ||
                      (tx.requestId && tx.requestId.toLowerCase().includes(query)) ||
                      (tx.sessionId && tx.sessionId.toLowerCase().includes(query)) ||
                      tx.senderPhone.toLowerCase().includes(query) ||
                      tx.receiverPhone.toLowerCase().includes(query)
                    );
                  });

                  if (filteredTxs.length === 0) {
                    return (
                      <div className="p-8 text-center text-zinc-600 text-xs font-mono">
                        Nenhuma transação encontrada para a busca.
                      </div>
                    );
                  }

                  return filteredTxs.map((tx) => {
                    const isSelected = selectedTxId === tx.id || (!selectedTxId && filteredTxs[0]?.id === tx.id);
                    // Handle auto selection logic in UI loop cleanly
                    if (isSelected && !selectedTxId) {
                      setTimeout(() => setSelectedTxId(tx.id), 0);
                    }
                    const isAmlBlocked = tx.status === "blocked_aml";
                    return (
                      <div
                        key={tx.id}
                        onClick={() => setSelectedTxId(tx.id)}
                        className={`p-3 text-xs font-mono cursor-pointer transition-all ${
                          isSelected
                            ? "bg-[#B87333]/15 border-l-2 border-[#B87333]"
                            : "hover:bg-neutral-950/40"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <span className={`font-bold ${isSelected ? "text-white" : "text-zinc-300"}`}>
                            {tx.id.replace("tx_km_", "KM-")}
                          </span>
                          <span className={`text-[10px] font-black ${
                            isAmlBlocked ? "text-rose-400" : "text-emerald-400"
                          }`}>
                            {tx.amount.toLocaleString()} Kz
                          </span>
                        </div>
                        <div className="text-[9px] text-zinc-500 flex justify-between items-center mt-1">
                          <span>{tx.type.toUpperCase()}</span>
                          <span>{new Date(tx.timestamp).toLocaleTimeString("pt-PT")}</span>
                        </div>
                        <div className="text-[8px] text-zinc-600 mt-1 truncate">
                          Corr: {tx.correlationId || "Sem ID"}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* RIGHT COLUMN: DETAIL PANEL (8 COLS) */}
            <div className="lg:col-span-8 bg-neutral-950/30 border border-neutral-900/60 p-5 rounded-2xl space-y-4">
              {(() => {
                const allTxs = [...transactions, ...demoTransactions];
                const activeId = selectedTxId || allTxs[0]?.id;
                const tx = allTxs.find((t) => t.id === activeId);
                if (!tx) {
                  return (
                    <div className="h-full flex flex-col items-center justify-center text-center py-12">
                      <Compass className="w-10 h-10 text-zinc-700 animate-spin mb-3" />
                      <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
                        Selecione uma transação ao lado para análise
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-5">
                    {/* TRANS HEADER */}
                    <div className="flex flex-col sm:flex-row justify-between border-b border-neutral-900 pb-4 gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-white font-mono">{tx.id}</span>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold border uppercase ${
                            tx.status === "completed"
                              ? "bg-emerald-950/20 text-emerald-400 border-emerald-900/30"
                              : tx.status === "blocked_aml"
                              ? "bg-rose-950/20 text-rose-400 border-rose-900/30"
                              : "bg-amber-950/20 text-amber-400 border-amber-900/30"
                          }`}>
                            {tx.status}
                          </span>
                        </div>
                        <p className="text-[9px] text-zinc-500 font-mono mt-1 uppercase truncate max-w-[280px]">
                          Sessão operacional: {tx.sessionId}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black text-[#B87333] font-mono">
                          {tx.amount.toLocaleString()} Kz
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                          Latência Síncrona: <span className="text-white font-bold">{tx.latencyMs}ms</span>
                        </div>
                      </div>
                    </div>

                    {/* SUB-VIEW 1: FORENSIC AS 7 PERGUNTAS */}
                    {diagnosticView === "forense" && (
                      <div className="space-y-4">
                        <div className="bg-neutral-950 border border-neutral-900/60 px-4 py-2.5 rounded-lg flex items-center justify-between">
                          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-extrabold flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-[#B87333]" />
                            Forense: Respostas Operacionais Estritas
                          </span>
                          <span className="text-[9px] text-zinc-500 font-mono uppercase">Auditores Regulados</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                          {/* Q1: QUEM INICIOU */}
                          <div className="bg-black/40 p-3.5 rounded-xl border border-neutral-900/50 space-y-1">
                            <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black flex items-center gap-1.5">
                              <User className="w-3 h-3 text-amber-500" />
                              1. Quem iniciou a transação?
                            </span>
                            <div className="text-zinc-200 font-bold mt-1 text-[11px]">{tx.senderPhone}</div>
                            <p className="text-[9px] text-zinc-500">
                              Usuário iniciador autenticado e certificado na chave privada do dispositivo.
                            </p>
                          </div>

                          {/* Q2: ONDE */}
                          <div className="bg-black/40 p-3.5 rounded-xl border border-neutral-900/50 space-y-1">
                            <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black flex items-center gap-1.5">
                              <MapPin className="w-3 h-3 text-[#B87333]" />
                              2. Onde ocorreu a transação?
                            </span>
                            <div className="text-zinc-200 font-bold mt-1 text-[11px] truncate">
                              {tx.locationName || "Luanda, Angola"}
                            </div>
                            <p className="text-[9px] text-zinc-500 truncate" title={tx.deviceUserAgent}>
                              IP Origem via gateway de celular. Dispositivo: {tx.deviceUserAgent}
                            </p>
                          </div>

                          {/* Q3: QUANDO */}
                          <div className="bg-black/40 p-3.5 rounded-xl border border-neutral-900/50 space-y-1">
                            <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black flex items-center gap-1.5">
                              <Clock className="w-3 h-3 text-sky-400" />
                              3. Quando ocorreu a transação?
                            </span>
                            <div className="text-zinc-200 font-bold mt-1 text-[11px]">{tx.timestamp}</div>
                            <p className="text-[9px] text-zinc-500">
                              Registro síncrono carimbado pelo NTP sincronizado com os servidores da BNA.
                            </p>
                          </div>

                          {/* Q4: QUANTO TEMPO DEMOROU */}
                          <div className="bg-black/40 p-3.5 rounded-xl border border-neutral-900/50 space-y-1">
                            <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black flex items-center gap-1.5">
                              <Activity className="w-3 h-3 text-emerald-400" />
                              4. Quanto tempo demorou o processamento?
                            </span>
                            <div className="text-zinc-200 font-bold mt-1 text-[11px] flex items-center gap-1.5">
                              <span>{tx.latencyMs}ms</span>
                              <span className="text-[9px] font-medium text-emerald-500">
                                (Abaixo do SLA síncrono de 1000ms)
                              </span>
                            </div>
                            <p className="text-[9px] text-zinc-500">
                              Tempo decorrido medido da recepção da API até a persistência ACID no Ledger.
                            </p>
                          </div>

                          {/* Q5: PORQUE FALHOU */}
                          <div className="bg-black/40 p-3.5 rounded-xl border border-neutral-900/50 space-y-1 md:col-span-2">
                            <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black flex items-center gap-1.5">
                              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                              5. Porque falhou a transação?
                            </span>
                            <div className="mt-1">
                              {tx.status === "blocked_aml" ? (
                                <div className="text-rose-400 font-bold text-[11px] bg-rose-950/20 p-2 rounded border border-rose-900/30">
                                  {tx.failReason || tx.fraudAlertReason || "Falha preventiva AML: suspeita de fraude."}
                                </div>
                              ) : (
                                <div className="text-emerald-400 font-bold text-[11px] bg-emerald-950/20 p-2 rounded border border-emerald-900/30">
                                  Zero Exceções — Transação concluída com sucesso e integrada sem erros de invariante.
                                </div>
                              )}
                            </div>
                            <p className="text-[9px] text-zinc-500">
                              Sinalização operacional detalhada sobre rejeições de segurança ou inconsistência.
                            </p>
                          </div>

                          {/* Q6: QUEM APROVOU */}
                          <div className="bg-black/40 p-3.5 rounded-xl border border-neutral-900/50 space-y-1">
                            <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black flex items-center gap-1.5">
                              <UserCheck className="w-3 h-3 text-purple-400" />
                              6. Quem aprovou a transação?
                            </span>
                            <div className="text-zinc-200 font-bold mt-1 text-[11px]">{tx.approvedBy || "KwanzaMóvel Gateway Manager"}</div>
                            <p className="text-[9px] text-zinc-500">
                              Assinatura corporativa de validação regulamentar pelo automatizador.
                            </p>
                          </div>

                          {/* Q7: QUE VERSÃO DO SISTEMA PROCESSOU */}
                          <div className="bg-black/40 p-3.5 rounded-xl border border-neutral-900/50 space-y-1">
                            <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black flex items-center gap-1.5">
                              <Cpu className="w-3 h-3 text-blue-400" />
                              7. Que versão do sistema processou a transação?
                            </span>
                            <div className="text-zinc-200 font-bold mt-1 text-[11px]">{tx.systemVersion || "v2.7.4-prod"}</div>
                            <p className="text-[9px] text-zinc-500">
                              Release tag ativa no nó de computação síncrono.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SUB-VIEW 2: ÁRVORE DE SPANS (DISTRIBUTED TRACING) */}
                    {diagnosticView === "spans" && (
                      <div className="space-y-4 font-mono">
                        <div className="bg-neutral-950 border border-neutral-900/60 px-4 py-2.5 rounded-lg flex items-center justify-between">
                          <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-extrabold flex items-center gap-1.5">
                            <Network className="w-3.5 h-3.5 text-[#B87333]" />
                            OpenTelemetry Distributed Trace Spans
                          </span>
                          <span className="text-[9px] text-zinc-500 uppercase">Tempo Real Síncrono</span>
                        </div>

                        {/* ID HEADER BOX */}
                        <div className="bg-black/40 border border-neutral-900 p-3.5 rounded-xl space-y-1 text-[9px] text-zinc-500">
                          <div><span className="text-zinc-400 uppercase font-black">Trace ID:</span> <span className="text-[#B87333] font-bold">{tx.traceId}</span></div>
                          <div><span className="text-zinc-400 uppercase font-black">Correlation ID:</span> <span className="text-[#B87333] font-bold">{tx.correlationId}</span></div>
                          <div><span className="text-zinc-400 uppercase font-black">Request ID:</span> <span className="text-[#B87333] font-bold">{tx.requestId}</span></div>
                        </div>

                        {/* WATERFALL CHART SIMULATION */}
                        <div className="space-y-3 text-xs">
                          {(() => {
                            const totalMs = tx.latencyMs || 20;
                            const parts = [
                              { name: "ApiGateway::ingress", pct: 10, offset: 0, desc: "Acolhimento da chamada HTTPS" },
                              { name: "AuthService::validateSession", pct: 15, offset: 10, desc: "Validação de chaves e biometria" },
                              { name: "AmlCheckService::validatePepAndLimits", pct: 35, offset: 25, desc: "Varredura geo-velocity e limites" },
                              { name: "LedgerCoreEngine::commitDoubleEntry", pct: 25, offset: 60, desc: "Garantia ACID e partidas dobradas" },
                              { name: "BnaCustodyBridge::dispatchPacs008", pct: 10, offset: 85, desc: "Geração e entrega de arquivo ISO 20022" },
                              { name: "SmsNotifier::dispatchNotification", pct: 5, offset: 95, desc: "Notificação assíncrona cliente" }
                            ];

                            return (
                              <div className="space-y-4">
                                <div className="space-y-2.5">
                                  {parts.map((p, idx) => {
                                    const spanMs = Math.max(1, Math.round((totalMs * p.pct) / 100));
                                    const offsetPct = p.offset;
                                    const widthPct = p.pct;

                                    return (
                                      <div key={idx} className="space-y-1">
                                        <div className="flex justify-between text-[10px] text-zinc-400">
                                          <span className="font-bold text-zinc-300">{p.name} <span className="text-zinc-500 font-normal">({p.desc})</span></span>
                                          <span className="text-[#B87333] font-extrabold">{spanMs}ms</span>
                                        </div>
                                        <div className="w-full bg-neutral-950 rounded-full h-3 border border-neutral-900 overflow-hidden relative">
                                          <div
                                            style={{
                                              marginLeft: `${offsetPct}%`,
                                              width: `${widthPct}%`
                                            }}
                                            className="h-full bg-gradient-to-r from-amber-600 to-[#B87333] rounded-full"
                                          />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>

                                <div className="flex justify-between text-[9px] text-zinc-600 border-t border-neutral-900 pt-2.5">
                                  <span>T = 0ms</span>
                                  <span>T = {Math.round(totalMs / 2)}ms</span>
                                  <span>T = {totalMs}ms (Latência Total)</span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    )}

                    {/* SUB-VIEW 3: PROPAGAÇÃO AUTOMÁTICA E TEORIA */}
                    {diagnosticView === "propagate" && (
                      <div className="space-y-4 text-xs leading-relaxed text-zinc-400">
                        <div className="bg-neutral-950 border border-neutral-900/60 px-4 py-2.5 rounded-lg flex items-center justify-between">
                          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-extrabold flex items-center gap-1.5">
                            <Info className="w-3.5 h-3.5 text-[#B87333]" />
                            Engenharia de Rastreabilidade Síncrona
                          </span>
                          <span className="text-[9px] text-zinc-500 font-mono uppercase">Arquitetura Limpa</span>
                        </div>

                        <div className="space-y-3.5">
                          <div>
                            <h4 className="font-extrabold text-zinc-200 uppercase tracking-wide text-[11px] flex items-center gap-1 font-mono">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#B87333]" />
                              Como os IDs de Observabilidade propagam automaticamente?
                            </h4>
                            <p className="mt-1 text-[11px]">
                              Para garantir rastreamento pleno sem acoplamento ao domínio, utilizamos interceptores globais e o padrão <strong>Context Propagation</strong> (W3C Trace Context):
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
                            <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-900/60 space-y-1.5">
                              <h5 className="font-bold text-zinc-300 font-mono uppercase">1. Entrada via API Gateway</h5>
                              <p>
                                Na borda, o API Gateway intercepta a requisição HTTPS do celular cliente. Se não existirem, gera o <code>Correlation ID</code> e o <code>Trace ID</code>, empacotando-os nos cabeçalhos HTTP (<code>X-Correlation-ID</code>, <code>traceparent</code>).
                              </p>
                            </div>

                            <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-900/60 space-y-1.5">
                              <h5 className="font-bold text-zinc-300 font-mono uppercase">2. Propagação em Processo</h5>
                              <p>
                                Internamente em cada microsserviço síncrono, as chaves de telemetria são mantidas e repassadas sem intervenção manual através de ferramentas como o <code>AsyncLocalStorage</code> (em Node.js) ou <code>ThreadLocal</code> (em Java).
                              </p>
                            </div>

                            <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-900/60 space-y-1.5">
                              <h5 className="font-bold text-zinc-300 font-mono uppercase">3. Cruzamento de Sistemas</h5>
                              <p>
                                Ao se comunicar com sistemas legados externos (ex: SPTR da BNA, gateways de SMS ou adquirentes), os cabeçalhos são re-injetados nas requisições REST/SOAP para garantir rastreamento contínuo até no parceiro.
                              </p>
                            </div>

                            <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-900/60 space-y-1.5">
                              <h5 className="font-bold text-zinc-300 font-mono uppercase">4. Escrita no Ledger e Logs</h5>
                              <p>
                                O middleware de logging e de auditoria de banco intercepta o commit final de gravação do banco de dados e injeta de forma automática e transparente esses 5 IDs essenciais na tabela de transações do Ledger.
                              </p>
                            </div>
                          </div>

                          <div className="bg-[#0b0807] p-3.5 rounded-xl border border-neutral-900 flex gap-2 items-start text-[10px] text-zinc-500 font-mono uppercase">
                            <ShieldCheck className="w-4 h-4 text-[#B87333] shrink-0 mt-0.5" />
                            <span>
                              Esta abordagem atende integralmente os requisitos regulatórios de auditoria financeira síncrona, garantindo observabilidade instantânea sem violar as regras de negócio ou de isolamento do domínio financeiro.
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 6: ENTERPRISE OBSERVABILITY & REAL METRICS (FASE 3.2 - MISSÃO 2) */}
      {activeTab === "observabilidade_enterprise" && (
        <div className="space-y-6">
          {/* ENTERPRISE TITLE HEADER & LOAD CONTROL */}
          <div className="bg-neutral-950/70 border border-neutral-900/80 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[8px] bg-amber-500/20 text-amber-400 font-extrabold rounded border border-amber-500/35 uppercase font-mono">
                  Fase 3.2 — Enterprise Ready
                </span>
                <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-amber-500" />
                  <span>Observabilidade Operacional Enterprise</span>
                </h3>
              </div>
              <p className="text-[10px] text-zinc-400 max-w-2xl leading-relaxed">
                Telemetria desacoplada do domínio financeiro. Métricas operacionais reais expostas automaticamente para raspagem pelo <strong>Prometheus</strong>, logs estruturados e auditoria para <strong>SIEM</strong> e tracing síncrono com <strong>OpenTelemetry</strong>.
              </p>
            </div>

            {/* STRESS TEST TRIGGER BUTTON */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 bg-black/40 p-2.5 rounded-xl border border-neutral-900">
              <div className="text-right pr-1 font-mono">
                <div className="text-[9px] text-zinc-500 uppercase font-bold">Simulador de Carga</div>
                <div className={`text-xs font-black ${loadSimulationActive ? "text-emerald-400" : "text-zinc-400"}`}>
                  {loadSimulationActive ? `${simulatedTps} TPS (STRESS)` : "Ocioso (~2 TPS)"}
                </div>
              </div>
              <button
                onClick={() => {
                  setLoadSimulationActive(!loadSimulationActive);
                  addLog(
                    loadSimulationActive ? "INFO" : "WARN",
                    "LoadSimulator",
                    loadSimulationActive 
                      ? "Teste de stress de alta carga operacional finalizado pelo operador. Retornando ao fluxo ocioso normal."
                      : "Iniciando teste de stress operacional: simulando centenas de requisições por segundo para testar contadores de métricas reais.",
                    { active: !loadSimulationActive, targetTps: 110 }
                  );
                }}
                className={`px-4 py-2.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  loadSimulationActive
                    ? "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/40"
                    : "bg-[#B87333]/20 text-amber-400 border border-[#B87333]/45 hover:bg-[#B87333]/30"
                }`}
              >
                <Zap className={`w-3.5 h-3.5 ${loadSimulationActive ? "animate-bounce" : ""}`} />
                <span>{loadSimulationActive ? "Parar Teste de Stress" : "Iniciar Teste de Stress"}</span>
              </button>
            </div>
          </div>

          {/* ENTERPRISE SUB-TABS NAVIGATION */}
          <div className="flex bg-neutral-950 border border-neutral-900 rounded-xl p-1 self-start max-w-max gap-1">
            <button
              onClick={() => setEnterpriseSubTab("dashboard")}
              className={`px-3.5 py-1.5 text-[9px] font-mono uppercase tracking-wider rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                enterpriseSubTab === "dashboard"
                  ? "bg-[#B87333]/25 text-white border border-[#B87333]/35 font-extrabold"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Activity className="w-3 h-3 text-amber-500" />
              <span>Métricas Reais (Prometheus)</span>
            </button>
            <button
              onClick={() => setEnterpriseSubTab("prometheus")}
              className={`px-3.5 py-1.5 text-[9px] font-mono uppercase tracking-wider rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                enterpriseSubTab === "prometheus"
                  ? "bg-[#B87333]/25 text-white border border-[#B87333]/35 font-extrabold"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Terminal className="w-3 h-3 text-amber-500" />
              <span>Exposição Exporter (/metrics)</span>
            </button>
            <button
              onClick={() => setEnterpriseSubTab("opentelemetry")}
              className={`px-3.5 py-1.5 text-[9px] font-mono uppercase tracking-wider rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                enterpriseSubTab === "opentelemetry"
                  ? "bg-[#B87333]/25 text-white border border-[#B87333]/35 font-extrabold"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Network className="w-3 h-3 text-amber-500" />
              <span>Pipeline OpenTelemetry</span>
            </button>
             <button
              onClick={() => setEnterpriseSubTab("siem")}
              className={`px-3.5 py-1.5 text-[9px] font-mono uppercase tracking-wider rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                enterpriseSubTab === "siem"
                  ? "bg-[#B87333]/25 text-white border border-[#B87333]/35 font-extrabold"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <ShieldAlert className="w-3 h-3 text-amber-500" />
              <span>SIEM Corporate Logging</span>
            </button>
            <button
              onClick={() => setEnterpriseSubTab("latencia")}
              className={`px-3.5 py-1.5 text-[9px] font-mono uppercase tracking-wider rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                enterpriseSubTab === "latencia"
                  ? "bg-[#B87333]/25 text-white border border-[#B87333]/35 font-extrabold"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Clock className="w-3 h-3 text-amber-500" />
              <span>Análise de Latência (Missão 3)</span>
            </button>
          </div>

          {/* SUB-VIEW 1: DASHBOARD DE MÉTRICAS REAIS */}
          {enterpriseSubTab === "dashboard" && (
            <div className="space-y-6">
              {/* INTRO SPECS */}
              <div className="bg-[#0c0807] border border-neutral-900 p-4 rounded-xl text-[11px] text-zinc-400 leading-relaxed font-mono">
                <span className="text-amber-500 font-extrabold mr-1.5">● AUTO-COLLECTOR:</span>
                Cada operação financeira executada na carteira digital (ou gerada pelo simulador) incrementa de forma assíncrona estes contadores de nível de produção. Os nomes seguem rigorosamente a convenção do Prometheus (Snake Case com sufixo de tipo).
              </div>

              {/* METRICS BENTO GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(() => {
                  const liveMetrics = getMetrics();
                  
                  const metricCards = [
                    {
                      key: "payments_total",
                      label: "payments_total",
                      value: liveMetrics.payments_total,
                      type: "Counter",
                      desc: "Número total de solicitações de pagamentos iniciadas no ecossistema.",
                      color: "text-zinc-100",
                      status: "OK / Live"
                    },
                    {
                      key: "payments_success",
                      label: "payments_success",
                      value: liveMetrics.payments_success,
                      type: "Counter",
                      desc: "Pagamentos processados e confirmados com sucesso no SPTR.",
                      color: "text-emerald-400",
                      status: "OK / Synced"
                    },
                    {
                      key: "payments_failed",
                      label: "payments_failed",
                      value: liveMetrics.payments_failed,
                      type: "Counter",
                      desc: "Pagamentos rejeitados (saldo insuficiente, violação de AML ou erro de rota).",
                      color: "text-rose-400",
                      status: "OK / Handled"
                    },
                    {
                      key: "cashin_total",
                      label: "cashin_total",
                      value: liveMetrics.cashin_total,
                      type: "Counter",
                      desc: "Depósitos em carteira via rede de agentes autorizados ou CCI bancário.",
                      color: "text-blue-400",
                      status: "OK / Ledger"
                    },
                    {
                      key: "cashout_total",
                      label: "cashout_total",
                      value: liveMetrics.cashout_total,
                      type: "Counter",
                      desc: "Levantamentos físicos e saques executados com PIN do cliente.",
                      color: "text-indigo-400",
                      status: "OK / Ledger"
                    },
                    {
                      key: "fraud_alerts_total",
                      label: "fraud_alerts_total",
                      value: liveMetrics.fraud_alerts_total,
                      type: "Counter",
                      desc: "Alertas emitidos pelas invariantes regulatórias e de geo-velocity.",
                      color: "text-orange-500 font-extrabold",
                      status: liveMetrics.fraud_alerts_total > 15 ? "CRITICAL ALERT" : "OK / Evaluated"
                    },
                    {
                      key: "ledger_entries_total",
                      label: "ledger_entries_total",
                      value: liveMetrics.ledger_entries_total,
                      type: "Counter",
                      desc: "Contas de lançamentos de partidas dobradas criadas no Ledger seguro.",
                      color: "text-purple-400",
                      status: "OK / Imutável"
                    },
                    {
                      key: "settlements_total",
                      label: "settlements_total",
                      value: liveMetrics.settlements_total,
                      type: "Counter",
                      desc: "Mensagens PACS.008 e ordens de liquidação transmitidas via rede CCI.",
                      color: "text-teal-400",
                      status: "OK / Settled"
                    },
                    {
                      key: "offline_queue",
                      label: "offline_queue",
                      value: liveMetrics.offline_queue,
                      type: "Gauge",
                      desc: "Transações em cache local no outbox pendentes de sincronização síncrona.",
                      color: liveMetrics.offline_queue > 0 ? "text-amber-400 font-black animate-pulse" : "text-zinc-500",
                      status: liveMetrics.offline_queue > 0 ? "OUTBOX SPOOLED" : "EMPTY"
                    },
                    {
                      key: "reconciliation_queue",
                      label: "reconciliation_queue",
                      value: liveMetrics.reconciliation_queue,
                      type: "Gauge",
                      desc: "Transações em processo aguardando validação estrita da conta de compensação.",
                      color: "text-zinc-400",
                      status: "OK / Idle"
                    },
                    {
                      key: "active_agents",
                      label: "active_agents",
                      value: liveMetrics.active_agents,
                      type: "Gauge",
                      desc: "Número de sub-agentes autorizados KwanzaMóvel logados ativamente.",
                      color: "text-yellow-500",
                      status: "18 / 18 ONLINE"
                    },
                    {
                      key: "active_merchants",
                      label: "active_merchants",
                      value: liveMetrics.active_merchants,
                      type: "Gauge",
                      desc: "Estabelecimentos comerciais com credenciais de recebimento ativas.",
                      color: "text-pink-400",
                      status: "45 / 45 ACTIVE"
                    }
                  ];

                  return metricCards.map((m) => {
                    return (
                      <div key={m.key} className="bg-neutral-950/60 border border-neutral-900/80 p-4 rounded-xl space-y-3.5 font-mono flex flex-col justify-between">
                        <div className="space-y-1.5">
                          {/* Label and type */}
                          <div className="flex justify-between items-center text-[9px]">
                            <span className="text-[#B87333] font-extrabold uppercase tracking-widest">{m.type}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                              m.status.includes("CRITICAL") 
                                ? "bg-rose-950/30 text-rose-400 border border-rose-900/30" 
                                : m.status.includes("SPOOLED")
                                ? "bg-amber-950/30 text-amber-400 border border-amber-900/30"
                                : "bg-zinc-900 text-zinc-400"
                            }`}>
                              {m.status}
                            </span>
                          </div>

                          {/* Counter Metric Name */}
                          <div className="text-xs text-white font-black">{m.label}</div>
                          <p className="text-[10px] text-zinc-500 leading-normal">{m.desc}</p>
                        </div>

                        {/* Large Value & Sparkline */}
                        <div className="border-t border-neutral-900/60 pt-3 flex items-end justify-between">
                          <div className="space-y-0.5">
                            <span className="text-[8px] text-zinc-600 block uppercase">VALOR ATUAL</span>
                            <span className={`text-2xl font-black ${m.color}`}>
                              {m.value.toLocaleString()}
                            </span>
                          </div>

                          {/* Custom Sparkline block */}
                          <div className="flex items-end gap-0.5 h-6">
                            {Array.from({ length: 8 }).map((_, idx) => {
                              const heightPct = loadSimulationActive 
                                ? Math.floor(40 + Math.random() * 60) 
                                : Math.floor(10 + Math.random() * 30);
                              return (
                                <div 
                                  key={idx} 
                                  style={{ height: `${heightPct}%` }}
                                  className={`w-1 rounded-t-sm transition-all ${
                                    loadSimulationActive ? "bg-amber-500" : "bg-neutral-800"
                                  }`}
                                />
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {/* SUB-VIEW 2: PROMETHEUS SCRAPABLE EXPORTER (/metrics) */}
          {enterpriseSubTab === "prometheus" && (
            <div className="space-y-4 font-mono">
              <div className="bg-neutral-950/70 border border-neutral-900/80 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="space-y-0.5">
                  <span className="text-[8px] text-[#B87333] font-bold uppercase tracking-widest block">Prometheus Exporter Spec</span>
                  <div className="text-xs text-zinc-200 font-bold flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-amber-500" />
                    <span>GET /api/v1/telemetry/metrics</span>
                  </div>
                  <p className="text-[10px] text-zinc-500">
                    Exposição pura em texto simples no formato OpenMetrics v1.0.0. Copie ou simule a varredura periódica de 5s.
                  </p>
                </div>

                <div className="flex items-center gap-2 self-stretch sm:self-auto">
                  <button
                    onClick={() => {
                      setIsScraping(true);
                      setTimeout(() => {
                        setIsScraping(false);
                        setPrometheusScrapeCount(prev => prev + 1);
                        addLog("INFO", "PrometheusAgent", "Varredura (/metrics) solicitada com sucesso pelo IP 10.244.1.84 (Grafana server).", {
                          scrapeVersion: "OpenMetrics 1.0.0",
                          returnedLines: 48
                        });
                      }, 800);
                    }}
                    disabled={isScraping}
                    className="px-3.5 py-2 bg-[#B87333]/20 hover:bg-[#B87333]/30 text-amber-400 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-[#B87333]/35 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${isScraping ? "animate-spin" : ""}`} />
                    <span>{isScraping ? "Raspando..." : "Simular Scrape"}</span>
                  </button>

                  <button
                    onClick={() => {
                      const rawMetricsElement = document.getElementById("prometheus-raw-exporter");
                      if (rawMetricsElement) {
                        navigator.clipboard.writeText(rawMetricsElement.innerText);
                        setCopiedFeedback("metrics");
                        setTimeout(() => setCopiedFeedback(null), 2000);
                      }
                    }}
                    className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-zinc-300 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-neutral-800 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>{copiedFeedback === "metrics" ? "Copiado!" : "Copiar Métricas Raw"}</span>
                  </button>
                </div>
              </div>

              {/* Scrape stats box */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-black/40 border border-neutral-900 p-4 rounded-xl text-[10px] text-zinc-500">
                <div>
                  <span className="block text-zinc-600 font-extrabold uppercase text-[8px]">EXPORTER STATUS</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    UP / HEALTHY
                  </span>
                </div>
                <div>
                  <span className="block text-zinc-600 font-extrabold uppercase text-[8px]">TOTAL SCRAPES</span>
                  <span className="text-white font-bold mt-1 block">{prometheusScrapeCount} requisições</span>
                </div>
                <div>
                  <span className="block text-zinc-600 font-extrabold uppercase text-[8px]">FORMATO EXPOSTO</span>
                  <span className="text-amber-500 font-bold mt-1 block">text/plain; version=0.0.4</span>
                </div>
                <div>
                  <span className="block text-zinc-600 font-extrabold uppercase text-[8px]">LATÊNCIA DO EXPORTER</span>
                  <span className="text-white font-bold mt-1 block">0.82ms</span>
                </div>
              </div>

              {/* Prometheus PlainText Code Block */}
              <div className="relative">
                <div className="absolute top-3 right-3 text-[8px] text-zinc-600 bg-zinc-950 px-2 py-0.5 rounded border border-neutral-900 font-mono">
                  PROMETHEUS FORMAT
                </div>
                <pre
                  id="prometheus-raw-exporter"
                  className="p-5 bg-black text-emerald-400/95 overflow-x-auto rounded-2xl border border-neutral-900 text-[10px] leading-relaxed max-h-[480px] overflow-y-auto font-mono"
                >
                  {(() => {
                    const m = getMetrics();
                    return (
`# HELP payments_total Número total de pagamentos processados
# TYPE payments_total counter
payments_total{component="LedgerCore",env="production"} ${m.payments_total}

# HELP payments_success Número de pagamentos liquidados com sucesso no SPTR
# TYPE payments_success counter
payments_success{component="LedgerCore",env="production"} ${m.payments_success}

# HELP payments_failed Número de pagamentos rejeitados por violação de AML ou insuficiência de fundos
# TYPE payments_failed counter
payments_failed{component="LedgerCore",env="production"} ${m.payments_failed}

# HELP cashin_total Número de recargas de carteira (cash-in) via Agente ou Transferência
# TYPE cashin_total counter
cashin_total{component="WalletService",env="production"} ${m.cashin_total}

# HELP cashout_total Número de saques de dinheiro (cash-out) via Agente
# TYPE cashout_total counter
cashout_total{component="WalletService",env="production"} ${m.cashout_total}

# HELP fraud_alerts_total Alertas de segurança AML/Fraude gerados pelo validador de regras geo-velocity
# TYPE fraud_alerts_total counter
fraud_alerts_total{component="AmlCheckService",env="production"} ${m.fraud_alerts_total}

# HELP ledger_entries_total Lançamentos contábeis de partidas dobradas persistidos no ledger imutável
# TYPE ledger_entries_total counter
ledger_entries_total{component="LedgerService",env="production"} ${m.ledger_entries_total}

# HELP settlements_total Ciclos de compensação financeira e liquidação na conta de custódia BNA
# TYPE settlements_total counter
settlements_total{component="SettlementManager",env="production"} ${m.settlements_total}

# HELP offline_queue Mensagens pendentes de envio acumuladas na outbox offline
# TYPE offline_queue gauge
offline_queue{component="OutboxProcessor",env="production"} ${m.offline_queue}

# HELP reconciliation_queue Transações pendentes de conciliação de custódia no ciclo diário
# TYPE reconciliation_queue gauge
reconciliation_queue{component="ReconciliationEngine",env="production"} ${m.reconciliation_queue}

# HELP active_agents Número de agentes autorizados operando ativamente no ecossistema
# TYPE active_agents gauge
active_agents{component="AgentService",env="production"} ${m.active_agents}

# HELP active_merchants Número de estabelecimentos comerciais (merchants) integrados ativos
# TYPE active_merchants gauge
active_merchants{component="MerchantService",env="production"} ${m.active_merchants}`
                    );
                  })()}
                </pre>
              </div>
            </div>
          )}

          {/* SUB-VIEW 3: OPENTELEMETRY TRACING AND METRICS PIPELINE */}
          {enterpriseSubTab === "opentelemetry" && (
            <div className="space-y-4 text-xs text-zinc-400 font-mono">
              <div className="bg-neutral-950 border border-neutral-900/60 p-4 rounded-xl flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-extrabold flex items-center gap-1.5">
                  <Network className="w-3.5 h-3.5 text-amber-500" />
                  Pipeline OpenTelemetry (OTel Collector)
                </span>
                <span className="text-[9px] text-zinc-500 uppercase">Especificação W3C</span>
              </div>

              <div className="bg-black/40 border border-neutral-900 p-4 rounded-xl space-y-4">
                <h4 className="text-[11px] font-bold text-zinc-200 uppercase tracking-wider">Como as Métricas e Spans são Desacoplados do Domínio?</h4>
                <p className="leading-relaxed text-zinc-400 text-[11px]">
                  Não injetamos bibliotecas de monitoração dentro da nossa regra de negócio pura (Fase 2.5 DDD). Em vez disso, utilizamos <strong>Decorators</strong>, <strong>Middleware de Logging Estruturado</strong> e <strong>Hooks no Banco de Dados</strong> para interceptar transações e publicar eventos síncronos.
                </p>

                {/* PIPELINE ASCII DIAGRAM */}
                <div className="bg-zinc-950 p-4 rounded-lg border border-neutral-900/60 overflow-x-auto text-[10px] text-emerald-400 space-y-2 leading-relaxed font-mono">
                  <div className="text-zinc-500">// Pipeline de Coleta de Métricas & Tracing</div>
                  <div>[Operação de Negócio] ──&gt; (Domain Event Handler)</div>
                  <div className="pl-6 text-zinc-500">│</div>
                  <div>└──&gt; [OTel SDK Auto-Instrument] ──&gt; (gRPC Export via OTLP Protobuf)</div>
                  <div className="pl-24 text-zinc-500">│</div>
                  <div>└─&gt; [OpenTelemetry Collector]</div>
                  <div className="pl-32 text-zinc-500">├───&gt; [Prometheus Exporter] ──&gt; (Grafana)</div>
                  <div className="pl-32 text-zinc-500">└───&gt; [Jaeger / Zipkin Traces]</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
                  <div className="bg-zinc-950/40 p-4 rounded-xl border border-neutral-900/40 space-y-1.5">
                    <h5 className="font-bold text-zinc-300 uppercase">Context Propagation</h5>
                    <p className="text-zinc-400 leading-normal">
                      Os cabeçalhos W3C <code>traceparent</code> e <code>tracestate</code> fluem silenciosamente através de todos os limites de microsserviços sem perturbar os domínios de Wallet ou de Custódia.
                    </p>
                  </div>

                  <div className="bg-zinc-950/40 p-4 rounded-xl border border-neutral-900/40 space-y-1.5">
                    <h5 className="font-bold text-zinc-300 uppercase">Prometheus Push/Pull</h5>
                    <p className="text-zinc-400 leading-normal">
                      Enquanto o Prometheus raspa o endpoint síncrono (/metrics) a cada 5 segundos, o OpenTelemetry Collector pode simultaneamente receber as métricas por push síncrono, reduzindo a latência a zero.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUB-VIEW 4: SIEM CORPORATE SECURITY AUDITING */}
          {enterpriseSubTab === "siem" && (
            <div className="space-y-4 font-mono">
              <div className="bg-neutral-950/70 border border-neutral-900/80 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="space-y-0.5">
                  <span className="text-[8px] text-[#B87333] font-bold uppercase tracking-widest block">SIEM Auditing Hub</span>
                  <h4 className="text-xs text-zinc-200 font-bold flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-500" />
                    <span>Auditoria Estruturada para Graylog / Splunk / QRadar</span>
                  </h4>
                  <p className="text-[10px] text-zinc-500">
                    Logs estruturados síncronos de alta segurança gerados com chaves sha256 criptográficas para prevenir repúdio e alteração por terceiros.
                  </p>
                </div>

                {/* SEVERITY FILTER */}
                <div className="flex items-center gap-1.5 bg-black p-1.5 rounded-lg border border-neutral-900">
                  <span className="text-[8px] text-zinc-500 font-bold uppercase pl-1.5 pr-1">Filtro SIEM:</span>
                  {(["ALL", "INFO", "WARN", "ERROR", "SECURITY"] as const).map((sev) => (
                    <button
                      key={sev}
                      onClick={() => setSelectedSIEMSeverity(sev)}
                      className={`px-2.5 py-1 text-[8px] uppercase tracking-wider font-extrabold rounded-md transition-all cursor-pointer ${
                        selectedSIEMSeverity === sev
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              {/* SIEM LOG ENTRIES STACK */}
              <div className="bg-black/60 border border-neutral-900 rounded-xl divide-y divide-neutral-950 max-h-[480px] overflow-y-auto">
                {(() => {
                  const filteredSiemLogs = logs.filter(l => {
                    if (selectedSIEMSeverity === "ALL") return true;
                    return l.severity === selectedSIEMSeverity;
                  });

                  if (filteredSiemLogs.length === 0) {
                    return (
                      <div className="p-8 text-center text-zinc-600 text-xs">
                        Nenhum log estruturado para o filtro SIEM selecionado.
                      </div>
                    );
                  }

                  return filteredSiemLogs.map((l, index) => {
                    const isSecurity = l.severity === "SECURITY";
                    const isError = l.severity === "ERROR";
                    const isWarn = l.severity === "WARN";
                    
                    const badgeClass = isSecurity
                      ? "bg-purple-950/40 text-purple-400 border-purple-900/40"
                      : isError
                      ? "bg-rose-950/40 text-rose-400 border-rose-900/40"
                      : isWarn
                      ? "bg-amber-950/40 text-amber-400 border-amber-900/40"
                      : "bg-zinc-900 text-zinc-400 border-neutral-800";

                    return (
                      <div key={index} className="p-4 space-y-2.5 hover:bg-neutral-950/40 transition-colors">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] text-zinc-400 font-bold">{l.timestamp}</span>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${badgeClass}`}>
                              {l.severity}
                            </span>
                            <span className="text-zinc-500 font-black text-[9px] uppercase">{l.component}</span>
                          </div>
                          <span className="text-[7px] text-zinc-600 font-bold truncate max-w-[200px]" title={l.hash}>
                            SHA256: {l.hash}
                          </span>
                        </div>

                        <div className="text-[11px] text-zinc-200 font-medium">
                          Event: <span className="text-emerald-400">{l.event}</span>
                        </div>

                        {/* 15 Keys JSON representation */}
                        <details className="mt-1 group">
                          <summary className="text-[8px] text-zinc-500 hover:text-zinc-300 font-bold cursor-pointer select-none outline-none">
                            [+] Expandir Payload Syslog Estruturado (15-keys RFC-5424)
                          </summary>
                          <pre className="mt-1.5 p-3 bg-zinc-950 text-[9px] text-zinc-400 overflow-x-auto rounded border border-neutral-900 leading-normal leading-relaxed font-mono">
                            {JSON.stringify({
                              timestamp: l.timestamp,
                              traceId: l.traceId,
                              correlationId: l.correlationId,
                              requestId: l.requestId,
                              transactionId: l.transactionId,
                              walletId: l.walletId,
                              merchantId: l.merchantId,
                              agentId: l.agentId,
                              event: l.event,
                              durationMs: l.durationMs,
                              status: l.status,
                              severity: l.severity,
                              component: l.component,
                              systemVersion: l.systemVersion,
                              hash: l.hash
                            }, null, 2)}
                          </pre>
                        </details>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {/* SUB-VIEW 5: LATÊNCIA DOS CASOS DE USO (MISSÃO 3) */}
          {enterpriseSubTab === "latencia" && (() => {
            const currentUseCaseRecords = latencyRecords.filter(r => r.usecase === selectedUseCase);
            
            // Helper to compute P50, P95, P99
            const computePercentiles = (fieldName: keyof Omit<UseCaseLatencyRecord, "id" | "usecase" | "timestamp">) => {
              if (currentUseCaseRecords.length === 0) return { p50: 0, p95: 0, p99: 0 };
              const values = currentUseCaseRecords.map(r => r[fieldName] as number).sort((a, b) => a - b);
              const p50 = values[Math.floor(values.length * 0.50)];
              const p95 = values[Math.floor(values.length * 0.95)] || values[values.length - 1];
              const p99 = values[Math.floor(values.length * 0.99)] || values[values.length - 1];
              return { p50, p95, p99 };
            };

            const totalPct = computePercentiles("totalMs");
            const amlPct = computePercentiles("amlMs");
            const ledgerPct = computePercentiles("ledgerMs");
            const settlementPct = computePercentiles("settlementMs");
            const persistencePct = computePercentiles("persistenceMs");
            const uiPct = computePercentiles("uiMs");

            // SLA targets to compare against
            const slaTargets = {
              totalMs: 120,
              amlMs: 25,
              ledgerMs: 15,
              settlementMs: 30,
              persistenceMs: 20,
              uiMs: 10
            };

            const getSpeedColor = (val: number, limit: number) => {
              if (val < limit * 0.7) return "text-emerald-400 border-emerald-950/25 bg-emerald-950/10";
              if (val < limit) return "text-amber-400 border-amber-950/25 bg-amber-950/10";
              return "text-rose-400 border-rose-950/25 bg-rose-950/10";
            };

            const handleInjectAmostras = (isStress: boolean) => {
              const now = new Date();
              const newSamples: UseCaseLatencyRecord[] = [];
              for (let i = 0; i < 30; i++) {
                const multiplier = isStress ? (2.0 + Math.random() * 2.0) : (0.9 + Math.random() * 0.3);
                
                const amlMs = Math.floor((selectedUseCase === "PayMerchantUseCase" ? 12 : 10) * multiplier);
                const ledgerMs = Math.floor((selectedUseCase === "PayMerchantUseCase" ? 8 : 6) * multiplier);
                const settlementMs = Math.floor((selectedUseCase === "PayMerchantUseCase" ? 15 : 12) * multiplier);
                const persistenceMs = Math.floor((selectedUseCase === "PayMerchantUseCase" ? 10 : 8) * multiplier);
                const uiMs = Math.floor((selectedUseCase === "PayMerchantUseCase" ? 5 : 4) * multiplier);
                const totalMs = amlMs + ledgerMs + settlementMs + persistenceMs + uiMs;

                const timeOffset = new Date(now.getTime() - (30 - i) * 1000);
                const timestamp = timeOffset.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

                newSamples.push({
                  id: `lat_inj_${Math.random().toString(36).substring(2, 9)}`,
                  usecase: selectedUseCase,
                  timestamp,
                  totalMs,
                  amlMs,
                  ledgerMs,
                  settlementMs,
                  persistenceMs,
                  uiMs
                });
              }
              setLatencyRecords(prev => [...prev, ...newSamples]);
              addLog(
                isStress ? "WARN" : "INFO",
                "LatencyTracker",
                `Forçada injeção de 30 amostras de latência (${isStress ? "SOBRECARGA STRESS" : "FLUXO NORMAL"}) para ${selectedUseCase}.`
              );
            };

            const handleClearHistory = () => {
              setLatencyRecords(prev => prev.filter(r => r.usecase !== selectedUseCase));
              addLog("INFO", "LatencyTracker", `Histórico de telemetria de latência reiniciado para o Caso de Uso: ${selectedUseCase}.`);
            };

            return (
              <div className="space-y-6">
                {/* HEADLINE SECTION */}
                <div className="bg-[#0c0807] border border-neutral-900 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 font-mono">
                  <div className="space-y-1">
                    <span className="text-[8px] text-[#B87333] font-bold uppercase tracking-widest block">Telemetria de Alta Precisão</span>
                    <h4 className="text-xs text-zinc-200 font-bold flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>Análise Multidimensional de Latência por Caso de Uso</span>
                    </h4>
                    <p className="text-[10px] text-zinc-500">
                      Rastreabilidade ponta a ponta sem poluir as regras puras de domínio. P50, P95 e P99 calculados em tempo real sobre a base histórica.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleInjectAmostras(false)}
                      className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-[9px] font-bold text-zinc-300 font-mono rounded-lg transition-all cursor-pointer"
                    >
                      Injetar Amostras Normais
                    </button>
                    <button
                      onClick={() => handleInjectAmostras(true)}
                      className="px-3 py-1.5 bg-rose-950/30 hover:bg-rose-950/50 border border-rose-900/30 text-[9px] font-bold text-rose-400 font-mono rounded-lg transition-all cursor-pointer"
                    >
                      Injetar Sobrecarga (Spike)
                    </button>
                    <button
                      onClick={handleClearHistory}
                      className="px-3 py-1.5 bg-neutral-950 hover:bg-neutral-900 border border-neutral-900 text-[9px] font-bold text-zinc-500 font-mono rounded-lg transition-all cursor-pointer"
                    >
                      Limpar
                    </button>
                  </div>
                </div>

                {/* CASE SELECTOR BUTTONS */}
                <div className="flex flex-wrap gap-2">
                  {([
                    { name: "TransferMoneyUseCase", label: "Transferência P2P", desc: "TransferMoneyUseCase" },
                    { name: "PayMerchantUseCase", label: "Pagamento Lojista", desc: "PayMerchantUseCase" },
                    { name: "CashInUseCase", label: "Depósito (Cash In)", desc: "CashInUseCase" },
                    { name: "CashOutUseCase", label: "Levantamento (Cash Out)", desc: "CashOutUseCase" },
                    { name: "ReverseTransactionUseCase", label: "Estorno (Rollback)", desc: "ReverseTransactionUseCase" }
                  ] as const).map((uc) => (
                    <button
                      key={uc.name}
                      onClick={() => setSelectedUseCase(uc.name)}
                      className={`px-3.5 py-2 rounded-xl text-left font-mono transition-all border cursor-pointer space-y-0.5 flex-1 min-w-[170px] ${
                        selectedUseCase === uc.name
                          ? "bg-[#B87333]/15 text-white border-[#B87333]/35 shadow-md shadow-[#B87333]/5"
                          : "bg-neutral-950/40 text-zinc-500 border-neutral-900/60 hover:text-zinc-300 hover:border-neutral-800"
                      }`}
                    >
                      <div className="text-[10px] font-bold tracking-wide">{uc.label}</div>
                      <div className="text-[8px] opacity-75">{uc.desc}</div>
                    </button>
                  ))}
                </div>

                {/* SPEEDOMETER PERCENTILES GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-mono">
                  {/* CARD 1: TEMPO TOTAL */}
                  <div className={`p-4 rounded-2xl border ${getSpeedColor(totalPct.p95, slaTargets.totalMs)} space-y-3`}>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        Tempo Total E2E
                      </span>
                      <span className="text-[8px] px-1.5 py-0.5 rounded border border-neutral-800 text-zinc-400">SLA: &lt;{slaTargets.totalMs}ms</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center pt-1.5">
                      <div className="bg-black/30 py-2 rounded-xl border border-neutral-900/30">
                        <div className="text-[8px] text-zinc-500 uppercase font-bold">P50 (Median)</div>
                        <div className="text-sm font-black text-zinc-100">{totalPct.p50}ms</div>
                      </div>
                      <div className="bg-black/30 py-2 rounded-xl border border-neutral-900/30">
                        <div className="text-[8px] text-zinc-500 uppercase font-bold">P95 (95th)</div>
                        <div className="text-sm font-black text-amber-400">{totalPct.p95}ms</div>
                      </div>
                      <div className="bg-black/30 py-2 rounded-xl border border-neutral-900/30">
                        <div className="text-[8px] text-zinc-500 uppercase font-bold">P99 (Tail)</div>
                        <div className="text-sm font-black text-rose-400">{totalPct.p99}ms</div>
                      </div>
                    </div>
                  </div>

                  {/* CARD 2: TEMPO AML */}
                  <div className={`p-4 rounded-2xl border ${getSpeedColor(amlPct.p95, slaTargets.amlMs)} space-y-3`}>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        Tempo AML & Fraude
                      </span>
                      <span className="text-[8px] px-1.5 py-0.5 rounded border border-neutral-800 text-zinc-400">SLA: &lt;{slaTargets.amlMs}ms</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center pt-1.5">
                      <div className="bg-black/30 py-2 rounded-xl border border-neutral-900/30">
                        <div className="text-[8px] text-zinc-500 uppercase font-bold">P50</div>
                        <div className="text-sm font-black text-zinc-100">{amlPct.p50}ms</div>
                      </div>
                      <div className="bg-black/30 py-2 rounded-xl border border-neutral-900/30">
                        <div className="text-[8px] text-zinc-500 uppercase font-bold">P95</div>
                        <div className="text-sm font-black text-amber-400">{amlPct.p95}ms</div>
                      </div>
                      <div className="bg-black/30 py-2 rounded-xl border border-neutral-900/30">
                        <div className="text-[8px] text-zinc-500 uppercase font-bold">P99</div>
                        <div className="text-sm font-black text-rose-400">{amlPct.p99}ms</div>
                      </div>
                    </div>
                  </div>

                  {/* CARD 3: TEMPO LEDGER */}
                  <div className={`p-4 rounded-2xl border ${getSpeedColor(ledgerPct.p95, slaTargets.ledgerMs)} space-y-3`}>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-[#B87333]" />
                        Tempo Ledger Contábil
                      </span>
                      <span className="text-[8px] px-1.5 py-0.5 rounded border border-neutral-800 text-zinc-400">SLA: &lt;{slaTargets.ledgerMs}ms</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center pt-1.5">
                      <div className="bg-black/30 py-2 rounded-xl border border-neutral-900/30">
                        <div className="text-[8px] text-zinc-500 uppercase font-bold">P50</div>
                        <div className="text-sm font-black text-zinc-100">{ledgerPct.p50}ms</div>
                      </div>
                      <div className="bg-black/30 py-2 rounded-xl border border-neutral-900/30">
                        <div className="text-[8px] text-zinc-500 uppercase font-bold">P95</div>
                        <div className="text-sm font-black text-amber-400">{ledgerPct.p95}ms</div>
                      </div>
                      <div className="bg-black/30 py-2 rounded-xl border border-neutral-900/30">
                        <div className="text-[8px] text-zinc-500 uppercase font-bold">P99</div>
                        <div className="text-sm font-black text-rose-400">{ledgerPct.p99}ms</div>
                      </div>
                    </div>
                  </div>

                  {/* CARD 4: TEMPO SETTLEMENT */}
                  <div className={`p-4 rounded-2xl border ${getSpeedColor(settlementPct.p95, slaTargets.settlementMs)} space-y-3`}>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-blue-400" />
                        Tempo SPTR Settlement
                      </span>
                      <span className="text-[8px] px-1.5 py-0.5 rounded border border-neutral-800 text-zinc-400">SLA: &lt;{slaTargets.settlementMs}ms</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center pt-1.5">
                      <div className="bg-black/30 py-2 rounded-xl border border-neutral-900/30">
                        <div className="text-[8px] text-zinc-500 uppercase font-bold">P50</div>
                        <div className="text-sm font-black text-zinc-100">{settlementPct.p50}ms</div>
                      </div>
                      <div className="bg-black/30 py-2 rounded-xl border border-neutral-900/30">
                        <div className="text-[8px] text-zinc-500 uppercase font-bold">P95</div>
                        <div className="text-sm font-black text-amber-400">{settlementPct.p95}ms</div>
                      </div>
                      <div className="bg-black/30 py-2 rounded-xl border border-neutral-900/30">
                        <div className="text-[8px] text-zinc-500 uppercase font-bold">P99</div>
                        <div className="text-sm font-black text-rose-400">{settlementPct.p99}ms</div>
                      </div>
                    </div>
                  </div>

                  {/* CARD 5: TEMPO PERSISTÊNCIA */}
                  <div className={`p-4 rounded-2xl border ${getSpeedColor(persistencePct.p95, slaTargets.persistenceMs)} space-y-3`}>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5 text-zinc-400" />
                        Tempo Persistência Local
                      </span>
                      <span className="text-[8px] px-1.5 py-0.5 rounded border border-neutral-800 text-zinc-400">SLA: &lt;{slaTargets.persistenceMs}ms</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center pt-1.5">
                      <div className="bg-black/30 py-2 rounded-xl border border-neutral-900/30">
                        <div className="text-[8px] text-zinc-500 uppercase font-bold">P50</div>
                        <div className="text-sm font-black text-zinc-100">{persistencePct.p50}ms</div>
                      </div>
                      <div className="bg-black/30 py-2 rounded-xl border border-neutral-900/30">
                        <div className="text-[8px] text-zinc-500 uppercase font-bold">P95</div>
                        <div className="text-sm font-black text-amber-400">{persistencePct.p95}ms</div>
                      </div>
                      <div className="bg-black/30 py-2 rounded-xl border border-neutral-900/30">
                        <div className="text-[8px] text-zinc-500 uppercase font-bold">P99</div>
                        <div className="text-sm font-black text-rose-400">{persistencePct.p99}ms</div>
                      </div>
                    </div>
                  </div>

                  {/* CARD 6: TEMPO UI */}
                  <div className={`p-4 rounded-2xl border ${getSpeedColor(uiPct.p95, slaTargets.uiMs)} space-y-3`}>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-[#B87333]" />
                        Tempo Renderização UI
                      </span>
                      <span className="text-[8px] px-1.5 py-0.5 rounded border border-neutral-800 text-zinc-400">SLA: &lt;{slaTargets.uiMs}ms</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center pt-1.5">
                      <div className="bg-black/30 py-2 rounded-xl border border-neutral-900/30">
                        <div className="text-[8px] text-zinc-500 uppercase font-bold">P50</div>
                        <div className="text-sm font-black text-zinc-100">{uiPct.p50}ms</div>
                      </div>
                      <div className="bg-black/30 py-2 rounded-xl border border-neutral-900/30">
                        <div className="text-[8px] text-zinc-500 uppercase font-bold">P95</div>
                        <div className="text-sm font-black text-amber-400">{uiPct.p95}ms</div>
                      </div>
                      <div className="bg-black/30 py-2 rounded-xl border border-neutral-900/30">
                        <div className="text-[8px] text-zinc-500 uppercase font-bold">P99</div>
                        <div className="text-sm font-black text-rose-400">{uiPct.p99}ms</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* HISTORICAL CHART */}
                <div className="bg-[#09090b]/50 border border-neutral-900 p-4 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center">
                    <h5 className="text-[11px] font-bold text-zinc-200 font-mono uppercase tracking-wider">Histórico de Distribuição de Latências (Últimas Execuções)</h5>
                    <span className="text-[8px] text-zinc-500 font-mono">Unidade: Milissegundos (ms)</span>
                  </div>

                  {currentUseCaseRecords.length === 0 ? (
                    <div className="p-16 text-center text-zinc-600 font-mono text-[11px]">
                      Sem histórico de telemetria para este Caso de Uso. Execute transações para gerar dados.
                    </div>
                  ) : (
                    <div className="h-64 font-mono">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={currentUseCaseRecords.slice(-40)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                          <XAxis dataKey="timestamp" stroke="#525252" fontSize={9} tickLine={false} />
                          <YAxis stroke="#525252" fontSize={9} tickLine={false} />
                          <Tooltip
                            contentStyle={{ backgroundColor: "#09090b", borderColor: "#262626", borderRadius: "10px", fontSize: "11px" }}
                            labelStyle={{ color: "#a1a1aa", fontWeight: "bold" }}
                          />
                          <Legend wrapperStyle={{ fontSize: "10px", paddingTop: "10px" }} />
                          <Line type="monotone" dataKey="totalMs" name="Tempo Total" stroke="#eab308" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                          <Line type="monotone" dataKey="amlMs" name="Tempo AML" stroke="#10b981" strokeWidth={1} dot={false} strokeDasharray="4 4" />
                          <Line type="monotone" dataKey="ledgerMs" name="Tempo Ledger" stroke="#B87333" strokeWidth={1} dot={false} strokeDasharray="3 3" />
                          <Line type="monotone" dataKey="settlementMs" name="Tempo SPTR" stroke="#3b82f6" strokeWidth={1} dot={false} strokeDasharray="2 2" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
