/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Building, 
  Database, 
  ArrowRightLeft, 
  CheckCircle, 
  FileCode, 
  TrendingUp, 
  BarChart3,
  ShieldCheck, 
  Layers, 
  RefreshCw,
  Cpu,
  AlertCircle,
  FileText,
  ShieldAlert,
  Users,
  Coins,
  FileSignature,
  Bell,
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
  Link,
  Play,
  Send,
  Server,
  ShoppingCart,
  Smartphone,
  Lock,
  Unlock,
  Code
} from "lucide-react";
import { BnaCustodyState, Transaction, ReconciliationLog, ReconciliationEntry } from "../types";
import { saveReconciliationLog, getReconciliationLogs, getReconciliationEntries, addReconciliationEntry } from "../indexedDB";
import { calculateSptrReserveSettlement } from "../ledgerEngine";
import RecoveryConfigPortal from "./RecoveryConfigPortal";
import { jsPDF } from "jspdf";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip,
  ComposedChart,
  Bar,
  Legend
} from "recharts";

interface BnaCustodyPortalProps {
  bnaState: BnaCustodyState;
  setBnaState: React.Dispatch<React.SetStateAction<BnaCustodyState>>;
  transactions: Transaction[];
  setTransactions?: React.Dispatch<React.SetStateAction<Transaction[]>>;
}

export default function BnaCustodyPortal({
  bnaState,
  setBnaState,
  transactions,
  setTransactions
}: BnaCustodyPortalProps) {
  
  // Tab Navigation: "painel_executivo" | "sandbox_bancos" | "reconciliacoes" | "fila_iso" | "config_recuperacao" | "logs_auditoria" | "interoperabilidade"
  const [selectedTab, setSelectedTab] = useState<"painel_executivo" | "sandbox_bancos" | "reconciliacoes" | "fila_iso" | "config_recuperacao" | "logs_auditoria" | "interoperabilidade">("painel_executivo");
  const [bnaFeedback, setBnaFeedback] = useState<string>("");
  const [reconciliationLogs, setReconciliationLogs] = useState<ReconciliationLog[]>([]);
  const [reconciliationEntries, setReconciliationEntries] = useState<ReconciliationEntry[]>([]);
  const [syncingAudit, setSyncingAudit] = useState<boolean>(false);
  const [mtlsStatus, setMtlsStatus] = useState<"ACTIVE" | "SYNCHRONIZING" | "OFFLINE">("ACTIVE");

  // State for BNA Audit Logs
  const [auditLogs, setAuditLogs] = useState<Array<{
    id: string;
    timestamp: string;
    category: "login" | "acesso" | "alteracao_sensivel";
    eventName: string;
    user: string;
    ipAddress: string;
    status: "sucesso" | "falha" | "alerta" | "sucesso_com_mfa";
    details: string;
  }>>(() => {
    const saved = localStorage.getItem("bna_audit_logs");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore parsing error
      }
    }
    return [
      {
        id: "AUD-2026-0625-001",
        timestamp: "2026-06-25T15:35:10Z",
        category: "alteracao_sensivel",
        eventName: "Ajuste de Limite de Alerta de Volume",
        user: "Dr. Manuel Silva (Auditor Chefe)",
        ipAddress: "192.168.1.102",
        status: "sucesso",
        details: "Limite de Volume Diário Crítico alterado para 2.450.000 Kz"
      },
      {
        id: "AUD-2026-0625-002",
        timestamp: "2026-06-25T14:12:05Z",
        category: "acesso",
        eventName: "Acesso às Configurações de Antifraude",
        user: "Dr. Manuel Silva (Auditor Chefe)",
        ipAddress: "192.168.1.102",
        status: "sucesso",
        details: "Consulta e verificação das regras ativas de geovelocidade síncrona"
      },
      {
        id: "AUD-2026-0625-003",
        timestamp: "2026-06-25T12:44:18Z",
        category: "login",
        eventName: "Tentativa de Login (Regulador)",
        user: "Dr. Manuel Silva (Auditor Chefe)",
        ipAddress: "192.168.1.102",
        status: "sucesso_com_mfa",
        details: "Sessão iniciada via token criptográfico físico (FIDO2) de segurança"
      },
      {
        id: "AUD-2026-0625-004",
        timestamp: "2026-06-25T12:43:55Z",
        category: "login",
        eventName: "Tentativa de Login (Regulador)",
        user: "Dr. Manuel Silva (Auditor Chefe)",
        ipAddress: "192.168.1.102",
        status: "falha",
        details: "Credenciais de segurança inválidas (PIN incorreto)"
      },
      {
        id: "AUD-2026-0625-005",
        timestamp: "2026-06-25T09:15:33Z",
        category: "alteracao_sensivel",
        eventName: "Alteração nas Configurações de Risco",
        user: "Sistema Síncrono BNA",
        ipAddress: "10.15.22.41",
        status: "sucesso",
        details: "Activação do Filtro de Prevenção de Fraude para transferências acima do Limiar de Alto Valor"
      },
      {
        id: "AUD-2026-0624-001",
        timestamp: "2026-06-24T18:22:11Z",
        category: "acesso",
        eventName: "Acesso a Reconciliações de Custódia",
        user: "Dra. Ana Costa (Auditora Auxiliar)",
        ipAddress: "192.168.1.105",
        status: "sucesso",
        details: "Visualização e conciliação do livro de caixa síncrono e contrapartidas do KwanzaMóvel"
      },
      {
        id: "AUD-2026-0624-002",
        timestamp: "2026-06-24T14:02:49Z",
        category: "alteracao_sensivel",
        eventName: "Alteração de Cobertura Mínima de Liquidez",
        user: "Dra. Ana Costa (Auditora Auxiliar)",
        ipAddress: "192.168.1.105",
        status: "sucesso",
        details: "Rácio mínimo aceitável de liquidez alterado de 100% para 95%"
      },
      {
        id: "AUD-2026-0624-003",
        timestamp: "2026-06-24T09:30:00Z",
        category: "login",
        eventName: "Tentativa de Login (Regulador)",
        user: "Dra. Ana Costa (Auditora Auxiliar)",
        ipAddress: "192.168.1.105",
        status: "sucesso",
        details: "Autenticação via VPN segura corporativa BNA com sucesso"
      }
    ];
  });

  // Persist audit logs to localStorage
  useEffect(() => {
    localStorage.setItem("bna_audit_logs", JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Logging helper
  const logAuditEvent = (
    category: "login" | "acesso" | "alteracao_sensivel",
    eventName: string,
    details: string,
    status: "sucesso" | "falha" | "alerta" | "sucesso_com_mfa" = "sucesso",
    overrideOperator?: string
  ) => {
    const nextIdNum = auditLogs.length + 1;
    const newLog = {
      id: `AUD-${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}${new Date().getDate().toString().padStart(2, '0')}-${nextIdNum.toString().padStart(3, '0')}`,
      timestamp: new Date().toISOString(),
      category,
      eventName,
      user: overrideOperator || "Dr. Manuel Silva (Auditor Chefe)",
      ipAddress: "192.168.1.102",
      status,
      details
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const handleTabChange = (tab: "painel_executivo" | "sandbox_bancos" | "reconciliacoes" | "fila_iso" | "config_recuperacao" | "logs_auditoria" | "interoperabilidade") => {
    setSelectedTab(tab);
    let label = "";
    if (tab === "painel_executivo") label = "Acesso ao Painel Executivo Principal";
    else if (tab === "sandbox_bancos") label = "Acesso à Sandbox de Bancos Parceiros";
    else if (tab === "reconciliacoes") label = "Acesso à Área de Reconciliações de Custódia";
    else if (tab === "fila_iso") label = "Acesso à Fila de Mensagens ISO 20022";
    else if (tab === "config_recuperacao") label = "Acesso à Configuração de Recuperação de Contas";
    else if (tab === "logs_auditoria") label = "Acesso aos Logs de Auditoria de Segurança e Logins";
    else if (tab === "interoperabilidade") label = "Acesso ao Hub de APIs e Interoperabilidade Total";

    logAuditEvent("acesso", "Navegação de Portal BNA", label, "sucesso");
  };

  const handleTimeRangeChange = (range: "24h" | "7d" | "30d") => {
    setCirculationTimeRange(range);
    const label = range === "24h" ? "24 horas" : range === "7d" ? "7 dias" : "30 dias";
    logAuditEvent("alteracao_sensivel", "Alteração de Intervalo do Gráfico", `Intervalo de cálculo da circulação total alterado para ${label}`, "sucesso");
  };

  const updateRiskParam = (key: keyof BnaCustodyState, val: any, label: string, formattedVal: string) => {
    setBnaState(prev => ({ ...prev, [key]: val }));
    logAuditEvent("alteracao_sensivel", "Modificação de Parâmetro de Risco", `Parâmetro '${label}' alterado para ${formattedVal}`, "sucesso");
  };

  const handleExportAuditLogsJson = () => {
    try {
      const dataStr = JSON.stringify(auditLogs, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `bna_audit_logs_${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      logAuditEvent("acesso", "Exportação de Logs de Auditoria", "Ficheiro JSON de auditoria de acessos exportado com sucesso", "sucesso");
      setBnaFeedback("Sucesso: Logs de auditoria exportados com sucesso em formato JSON.");
      setTimeout(() => setBnaFeedback(""), 3500);
    } catch (error) {
      setBnaFeedback("Erro: Falha ao exportar logs de auditoria em JSON.");
      setTimeout(() => setBnaFeedback(""), 3500);
    }
  };

  const [selectedCurrency, setSelectedCurrency] = useState<"AOA" | "USD" | "EUR">("AOA");
  const [circulationTimeRange, setCirculationTimeRange] = useState<"24h" | "7d" | "30d">("7d");

  // Interoperabilidade total & API Sandbox states
  const [selectedApiCategory, setSelectedApiCategory] = useState<"bancos" | "telecoms" | "agentes" | "comerciantes" | "servicos_publicos" | "ecommerce">("bancos");
  const [selectedEndpointIndex, setSelectedEndpointIndex] = useState<number>(0);
  const [apiKeys, setApiKeys] = useState([
    { id: "key_01", owner: "Banco BAI", role: "Banco Comercial", key: "km_pk_live_bai_72901a88", secret: "km_sec_4f9a0c201889ab8d1", status: "Active", created: "2026-03-10" },
    { id: "key_02", owner: "Unitel Money", role: "Operadora Móvel", key: "km_pk_live_unitel_930129bc", secret: "km_sec_519db8c02888cf32d", status: "Active", created: "2026-04-12" },
    { id: "key_03", owner: "ENDE Distribuidora", role: "Serviço Público", key: "km_pk_live_ende_091a382c", secret: "km_sec_109ab3821019df382", status: "Active", created: "2026-05-01" },
    { id: "key_04", owner: "Alimenta Angola", role: "Comerciante", key: "km_pk_live_alimenta_38ac91", secret: "km_sec_382ca8173efca1828", status: "Active", created: "2026-05-15" }
  ]);
  const [newKeyOwner, setNewKeyOwner] = useState("");
  const [newKeyRole, setNewKeyRole] = useState("Banco Comercial");

  // API Playground Parameters
  const [phoneParam, setPhoneParam] = useState("+244923000111");
  const [amountParam, setAmountParam] = useState(15000);
  const [receiverParam, setReceiverParam] = useState("933999888");
  const [utilityBillParam, setUtilityBillParam] = useState("FAC-2026-8812");
  const [merchantParam, setMerchantParam] = useState("LOJA_ANGOLA_SHOP");
  const [agentCodeParam, setAgentCodeParam] = useState("KM-4831");
  const [authHeaderSim, setAuthHeaderSim] = useState("km_pk_live_bai_72901a88");

  // API simulation logs and output
  const [apiRunning, setApiRunning] = useState(false);
  const [apiRunLogs, setApiRunLogs] = useState<string[]>([]);
  const [apiRunResponse, setApiRunResponse] = useState<any>(null);

  // Webhook states
  const [webhookUrl, setWebhookUrl] = useState("https://api.bancobai.ao/v1/webhooks/kwanza");
  const [webhookRunning, setWebhookRunning] = useState(false);
  const [webhookResult, setWebhookResult] = useState<string>("");

  // Search & Category states for audit logs filter
  const [auditSearchQuery, setAuditSearchQuery] = useState<string>("");
  const [auditCategoryFilter, setAuditCategoryFilter] = useState<"todos" | "login" | "acesso" | "alteracao_sensivel">("todos");

  const exchangeRates = {
    AOA: { rate: 1, symbol: "Kz", code: "AOA", name: "Kwanza Angolano" },
    USD: { rate: 1 / 825, symbol: "$", code: "USD", name: "Dólar Americano" },
    EUR: { rate: 1 / 895, symbol: "€", code: "EUR", name: "Euro" }
  };

  const formatValue = (amountInKwanza: number) => {
    const currency = exchangeRates[selectedCurrency];
    const converted = amountInKwanza * currency.rate;
    if (selectedCurrency === "AOA") {
      return `${converted.toLocaleString("pt-PT")} ${currency.symbol}`;
    } else {
      return `${currency.symbol}${converted.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency.code}`;
    }
  };

  // Dynamic values based on transactions
  const activeUserCount = 1250 + transactions.length;
  // Calculate total session volume transacted
  const sessionTransactVolume = transactions.reduce((acc, curr) => acc + curr.amount, 0);
  const dailyTotalTransactVol = 2350000 + sessionTransactVolume;

  // Track fraud blocked
  const [fraudsBlocked, setFraudsBlocked] = useState<number>(14);

  // Compliance Scorecard system metrics
  const baseTotalTxCount = 4820;
  const totalTxCount = baseTotalTxCount + transactions.length;
  const liveSuspicious = transactions.filter(tx => 
    tx.status === "blocked_aml" || 
    (tx.fraudScore && tx.fraudScore >= 0.5) ||
    tx.securityLog?.some(log => 
      log.toLowerCase().includes("risk") || 
      log.toLowerCase().includes("suspeit") || 
      log.toLowerCase().includes("fraude") || 
      log.toLowerCase().includes("blocked")
    )
  );
  const totalSuspiciousCount = fraudsBlocked + liveSuspicious.length;
  const complianceRate = Math.max(0, Math.min(100, parseFloat((((totalTxCount - totalSuspiciousCount) / totalTxCount) * 105 / 105).toFixed(2)))); // Calculate accurately
  const calculatedRate = Math.max(0, Math.min(100, parseFloat((((totalTxCount - totalSuspiciousCount) / totalTxCount) * 100).toFixed(2))));

  // Live Liquidity Ratio calculations (Saldo total dos utilizadores vs Reservas em custódia/banco central)
  const userTotalCirculation = bnaState.totalCirculation;
  const centralBankReserves = bnaState.bnaCustodyBalance;
  const rawLiquidityRatio = userTotalCirculation > 0 
    ? (centralBankReserves / userTotalCirculation) * 100 
    : 100;
  const liquidityRatio = parseFloat(Math.max(0, Math.min(1000, rawLiquidityRatio)).toFixed(2));
  
  const totalCustodyBacking = bnaState.bnaCustodyBalance + bnaState.bfaReserveBalance + bnaState.baiReserveBalance + bnaState.bicReserveBalance;
  const rawGlobalLiquidityRatio = userTotalCirculation > 0
    ? (totalCustodyBacking / userTotalCirculation) * 100
    : 100;
  const globalLiquidityRatio = parseFloat(Math.max(0, Math.min(1000, rawGlobalLiquidityRatio)).toFixed(2));

  // NOTIFICATION & EXTREME RISK ALERTS (DEFINED IN BNA STATE)
  const volumeCriticalThreshold = bnaState.criticalVolumeThreshold || 2450000;
  const pendingCriticalLimit = bnaState.criticalPendingLimit || 4;
  const circulationCriticalThreshold = bnaState.criticalCirculationThreshold || 50000;
  const liquidityCriticalThreshold = bnaState.criticalLiquidityThreshold !== undefined ? bnaState.criticalLiquidityThreshold : 100;
  const largeTxThreshold = bnaState.largeTxThreshold || 5000;
  const largeTransactions = transactions.filter(tx => tx.amount >= largeTxThreshold);
  const hasLargeTxAlert = largeTransactions.length > 0;

  const isVolumeCritical = dailyTotalTransactVol >= volumeCriticalThreshold;
  const isPendingCritical = bnaState.pendingSettlementsCount >= pendingCriticalLimit;
  const isCirculationCritical = bnaState.totalCirculation >= circulationCriticalThreshold;
  const isLiquidityCritical = liquidityRatio < liquidityCriticalThreshold;

  // Let's keep track of dismissed notifications if the user wants to clear them temporarily
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  // Automatically refresh dismissed list when values drop below threshold
  useEffect(() => {
    if (!isVolumeCritical) {
      setDismissedAlerts(prev => prev.filter(x => x !== "volume"));
    }
  }, [isVolumeCritical]);

  useEffect(() => {
    if (!isPendingCritical) {
      setDismissedAlerts(prev => prev.filter(x => x !== "pending"));
    }
  }, [isPendingCritical]);

  useEffect(() => {
    if (!isCirculationCritical) {
      setDismissedAlerts(prev => prev.filter(x => x !== "circulation"));
    }
  }, [isCirculationCritical]);

  useEffect(() => {
    if (!isLiquidityCritical) {
      setDismissedAlerts(prev => prev.filter(x => x !== "liquidity"));
    }
  }, [isLiquidityCritical]);

  // ==========================================
  // FRAUD DETECTION REGULATION ENGINE (BNA-2026)
  // ==========================================
  const fraudEnabled = bnaState.fraudEnabled !== undefined ? bnaState.fraudEnabled : true;
  const fraudGeoVelocityLimit = bnaState.fraudGeoVelocityLimit || 300;
  const fraudTxFrequencyLimit = bnaState.fraudTxFrequencyLimit || 3;
  const fraudTxTimeWindow = bnaState.fraudTxTimeWindow || 120;

  const angolanCities = [
    { name: "Luanda", lat: -8.8368, lng: 13.2343 },
    { name: "Benguela", lat: -12.5763, lng: 13.4055 },
    { name: "Huambo", lat: -12.7761, lng: 15.7392 },
    { name: "Lubango", lat: -14.9172, lng: 13.4925 },
    { name: "Cabinda", lat: -5.5560, lng: 12.2000 },
    { name: "Mbanza Kongo", lat: -6.2655, lng: 14.2485 },
    { name: "Saurimo", lat: -9.6608, lng: 20.3916 }
  ];

  const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getAnalyzedTransactions = () => {
    if (!transactions) return [];

    // Map each transaction deterministically to a city if not present
    const enrichedTxs = transactions.map((tx, idx) => {
      let city = angolanCities[idx % angolanCities.length];
      if (tx.locationName) {
        city = angolanCities.find(c => c.name === tx.locationName) || city;
      } else {
        const charCodeSum = tx.id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
        city = angolanCities[charCodeSum % angolanCities.length];
      }

      return {
        ...tx,
        locationName: tx.locationName || city.name,
        latitude: tx.latitude || city.lat,
        longitude: tx.longitude || city.lng
      };
    });

    // Chronological order for sequence analysis
    const chronologicalTxs = [...enrichedTxs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const userLastTxMap = new Map<string, typeof enrichedTxs[0]>();
    const userTxTimesMap = new Map<string, number[]>();

    const analyzed = chronologicalTxs.map(tx => {
      let isFraud = false;
      const reasons: string[] = [];
      let calculatedSpeed: number | null = null;
      let calculatedTimeDiffMins: number | null = null;
      let calculatedDistanceKm: number | null = null;
      let txsInWindow = 1;

      if (fraudEnabled) {
        // 1. Geolocational velocity check
        const lastTx = userLastTxMap.get(tx.senderPhone);
        if (lastTx && lastTx.latitude !== undefined && lastTx.longitude !== undefined && tx.latitude !== undefined && tx.longitude !== undefined) {
          const distance = getDistanceKm(lastTx.latitude, lastTx.longitude, tx.latitude, tx.longitude);
          const timeDiffMs = new Date(tx.timestamp).getTime() - new Date(lastTx.timestamp).getTime();
          
          if (timeDiffMs > 0 && distance > 0.1) {
            const timeDiffHours = timeDiffMs / (3600 * 1000);
            const speed = distance / timeDiffHours;
            calculatedSpeed = speed;
            calculatedTimeDiffMins = timeDiffMs / (60 * 1000);
            calculatedDistanceKm = distance;

            if (speed > fraudGeoVelocityLimit) {
              isFraud = true;
              reasons.push(`Velocidade impossível de viagem: ${Math.round(speed)} km/h entre ${lastTx.locationName} e ${tx.locationName} (${Math.round(distance)} km em ${calculatedTimeDiffMins.toFixed(1)} min) > limite de ${fraudGeoVelocityLimit} km/h.`);
            }
          }
        }

        // 2. Transaction frequency check
        const txTimes = userTxTimesMap.get(tx.senderPhone) || [];
        const currentTxTime = new Date(tx.timestamp).getTime();
        
        const cutoff = currentTxTime - (fraudTxTimeWindow * 1000);
        const validTimesInWindow = txTimes.filter(t => t >= cutoff);
        validTimesInWindow.push(currentTxTime);
        txsInWindow = validTimesInWindow.length;
        
        userTxTimesMap.set(tx.senderPhone, validTimesInWindow);

        if (txsInWindow > fraudTxFrequencyLimit) {
          isFraud = true;
          reasons.push(`Frequência de transação suspeita: ${txsInWindow} transações efetuadas na janela de ${fraudTxTimeWindow}s (limite de ${fraudTxFrequencyLimit}).`);
        }
      }

      // Update state for next loops
      userLastTxMap.set(tx.senderPhone, tx);

      return {
        ...tx,
        isFraudAlert: isFraud,
        fraudAlertReason: reasons.join(" | "),
        calculatedSpeed,
        calculatedTimeDiffMins,
        calculatedDistanceKm,
        txsInWindow
      };
    });

    // Return newest first
    return analyzed.reverse();
  };

  const analyzedTransactionsList = getAnalyzedTransactions();
  const activeFraudAlerts = analyzedTransactionsList.filter(tx => tx.isFraudAlert);

  const [filterRiskOnly, setFilterRiskOnly] = useState<boolean>(false);
  const filteredTransactionsList = filterRiskOnly
    ? analyzedTransactionsList.filter(tx => (tx.fraudScore !== undefined && tx.fraudScore > 0.05) || tx.isFraudAlert)
    : analyzedTransactionsList;

  const simulateImpossibleTravel = () => {
    if (!setTransactions) {
      setBnaFeedback("Erro: Canal de sincronização do ledger indisponível.");
      setTimeout(() => setBnaFeedback(""), 3000);
      return;
    }

    const testPhone = `+24494${Math.floor(100000 + Math.random() * 900000)}`;
    const now = Date.now();
    
    // First transaction in Luanda
    const tx1: Transaction = {
      id: `TX-GEO-SIM-1-${Math.floor(100 + Math.random() * 900)}`,
      senderPhone: testPhone,
      receiverPhone: "+244923000111",
      amount: 4500,
      type: "pagamento",
      status: "completed",
      timestamp: new Date(now - 10000).toISOString(),
      latencyMs: 120,
      fraudScore: 0.1,
      securityLog: ["Simulação BNA: Localização Inicial"],
      locationName: "Luanda",
      latitude: -8.8368,
      longitude: 13.2343
    };

    // Second transaction in Lubango (680 km away!) 2 seconds later
    const tx2: Transaction = {
      id: `TX-GEO-SIM-2-${Math.floor(100 + Math.random() * 900)}`,
      senderPhone: testPhone,
      receiverPhone: "+244933222333",
      amount: 12000,
      type: "pagamento",
      status: "completed",
      timestamp: new Date(now - 8000).toISOString(),
      latencyMs: 145,
      fraudScore: 0.95,
      securityLog: ["Simulação BNA: Salto Geográfico Crítico"],
      locationName: "Lubango",
      latitude: -14.9172,
      longitude: 13.4925
    };

    setTransactions(prev => [tx2, tx1, ...prev]);
    setBnaFeedback("Simulação de salto geográfico criada! Transações adicionadas ao ledger.");
    setTimeout(() => setBnaFeedback(""), 3500);
  };

  const simulateHighFrequencyBurst = () => {
    if (!setTransactions) {
      setBnaFeedback("Erro: Canal de sincronização do ledger indisponível.");
      setTimeout(() => setBnaFeedback(""), 3000);
      return;
    }

    const testPhone = `+24495${Math.floor(100000 + Math.random() * 900000)}`;
    const now = Date.now();
    const newTxs: Transaction[] = [];

    for (let i = 0; i < 4; i++) {
      newTxs.push({
        id: `TX-FREQ-SIM-${i + 1}-${Math.floor(100 + Math.random() * 900)}`,
        senderPhone: testPhone,
        receiverPhone: `+244921000${i + 1}00`,
        amount: 2500 + i * 500,
        type: "pagamento",
        status: "completed",
        timestamp: new Date(now - (i * 1000)).toISOString(), // 1s apart
        latencyMs: 90,
        fraudScore: 0.8,
        securityLog: ["Simulação BNA: Rajada rápida de transacções"],
        locationName: "Benguela",
        latitude: -12.5763,
        longitude: 13.4055
      });
    }

    setTransactions(prev => [...newTxs, ...prev]);
    setBnaFeedback("Simulação de alta frequência criada! 4 transações em rajada adicionadas.");
    setTimeout(() => setBnaFeedback(""), 3500);
  };

  // Simulated PDF Report states & helper functions
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);
  const [reportAuditor, setReportAuditor] = useState<string>("Dr. Manuel Silva (Auditor Chefe)");
  const [customReportObs, setCustomReportObs] = useState<string>("As compensações bilaterais offline do KwanzaMóvel encontram-se plenamente alinhadas com as directivas de Sandbox Regulamentar do BNA, sem inconformidades.");

  // Estados da Sandbox Regulatório e Testes de Stress (Apoio ao Alinhamento de Conformidade)
  const [sandboxDirectives, setSandboxDirectives] = useState({
    dir04KycLimit: true,
    dir09SptrSla: true,
    dir02BiometricAuth: true,
    dir14LiquidityRatio: true,
  });
  const [stressScenario, setStressScenario] = useState<"normal" | "reserve_drift" | "liquidity_drain" | "suspicious_activity">("normal");
  const [complianceRunning, setComplianceRunning] = useState<boolean>(false);
  const [complianceLogs, setComplianceLogs] = useState<string[]>([]);
  const [complianceResults, setComplianceResults] = useState<{
    score: number;
    passedRules: string[];
    failedRules: string[];
    certificateHash: string;
    auditedAt: string;
  } | null>(null);

  const getLast7DaysData = () => {
    const data = [];
    // Static base values for previous days + today dynamic
    const baseVolumes = [2390000, 2540500, 2310000, 2485000, 2380000, 2420000, dailyTotalTransactVol];
    const amlStatuses = ["CONFORME", "ALERTA BAIXO", "CONFORME", "ALERTA MÉDIO", "CONFORME", "CONFORME", "CONFORME"];
    
    // Generate dates based on local system date
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      
      const day = d.getDate().toString().padStart(2, '0');
      const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      const monthStr = months[d.getMonth()];
      const year = d.getFullYear();
      const dateStr = `${day} ${monthStr} ${year}`;
      
      const idx = 6 - i;
      data.push({
        dateStr,
        volume: baseVolumes[idx],
        status: idx === 6 ? (isVolumeCritical ? "ALERTA CRÍTICO" : "CONFORME") : amlStatuses[idx],
        countTx: idx === 6 ? transactions.length + 540 : 640 + Math.floor(idx * 15 + Math.sin(idx) * 22)
      });
    }
    return data;
  };

  const getCirculationEvolutionData = () => {
    const data = [];
    const currentCirc = bnaState.totalCirculation;

    if (circulationTimeRange === "24h") {
      const numPoints = 12; // Every 2 hours
      for (let i = numPoints - 1; i >= 0; i--) {
        const d = new Date();
        d.setHours(d.getHours() - i * 2);
        const hourStr = d.getHours().toString().padStart(2, '0') + ":00";
        
        const progress = (numPoints - 1 - i) / (numPoints - 1);
        const factor = 0.92 + progress * 0.08 + Math.sin(i * 1.2) * 0.005;
        const circ = i === 0 ? currentCirc : Math.round(currentCirc * Math.min(1.0, factor));
        
        data.push({
          dateStr: hourStr,
          circulacao: circ,
          reserva: Math.round(circ * 1.15)
        });
      }
    } else if (circulationTimeRange === "30d") {
      const numPoints = 30; // 30 days
      for (let i = numPoints - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const day = d.getDate().toString().padStart(2, '0');
        const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        const monthStr = months[d.getMonth()];
        const dateStr = `${day} ${monthStr}`;
        
        const progress = (numPoints - 1 - i) / (numPoints - 1);
        const factor = 0.62 + progress * 0.38 + Math.sin(i * 0.8) * 0.025;
        const circ = i === 0 ? currentCirc : Math.round(currentCirc * Math.min(1.0, factor));
        
        data.push({
          dateStr,
          circulacao: circ,
          reserva: Math.round(circ * 1.15)
        });
      }
    } else {
      // "7d" Default
      const numPoints = 7;
      for (let i = numPoints - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const day = d.getDate().toString().padStart(2, '0');
        const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        const monthStr = months[d.getMonth()];
        const dateStr = `${day} ${monthStr}`;
        
        const progress = (numPoints - 1 - i) / (numPoints - 1);
        const factor = 0.72 + progress * 0.28 + Math.sin(i * 1.5) * 0.02;
        const circ = i === 0 ? currentCirc : Math.round(currentCirc * Math.min(1.0, factor));
        
        data.push({
          dateStr,
          circulacao: circ,
          reserva: Math.round(circ * 1.15)
        });
      }
    }
    return data;
  };

  const getCirculationAndSettlementHistory = () => {
    const data = [];
    const currentCirc = bnaState.totalCirculation;
    // Base volumes matching getLast7DaysData
    const baseVolumes = [2390000, 2540500, 2310000, 2485000, 2380000, 2420000, dailyTotalTransactVol];
    
    const numPoints = 7;
    for (let i = numPoints - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const day = d.getDate().toString().padStart(2, '0');
      const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      const monthStr = months[d.getMonth()];
      const dateStr = `${day} ${monthStr}`;
      
      const idx = numPoints - 1 - i;
      const progress = idx / (numPoints - 1);
      const factor = 0.72 + progress * 0.28 + Math.sin(idx * 1.5) * 0.02;
      const circ = idx === numPoints - 1 ? currentCirc : Math.round(currentCirc * Math.min(1.0, factor));
      
      data.push({
        dateStr,
        circulacao: circ, // total monetary circulation
        volumeLiquidacao: baseVolumes[idx] // interbank settlement volume
      });
    }
    return data;
  };

  const handlePrintNative = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      const tableRows = getLast7DaysData().map(d => `
        <tr>
          <td style="border:1px solid #e2e8f0; padding:10px; font-family:monospace; font-size:11px;">${d.dateStr}</td>
          <td style="border:1px solid #e2e8f0; padding:10px; font-family:monospace; font-size:11px;" align="right">${d.volume.toLocaleString("pt-PT")} Kz</td>
          <td style="border:1px solid #e2e8f0; padding:10px; font-family:monospace; font-size:11px;" align="center">${d.countTx}</td>
          <td style="border:1px solid #e2e8f0; padding:10px; font-family:monospace; font-size:11px; font-weight:bold; color:${d.status === "CONFORME" ? "#10b981" : d.status.includes("CRÍTICO") ? "#ef4444" : "#f59e0b"};" align="center">${d.status}</td>
        </tr>
      `).join("");

      printWindow.document.write(`
        <html>
          <head>
            <title>Relatórios de Conformidade Semanal - KwanzaMóvel</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; padding: 50px; color: #1e293b; background: #ffffff; line-height: 1.5; }
              .header { text-align: center; border-bottom: 2px solid #b87333; padding-bottom: 25px; margin-bottom: 35px; position: relative; }
              .header h1 { font-size: 24px; font-weight: 900; margin: 0 0 4px 0; letter-spacing: 2px; color: #0f172a; }
              .header h2 { font-size: 11px; font-weight: 700; margin: 0 0 15px 0; text-transform: uppercase; color: #475569; letter-spacing: 1px; }
              .header-info { display: flex; justify-content: space-between; font-size: 11px; font-family: monospace; color: #475569; border-top: 1px solid #f1f5f9; padding-top: 10px; }
              .meta-grid { display: grid; grid-template-cols: repeat(4, 1fr); gap: 20px; margin-bottom: 35px; }
              .meta-card { border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; background-color: #f8fafc; }
              .meta-card span { font-size: 9px; text-transform: uppercase; color: #64748b; font-weight: 800; tracking: 0.5px; }
              .meta-card strong { display: block; font-size: 18px; margin-top: 6px; color: #0f172a; font-family: monospace; }
              .section-title { font-size: 12px; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid #b87333; padding-bottom: 6px; margin-top: 40px; margin-bottom: 20px; color: #0f172a; letter-spacing: 0.5px; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 35px; }
              th { background: #f1f5f9; font-weight: 800; font-size: 10px; text-transform: uppercase; color: #475569; border: 1px solid #e2e8f0; padding: 10px; }
              .obs-box { font-style: italic; background: #fafaf9; border-left: 4px solid #b87333; padding: 20px; font-size: 12px; line-height: 1.6; color: #334155; border-radius: 4px; border-top: 1px solid #f1f5f9; border-right: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; }
              .signatures { display: flex; justify-content: space-between; margin-top: 65px; font-size: 11px; }
              .sig-box { text-align: center; width: 45%; }
              .sig-line { border-top: 1px solid #0f172a; margin-top: 45px; padding-top: 10px; font-weight: 700; color: #0f172a; }
              .sig-title { font-size: 10px; color: #64748b; margin-top: 2px; }
              @media print {
                body { padding: 25px; font-size: 12px; }
                .header { border-bottom-color: #000; }
                .section-title { border-bottom-color: #000; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>REPÚBLICA DE ANGOLA</h1>
              <h2>BANCO NACIONAL DE ANGOLA</h2>
              <div style="font-size: 13px; font-weight: 850; margin: 12px 0 2px 0; color: #b87333; text-transform: uppercase; letter-spacing: 1px;">Relatório Semanal de Conformidade do KwanzaMóvel</div>
              <div style="font-size: 9px; color: #64748b; margin-bottom: 5px; font-family: monospace;">Nº de Registo: BNA-KM-2026-${Math.floor(10000 + Math.random() * 90000)}</div>
              
              <div class="header-info">
                <div><strong>AUDITOR DE SERVIÇOS:</strong> ${reportAuditor}</div>
                <div><strong>DATA DE GERAÇÃO:</strong> ${new Date().toLocaleDateString("pt-PT")} | <strong>SISTEMA:</strong> mTLS BARRAMENTO</div>
              </div>
            </div>

            <div class="section-title">Consórcio de Risco e Parâmetros Operacionais</div>
            <div class="meta-grid">
              <div class="meta-card">
                <span>Rácio de Conformidade Semanal</span>
                <strong style="color: #10b981;">${calculatedRate}%</strong>
              </div>
              <div class="meta-card">
                <span>Transações Globais Auditadas</span>
                <strong>${totalTxCount.toLocaleString("pt-PT")}</strong>
              </div>
              <div class="meta-card">
                <span>Incidentes Flagged (AML)</span>
                <strong style="color: ${totalSuspiciousCount > 15 ? '#ef4444' : '#f59e0b'};">${totalSuspiciousCount}</strong>
              </div>
              <div class="meta-card">
                <span>Rácio Liquidez Central</span>
                <strong style="color: ${liquidityRatio >= 100 ? '#10b981' : '#f59e0b'};">${liquidityRatio}%</strong>
              </div>
            </div>

            <div class="section-title">Mapeamento Consolidado do Tráfego diário (Últimos 7 dias)</div>
            <table>
              <thead>
                <tr>
                  <th align="left">Período Fiscal</th>
                  <th align="right">Volume Total (AOA)</th>
                  <th align="center">Volume Transações</th>
                  <th align="center">Status Criptográfico</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>

            <div class="section-title">Despacho de Conformidade e Notas Executivas do Auditor</div>
            <div class="obs-box">
              "${customReportObs}"
            </div>

            <div class="signatures">
              <div class="sig-box">
                <div class="sig-line">Dr. Manuel Silva</div>
                <div class="sig-title">Departamento de Supervisão de Sistemas de Pagamento (DSP)</div>
              </div>
              <div class="sig-box">
                <div class="sig-line">Assinatura Certificada Criptograficamente</div>
                <div class="sig-title">Chave Privada mTLS - BNA Central</div>
              </div>
            </div>

            <script>
              window.onload = function() {
                window.print();
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      setBnaFeedback("Erro: Bloqueador de pop-ups detectado. Autorize pop-ups para imprimir o relatório.");
      setTimeout(() => setBnaFeedback(""), 3500);
    }
  };

  const handleExportCSV = () => {
    if (!transactions || transactions.length === 0) {
      setBnaFeedback("Atenção: Sem histórico de transacções para exportação.");
      setTimeout(() => setBnaFeedback(""), 3500);
      return;
    }

    // Set headers aligned with standard financial auditing
    const headers = [
      "ID da Transacao",
      "Remetente (Telemovel)",
      "Destinatario (Telemovel)",
      "Montante (AOA)",
      "Tipo de Operacao",
      "Estado da Transacao",
      "Selo Temporal (Timestamp)",
      "Latencia do Sistema (ms)",
      "Score de Risco de Fraude",
      "Registos de Seguranca Auditados"
    ];

    const rows = transactions.map(tx => [
      tx.id,
      tx.senderPhone,
      tx.receiverPhone,
      tx.amount,
      tx.type,
      tx.status,
      tx.timestamp,
      tx.latencyMs,
      tx.fraudScore,
      tx.securityLog ? tx.securityLog.join(" | ") : ""
    ]);

    // Build the CSV following standard RFC 4180 (handling wrapping, quotes and commas)
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(val => {
        const strVal = String(val).replace(/"/g, '""');
        return strVal.includes(",") || strVal.includes("\n") || strVal.includes('"') 
          ? `"${strVal}"` 
          : strVal;
      }).join(","))
    ].join("\n");

    try {
      // Export with Byte Order Mark for Excel and general text editors to read UTF-8 properly
      const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `bna_audit_history_${new Date().toISOString().replace(/[:.]/g, "-")}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setBnaFeedback("Sucesso: Relatório de Auditoria Regulatório exportado em formato CSV!");
      setTimeout(() => setBnaFeedback(""), 4000);
    } catch (err) {
      console.error("Erro ao exportar o relatório CSV:", err);
      setBnaFeedback("Erro: Falha técnica ao gerar arquivo de auditoria.");
      setTimeout(() => setBnaFeedback(""), 3500);
    }
  };

  const handleExportPDFReport = () => {
    try {
      const doc = new jsPDF();
      const margin = 14;
      let y = 20;

      // Decorative border & header bar
      doc.setFillColor(184, 115, 51); // #B87333 (Amber/Copper)
      doc.rect(0, 0, 210, 15, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text("BANCO NACIONAL DE ANGOLA - SISTEMA DE AUDITORIA DE LIQUIDEZ E CONFORMIDADE", margin, 10);

      y = 30;
      // Official Coat of Arms / Letterhead
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text("REPÚBLICA DE ANGOLA", 105, y, { align: "center" });

      y += 6;
      doc.setFontSize(16);
      doc.setTextColor(184, 115, 51); // Bna Amber
      doc.text("BANCO NACIONAL DE ANGOLA", 105, y, { align: "center" });

      y += 5;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text("DEPARTAMENTO DE SUPERVISÃO DO SISTEMA DE PAGAMENTO (DSP)", 105, y, { align: "center" });

      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text("Membro da Associação de Supervisores de Bancos Centrais Africanos", 105, y, { align: "center" });

      y += 6;
      doc.setDrawColor(184, 115, 51);
      doc.setLineWidth(1);
      doc.line(margin, y, 210 - margin, y);
      
      y += 1.5;
      doc.setDrawColor(100, 116, 139);
      doc.setLineWidth(0.3);
      doc.line(margin, y, 210 - margin, y);

      y += 10;
      // Document Details Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59); // Slate-800
      doc.text("RELATÓRIO OFICIAL DE AUDITORIA OPERACIONAL E SOLVÊNCIA", margin, y);

      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Identificação de Registo: BNA-KM-AUD-${Math.floor(100000 + Math.random() * 900000)} | mTLS Seguro`, margin, y);

      // Metadata block
      y += 10;
      doc.setFillColor(248, 250, 252); // slate-50
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.rect(margin, y, 210 - (margin * 2), 24, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      
      doc.text("Auditor Titular:", margin + 4, y + 6);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(15, 23, 42);
      doc.text(reportAuditor || "Inspector DSP BNA", margin + 35, y + 6);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(71, 85, 105);
      doc.text("Data de Emissão:", margin + 4, y + 12);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(15, 23, 42);
      doc.text(new Date().toLocaleString("pt-PT"), margin + 35, y + 12);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(71, 85, 105);
      doc.text("Canal de Rede:", margin + 4, y + 18);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(15, 23, 42);
      doc.text("KwanzaMóvel mTLS / Barramento Multilateral Central", margin + 35, y + 18);

      // Right side of metadata block
      doc.setFont("helvetica", "bold");
      doc.setTextColor(71, 85, 105);
      doc.text("Tipo de Documento:", 115, y + 6);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(15, 23, 42);
      doc.text("Relatório de Liquidação & Solvabilidade", 150, y + 6);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(71, 85, 105);
      doc.text("Status Geral:", 115, y + 12);
      doc.setFont("helvetica", "bold");
      if (liquidityRatio >= liquidityCriticalThreshold) {
        doc.setTextColor(16, 185, 129); // emerald-600
        doc.text("LIQUIDEZ CONFORME", 150, y + 12);
      } else {
        doc.setTextColor(225, 29, 72); // rose-600
        doc.text("ALERTA CRÍTICO", 150, y + 12);
      }

      doc.setFont("helvetica", "bold");
      doc.setTextColor(71, 85, 105);
      doc.text("Total Transações:", 115, y + 18);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(15, 23, 42);
      doc.text(`${transactions.length} Registadas (Live)`, 150, y + 18);

      y += 30;
      // State of Liquidity Section
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text("I. RÁCIOS DE LIQUIDEZ E COBERTURA DE RESERVAS", margin, y);

      y += 4;
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(margin, y, 210 - margin, y);

      y += 6;
      // Draw 3 metric boxes side-by-side
      const boxWidth = (210 - (margin * 2) - 10) / 3;

      // Box 1: Reserves
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, boxWidth, 18, "F");
      doc.setDrawColor(226, 232, 240);
      doc.rect(margin, y, boxWidth, 18, "D");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text("RESERVAS CENTRALIZADAS", margin + 4, y + 5);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`${centralBankReserves.toLocaleString("pt-PT")} Kz`, margin + 4, y + 12);

      // Box 2: Circulation
      doc.setFillColor(248, 250, 252);
      doc.rect(margin + boxWidth + 5, y, boxWidth, 18, "F");
      doc.rect(margin + boxWidth + 5, y, boxWidth, 18, "D");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text("CIRCULAÇÃO TOTAL ATIVA", margin + boxWidth + 9, y + 5);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`${userTotalCirculation.toLocaleString("pt-PT")} Kz`, margin + boxWidth + 9, y + 12);

      // Box 3: Liquidity Ratio
      doc.setFillColor(liquidityRatio >= liquidityCriticalThreshold ? 240 : 254, liquidityRatio >= liquidityCriticalThreshold ? 253 : 242, liquidityRatio >= liquidityCriticalThreshold ? 250 : 242); // emerald-50 or rose-50
      doc.rect(margin + (boxWidth * 2) + 10, y, boxWidth, 18, "F");
      doc.setDrawColor(liquidityRatio >= liquidityCriticalThreshold ? 167 : 251, liquidityRatio >= liquidityCriticalThreshold ? 243 : 207, liquidityRatio >= liquidityCriticalThreshold ? 208 : 214); // emerald-200 or rose-200
      doc.rect(margin + (boxWidth * 2) + 10, y, boxWidth, 18, "D");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(liquidityRatio >= liquidityCriticalThreshold ? 16 : 225, liquidityRatio >= liquidityCriticalThreshold ? 185 : 29, liquidityRatio >= liquidityCriticalThreshold ? 129 : 72);
      doc.text("RÁCIO DE LIQUIDEZ SÍNCRONO", margin + (boxWidth * 2) + 14, y + 5);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(`${liquidityRatio}%`, margin + (boxWidth * 2) + 14, y + 12);

      y += 24;
      // Transaction History Table
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text("II. HISTÓRICO RECENTE DE TRANSAÇÕES SÍNCRONAS", margin, y);

      y += 4;
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y, 210 - margin, y);

      y += 6;
      // Headers of transaction table
      doc.setFillColor(241, 245, 249); // slate-100
      doc.rect(margin, y, 210 - (margin * 2), 8, "F");
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text("ID TRANSAÇÃO", margin + 3, y + 5.5);
      doc.text("DATA/HORA", margin + 35, y + 5.5);
      doc.text("OPERAÇÃO/TIPO", margin + 70, y + 5.5);
      doc.text("REMETENTE/DESTINATÁRIO", margin + 105, y + 5.5);
      doc.text("VALOR (AOA)", margin + 155, y + 5.5);
      doc.text("ESTADO", margin + 185, y + 5.5);

      y += 8;

      if (transactions.length === 0) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(9);
        doc.setTextColor(148, 163, 184);
        doc.text("Nenhuma transação registada nas últimas sessões de compensação.", margin + 4, y + 8);
        y += 15;
      } else {
        transactions.forEach((tx) => {
          if (y > 250) {
            // Footer on current page
            doc.setFont("helvetica", "normal");
            doc.setFontSize(7);
            doc.setTextColor(148, 163, 184);
            doc.text("Página " + doc.getCurrentPageInfo().pageNumber, 105, 285, { align: "center" });

            doc.addPage();
            y = 25;

            // Redraw header elements on new page
            doc.setFillColor(184, 115, 51);
            doc.rect(0, 0, 210, 10, "F");
            doc.setFont("helvetica", "bold");
            doc.setFontSize(8);
            doc.setTextColor(255, 255, 255);
            doc.text("BANCO NACIONAL DE ANGOLA - RELATÓRIO DE AUDITORIA", margin, 6.5);

            // Redraw table headers on new page
            y += 5;
            doc.setFillColor(241, 245, 249);
            doc.rect(margin, y, 210 - (margin * 2), 8, "F");
            doc.setFont("helvetica", "bold");
            doc.setFontSize(7.5);
            doc.setTextColor(71, 85, 105);
            doc.text("ID TRANSAÇÃO", margin + 3, y + 5.5);
            doc.text("DATA/HORA", margin + 35, y + 5.5);
            doc.text("OPERAÇÃO/TIPO", margin + 70, y + 5.5);
            doc.text("REMETENTE/DESTINATÁRIO", margin + 105, y + 5.5);
            doc.text("VALOR (AOA)", margin + 155, y + 5.5);
            doc.text("ESTADO", margin + 185, y + 5.5);

            y += 8;
          }

          // Row background or line
          doc.setDrawColor(241, 245, 249);
          doc.setLineWidth(0.3);
          doc.line(margin, y + 6, 210 - margin, y + 6);

          doc.setFont("courier", "bold");
          doc.setFontSize(7.5);
          doc.setTextColor(30, 41, 59);
          doc.text(tx.id, margin + 3, y + 4.5);

          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.5);
          doc.setTextColor(71, 85, 105);
          const dateStr = new Date(tx.timestamp).toLocaleString("pt-PT");
          doc.text(dateStr, margin + 35, y + 4.5);

          doc.text(tx.type === "recebimento" ? "Depósito (Cash-In)" : "Levantamento (Cash-Out)", margin + 70, y + 4.5);
          doc.text(`${tx.senderPhone} -> ${tx.receiverPhone}`, margin + 105, y + 4.5);

          doc.setFont("helvetica", "bold");
          doc.setTextColor(30, 41, 59);
          doc.text(`${tx.amount.toLocaleString("pt-PT")} Kz`, margin + 155, y + 4.5);

          doc.setFont("helvetica", "bold");
          if (tx.status === "completed") {
            doc.setTextColor(16, 185, 129); // emerald
            doc.text("SUCESSO", margin + 185, y + 4.5);
          } else if (tx.status.includes("fail") || tx.status.includes("block")) {
            doc.setTextColor(225, 29, 72); // rose
            doc.text("BLOQUEADA", margin + 185, y + 4.5);
          } else {
            doc.setTextColor(245, 158, 11); // amber
            doc.text("PENDENTE", margin + 185, y + 4.5);
          }

          y += 7.5;
        });
      }

      // Auditor Notes section (on same or new page)
      if (y > 210) {
        // Add footer on current page
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text("Página " + doc.getCurrentPageInfo().pageNumber, 105, 285, { align: "center" });

        doc.addPage();
        y = 25;
      }

      y += 10;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text("III. DESPACHO DE CONFORMIDADE DO AUDITOR", margin, y);

      y += 4;
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y, 210 - margin, y);

      y += 6;
      doc.setFillColor(254, 251, 240); // amber-50
      doc.rect(margin, y, 210 - (margin * 2), 20, "F");
      doc.setDrawColor(251, 191, 36); // amber-400
      doc.setLineWidth(0.5);
      doc.line(margin, y, margin, y + 20); // Amber vertical bar on the left

      doc.setFont("helvetica", "italic");
      doc.setFontSize(8.5);
      doc.setTextColor(120, 113, 108); // stone-500
      const obsText = customReportObs || "Não existem observações excecionais para este período de compensação. O sistema opera de acordo com as normas macroprudenciais estabelecidas.";
      const splitObs = doc.splitTextToSize(obsText, 210 - (margin * 2) - 8);
      doc.text(splitObs, margin + 4, y + 6);

      y += 28;
      // Signature area
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text("ASSINATURAS E VALIDAÇÃO DE CRIPTOGRAFIA DE ESTADO", margin, y);

      y += 4;
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y, 210 - margin, y);

      y += 12;
      // Two columns signatures
      doc.setDrawColor(100, 116, 139);
      doc.setLineWidth(0.5);
      doc.line(margin + 5, y, margin + 80, y);
      doc.line(120, y, 195, y);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(reportAuditor || "Inspector de Supervisão DSP", margin + 42.5, y + 5, { align: "center" });
      doc.text("BANCO CENTRAL DE ANGOLA", 157.5, y + 5, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text("Inspector de Auditoria DSP", margin + 42.5, y + 9, { align: "center" });
      doc.text("Validação Criptográfica via mTLS m-AOA", 157.5, y + 9, { align: "center" });

      // Add page numbers on the final page
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text("Página " + doc.getCurrentPageInfo().pageNumber, 105, 285, { align: "center" });

      // Save document
      doc.save(`relatorio_auditoria_bna_${new Date().toISOString().split("T")[0]}.pdf`);
      
      setBnaFeedback("Sucesso: Relatório PDF Oficial descarregado com sucesso!");
      setTimeout(() => setBnaFeedback(""), 4000);
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      setBnaFeedback("Erro: Falha na compilação do relatório oficial PDF.");
      setTimeout(() => setBnaFeedback(""), 3500);
    }
  };

  // Load from IndexedDB
  const loadReconciliationLogs = async () => {
    try {
      let logs = await getReconciliationLogs();
      if (logs.length === 0) {
        const seedLog: ReconciliationLog = {
          id: "KMV-REC-Initial-01",
          timestamp: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
          cycleId: "KMV-REC-2026-001",
          totalInstructionsBalance: bnaState.totalCirculation,
          bnaCustodyBalance: bnaState.bnaCustodyBalance,
          bfaReserveBalance: bnaState.bfaReserveBalance,
          baiReserveBalance: bnaState.baiReserveBalance,
          bicReserveBalance: bnaState.bicReserveBalance,
          totalCustodyReserves: bnaState.bnaCustodyBalance + bnaState.bfaReserveBalance + bnaState.baiReserveBalance + bnaState.bicReserveBalance,
          discrepancy: 0,
          status: "reconciled",
          complianceStatement: "Certificação Integral BNA Diretiva 06/2021-BNA: O KwanzaMóvel não capta depósitos fiduciários do público. Os fundos encontram-se custodiados fideicomissariamente em entidades de compensação licenciadas.",
          auditedBy: "SGA BNA (Auditor Síncrone Automatizado)",
          remarks: "Auditoria inicial concluída. Balanços reconciliados com sucesso absoluto. Discrepância nula. Instruções sintonizadas."
        };
        await saveReconciliationLog(seedLog);
        logs = [seedLog];
      }
      setReconciliationLogs(logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));

      // Load entries
      let entries = await getReconciliationEntries();
      if (entries.length === 0) {
        const seedEntry: ReconciliationEntry = {
          id: "RE-SEED-01",
          txId: "TX-PAY-PREINITIAL-01",
          txHash: "SHA256-BNA-8F43D1A5C4BD990D3FF4",
          settlementStatus: "reconciliado_bna",
          timestamp: new Date(Date.now() - 3600 * 1000 * 2.5).toISOString(),
          debitAccount: "Wallet Manuel da Silva (Ativo)",
          creditAccount: "Crédito Compensado BNA (Custódia)",
          amount: 12500,
          ledgerRootHash: "MERKLE-BNA-2E3D4F5A112C3D9A"
        };
        await addReconciliationEntry(seedEntry);
        entries = [seedEntry];
      }
      setReconciliationEntries(entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    } catch (e) {
      console.warn("Error loading reconciliations:", e);
    }
  };

  useEffect(() => {
    loadReconciliationLogs();
  }, [bnaState.totalCirculation, bnaState.bnaCustodyBalance, transactions]);

  // Execute manual reconciliation
  const handleManualReconciliation = async () => {
    setSyncingAudit(true);
    setMtlsStatus("SYNCHRONIZING");
    setBnaFeedback("A estabelecer túnel mTLS e a auditar saldos das carteiras em IndexedDB...");

    setTimeout(() => {
      setBnaFeedback("A inspecionar e recalcular livros de partidas dobradas nos custódios (BFA, BAI, BIC, BNA)...");

      setTimeout(async () => {
        try {
          const totalWalletMoney = bnaState.totalCirculation;
          const totalReserves = bnaState.bnaCustodyBalance + bnaState.bfaReserveBalance + bnaState.baiReserveBalance + bnaState.bicReserveBalance;
          const discrepancy = totalReserves - totalWalletMoney;

          const newLog: ReconciliationLog = {
            id: `REC-${Math.floor(100000 + Math.random() * 900000)}`,
            timestamp: new Date().toISOString(),
            cycleId: `KMV-REC-2026-${Math.floor(100 + Math.random() * 900)}`,
            totalInstructionsBalance: totalWalletMoney,
            bnaCustodyBalance: bnaState.bnaCustodyBalance,
            bfaReserveBalance: bnaState.bfaReserveBalance,
            baiReserveBalance: bnaState.baiReserveBalance,
            bicReserveBalance: bnaState.bicReserveBalance,
            totalCustodyReserves: totalReserves,
            discrepancy: discrepancy >= 0 ? 0 : discrepancy,
            status: discrepancy >= 0 ? "reconciled" : "discrepancy_alert",
            complianceStatement: "Certificação de Salvaguarda BNA (Instruções Apenas): KwanzaMóvel é um serviço técnico de facilitação de pagamentos que opera sob as frentes reguladoras angolanas. Não assume posse ou retenção de liquidez de utilizadores finais.",
            auditedBy: "SGA BNA (Auditor Síncrone Automatizado)",
            remarks: `Sincronização realizada com sucesso. Total emitido instruído: ${totalWalletMoney.toLocaleString("pt-PT")} Kz. Total colateralizado em bancos de custódia: ${totalReserves.toLocaleString("pt-PT")} Kz.`
          };

          await saveReconciliationLog(newLog);
          await loadReconciliationLogs();
          setMtlsStatus("ACTIVE");
          setBnaFeedback("Relação de custódia garantidamente certificada. Zero discrepância fiduciária.");
        } catch (err) {
          console.error("IDB error:", err);
          setBnaFeedback("Erro na persistência local do log.");
          setMtlsStatus("ACTIVE");
        } finally {
          setSyncingAudit(false);
          setTimeout(() => setBnaFeedback(""), 3500);
        }
      }, 1000);
    }, 800);
  };

  // Perform interbank clearing sptr call
  const triggerSptrSettlement = () => {
    setBnaState(prev => ({ ...prev, isSettling: true }));
    setMtlsStatus("SYNCHRONIZING");
    setBnaFeedback("A estabelecer compensação multilateral via SPTR (Banco Nacional de Angola)...");

    setTimeout(() => {
      setBnaFeedback("Compensando débitos acumulados e redistribuindo liquidez de tutela...");
      
      setTimeout(() => {
        const pendingAmount = bnaState.pendingSettlementsCount * 12500;
        
        setBnaState(prev => ({
          ...prev,
          ...calculateSptrReserveSettlement(prev, pendingAmount)
        }));

        setMtlsStatus("ACTIVE");
        setBnaFeedback("Lote liquidado e compensado síncronamente pela Câmara de Liquidação do BNA.");
        setTimeout(() => setBnaFeedback(""), 3500);
      }, 1200);
    }, 1000);
  };

  // Simulate injecting funds in Sandbox Banks
  const handleInjectSandboxLiquidity = (bank: "BFA" | "BAI" | "BIC", amt: number) => {
    setBnaState(prev => {
      if (bank === "BFA") return { ...prev, bfaReserveBalance: prev.bfaReserveBalance + amt };
      if (bank === "BAI") return { ...prev, baiReserveBalance: prev.baiReserveBalance + amt };
      return { ...prev, bicReserveBalance: prev.bicReserveBalance + amt };
    });
    setBnaFeedback(`Injetada liquidez de garantia de ${amt.toLocaleString("pt-PT")} Kz no ${bank}!`);
    setTimeout(() => setBnaFeedback(""), 2000);
  };

  const handleSelectStressScenario = (scenario: "normal" | "reserve_drift" | "liquidity_drain" | "suspicious_activity") => {
    setStressScenario(scenario);
    setComplianceResults(null); // Clear previous results so they run again

    if (scenario === "normal") {
      setBnaState(prev => ({
        ...prev,
        bfaReserveBalance: 5000000,
        baiReserveBalance: 6000000,
        bicReserveBalance: 4500000,
        bnaCustodyBalance: 15500000,
      }));
      setBnaFeedback("Cenário de Operações Normais restaurado com sucesso.");
    } else if (scenario === "reserve_drift") {
      // Intentionally introduce a drift discrepancy
      setBnaState(prev => ({
        ...prev,
        bfaReserveBalance: 1200000,
        baiReserveBalance: 1500000,
        bicReserveBalance: 1100000,
        bnaCustodyBalance: 2000000, // Total custody 2M, but sum of reserves is 3.8M! Mismatch!
      }));
      setBnaFeedback("AVISO: Cenário 'Divergência de Saldos' ativado. Diferença induzida na conciliação.");
    } else if (scenario === "liquidity_drain") {
      // Drain the reserves to trigger liquidity alert
      setBnaState(prev => ({
        ...prev,
        bfaReserveBalance: 40000,
        baiReserveBalance: 30000,
        bicReserveBalance: 25000,
        bnaCustodyBalance: 95000,
      }));
      setBnaFeedback("ALERTA CRÍTICO: Drenagem de Liquidez ativada. Rácio de reservas caiu abaixo do limiar.");
    } else if (scenario === "suspicious_activity") {
      setBnaFeedback("Cenário de Atividades Suspeitas ativado. Próxima auditoria inspecionará logs.");
    }

    setTimeout(() => setBnaFeedback(""), 4000);
  };

  const handleRunRegulatoryComplianceAudit = () => {
    if (complianceRunning) return;
    setComplianceRunning(true);
    setComplianceResults(null);
    
    const logs: string[] = [
      "⚙️ [AUDITOR BNA] Iniciando Auditoria de Conformidade Regulamentar (Directivas BNA 2026)...",
      "🔍 [Passo 1/4] Verificando integridade das assinaturas criptográficas..."
    ];
    setComplianceLogs([...logs]);

    setTimeout(() => {
      // Step 2
      logs.push("✔️ [OK] Assinaturas digitais de bloco sãs. mTLS TLS 1.3 estabelecido.");
      logs.push("🔍 [Passo 2/4] Verificando Rácio de Liquidez de Garantia Interbancária...");
      if (stressScenario === "liquidity_drain") {
        logs.push("⚠️ [FALHA] RÁCIO DE LIQUIDEZ INSOLVENTE! Reservas totais na banca comercial estão abaixo de 10% do volume ativo.");
      } else {
        logs.push("✔️ [OK] Rácio de Liquidez de Salvaguarda dentro dos limites operacionais (Aviso 14/BNA/2026).");
      }
      setComplianceLogs([...logs]);

      setTimeout(() => {
        // Step 3
        logs.push("🔍 [Passo 3/4] Validando Consistência de Partida Dobrada (Ledger vs Custódia)...");
        const totalReserves = bnaState.bfaReserveBalance + bnaState.baiReserveBalance + bnaState.bicReserveBalance;
        const totalCustody = bnaState.bnaCustodyBalance;
        if (stressScenario === "reserve_drift" || totalReserves !== totalCustody) {
          logs.push(`⚠️ [FALHA] DESALINHAMENTO DETECTADO! Saldos dos bancos (${totalReserves.toLocaleString("pt-PT")} Kz) divergem do saldo de custódia central (${totalCustody.toLocaleString("pt-PT")} Kz). Mismatch: ${(totalReserves - totalCustody).toLocaleString("pt-PT")} Kz.`);
        } else {
          logs.push("✔️ [OK] Conciliação perfeita. Saldos de garantias correspondem exatamente às carteiras de varejo.");
        }
        setComplianceLogs([...logs]);

        setTimeout(() => {
          // Step 4
          logs.push("🔍 [Passo 4/4] Analisando logs de transações por Sanções / AML...");
          if (stressScenario === "suspicious_activity") {
            logs.push("⚠️ [ALERTA] Detetados 3 acessos de IPs não-autorizados fora de Luanda. Contas suspensas temporariamente.");
          } else {
            logs.push("✔️ [OK] Nenhuma atividade de alto risco ou suspeita de lavagem de capitais encontrada.");
          }
          logs.push("📊 Compilando relatório de conformidade regulamentar...");
          setComplianceLogs([...logs]);

          setTimeout(() => {
            // Determine score
            let score = 100;
            const passedRules: string[] = [];
            const failedRules: string[] = [];

            // Rule 1: Signature Check
            passedRules.push("Directiva 04/2026: Assinaturas HSM nos Webhooks e APIs");
            
            // Rule 2: Liquidity Check
            if (stressScenario === "liquidity_drain") {
              score -= 30;
              failedRules.push("Aviso 14/BNA/2026: Limiar de Liquidez Crítica Mínima");
            } else {
              passedRules.push("Aviso 14/BNA/2026: Rácio de Liquidez de Salvaguarda Ativo");
            }

            // Rule 3: Reconciliation Check
            if (stressScenario === "reserve_drift" || (bnaState.bfaReserveBalance + bnaState.baiReserveBalance + bnaState.bicReserveBalance !== bnaState.bnaCustodyBalance)) {
              score -= 40;
              failedRules.push("Directiva 09/2026: Sincronismo de Custódia e Compensação SAGA");
            } else {
              passedRules.push("Directiva 09/2026: Alinhamento de Saldos Bilaterais Offline");
            }

            // Rule 4: Security/Biometric Auth / Sanctions Check
            if (stressScenario === "suspicious_activity") {
              score -= 20;
              failedRules.push("Aviso 02/BNA/2026: Sanitização de Geovelocidade de Acessos");
            } else {
              passedRules.push("Aviso 02/BNA/2026: Verificação de IP mTLS e Credenciais FIDO2");
            }

            const randHex = Array.from({length: 16}, () => Math.floor(Math.random()*16).toString(16)).join("");
            const certificateHash = "bna_compliance_cert_" + randHex;

            setComplianceResults({
              score,
              passedRules,
              failedRules,
              certificateHash,
              auditedAt: new Date().toLocaleTimeString("pt-PT") + " - " + new Date().toLocaleDateString("pt-PT")
            });
            setComplianceRunning(false);
            if (score === 100) {
              setBnaFeedback("Excelente! Sistema KwanzaMóvel obteve Conformidade Regulamentar Absoluta (100/100)!");
            } else {
              setBnaFeedback(`Auditoria concluída com pontuação de ${score}/100. Verifique as falhas apontadas.`);
            }
            setTimeout(() => setBnaFeedback(""), 4000);
          }, 1000);
        }, 1000);
      }, 1000);
    }, 1000);
  };

  // COMPLETE API ENDPOINTS DICTIONARY FOR THE 6 CHANNELS
  const apiEndpoints = {
    bancos: [
      {
        path: "/api/v1/private/bank/escrow-lock",
        method: "POST",
        scope: "Privado (mTLS + Signature)",
        desc: "Bloqueia garantias e depósitos em conta de custódia fiduciária comercial no BNA e emite o equivalente em saldo digital KwanzaMóvel.",
        headers: ["X-KwanzaMóvel-API-Key", "X-mTLS-Client-Cert-Thumbprint", "Content-Type: application/json"],
        requestBody: (phone: string, amt: number, rec: string, bill: string, merch: string, ag: string) => ({
          bank_code: "BAI",
          amount_aoa: amt,
          source_escrow_account: "AO06.0040.0000.1293.0019.1",
          target_wallet_phone: phone,
          digital_signature: "sha256_91823abce88cf2029ad1"
        }),
        responseBody: (phone: string, amt: number, rec: string, bill: string, merch: string, ag: string, txId: string) => ({
          status: "SUCCESS",
          transaction_id: txId,
          escrow_locked_aoa: amt,
          issued_digital_balance_aoa: amt,
          sptr_iso20022_tracking: "pacs.008.001.08.77291a",
          timestamp: new Date().toISOString()
        }),
        triggerEffect: true,
        effectType: "deposito_banco"
      },
      {
        path: "/api/v1/public/bank/reserves",
        method: "GET",
        scope: "Público",
        desc: "Consulta em tempo real o saldo agregado de reservas fiduciárias e o rácio de liquidez líquida atual.",
        headers: ["X-KwanzaMóvel-API-Key"],
        requestBody: null,
        responseBody: (phone: string, amt: number, rec: string, bill: string, merch: string, ag: string, txId: string) => ({
          status: "SUCCESS",
          total_central_bank_reserves_aoa: 154000000,
          total_circulation_digital_aoa: bnaState.totalCirculation,
          current_liquidity_ratio: "605.5%",
          health_index: "CONFORME_EXCELENTE"
        }),
        triggerEffect: false
      }
    ],
    telecoms: [
      {
        path: "/api/v1/private/telecom/airtime-disburse",
        method: "POST",
        scope: "Privado (mTLS)",
        desc: "Compensa e converte créditos de operadoras móveis diretamente em saldos móveis síncronos KwanzaMóvel.",
        headers: ["X-KwanzaMóvel-API-Key", "X-KwanzaMóvel-Signature", "Content-Type: application/json"],
        requestBody: (phone: string, amt: number, rec: string, bill: string, merch: string, ag: string) => ({
          operator: "UNITEL",
          amount_credits: amt,
          user_phone_target: phone,
          conversion_rate: 1.0
        }),
        responseBody: (phone: string, amt: number, rec: string, bill: string, merch: string, ag: string, txId: string) => ({
          status: "SUCCESS",
          transaction_id: txId,
          operator_ref: "UNITEL-RECARGAS",
          credits_redeemed: amt,
          wallet_credited_aoa: amt,
          timestamp: new Date().toISOString()
        }),
        triggerEffect: true,
        effectType: "credito_telecom"
      },
      {
        path: "/api/v1/public/telecom/ussd-trigger",
        method: "POST",
        scope: "Público",
        desc: "Inicia um gateway de resposta offline USSD para verificar a integridade da carteira sem rede de internet ativa.",
        headers: ["X-KwanzaMóvel-API-Key"],
        requestBody: (phone: string, amt: number, rec: string, bill: string, merch: string, ag: string) => ({
          phone_number: phone,
          session_id: "ussd_991823ab12",
          ussd_string: "*404#"
        }),
        responseBody: (phone: string, amt: number, rec: string, bill: string, merch: string, ag: string, txId: string) => ({
          status: "SUCCESS",
          display_message: `KwanzaMóvel - Manuel da Silva\nSaldo: 25.000 Kz\nLevel-1`,
          session_active: false
        }),
        triggerEffect: false
      }
    ],
    agentes: [
      {
        path: "/api/v1/private/agent/liquidity-topup",
        method: "POST",
        scope: "Privado (mTLS)",
        desc: "Incrementa ou provisiona o limite de liquidez de caixa de um Agente Físico Autorizado com base em garantias bancárias.",
        headers: ["X-KwanzaMóvel-API-Key", "X-mTLS-Client-Cert-Thumbprint", "Content-Type: application/json"],
        requestBody: (phone: string, amt: number, rec: string, bill: string, merch: string, ag: string) => ({
          agent_short_code: ag,
          topup_amount_aoa: amt,
          guarantee_ref: "BG-2026-9901a"
        }),
        responseBody: (phone: string, amt: number, rec: string, bill: string, merch: string, ag: string, txId: string) => ({
          status: "SUCCESS",
          agent_short_code: ag,
          allocated_liquidity_aoa: amt,
          new_available_cashbox_limit_aoa: 850000,
          timestamp: new Date().toISOString()
        }),
        triggerEffect: true,
        effectType: "agente_topup"
      },
      {
        path: "/api/v1/public/agent/verify-kyc",
        method: "GET",
        scope: "Público",
        desc: "Valida instantaneamente o Bilhete de Identidade (BI) ou NIF contra o registo nacional regulado pelo BNA.",
        headers: ["X-KwanzaMóvel-API-Key"],
        requestBody: null,
        responseBody: (phone: string, amt: number, rec: string, bill: string, merch: string, ag: string, txId: string) => ({
          status: "SUCCESS",
          bi_number: "00593845LA042",
          full_name: "Manuel da Silva",
          registered_tier: "Level-1",
          status_civil: "REGULARIZADO",
          aml_risk_level: "BAIXO"
        }),
        triggerEffect: false
      }
    ],
    comerciantes: [
      {
        path: "/api/v1/private/merchant/settle-pos",
        method: "POST",
        scope: "Privado (mTLS)",
        desc: "Liquida de forma instantânea os fundos pendentes acumulados em terminais POS físicos no Banco Liquidante.",
        headers: ["X-KwanzaMóvel-API-Key", "X-KwanzaMóvel-Signature", "Content-Type: application/json"],
        requestBody: (phone: string, amt: number, rec: string, bill: string, merch: string, ag: string) => ({
          merchant_id: merch,
          settlement_amount_aoa: amt,
          liquidating_bank: "BFA"
        }),
        responseBody: (phone: string, amt: number, rec: string, bill: string, merch: string, ag: string, txId: string) => ({
          status: "SUCCESS",
          merchant_id: merch,
          settled_amount_aoa: amt,
          bank_routing_iso20022: "pacs.004.settled.092a",
          timestamp: new Date().toISOString()
        }),
        triggerEffect: true,
        effectType: "comerciante_settle"
      },
      {
        path: "/api/v1/public/merchant/qr-payload",
        method: "POST",
        scope: "Público",
        desc: "Gera o payload oficial criptográfico assinado digitalmente para renderização de QR Code EMV compatível com KwanzaMóvel.",
        headers: ["X-KwanzaMóvel-API-Key"],
        requestBody: (phone: string, amt: number, rec: string, bill: string, merch: string, ag: string) => ({
          merchant_id: merch,
          amount_aoa: amt,
          concept: "Compra de Bens Alimentares",
          reference_code: "KM-REF-1092a"
        }),
        responseBody: (phone: string, amt: number, rec: string, bill: string, merch: string, ag: string, txId: string) => ({
          status: "SUCCESS",
          emv_qr_string: "00020101021131280016ao.gov.bna.kwanza43520015KM-REF-1092a5405150005802AO5915ALIMENTA_ANGOLA6006Luanda62150511KM-REF-1092a6304af8c",
          signature: "rsa_sha256_091823abcedea8910"
        }),
        triggerEffect: false
      }
    ],
    servicos_publicos: [
      {
        path: "/api/v1/private/utility/pay-bill",
        method: "POST",
        scope: "Privado (mTLS)",
        desc: "Liquida em tempo real facturas de electricidade (ENDE), água (EPAL) ou impostos (AGT) com conciliação automática.",
        headers: ["X-KwanzaMóvel-API-Key", "X-KwanzaMóvel-Signature", "Content-Type: application/json"],
        requestBody: (phone: string, amt: number, rec: string, bill: string, merch: string, ag: string) => ({
          utility_provider: rec === "ENDE_PAGAMENTOS" || rec === "EPAL_PAGAMENTOS" ? rec : "ENDE_PAGAMENTOS",
          invoice_number: bill,
          amount_aoa: amt,
          taxpayer_nif: "AO-50012921",
          payer_phone_source: phone
        }),
        responseBody: (phone: string, amt: number, rec: string, bill: string, merch: string, ag: string, txId: string) => ({
          status: "SUCCESS",
          transaction_id: txId,
          utility_provider: rec === "ENDE_PAGAMENTOS" || rec === "EPAL_PAGAMENTOS" ? rec : "ENDE_PAGAMENTOS",
          invoice_number: bill,
          amount_settled_aoa: amt,
          treasury_auth_code: `AGT-TAX-${Math.floor(10000 + Math.random() * 90000)}`,
          timestamp: new Date().toISOString()
        }),
        triggerEffect: true,
        effectType: "utilidade_pagamento"
      },
      {
        path: "/api/v1/public/utility/query-debt",
        method: "GET",
        scope: "Público",
        desc: "Consulta a base de dados integrada de serviços públicos para apurar o montante em dívida associado a uma conta contratual.",
        headers: ["X-KwanzaMóvel-API-Key"],
        requestBody: null,
        responseBody: (phone: string, amt: number, rec: string, bill: string, merch: string, ag: string, txId: string) => ({
          status: "SUCCESS",
          utility_provider: "ENDE_PAGAMENTOS",
          invoice_number: bill,
          customer_name: "Manuel da Silva",
          debt_balance_aoa: 8500,
          due_date: "2026-07-15"
        }),
        triggerEffect: false
      }
    ],
    ecommerce: [
      {
        path: "/api/v1/private/ecommerce/create-checkout",
        method: "POST",
        scope: "Privado (mTLS)",
        desc: "Gera uma sessão de pagamento integrada segura e descentralizada para carrinhos de e-commerce angolanos.",
        headers: ["X-KwanzaMóvel-API-Key", "X-KwanzaMóvel-Signature", "Content-Type: application/json"],
        requestBody: (phone: string, amt: number, rec: string, bill: string, merch: string, ag: string) => ({
          store_domain: "www.comprasangola.co.ao",
          order_id: `ORD-${Math.floor(10000 + Math.random() * 90000)}`,
          amount_aoa: amt,
          redirect_url: "https://www.comprasangola.co.ao/payment/success",
          cancel_url: "https://www.comprasangola.co.ao/payment/cancel"
        }),
        responseBody: (phone: string, amt: number, rec: string, bill: string, merch: string, ag: string, txId: string) => ({
          status: "SUCCESS",
          checkout_token: "km_tok_ecom_9182ab9901ef",
          redirect_checkout_url: "https://checkout.kwanzamovel.gov.ao/pay?token=km_tok_ecom_9182ab9901ef",
          expires_in_minutes: 15
        }),
        triggerEffect: true,
        effectType: "ecommerce_checkout"
      },
      {
        path: "/api/v1/public/ecommerce/verify-payment",
        method: "GET",
        scope: "Público",
        desc: "Inquérito público descentralizado para verificar de forma irreversível se um checkout de e-commerce foi liquidado.",
        headers: ["X-KwanzaMóvel-API-Key"],
        requestBody: null,
        responseBody: (phone: string, amt: number, rec: string, bill: string, merch: string, ag: string, txId: string) => ({
          status: "SUCCESS",
          checkout_token: "km_tok_ecom_9182ab9901ef",
          payment_status: "COMPLETED",
          settled_amount_aoa: amt,
          sptr_validation_hash: "0x889a77b09c2a11bde90177aa"
        }),
        triggerEffect: false
      }
    ]
  };

  const handleRunApiSandbox = (endpoint: any) => {
    if (apiRunning) return;
    setApiRunning(true);
    setApiRunLogs(["[API Gateway] Ligação iniciada via canal seguro HTTPS TLS 1.3..."]);
    setApiRunResponse(null);

    const generatedTxId = `TX-API-${Math.floor(100000 + Math.random() * 900000)}`;

    setTimeout(() => {
      setApiRunLogs(prev => [...prev, "[Handshake] mTLS verificado com sucesso. Certificado X.509 em conformidade."]);
      
      setTimeout(() => {
        setApiRunLogs(prev => [...prev, `[OAuth/HMAC] Chave de API validada: "${authHeaderSim.substring(0, 16)}..."`]);
        
        setTimeout(() => {
          setApiRunLogs(prev => [...prev, "[AML & Compliance] Motor síncrono avaliou rácio de risco de fraude: 0.02 (MUITO BAIXO)"]);
          
          setTimeout(() => {
            setApiRunLogs(prev => [...prev, `[Consolidação BNA] A liquidar instruções com Banco Central via SPTR...`]);
            
            setTimeout(() => {
              const response = endpoint.responseBody(
                phoneParam, 
                amountParam, 
                receiverParam, 
                utilityBillParam, 
                merchantParam, 
                agentCodeParam,
                generatedTxId
              );
              setApiRunResponse(response);
              setApiRunLogs(prev => [...prev, `[Gateway Response] Chamada concluída com sucesso com código HTTP 200 OK.`]);
              setApiRunning(false);

              logAuditEvent(
                "acesso", 
                "Execução Sandbox API", 
                `Chamada ao endpoint ${endpoint.path} por ${authHeaderSim}`, 
                "sucesso"
              );

              if (endpoint.triggerEffect && setTransactions) {
                let type: "envio" | "recebimento" | "pagamento" = "pagamento";
                let sender = phoneParam;
                let receiver = receiverParam;
                let details = "Compensado e Integrado via API de Interoperabilidade";

                if (endpoint.effectType === "deposito_banco") {
                  type = "recebimento";
                  sender = "BANCO_CENTRAL_CUSTODIA";
                  receiver = phoneParam;
                  details = "Emissão fiduciária de custódia comercial via API Escrow";
                } else if (endpoint.effectType === "credito_telecom") {
                  type = "recebimento";
                  sender = "UNITEL_MONEY";
                  receiver = phoneParam;
                  details = "Créditos móveis convertidos em saldo móvel real";
                } else if (endpoint.effectType === "agente_topup") {
                  type = "recebimento";
                  sender = "AGENTE_PORTAL_CASH";
                  receiver = phoneParam;
                  details = "Alocação de liquidez e caixa via API privada";
                } else if (endpoint.effectType === "comerciante_settle") {
                  type = "envio";
                  sender = phoneParam;
                  receiver = merchantParam;
                  details = "Liquidação síncrona de terminal POS físico";
                } else if (endpoint.effectType === "utilidade_pagamento") {
                  type = "pagamento";
                  sender = phoneParam;
                  receiver = receiverParam === "ENDE_PAGAMENTOS" || receiverParam === "EPAL_PAGAMENTOS" ? receiverParam : "ENDE_PAGAMENTOS";
                  details = `Fatura ${utilityBillParam} paga via API Serviços Públicos`;
                } else if (endpoint.effectType === "ecommerce_checkout") {
                  type = "pagamento";
                  sender = phoneParam;
                  receiver = "CHECKOUT_ECOMMERCE";
                  details = "Compra aprovada via checkout digital";
                }

                const newTx: Transaction = {
                  id: generatedTxId,
                  senderPhone: sender,
                  receiverPhone: receiver,
                  amount: amountParam,
                  type: type,
                  status: "completed",
                  timestamp: new Date().toISOString(),
                  latencyMs: Math.floor(40 + Math.random() * 80),
                  fraudScore: 0.01,
                  securityLog: [
                    "Validação mTLS BNA certificada",
                    `API Key: ${authHeaderSim}`,
                    "Assinatura SHA256 verificada",
                    details
                  ],
                  locationName: "Luanda (API Gateway)",
                  latitude: -8.8368,
                  longitude: 13.2343
                };

                setTransactions(prev => [newTx, ...prev]);
                
                if (endpoint.effectType === "deposito_banco") {
                  setBnaState(prev => ({
                    ...prev,
                    bnaCustodyBalance: prev.bnaCustodyBalance + amountParam,
                    baiReserveBalance: prev.baiReserveBalance + amountParam
                  }));
                }

                setBnaFeedback(`Sucesso: API integrada executada! Transação ${generatedTxId} adicionada ao livro razão.`);
                setTimeout(() => setBnaFeedback(""), 4000);
              }
            }, 600);
          }, 500);
        }, 500);
      }, 500);
    }, 400);
  };

  const handleCreateApiKey = () => {
    if (!newKeyOwner.trim()) {
      alert("Por favor, insira o proprietário da chave.");
      return;
    }
    const id = `key_${Math.floor(10000 + Math.random() * 90000)}`;
    const randomHex = Math.random().toString(16).substring(2, 10);
    const key = `km_pk_live_${newKeyOwner.toLowerCase().replace(/\s+/g, "_")}_${randomHex}`;
    const secret = `km_sec_${Math.random().toString(16).substring(2, 14)}${Math.random().toString(16).substring(2, 10)}`;
    
    const newKey = {
      id,
      owner: newKeyOwner,
      role: newKeyRole,
      key,
      secret,
      status: "Active",
      created: new Date().toISOString().split('T')[0]
    };

    setApiKeys(prev => [...prev, newKey]);
    setNewKeyOwner("");
    
    logAuditEvent("alteracao_sensivel", "Criação de Chave de API", `Chave criada para ${newKeyOwner} (${newKeyRole})`, "sucesso");
    setBnaFeedback(`Chave criada com sucesso para ${newKeyOwner}!`);
    setTimeout(() => setBnaFeedback(""), 3000);
  };

  const handleToggleApiKeyStatus = (id: string) => {
    setApiKeys(prev => prev.map(k => {
      if (k.id === id) {
        const nextStatus = k.status === "Active" ? "Revoked" : "Active";
        logAuditEvent("alteracao_sensivel", "Alteração de Estado de API Key", `Chave ${k.key} alterada para ${nextStatus}`, "sucesso");
        return { ...k, status: nextStatus };
      }
      return k;
    }));
  };

  const handleDeleteApiKey = (id: string) => {
    const k = apiKeys.find(key => key.id === id);
    if (k && confirm(`Deseja revogar e remover definitivamente as credenciais de ${k.owner}?`)) {
      setApiKeys(prev => prev.filter(key => key.id !== id));
      logAuditEvent("alteracao_sensivel", "Remoção de Chave de API", `Chave de ${k.owner} removida`, "sucesso");
    }
  };

  const handleTriggerWebhook = () => {
    if (webhookRunning) return;
    setWebhookRunning(true);
    setWebhookResult("");

    setTimeout(() => {
      const payload = {
        event: "payment.completed",
        api_version: "v2.1",
        data: {
          transaction_id: `TX-WEB-${Math.floor(100000 + Math.random() * 900000)}`,
          phone_source: phoneParam,
          amount_aoa: amountParam,
          currency: "AOA",
          status: "COMPLETED",
          reference: "WEBHOOK-SANDBOX-TEST",
          timestamp: new Date().toISOString()
        },
        signature_sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
      };

      setWebhookResult(JSON.stringify(payload, null, 2));
      setWebhookRunning(false);

      logAuditEvent("acesso", "Disparo Webhook Teste", `Webhook enviado com sucesso para ${webhookUrl}`, "sucesso");
    }, 1200);
  };

  return (
    <div id="bna_custody_portal" className="bg-[#0c0806] border-2 border-amber-900/15 rounded-2xl p-5 space-y-4 text-white">
      
      {/* HEADER ROW WITH STATUS */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-neutral-900">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-[#B87333]/10 border border-[#B87333]/30 rounded-xl text-[#B87333]">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-sm uppercase tracking-widest text-[#FFF]">PAINEL EXECUTIVO BNA</h3>
            <p className="text-[10px] text-zinc-400 uppercase font-mono tracking-wider">Supervisão & Auditoria de Ativos</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Live System Alerts count */}
          {(isVolumeCritical || isPendingCritical || isCirculationCritical) && (
            <div className="flex items-center gap-1.5 text-[10px] bg-rose-950/45 text-rose-300 px-2.5 py-1.5 rounded-lg border border-rose-900/60 animate-pulse font-mono font-black">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500 animate-bounce" />
              <span>ALERTA DE SEGURANÇA</span>
            </div>
          )}

          {/* Live mTLS connection status */}
          <div className="flex items-center gap-2 text-[10px] bg-[#050505] px-3 py-1.5 rounded-lg border border-neutral-900 font-mono">
            <span className="text-zinc-500 font-bold uppercase">mTLS BNA LINK:</span>
            {mtlsStatus === "ACTIVE" ? (
              <span className="text-emerald-400 font-black flex items-center gap-1">
                <span className={`h-1.5 w-1.5 rounded-full inline-block ${isVolumeCritical || isPendingCritical || isCirculationCritical ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'}`}></span>
                {isVolumeCritical || isPendingCritical || isCirculationCritical ? (
                  <span className="text-rose-450 font-black text-rose-500">SUPERVISÃO CRÍTICA</span>
                ) : (
                  <span>SINAL OPERACIONAL</span>
                )}
              </span>
            ) : (
              <span className="text-amber-500 font-black flex items-center gap-1 animate-pulse">
                <RefreshCw className="w-3 h-3 animate-spin text-[#B87333]" />
                SINC...
              </span>
            )}
          </div>
        </div>
      </div>

      {/* CORE TEXT */}
      <p className="text-xs text-zinc-400 leading-normal font-sans">
        Esta central reguladora monitoriza síncronamente as transações e o património fideicomissário fiduciário do <strong>KwanzaMóvel</strong>. Garantimos conformidade 1:1 absoluta e supervisão direta contra fraudes.
      </p>

      {/* COMPLIANCE SCORECARD */}
      <div className="bg-gradient-to-br from-zinc-950/80 to-[#120d0b] border border-neutral-900/40 rounded-xl p-4 space-y-3.5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-neutral-900 pb-2.5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#B87333]" />
            <div>
              <h4 className="font-black text-[11px] uppercase tracking-wider text-white">Relatório de Conformidade Geral (Scorecard)</h4>
              <p className="text-[8.5px] text-zinc-500 uppercase font-mono">Auditoria Contínua com base nas Regras AML/CFT do BNA</p>
            </div>
          </div>
          <div>
            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded font-mono ${
              calculatedRate >= 99.5
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : calculatedRate >= 98.5
                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
            }`}>
              {calculatedRate >= 99.5 ? "★ CONFORME (EXCELENTE)" : calculatedRate >= 98.5 ? "⚠ SOB ALERTA" : "✖ EXCESSO DE ALERTAS"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          
          {/* Taxa de Conformidade */}
          <div className="bg-[#050505] border border-neutral-900/60 rounded-lg p-3 flex flex-col justify-between">
            <div>
              <span className="text-[8.5px] uppercase font-bold text-zinc-500 font-mono block">Taxa de Conformidade</span>
              <div className="flex items-baseline gap-1 mt-1">
                <strong className={`text-2xl font-mono font-black ${
                  calculatedRate >= 99.5 ? "text-emerald-400" : calculatedRate >= 98.5 ? "text-amber-500" : "text-rose-500"
                }`}>{calculatedRate}%</strong>
                <span className="text-[8.5px] text-zinc-650 font-mono block sm:inline ml-1.5">Métrica Geral</span>
              </div>
            </div>
            
            {/* Horizontal progress bar */}
            <div className="mt-2.5 space-y-1">
              <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    calculatedRate >= 99.5 ? "bg-emerald-500" : calculatedRate >= 98.5 ? "bg-amber-500" : "bg-rose-500"
                  }`} 
                  style={{ width: `${calculatedRate}%` }}
                />
              </div>
              <div className="flex justify-between text-[8px] font-mono text-zinc-550">
                <span>0% de risco</span>
                <span>Conformidade Real: {calculatedRate}%</span>
              </div>
            </div>
          </div>

          {/* Transações Inspecionadas */}
          <div className="bg-[#050505] border border-neutral-900/60 rounded-lg p-3 flex flex-col justify-between">
            <div>
              <span className="text-[8.5px] uppercase font-bold text-zinc-500 font-mono block">Volume de Transações Inspecionadas</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <strong className="text-xl font-mono text-white font-black">{totalTxCount.toLocaleString("pt-PT")}</strong>
                <span className="text-[9px] text-zinc-400 font-bold uppercase">Lotes</span>
              </div>
            </div>
            <p className="text-[8.5px] text-zinc-500 leading-snug mt-2 pt-1 border-t border-neutral-900/40 font-mono">
              Registos históricos: <strong className="text-white">{baseTotalTxCount}</strong> + Ativos: <strong className="text-white">{transactions.length}</strong>.
            </p>
          </div>

          {/* Transações Suspeitas */}
          <div className="bg-[#050505] border border-neutral-900/60 rounded-lg p-3 flex flex-col justify-between">
            <div>
              <span className="text-[8.5px] uppercase font-bold text-rose-455 font-mono block flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-rose-550 inline" />
                Transações Flagged / Suspeitas
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <strong className={`text-xl font-mono font-black ${totalSuspiciousCount > 15 ? "text-rose-500 animate-pulse" : "text-amber-500"}`}>
                  {totalSuspiciousCount}
                </strong>
                <span className="text-[9px] text-zinc-450 uppercase font-mono">Casos Sinalizados</span>
              </div>
            </div>
            <p className="text-[8.5px] text-zinc-500 leading-snug mt-2 pt-1 border-t border-neutral-900/40 font-mono">
              Bloqueios históricos: <strong className="text-white">{fraudsBlocked}</strong> & Live AML/Risk: <strong className="text-white">{liveSuspicious.length}</strong>.
            </p>
          </div>

        </div>
      </div>

      {/* SIMULADOR DE CONVERSÃO DE TAXAS DE CÂMBIO */}
      <div className="bg-[#0b0b0a] border border-[#B87333]/25 rounded-xl p-3.5 space-y-2.5 animate-fade-in font-mono text-[10.5px]">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-[#B87333] animate-pulse" />
            <div>
              <h4 className="font-bold text-xs text-white uppercase tracking-wider">Simulador de Conversão Cambial do BNA</h4>
              <p className="text-[8.5px] text-zinc-550 uppercase">Simular liquidação financeira em moedas externas</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 bg-black p-1 rounded-lg border border-neutral-800">
            <button
              onClick={() => {
                setSelectedCurrency("AOA");
                setBnaFeedback("Simulador BNA: Moeda de liquidação alterada para Kwanza Angolano (AOA). Taxa de câmbio: 1.00");
                setTimeout(() => setBnaFeedback(""), 3000);
              }}
              className={`px-2.5 py-1 text-[9px] font-black rounded uppercase transition-all duration-200 cursor-pointer ${
                selectedCurrency === "AOA"
                  ? "bg-[#B87333] text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-neutral-900"
              }`}
            >
              Kwanza (AOA)
            </button>
            <button
              onClick={() => {
                setSelectedCurrency("USD");
                setBnaFeedback("Simulador BNA: Moeda de liquidação alterada para Dólar Americano (USD). Câmbio de referência: 1 USD = 825,00 AOA");
                setTimeout(() => setBnaFeedback(""), 3500);
              }}
              className={`px-2.5 py-1 text-[9px] font-black rounded uppercase transition-all duration-200 cursor-pointer ${
                selectedCurrency === "USD"
                  ? "bg-[#B87333] text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-neutral-900"
              }`}
            >
              USD ($)
            </button>
            <button
              onClick={() => {
                setSelectedCurrency("EUR");
                setBnaFeedback("Simulador BNA: Moeda de liquidação alterada para Euro (EUR). Câmbio de referência: 1 EUR = 895,00 AOA");
                setTimeout(() => setBnaFeedback(""), 3500);
              }}
              className={`px-2.5 py-1 text-[9px] font-black rounded uppercase transition-all duration-200 cursor-pointer ${
                selectedCurrency === "EUR"
                  ? "bg-[#B87333] text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-neutral-900"
              }`}
            >
              Euro (€)
            </button>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-[9px] text-zinc-500 bg-black/40 p-2 rounded border border-neutral-900/50 gap-2.5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>Moeda Ativa: <strong className="text-white">{exchangeRates[selectedCurrency].name} ({selectedCurrency})</strong></span>
            {selectedCurrency !== "AOA" && (
              <span className="text-[#B87333]">
                Taxa de Câmbio BNA: 1 {selectedCurrency} = {selectedCurrency === "USD" ? "825,00" : "895,00"} AOA
              </span>
            )}
          </div>
          <span className="text-[8px] uppercase tracking-wider text-emerald-555 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-black">
            Cotação de Referência Oficial Sincronizada
          </span>
        </div>
      </div>

      {/* REGULATOR EXECUTIVE TABS (PREFER SIMPLICITY) */}
      <div className="flex flex-wrap gap-1 bg-[#050505] p-1 rounded-xl border border-neutral-900 font-mono">
        <button
          onClick={() => handleTabChange("painel_executivo")}
          className={`flex-grow text-center py-2 px-2 text-[11px] font-black rounded-lg transition-all ${
            selectedTab === "painel_executivo" ? "bg-[#B87333] text-white" : "text-zinc-500 hover:text-zinc-300"
          }`}
          id="bna-tab-btn-executive"
        >
          PAINEL EXECUTIVO
        </button>
        <button
          onClick={() => handleTabChange("sandbox_bancos")}
          className={`flex-grow text-center py-2 px-2 text-[11px] font-black rounded-lg transition-all ${
            selectedTab === "sandbox_bancos" ? "bg-[#B87333] text-white" : "text-zinc-500 hover:text-zinc-300"
          }`}
          id="bna-tab-btn-sandbox"
        >
          SANDBOX BANCÁRIA
        </button>
        <button
          onClick={() => handleTabChange("reconciliacoes")}
          className={`flex-grow text-center py-2 px-2 text-[11px] font-black rounded-lg transition-all ${
            selectedTab === "reconciliacoes" ? "bg-[#B87333] text-white" : "text-zinc-500 hover:text-zinc-300"
          }`}
          id="bna-tab-btn-reconciliation"
        >
          RECONCILIAÇÕES
        </button>
        <button
          onClick={() => handleTabChange("fila_iso")}
          className={`flex-grow text-center py-2 px-2 text-[11px] font-black rounded-lg transition-all ${
            selectedTab === "fila_iso" ? "bg-[#B87333] text-white" : "text-zinc-500 hover:text-zinc-300"
          }`}
          id="bna-tab-btn-iso"
        >
          FILA ISO 20022
        </button>
        <button
          onClick={() => handleTabChange("config_recuperacao")}
          className={`flex-grow text-center py-2 px-2 text-[11px] font-black rounded-lg transition-all ${
            selectedTab === "config_recuperacao" ? "bg-[#B87333] text-white" : "text-zinc-500 hover:text-zinc-300"
          }`}
          id="bna-tab-btn-recovery"
        >
          CONFIG. RECUPERAÇÃO
        </button>
        <button
          onClick={() => handleTabChange("logs_auditoria")}
          className={`flex-grow text-center py-2 px-2 text-[11px] font-black rounded-lg transition-all ${
            selectedTab === "logs_auditoria" ? "bg-[#B87333] text-white" : "text-zinc-500 hover:text-zinc-300"
          }`}
          id="bna-tab-btn-audit"
        >
          LOGS DE AUDITORIA
        </button>
        <button
          onClick={() => handleTabChange("interoperabilidade")}
          className={`flex-grow text-center py-2 px-2 text-[11px] font-black rounded-lg transition-all ${
            selectedTab === "interoperabilidade" ? "bg-[#B87333] text-white" : "text-zinc-500 hover:text-zinc-300"
          }`}
          id="bna-tab-btn-interop"
        >
          INTEROPERABILIDADE & APIS
        </button>
      </div>

      {/* FEEDBACK ROW */}
      {bnaFeedback && (
        <div className="p-3 bg-[#0b0807] border border-[#B87333]/30 text-[#e0a96d] rounded-xl font-mono text-[10.5px] leading-relaxed flex gap-2">
          <Cpu className="w-4 h-4 text-[#B87333] animate-spin mt-0.5 flex-shrink-0" />
          <span>{bnaFeedback}</span>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: PAINEL EXECUTIVO (BENTO GRID METRICS)                   */}
      {/* ------------------------------------------------------------- */}
      {selectedTab === "painel_executivo" && (
        <div className="space-y-4 animate-fade-in">
          
          {/* Alerta de Transação de Alto Valor (Configurável) */}
          {hasLargeTxAlert && (
            <div className="bg-amber-950/20 border-2 border-amber-500 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-pulse shadow-lg shadow-amber-955/20" id="bna-high-value-alert-banner">
              <div className="flex gap-3 items-start">
                <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/30 text-amber-500 shrink-0 mt-0.5">
                  <AlertTriangle className="w-5 h-5 text-amber-500 animate-bounce" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-black uppercase text-amber-400 tracking-wider flex items-center gap-1">
                    ALERTA DE SEGURANÇA BNA • MONITORIZAÇÃO DE ALTO VALOR
                  </span>
                  <h4 className="text-white font-black text-sm uppercase">Movimentos acima do Limite de Risco</h4>
                  <p className="text-xs text-zinc-400 leading-normal max-w-2xl">
                    Foram identificados <strong className="text-white font-black font-mono">{largeTransactions.length} lançamentos activos</strong> cujo montante excede o limite regulamentar configurável de <strong className="text-amber-500 font-mono">{largeTxThreshold.toLocaleString("pt-PT")} Kz</strong>. Todas as contrapartes foram marcadas no ledger de compensação síncrona.
                  </p>
                </div>
              </div>
              <div className="flex sm:flex-col items-stretch gap-2 w-full sm:w-auto shrink-0">
                <span className="text-[9px] font-mono text-zinc-500 text-center sm:text-right">
                  Nível de Alerta: <strong className="text-amber-500 uppercase">Avisos Activos</strong>
                </span>
                <button
                  onClick={() => {
                    const nextLimit = Math.max(...largeTransactions.map(tx => tx.amount)) + 1000;
                    setBnaState(prev => ({ ...prev, largeTxThreshold: nextLimit }));
                    setBnaFeedback(`Limite de risco subido temporariamente para ${nextLimit.toLocaleString("pt-PT")} Kz.`);
                    setTimeout(() => setBnaFeedback(""), 3000);
                  }}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-black font-black text-[9px] uppercase rounded-lg tracking-wider transition-all duration-200 cursor-pointer text-center"
                >
                  Mitigar (Subir Limite)
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            
            {/* Metrica 1: Utilizadores Ativos */}
            <div className="bg-zinc-950 border border-neutral-900 p-4 rounded-xl flex flex-col justify-between">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold block">Utilizadores Ativos</span>
              <div className="flex items-baseline gap-1 mt-2">
                <strong className="text-2xl font-mono text-white font-black">{activeUserCount.toLocaleString("pt-PT")}</strong>
                <span className="text-[10px] text-green-400 font-bold uppercase">(Cidadãos Activos)</span>
              </div>
              <p className="text-[9.5px] text-zinc-500 mt-2 leading-tight">Total homologado nacionalmente.</p>
            </div>

            {/* Metrica 2: Volume Diário */}
            <div className={`p-4 rounded-xl flex flex-col justify-between transition-all duration-300 ${
              isVolumeCritical
                ? "bg-rose-950/20 border-2 border-rose-500 shadow-lg shadow-rose-900/10 animate-pulse"
                : "bg-zinc-950 border border-neutral-900"
            }`}>
              <span className="text-[10px] uppercase tracking-wider text-[#B87333] font-bold block flex items-center gap-1.5">
                {isVolumeCritical && <span className="h-1.5 w-1.5 rounded-full bg-rose-500 inline-block animate-ping" />}
                Volume Diário
              </span>
              <div className="flex items-baseline gap-1 mt-2">
                <strong className="text-xl font-mono text-white font-black">{dailyTotalTransactVol.toLocaleString("pt-PT")}</strong>
                <span className="text-xs text-[#B87333] font-bold">Kz</span>
              </div>
              <p className="text-[9.5px] text-zinc-500 mt-2 leading-tight flex justify-between items-center">
                <span>Liquidação acumulada em tempo real.</span>
                {isVolumeCritical && <span className="text-[8px] font-mono font-black text-rose-455 uppercase tracking-widest animate-pulse">CRÍTICO</span>}
              </p>
            </div>

            {/* Metrica 3: Circulação Total do Wallet (Custom visual alert when over threshold) */}
            <div className={`p-4 rounded-xl flex flex-col justify-between transition-all duration-300 ${
              isCirculationCritical
                ? "bg-rose-950/20 border-2 border-rose-600 shadow-lg shadow-rose-950/20 animate-pulse"
                : "bg-zinc-950 border border-neutral-900"
            }`}>
              <span className="text-[10px] uppercase tracking-wider text-amber-500 font-bold block flex items-center gap-1.5">
                {isCirculationCritical && <span className="h-1.5 w-1.5 rounded-full bg-rose-600 inline-block animate-ping" />}
                Circulação Total do Wallet
              </span>
              <div className="flex items-baseline gap-1 mt-2">
                <strong className="text-xl font-mono text-white font-black">{bnaState.totalCirculation.toLocaleString("pt-PT")}</strong>
                <span className="text-xs text-amber-500 font-bold">Kz</span>
              </div>
              <p className="text-[9.5px] text-zinc-500 mt-2 leading-tight flex justify-between items-center">
                <span>Total de Kwanzas emitidos em carteira.</span>
                {isCirculationCritical && <span className="text-[8px] font-mono font-black text-rose-450 uppercase tracking-widest animate-pulse">EXCESSO OPERACIONAL</span>}
              </p>
            </div>

            {/* Metrica 4: Fraudes Bloqueadas */}
            <div className="bg-zinc-950 border border-neutral-900 p-4 rounded-xl flex flex-col justify-between">
              <span className="text-[10px] uppercase tracking-wider text-rose-500 font-bold block">Fraudes Bloqueadas</span>
              <div className="flex items-baseline gap-1.5 mt-2">
                <strong className="text-2xl font-mono text-white font-black">{fraudsBlocked}</strong>
                <span className="text-[9px] uppercase font-bold text-rose-455 bg-rose-500/10 px-1.5 py-0.5 rounded">Ativo</span>
              </div>
              <p className="text-[9.5px] text-zinc-500 mt-2 leading-tight">Transações irregulares baradas.</p>
            </div>

            {/* Metrica 5: Liquidações & Garantia */}
            <div className="bg-zinc-950 border border-neutral-900 p-4 rounded-xl flex flex-col justify-between">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold block">Compensações Compensatórias</span>
              <div className="flex items-baseline gap-1.5 mt-2">
                <strong className="text-lg font-mono text-emerald-400 font-black">100.00%</strong>
                <span className="text-[9px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">Bilateral</span>
              </div>
              <p className="text-[9.5px] text-zinc-500 mt-2 leading-tight">Cobertura total pelo Banco Central.</p>
            </div>

            {/* Metrica 6: Rácio de Liquidez em Tempo Real */}
            <div className="bg-zinc-950 border border-neutral-900 p-4 rounded-xl flex flex-col justify-between group hover:border-[#B87333]/30 transition-all duration-300">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] uppercase tracking-wider text-[#B87333] font-bold block flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-[#B87333]" />
                  Rácio de Liquidez Síncrona
                </span>
                <span className="text-[7.5px] font-mono font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded uppercase">
                  Tempo Real
                </span>
              </div>
              
              <div className="flex items-baseline gap-1.5 mt-2">
                <strong className={`text-[21px] font-mono font-black tracking-tight ${
                  liquidityRatio >= 100 ? "text-emerald-400" : liquidityRatio >= 85 ? "text-amber-500" : "text-rose-500"
                }`}>
                  {liquidityRatio}%
                </strong>
                <span className={`text-[8.5px] uppercase font-mono font-bold ${
                  liquidityRatio >= 100 ? "text-emerald-500/80" : liquidityRatio >= 85 ? "text-amber-500/80" : "text-rose-500/80"
                }`}>
                  {liquidityRatio >= 100 ? "Totalmente Coberto" : liquidityRatio >= 85 ? "Cobertura Alerta" : "Défice de Caixa"}
                </span>
              </div>

              {/* Backing Bar Indicator */}
              <div className="mt-2 space-y-1 bg-[#050505] border border-neutral-900/60 rounded-lg p-2 font-mono text-[7.5px]">
                <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden mb-1.5 border border-zinc-950">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      liquidityRatio >= 105 ? "bg-emerald-500" : liquidityRatio >= 100 ? "bg-emerald-400" : liquidityRatio >= 85 ? "bg-amber-500" : "bg-rose-500"
                    }`}
                    style={{ width: `${Math.max(10, Math.min(100, liquidityRatio))}%` }}
                  />
                </div>
                <div className="flex justify-between text-zinc-500">
                  <span>Reservas BNA Custódia:</span>
                  <strong className="text-white">{formatValue(centralBankReserves)}</strong>
                </div>
                <div className="flex justify-between text-zinc-500">
                  <span>Saldo total (Carteiras):</span>
                  <strong className="text-white">{formatValue(userTotalCirculation)}</strong>
                </div>
                <div className="text-[7.5px] text-[#B87333]/70 font-sans border-t border-neutral-900 mt-1 pt-1 text-center font-bold">
                  Fórmula: (Reservas BNA / Saldo Carteiras) &times; 100
                </div>
              </div>
            </div>

          </div>

          {/* GRÁFICO VISUAL: EVOLUÇÃO DA CIRCULAÇÃO DO KWANZA */}
          <div className="bg-zinc-950 border border-neutral-900 rounded-xl p-5 space-y-4 animate-fade-in" id="bna-kwanza-circulation-chart-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-900 pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#B87333]" />
                <div>
                  <h4 className="font-black text-xs uppercase tracking-widest text-white font-mono">Evolução de Emissão & Circulação Soberana</h4>
                  <p className="text-[9px] text-zinc-500 uppercase font-mono">Controlo do Stock Monetário Digital vs Cobertura de Reservas</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 font-mono">
                {/* CONFIGURABLE TIME INTERVAL SELECTOR */}
                <div className="flex items-center bg-black/50 border border-neutral-900 rounded p-0.5 gap-0.5 mr-1" id="bna-time-range-selector">
                  {(["24h", "7d", "30d"] as const).map((range) => {
                    const label = range === "24h" ? "24h" : range === "7d" ? "7 DIAS" : "30 DIAS";
                    const active = circulationTimeRange === range;
                    return (
                      <button
                        key={range}
                        onClick={() => handleTimeRangeChange(range)}
                        className={`text-[8px] font-black uppercase px-2 py-0.5 rounded transition-all cursor-pointer ${
                          active
                            ? "bg-[#B87333]/20 text-[#B87333] border border-[#B87333]/35"
                            : "text-zinc-500 hover:text-zinc-300 border border-transparent"
                        }`}
                        id={`bna-circulation-range-btn-${range}`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                <span className="text-[9px] uppercase font-black px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Crescimento: +{(((bnaState.totalCirculation - Math.round(bnaState.totalCirculation * (circulationTimeRange === "24h" ? 0.92 : circulationTimeRange === "30d" ? 0.62 : 0.72))) / Math.round(bnaState.totalCirculation * (circulationTimeRange === "24h" ? 0.92 : circulationTimeRange === "30d" ? 0.62 : 0.72))) * 100).toFixed(1)}%
                </span>
                <span className="text-[9px] uppercase font-black px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Reserva: 115% Segura
                </span>
              </div>
            </div>

            <div className="w-full h-72 md:h-80" id="bna-circulation-chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={getCirculationEvolutionData()}
                  margin={{ top: 10, right: 15, left: -5, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorCirculation" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#B87333" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#B87333" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorReserves" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1c1917" vertical={false} />
                  <XAxis 
                    dataKey="dateStr" 
                    stroke="#71717a" 
                    fontSize={10} 
                    fontFamily="monospace"
                    tickLine={false}
                    axisLine={{ stroke: '#27272a' }}
                    minTickGap={15}
                  />
                  <YAxis 
                    stroke="#71717a" 
                    fontSize={10} 
                    fontFamily="monospace"
                    tickLine={false}
                    axisLine={{ stroke: '#27272a' }}
                    tickFormatter={(value) => `${value.toLocaleString("pt-PT")} Kz`}
                  />
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-zinc-950 border-2 border-neutral-800 p-3 rounded-lg shadow-xl font-mono text-[10px] space-y-1.5">
                            <p className="text-zinc-500 font-bold uppercase">{payload[0].payload.dateStr}</p>
                            <div className="flex items-center gap-2 justify-between">
                              <span className="text-amber-500">Circulação:</span>
                              <strong className="text-white">{(payload[0].value as number).toLocaleString("pt-PT")} Kz</strong>
                            </div>
                            <div className="flex items-center gap-2 justify-between">
                              <span className="text-emerald-400">Reserva BNA:</span>
                              <strong className="text-white">{(payload[1]?.value as number || 0).toLocaleString("pt-PT")} Kz</strong>
                            </div>
                            <div className="text-[8px] text-[#B87333]/70 font-sans border-t border-neutral-900 mt-1 pt-1 text-center font-bold">
                              Rácio: 115% de Cobertura
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area 
                    name="Circulação KwanzaMóvel"
                    type="monotone" 
                    dataKey="circulacao" 
                    stroke="#B87333" 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill="url(#colorCirculation)" 
                  />
                  <Area 
                    name="Reserva de Salvaguarda"
                    type="monotone" 
                    dataKey="reserva" 
                    stroke="#10b981" 
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    fillOpacity={1} 
                    fill="url(#colorReserves)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-[9px] font-mono text-zinc-500 gap-2 bg-[#050505] p-2.5 rounded border border-neutral-900/60">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded bg-[#B87333]" />
                Kwanzas Digitais Emitidos (Circulação Soberana)
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded bg-emerald-500" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 1px, #fff 1px, #fff 2px)' }} />
                Reserva de Fideicomisso (Depósito Escrow 115% BNA)
              </span>
              <span>Sincronizado via barramento SPTR regulado.</span>
            </div>
          </div>

          {/* GRÁFICO COMBINADO: LIQUIDAÇÃO INTERBANCÁRIA E CIRCULAÇÃO MONETÁRIA */}
          <div className="bg-zinc-950 border border-neutral-900 rounded-xl p-5 space-y-4 animate-fade-in" id="bna-settlement-circulation-chart-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-900 pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#B87333]" />
                <div>
                  <h4 className="font-black text-xs uppercase tracking-widest text-white font-mono animate-pulse">Histórico de Circulação & Liquidação</h4>
                  <p className="text-[9px] text-zinc-500 uppercase font-mono">Volume de Liquidação Interbancária vs Circulação Monetária Total</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] uppercase font-black px-2.5 py-1 rounded bg-[#B87333]/10 text-[#B87333] border border-[#B87333]/20">
                  Média de Liquidação: {(2415000).toLocaleString("pt-PT")} Kz/Dia
                </span>
              </div>
            </div>

            <div className="w-full h-72 md:h-80" id="bna-settlement-circulation-chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={getCirculationAndSettlementHistory()}
                  margin={{ top: 15, right: 15, left: -5, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1c1917" vertical={false} />
                  <XAxis 
                    dataKey="dateStr" 
                    stroke="#71717a" 
                    fontSize={10} 
                    fontFamily="monospace"
                    tickLine={false}
                    axisLine={{ stroke: '#27272a' }}
                  />
                  <YAxis 
                    yAxisId="left"
                    stroke="#71717a" 
                    fontSize={10} 
                    fontFamily="monospace"
                    tickLine={false}
                    axisLine={{ stroke: '#27272a' }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k Kz`}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    stroke="#71717a" 
                    fontSize={10} 
                    fontFamily="monospace"
                    tickLine={false}
                    axisLine={{ stroke: '#27272a' }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k Kz`}
                  />
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-zinc-950 border border-neutral-800 p-3 rounded-lg shadow-xl font-mono text-[10px] space-y-1.5">
                            <p className="text-zinc-500 font-bold uppercase">{payload[0].payload.dateStr}</p>
                            <div className="flex items-center gap-2 justify-between">
                              <span className="text-[#B87333]">Circulação Monetária:</span>
                              <strong className="text-white">{(payload[0].value as number).toLocaleString("pt-PT")} Kz</strong>
                            </div>
                            <div className="flex items-center gap-2 justify-between">
                              <span className="text-[#e29352]">Volume Liquidação:</span>
                              <strong className="text-white">{(payload[1]?.value as number || 0).toLocaleString("pt-PT")} Kz</strong>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '9px', fontFamily: 'monospace', paddingTop: '10px' }}
                    verticalAlign="bottom"
                    height={36}
                  />
                  <Area 
                    yAxisId="left"
                    name="Circulação Monetária Total"
                    type="monotone" 
                    dataKey="circulacao" 
                    stroke="#B87333" 
                    strokeWidth={2}
                    fillOpacity={0.15} 
                    fill="#B87333" 
                  />
                  <Bar 
                    yAxisId="right"
                    name="Volume de Liquidação Interbancária"
                    dataKey="volumeLiquidacao" 
                    barSize={20}
                    fill="#e29352" 
                    radius={[4, 4, 0, 0]}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-[9px] font-mono text-zinc-500 gap-2 bg-[#050505] p-2.5 rounded border border-neutral-900/60">
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded bg-[#B87333] opacity-80" />
                Área de Circulação: Escala Esquerda (KwanzaMóvel em posse do público)
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded bg-[#e29352]" />
                Barras de Liquidação: Escala Direita (Volume liquidado centralizadamente)
              </span>
              <span>Canal síncrono SPTR / RTGS</span>
            </div>
          </div>

          {/* RISK CONTROLS & LIVE NOTIFICATION CENTER */}
          <div className="bg-zinc-950 border border-neutral-900 rounded-xl p-4.5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-900 pb-3">
              <div className="flex items-center gap-2">
                <Bell className={`w-4 h-4 ${(isVolumeCritical || isPendingCritical || isCirculationCritical || isLiquidityCritical || hasLargeTxAlert || activeFraudAlerts.length > 0) ? "text-red-500 animate-bounce" : "text-[#B87333]"}`} />
                <div>
                  <h4 className="font-black text-xs uppercase tracking-widest text-white font-mono">Central de Riscos & Notificações</h4>
                  <p className="text-[9px] text-zinc-500 uppercase font-mono">Monitor de Regulação em Tempo Real</p>
                </div>
              </div>
              <div className="flex gap-1.5 font-mono">
                <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded border ${
                  (isVolumeCritical || isPendingCritical || isCirculationCritical || isLiquidityCritical || hasLargeTxAlert || activeFraudAlerts.length > 0) 
                    ? "bg-red-950/45 text-red-300 border-red-900/65" 
                    : "bg-emerald-950/40 text-emerald-300 border-emerald-905"
                }`}>
                  Status: {(isVolumeCritical || isPendingCritical || isCirculationCritical || isLiquidityCritical || hasLargeTxAlert || activeFraudAlerts.length > 0) ? "ALERTA ATIVO / SUSPEITO" : "CONFORME"}
                </span>
              </div>
            </div>

            {/* Live Alerts Stream */}
            <div className="space-y-2.5">
              {!(isVolumeCritical || isPendingCritical || isCirculationCritical || isLiquidityCritical || hasLargeTxAlert || activeFraudAlerts.length > 0) ? (
                <div className="flex items-center gap-2 p-3 bg-emerald-950/15 border border-emerald-900/40 rounded-xl text-emerald-350 text-[10.5px] font-mono">
                  <CheckCircle className="w-4 h-4 text-emerald-450 shrink-0" />
                  <div className="space-y-0.5">
                    <strong>SISTEMA EM CONFORMIDADE ABSOLUTA</strong>
                    <p className="text-[9.5px] text-zinc-400">Nenhum limite de tráfego crítico ultrapassado. Escrow de custódia e saldos 100% sintonizados.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* FRAUD DETECTION ALERTS */}
                  {fraudEnabled && activeFraudAlerts.length > 0 && (
                    <div className="p-3 bg-red-955/10 border-l-4 border-red-650 rounded-lg flex flex-col gap-3 text-red-100 text-[10px] sm:text-[11px] font-mono leading-relaxed animate-fade-in shadow-md">
                      <div className="flex gap-2.5 items-start">
                        <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5 animate-pulse" />
                        <div className="flex-grow space-y-1">
                          <strong className="text-red-400 block uppercase font-black text-[10px] tracking-wide">[ALERTA EXTREMO] ATIVIDADE DE FRAUDE REGISTADA</strong>
                          <span>O barramento de segurança síncrona do BNA identificou <strong className="text-white">{activeFraudAlerts.length} transações suspeitas</strong> violando limites ativos:</span>
                          
                          <div className="mt-2 space-y-1.5 max-h-36 overflow-y-auto scrollbar-thin">
                            {activeFraudAlerts.map(tx => (
                              <div key={tx.id} className="bg-black/80 border border-red-500/20 rounded p-2 flex flex-col text-[9px] gap-1">
                                <div className="flex items-center justify-between text-[8px] text-zinc-500">
                                  <span className="text-red-400 font-bold font-mono">TX: {tx.id}</span>
                                  <span>{new Date(tx.timestamp).toLocaleTimeString()}</span>
                                </div>
                                <div className="text-left text-zinc-300">
                                  Origem: <strong className="text-white">{tx.senderPhone}</strong> &rarr; Destino: <strong className="text-white">{tx.receiverPhone}</strong> • Montante: <strong className="text-red-400">{tx.amount.toLocaleString("pt-PT")} Kz</strong>
                                </div>
                                <div className="text-[8px] text-amber-500 font-sans leading-tight border-t border-neutral-900/60 pt-1 flex items-start gap-1">
                                  <MapPin className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                                  <span><strong>Regra Violada:</strong> {tx.fraudAlertReason}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* High Value Transaction Alert */}
                  {hasLargeTxAlert && (
                    <div className="p-3 bg-amber-955/10 border-l-4 border-amber-500 rounded-lg flex flex-col gap-3 text-amber-100 text-[10px] sm:text-[11px] font-mono leading-relaxed animate-fade-in shadow-md">
                      <div className="flex gap-2.5 items-start">
                        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                        <div className="flex-grow space-y-1">
                          <strong className="text-amber-400 block uppercase font-black text-[10px] tracking-wide">[NOTIFICAÇÃO] TRANSAÇÃO DE ALTO VALOR DETECTADA</strong>
                          <span>Foram efetuados movimentos cujo montante excede o limite estabelecido de <strong className="text-white">{largeTxThreshold.toLocaleString("pt-PT")} Kz</strong>:</span>
                          
                          {/* List of Large Transactions with specific details */}
                          <div className="mt-2 space-y-1.5 max-h-36 overflow-y-auto scrollbar-thin">
                            {largeTransactions.map(tx => (
                              <div key={tx.id} className="bg-black/60 border border-amber-500/20 rounded p-2 flex items-center justify-between text-[9px] gap-2">
                                <div className="space-y-0.5 text-left">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-zinc-500 font-bold font-mono">{tx.id}</span>
                                    <span className="text-white">Origem: <strong className="text-zinc-300 font-sans">{tx.senderPhone}</strong> • Destino: <strong className="text-zinc-300 font-sans">{tx.receiverPhone}</strong></span>
                                  </div>
                                  <div className="text-[8.5px] text-zinc-500 font-sans">
                                    Canal: <strong className="uppercase text-[#B87333] font-mono">{tx.type}</strong> • Data/Hora: {new Date(tx.timestamp).toLocaleString("pt-PT")}
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <strong className="text-amber-400 block font-bold font-mono">+{tx.amount.toLocaleString("pt-PT")} Kz</strong>
                                  <span className="text-[7.5px] text-emerald-400 border border-emerald-500/20 bg-emerald-500/5 px-1 rounded font-bold uppercase">{tx.status}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {isVolumeCritical && (
                    <div className="p-3 bg-rose-950/25 border-l-4 border-rose-500 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-100 text-[10px] sm:text-[11px] font-mono leading-relaxed animate-fade-in shadow-md">
                      <div className="flex gap-2.5 items-start">
                        <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5 animate-pulse" />
                        <div>
                          <strong className="text-rose-300 block uppercase font-black text-[10px] tracking-wide">[ALERTA] LIMITE DE VOLUME DIÁRIO EXCEDIDO</strong>
                          <span>Volume operacional consolidado atingiu <strong className="text-white">{dailyTotalTransactVol.toLocaleString("pt-PT")} Kz</strong>, ultrapassando o limiar de {volumeCriticalThreshold.toLocaleString("pt-PT")} Kz definido no estado do BNA.</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          const newThreshold = Math.ceil(dailyTotalTransactVol / 100000) * 100000 + 100000;
                          setBnaState(prev => ({ ...prev, criticalVolumeThreshold: newThreshold }));
                          setBnaFeedback(`Limite de risco regulamentado actualizado para ${newThreshold.toLocaleString("pt-PT")} Kz.`);
                          setTimeout(() => setBnaFeedback(""), 3500);
                        }}
                        className="bg-rose-900/40 hover:bg-rose-900/60 border border-rose-700/50 text-white font-extrabold text-[9px] uppercase px-2.5 py-1.5 rounded transition-all shrink-0 self-start sm:self-auto cursor-pointer"
                      >
                        Subir Limiar (+100K)
                      </button>
                    </div>
                  )}

                  {isCirculationCritical && (
                    <div className="p-3 bg-rose-950/25 border-l-4 border-rose-600 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-100 text-[10px] sm:text-[11px] font-mono leading-relaxed animate-fade-in shadow-md">
                      <div className="flex gap-2.5 items-start">
                        <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5 animate-pulse" />
                        <div>
                          <strong className="text-rose-300 block uppercase font-black text-[10px] tracking-wide">[ALERTA] EXCESSO DE CIRCULAÇÃO DE WALLET</strong>
                          <span>O volume total de circulação atingiu <strong className="text-white">{bnaState.totalCirculation.toLocaleString("pt-PT")} Kz</strong>, ultrapassando o limiar personalizado de de {circulationCriticalThreshold.toLocaleString("pt-PT")} Kz.</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          const newThreshold = Math.ceil(bnaState.totalCirculation / 5000) * 5000 + 5000;
                          setBnaState(prev => ({ ...prev, criticalCirculationThreshold: newThreshold }));
                          setBnaFeedback(`Limite de circulação total actualizado para ${newThreshold.toLocaleString("pt-PT")} Kz.`);
                          setTimeout(() => setBnaFeedback(""), 3500);
                        }}
                        className="bg-rose-900/40 hover:bg-rose-900/60 border border-rose-700/50 text-white font-extrabold text-[9px] uppercase px-2.5 py-1.5 rounded transition-all shrink-0 self-start sm:self-auto cursor-pointer"
                      >
                        Subir Limiar (+5K)
                      </button>
                    </div>
                  )}

                  {isPendingCritical && (
                    <div className="p-3 bg-amber-950/25 border-l-4 border-amber-600 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-100 text-[10px] sm:text-[11px] font-mono leading-relaxed animate-fade-in shadow-md">
                      <div className="flex gap-2.5 items-start">
                        <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                        <div>
                          <strong className="text-amber-400 block uppercase font-black text-[10px] tracking-wide">[AVISO] COMPENSAÇÃO DE CUSTÓDIA REQUERIDA (ISO 20022)</strong>
                          <span>Existem <strong className="text-white">{bnaState.pendingSettlementsCount} instruções pacs.008</strong> pendentes de liquidação na câmara SPTR. O limite estabelecido é {pendingCriticalLimit}.</span>
                        </div>
                      </div>
                      <button 
                        onClick={triggerSptrSettlement}
                        className="bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-[9px] uppercase px-2.5 py-1.5 rounded transition-all shrink-0 self-start sm:sm-auto cursor-pointer font-bold"
                      >
                        Compensar SPTR
                      </button>
                    </div>
                  )}

                  {isLiquidityCritical && (
                    <div className="p-3 bg-rose-950/25 border-l-4 border-[#B87333] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-100 text-[10px] sm:text-[11px] font-mono leading-relaxed animate-fade-in shadow-md">
                      <div className="flex gap-2.5 items-start">
                        <AlertTriangle className="w-5 h-5 text-[#B87333] shrink-0 mt-0.5 animate-pulse" />
                        <div>
                          <strong className="text-[#B87333] block uppercase font-black text-[10px] tracking-wide">[ALERTA OPERACIONAL] COBERTURA DE LIQUIDEZ ABAIXO DO MÍNIMO</strong>
                          <span>O rácio de liquidez síncrona atual está em <strong className="text-white">{liquidityRatio}%</strong>, caindo abaixo do limite crítico regulatório de <strong className="text-white">{liquidityCriticalThreshold}%</strong>.</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          const newThreshold = Math.max(50, Math.floor(liquidityRatio) - 5);
                          setBnaState(prev => ({ ...prev, criticalLiquidityThreshold: newThreshold }));
                          setBnaFeedback(`Limite de liquidez ajustado para ${newThreshold}% para adequação temporária.`);
                          setTimeout(() => setBnaFeedback(""), 3500);
                        }}
                        className="bg-[#B87333]/30 hover:bg-[#B87333]/50 border border-[#B87333]/40 text-white font-extrabold text-[9px] uppercase px-2.5 py-1.5 rounded transition-all shrink-0 self-start sm:self-auto cursor-pointer font-bold"
                      >
                        Ajustar Limp (-5%)
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* RISK CONTROLS PARAMETERS IN BNA STATE */}
            <div className="bg-[#050505] p-3 rounded-lg border border-neutral-900 space-y-3">
              <span className="text-[9px] uppercase font-black tracking-widest text-[#B87333] font-mono block flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[#B87333]" />
                Limites de Risco Regulador (Definidos no Estado do BNA)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                
                {/* Volume slider */}
                <div className="space-y-1.5 bg-[#0a0a0a] p-2.5 rounded-lg border border-neutral-900/40">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-zinc-500 uppercase">Volume Diário Crítico:</span>
                    <strong className="text-white">{volumeCriticalThreshold.toLocaleString("pt-PT")} Kz</strong>
                  </div>
                  <input 
                    type="range"
                    min="2350000"
                    max="3000000"
                    step="25000"
                    value={volumeCriticalThreshold}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      updateRiskParam("criticalVolumeThreshold", val, "Volume Diário Crítico", `${val.toLocaleString("pt-PT")} Kz`);
                    }}
                    className="w-full accent-[#B87333] bg-neutral-900 h-1 rounded-lg cursor-pointer"
                  />
                  <span className="text-[8.5px] text-zinc-505 font-mono block">Define o limiar de alerta de tráfego diário.</span>
                </div>

                {/* Circulation volume threshold slider */}
                <div className="space-y-1.5 bg-[#0a0a0a] p-2.5 rounded-lg border border-neutral-900/40">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-zinc-500 uppercase">Circulação Crítica:</span>
                    <strong className="text-white">{circulationCriticalThreshold.toLocaleString("pt-PT")} Kz</strong>
                  </div>
                  <input 
                    type="range"
                    min="10000"
                    max="200000"
                    step="2500"
                    value={circulationCriticalThreshold}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      updateRiskParam("criticalCirculationThreshold", val, "Circulação Crítica", `${val.toLocaleString("pt-PT")} Kz`);
                    }}
                    className="w-full accent-[#B87333] bg-neutral-900 h-1 rounded-lg cursor-pointer"
                  />
                  <span className="text-[8.5px] text-zinc-505 font-mono block">Define o limiar de Kwanzas emitidos na totalidade.</span>
                </div>

                {/* Pending count slider */}
                <div className="space-y-1.5 bg-[#0a0a0a] p-2.5 rounded-lg border border-neutral-900/40">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-zinc-500 uppercase">Limite pacs.008 Pendentes:</span>
                    <strong className="text-white">{pendingCriticalLimit} transações</strong>
                  </div>
                  <input 
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={pendingCriticalLimit}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      updateRiskParam("criticalPendingLimit", val, "Limite pacs.008 Pendentes", `${val} transações`);
                    }}
                    className="w-full accent-[#B87333] bg-neutral-900 h-1 rounded-lg cursor-pointer"
                  />
                  <span className="text-[8.5px] text-zinc-505 font-mono block">Define o tamanho tolerado da fila de compensação.</span>
                </div>

                {/* Liquidity minimum threshold slider */}
                <div className="space-y-1.5 bg-[#0a0a0a] p-2.5 rounded-lg border border-neutral-900/40">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-zinc-500 uppercase font-black">Mínimo Liquidez:</span>
                    <strong className="text-[#B87333] font-black">{liquidityCriticalThreshold}%</strong>
                  </div>
                  <input 
                    type="range"
                    min="50"
                    max="150"
                    step="5"
                    value={liquidityCriticalThreshold}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      updateRiskParam("criticalLiquidityThreshold", val, "Mínimo Liquidez", `${val}%`);
                    }}
                    className="w-full accent-[#B87333] bg-neutral-900 h-1 rounded-lg cursor-pointer"
                  />
                  <span className="text-[8.5px] text-zinc-505 font-mono block">Alerta se a cobertura ficar aquém do limiar.</span>
                </div>

                {/* High value transaction threshold slider */}
                <div className="space-y-1.5 bg-[#0a0a0a] p-2.5 rounded-lg border border-amber-500/20 shadow-sm shadow-amber-950/10">
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-[#B87333] uppercase font-black">Limiar Alto Valor:</span>
                    <strong className="text-amber-400 font-black">{largeTxThreshold.toLocaleString("pt-PT")} Kz</strong>
                  </div>
                  
                  {/* High-precision numeric input */}
                  <div className="flex gap-1">
                    <input 
                      type="number"
                      min="1"
                      placeholder="Valor Limite"
                      value={largeTxThreshold}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        updateRiskParam("largeTxThreshold", val, "Limiar Alto Valor", `${val.toLocaleString("pt-PT")} Kz`);
                      }}
                      className="w-full bg-black border border-neutral-800 rounded px-1.5 py-1 text-[10px] text-white font-mono focus:border-amber-500/50 outline-none"
                    />
                    <span className="bg-neutral-900 border border-neutral-800 rounded px-1.5 py-1 text-[8px] text-zinc-500 font-mono flex items-center shrink-0">Kz</span>
                  </div>

                  <input 
                    type="range"
                    min="500"
                    max="50000"
                    step="500"
                    value={largeTxThreshold > 50000 ? 50000 : largeTxThreshold}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      updateRiskParam("largeTxThreshold", val, "Limiar Alto Valor", `${val.toLocaleString("pt-PT")} Kz`);
                    }}
                    className="w-full accent-amber-500 bg-neutral-900 h-1 rounded-lg cursor-pointer animate-pulse"
                  />
                  <span className="text-[8.5px] text-zinc-500 font-mono block">Destaca movimentos acima do valor configurado no portal.</span>
                </div>

              </div>
            </div>

          </div>

          {/* SEÇÃO DE CONTROLO DE DETEÇÃO DE FRAUDE BNA */}
          <div className="bg-zinc-950 border border-neutral-900 rounded-xl p-5 space-y-4 animate-fade-in" id="bna-fraud-prevention-section">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-900 pb-3">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" />
                <div>
                  <h4 className="font-black text-xs uppercase tracking-widest text-white font-mono">Deteção & Prevenção de Fraudes (Norma BNA-2026)</h4>
                  <p className="text-[9px] text-zinc-500 uppercase font-mono">Controle de Velocidade Geográfica e Frequência Síncrona</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={fraudEnabled}
                    onChange={(e) => {
                      setBnaState(prev => ({ ...prev, fraudEnabled: e.target.checked }));
                      setBnaFeedback(`Filtro de detecção de fraudes ${e.target.checked ? "ACTIVADO" : "DESACTIVADO"}.`);
                      setTimeout(() => setBnaFeedback(""), 3000);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600 peer-checked:after:bg-white"></div>
                  <span className="ml-2 text-[10px] font-mono font-black uppercase text-zinc-400">
                    {fraudEnabled ? "ATIVO" : "INATIVO"}
                  </span>
                </label>
              </div>
            </div>

            {/* Config Sliders Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Slider 1: Impossible Speed */}
              <div className="space-y-1.5 bg-[#050505] p-3 rounded-lg border border-neutral-900">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-zinc-500 uppercase">Velocidade Limite Geo:</span>
                  <strong className="text-red-400 font-bold">{fraudGeoVelocityLimit} km/h</strong>
                </div>
                <input 
                  type="range"
                  min="50"
                  max="1000"
                  step="50"
                  value={fraudGeoVelocityLimit}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setBnaState(prev => ({ ...prev, fraudGeoVelocityLimit: val }));
                  }}
                  disabled={!fraudEnabled}
                  className="w-full accent-red-500 bg-neutral-900 h-1 rounded-lg cursor-pointer disabled:opacity-30"
                />
                <span className="text-[8.5px] text-zinc-500 font-mono block leading-normal">
                  Velocidade impossível de viagem permitida entre transações (km/h).
                </span>
              </div>

              {/* Slider 2: Max Tx Count in Window */}
              <div className="space-y-1.5 bg-[#050505] p-3 rounded-lg border border-neutral-900">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-zinc-500 uppercase">Transações Limite:</span>
                  <strong className="text-red-400 font-bold">{fraudTxFrequencyLimit} txs</strong>
                </div>
                <input 
                  type="range"
                  min="2"
                  max="10"
                  step="1"
                  value={fraudTxFrequencyLimit}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setBnaState(prev => ({ ...prev, fraudTxFrequencyLimit: val }));
                  }}
                  disabled={!fraudEnabled}
                  className="w-full accent-red-500 bg-neutral-900 h-1 rounded-lg cursor-pointer disabled:opacity-30"
                />
                <span className="text-[8.5px] text-zinc-500 font-mono block leading-normal">
                  Quantidade máxima de lançamentos permitida na janela de tempo.
                </span>
              </div>

              {/* Slider 3: Time Window size */}
              <div className="space-y-1.5 bg-[#050505] p-3 rounded-lg border border-neutral-900">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-zinc-500 uppercase">Janela Temporal:</span>
                  <strong className="text-red-400 font-bold">{fraudTxTimeWindow} seg</strong>
                </div>
                <input 
                  type="range"
                  min="10"
                  max="600"
                  step="10"
                  value={fraudTxTimeWindow}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setBnaState(prev => ({ ...prev, fraudTxTimeWindow: val }));
                  }}
                  disabled={!fraudEnabled}
                  className="w-full accent-red-500 bg-neutral-900 h-1 rounded-lg cursor-pointer disabled:opacity-30"
                />
                <span className="text-[8.5px] text-zinc-500 font-mono block leading-normal">
                  Janela em segundos para aferição de frequência de rajada.
                </span>
              </div>
            </div>

            {/* Test Simulation Controls */}
            <div className="bg-[#0c0505] border border-red-950/40 p-3 rounded-lg space-y-2.5">
              <span className="text-[9.5px] font-mono font-black text-red-450 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-red-500" />
                SIMULADOR DE VECTORES DE FRAUDE (AMBIENTE DE TESTE DO REGULADOR)
              </span>
              <p className="text-[10px] text-zinc-400 leading-normal">
                Clique nos botões abaixo para forjar e injetar fluxos de transações síncronas que violam as regras do BNA no ledger síncrono imediatamente:
              </p>
              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={simulateImpossibleTravel}
                  disabled={!fraudEnabled}
                  className="flex-1 min-w-[200px] bg-red-950/20 hover:bg-red-950/40 border border-red-500/30 hover:border-red-500/60 text-red-400 font-bold text-[9.5px] uppercase py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <MapPin className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                  <span>Injetar Salto Geográfico Impossível</span>
                </button>
                <button
                  onClick={simulateHighFrequencyBurst}
                  disabled={!fraudEnabled}
                  className="flex-1 min-w-[200px] bg-red-950/20 hover:bg-red-950/40 border border-red-500/30 hover:border-red-500/60 text-red-400 font-bold text-[9.5px] uppercase py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Clock className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                  <span>Injetar Rajada de Alta Frequência</span>
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-900/40 pb-2">
                <span className="text-[10px] uppercase font-black text-zinc-450 font-mono tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-zinc-400" />
                  Monitorização do Ledger de Segurança & Risco
                </span>
                
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => {
                      const nextVal = !filterRiskOnly;
                      setFilterRiskOnly(nextVal);
                      logAuditEvent(
                        "acesso", 
                        nextVal ? "Activação de Filtro de Risco" : "Desactivação de Filtro de Risco", 
                        nextVal ? "Filtro de transações de risco (Score > 0.05) activado pelo regulador" : "Filtro de transações de risco desactivado", 
                        nextVal ? "alerta" : "sucesso"
                      );
                    }}
                    className={`font-mono text-[9px] uppercase font-black px-2.5 py-1 rounded border transition-all cursor-pointer flex items-center gap-1 ${
                      filterRiskOnly
                        ? "bg-amber-550/20 text-amber-400 border-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.15)]"
                        : "bg-neutral-900 text-zinc-500 border-neutral-800 hover:border-neutral-700 hover:text-zinc-300"
                    }`}
                    id="bna-filter-risk-score-btn"
                  >
                    <ShieldAlert className="w-3 h-3 text-amber-500" />
                    <span>Filtrar Risco &gt; 0.05</span>
                  </button>

                  <span className="text-[8.5px] font-mono text-zinc-500">
                    Mostrando <strong>{filteredTransactionsList.length}</strong> de <strong>{analyzedTransactionsList.length}</strong> txs
                  </span>
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1 scrollbar-thin border border-neutral-900 rounded-lg p-2 bg-neutral-950/45">
                {filteredTransactionsList.length === 0 ? (
                  <div className="text-center py-8 text-zinc-550 text-[10px] font-mono uppercase tracking-wider italic">
                    Sem transações registadas que correspondam aos filtros activos de risco.
                  </div>
                ) : (
                  filteredTransactionsList.map((tx) => {
                    const isHighValue = tx.amount >= largeTxThreshold;
                    const isFraud = tx.isFraudAlert;
                    const isHighRiskScore = tx.fraudScore !== undefined && tx.fraudScore > 0.05;

                    return (
                      <div 
                        key={tx.id} 
                        className={`p-2.5 rounded-lg border text-[10px] font-mono space-y-1.5 transition-all duration-200 ${
                          isFraud 
                            ? "bg-red-955/15 border-red-500/50 text-red-100 shadow-inner" 
                            : isHighRiskScore
                              ? "bg-[#160f08] border-amber-500/60 text-amber-100 shadow-[0_0_10px_rgba(245,158,11,0.1)]"
                              : isHighValue 
                                ? "bg-amber-95/10 border-amber-500/30 text-amber-100" 
                                : "bg-[#050505] border-neutral-900/60 text-zinc-300"
                        }`}
                      >
                        {/* Row 1: ID, status, date */}
                        <div className="flex justify-between items-center text-[8.5px]">
                          <span className="font-bold flex items-center gap-1">
                            {isFraud ? (
                              <span className="bg-red-500 text-black px-1 py-0.2 rounded font-black text-[7.5px] uppercase animate-pulse">
                                FRAUDE DETECTADA
                              </span>
                            ) : isHighRiskScore ? (
                              <span className="bg-amber-600/90 text-white px-1.5 py-0.2 rounded font-black text-[7.5px] uppercase flex items-center gap-1">
                                <ShieldAlert className="w-2.5 h-2.5 animate-bounce text-white" />
                                RISCO ALTO ({(tx.fraudScore * 100).toFixed(0)}%)
                              </span>
                            ) : isHighValue ? (
                              <span className="bg-amber-500 text-black px-1 py-0.2 rounded font-black text-[7.5px] uppercase">
                                ALTO VALOR
                              </span>
                            ) : (
                              <span className="text-zinc-550 flex items-center gap-1.5">
                                <span>ID: {tx.id}</span>
                                {tx.fraudScore !== undefined && tx.fraudScore > 0 && (
                                  <span className="text-zinc-650 text-[8px] font-mono">(Score: {(tx.fraudScore * 100).toFixed(0)}%)</span>
                                )}
                              </span>
                            )}
                          </span>
                          <span className="text-zinc-550 font-mono">{new Date(tx.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</span>
                        </div>

                        {/* Row 2: Sender/Receiver & amount */}
                        <div className="flex justify-between items-center">
                          <span className="text-[9.5px]">
                            <strong className="text-zinc-400 font-sans">{tx.senderPhone}</strong>
                            <span className="text-zinc-600 mx-1">&rarr;</span>
                            <strong className="text-zinc-400 font-sans">{tx.receiverPhone}</strong>
                          </span>
                          <strong className={`font-black text-[11px] ${
                            isFraud ? "text-red-400" : isHighRiskScore ? "text-amber-400" : isHighValue ? "text-amber-400" : "text-emerald-400"
                          }`}>
                            +{tx.amount.toLocaleString("pt-PT")} Kz
                          </strong>
                        </div>

                        {/* Row 3: Location details & analytics speed */}
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[8px] text-zinc-500 border-t border-neutral-900/40 pt-1">
                          <span className="flex items-center gap-1 font-sans">
                            <MapPin className={`w-3.5 h-3.5 ${isFraud ? "text-red-400" : isHighRiskScore ? "text-amber-500 animate-pulse" : "text-zinc-500"}`} />
                            <strong className="text-zinc-400">{tx.locationName}</strong>
                            <span className="text-zinc-600 font-mono">({tx.latitude?.toFixed(4)}, {tx.longitude?.toFixed(4)})</span>
                          </span>

                          {tx.calculatedSpeed !== null && tx.calculatedSpeed !== undefined && (
                            <span className="font-mono text-[8px]">
                              Velocidade: <strong className={tx.calculatedSpeed > fraudGeoVelocityLimit ? "text-red-400 font-bold" : "text-zinc-450"}>{Math.round(tx.calculatedSpeed)} km/h</strong>
                              <span className="text-zinc-600"> ({Math.round(tx.calculatedDistanceKm || 0)}km em {tx.calculatedTimeDiffMins?.toFixed(1)}m)</span>
                            </span>
                          )}

                          {tx.txsInWindow !== undefined && tx.txsInWindow > 1 && (
                            <span className="font-mono text-[8px]">
                              Frequência: <strong className={tx.txsInWindow > fraudTxFrequencyLimit ? "text-red-400 font-bold" : "text-zinc-450"}>{tx.txsInWindow} txs</strong>
                              <span className="text-zinc-600"> em {fraudTxTimeWindow}s</span>
                            </span>
                          )}
                        </div>

                        {/* Row 4: Reason alert banner if fraudulent */}
                        {isFraud && tx.fraudAlertReason && (
                          <div className="p-2 bg-red-955/35 border border-red-500/20 text-red-350 text-[8.5px] rounded font-sans leading-tight mt-1">
                            <strong>MÓDULO ALERTA DE RISCO:</strong> {tx.fraudAlertReason}
                          </div>
                        )}
                        
                        {/* Row 5: High risk score informational banner */}
                        {!isFraud && isHighRiskScore && (
                          <div className="p-2 bg-amber-950/20 border border-amber-500/20 text-amber-200 text-[8.5px] rounded font-sans leading-tight mt-1 flex items-center gap-1.5">
                            <span className="inline-block w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping shrink-0" />
                            <span><strong>Pendente de Auditoria:</strong> Operação possui score de risco de {(tx.fraudScore * 100).toFixed(0)}% (excede limiar regulatório de 5%).</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* PAINEL DE RELATÓRIO DE 7 DIAS (IMPRESSÃO DE PDF SIMULADA) */}
          <div className="bg-zinc-950 border border-neutral-900 rounded-xl p-4.5 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-900/60 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#B87333]" />
                <div>
                  <h4 className="font-black text-xs uppercase tracking-widest text-white font-mono">Relatórios Semanais Automáticos (7 Dias)</h4>
                  <p className="text-[9px] text-zinc-500 uppercase font-mono">Auditoria Consolidada e Despacho PDF do BNA</p>
                </div>
              </div>
              <span className="text-[8px] font-mono text-[#B87333] uppercase font-black bg-[#B87333]/10 border border-[#B87333]/20 px-2 py-0.5 rounded">
                Pronto para Revisão
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-8 space-y-2">
                <p className="text-[11.5px] text-zinc-400">
                  Com base no histórico dos últimos <strong>7 dias</strong> de circulação e auditoria criptográfica, o sistema consolida o tráfego operacional offline do <strong>KwanzaMóvel</strong>, indicando a taxa de integridade AML e salvaguarda do fideicomisso depositado.
                </p>
                
                {/* 7 Days Preview mini chart bars */}
                <div className="bg-[#050505] border border-neutral-900/60 rounded-lg p-3 space-y-2">
                  <span className="text-[8.5px] uppercase font-black tracking-widest text-[#B87333]/70 font-mono block">
                    Grafico Multi-Canal: Histórico de Volumes de Liquidação
                  </span>
                  <div className="grid grid-cols-7 gap-1 bg-[#120d0b]/40 rounded p-1 border border-neutral-950">
                    {getLast7DaysData().map((dayData, idx) => {
                      const maxVol = 2650000;
                      const heightPercent = Math.min(100, Math.max(20, (dayData.volume / maxVol) * 100));
                      const isToday = idx === 6;
                      return (
                        <div key={idx} className="flex flex-col items-center justify-end h-24 space-y-1">
                          <div className="text-[7.5px] text-zinc-500 font-mono scale-90">
                            {Math.round(dayData.volume / 1000)}k
                          </div>
                          <div className="w-full relative group px-1">
                            <div 
                              className={`w-full rounded-t transition-all duration-300 ${
                                isToday 
                                  ? "bg-gradient-to-t from-orange-600 to-amber-400 h-full" 
                                  : "bg-zinc-800 hover:bg-[#B87333]/50 h-full"
                              }`}
                              style={{ height: `${heightPercent}%` }}
                            />
                            {/* Simple Tooltip on Hover */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-zinc-950 border border-neutral-800 text-[8px] text-white p-1 rounded font-mono whitespace-nowrap z-30">
                              Vol: {dayData.volume.toLocaleString("pt-PT")} Kz<br/>
                              Transações: {dayData.countTx}
                            </div>
                          </div>
                          <div className={`text-[7.5px] font-mono whitespace-nowrap truncate max-w-full ${isToday ? "text-[#B87333] font-bold" : "text-zinc-650"}`}>
                            {dayData.dateStr.split(" ")[0]} {dayData.dateStr.split(" ")[1]}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Action and Configuration col */}
              <div className="md:col-span-4 bg-[#050505] border border-neutral-900/60 rounded-lg p-3.5 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div>
                    <label className="text-[8.5px] font-mono uppercase font-black text-zinc-500 block">Auditor Titular (Manual):</label>
                    <input 
                      type="text" 
                      value={reportAuditor}
                      onChange={(e) => setReportAuditor(e.target.value)}
                      className="w-full bg-[#0d0d0d] border border-neutral-900 rounded p-1.5 text-[10.5px] text-white font-mono outline-none focus:border-[#B87333]/60"
                    />
                  </div>
                  <div>
                    <label className="text-[8.5px] font-mono uppercase font-black text-zinc-500 block">Observação Executiva BNA:</label>
                    <textarea 
                      value={customReportObs}
                      onChange={(e) => setCustomReportObs(e.target.value)}
                      rows={2}
                      className="w-full bg-[#0d0d0d] border border-neutral-900 rounded p-1.5 text-[10px] text-zinc-100 font-sans outline-none focus:border-[#B87333]/60 resize-none leading-normal"
                      placeholder="Adicione notas ao despacho..."
                    />
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsGeneratingReport(true);
                    setBnaFeedback("A agregar saldos históricos e assinaturas mTLS...");
                    setTimeout(() => {
                      setBnaFeedback("A calcular índices de conformidade...");
                      setTimeout(() => {
                        setIsGeneratingReport(false);
                        setIsReportOpen(true);
                        setBnaFeedback("");
                      }, 1000);
                    }, 1000);
                  }}
                  disabled={isGeneratingReport}
                  className="w-full py-2 bg-gradient-to-r from-amber-600 to-[#B87333] hover:from-amber-700 hover:to-[#9E5F27] text-white text-[10.5px] uppercase font-black rounded-lg tracking-wider transition-all duration-200 cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1.5 shadow"
                >
                  {isGeneratingReport ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>A Compilar PDF...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-3.5 h-3.5 animate-pulse" />
                      <span>Gerar Relatório de 7 Dias</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Regulatory Audit compliance status */}
          <div className="bg-gradient-to-r from-zinc-950 to-[#0e0a08] p-3.5 border border-neutral-900 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#B87333]" />
              <div>
                <strong className="text-white block uppercase text-[11px]">Estado do Compliance BNA</strong>
                <span className="text-[9.5px] text-zinc-450 block font-mono">Reserva de Fideicomisso: <strong>0 Discrepâncias</strong> ({transactions.length} transacções registadas)</span>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
              <button
                onClick={handleExportCSV}
                className="bg-[#B87333]/10 hover:bg-[#B87333]/20 border border-[#B87333]/20 text-[#f5c290] font-bold text-[9.5px] uppercase px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow"
                title="Exportar histórico de transações em formato CSV para fins de auditoria"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar CSV</span>
              </button>
              <button
                onClick={handleExportPDFReport}
                className="bg-[#B87333]/25 hover:bg-[#B87333]/40 border border-[#B87333]/40 text-white font-bold text-[9.5px] uppercase px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow"
                title="Gerar e exportar o relatório de auditoria e liquidez em formato PDF Oficial"
              >
                <FileText className="w-3.5 h-3.5 text-[#f5c290]" />
                <span>Gerar PDF</span>
              </button>
              <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase px-2 py-1 rounded">Certificado</span>
            </div>
          </div>

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: SANDBOX BANCÁRIA (INTERACTIVE BANK RESERVES & CONTROL)  */}
      {/* ------------------------------------------------------------- */}
      {selectedTab === "sandbox_bancos" && (
        <div className="space-y-4 animate-fade-in">
          <span className="text-[10.5px] uppercase font-black font-mono tracking-wider text-zinc-500 block">Custódia na Banca Comercial</span>
          <p className="text-xs text-zinc-400 leading-normal leading-relaxed">
             Altere os depósitos de segurança nas agências do <strong>BAI</strong>, <strong>BFA</strong> e <strong>BIC</strong>. Execute chamadas do SPTR BNA para liquidar as obrigações geradas:
          </p>

          <div className="space-y-2.5">
            {/* BANCO OFICILA BAI */}
            <div className="bg-zinc-950 border border-neutral-900 p-3.5 rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-2">
              <div>
                <strong className="text-xs text-white block uppercase">Banco Angolano de Investimentos (BAI)</strong>
                <span className="text-[10px] text-zinc-550 block font-mono">Conta Escrow Integrada</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-black text-[#B87333]">{formatValue(bnaState.baiReserveBalance)}</span>
                <button
                  onClick={() => handleInjectSandboxLiquidity("BAI", 500000)}
                  className="bg-neutral-900 hover:bg-[#B87333] text-[9px] uppercase font-extrabold text-white px-2 py-1.5 rounded transition-all"
                >
                  +500K Kz
                </button>
              </div>
            </div>

            {/* BANCO DE FOMENTO ANGOLA (BFA) */}
            <div className="bg-zinc-950 border border-neutral-900 p-3.5 rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-2">
              <div>
                <strong className="text-xs text-white block uppercase">Banco de Fomento Angola (BFA)</strong>
                <span className="text-[10px] text-zinc-550 block font-mono">Conta Fideicomisso Ativa</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-black text-[#B87333]">{formatValue(bnaState.bfaReserveBalance)}</span>
                <button
                  onClick={() => handleInjectSandboxLiquidity("BFA", 500000)}
                  className="bg-neutral-900 hover:bg-[#B87333] text-[9px] uppercase font-extrabold text-white px-2 py-1.5 rounded transition-all"
                >
                  +500K Kz
                </button>
              </div>
            </div>

            {/* BANCO BIC */}
            <div className="bg-zinc-950 border border-neutral-900 p-3.5 rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-2">
              <div>
                <strong className="text-xs text-white block uppercase">Banco BIC Angolano</strong>
                <span className="text-[10px] text-zinc-550 block font-mono">Custódia Registada</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-black text-[#B87333]">{formatValue(bnaState.bicReserveBalance)}</span>
                <button
                  onClick={() => handleInjectSandboxLiquidity("BIC", 500000)}
                  className="bg-neutral-900 hover:bg-[#B87333] text-[9px] uppercase font-extrabold text-white px-2 py-1.5 rounded transition-all"
                >
                  +500K Kz
                </button>
              </div>
            </div>

            {/* TOTAL BNA ESCROW backing account */}
            <div className="bg-[#1c120c] border border-[#B87333]/30 p-3.5 rounded-xl flex justify-between items-center text-xs">
              <div>
                <strong className="text-white block uppercase text-[10px]">Garantias Diretas no BNA</strong>
                <span className="text-[9px] font-mono text-[#B87333]">Centralizadas no Banco Central de Angola</span>
              </div>
              <span className="font-mono font-black text-white">{formatValue(bnaState.bnaCustodyBalance)}</span>
            </div>
          </div>

          {/* Settle obligations now */}
          <div className={`p-4 rounded-xl space-y-3 transition-all duration-300 ${
            isPendingCritical 
              ? "bg-amber-950/20 border-2 border-amber-600 shadow-lg shadow-amber-955/30 animate-pulse" 
              : "bg-zinc-950 border border-zinc-900"
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-550 font-mono block flex items-center gap-1.5">
                  {isPendingCritical && <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping inline-block" />}
                  Fila de Compensações Síncronas
                </span>
                <strong className="text-xs text-white">Lote de Instruções Acumuladas no Wallet</strong>
              </div>
              <span className={`font-mono text-xs font-black px-2 py-1 rounded ${
                isPendingCritical ? "bg-amber-500 text-white animate-bounce" : "text-[#B87333] bg-[#B87333]/15"
              }`}>
                {bnaState.pendingSettlementsCount} pacs.008
              </span>
            </div>

            <button
              onClick={triggerSptrSettlement}
              disabled={bnaState.isSettling || bnaState.pendingSettlementsCount === 0}
              className="w-full bg-[#B87333] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#8C5A2B] text-white font-extrabold uppercase text-xs py-3 rounded-lg flex items-center justify-center gap-2 cursor-pointer font-mono"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Compensar & Integrar SPTR ISO 20022</span>
            </button>
          </div>

          {/* SANDBOX REGULATÓRIO & TESTES DE STRESS (BNA CONFORMANCE ENHANCEMENT) */}
          <div className="border border-neutral-900 bg-black/40 p-4 rounded-xl space-y-4 text-left">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-900/60">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-500 animate-pulse" />
                <span className="font-black text-[11px] uppercase tracking-widest text-white font-mono">Sandbox Regulatório do BNA</span>
              </div>
              <span className="text-[8px] px-2 py-0.5 rounded font-mono bg-emerald-500/10 text-emerald-400 font-extrabold uppercase animate-pulse">
                Ambiente de Testes Ativo
              </span>
            </div>

            <p className="text-[10px] text-zinc-400 leading-relaxed font-sans">
              O ecossistema KwanzaMóvel opera em conformidade estrita com as directivas do Banco Nacional de Angola. Use esta consola interativa de Sandbox para emular directivas regulatórias, induzir cenários de stress financeiro e auditar a resiliência do sistema em tempo real.
            </p>

            {/* TWO-COLUMN GRID */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              
              {/* LEFT COLUMN: SCENARIOS & DIRECTIVES (5 COLS) */}
              <div className="md:col-span-5 space-y-4">
                
                {/* STRESS PRESETS */}
                <div className="bg-zinc-950 p-3 rounded-lg border border-neutral-900/80 space-y-2.5 font-mono">
                  <span className="text-zinc-500 uppercase block text-[8px] font-black tracking-wider">Simulador de Cenário / Teste de Stress:</span>
                  
                  <div className="grid grid-cols-2 gap-2 text-[8px] font-black uppercase">
                    <button
                      type="button"
                      onClick={() => handleSelectStressScenario("normal")}
                      className={`p-2 rounded text-center cursor-pointer border transition-all ${
                        stressScenario === "normal"
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-extrabold"
                          : "bg-zinc-900 text-zinc-500 border-neutral-850 hover:text-zinc-350"
                      }`}
                      id="stress-btn-normal"
                    >
                      Padrão Conforme
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => handleSelectStressScenario("reserve_drift")}
                      className={`p-2 rounded text-center cursor-pointer border transition-all ${
                        stressScenario === "reserve_drift"
                          ? "bg-amber-500/15 text-amber-500 border-amber-500/30 font-extrabold"
                          : "bg-zinc-900 text-zinc-500 border-neutral-850 hover:text-zinc-350"
                      }`}
                      id="stress-btn-drift"
                    >
                      Deriva de Saldos
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectStressScenario("liquidity_drain")}
                      className={`p-2 rounded text-center cursor-pointer border transition-all ${
                        stressScenario === "liquidity_drain"
                          ? "bg-red-500/15 text-red-400 border-red-500/30 font-extrabold animate-pulse"
                          : "bg-zinc-900 text-zinc-500 border-neutral-850 hover:text-zinc-350"
                      }`}
                      id="stress-btn-drain"
                    >
                      Falta Liquidez
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectStressScenario("suspicious_activity")}
                      className={`p-2 rounded text-center cursor-pointer border transition-all ${
                        stressScenario === "suspicious_activity"
                          ? "bg-amber-500/15 text-amber-500 border-amber-500/30 font-extrabold"
                          : "bg-zinc-900 text-zinc-500 border-neutral-850 hover:text-zinc-350"
                      }`}
                      id="stress-btn-suspicious"
                    >
                      Alerta Suspeito
                    </button>
                  </div>

                  <div className="text-[8.5px] leading-relaxed text-zinc-400 font-sans border-t border-neutral-900/60 pt-2 bg-black/30 p-1.5 rounded min-h-[50px] flex items-center">
                    <span>
                      {stressScenario === "normal" && "✔️ Sistema equilibrado. Garantia de custódia corresponde exatamente aos fundos em circulação."}
                      {stressScenario === "reserve_drift" && "⚠️ Divergência induzida de saldos para testar alarmes de consistência síncrona."}
                      {stressScenario === "liquidity_drain" && "🛑 Liquidez bancária reduzida a patamares insolventes. Teste de conformidade de liquidez mínima."}
                      {stressScenario === "suspicious_activity" && "🚨 Ativação de acessos suspeitos para testar monitoramento regulatório AML/Geovelocidade."}
                    </span>
                  </div>
                </div>

                {/* DIRECTIVES STATUS */}
                <div className="bg-zinc-950 p-3 rounded-lg border border-neutral-900/80 space-y-2 font-mono">
                  <span className="text-zinc-500 uppercase block text-[8px] font-black tracking-wider">Directivas e Filtros Ativos:</span>
                  
                  <div className="space-y-1.5 text-[8.5px] text-zinc-350">
                    <div className="flex items-center justify-between">
                      <span>Aviso 14/2026 (Liquidez Mínima)</span>
                      <span className={`px-1 rounded font-bold uppercase text-[7px] ${sandboxDirectives.dir14LiquidityRatio ? "bg-emerald-500/15 text-emerald-400" : "bg-zinc-900 text-zinc-500"}`}>ATIVO</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Directiva 09/2026 (Consistência Custódia)</span>
                      <span className={`px-1 rounded font-bold uppercase text-[7px] ${sandboxDirectives.dir09SptrSla ? "bg-emerald-500/15 text-emerald-400" : "bg-zinc-900 text-zinc-500"}`}>ATIVO</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Directiva 04/2026 (Assinatura HSM)</span>
                      <span className={`px-1 rounded font-bold uppercase text-[7px] ${sandboxDirectives.dir04KycLimit ? "bg-emerald-500/15 text-emerald-400" : "bg-zinc-900 text-zinc-500"}`}>ATIVO</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Aviso 02/2026 (Acesso WebAuthn)</span>
                      <span className={`px-1 rounded font-bold uppercase text-[7px] ${sandboxDirectives.dir02BiometricAuth ? "bg-emerald-500/15 text-emerald-400" : "bg-zinc-900 text-zinc-500"}`}>ATIVO</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* RIGHT COLUMN: AUDITOR & COMPLIANCE SEAL (7 COLS) */}
              <div className="md:col-span-7 space-y-3 flex flex-col justify-between">
                
                {/* AUDITOR CONSOLE */}
                <div className="bg-zinc-950 p-3 rounded-lg border border-neutral-900/80 flex-grow flex flex-col justify-between space-y-3 font-mono">
                  
                  <div className="flex justify-between items-center pb-1 border-b border-neutral-900/40">
                    <span className="text-zinc-500 uppercase text-[8px] font-black">Consola de Varredura de Conformidade:</span>
                    <button
                      type="button"
                      onClick={handleRunRegulatoryComplianceAudit}
                      disabled={complianceRunning}
                      className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-black rounded text-[8.5px] uppercase font-black cursor-pointer transition-all flex items-center gap-1"
                      id="run-compliance-audit-btn"
                    >
                      <RefreshCw className={`w-3 h-3 ${complianceRunning ? "animate-spin" : ""}`} />
                      <span>{complianceRunning ? "Verificando..." : "Executar Auditoria"}</span>
                    </button>
                  </div>

                  {/* LOGS TERMINAL */}
                  <div className="bg-black text-zinc-350 p-2.5 rounded border border-neutral-900 text-[8.5px] leading-relaxed h-32 overflow-y-auto font-mono text-left space-y-1">
                    {complianceLogs.length === 0 ? (
                      <span className="text-zinc-650 italic block pt-8 text-center">Aguardando início de auditoria de sandbox regulatório... Clique acima.</span>
                    ) : (
                      complianceLogs.map((log, idx) => (
                        <div key={idx} className="whitespace-pre-wrap">{log}</div>
                      ))
                    )}
                  </div>

                  {/* COMPLIANCE SCORE & CERTIFICATE */}
                  {complianceResults && (
                    <div className="bg-[#050505] p-3 rounded border border-neutral-900/60 animate-fade-in space-y-2 text-left">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-zinc-550 block text-[7px] uppercase font-black">Score de Conformidade BNA</span>
                          <strong className={`text-sm font-black font-mono ${complianceResults.score === 100 ? "text-emerald-400" : "text-amber-500"}`}>
                            {complianceResults.score} / 100
                          </strong>
                        </div>
                        <span className={`p-1 px-1.5 rounded text-[8px] font-black font-sans uppercase flex items-center gap-1 ${
                          complianceResults.score === 100 ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                        }`}>
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>{complianceResults.score === 100 ? "Homologado" : "Ajuste Requerido"}</span>
                        </span>
                      </div>

                      <div className="text-[8px] text-zinc-400 space-y-1 font-sans">
                        <div>
                          <span className="text-zinc-550 font-mono text-[7px] uppercase font-black">Normativas Passadas:</span>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {complianceResults.passedRules.map((r, ri) => (
                              <span key={ri} className="bg-emerald-950/25 text-emerald-400 border border-emerald-950/35 px-1 py-0.5 rounded text-[7px] font-mono">
                                {r.split(":")[0]}
                              </span>
                            ))}
                          </div>
                        </div>

                        {complianceResults.failedRules.length > 0 && (
                          <div className="pt-1">
                            <span className="text-red-400/80 font-mono text-[7px] uppercase font-black">Directivas em Inconformidade:</span>
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {complianceResults.failedRules.map((r, ri) => (
                                <span key={ri} className="bg-red-950/25 text-red-400 border border-red-950/35 px-1 py-0.5 rounded text-[7px] font-mono animate-pulse">
                                  {r.split(":")[0]}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="border-t border-neutral-900/40 pt-1.5 mt-1.5 font-mono text-[7.5px] text-zinc-500 flex justify-between">
                          <span>Cert: <code className="text-zinc-400 select-all">{complianceResults.certificateHash}</code></span>
                          <span>{complianceResults.auditedAt}</span>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

              </div>

            </div>

          </div>

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: RECONCILIAÇÕES (IMMUTABLE INDEXEDDB LEDGER & LOGS)     */}
      {/* ------------------------------------------------------------- */}
      {selectedTab === "reconciliacoes" && (
        <div className="space-y-4 animate-fade-in">
          
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] uppercase font-black tracking-wider text-zinc-500 font-mono">Consolidação síncrona</span>
            <button
              onClick={handleManualReconciliation}
              disabled={syncingAudit}
              className="bg-zinc-950 font-mono border border-neutral-900 hover:border-white text-[9.5px] uppercase font-black text-white px-2.5 py-1.5 rounded-lg flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${syncingAudit ? "animate-spin" : ""}`} />
              <span>Sincronizar Auditoria</span>
            </button>
          </div>

          <p className="text-[11px] text-zinc-400">
             O livro síncrone audita <strong>100% de contrapartida líquida</strong>. Emissão fiduciária de carteiras vs saldo depositado em custódias. Discrepância certificada em 0 Kz:
          </p>

          {/* EXPORTAÇÃO DE DADOS BNA PARA AUDITORIA */}
          <div className="bg-zinc-950 border border-neutral-900/60 p-4 rounded-xl space-y-3 font-mono">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#B87333]" />
                <div>
                  <h4 className="font-bold text-xs text-white uppercase tracking-wider">Relatório de Transações Regulamentado</h4>
                  <p className="text-[8.5px] text-zinc-500 uppercase">Exportar para Auditoria Externa (CSV / PDF Oficial)</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <button
                  onClick={handleExportCSV}
                  className="bg-zinc-900 hover:bg-zinc-800 border border-neutral-800 text-zinc-350 font-black text-[10.5px] uppercase px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer w-full sm:w-auto justify-center"
                >
                  <Download className="w-4 h-4" />
                  <span>Exportar CSV</span>
                </button>
                <button
                  onClick={handleExportPDFReport}
                  className="bg-[#B87333] hover:bg-[#a6622b] text-white font-black text-[10.5px] uppercase px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-md shadow-[#B87333]/15 cursor-pointer w-full sm:w-auto justify-center"
                >
                  <FileText className="w-4 h-4 text-white" />
                  <span>Gerar Relatório PDF</span>
                </button>
              </div>
            </div>
            <div className="text-[9.5px] text-zinc-400 leading-normal flex flex-wrap justify-between items-center border-t border-neutral-900/40 pt-2 gap-1.5">
              <span>Transações disponíveis para exportação: <strong className="text-white font-black">{transactions.length}</strong></span>
              <span className="text-[8.5px] text-zinc-650 font-mono">Conforme Norma RFC 4180 / Codificação UTF-8</span>
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
            {reconciliationLogs.map((log) => (
              <div key={log.id} className="bg-zinc-950 p-3.5 rounded-xl border border-neutral-900 space-y-2">
                <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
                  <div className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle className="w-4 h-4" />
                    <strong className="text-[10px] font-mono tracking-wider uppercase">CONFORME (RECONCILIADO)</strong>
                  </div>
                  <span className="text-[9px] text-zinc-550 font-mono">{new Date(log.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[9.5px] font-mono text-zinc-350">
                  <div>
                    <span className="text-zinc-500 block">Saldos Instruídos:</span>
                    <strong className="text-white">{formatValue(log.totalInstructionsBalance)}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Colateral Bancário:</span>
                    <strong className="text-[#B87333]">{formatValue(log.totalCustodyReserves)}</strong>
                  </div>
                  <div className="col-span-2 flex justify-between border-t border-neutral-900 pt-1 text-[8.5px]">
                    <span className="text-zinc-500">Discrepância Auditada:</span>
                    <strong className="text-emerald-400 uppercase font-black">{formatValue(0)} (Diferença Nula)</strong>
                  </div>
                </div>

                <div className="text-[8.5px] text-zinc-400 italic bg-black p-2 rounded border border-neutral-900/60 leading-normal">
                  "{log.remarks}"
                </div>

                <div className="text-[8px] text-zinc-600 font-mono flex justify-between pt-1 border-t border-neutral-900/30">
                  <span>Auditor: <strong className="text-zinc-450">{log.auditedBy}</strong></span>
                  <span>Ref: {log.cycleId}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-1.5 pt-2 border-t border-neutral-900">
            <span className="text-[10px] uppercase font-black text-zinc-500 font-mono block">Livro Imutável de Transições em Partas Dobradas</span>
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
              {reconciliationEntries.map((entry) => {
                const isHighlighted = entry.amount >= largeTxThreshold;
                return (
                  <div 
                    key={entry.id} 
                    className={`p-2.5 rounded-lg border text-[10px] font-mono space-y-1 transition-all duration-300 ${
                      isHighlighted 
                        ? "bg-amber-950/20 border-amber-500/50 text-amber-200 shadow-sm shadow-amber-950/30 animate-pulse-subtle" 
                        : "bg-[#050505] border-neutral-900 text-zinc-350"
                    }`}
                  >
                    <div className="flex justify-between text-[8px] text-zinc-550">
                      <span className="flex items-center gap-1">
                        ID: {entry.txId}
                        {isHighlighted && (
                          <span className="bg-amber-500 text-black px-1 rounded text-[7px] font-black tracking-wider uppercase">
                            ALTO VALOR
                          </span>
                        )}
                      </span>
                      <span>{new Date(entry.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Débito:</span>
                      <span className={isHighlighted ? "text-amber-300/80" : ""}>{entry.debitAccount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Crédito:</span>
                      <span className={`font-bold ${isHighlighted ? "text-amber-400" : "text-emerald-400"}`}>
                        +{formatValue(entry.amount)}
                      </span>
                    </div>
                    <div className={`text-[8px] flex justify-between pt-1 border-t ${isHighlighted ? "border-amber-500/10 text-amber-555" : "border-neutral-950/40 text-zinc-650"}`}>
                      <span>Audit CRC Root</span>
                      <span className={isHighlighted ? "text-amber-400/80" : "text-teal-400"}>{entry.ledgerRootHash.substring(0, 16)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 4: MENSAGENS ISO 20022 FILA                                */}
      {/* ------------------------------------------------------------- */}
      {selectedTab === "fila_iso" && (
        <div className="space-y-3.5 animate-fade-in">
          
          {/* PAINEL DE OBSERVABILIDADE DA FILA DE SINCRONIZAÇÃO */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-neutral-900 space-y-3 font-mono">
            <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
              <span className="text-[10px] uppercase font-black text-[#B87333] tracking-widest block flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#B87333]" /> Observador Atómico de Fila (Batch Sync)
              </span>
              <span className="text-[9px] text-zinc-500 font-mono">Norma de Completude Atómica BNA</span>
            </div>
            
            <p className="text-[11px] text-zinc-400 leading-normal font-sans">
              Status em tempo real das sincronizações consolidadas em lotes atómicos por mTLS. Os saldos e a liquidação só são atualizados no BNA quando a transação atinge a completude absoluta sem exceções.
            </p>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
              {(!bnaState.syncBatches || bnaState.syncBatches.length === 0) ? (
                <div className="text-center py-4 text-[10px] text-zinc-650 italic">
                  Nenhum lote consolidado sincronizado na sessão atual.
                </div>
              ) : (
                bnaState.syncBatches.map((batch) => {
                  const isSuccess = batch.status === "COMPLETED";
                  return (
                    <div key={batch.id} className={`p-3 rounded-lg border text-[10px] transition-all ${
                      isSuccess ? "bg-emerald-950/10 border-emerald-500/20 text-emerald-300" : "bg-rose-950/10 border-rose-500/20 text-rose-300"
                    }`}>
                      <div className="flex items-center justify-between font-bold border-b border-white/5 pb-1.5 mb-1.5">
                        <span className="flex items-center gap-1">
                          <span className={`h-1.5 w-1.5 rounded-full inline-block ${isSuccess ? "bg-emerald-400" : "bg-rose-500"}`}></span>
                          {batch.id}
                        </span>
                        <span className="text-[9px] text-zinc-500">{new Date(batch.timestamp).toLocaleTimeString("pt-PT")}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-y-1 gap-x-3 text-[9.5px]">
                        <div><strong>Estado:</strong> <span className={isSuccess ? "text-emerald-400 font-black" : "text-rose-400 font-black"}>{batch.status}</span></div>
                        <div><strong>Integridade Atómica:</strong> <span className={isSuccess ? "text-emerald-400" : "text-rose-400"}>{batch.atomicIntegrityVerified ? "VERIFICADA ✓" : "NÃO APLICADA ✗"}</span></div>
                        {batch.checksumHash && (
                          <div className="col-span-2 text-[9px] text-amber-400 font-mono flex items-center gap-1">
                            <strong>Checksum BNA:</strong> <span>{batch.checksumHash}</span>
                            <span className="text-[8px] bg-amber-500/10 border border-amber-500/20 px-1 rounded text-amber-500">CONFORME ✓</span>
                          </div>
                        )}
                        <div><strong>Transações no Lote:</strong> {batch.txCount} u.</div>
                        <div><strong>Total Sincronizado:</strong> {batch.totalAmount.toLocaleString("pt-PT")} Kz</div>
                        <div className="col-span-2"><strong>Tentativas mTLS:</strong> {batch.networkRetries} {batch.networkRetries === 1 ? "tentativa" : "tentativas"} (Recuo Adaptativo)</div>
                        <div className="col-span-2 text-[9px] text-zinc-400 bg-black/30 p-1.5 rounded mt-1 border border-white/5 leading-relaxed font-sans">
                          {batch.systemMessage}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-black tracking-wider text-zinc-500 font-mono">pacs.008.001.08 XML</span>
            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Assinatura Autorizada
            </span>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed font-sans">
            Cada transação gera um payload XML completo em conformidade com o standard global <strong>ISO 20022 (pacs.008)</strong>, com hashes criptográficas SHA-256 e assinatura offline síncrone:
          </p>

          <div className="bg-[#050505] p-4 rounded-xl border border-neutral-900 overflow-x-auto">
            <pre className="text-[9.5px] text-zinc-300 leading-relaxed font-mono whitespace-pre max-h-72 overflow-y-auto scrollbar-thin">
              {bnaState.lastSptrMsgIso20022}
            </pre>
          </div>
          
          <div className="text-[9px] text-[#B87333] font-mono text-center uppercase tracking-widest block">
             CONFORME REQUISITOS DE INTEROPERABILIDADE ISO 20022 BNA
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 5: CONFIGURAÇÃO DE RECUPERAÇÃO (SIMULADOR & NEON MAPPER)  */}
      {/* ------------------------------------------------------------- */}
      {selectedTab === "config_recuperacao" && (
        <RecoveryConfigPortal />
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 6: LOGS DE AUDITORIA DE SEGURANÇA                        */}
      {/* ------------------------------------------------------------- */}
      {selectedTab === "logs_auditoria" && (
        <div className="space-y-4 animate-fade-in" id="bna-tab-audit-logs">
          
          {/* Audit Header and Export Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-950 p-4 rounded-xl border border-neutral-900/60 font-mono">
            <div>
              <span className="text-[10px] uppercase font-black text-[#B87333] tracking-widest block">Painel Regulador</span>
              <strong className="text-sm text-white block">Logs de Auditoria do BNA</strong>
              <p className="text-[9.5px] text-zinc-500 mt-0.5 leading-normal">
                Registo contínuo e imutável de acessos, tentativas de login e alterações sensíveis de limites de risco.
              </p>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleExportAuditLogsJson}
                className="bg-[#B87333] hover:bg-[#8C5A2B] text-white font-black font-mono text-[10px] uppercase px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                id="bna-btn-export-audit-json"
                title="Descarregar histórico completo de auditoria em formato estruturado JSON"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar JSON</span>
              </button>
              
              <button
                onClick={() => {
                  if (confirm("Deseja repor a base de dados de logs para o estado padrão?")) {
                    localStorage.removeItem("bna_audit_logs");
                    window.location.reload();
                  }
                }}
                className="bg-zinc-900 hover:bg-zinc-800 border border-neutral-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 font-bold font-mono text-[9px] uppercase px-3 py-2 rounded-lg transition-all cursor-pointer"
                title="Limpar alterações locais de auditoria e recarregar os registos semente"
              >
                <span>Repor Registos</span>
              </button>
            </div>
          </div>

          {/* Indicators Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="bg-zinc-950 border border-neutral-900/50 p-3 rounded-lg flex items-center gap-3">
              <div className="bg-blue-500/10 p-2 rounded-md font-bold text-center">
                <Database className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <span className="text-[8.5px] text-zinc-500 font-mono block uppercase">Total de Eventos</span>
                <strong className="text-sm text-white font-mono">{auditLogs.length}</strong>
              </div>
            </div>
            
            <div className="bg-zinc-950 border border-neutral-900/50 p-3 rounded-lg flex items-center gap-3">
              <div className="bg-emerald-500/10 p-2 rounded-md font-bold text-center">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <span className="text-[8.5px] text-zinc-500 font-mono block uppercase">Logins com Sucesso</span>
                <strong className="text-sm text-white font-mono">
                  {auditLogs.filter(log => log.category === "login" && (log.status === "sucesso" || log.status === "sucesso_com_mfa")).length}
                </strong>
              </div>
            </div>

            <div className="bg-zinc-950 border border-neutral-900/50 p-3 rounded-lg flex items-center gap-3">
              <div className="bg-rose-500/10 p-2 rounded-md font-bold text-center">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
              </div>
              <div>
                <span className="text-[8.5px] text-zinc-500 font-mono block uppercase">Tentativas de Falha</span>
                <strong className="text-sm text-white font-mono">
                  {auditLogs.filter(log => log.status === "falha" || log.status === "alerta").length}
                </strong>
              </div>
            </div>

            <div className="bg-zinc-950 border border-neutral-900/50 p-3 rounded-lg flex items-center gap-3">
              <div className="bg-amber-500/10 p-2 rounded-md font-bold text-center">
                <Sliders className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <span className="text-[8.5px] text-zinc-500 font-mono block uppercase">Alterações de Risco</span>
                <strong className="text-sm text-white font-mono">
                  {auditLogs.filter(log => log.category === "alteracao_sensivel").length}
                </strong>
              </div>
            </div>
          </div>

          {/* Interactive Live Log Simulator Controls */}
          <div className="bg-neutral-950 border border-neutral-900 p-3 rounded-xl space-y-2.5">
            <span className="text-[9px] font-mono font-black text-amber-450 uppercase tracking-widest flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#B87333]" />
              Painel de Teste de Auditoria Síncrona (Simular Atividades)
            </span>
            <p className="text-[10px] text-zinc-400 leading-normal font-sans">
              Utilize os controlos abaixo para simular tentativas de login de teste, acessos a dados ou modificações regulatórias síncronas que serão imediatamente anexadas à tabela de auditoria abaixo:
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => logAuditEvent("login", "Tentativa de Login (Regulador)", "Sessão de auditoria iniciada com sucesso via hardware FIDO2 USB-C Key", "sucesso_com_mfa")}
                className="flex-1 min-w-[140px] bg-emerald-950/15 hover:bg-emerald-950/30 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 font-bold text-[9px] uppercase py-2 px-2.5 rounded transition-all cursor-pointer flex items-center justify-center gap-1.5"
                id="sim-login-success-btn"
              >
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Simular Login Ok</span>
              </button>
              
              <button
                onClick={() => {
                  const ips = ["198.51.100.42", "203.0.113.195", "185.220.101.5", "82.102.23.12"];
                  const randIp = ips[Math.floor(Math.random() * ips.length)];
                  const idNum = auditLogs.length + 1;
                  const newLog = {
                    id: `AUD-${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}${new Date().getDate().toString().padStart(2, '0')}-${idNum.toString().padStart(3, '0')}`,
                    timestamp: new Date().toISOString(),
                    category: "login" as const,
                    eventName: "Tentativa de Login (Regulador)",
                    user: "Desconhecido (Operador Não-Autorizado)",
                    ipAddress: randIp,
                    status: "falha" as const,
                    details: "Tentativa de intrusão detectada - Credenciais inválidas sob VPN corporativa"
                  };
                  setAuditLogs(prev => [newLog, ...prev]);
                }}
                className="flex-1 min-w-[140px] bg-red-955/10 hover:bg-red-955/20 border border-red-500/25 hover:border-red-500/40 text-red-400 font-bold text-[9px] uppercase py-2 px-2.5 rounded transition-all cursor-pointer flex items-center justify-center gap-1.5"
                id="sim-login-fail-btn"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                <span>Simular Falha Login</span>
              </button>

              <button
                onClick={() => logAuditEvent("acesso", "Acesso às Configurações de Risco", "Utilizador visualizou o painel de limites de conformidade AML", "sucesso")}
                className="flex-1 min-w-[140px] bg-blue-950/15 hover:bg-blue-950/30 border border-blue-500/20 hover:border-blue-500/40 text-blue-400 font-bold text-[9px] uppercase py-2 px-2.5 rounded transition-all cursor-pointer flex items-center justify-center gap-1.5"
                id="sim-access-btn"
              >
                <Sliders className="w-3.5 h-3.5 text-blue-400" />
                <span>Simular Acesso Config.</span>
              </button>

              <button
                onClick={() => logAuditEvent("alteracao_sensivel", "Modificação de Parâmetro de Risco", "Activação manual de barreira de auditoria AML síncrona", "sucesso")}
                className="flex-1 min-w-[140px] bg-amber-950/15 hover:bg-amber-950/30 border border-[#B87333]/30 hover:border-[#B87333]/55 text-amber-400 font-bold text-[9px] uppercase py-2 px-2.5 rounded transition-all cursor-pointer flex items-center justify-center gap-1.5"
                id="sim-risk-change-btn"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Simular Alteração Limite</span>
              </button>
            </div>
          </div>

          {/* Filters and Search Toolbar */}
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-zinc-950 p-3 rounded-lg border border-neutral-900/40 font-mono">
            {/* Search Input */}
            <div className="w-full md:w-72 relative">
              <input
                type="text"
                placeholder="Pesquisar por evento, operador ou IP..."
                value={auditSearchQuery}
                onChange={(e) => setAuditSearchQuery(e.target.value)}
                className="w-full bg-black border border-neutral-800 rounded px-2.5 py-1.5 text-[10px] text-white focus:border-[#B87333]/50 outline-none"
                id="audit-search-input"
              />
              {auditSearchQuery && (
                <button
                  onClick={() => setAuditSearchQuery("")}
                  className="absolute right-2 top-2 text-zinc-500 hover:text-white text-[9px]"
                >
                  Limpar
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 flex-wrap self-start md:self-auto" id="audit-category-filters">
              {(["todos", "login", "acesso", "alteracao_sensivel"] as const).map((cat) => {
                const label = cat === "todos" ? "Todos os Eventos" : cat === "login" ? "Tentativas de Login" : cat === "acesso" ? "Acessos a Configurações" : "Alterações Sensíveis";
                const active = auditCategoryFilter === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setAuditCategoryFilter(cat)}
                    className={`text-[8.5px] font-black uppercase px-2.5 py-1 rounded transition-all cursor-pointer ${
                      active
                        ? "bg-[#B87333]/20 text-[#B87333] border border-[#B87333]/35"
                        : "text-zinc-500 hover:text-zinc-300 border border-neutral-900 bg-black/40"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-[#050505] rounded-xl border border-neutral-900 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" id="bna-audit-table">
                <thead>
                  <tr className="border-b border-neutral-900/80 bg-zinc-950 text-[8.5px] font-mono uppercase text-zinc-500 select-none">
                    <th className="py-2.5 px-3">Registo ID</th>
                    <th className="py-2.5 px-3">Data/Hora (Local)</th>
                    <th className="py-2.5 px-3">Operador / Origem</th>
                    <th className="py-2.5 px-3 text-center">IP Address</th>
                    <th className="py-2.5 px-3">Categoria</th>
                    <th className="py-2.5 px-3">Evento</th>
                    <th className="py-2.5 px-3">Detalhes e Alterações</th>
                    <th className="py-2.5 px-3 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-950 font-mono text-[9px]">
                  {(() => {
                    const filtered = auditLogs.filter(log => {
                      // Apply category filter
                      if (auditCategoryFilter !== "todos" && log.category !== auditCategoryFilter) {
                        return false;
                      }
                      // Apply text search filter
                      if (auditSearchQuery) {
                        const q = auditSearchQuery.toLowerCase();
                        return (
                          log.id.toLowerCase().includes(q) ||
                          log.eventName.toLowerCase().includes(q) ||
                          log.user.toLowerCase().includes(q) ||
                          log.ipAddress.toLowerCase().includes(q) ||
                          log.details.toLowerCase().includes(q)
                        );
                      }
                      return true;
                    });

                    if (filtered.length === 0) {
                      return (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-zinc-550 italic font-mono uppercase tracking-wider">
                            Nenhum registo de auditoria corresponde aos filtros atuais.
                          </td>
                        </tr>
                      );
                    }

                    return filtered.map((log) => {
                      return (
                        <tr key={log.id} className="hover:bg-neutral-900/30 transition-colors">
                          <td className="py-2.5 px-3 text-zinc-500 font-bold">{log.id}</td>
                          <td className="py-2.5 px-3 text-zinc-400 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString("pt-PT")}
                          </td>
                          <td className="py-2.5 px-3 text-white font-sans font-medium">{log.user}</td>
                          <td className="py-2.5 px-3 text-zinc-500 font-mono text-center select-all">{log.ipAddress}</td>
                          <td className="py-2.5 px-3">
                            <span className={`text-[7.5px] font-black uppercase px-1.5 py-0.5 rounded ${
                              log.category === "login" 
                                ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" 
                                : log.category === "acesso" 
                                ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" 
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            }`}>
                              {log.category === "login" ? "Login" : log.category === "acesso" ? "Acesso" : "Alteração"}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-zinc-200 font-bold">{log.eventName}</td>
                          <td className="py-2.5 px-3 text-zinc-400 font-sans leading-normal max-w-xs truncate" title={log.details}>
                            {log.details}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`inline-flex items-center gap-1 text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                              log.status === "sucesso"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15"
                                : log.status === "sucesso_com_mfa"
                                ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                                : log.status === "falha"
                                ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            }`}>
                              {log.status === "sucesso" ? "OK" : log.status === "sucesso_com_mfa" ? "OK + MFA" : log.status === "falha" ? "BLOQUEADO" : "ALERTA"}
                            </span>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
            
            {/* Table Footer informational block */}
            <div className="bg-zinc-950 p-2 border-t border-neutral-900/80 text-[8px] text-zinc-650 font-mono text-center uppercase tracking-widest">
              SISTEMA SÍNCRONO DE AUDITORIA CRIPTOGRÁFICA DO BANCO NACIONAL DE ANGOLA • LIVRO RAZÃO SEGURO (APPEND-ONLY)
            </div>
          </div>

        </div>
      )}

      {/* SECTOR INTEROPERABILITY HUB */}
      {selectedTab === "interoperabilidade" && (
        <div className="space-y-4 animate-fade-in animate-duration-300" id="bna-interop-panel">
          
          {/* Top Gateway Status Banner */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-neutral-900/60 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/25 rounded-lg text-emerald-400">
                <Globe className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="font-bold text-xs uppercase tracking-widest text-white">Gateway de Interoperabilidade Unificada (GIU)</h4>
                <p className="text-[10px] text-zinc-500 font-mono">ESTADO: <span className="text-emerald-400 font-black">● OPERACIONAL</span> | PROTOCOLO: mTLS v1.3 | CIPHER: TLS_AES_256_GCM_SHA384</p>
              </div>
            </div>
            
            <div className="flex gap-4 items-center bg-black/40 px-3.5 py-2 rounded-lg border border-neutral-900 font-mono text-[10px]">
              <div>
                <span className="text-zinc-500 block text-[9px] uppercase">Chaves Ativas</span>
                <strong className="text-amber-500 text-xs">{apiKeys.filter(k => k.status === "Active").length}</strong>
              </div>
              <div className="border-l border-neutral-900 h-6"></div>
              <div>
                <span className="text-zinc-500 block text-[9px] uppercase">Integrações Segmentadas</span>
                <strong className="text-white text-xs">6 / 6</strong>
              </div>
              <div className="border-l border-neutral-900 h-6"></div>
              <div>
                <span className="text-zinc-500 block text-[9px] uppercase">Modo Regulado</span>
                <strong className="text-emerald-400 text-xs">SANDBOX</strong>
              </div>
            </div>
          </div>

          {/* Core Interactive Sandbox Split Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            
            {/* Left Column: API Directory & Spec Viewer (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-[#050505] border border-neutral-900 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-neutral-900">
                  <Layers className="w-4 h-4 text-amber-500" />
                  <span className="font-black text-[11px] uppercase tracking-wider text-white">Segmentos de Integração</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {(["bancos", "telecoms", "agentes", "comerciantes", "servicos_publicos", "ecommerce"] as const).map((cat) => {
                    const active = selectedApiCategory === cat;
                    let label = "";
                    let IconComponent = Building;
                    if (cat === "bancos") { label = "Bancos Comerciais"; IconComponent = Building; }
                    else if (cat === "telecoms") { label = "Operadoras Móveis"; IconComponent = Smartphone; }
                    else if (cat === "agentes") { label = "Rede de Agentes"; IconComponent = Users; }
                    else if (cat === "comerciantes") { label = "Comerciantes / POS"; IconComponent = ShoppingCart; }
                    else if (cat === "servicos_publicos") { label = "Serviços Públicos"; IconComponent = Server; }
                    else if (cat === "ecommerce") { label = "E-Commerce"; IconComponent = Globe; }

                    return (
                      <button
                        key={cat}
                        onClick={() => {
                          setSelectedApiCategory(cat);
                          setSelectedEndpointIndex(0);
                        }}
                        className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                          active
                            ? "bg-[#B87333]/15 border-[#B87333]/45 text-white"
                            : "bg-zinc-950 border-neutral-900/50 text-zinc-400 hover:text-white hover:bg-zinc-900/60"
                        }`}
                      >
                        <IconComponent className={`w-4 h-4 ${active ? "text-amber-500 animate-pulse" : "text-zinc-500"}`} />
                        <span className="text-[10px] font-black uppercase tracking-wider font-mono">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Endpoint Specifications */}
              <div className="bg-[#050505] border border-neutral-900 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-900">
                  <div className="flex items-center gap-2">
                    <Code className="w-4 h-4 text-amber-500" />
                    <span className="font-black text-[11px] uppercase tracking-wider text-white">Especificação Técnica</span>
                  </div>
                  <span className="text-[8px] font-mono text-zinc-500 uppercase">Documentação Integrada</span>
                </div>

                <div className="space-y-3">
                  {apiEndpoints[selectedApiCategory].map((endpoint, idx) => {
                    const isSelected = selectedEndpointIndex === idx;
                    const isPost = endpoint.method === "POST";
                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedEndpointIndex(idx)}
                        className={`p-3 rounded-lg border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-zinc-900/90 border-[#B87333]/50 ring-1 ring-[#B87333]/25"
                            : "bg-zinc-950 border-neutral-900/50 hover:bg-zinc-900/40"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className={`px-1.5 py-0.5 rounded font-mono font-black text-[9px] ${
                            isPost ? "bg-amber-500/15 text-amber-400 border border-amber-500/10" : "bg-blue-500/15 text-blue-400 border border-blue-500/10"
                          }`}>
                            {endpoint.method}
                          </span>
                          <code className="text-[9.5px] font-mono text-zinc-300 select-all">{endpoint.path}</code>
                          <span className="ml-auto text-[7px] font-mono bg-zinc-900 px-1 py-0.5 rounded text-zinc-500 uppercase">
                            {endpoint.scope}
                          </span>
                        </div>
                        
                        <p className="text-[10px] text-zinc-400 leading-relaxed font-sans">{endpoint.desc}</p>
                        
                        {isSelected && (
                          <div className="mt-2.5 pt-2.5 border-t border-neutral-800/80 space-y-1.5 font-mono text-[8.5px]">
                            <span className="text-[#B87333] font-bold block uppercase tracking-wider">Headers Obrigatórios:</span>
                            <div className="bg-black/80 p-1.5 rounded text-zinc-500 space-y-0.5 border border-neutral-900">
                              {endpoint.headers.map((h, hIdx) => (
                                <div key={hIdx} className="flex justify-between">
                                  <span>{h.split(":")[0]}</span>
                                  {h.includes(":") && <span className="text-zinc-400">{h.split(":")[1]}</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Console & Playground (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-[#050505] border border-neutral-900 rounded-xl p-4 space-y-4 flex flex-col h-full">
                
                {/* Panel Title */}
                <div className="flex items-center justify-between pb-2 border-b border-neutral-900">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-amber-500" />
                    <span className="font-black text-[11px] uppercase tracking-wider text-white">Consola de Testes Sandbox</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-mono bg-amber-500/10 text-amber-400 uppercase tracking-widest animate-pulse">
                    Execução Segura
                  </span>
                </div>

                {/* Playground Variable Inputs */}
                {(() => {
                  const activeEndpoint = apiEndpoints[selectedApiCategory][selectedEndpointIndex];
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-zinc-950 p-3 rounded-lg border border-neutral-900/50 font-mono text-[9.5px]">
                      
                      {/* Common auth credential dropdown selection */}
                      <div>
                        <label className="text-zinc-500 block mb-1 uppercase text-[8.5px]">Chave de Autenticação (Header):</label>
                        <select
                          value={authHeaderSim}
                          onChange={(e) => setAuthHeaderSim(e.target.value)}
                          className="w-full bg-black border border-neutral-800 text-white rounded px-2 py-1 text-[9.5px] outline-none focus:border-[#B87333]"
                        >
                          {apiKeys.map((k) => (
                            <option key={k.id} value={k.key}>{k.owner} ({k.role})</option>
                          ))}
                        </select>
                      </div>

                      {/* Phone Source number */}
                      <div>
                        <label className="text-zinc-500 block mb-1 uppercase text-[8.5px]">Telemóvel Origem (KwanzaMóvel):</label>
                        <input
                          type="text"
                          value={phoneParam}
                          onChange={(e) => setPhoneParam(e.target.value)}
                          className="w-full bg-black border border-neutral-800 text-white rounded px-2 py-1 text-[9.5px] outline-none focus:border-[#B87333]"
                        />
                      </div>

                      {/* Amount AOA input */}
                      <div>
                        <label className="text-zinc-500 block mb-1 uppercase text-[8.5px]">Valor da Operação (Kwanza AOA):</label>
                        <input
                          type="number"
                          value={amountParam}
                          onChange={(e) => setAmountParam(parseInt(e.target.value) || 0)}
                          className="w-full bg-black border border-neutral-800 text-white rounded px-2 py-1 text-[9.5px] outline-none focus:border-[#B87333]"
                        />
                      </div>

                      {/* receiver target (Utility pay bills / E-commerce receiver / Agent Shortcode) */}
                      {selectedApiCategory === "servicos_publicos" && (
                        <div>
                          <label className="text-zinc-500 block mb-1 uppercase text-[8.5px]">Fornecedor de Serviço:</label>
                          <select
                            value={receiverParam}
                            onChange={(e) => setReceiverParam(e.target.value)}
                            className="w-full bg-black border border-neutral-800 text-white rounded px-2 py-1 text-[9.5px] outline-none focus:border-[#B87333]"
                          >
                            <option value="ENDE_PAGAMENTOS">ENDE (Electricidade)</option>
                            <option value="EPAL_PAGAMENTOS">EPAL (Água)</option>
                            <option value="AGT_RECEITAS">AGT (Impostos)</option>
                          </select>
                        </div>
                      )}

                      {selectedApiCategory === "comerciantes" && (
                        <div>
                          <label className="text-zinc-500 block mb-1 uppercase text-[8.5px]">ID do Terminal POS Comerciante:</label>
                          <input
                            type="text"
                            value={merchantParam}
                            onChange={(e) => setMerchantParam(e.target.value)}
                            className="w-full bg-black border border-neutral-800 text-white rounded px-2 py-1 text-[9.5px] outline-none focus:border-[#B87333]"
                          />
                        </div>
                      )}

                      {selectedApiCategory === "agentes" && (
                        <div>
                          <label className="text-zinc-500 block mb-1 uppercase text-[8.5px]">Código do Agente Físico:</label>
                          <input
                            type="text"
                            value={agentCodeParam}
                            onChange={(e) => setAgentCodeParam(e.target.value)}
                            className="w-full bg-black border border-neutral-800 text-white rounded px-2 py-1 text-[9.5px] outline-none focus:border-[#B87333]"
                          />
                        </div>
                      )}

                      {selectedApiCategory === "servicos_publicos" && (
                        <div>
                          <label className="text-zinc-500 block mb-1 uppercase text-[8.5px]">Fatura / Conta Contratual:</label>
                          <input
                            type="text"
                            value={utilityBillParam}
                            onChange={(e) => setUtilityBillParam(e.target.value)}
                            className="w-full bg-black border border-neutral-800 text-white rounded px-2 py-1 text-[9.5px] outline-none focus:border-[#B87333]"
                          />
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Action trigger button */}
                {(() => {
                  const activeEndpoint = apiEndpoints[selectedApiCategory][selectedEndpointIndex];
                  return (
                    <button
                      disabled={apiRunning}
                      onClick={() => handleRunApiSandbox(activeEndpoint)}
                      className={`w-full py-2.5 rounded-xl font-bold font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all ${
                        apiRunning
                          ? "bg-[#B87333]/10 text-amber-500/60 border border-[#B87333]/20"
                          : "bg-amber-500 hover:bg-amber-600 text-black font-black shadow-lg shadow-amber-500/10"
                      }`}
                    >
                      {apiRunning ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
                          <span>A Executar Pedido Criptográfico...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-current text-black" />
                          <span>Executar Chamada de API Interoperável</span>
                        </>
                      )}
                    </button>
                  );
                })()}

                {/* Gateway Execution Logs Console */}
                <div className="flex-grow space-y-2 font-mono text-[9px] flex flex-col">
                  <span className="text-zinc-500 block uppercase">Saída e Logs de Handshake mTLS:</span>
                  <div className="bg-black/80 rounded-lg p-3 border border-neutral-900 flex-grow h-40 overflow-y-auto space-y-1 text-zinc-400 select-text leading-relaxed font-mono">
                    {apiRunLogs.map((log, lIdx) => (
                      <div key={lIdx} className="flex gap-2">
                        <span className="text-[#B87333] select-none">&gt;</span>
                        <span>{log}</span>
                      </div>
                    ))}
                    {apiRunLogs.length === 0 && (
                      <span className="text-zinc-650 italic">A aguardar despacho do pedido... Clique em "Executar Chamada de API"</span>
                    )}
                  </div>
                </div>

                {/* Request Payload vs Response Payload */}
                {(() => {
                  const activeEndpoint = apiEndpoints[selectedApiCategory][selectedEndpointIndex];
                  const hasBody = activeEndpoint.requestBody !== null;
                  const reqJson = hasBody
                    ? JSON.stringify(activeEndpoint.requestBody(phoneParam, amountParam, receiverParam, utilityBillParam, merchantParam, agentCodeParam), null, 2)
                    : null;
                  const resJson = apiRunResponse ? JSON.stringify(apiRunResponse, null, 2) : null;

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[9px]">
                      {/* Request Payload Preview */}
                      <div className="space-y-1">
                        <span className="text-zinc-500 uppercase block">Pedido (Request Body JSON):</span>
                        <pre className="bg-zinc-950 p-2.5 rounded border border-neutral-900/60 text-emerald-400/90 h-36 overflow-y-auto select-all leading-relaxed font-mono">
                          {reqJson ? reqJson : "{\n  \"message\": \"No request body for GET requests\"\n}"}
                        </pre>
                      </div>

                      {/* Response Payload Preview */}
                      <div className="space-y-1">
                        <span className="text-zinc-500 uppercase block">Resposta (Response Body JSON):</span>
                        <pre className="bg-zinc-950 p-2.5 rounded border border-neutral-900/60 text-blue-400 h-36 overflow-y-auto select-all leading-relaxed font-mono">
                          {resJson ? resJson : "{\n  \"status\": \"AWAITING_EXECUTION\"\n}"}
                        </pre>
                      </div>
                    </div>
                  );
                })()}

                {/* Interactive Snippets Drawer */}
                <div className="bg-zinc-950 p-3 rounded-lg border border-neutral-900/60 font-mono text-[9px] space-y-2">
                  <span className="text-zinc-500 uppercase block">Código de Exemplo para Integração Real:</span>
                  {(() => {
                    const activeEndpoint = apiEndpoints[selectedApiCategory][selectedEndpointIndex];
                    const hasBody = activeEndpoint.requestBody !== null;
                    const reqObj = hasBody ? activeEndpoint.requestBody(phoneParam, amountParam, receiverParam, utilityBillParam, merchantParam, agentCodeParam) : null;
                    const curlCommand = `curl -X ${activeEndpoint.method} "https://api.kwanzamovel.gov.ao${activeEndpoint.path}" \\\n  -H "X-KwanzaMóvel-API-Key: ${authHeaderSim}" \\\n  -H "Content-Type: application/json" ${hasBody ? `\\\n  -d '${JSON.stringify(reqObj)}'` : ""}`;
                    
                    return (
                      <div className="relative">
                        <textarea
                          readOnly
                          value={curlCommand}
                          className="w-full h-16 bg-black text-zinc-300 rounded border border-neutral-900 p-2 text-[8px] resize-none focus:outline-none select-all font-mono"
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(curlCommand);
                            setBnaFeedback("Código cURL copiado para a área de transferência!");
                            setTimeout(() => setBnaFeedback(""), 2500);
                          }}
                          className="absolute right-2 bottom-2 bg-zinc-900 border border-neutral-800 hover:bg-[#B87333]/15 hover:border-[#B87333]/40 text-zinc-400 hover:text-white px-1.5 py-0.5 rounded cursor-pointer transition-all text-[8px] font-mono"
                        >
                          Copiar cURL
                        </button>
                      </div>
                    );
                  })()}
                </div>

              </div>
            </div>

          </div>

          {/* Credential & Webhook Manager (Bottom Split Layout) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* API Credentials Manager */}
            <div className="bg-[#050505] border border-neutral-900 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-900">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-500" />
                  <span className="font-black text-[11px] uppercase tracking-wider text-white">Chaves de API & Credenciais</span>
                </div>
                <span className="text-[8px] text-zinc-500 font-mono uppercase">Gestão Descentralizada</span>
              </div>

              {/* API Keys Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-[9px]">
                  <thead>
                    <tr className="border-b border-neutral-900 text-zinc-500 uppercase">
                      <th className="pb-2">Entidade</th>
                      <th className="pb-2">Role / Canal</th>
                      <th className="pb-2">Chave Pública (Sandbox)</th>
                      <th className="pb-2">Estado</th>
                      <th className="pb-2 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-900 text-zinc-300">
                    {apiKeys.map((k) => (
                      <tr key={k.id} className="hover:bg-zinc-950/40">
                        <td className="py-2.5 font-bold text-white">{k.owner}</td>
                        <td className="py-2.5 text-zinc-400">{k.role}</td>
                        <td className="py-2.5 select-all text-zinc-500">{k.key.substring(0, 16)}...</td>
                        <td className="py-2.5">
                          <span className={`px-1 py-0.5 rounded-full text-[7.5px] uppercase font-bold ${
                            k.status === "Active" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15" : "bg-red-500/10 text-red-400 border border-red-500/15"
                          }`}>
                            {k.status === "Active" ? "Ativa" : "Revogada"}
                          </span>
                        </td>
                        <td className="py-2.5 text-right space-x-1.5">
                          <button
                            onClick={() => handleToggleApiKeyStatus(k.id)}
                            className="bg-zinc-900 hover:bg-zinc-800 border border-neutral-800 px-1.5 py-0.5 rounded text-[8px] cursor-pointer text-zinc-400 hover:text-white font-mono"
                          >
                            {k.status === "Active" ? "Revogar" : "Ativar"}
                          </button>
                          <button
                            onClick={() => handleDeleteApiKey(k.id)}
                            className="bg-red-950/25 hover:bg-red-900/35 border border-red-500/20 px-1.5 py-0.5 rounded text-[8px] cursor-pointer text-red-400 font-mono"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Create new Credential form */}
              <div className="bg-zinc-950 border border-neutral-900/60 p-3 rounded-lg flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1 space-y-1 font-mono text-[9px]">
                  <label className="text-zinc-500 uppercase block">Nome da Entidade Integrante:</label>
                  <input
                    type="text"
                    placeholder="ex: Unitel Money, EPAL, Banco BIC..."
                    value={newKeyOwner}
                    onChange={(e) => setNewKeyOwner(e.target.value)}
                    className="w-full bg-black border border-neutral-800 text-white rounded px-2.5 py-1.5 outline-none text-[9.5px] focus:border-[#B87333] font-mono"
                  />
                </div>
                
                <div className="w-full sm:w-44 space-y-1 font-mono text-[9px]">
                  <label className="text-zinc-500 uppercase block">Categoria de Role:</label>
                  <select
                    value={newKeyRole}
                    onChange={(e) => setNewKeyRole(e.target.value)}
                    className="w-full bg-black border border-neutral-800 text-white rounded px-2.5 py-1.5 outline-none text-[9.5px] focus:border-[#B87333] font-mono"
                  >
                    <option value="Banco Comercial">Banco Comercial</option>
                    <option value="Operadora Móvel">Operadora Móvel</option>
                    <option value="Agente">Agente de Rede</option>
                    <option value="Comerciante">Comerciante</option>
                    <option value="Serviço Público">Serviço Público</option>
                    <option value="Plataforma E-commerce">Plataforma E-commerce</option>
                  </select>
                </div>

                <button
                  onClick={handleCreateApiKey}
                  className="bg-zinc-900 hover:bg-[#B87333]/15 border border-[#B87333]/40 hover:border-[#B87333]/60 text-amber-500 font-bold font-mono text-[9px] uppercase py-2 px-3 rounded-lg transition-all cursor-pointer h-[32px] font-mono whitespace-nowrap"
                >
                  Criar Chave
                </button>
              </div>

            </div>

            {/* Webhooks Manager */}
            <div className="bg-[#050505] border border-neutral-900 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-900">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-amber-500" />
                  <span className="font-black text-[11px] uppercase tracking-wider text-white">Disparador de Webhooks (Instantâneo)</span>
                </div>
                <span className="text-[8px] text-zinc-500 font-mono uppercase">Notificações Event-Driven</span>
              </div>

              <div className="space-y-3 font-mono text-[9px]">
                <p className="text-zinc-400 font-sans leading-relaxed text-[10px]">
                  Simule eventos de webhook síncronos despachados pelo motor central KwanzaMóvel quando um pagamento é concluído. Útil para integradores e comerciantes validarem callbacks.
                </p>

                {/* Webhook Destination input */}
                <div className="space-y-1 font-mono">
                  <label className="text-zinc-500 uppercase block text-[8.5px]">URL de Destino (Callback endpoint do Integrador):</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      className="flex-grow bg-black border border-neutral-800 text-white rounded px-2.5 py-1.5 outline-none text-[9.5px] focus:border-[#B87333] font-mono"
                    />
                    <button
                      disabled={webhookRunning}
                      onClick={handleTriggerWebhook}
                      className="bg-amber-500 hover:bg-amber-600 text-black font-black uppercase text-[9px] px-3.5 py-1.5 rounded cursor-pointer disabled:opacity-50 font-mono"
                    >
                      {webhookRunning ? "A Enviar..." : "Testar Webhook"}
                    </button>
                  </div>
                </div>

                {/* Webhook Output results */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500 uppercase block text-[8.5px]">Headers de Assinatura enviados:</span>
                    <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 rounded-full px-1.5 py-0.5 font-mono">
                      X-KwanzaMóvel-Webhook-Signature
                    </span>
                  </div>
                  
                  <div className="bg-black/90 p-2 rounded border border-neutral-900/60 text-zinc-400 font-mono text-[8px] select-all space-y-0.5 font-mono">
                    <div><span className="text-zinc-500">Host:</span> {webhookUrl.replace('https://', '').split('/')[0]}</div>
                    <div><span className="text-zinc-500">User-Agent:</span> KwanzaMóvel-Webhook-Dispatcher/v2.1</div>
                    <div><span className="text-zinc-500">X-KwanzaMóvel-Webhook-Signature:</span> sha256=e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</div>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-zinc-500 uppercase block text-[8.5px]">Response JSON (Payload Assinado):</span>
                  <pre className="bg-zinc-950 p-2.5 rounded border border-neutral-900/60 text-amber-500 h-28 overflow-y-auto select-all leading-normal text-[8px] font-mono">
                    {webhookResult ? webhookResult : "{\n  \"message\": \"A aguardar disparo de teste de webhook...\"\n}"}
                  </pre>
                </div>
              </div>
            </div>

          </div>

          {/* Secure Interoperability Agreement footnote */}
          <div className="bg-zinc-950/80 p-3 rounded-xl border border-neutral-900/60 font-mono text-[8.5px] text-zinc-650 flex flex-col sm:flex-row justify-between items-center gap-2">
            <span>REGULADO PELAS DIRECTIVAS Nº 04/2026 E Nº 09/2026 DO BANCO NACIONAL DE ANGOLA</span>
            <span>LICENCIADO PARA: MULTI-CANAL NACIONAL KWANZAMÓVEL DE ANGOLA</span>
          </div>

        </div>
      )}

      {/* OVERLAY DO RELATÓRIO PDF SIMULADO DO BANCO NACIONAL DE ANGOLA */}
      {isReportOpen && (
        <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto" id="bna-pdf-modal">
          <div className="bg-white text-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col my-8 max-h-[90vh] overflow-hidden border border-amber-600/30 animate-scale-up">
            
            {/* Modal Actions Header */}
            <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between border-b border-amber-600/40 shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-500" />
                <span className="text-[11px] font-mono tracking-widest font-black uppercase text-amber-400">
                  Visualizador de Documento Oficial PDF Geral do BNA
                </span>
              </div>
              <button 
                onClick={() => setIsReportOpen(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Simulated Printed Sheet */}
            <div className="p-8 md:p-12 overflow-y-auto flex-grow space-y-6 text-left selection:bg-amber-100 font-sans" id="printable-bna-document">
              
              {/* BNA Letterhead */}
              <div className="text-center pb-6 border-b-2 border-double border-[#B87333] space-y-2">
                <span className="text-sm font-extrabold tracking-[0.25em] text-slate-900 block font-mono">
                  REPÚBLICA DE ANGOLA
                </span>
                <span className="text-large font-black tracking-wider text-slate-950 block">
                  BANCO NACIONAL DE ANGOLA
                </span>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest block">
                  DEPARTAMENTO DE SUPERVISÃO DO SISTEMA DE PAGAMENTO (DSP)
                </span>
                <div className="flex items-center justify-center gap-1.5 pt-1.5 text-[9.5px] font-mono text-[#B87333] font-black">
                  <span>SERVIÇOS DE AUDITORIA DO MULTI-CANAL KWANZAMÓVEL</span>
                </div>
                <div className="text-[8.5px] text-slate-400 font-mono">
                  REF: BNA-KM-2026-{Math.floor(12000 + Math.random() * 80000)}
                </div>
              </div>

              {/* Meta information block */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <div><strong className="text-slate-900 uppercase">Auditor Responsável:</strong> <span className="text-slate-600">{reportAuditor}</span></div>
                  <div><strong className="text-slate-900 uppercase">Protocolo de Operação:</strong> <span className="text-slate-600">KwanzaMóvel-mTLS-Bilateral</span></div>
                </div>
                <div className="space-y-1 text-left sm:text-right">
                  <div><strong className="text-slate-900 uppercase">Data de Emissão:</strong> <span className="text-slate-600">{new Date().toLocaleDateString("pt-PT")}</span></div>
                  <div><strong className="text-slate-900 uppercase">Âmbito Temporal:</strong> <span className="text-slate-600">Últimos 7 dias (Sinal)</span></div>
                </div>
              </div>

              {/* Executive Indicators Summary */}
              <div className="space-y-2">
                <h5 className="text-[10.5px] uppercase font-black tracking-wider text-slate-900 border-b border-slate-900 pb-1 font-mono">
                  I. SUMÁRIO E RATIOS OPERACIONAIS
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="border border-slate-250 rounded p-3 bg-slate-50">
                    <span className="text-[8.5px] text-slate-500 font-bold block uppercase leading-none font-mono">Média Rácio Conformidade</span>
                    <strong className="text-xl font-mono text-emerald-600 font-black block mt-1.5">{calculatedRate}%</strong>
                    <span className="text-[8px] text-emerald-655 font-bold block mt-1">SISTEMA CONFORME</span>
                  </div>
                  <div className="border border-slate-250 rounded p-3 bg-slate-50">
                    <span className="text-[8.5px] text-slate-500 font-bold block uppercase leading-none font-mono">Transações Inspecionadas</span>
                    <strong className="text-xl font-mono text-slate-900 font-black block mt-1.5">{totalTxCount.toLocaleString("pt-PT")}</strong>
                    <span className="text-[8px] text-slate-400 block mt-1">Câmara Multilateral</span>
                  </div>
                  <div className="border border-slate-250 rounded p-3 bg-slate-50">
                    <span className="text-[8.5px] text-slate-500 font-bold block uppercase leading-none font-mono">Incidentes Registados (AML)</span>
                    <strong className={`text-xl font-mono font-black block mt-1.5 ${totalSuspiciousCount > 15 ? "text-rose-600 animate-pulse" : "text-amber-655"}`}>
                      {totalSuspiciousCount}
                    </strong>
                    <span className="text-[8px] text-slate-400 block mt-1">Policiamento Geral</span>
                  </div>
                  <div className="border border-slate-250 rounded p-3 bg-slate-50">
                    <span className="text-[8.5px] text-slate-500 font-bold block uppercase leading-none font-mono">Rácio Liquidez Central</span>
                    <strong className="text-xl font-mono text-emerald-600 font-black block mt-1.5">{liquidityRatio}%</strong>
                    <span className="text-[8px] text-slate-400 block mt-1">Reservas vs. Carteiras</span>
                  </div>
                </div>
              </div>

              {/* Past 7 Days Table */}
              <div className="space-y-2">
                <h5 className="text-[10.5px] uppercase font-black tracking-wider text-slate-905 border-b border-slate-900 pb-1 font-mono">
                  II. REGISTO DIÁRIO DE VOLUMES CONSOLIDADOS
                </h5>
                <div className="overflow-x-auto border border-slate-200 rounded">
                  <table className="w-full text-left text-xs border-collapse m-0">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-605 uppercase font-mono font-black text-[9px]">
                        <th className="p-2.5">Dia Fiscal</th>
                        <th className="p-2.5 text-right">Volume Processado (AOA)</th>
                        <th className="p-2.5 text-center font-mono">Transações Efetuadas</th>
                        <th className="p-2.5 text-center">Status Criptográfico</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 font-mono">
                      {getLast7DaysData().map((dayData, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors text-slate-700">
                          <td className="p-2.5 font-bold">{dayData.dateStr}</td>
                          <td className="p-2.5 text-right font-black">{dayData.volume.toLocaleString("pt-PT")} Kz</td>
                          <td className="p-2.5 text-center text-slate-500">{dayData.countTx}</td>
                          <td className="p-2.5 text-center font-mono">
                            <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded border ${
                              dayData.status === "CONFORME" 
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                : dayData.status.includes("CRÍTICO")
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}>
                              {dayData.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Auditor Directives & Comments */}
              <div className="space-y-2 bg-amber-50/20 border-l-4 border-[#B87333] p-4 rounded-r">
                <h6 className="text-[9.5px] font-mono uppercase font-black tracking-widest text-[#B87333]">
                  III. DISPOSIÇÕES DO AUDITOR E DESPACHO FINANCEIRO
                </h6>
                <p className="text-xs text-slate-705 italic font-medium leading-relaxed">
                  "{customReportObs}"
                </p>
              </div>

              {/* Signatures block */}
              <div className="pt-8 flex flex-col sm:flex-row justify-between gap-6 text-center text-[11px]">
                <div className="w-full sm:w-1/2 space-y-1">
                  <div className="border-t border-slate-400 pt-1.5 font-bold text-slate-900">
                    {reportAuditor}
                  </div>
                  <div className="text-[9.5px] text-slate-500">
                    Departamento de Supervisão de Sistemas de Pagamento (DSP)
                  </div>
                </div>
                <div className="w-full sm:w-1/2 space-y-1 font-mono">
                  <div className="border-t border-slate-400 pt-1.5 font-bold text-slate-950">
                    VALIDADO CRIPTOGRAFICAMENTE
                  </div>
                  <div className="text-[9.5px] text-slate-500">
                    Chave Privada mTLS - BNA Central
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer Controls */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <span className="text-[10px] font-mono text-slate-505">
                Regulado pelo Banco Central sob os mais elevados critérios de segurança e integridade transacional.
              </span>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={handlePrintNative}
                  className="bg-[#B87333] hover:bg-[#a6622b] text-white font-extrabold text-[11px] uppercase px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-[#B87333]/15"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Relatório (PDF)</span>
                </button>
                <button
                  onClick={() => setIsReportOpen(false)}
                  className="bg-slate-300 hover:bg-slate-400 text-slate-800 font-extrabold text-[11px] uppercase px-4 py-2 rounded-xl transition-all cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Regulatory signature bottom footer */}
      <div className="pt-2 border-t border-neutral-900 flex items-center gap-1.5 text-[9px] text-[#B87333] font-bold justify-center font-mono uppercase">
        <Layers className="w-3.5 h-3.5 text-[#B87333]" />
        <span>Sovereign Settlement Engine Standard AOA</span>
      </div>

    </div>
  );
}
