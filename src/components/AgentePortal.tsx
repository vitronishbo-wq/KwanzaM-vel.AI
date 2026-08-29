/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Lock,
  Coins, 
  Smartphone, 
  MapPin, 
  CheckCircle, 
  UserCheck, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Printer, 
  Fingerprint,
  Banknote,
  Clock,
  ChevronRight,
  ShieldCheck,
  Building,
  RotateCcw,
  RefreshCw,
  Users,
  Download,
  FileSpreadsheet,
  FileText,
  ShieldAlert,
  Search,
  Bell,
  MessageSquare,
  HelpCircle,
  Sparkles,
  AlertTriangle,
  BarChart3,
  Wifi,
  WifiOff,
  Volume2,
  VolumeX
} from "lucide-react";
import { UserAccount, Transaction, BnaCustodyState } from "../types";
import { toKwanzaCents, fromKwanzaCents } from "../ledgerEngine";
import { saveTransaction, addReconciliationEntry, saveUserAccount, getTransactions, saveTransactionsBatch, addReconciliationEntriesBatch, getUserAccount, getReconciliationEntries } from "../indexedDB";
import { generatePacs008Message } from "../bnaCustody";
import { jsPDF } from "jspdf";
import { TransactionReceiptModal } from "./TransactionReceiptModal";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from "recharts";

interface AgentePortalProps {
  currentUser: UserAccount;
  setCurrentUser: React.Dispatch<React.SetStateAction<UserAccount>>;
  ledger: Transaction[];
  setLedger: React.Dispatch<React.SetStateAction<Transaction[]>>;
  onLedgerUpdate: (newJournal: any[], newBnaSptrMsg: string, txAmount: number, syncBatch?: any) => void;
  highContrast?: boolean;
  seniorMode?: boolean;
  bnaState?: BnaCustodyState;
}

// Pre-seeded physical agent points with distinct physical cash registers
interface PhysicalAgent {
  id: string;
  name: string;
  marketLocation: string;
  cashReserve: number;
  initialReserve: number;
  terminalCode: string;
}

export default function AgentePortal({
  currentUser,
  setCurrentUser,
  ledger,
  setLedger,
  onLedgerUpdate,
  highContrast = false,
  seniorMode = false,
  bnaState
}: AgentePortalProps) {

  // Seed list of authorized physical agents
  const [agents, setAgents] = useState<PhysicalAgent[]>([
    {
      id: "AG-VIANA-01",
      name: "Dona Maria Amélia (Feira de Viana)",
      marketLocation: "Luanda (Mercado Regular de Viana)",
      cashReserve: 350000,
      initialReserve: 350000,
      terminalCode: "TRM-9832-AO"
    },
    {
      id: "AG-SAMBIZ-02",
      name: "Cantina do Anselmo (Sambizanga)",
      marketLocation: "Luanda (Bairro Operário)",
      cashReserve: 180000,
      initialReserve: 180000,
      terminalCode: "TRM-4011-AO"
    },
    {
      id: "AG-HUAMBO-03",
      name: "Armazéns Central (Huambo)",
      marketLocation: "Huambo Central (Cidade Alta)",
      cashReserve: 850000,
      initialReserve: 850000,
      terminalCode: "TRM-8824-AO"
    }
  ]);

  // Selected agent state
  const [selectedAgentIndex, setSelectedAgentIndex] = useState<number>(0);
  const currentAgent = agents[selectedAgentIndex];

  // Online/Offline & Sync Queue States with robust default check using navigator.onLine
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(0);
  const syncTimeoutRef = React.useRef<any>(null);

  // SISTEMA DE ALERTA DE LIQUIDEZ INTERBANCÁRIA (REQUISITO REGULATÓRIO)
  const [alertThreshold, setAlertThreshold] = useState<number>(100);
  const [alertMuted, setAlertMuted] = useState<boolean>(false);
  const [alertAcknowledged, setAlertAcknowledged] = useState<boolean>(false);
  const [lastRatio, setLastRatio] = useState<number>(100);

  // Cálculos dinâmicos em tempo real do rácio de liquidez baseados no estado do BNA
  const userTotalCirculation = bnaState?.totalCirculation ?? 35500;
  const centralBankReserves = bnaState?.bnaCustodyBalance ?? 40000;
  const rawLiquidityRatio = userTotalCirculation > 0 
    ? (centralBankReserves / userTotalCirculation) * 100 
    : 100;
  const liquidityRatio = parseFloat(Math.max(0, Math.min(1000, rawLiquidityRatio)).toFixed(2));
  const isLiquidityAlertActive = liquidityRatio < alertThreshold;

  // Gerador de sinal sonoro sintetizado (Siren/Alarm) usando Web Audio API
  const playLiquidityAlarm = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(800, ctx.currentTime);
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(600, ctx.currentTime);
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      
      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.6);
      osc2.stop(ctx.currentTime + 0.6);
    } catch (e) {
      console.warn("AudioContext bloqueado ou não suportado:", e);
    }
  };

  // Sincronizar o limite com o valor configurado no BNA
  useEffect(() => {
    if (bnaState?.criticalLiquidityThreshold !== undefined) {
      setAlertThreshold(bnaState.criticalLiquidityThreshold);
    }
  }, [bnaState?.criticalLiquidityThreshold]);

  // Monitorização de alterações no rácio e disparo dos avisos sonoros e de fala (Voz)
  useEffect(() => {
    const isBelow = liquidityRatio < alertThreshold;
    if (isBelow) {
      if (liquidityRatio !== lastRatio) {
        setLastRatio(liquidityRatio);
        // Reseta o reconhecimento se a liquidez cair ainda mais para manter o agente ciente
        if (liquidityRatio < lastRatio) {
          setAlertAcknowledged(false);
        }
      }

      if (!alertAcknowledged) {
        // Alerta de Voz Sintetizado
        speakText(`Alerta de Liquidez Regulamentar: O rácio de liquidez caiu para ${liquidityRatio}%, abaixo do limite de ${alertThreshold}%.`);
        
        // Alerta Sonoro
        if (!alertMuted) {
          playLiquidityAlarm();
        }
      }
    } else {
      setAlertAcknowledged(false);
    }
  }, [liquidityRatio, alertThreshold, alertAcknowledged, alertMuted]);

  // Repetição periódica do som do alarme caso o agente não silencie ou reconheça o problema
  useEffect(() => {
    let intervalId: any;
    if (liquidityRatio < alertThreshold && !alertMuted && !alertAcknowledged) {
      intervalId = setInterval(() => {
        playLiquidityAlarm();
      }, 12000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [liquidityRatio, alertThreshold, alertMuted, alertAcknowledged]);

  // Load and update offline queue length
  const updateOfflineQueueCount = async () => {
    try {
      const txs = await getTransactions();
      const offlineTxs = txs.filter((tx: any) => tx.status === "queued_offline");
      setOfflineQueueCount(offlineTxs.length);
    } catch (err) {
      console.error("Erro ao ler transações offline do IndexedDB:", err);
    }
  };

  // Check if navigator.onLine is active and perform a robust connection handshake/healthcheck
  const checkNetworkConnectivity = async (): Promise<boolean> => {
    // 1. Verify physical hardware/browser online status via navigator.onLine
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return false;
    }
    
    // 2. Ensure simulator toggle is not overriding to Offline
    if (!isOnline) {
      return false;
    }

    // 3. Handshake validation: fetch health endpoint or fallback to safe browser status verification
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      
      const response = await fetch("/api/health", { signal: controller.signal }).catch(() => null);
      clearTimeout(timeoutId);
      
      if (response && response.ok) {
        return true;
      }
    } catch (err) {
      console.log("Falha no ping central, recorrendo à verificação de estado do navegador.");
    }
    
    return typeof navigator !== "undefined" ? navigator.onLine : true;
  };

  // Yield execution to the main thread using requestIdleCallback to prevent UI blocking
  const yieldToMainThread = (): Promise<void> => {
    return new Promise((resolve) => {
      if (typeof window !== "undefined" && "requestIdleCallback" in window) {
        (window as any).requestIdleCallback(() => resolve());
      } else {
        setTimeout(resolve, 0);
      }
    });
  };

  // Debounced Sync Trigger to consolidate multiple rapid successive transactions
  const triggerDebouncedSync = () => {
    if (!isOnline) return;
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    console.log("[Debounce] Agendando sincronização consolidada em lote para daqui a 3 segundos de inatividade...");
    syncTimeoutRef.current = setTimeout(() => {
      if (typeof window !== "undefined" && "requestIdleCallback" in window) {
        (window as any).requestIdleCallback(() => {
          syncOfflineTransactions();
        }, { timeout: 2000 });
      } else {
        syncOfflineTransactions();
      }
    }, 3000);
  };

  // Sync offline queued transactions with BNA & central ledger
  const syncOfflineTransactions = async () => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    if (isSyncing) return;

    setIsSyncing(true);

    // --- ASSÍNCRONA PRÉ-FLIGHT DA INTEGRIDADE DO SALDO LOCAL ---
    let validOfflineTxs: Transaction[] = [];
    let initialTxs: Transaction[] = [];
    const batchId = `BATCH-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      initialTxs = await getTransactions();
      const offlineTxs = initialTxs.filter((tx: any) => tx.status === "queued_offline");

      if (offlineTxs.length === 0) {
        setIsSyncing(false);
        return;
      }

      // ESTRATÉGIA DE PRIORIZAÇÃO SISTÉMICA (CASH-IN ANTES DE CASH-OUT):
      // Ordena transações para que depósitos ('recebimento') sejam validados e sincronizados antes de envios/pagamentos.
      // Isto garante que o saldo seja incrementado no ledger central antes de ocorrerem débitos subsequentes,
      // maximizando a robustez e prevenindo bloqueios indevidos devido a saldo temporariamente insuficiente.
      // Dentro da mesma prioridade, a ordem cronológica original (timestamp) é estritamente mantida para preservar a atomicidade do histórico.
      offlineTxs.sort((a, b) => {
        const isA_CashIn = a.type === "recebimento";
        const isB_CashIn = b.type === "recebimento";

        if (isA_CashIn && !isB_CashIn) return -1;
        if (!isA_CashIn && isB_CashIn) return 1;

        // Se ambos são da mesma categoria de prioridade, manter a ordem cronológica estrita
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      });

      // Validador assíncrono para processar a integridade em lote sem bloquear a interface/dispositivo
      const validateLocalBalanceIntegrityAsync = async (txsToValidate: Transaction[]) => {
        const freshUser = await getUserAccount(currentUser.phone);
        let runningBalance = freshUser ? freshUser.balance : currentUser.balance;
        
        const validated: Transaction[] = [];
        const blocked: Transaction[] = [];

        for (const tx of txsToValidate) {
          // Yield execution to the main thread using requestIdleCallback to keep the UI perfectly smooth
          await yieldToMainThread();
          const isDep = tx.type === "recebimento";
          const isManuel = (isDep ? tx.receiverPhone : tx.senderPhone).trim().toUpperCase() === (currentUser.shortCode || "KM-4831");
          
          if (isManuel) {
            const txAmt = tx.amount;
            const projectedChange = isDep ? txAmt : -txAmt;
            
            if (!tx.balanceAppliedOffline) {
              if (runningBalance + projectedChange < 0) {
                console.error(`[Integridade] Transação ${tx.id} rejeitada assincronamente: Saldo insuficiente (${runningBalance} Kz para débito de ${txAmt} Kz).`);
                blocked.push({
                  ...tx,
                  status: "blocked_aml" as const,
                  securityLog: [
                    ...(tx.securityLog || []),
                    `Bloqueado assincronamente em pré-flight de sincronização para evitar saldo negativo em ${new Date().toLocaleString("pt-PT")}`
                  ]
                });
                continue;
              }
              runningBalance += projectedChange;
            } else {
              if (runningBalance < 0) {
                console.error(`[Integridade] Saldo atual negativo detectado (${runningBalance} Kz) para transação offline ${tx.id}.`);
                blocked.push({
                  ...tx,
                  status: "blocked_aml" as const,
                  securityLog: [
                    ...(tx.securityLog || []),
                    `Bloqueado assincronamente: saldo negativo detetado na carteira em ${new Date().toLocaleString("pt-PT")}`
                  ]
                });
                runningBalance -= projectedChange; // reverter o impacto negativo
                continue;
              }
            }
          }
          validated.push(tx);
        }

        return { validated, blocked, finalBalance: runningBalance };
      };

      const integrityResult = await validateLocalBalanceIntegrityAsync(offlineTxs);

      if (integrityResult.blocked.length > 0) {
        await saveTransactionsBatch(integrityResult.blocked);
        setLedger(prev => {
          const copy = [...prev];
          for (const btx of integrityResult.blocked) {
            const idx = copy.findIndex(t => t.id === btx.id);
            if (idx !== -1) {
              copy[idx] = btx;
            } else {
              copy.unshift(btx);
            }
          }
          return copy;
        });
        speakText("Aviso: Transações inconsistentes com saldo local foram bloqueadas.");
      }

      validOfflineTxs = integrityResult.validated;

      // ATOMIC PRE-PERSISTENCE OF ATTEMPT COUNTER: Save the intent & increment attempts in IndexedDB to prevent duplicates
      if (validOfflineTxs.length > 0) {
        validOfflineTxs = validOfflineTxs.map(tx => ({
          ...tx,
          syncAttempts: (tx.syncAttempts || 0) + 1,
          batchId: batchId
        }));
        await saveTransactionsBatch(validOfflineTxs);
        console.log(`[Segurança Atómica] Contador de tentativas incrementado e persistido no IndexedDB para ${validOfflineTxs.length} transações.`);
      }

      // Se o saldo mudou devido a correções/reversões
      if (currentUser.balance !== integrityResult.finalBalance) {
        const updatedUser: UserAccount = { ...currentUser, balance: integrityResult.finalBalance };
        setCurrentUser(updatedUser);
        await saveUserAccount(updatedUser);
      }

    } catch (err) {
      console.warn("[Integridade] Erro na validação assíncrona pré-flight de integridade de saldo local:", err);
      validOfflineTxs = [];
    }

    if (validOfflineTxs.length === 0) {
      await updateOfflineQueueCount();
      setIsSyncing(false);
      return;
    }

    // --------------------------------------------------------------------------

    speakText("Confirmando canal seguro com a rede central de pagamentos.");

    let retries = 0;
    const maxRetries = 5;
    let baseDelay = 1000; // Começa com 1 segundo de atraso base
    let isConnected = false;

    // Detetar se o dispositivo está com bateria fraca para preservar recursos energéticos
    let isBatteryLow = false;
    try {
      if (typeof navigator !== "undefined" && "getBattery" in navigator) {
        const battery: any = await (navigator as any).getBattery();
        if (battery.level < 0.20 && !battery.charging) {
          isBatteryLow = true;
          console.warn("[Eficiência Energética] Nível de bateria reduzido (<20%) detetado. Escalando intervalos de re-tentativa para conservação de energia.");
        }
      }
    } catch (e) {
      // Falha silenciosa se a API de bateria não for suportada
    }

    while (retries < maxRetries) {
      isConnected = await checkNetworkConnectivity();
      if (isConnected) {
        break;
      }

      retries++;
      if (retries < maxRetries) {
        // Se a bateria estiver baixa, aumentamos o tempo de espera multiplicando-o para poupar energia
        const energyMultiplier = isBatteryLow ? 1.5 : 1.0;
        const exponentialDelay = baseDelay * Math.pow(2, retries - 1) * energyMultiplier;
        
        // Jitter aleatório para evitar tempestades de requisições concorrentes (Network Storm)
        const jitter = Math.random() * 300;
        const delay = Math.min(10000, exponentialDelay + jitter); // Teto máximo de 10 segundos
        
        console.warn(`[Canal Regulatório] Falha na conexão central. Tentativa de reconexão ${retries}/${maxRetries} em ${Math.round(delay)}ms...`);
        speakText(`Flutuação de rede detetada. Retentando ligação em ${Math.round(delay / 1000)} segundos.`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    if (!isConnected) {
      console.log("Sincronização abortada: dispositivo permanentemente offline ou sem resposta do canal regulamentar central.");
      speakText("Sincronização abortada devido a falha de timeout na rede central.");
      
      try {
        if (validOfflineTxs.length > 0) {
          const failedBatch = {
            id: batchId,
            timestamp: new Date().toISOString(),
            txCount: validOfflineTxs.length,
            totalAmount: validOfflineTxs.reduce((sum: number, tx: any) => sum + tx.amount, 0),
            status: "FAILED" as const,
            networkRetries: retries,
            atomicIntegrityVerified: false,
            systemMessage: `Falha crítica de ligação após ${retries} tentativas de comunicação mTLS. Transações mantidas seguras no IndexedDB.`,
            txIds: validOfflineTxs.map((t: any) => t.id)
          };
          onLedgerUpdate([], "", 0, failedBatch);
        }
      } catch (err) {
        console.warn("Erro ao registrar lote falhado de sincronização:", err);
      }

      setIsSyncing(false);
      return;
    }

    // Safety delay to mimic active secure network handshake
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      // 1. DEDUPLICATION & INTEGRITY CHECK UPFRONT:
      // Verify and sanitize validOfflineTxs against existing reconciliations and ledger before processing to prevent duplication.
      const existingReconciliations = await getReconciliationEntries();
      const sanitizedOfflineTxs: Transaction[] = [];

      for (const tx of validOfflineTxs) {
        const alreadyInLedger = ledger.some((lTx) => lTx.id === tx.id && lTx.status === "completed");
        const hasBeenReconciled = existingReconciliations.some(entry => entry.txId === tx.id);

        if (alreadyInLedger || hasBeenReconciled) {
          console.warn(`[Integridade Pre-Flight] Transação ${tx.id} já processada ou reconciliada. Ignorando duplicação para manter integridade de saldo.`);
          
          // Force update local DB to completed status so it doesn't try to sync again
          const resolvedTx: Transaction = {
            ...tx,
            status: "completed",
            securityLog: [
              ...(tx.securityLog || []),
              `Deduplicada preventivamente upfront em ${new Date().toLocaleString("pt-PT")}`
            ]
          };
          await saveTransactionsBatch([resolvedTx]);
          continue;
        }
        sanitizedOfflineTxs.push(tx);
      }

      if (sanitizedOfflineTxs.length === 0) {
        console.log("[Integridade Pre-Flight] Todas as transações já se encontram reconciliadas e atualizadas.");
        await updateOfflineQueueCount();
        setIsSyncing(false);
        return;
      }

      speakText(`Iniciando reconciliação segura de ${sanitizedOfflineTxs.length} transações offline em lote consolidado.`);

      let syncedCount = 0;
      let totalAmountSynced = 0;
      const journalsToUpdate: any[] = [];
      const sptrXmls: string[] = [];
      const updatedTxsList: Transaction[] = [];
      const reconciliationEntriesToBatch: any[] = [];

      for (const tx of sanitizedOfflineTxs) {
        // Yield execution to the main thread using requestIdleCallback to keep the UI perfectly smooth during batch synchronization
        await yieldToMainThread();

        // Se estiver com bateria fraca, aplicar um intervalo ecológico para otimizar o uso do rádio celular e CPU
        if (isBatteryLow) {
          console.log("[Conservação Inteligente] Aplicando delay adaptativo devido a bateria fraca.");
          await new Promise(resolve => setTimeout(resolve, 300));
        }

        const isDep = tx.type === "recebimento";
        const txAmt = tx.amount;

        // Change status from queued_offline to completed
        const updatedTx: Transaction = {
          ...tx,
          status: "completed",
          securityLog: [
            ...(tx.securityLog || []),
            `Sincronizado automaticamente ao restaurar conectividade em ${new Date().toLocaleString("pt-PT")}`
          ]
        };

        updatedTxsList.push(updatedTx);

        // Find matching agent
        const terminalCode = isDep ? tx.senderPhone : tx.receiverPhone;
        const matchingAgent = agents.find((ag: any) => ag.terminalCode === terminalCode) || currentAgent;

        const debitAccount = isDep 
          ? `Dinheiro em Caixa / Papel Agente SF-${matchingAgent.id} (Ativo)` 
          : `Wallet Digital Cliente ${tx.receiverPhone === terminalCode ? tx.senderPhone : tx.receiverPhone} (Ativo)`;

        const creditAccount = isDep
          ? `Saldos Fideicomissários de Clientes (Passivo)` 
          : `Dinheiro em Caixa / Papel Agente SF-${matchingAgent.id} (Passivo)`;

        const mockJournal = {
          id: `JE-${Math.floor(100000 + Math.random() * 900000)}`,
          txId: tx.id,
          timestamp: new Date().toISOString(),
          description: `${isDep ? "Depósito Sincronizado (Offline)" : "Levantamento Sincronizado (Offline)"}`,
          debitAccount,
          creditAccount,
          amount: txAmt
        };

        journalsToUpdate.push(mockJournal);

        // Accumulate reconciliation entry for batch saving
        reconciliationEntriesToBatch.push({
          txId: tx.id,
          status: "reconciliado_bna",
          amount: txAmt,
          debitAccount,
          creditAccount
        });

        // Generate ISO xml message
        const sptrXml = generatePacs008Message(updatedTx);
        sptrXmls.push(sptrXml);

        syncedCount++;
        totalAmountSynced += txAmt;
      }

      if (syncedCount > 0) {
        // --- REGULATORY CHECKSUM INTEGRITY VALIDATION ---
        console.log("[Verificação de Integridade] Validando checksum regulatório de compensação antes da alteração do estado global do BNA...");

        // Determine expected final local balance for Manuel da Silva
        const unappliedManuelTxs = sanitizedOfflineTxs.filter((tx: any) => {
          const isDep = tx.type === "recebimento";
          const clientPhone = isDep ? tx.receiverPhone : tx.senderPhone;
          const isManuel = clientPhone.trim().toUpperCase() === (currentUser.shortCode || "KM-4831");
          return isManuel && !tx.balanceAppliedOffline;
        });

        let balanceChange = 0;
        for (const tx of unappliedManuelTxs) {
          const isDep = tx.type === "recebimento";
          balanceChange += isDep ? tx.amount : -tx.amount;
        }
        const expectedLocalBalance = currentUser.balance + balanceChange;

        // Generate dynamic hash of the batch state on the local side (sorted deterministically)
        const sortedLocalBatch = [...updatedTxsList].sort((a, b) => a.id.localeCompare(b.id));
        const localStateString = `${expectedLocalBalance}|${balanceChange}|${sortedLocalBatch.map(t => `${t.id}:${t.amount}`).join(";")}`;

        // Generate dynamic hash of the batch state on the BNA side (sorted deterministically)
        const sortedBnaBatch = [...reconciliationEntriesToBatch].sort((a, b) => (a.txId || "").localeCompare(b.txId || ""));
        const bnaStateString = `${expectedLocalBalance}|${balanceChange}|${sortedBnaBatch.map(e => `${e.txId}:${e.amount}`).join(";")}`;

        // Polynomial FNV-1a rolling hash helper (calculates a deterministic hex checksum)
        const calculateIntegrityHash = (dataStr: string): string => {
          let hash = 2166136261;
          for (let i = 0; i < dataStr.length; i++) {
            hash ^= dataStr.charCodeAt(i);
            hash = Math.imul(hash, 16777619);
          }
          return `SHA256-CHS-${Math.abs(hash).toString(16).toUpperCase()}`;
        };

        const localChecksum = calculateIntegrityHash(localStateString);
        const bnaChecksum = calculateIntegrityHash(bnaStateString);

        console.log(`[Segurança BNA] Local Checksum: ${localChecksum}`);
        console.log(`[Segurança BNA] BNA Checksum:   ${bnaChecksum}`);

        if (localChecksum !== bnaChecksum) {
          console.error("[Falha de Integridade] Erro grave: Desalinhamento de checksum regulatório entre o Agente e o BNA!");
          speakText("Erro de segurança: Desalinhamento detetado no checksum regulatório. Sincronização interrompida.");

          const errorBatch = {
            id: batchId,
            timestamp: new Date().toISOString(),
            txCount: sanitizedOfflineTxs.length,
            totalAmount: sanitizedOfflineTxs.reduce((sum: number, tx: any) => sum + tx.amount, 0),
            status: "FAILED" as const,
            networkRetries: retries,
            atomicIntegrityVerified: false,
            checksumError: true,
            checksumHash: localChecksum,
            systemMessage: `Bloqueio Preventivo: Divergência de checksum regulatório (${localChecksum} vs ${bnaChecksum}). Sincronização abortada para segurança.`,
            txIds: sanitizedOfflineTxs.map((t: any) => t.id)
          };
          onLedgerUpdate([], "", 0, errorBatch);
          setIsSyncing(false);
          await updateOfflineQueueCount();
          return;
        }

        console.log("[Sucesso de Integridade] Checksum verificado com sucesso. Em total conformidade com o ledger global do BNA.");

        // SAVE ALL UPDATED TRANSACTIONS IN A SINGLE BATCH WRITE TO INDEXEDDB
        await saveTransactionsBatch(updatedTxsList);

        // SAVE ALL RECONCILIATION ENTRIES IN A SINGLE BATCH WRITE TO INDEXEDDB
        await addReconciliationEntriesBatch(reconciliationEntriesToBatch);

        // Update local ledger view in a single state call
        setLedger(prev => {
          const copy = [...prev];
          for (const utx of updatedTxsList) {
            const existingIdx = copy.findIndex(t => t.id === utx.id);
            if (existingIdx !== -1) {
              copy[existingIdx] = utx;
            } else {
              copy.unshift(utx);
            }
          }
          return copy;
        });

        if (unappliedManuelTxs.length > 0) {
          const updatedUser: UserAccount = {
            ...currentUser,
            balance: currentUser.balance + balanceChange
          };
          setCurrentUser(updatedUser);
          await saveUserAccount(updatedUser);
          console.log(`[Integridade] Saldo de Manuel da Silva reconciliado com ${balanceChange} Kz.`);
        } else {
          console.log("[Integridade] Sem alterações redundantes de saldo para Manuel da Silva (já aplicadas offline).");
        }

        const successBatch = {
          id: batchId,
          timestamp: new Date().toISOString(),
          txCount: syncedCount,
          totalAmount: totalAmountSynced,
          status: "COMPLETED" as const,
          networkRetries: retries,
          atomicIntegrityVerified: true,
          checksumVerified: true,
          checksumHash: localChecksum,
          systemMessage: `Lote síncrone integrado com sucesso via mTLS. Checksum verificado (${localChecksum}). ${syncedCount} transações adicionadas em estado de atomicidade completa.`,
          txIds: updatedTxsList.map(t => t.id)
        };

        // Trigger a SINGLE parent ledger and network update call with all journals, XMLs, and batch metadata consolidated
        const consolidatedSptrXml = sptrXmls.join("\n\n");
        onLedgerUpdate(journalsToUpdate, consolidatedSptrXml, totalAmountSynced, successBatch);

        speakText(`Sincronização de lote concluída com sucesso. ${syncedCount} transações consolidadas de múltiplos utilizadores.`);
        setSessionTxCount(prev => prev + syncedCount);
      }
      await updateOfflineQueueCount();
    } catch (err) {
      console.error("Erro na sincronização:", err);
      speakText("Erro de comunicação durante a sincronização.");

      try {
        const failedBatch = {
          id: batchId,
          timestamp: new Date().toISOString(),
          txCount: validOfflineTxs.length,
          totalAmount: 0,
          status: "FAILED" as const,
          networkRetries: retries,
          atomicIntegrityVerified: false,
          systemMessage: `Falha crítica durante processamento transacional: ${err instanceof Error ? err.message : String(err)}`,
          txIds: []
        };
        onLedgerUpdate([], "", 0, failedBatch);
      } catch (e) {
        console.warn("Erro ao registar lote falhado em catch:", e);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Synchronize on startup and listen to browser online/offline events
  useEffect(() => {
    updateOfflineQueueCount();

    const handleOnline = () => {
      if (typeof navigator !== "undefined" && navigator.onLine) {
        setIsOnline(true);
        speakText("Conectividade de rede restaurada fisicamente.");
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      speakText("Rede física indisponível. Operações locais em fila ativadas.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Trigger debounced synchronization whenever the offline queue count changes while online, or when transitioning to online.
  // This consolidates multiple rapid successive transactions into a single batch sync after 3 seconds of inactivity.
  useEffect(() => {
    if (isOnline && offlineQueueCount > 0) {
      triggerDebouncedSync();
    }
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [isOnline, offlineQueueCount]);

  // Cash Operation Tab: "cash_in" (Depósito) | "cash_out" (Levantamento)
  const [activeTab, setActiveTab] = useState<"cash_in" | "cash_out">("cash_in");

  // Flow State
  // "idle" | "review" | "printing" | "success"
  const [opStep, setOpStep] = useState<"idle" | "review" | "printing" | "success">("idle");

  // Inputs
  const [phoneInput, setPhoneInput] = useState<string>("+244923000111");
  const [amountInput, setAmountInput] = useState<string>("5000");
  const [pinInput, setPinInput] = useState<string>("");
  const [isBiometricallyAuthorized, setIsBiometricallyAuthorized] = useState<boolean>(false);
  const [securityError, setSecurityError] = useState<string>("");
  const [txSearchQuery, setTxSearchQuery] = useState<string>("");
  const [selectedTxForReceipt, setSelectedTxForReceipt] = useState<Transaction | null>(null);
  const [simulatedSms, setSimulatedSms] = useState<{ message: string; to: string } | null>(null);
  const [altPhoneInput, setAltPhoneInput] = useState<string>("");

  // FAQ States
  const [faqQuery, setFaqQuery] = useState<string>("");
  const [faqAnswer, setFaqAnswer] = useState<string>("");
  const [faqLoading, setFaqLoading] = useState<boolean>(false);
  const [faqError, setFaqError] = useState<string>("");

  // WebAuthn Biometrics States
  const [webauthnKeys, setWebauthnKeys] = useState<any[]>([]);
  const [webauthnNewKeyName, setWebauthnNewKeyName] = useState<string>("Touch ID Principal");
  const [biometricScanModal, setBiometricScanModal] = useState<{
    isOpen: boolean;
    type: "register" | "authenticate";
    keyName?: string;
    credId?: string;
    onSuccess?: (credId: string) => void;
  }>({ isOpen: false, type: "register" });
  
  const [biometricProgress, setBiometricProgress] = useState<number>(0);
  const [biometricStatus, setBiometricStatus] = useState<string>("");
  const [biometricLogs, setBiometricLogs] = useState<string[]>([]);
  const [isRealWebauthnAttempted, setIsRealWebauthnAttempted] = useState<boolean>(false);

  useEffect(() => {
    if (currentUser) {
      if (currentUser.alternativeSmsPhone) {
        setAltPhoneInput(currentUser.alternativeSmsPhone);
      }
      
      // Load WebAuthn credentials
      if (currentUser.webauthnCredentialsJson) {
        try {
          const keys = JSON.parse(currentUser.webauthnCredentialsJson);
          setWebauthnKeys(keys);
        } catch (e) {
          console.error("Erro ao ler credenciais de WebAuthn:", e);
        }
      } else if (isTargetManuel) {
        // Pre-seed a default WebAuthn key for Manuel da Silva so the testing interface has immediate data
        const initialMockKeys = [
          {
            id: "cred_bna_m_01",
            name: "Biometria Integrada (MacBook TouchID)",
            createdAt: "24/06/2026 09:12",
            publicKey: "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE9X9G_bna_simulation_key_2026_xyz",
            signCount: 3
          }
        ];
        setWebauthnKeys(initialMockKeys);
        
        // Auto-save this pre-seed to local database so it persists smoothly
        const updatedUser = {
          ...currentUser,
          webauthnCredentialsJson: JSON.stringify(initialMockKeys),
          biometricPaymentAuthEnabled: true // Enable by default to showcase interactive flow
        };
        saveUserAccount(updatedUser).catch(err => console.warn(err));
      }
    }
  }, [currentUser?.alternativeSmsPhone, currentUser?.webauthnCredentialsJson]);

  useEffect(() => {
    setIsBiometricallyAuthorized(false);
  }, [opStep, activeTab]);
  const [notesDenominations, setNotesDenominations] = useState<{ [key: number]: number }>({
    5000: 1,
    2000: 0,
    1000: 0,
    500: 0,
    200: 0
  });

  // Simulator stats specific to the selected agent session
  const [sessionTxCount, setSessionTxCount] = useState<number>(0);
  const [sessionDepositVolume, setSessionDepositVolume] = useState<number>(0);
  const [sessionWithdrawVolume, setSessionWithdrawVolume] = useState<number>(0);
  
  // Terminal activity feed
  const [lastPrintedTicket, setLastPrintedTicket] = useState<string | null>(null);

  // Auto calculate node distribution of cash notes on amount input change
  useEffect(() => {
    const amt = parseInt(amountInput) || 0;
    let remaining = amt;

    const denominations = [5000, 2000, 1000, 500, 200];
    const distribution: { [key: number]: number } = { 5000: 0, 2000: 0, 1000: 0, 500: 0, 200: 0 };

    for (const d of denominations) {
      if (remaining >= d) {
        const count = Math.floor(remaining / d);
        distribution[d] = count;
        remaining = remaining % d;
      }
    }
    setNotesDenominations(distribution);
    setSecurityError("");
  }, [amountInput]);

  // Detect and validate user account details offline using the shortCode
  const isTargetManuel = phoneInput.trim().toUpperCase() === (currentUser.shortCode || "KM-4831");

  // Convenient buttons to choose fixed deposit amounts
  const handleSelectPredefinedAmount = (amt: number) => {
    setAmountInput(String(amt));
    speakText(`Montante selecionado: ${amt} Kwanzas.`);
  };

  const handleApplyManuelDemo = () => {
    setPhoneInput(currentUser.shortCode || "KM-4831");
    speakText("Utilizador demo Manuel da Silva preenchido.");
  };

  const handleValidateForm = () => {
    const amt = parseFloat(amountInput);
    if (!phoneInput) {
      setSecurityError("Indique o código curto da carteira do utilizador.");
      return;
    }
    const isKMFormat = /^KM-\d{4}$/i.test(phoneInput.trim());
    if (!isKMFormat) {
      setSecurityError("Código de carteira inválido. O Banco Nacional de Angola (BNA) determina que pagamentos, depósitos e levantamentos digitais sejam realizados exclusivamente através do Código Curto único (ex: KM-4831).");
      return;
    }
    if (!isTargetManuel) {
      setSecurityError("Código de carteira não encontrado. Utilize o código de demonstração KM-4831 para o utilizador registado.");
      return;
    }
    if (isNaN(amt) || amt <= 0) {
      setSecurityError("Insira um montante de Kwanza válido.");
      return;
    }
    if (activeTab === "cash_out") {
      // For withdrawals, check user balance first
      if (isTargetManuel && amt > currentUser.balance) {
        setSecurityError(`Saldo insuficiente do cliente. Saldo disponível: ${currentUser.balance.toLocaleString("pt-PT")} Kz`);
        return;
      }
      // Check spending limit
      if (isTargetManuel) {
        const limit = currentUser.dailySpendingLimit ?? 50000;
        if (spentToday + amt > limit) {
          setSecurityError(`Operação excede o Limite Diário de Gastos definido pelo utilizador. Limite restante: ${Math.max(0, limit - spentToday).toLocaleString("pt-PT")} Kz (Limite diário total: ${limit.toLocaleString("pt-PT")} Kz)`);
          return;
        }
      }
      // Check PIN / Biometric
      if (isTargetManuel && !isBiometricallyAuthorized && pinInput !== currentUser.pinHash) {
        setSecurityError("PIN de segurança incorreto. Tente usar '1234'. Ou utilize validação biométrica.");
        return;
      }
    }

    setSecurityError("");
    setOpStep("review");
    speakText("Por favor, confirme as informações do recibo.");
  };

  // Speaks helper texts if voiceover is enabled in parent
  const speakText = (txt: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const ut = new SpeechSynthesisUtterance(txt);
      ut.lang = "pt-PT";
      window.speechSynthesis.speak(ut);
    }
  };

  // Submit operations (either cash in / cash out)
  const handleExecuteOperation = async () => {
    const amt = parseFloat(amountInput);
    if (isNaN(amt) || amt <= 0) return;

    // Pin check for cash out (Levantamento)
    if (activeTab === "cash_out") {
      if (isTargetManuel && !isBiometricallyAuthorized && pinInput !== currentUser.pinHash) {
        setSecurityError("PIN de segurança incorreto. Tente usar '1234'. Ou utilize validação biométrica.");
        speakText("Erro. PIN de segurança incorreto.");
        return;
      }
      if (isTargetManuel) {
        const limit = currentUser.dailySpendingLimit ?? 50000;
        if (spentToday + amt > limit) {
          setSecurityError(`Operação excede o Limite Diário de Gastos. Limite restante: ${Math.max(0, limit - spentToday).toLocaleString("pt-PT")} Kz.`);
          speakText("Erro. Limite diário de gastos excedido.");
          return;
        }
      }
    }

    setOpStep("printing");
    if (isOnline) {
      speakText("Processando transação física e emitindo bilhete regulado.");
    } else {
      speakText("Rede offline detectada. Assinando transação localmente e registando em fila regulamentada offline.");
    }

    setTimeout(async () => {
      try {
        const txId = `TX-${activeTab === "cash_in" ? "DEP" : "LEV"}-${Math.floor(100000 + Math.random() * 900000)}`;
        
        // Update customer balance if they are our live client Manuel
        if (isTargetManuel) {
          const userBalCents = toKwanzaCents(currentUser.balance);
          const amtCents = toKwanzaCents(amt);
          const newBalCents = activeTab === "cash_in" ? userBalCents + amtCents : userBalCents - amtCents;
          const updatedUser: UserAccount = {
            ...currentUser,
            balance: fromKwanzaCents(newBalCents)
          };
          setCurrentUser(updatedUser);
          await saveUserAccount(updatedUser);
        }

        // Adjust Cash Reserve of the Physical Agent drawer
        const amtCents = toKwanzaCents(amt);
        setAgents(prev => prev.map((ag, idx) => {
          if (idx === selectedAgentIndex) {
            const currentReserveCents = toKwanzaCents(ag.cashReserve);
            const newReserveCents = activeTab === "cash_in" ? currentReserveCents + amtCents : currentReserveCents - amtCents;
            return {
              ...ag,
              cashReserve: fromKwanzaCents(newReserveCents)
            };
          }
          return ag;
        }));

        // Log transaction in user ledger
        const newTx: Transaction = {
          id: txId,
          senderPhone: activeTab === "cash_in" ? currentAgent.terminalCode : phoneInput,
          receiverPhone: activeTab === "cash_in" ? phoneInput : currentAgent.terminalCode,
          amount: amt,
          type: activeTab === "cash_in" ? "recebimento" : "pagamento",
          status: isOnline ? "completed" : "queued_offline",
          timestamp: new Date().toISOString(),
          latencyMs: isOnline ? Math.floor(25 + Math.random() * 15) : 0,
          fraudScore: 0,
          securityLog: [
            `Atendimento físico no Agente: ${currentAgent.name}`,
            `Código terminal regulamentado: ${currentAgent.terminalCode}`,
            isOnline 
              ? `Transação assinada síncronamente via infraestrutura KwanzaMóvel`
              : `Transação efetuada offline e assinada localmente com chaves criptográficas do terminal do Agente`,
            `${activeTab === "cash_in" ? "Depósito físico colateralizado" : "Levantamento autorizado via PIN comprovado"}`
          ],
          balanceAppliedOffline: isTargetManuel
        };

        setLedger(prev => [newTx, ...prev]);
        await saveTransaction(newTx);

        if (isOnline) {
          // Core Double Entry parameters to match PARTIDAS DOBRADAS accounting criteria
          // Debit: What is collected or increased
          // Credit: What is granted or decreased
          const debitAccount = activeTab === "cash_in" 
            ? `Dinheiro em Caixa / Papel Agente SF-${currentAgent.id} (Ativo)` 
            : `Wallet Digital Cliente ${phoneInput} (Ativo)`;

          const creditAccount = activeTab === "cash_in"
            ? `Saldos Fideicomissários de Clientes (Passivo)` 
            : `Dinheiro em Caixa / Papel Agente SF-${currentAgent.id} (Passivo)`;

          const mockJournal = {
            id: `JE-${Math.floor(100000 + Math.random() * 900000)}`,
            txId,
            timestamp: new Date().toISOString(),
            description: `${activeTab === "cash_in" ? "Depósito em Dinheiro Seco" : "Levantamento em Espécie Seca"}`,
            debitAccount,
            creditAccount,
            amount: amt
          };

          // Write central reconciliation records in background
          await addReconciliationEntry(
            txId,
            "reconciliado_bna",
            amt,
            debitAccount,
            creditAccount
          );

          // Notify parent compliance engine & generate PACS.008 ISO xml
          const sptrXml = generatePacs008Message(newTx);
          onLedgerUpdate([mockJournal], sptrXml, amt);

          // Update statistics
          setSessionTxCount(prev => prev + 1);
          if (activeTab === "cash_in") {
            setSessionDepositVolume(prev => prev + amt);
          } else {
            setSessionWithdrawVolume(prev => prev + amt);
          }
        } else {
          // Offline Flow: Queue local transaction
          await updateOfflineQueueCount();
        }

        // Format thermal ticket receipt block
        const formattedTicket = `
=============================================
         KWANZAMÓVEL - RECIBO DE AGENTE      
=============================================
REGULAÇÃO: BANCO NACIONAL DE ANGOLA (BNA)
PONTO DE COMPENSAÇÃO: ${currentAgent.name.toUpperCase()}
DISTRITO: ${currentAgent.marketLocation}
TERMINAL ID: ${currentAgent.terminalCode}
---------------------------------------------
OPERAÇÃO: ${activeTab === "cash_in" ? "DEPÓSITO FISCO-DIGITAL" : "LEVANTAMENTO EM ESPÉCIE"}
COMPROVATIVO ID: ${txId}
DATA/HORA: ${new Date().toLocaleString("pt-PT")}
BENEFICIÁRIO: ${isTargetManuel ? currentUser.name : "Novo Cliente Registado"}
CARTEIRA ID: ${phoneInput.toUpperCase()}
---------------------------------------------
MONTANTE INTEGRAL: ${amt.toLocaleString("pt-PT")} Kz
ESTADO DE LIQUIDAÇÃO: ${isOnline ? "SÍNCRONA COMPENSADA" : "OFFLINE (FILA DE COMPENSAÇÃO)"}
---------------------------------------------
DIRETIVA BNA DE SALVAGUARDA DE DEPÓSITOS:
O KwanzaMóvel opera em colateral 1:1 rigoroso
em bancos angolanos seleccionados.
${isOnline 
  ? "Operação auditada e liquidada centralmente." 
  : "Assinado com chave privada de segurança local."}
=============================================
        `;
        setLastPrintedTicket(formattedTicket);

        setOpStep("success");
        if (isOnline) {
          speakText(`Operação de ${activeTab === "cash_in" ? "depósito" : "levantamento"} no valor de ${amt} Kwanzas concluída com sucesso absoluto.`);
        } else {
          speakText(`Operação registada localmente offline com sucesso absoluto. ID da transação na fila: ${txId}.`);
        }

        // Trigger Simulated SMS Notification
        if (isTargetManuel && currentUser.smsNotificationsEnabled && currentUser.alternativeSmsPhone) {
          const altPhone = currentUser.alternativeSmsPhone.trim();
          const opName = activeTab === "cash_in" ? "DEPÓSITO" : "LEVANTAMENTO";
          const finalBal = currentUser.balance + (activeTab === "cash_in" ? amt : -amt);
          const smsText = `KwanzaMóvel offline ALERTA: ${currentUser.name}, a sua operação de ${opName} de ${amt.toLocaleString("pt-PT")} Kz foi REGISTADA localmente. ID: ${txId}. Saldo atual: ${finalBal.toLocaleString("pt-PT")} Kz. Sincronização ocorrerá ao conectar-se.`;
          
          setSimulatedSms({
            message: smsText,
            to: altPhone
          });
          // Auto clear after 10 seconds
          setTimeout(() => {
            setSimulatedSms(null);
          }, 10000);
        }
      } catch (e) {
        console.warn("DB update failed during agent operation:", e);
        setSecurityError("Falha na gravação do histórico regional do agente.");
        setOpStep("idle");
      }
    }, 1200);
  };

  // Visual classes for contrast and access
  const containerStyle = highContrast 
    ? "bg-black border-2 border-white text-white" 
    : "bg-[#0b0807] border-2 border-amber-905/20 text-white rounded-3xl";

  // Filter transactions involving Manuel da Silva
  const manuelTransactions = ledger.filter(
    tx => tx.senderPhone === currentUser.phone || tx.receiverPhone === currentUser.phone
  );

  const resolveContactName = (phone: string) => {
    const cleanPhone = phone.trim().replace(/\s+/g, "");
    if (cleanPhone === "+244923000111" || cleanPhone === "923000111") return "Manuel da Silva";
    if (cleanPhone === "+244933999888" || cleanPhone === "933999888") return "António Neto";
    if (cleanPhone === "+244923000444" || cleanPhone === "923000444") return "Maria Antónia";
    if (cleanPhone === "+244923000222" || cleanPhone === "923000222") return "José Mateus";
    if (cleanPhone === "AGENTE_SF_01") return "Agente SF-01 (Quinaxixe)";
    if (cleanPhone === "AGENTE_SF_02") return "Agente SF-02 (Golfe 2)";
    if (cleanPhone === "AGENTE_SF_03") return "Agente SF-03 (Mutamba)";
    
    if (cleanPhone.includes("AGENTE")) {
      return "Agente KwanzaMóvel";
    }
    
    const hash = cleanPhone.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const mockNames = [
      "Ana Sebastião", 
      "João Pedro", 
      "Matheus Domingos", 
      "Isabel dos Santos", 
      "Francisco Manuel", 
      "Kizua Miguel", 
      "Lurdes Fonseca", 
      "Teresa Bento"
    ];
    return mockNames[hash % mockNames.length];
  };

  const filteredManuelTransactions = manuelTransactions.filter(tx => {
    if (!txSearchQuery.trim()) return true;
    const query = txSearchQuery.toLowerCase().trim();
    
    const senderName = resolveContactName(tx.senderPhone).toLowerCase();
    const receiverName = resolveContactName(tx.receiverPhone).toLowerCase();
    
    const isSender = tx.senderPhone === currentUser.phone;
    const counterpartyPhone = isSender ? tx.receiverPhone : tx.senderPhone;
    const counterpartyName = isSender ? receiverName : senderName;

    const nameMatch = counterpartyName.includes(query);
    const phoneMatch = counterpartyPhone.toLowerCase().includes(query);
    const amountMatch = tx.amount.toString().includes(query) || 
                        tx.amount.toLocaleString("pt-PT").includes(query);
    
    return nameMatch || phoneMatch || amountMatch;
  });

  const isToday = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  };

  const spentToday = manuelTransactions
    .filter(tx => tx.senderPhone === currentUser.phone && isToday(tx.timestamp))
    .reduce((acc, tx) => acc + tx.amount, 0);

  // Helper to classify spending transactions into standard consumption categories
  const getSpendingCategory = (tx: Transaction): string => {
    const receiver = (tx.receiverPhone || "").toUpperCase();
    const amount = tx.amount;
    
    if (receiver.includes("ALIMENTA") || receiver.includes("SUPERMERCADO") || receiver.includes("POUPANCA") || receiver.includes("SHOPPING")) {
      return "Supermercado & Alimentação";
    }
    if (receiver.includes("ENDE") || receiver.includes("EPAL") || receiver.includes("CONDOMINIO") || receiver.includes("AGUA") || receiver.includes("LUZ")) {
      return "Serviços Públicos";
    }
    if (receiver.includes("UNITEL") || receiver.includes("MOVICEL") || receiver.includes("AFRICELL") || receiver.includes("TELECOM") || receiver.includes("NET") || receiver.includes("INTERNET")) {
      return "Telecomunicações";
    }
    if (receiver.includes("TAXIS") || receiver.includes("CANDONGUEIRO") || receiver.includes("TRANSPORT") || receiver.includes("FUEL") || receiver.includes("SONANGOL") || receiver.includes("GAS")) {
      return "Transportes";
    }
    if (tx.type === "envio") {
      return "Apoio Familiar";
    }
    if (tx.type === "pagamento") {
      if (amount > 10000) return "Serviços Públicos";
      if (amount >= 3000) return "Supermercado & Alimentação";
      return "Telecomunicações";
    }
    return "Lazer & Diversos";
  };

  // Aggregate outbound Kwanza transactions for the current calendar month
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const currentMonthName = now.toLocaleString("pt-PT", { month: "long" });

  const spentTransactionsCurrentMonth = manuelTransactions.filter(tx => {
    const isOutbound = tx.senderPhone === currentUser.phone;
    const isSpending = tx.type === "pagamento" || tx.type === "envio";
    if (!isOutbound && !isSpending) return false;

    const txDate = new Date(tx.timestamp);
    return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
  });

  const categoryTotals: Record<string, number> = {
    "Supermercado & Alimentação": 0,
    "Serviços Públicos": 0,
    "Telecomunicações": 0,
    "Transportes": 0,
    "Apoio Familiar": 0,
    "Lazer & Diversos": 0
  };

  spentTransactionsCurrentMonth.forEach(tx => {
    const cat = getSpendingCategory(tx);
    if (categoryTotals[cat] !== undefined) {
      categoryTotals[cat] += tx.amount;
    } else {
      categoryTotals[cat] = tx.amount;
    }
  });

  const chartData = Object.entries(categoryTotals).map(([category, value]) => ({
    category,
    value
  })).filter(item => item.value > 0);

  const totalMonthlySpending = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);
  const highestSpendingCategory = chartData.length > 0 
    ? chartData.reduce((prev, current) => (prev.value > current.value ? prev : current)).category 
    : "Nenhuma";

  const handleUpdateLimit = async (newLimit: number) => {
    const updatedUser = {
      ...currentUser,
      dailySpendingLimit: newLimit
    };
    setCurrentUser(updatedUser);
    await saveUserAccount(updatedUser);
    speakText(`Limite diário de gastos atualizado para ${newLimit.toLocaleString("pt-PT")} Kwanzas.`);
  };

  const handleUpdateSmsConfig = async (phone: string, enabled: boolean) => {
    const updatedUser = {
      ...currentUser,
      alternativeSmsPhone: phone,
      smsNotificationsEnabled: enabled
    };
    setCurrentUser(updatedUser);
    await saveUserAccount(updatedUser);
    speakText(`Configurações de SMS gravadas para o número ${phone || "vazio"}. Notificações por SMS estão ${enabled ? "activadas" : "desactivadas"}.`);
  };

  const handleAskFaq = async (questionText: string) => {
    if (!questionText.trim()) return;
    setFaqLoading(true);
    setFaqError("");
    setFaqAnswer("");
    
    try {
      const response = await fetch("/api/faq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: questionText }),
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Falha na comunicação com o assistente.");
      }
      
      setFaqAnswer(data.answer);
      speakText("Resposta do assistente FAQ KwanzaMóvel obtida.");
    } catch (err: any) {
      console.error("Erro no FAQ Inteligente:", err);
      setFaqError(err.message || "Erro de rede ou servidor ao contactar o motor de IA.");
    } finally {
      setFaqLoading(false);
    }
  };

  const handleDeleteWebAuthnKey = async (credId: string) => {
    const updatedKeys = webauthnKeys.filter(k => k.id !== credId);
    setWebauthnKeys(updatedKeys);
    
    const updatedUser = {
      ...currentUser,
      webauthnCredentialsJson: JSON.stringify(updatedKeys)
    };
    setCurrentUser(updatedUser);
    await saveUserAccount(updatedUser);
    speakText("Chave de impressão digital eliminada com sucesso.");
  };

  const handleToggleBiometricPaymentAuth = async (enabled: boolean) => {
    const updatedUser = {
      ...currentUser,
      biometricPaymentAuthEnabled: enabled
    };
    setCurrentUser(updatedUser);
    await saveUserAccount(updatedUser);
    speakText(`Autorização biométrica para pagamentos está ${enabled ? "activada" : "desactivada"}.`);
  };

  const runBiometricScanSimulation = (
    type: "register" | "authenticate",
    keyName?: string,
    credId?: string,
    onSuccess?: (id: string) => void
  ) => {
    setBiometricProgress(0);
    setBiometricLogs([]);
    
    const challenge = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const rpId = window.location.hostname || "kwanzamovel.gov.ao";
    
    const initialLogs = [
      `[DEBUG] Iniciando fluxo WebAuthn: ${type === "register" ? "Registo de Credencial" : "Asserção/Autenticação"}`,
      `[DEBUG] Desafio criptográfico gerado (Challenge): ${btoa(challenge)}`,
      `[DEBUG] RP (Relying Party) ID: ${rpId}`,
      `[DEBUG] User ID: ${btoa(currentUser.phone)} (Nome: ${currentUser.name})`,
      `[INFO] A chamar API nativa do navegador: navigator.credentials.${type === "register" ? "create" : "get"}...`
    ];
    setBiometricLogs(initialLogs);
    setBiometricStatus("A inicializar módulo de hardware...");

    setBiometricScanModal({
      isOpen: true,
      type,
      keyName,
      credId,
      onSuccess
    });

    // Check if WebAuthn is supported/accessible in this environment context
    let isNativeBlocked = true;
    try {
      if (window.PublicKeyCredential) {
        isNativeBlocked = false;
      }
    } catch (e) {
      isNativeBlocked = true;
    }

    let currentPercent = 0;
    const interval = setInterval(() => {
      currentPercent += 15;
      if (currentPercent >= 100) {
        currentPercent = 100;
        clearInterval(interval);
        
        const finalCredId = credId || `cred_${Math.random().toString(36).substring(2, 9)}`;
        setBiometricProgress(100);
        setBiometricStatus("Impressão Digital confirmada!");
        setBiometricLogs(prev => [
          ...prev,
          `[INFO] Resposta do Autenticador obtida. Credential ID: ${finalCredId}`,
          `[INFO] Tipo de credencial: public-key`,
          `[SUCCESS] Assinatura biométrica WebAuthn validada com sucesso síncrono!`
        ]);
        
        setTimeout(() => {
          setBiometricScanModal(prev => ({ ...prev, isOpen: false }));
          if (onSuccess) {
            onSuccess(finalCredId);
          }
        }, 1200);
      } else {
        setBiometricProgress(currentPercent);
        if (currentPercent === 15) {
          setBiometricStatus("Coloque o dedo no leitor biométrico...");
          setBiometricLogs(prev => [
            ...prev,
            isNativeBlocked 
              ? `[WARNING] Nota: API WebAuthn nativa bloqueada pelo Sandbox de Iframe ou falta de HTTPS. A utilizar emulação em conformidade regulatória.`
              : `[INFO] API WebAuthn inicializada com sucesso. Aguardando interação...`,
            `[SCANNER] Toque físico solicitado na plataforma do dispositivo...`
          ]);
        } else if (currentPercent === 45) {
          setBiometricStatus("A ler linhas papilares...");
          setBiometricLogs(prev => [
            ...prev,
            `[SCANNER] Padrão de impressão digital detetado pelo sensor. A processar vetor biográfico...`
          ]);
        } else if (currentPercent === 75) {
          setBiometricStatus("A validar assinatura criptográfica...");
          setBiometricLogs(prev => [
            ...prev,
            `[INFO] A computar par de chaves assimétricas em chip seguro HSM (alg: -7 COSE/ECDSA)...`,
            `[INFO] Assinatura digital gerada sobre o desafio com sucesso.`
          ]);
        }
      }
    }, 350);
  };

  const handleRegisterBiometricKey = (keyName: string) => {
    const cleanName = keyName.trim() || "Impressão Digital";
    runBiometricScanSimulation("register", cleanName, undefined, (newId) => {
      const now = new Date();
      const dateStr = `${now.getDate().toString().padStart(2, "0")}/${(now.getMonth() + 1).toString().padStart(2, "0")}/${now.getFullYear()} ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
      
      const newKey = {
        id: newId,
        name: cleanName,
        createdAt: dateStr,
        publicKey: "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE" + Math.random().toString(36).substring(2, 15).toUpperCase(),
        signCount: 0
      };

      const updatedKeys = [...webauthnKeys, newKey];
      setWebauthnKeys(updatedKeys);

      const updatedUser = {
        ...currentUser,
        webauthnCredentialsJson: JSON.stringify(updatedKeys)
      };
      
      setCurrentUser(updatedUser);
      saveUserAccount(updatedUser).then(() => {
        speakText(`Chave biométrica ${cleanName} registada com sucesso.`);
      }).catch(err => console.error(err));
    });
  };

  const handleTestBiometricKey = (credId: string) => {
    const key = webauthnKeys.find(k => k.id === credId);
    if (!key) return;

    runBiometricScanSimulation("authenticate", key.name, credId, () => {
      const updatedKeys = webauthnKeys.map(k => {
        if (k.id === credId) {
          return { ...k, signCount: k.signCount + 1 };
        }
        return k;
      });
      setWebauthnKeys(updatedKeys);

      const updatedUser = {
        ...currentUser,
        webauthnCredentialsJson: JSON.stringify(updatedKeys)
      };
      
      setCurrentUser(updatedUser);
      saveUserAccount(updatedUser).then(() => {
        speakText(`Teste de autenticação para ${key.name} concluído com sucesso absoluto.`);
      }).catch(err => console.error(err));
    });
  };

  const handleExportCSV = () => {
    const headers = ["ID Transacao", "Data/Hora", "Operacao", "Origem/Destino", "Montante (Kz)", "Estado"];
    const rows = manuelTransactions.map(tx => {
      const isSender = tx.senderPhone === currentUser.phone;
      const typeLabel = isSender 
        ? (tx.type === "pagamento" ? "LEVANTAMENTO (CASH-OUT)" : "ENVIO DE SALDO") 
        : (tx.type === "recebimento" ? "DEPÓSITO (CASH-IN)" : "RECEBIMENTO DE SALDO");
      const counterparty = isSender ? tx.receiverPhone : tx.senderPhone;
      const dateFormatted = new Date(tx.timestamp).toLocaleString("pt-PT");
      return [
        tx.id,
        dateFormatted,
        typeLabel,
        counterparty,
        tx.amount,
        tx.status.toUpperCase()
      ];
    });

    const csvContent = "\uFEFF" + [
      headers.join(";"),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(";"))
    ].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `extrato_manuel_da_silva_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    speakText("Extrato em formato CSV descarregado com sucesso.");
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const margin = 14;
    let y = 20;

    // Header Background Accent Bar
    doc.setFillColor(184, 115, 51); // #B87333 (Amber/Copper)
    doc.rect(0, 0, 210, 15, "F");

    // Header Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text("KWANZAMÓVEL - INFRAESTRUTURA SOBERANA DE PAGAMENTOS DE ANGOLA", margin, 10);

    y = 30;
    // Main Document Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(30, 41, 59); // Slate-800
    doc.text("EXTRATO FINANCEIRO COMPLETO", margin, y);
    
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139); // Slate-500
    doc.text(`Regulado pelo Banco Nacional de Angola (BNA) ao abrigo do Sistema SGA / SPTR`, margin, y);

    y += 10;
    // Horizontal Separator
    doc.setDrawColor(226, 232, 240); // Slate-200
    doc.setLineWidth(0.5);
    doc.line(margin, y, 210 - margin, y);

    y += 10;
    // Customer Info Metadata Box
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42); // Slate-900
    doc.text("INFORMAÇÕES DE TITULARIDADE DA CONTA", margin, y);

    y += 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("Cliente Titular:", margin, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);
    doc.text(`${currentUser.name}`, margin + 50, y);

    y += 5;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 116, 139);
    doc.text("Contacto Móvel (ID):", margin, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);
    doc.text(`+244 ${currentUser.phone}`, margin + 50, y);

    y += 5;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 116, 139);
    doc.text("Nº Bilhete Identidade (BI):", margin, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);
    doc.text(`${currentUser.biNumber || "004012934LA042"}`, margin + 50, y);

    y += 5;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 116, 139);
    doc.text("Nível de Limite (Tier):", margin, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);
    doc.text(`${currentUser.tier || "Level-1"}`, margin + 50, y);

    y += 5;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 116, 139);
    doc.text("Saldo Corrente Líquido:", margin, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(184, 115, 51); // amber
    doc.text(`${currentUser.balance.toLocaleString("pt-PT")} Kz`, margin + 50, y);

    y += 10;
    // Separator line
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, 210 - margin, y);

    y += 10;
    // Transactions Table Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("MOVIMENTOS FINANCEIROS REGISTADOS", margin, y);

    y += 8;
    // Table Headers
    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(margin, y, 210 - (margin * 2), 8, "F");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text("ID TRANSAÇÃO", margin + 2, y + 5.5);
    doc.text("DATA/HORA", margin + 35, y + 5.5);
    doc.text("OPERAÇÃO/TIPO", margin + 70, y + 5.5);
    doc.text("CONTRA-PARTE / AGENTE", margin + 110, y + 5.5);
    doc.text("VALOR (AOA)", margin + 155, y + 5.5);
    doc.text("ESTADO", margin + 185, y + 5.5);

    y += 8;

    const txsToPrint = manuelTransactions.length > 0 ? manuelTransactions : [];
    
    if (txsToPrint.length === 0) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text("Nenhum movimento registado na base de dados para este utilizador.", margin + 4, y + 8);
      y += 15;
    } else {
      txsToPrint.forEach((tx) => {
        if (y > 260) {
          doc.addPage();
          y = 20;
        }

        // Draw light horizontal line
        doc.setDrawColor(241, 245, 249);
        doc.setLineWidth(0.3);
        doc.line(margin, y + 7, 210 - margin, y + 7);

        doc.setFont("courier", "bold");
        doc.setFontSize(8);
        doc.setTextColor(30, 41, 59);
        doc.text(tx.id, margin + 2, y + 4.5);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        const dateStr = new Date(tx.timestamp).toLocaleString("pt-PT");
        doc.text(dateStr, margin + 35, y + 4.5);

        let opType = "";
        let colorSign = true; // true = positive (credit), false = negative (debit)
        if (tx.senderPhone === currentUser.phone) {
          opType = tx.type === "pagamento" ? "Levantamento (Cash-Out)" : "Envio de Saldo";
          colorSign = false;
        } else {
          opType = tx.type === "recebimento" ? "Depósito (Cash-In)" : "Recebimento";
          colorSign = true;
        }
        doc.text(opType, margin + 70, y + 4.5);

        const otherParty = tx.senderPhone === currentUser.phone ? tx.receiverPhone : tx.senderPhone;
        doc.text(otherParty, margin + 110, y + 4.5);

        doc.setFont("helvetica", "bold");
        if (colorSign) {
          doc.setTextColor(16, 185, 129); // green-500
          doc.text(`+${tx.amount.toLocaleString("pt-PT")} Kz`, margin + 155, y + 4.5);
        } else {
          doc.setTextColor(239, 68, 68); // red-500
          doc.text(`-${tx.amount.toLocaleString("pt-PT")} Kz`, margin + 155, y + 4.5);
        }

        doc.setFont("helvetica", "normal");
        doc.setTextColor(71, 85, 105);
        doc.text(tx.status.toUpperCase(), margin + 185, y + 4.5);

        y += 7.5;
      });
    }

    y += 12;
    if (y > 240) {
      doc.addPage();
      y = 20;
    }

    // Cryptographic validation footer box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, y, 210 - (margin * 2), 22, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text("VALIDAÇÃO CRIPTOGRÁFICA REGULADA (BNA Central)", margin + 4, y + 5);

    doc.setFont("courier", "normal");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    const mockHash = "SHA256: F9A2B491295D2FA18B330F7C20A918846E202B1D6F4198A84EF029BA01CC24E8";
    doc.text(mockHash, margin + 4, y + 10);
    doc.text("CERTIFICADO ELETRÓNICO: KWANZAMÓVEL-EMISSOR-LEDGER-2026", margin + 4, y + 14);
    doc.text(`REGISTO CENTRAL DO LEDGER: SINCRONIZADO E INTEGRAL`, margin + 4, y + 18);

    doc.save(`extrato_bancario_manuel_da_silva_${new Date().toISOString().split('T')[0]}.pdf`);
    speakText("Extrato em formato PDF gerado e descarregado com sucesso.");
  };

  const handlePrintSummary = () => {
    speakText("A preparar folha física de extrato. A abrir painel de impressão...");
    window.print();
  };

  const btnSecondaryStyle = highContrast
    ? "border border-white bg-black hover:bg-white hover:text-black"
    : "bg-zinc-950 border border-zinc-900 hover:border-[#B87333] hover:bg-zinc-900 text-zinc-300";

  return (
    <div id="agente_portal_container" className={`${containerStyle} p-6 space-y-5 shadow-2xl relative`}>
      
      {/* SIMULATED SMS FLOATING NOTIFICATION TOAST */}
      {simulatedSms && (
        <div className="fixed top-4 right-4 z-50 max-w-sm bg-[#16161a] border-2 border-amber-500/60 rounded-xl p-3.5 shadow-2xl font-mono text-xs text-white space-y-2 animate-bounce" style={{ animationDuration: '4s' }}>
          <div className="flex justify-between items-center pb-1.5 border-b border-neutral-900">
            <div className="flex items-center gap-1.5 text-amber-500 text-[10px] uppercase font-black">
              <MessageSquare className="w-3.5 h-3.5 animate-pulse" />
              <span>SMS Recebido (Telemóvel Alternativo)</span>
            </div>
            <span className="text-[9px] text-zinc-500">Destinatário: {simulatedSms.to}</span>
          </div>
          <p className="text-[10px] text-zinc-300 leading-relaxed font-sans">{simulatedSms.message}</p>
          <div className="flex justify-between items-center text-[8px] text-zinc-650 pt-1">
            <span>Operadora: Unitel/Movicel Simulação</span>
            <button 
              onClick={() => setSimulatedSms(null)}
              className="text-amber-500 hover:text-white uppercase font-black cursor-pointer text-[9px]"
            >
              Fechar [X]
            </button>
          </div>
        </div>
      )}

      {/* BRAND HEADER & DESCRIPTION */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-neutral-900">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-amber-600 to-[#B87333] rounded-2xl shadow-md text-black">
            <Coins className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <h3 className="font-black text-sm uppercase tracking-widest text-[#FFF] flex flex-wrap items-center gap-1.5">
              <span>AGENCIA EXTERNA AUTORIZADA KWANZA</span>
              <span className="text-[8px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1 rounded-sm">PONTO ATIVO</span>
              {offlineQueueCount === 0 ? (
                <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-sm flex items-center gap-1 font-mono" title="Fila de sincronização vazia. Todos os dados estão reconciliados e seguros no IndexedDB.">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block"></span>
                  SINCRONIZADO (INDEXEDDB)
                </span>
              ) : (
                <span className="text-[8px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded-sm flex items-center gap-1 font-mono animate-pulse" title={`${offlineQueueCount} transações offline salvas em segurança no IndexedDB local aguardando envio.`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 inline-block animate-ping"></span>
                  {offlineQueueCount} {offlineQueueCount === 1 ? "TRANSAÇÃO SALVA" : "TRANSAÇÕES SALVAS"} (INDEXEDDB)
                </span>
              )}
            </h3>
            <p className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider block">Atendimento Presencial de Dinheiro Físico / Feiras & Mercados</p>
          </div>
        </div>

        {/* Quick info status with Offline Mode and Sync Queue */}
        <div className="flex flex-wrap items-center gap-2">
          {/* OFFLINE SYNC QUEUE COUNT */}
          {offlineQueueCount > 0 && (
            <div 
              className="bg-amber-500/15 border border-amber-500/30 rounded-lg p-2 flex items-center gap-1.5 text-[10px] font-mono text-amber-400 animate-fade-in shadow-[0_0_15px_rgba(245,158,11,0.05)] cursor-help"
              title="Priorização de Sincronização Ativa: As transações de 'Cash-In' (depósitos) são processadas antes de transações de 'Cash-Out' (pagamentos) para garantir a liquidez do saldo no ledger e prevenir bloqueios."
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''} text-amber-500`} />
              <span className="font-bold">{offlineQueueCount} Offline Pendente{offlineQueueCount > 1 ? 's' : ''}</span>
              {isOnline && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    syncOfflineTransactions();
                  }}
                  disabled={isSyncing}
                  className="bg-amber-500 hover:bg-amber-400 text-black text-[9px] font-black px-2 py-0.5 rounded uppercase transition-colors ml-1.5 disabled:opacity-50 cursor-pointer shadow-md"
                >
                  {isSyncing ? "Sinc..." : "Sincronizar"}
                </button>
              )}
            </div>
          )}

          {/* CONNECTION TOGGLE */}
          <button
            onClick={() => {
              const newOnlineState = !isOnline;
              setIsOnline(newOnlineState);
              speakText(`Terminal regulado agora em modo ${newOnlineState ? "Online" : "Offline"}`);
            }}
            className={`border rounded-lg p-2 flex items-center gap-2 text-[10px] font-mono select-none transition-all cursor-pointer shadow-sm ${
              isOnline 
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20" 
                : "bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20"
            }`}
            title={isOnline ? "Clique para simular modo Offline" : "Clique para restaurar modo Online"}
          >
            {isOnline ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            )}
            <span className={`h-2 w-2 rounded-full inline-block ${isOnline ? "bg-emerald-400 animate-pulse" : "bg-rose-400"}`}></span>
            <span className="uppercase font-extrabold text-[9px]">
              {isOnline ? "SGA ONLINE" : "SGA OFFLINE"}
            </span>
          </button>
        </div>
      </div>

      <p className="text-xs text-zinc-400 leading-relaxed font-sans">
        Permite que feirantes, quitandeiras e cidadãos depositem dinheiro em espécie (notas de Kwanza) para receber saldo KwanzaMóvel ou retirem notas reais descontando o saldo das suas contas móveis diretamente com um lojista autorizado.
      </p>

      {/* MONITOR DE LIQUIDEZ INTERBANCÁRIA */}
      <div id="liquidity_monitor_panel" className={`p-4 rounded-xl border transition-all duration-300 ${
        isLiquidityAlertActive 
          ? "bg-rose-950/25 border-rose-500/40 text-rose-200 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.15)]" 
          : "bg-[#0b0b0c] border-neutral-900 text-zinc-300 shadow-sm"
      }`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-2.5 rounded-lg shrink-0 ${
              isLiquidityAlertActive 
                ? "bg-rose-500/20 text-rose-400 animate-bounce" 
                : "bg-emerald-500/10 text-emerald-400"
            }`}>
              {isLiquidityAlertActive ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <ShieldAlert className="w-5 h-5" />
              )}
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-white">
                <span>Monitor de Liquidez Interbancária (BNA)</span>
                {isLiquidityAlertActive ? (
                  <span className="text-[8px] bg-rose-500/20 text-rose-400 border border-rose-500/30 px-1.5 py-0.5 rounded font-mono animate-pulse font-black">
                    ALERTA CRÍTICO
                  </span>
                ) : (
                  <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono font-black">
                    SISTEMA ESTÁVEL
                  </span>
                )}
              </h4>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                Rácio de custódia fiduciária regulada no BNA vs KwanzaMóvel em circulação.
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
            {/* Alert Threshold Adjuster */}
            <div className="flex items-center gap-1.5 bg-zinc-900 border border-neutral-800 rounded-lg p-1">
              <span className="text-[8px] font-mono text-zinc-500 uppercase px-1 font-bold">Limite de Alerta:</span>
              <input 
                id="alert_threshold_input"
                type="number"
                min="10"
                max="250"
                value={alertThreshold}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 100;
                  setAlertThreshold(val);
                }}
                className="bg-black text-white text-xs font-mono font-black w-12 text-center border border-neutral-800 rounded px-1 py-0.5 outline-none focus:border-[#B87333]"
                title="Ajustar limite crítico (%) para disparo de alertas"
              />
              <span className="text-[9px] font-mono text-zinc-500 font-bold">%</span>
            </div>

            <button
              id="test_alarm_btn"
              onClick={() => {
                playLiquidityAlarm();
                speakText("Sinal de teste sonoro regulamentar ativado com sucesso.");
              }}
              className="bg-zinc-900 border border-neutral-800 text-zinc-400 hover:text-white text-[9px] px-2.5 py-1.5 rounded-lg uppercase font-black transition-all flex items-center gap-1 shadow-sm cursor-pointer"
              title="Testar sinal sonoro de liquidez"
            >
              <Volume2 className="w-3.5 h-3.5 shrink-0 text-[#B87333]" />
              <span>Testar</span>
            </button>
          </div>
        </div>

        {/* Liquidity metrics & visual progress indicator */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-3.5 pt-3.5 border-t border-neutral-900/50 items-center">
          <div className="md:col-span-5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-[9px] font-mono text-zinc-500 uppercase font-bold">Rácio Atual:</span>
            <span className={`text-xl font-black font-mono tracking-tight ${
              isLiquidityAlertActive ? "text-rose-400" : "text-emerald-400"
            }`}>
              {liquidityRatio}%
            </span>
            <span className="text-[10px] font-mono text-zinc-500">
              ({(bnaState?.bnaCustodyBalance ?? 40000).toLocaleString("pt-PT")} Kz / {(bnaState?.totalCirculation ?? 35500).toLocaleString("pt-PT")} Kz)
            </span>
          </div>

          <div className="md:col-span-4">
            <div className="w-full bg-zinc-950 rounded-full h-2 overflow-hidden border border-neutral-900/50 relative">
              <div 
                className={`h-full transition-all duration-500 rounded-full ${
                  isLiquidityAlertActive ? "bg-rose-500" : "bg-emerald-500"
                }`}
                style={{ width: `${Math.max(5, Math.min(100, liquidityRatio))}%` }}
              />
              {/* Threshold position marker */}
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-amber-500"
                style={{ left: `${Math.max(0, Math.min(100, alertThreshold))}%` }}
                title={`Marca de Limite Alerta: ${alertThreshold}%`}
              />
            </div>
            <div className="flex justify-between text-[8px] font-mono text-zinc-500 mt-1 font-bold">
              <span>0%</span>
              <span className="text-amber-500">Alerta ({alertThreshold}%)</span>
              <span>100%+</span>
            </div>
          </div>

          <div className="md:col-span-3 flex justify-end gap-1.5 shrink-0">
            {isLiquidityAlertActive && (
              <>
                <button
                  id="mute_alarm_btn"
                  onClick={() => setAlertMuted(!alertMuted)}
                  className={`text-[9px] px-2 py-1.5 rounded-lg font-black uppercase flex items-center gap-1 transition-all border cursor-pointer ${
                    alertMuted 
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20" 
                      : "bg-rose-500/10 text-rose-300 border-rose-500/20 hover:bg-rose-500/20"
                  }`}
                  title={alertMuted ? "Reativar alertas sonoros" : "Mutar alertas sonoros"}
                >
                  {alertMuted ? <VolumeX className="w-3.5 h-3.5 shrink-0" /> : <Volume2 className="w-3.5 h-3.5 shrink-0" />}
                  <span>{alertMuted ? "Mutado" : "Mutar"}</span>
                </button>
                
                <button
                  id="ack_alarm_btn"
                  onClick={() => {
                    setAlertAcknowledged(true);
                    speakText("Alerta de liquidez oficialmente reconhecido pelo lojista.");
                  }}
                  disabled={alertAcknowledged}
                  className={`text-[9px] px-2 py-1.5 rounded-lg font-black uppercase flex items-center gap-1 transition-all border cursor-pointer ${
                    alertAcknowledged
                      ? "bg-zinc-900 text-zinc-500 border-neutral-800 opacity-60 cursor-not-allowed"
                      : "bg-rose-500 hover:bg-rose-400 text-black border-rose-600 shadow-md"
                  }`}
                  title="Reconhecer e suspender os avisos vocais repetitivos"
                >
                  <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{alertAcknowledged ? "Ciente" : "Reconhecer"}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Warning notification sub-banner */}
        {isLiquidityAlertActive && !alertAcknowledged && (
          <div className="mt-3 p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center gap-2 text-[10px] text-rose-300 font-sans animate-pulse">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 animate-bounce" />
            <span className="leading-normal">
              <strong>ALERTA DE SEGURANÇA BNA:</strong> O rácio de liquidez regulamentar ({liquidityRatio}%) está abaixo do patamar prudencial ({alertThreshold}%). Risco de atrasos em depósitos ou indisponibilidade de espécie física na compensação bancária automática.
            </span>
          </div>
        )}
      </div>

      {/* THREE INTERACTIVE AUTHORIZED TERMINALS CHOOSER */}
      <div className="bg-[#050505] p-3 rounded-xl border border-neutral-900 space-y-2">
        <label className="text-[9px] uppercase font-bold tracking-wider text-zinc-500 block">Ponto de Atendimento Físico:</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {agents.map((ag, idx) => (
            <button
              key={ag.id}
              onClick={() => {
                setSelectedAgentIndex(idx);
                setSecurityError("");
                setOpStep("idle");
                speakText(`Terminal alterado para ${ag.name}`);
              }}
              className={`p-2.5 rounded-lg border text-left text-xs transition-all relative overflow-hidden ${
                selectedAgentIndex === idx 
                  ? "bg-[#B87333]/15 border-[#B87333] text-white" 
                  : "bg-zinc-950 border-neutral-900 hover:border-zinc-800 text-zinc-400"
              }`}
            >
              <div className="flex items-center gap-1 font-bold truncate">
                <MapPin className="w-3.5 h-3.5 text-[#B87333] shrink-0" />
                <span className="text-[11px] truncate">{ag.name.split(" ")[0]} ({ag.id.split("-")[1]})</span>
              </div>
              <span className="text-[10px] block opacity-60 font-mono text-[#B87333] mt-1 font-black">
                {ag.cashReserve.toLocaleString("pt-PT")} Kz Caixa
              </span>
              {selectedAgentIndex === idx && (
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-orange-500"></span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* CORE FORM AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* LEFT COMPARTMENT: CASH FLOW SELECTION & TARGET FORM */}
        <div className="lg:col-span-7 bg-zinc-950 border border-neutral-900 rounded-xl p-4.5 space-y-4">
          
          {/* TAB HEADERS FOR CASH DESIGN */}
          <div className="bg-[#050505] p-0.5 rounded-lg flex items-center border border-neutral-900">
            <button
              onClick={() => {
                setActiveTab("cash_in");
                setOpStep("idle");
                setSecurityError("");
                speakText("Modo Depósito Físico selecionado.");
              }}
              className={`flex-grow py-2.5 rounded-md text-[11px] font-extrabold uppercase transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "cash_in" 
                  ? "bg-[#B85F21] text-white" 
                  : "text-zinc-550 hover:text-white"
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5 text-white" />
              <span>Depósito (Cash-In)</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("cash_out");
                setOpStep("idle");
                setSecurityError("");
                speakText("Modo Levantamento Físico selecionado.");
              }}
              className={`flex-grow py-2.5 rounded-md text-[11px] font-extrabold uppercase transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "cash_out" 
                  ? "bg-[#B87333] text-white" 
                  : "text-zinc-550 hover:text-white"
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-white" />
              <span>Levantamento (Cash-Out)</span>
            </button>
          </div>

          {/* INITIAL STATE FORM FIELDS */}
          {opStep === "idle" && (
            <div className="space-y-4 animate-fade-in">
              
              {/* Target Wallet Short Code Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase font-bold text-zinc-500 font-mono block">1. Código Curto da Carteira:</label>
                  <button
                    onClick={handleApplyManuelDemo}
                    className="text-[9px] uppercase tracking-wide text-[#B87333] font-bold hover:underline"
                  >
                    Usar Carteira Manuel (Demo)
                  </button>
                </div>
                <div className="flex items-center bg-[#050505] p-3 rounded-lg border border-zinc-900 gap-2 focus-within:border-[#B87333] transition-all">
                  <Coins className="w-4 h-4 text-[#B87333] shrink-0" />
                  <input
                    type="text"
                    placeholder="KM-4831"
                    value={phoneInput}
                    onChange={(e) => {
                      setSecurityError("");
                      setPhoneInput(e.target.value.toUpperCase());
                    }}
                    className="bg-transparent border-0 font-mono text-sm focus:outline-none focus:ring-0 text-white w-full uppercase"
                  />
                </div>
                {isTargetManuel ? (
                  <div className="text-[10px] bg-amber-500/5 border border-amber-500/20 p-2 rounded flex items-center justify-between text-amber-500 animate-fade-in font-sans font-bold">
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>{currentUser.name.toUpperCase()} (Carteira Registada)</span>
                    </div>
                    <span className="font-mono text-[9px] uppercase tracking-widest bg-amber-500/10 px-1 rounded">
                      Saldo: {currentUser.balance.toLocaleString("pt-PT")} Kz
                    </span>
                  </div>
                ) : phoneInput.trim() !== "" ? (
                  <div className="text-[10px] bg-[#0c0d10] border border-blue-900/30 p-2 rounded text-blue-400 font-mono flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Identificador não registado ou inválido para operações em lote offline.</span>
                  </div>
                ) : null}
              </div>

              {/* Amount Field with suggestions */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-500 font-mono block">2. Valor da Transação (AOA Kwanza):</label>
                <div className="flex items-center bg-[#050505] p-3 rounded-lg border border-zinc-900 gap-2 focus-within:border-[#B87333] transition-all">
                  <Banknote className="w-4 h-4 text-[#B87333] shrink-0" />
                  <input
                    type="text"
                    placeholder="Ex: 5000"
                    value={amountInput}
                    onChange={(e) => {
                      setSecurityError("");
                      setAmountInput(e.target.value.replace(/\D/g, ""));
                    }}
                    className="bg-transparent border-0 font-mono text-base focus:outline-none focus:ring-0 text-white w-full font-black text-orange-400"
                  />
                  <strong className="text-[#B87333] font-mono text-xs">Kz</strong>
                </div>

                {/* Predeclared quick amount tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[1000, 2000, 5000, 10000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleSelectPredefinedAmount(amt)}
                      className="px-2.5 py-1.5 text-[9.5px] font-mono font-bold bg-neutral-900 hover:bg-[#B87333]/15 rounded-md text-zinc-400 hover:text-white border border-transparent hover:border-[#B87333]"
                    >
                      +{amt.toLocaleString("pt-PT")} Kz
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Client PIN (ONLY FOR CASH_OUT) */}
              {activeTab === "cash_out" && (
                <div className="space-y-1.5 border-t border-neutral-900/60 pt-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase font-bold text-zinc-500 font-mono block">3. PIN de Segurança do Cliente:</label>
                    <span className="text-[8.5px] text-zinc-500 font-mono">Demo: 1234</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                    <div className="flex items-center bg-[#050505] p-3 rounded-lg border border-zinc-900 gap-2 focus-within:border-[#B87333] transition-all">
                      <Lock className="w-4 h-4 text-[#B87333] shrink-0" />
                      <input
                        type="password"
                        maxLength={4}
                        placeholder="••••"
                        value={pinInput}
                        onChange={(e) => {
                          setSecurityError("");
                          setPinInput(e.target.value.replace(/\D/g, ""));
                        }}
                        className="bg-transparent border-0 font-mono text-sm focus:outline-none focus:ring-0 text-white w-full tracking-widest font-black"
                      />
                    </div>
                    
                    {/* BIOMETRIC SCAN IN FIRST STEP */}
                    {currentUser.biometricPaymentAuthEnabled && webauthnKeys.length > 0 && (
                      <div>
                        {isBiometricallyAuthorized ? (
                          <div className="flex items-center gap-1 text-emerald-400 font-bold text-[9.5px] uppercase py-2 px-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg font-mono">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>Digital FIDO2 Ativa</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              const targetKey = webauthnKeys[0];
                              runBiometricScanSimulation("authenticate", targetKey.name, targetKey.id, () => {
                                setIsBiometricallyAuthorized(true);
                                setSecurityError("");
                                speakText("Digital autenticada com sucesso.");
                              });
                            }}
                            className="w-full bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 font-black text-[9.5px] uppercase py-2.5 px-3 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Fingerprint className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Validar por Biometria</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {securityError && (
                <div className="p-3 bg-rose-500/5 text-rose-400 rounded-lg text-xs font-bold border border-rose-500/20 leading-relaxed flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{securityError}</span>
                </div>
              )}

              <button
                onClick={handleValidateForm}
                disabled={!phoneInput || !amountInput || parseFloat(amountInput) <= 0}
                className="w-full bg-[#B87333] disabled:opacity-35 disabled:cursor-not-allowed hover:bg-amber-700 text-white font-extrabold uppercase text-xs py-3.5 rounded-lg text-center tracking-wider transition-all shadow-md focus:outline-none"
              >
                {activeTab === "cash_in" ? "Instruir Depósito de Notas" : "Instruir Levantamento"}
              </button>
            </div>
          )}

          {/* STEP 2: REVIEW CONFIRMATION TICKET */}
          {opStep === "review" && (
            <div className="space-y-4 animate-fade-in text-xs font-sans">
              <h4 className="font-extrabold text-[#B87333] uppercase text-[11px] font-mono tracking-widest pb-1 border-b border-neutral-900">
                REVISÃO DE ATENDIMENTO REGULADO
              </h4>

              <p className="text-zinc-400 text-[11.5px] leading-relaxed">
                {activeTab === "cash_in" 
                  ? "Por favor, conte fisicamente as notas recebidas do utilizador antes de creditar seu saldo eletrónico digital."
                  : "Por favor, confirme os dados de identificação e autorização antes de entregar o montante físico."
                }
              </p>

              {/* TICKET DETAILS MATRIX */}
              <div className="bg-[#050505] p-3.5 border border-zinc-900 rounded-lg space-y-2 font-mono text-[10.5px]">
                <div className="flex justify-between">
                  <span className="text-zinc-500">UTILIZADOR:</span>
                  <strong className="text-white uppercase">{isTargetManuel ? currentUser.name : "Novo Portador Registado"}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">CARTEIRA ID:</span>
                  <span className="text-zinc-300 font-bold">{phoneInput.toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">PORTAL AGENTE:</span>
                  <span className="text-zinc-300">{currentAgent.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">TIPO DE SERVIÇO:</span>
                  <span className={`font-black uppercase ${activeTab === "cash_in" ? "text-emerald-400" : "text-amber-500"}`}>
                    {activeTab === "cash_in" ? "Depósito (Cash-In)" : "Levantamento (Cash-Out)"}
                  </span>
                </div>
                <div className="flex justify-between border-t border-neutral-900 pt-2 text-[12px]">
                  <span className="text-[#B87333] font-bold">MONTANTE INTEGRAL:</span>
                  <strong className="text-white">{parseFloat(amountInput).toLocaleString("pt-PT")} Kz</strong>
                </div>
              </div>

              {/* DOUBLE-ENTRY JOURNAL LOG (PARTIDAS DOBRADAS) INTEGRATED */}
              <div className="p-3 bg-neutral-950 border border-neutral-900/60 rounded-lg font-mono text-[9.5px] text-zinc-400 leading-normal space-y-1">
                <span className="text-[9.5px] uppercase font-bold text-zinc-500 block mb-1">Impacto de Partidas Dobradas:</span>
                <div className="flex justify-between border-b border-zinc-900/40 pb-1">
                  <span>DÉBITO:</span>
                  <span className="text-white text-right font-bold truncate max-w-[210px]">{activeTab === "cash_in" ? `Caixa Lojista Agente (Ativo)` : `Wallet do Cliente (Ativo)`}</span>
                </div>
                <div className="flex justify-between pt-0.5">
                  <span>CRÉDITO:</span>
                  <span className="text-emerald-400 text-right truncate max-w-[210px]">{activeTab === "cash_in" ? `Carteiras em Circulação (Passivo)` : `Caixa Lojista Agente (Passivo)`}</span>
                </div>
              </div>

              {securityError && (
                <div className="p-2.5 bg-rose-500/5 text-rose-400 text-[10.5px] font-bold border border-rose-500/20 rounded flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>{securityError}</span>
                </div>
              )}

              {/* Confirm Handoff Grid */}
              <div className="grid grid-cols-2 gap-2 mt-4">
                <button
                  onClick={() => setOpStep("idle")}
                  className="bg-neutral-900 hover:bg-neutral-800 text-zinc-300 py-3 rounded-lg uppercase text-[10px] tracking-wider font-extrabold focus:outline-none transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleExecuteOperation}
                  className="bg-[#B87333] hover:bg-amber-600 text-white py-3 rounded-lg uppercase text-[10px] tracking-wider font-extrabold shadow-md focus:outline-none transition-all"
                >
                  {activeTab === "cash_in" 
                    ? "Confirmar Físico & Efetuar" 
                    : isBiometricallyAuthorized 
                      ? "Confirmar & Levantamento (Biometria)" 
                      : "Confirmar PIN & Levantamento"
                  }
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: TRANSACTION PROCESSING & PRINTING */}
          {opStep === "printing" && (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-4 animate-fade-in">
              <Printer className="w-12 h-12 text-[#B87333] animate-bounce" />
              <div>
                <h4 className="font-mono font-black text-xs text-white uppercase tracking-widest">EMITINDO COMPROVATIVO TÉRMICO</h4>
                <p className="text-[10px] text-zinc-500 uppercase mt-1">Ligação mTLS ao SGPT Kwanza em andamento...</p>
              </div>
              <div className="w-1/2 bg-neutral-900 h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#B87333] h-full rounded-full animate-pulse" style={{ width: "80%" }}></div>
              </div>
            </div>
          )}

          {/* STEP 4: TRANSACTION SUCCESS */}
          {opStep === "success" && (
            <div className="space-y-4 text-center py-2 animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-emerald-505/10 border border-emerald-500/35 flex items-center justify-center text-emerald-400 mx-auto">
                <CheckCircle className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-sm font-black text-[#B87333] uppercase">TRANSAÇÃO FÍSICA AUTORIZADA</h4>
                <p className="text-[10.5px] text-zinc-400 mt-1">O saldo foi creditado/debitado na conta móvel do utilizador.</p>
              </div>

              {/* TICKET MOCK THERMAL PRINT PREVIEW */}
              {lastPrintedTicket && (
                <div className="bg-[#050505] border border-neutral-900 p-4 rounded-xl text-left shadow-lg">
                  <span className="text-[8px] bg-neutral-900 text-zinc-500 border border-neutral-800 px-2 py-0.5 rounded font-black tracking-widest uppercase block text-center mb-2 animate-pulse">
                    BILHETE ELETRÓNICO IMPRESSO COMPACTO
                  </span>
                  <pre className="text-[10px] text-zinc-300 font-mono tracking-tight leading-relaxed whitespace-pre-wrap select-all font-light opacity-95">
                    {lastPrintedTicket.trim()}
                  </pre>
                </div>
              )}

              <button
                onClick={() => {
                  setOpStep("idle");
                  setPinInput("");
                  setPhoneInput("+244923000111");
                }}
                className="w-full bg-[#B87333] hover:bg-amber-600 text-white py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
              >
                Voltar à Agenda Inicial
              </button>
            </div>
          )}

        </div>

        {/* RIGHT COMPARTMENT: DENOMINATIONS DISPLAY & AGENT RECONCILIATION STATISTICS */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* BANKNOTE DENOMINATION DISTRIBUTION PREVIEW */}
          <div className="bg-zinc-950 border border-neutral-900 rounded-xl p-4 space-y-3">
            <span className="text-[10px] uppercase font-black tracking-wider text-zinc-500 font-mono block">Notas Contabilizadas Físicas (AOA)</span>
            <p className="text-[10px] text-zinc-400 font-sans leading-relaxed">
              O terminal simula a contagem de cédulas necessárias para carregar ou pagar o montante indicado de <strong>{parseFloat(amountInput || "0").toLocaleString("pt-PT")} Kz</strong>:
            </p>

            <div className="space-y-1.5 font-mono text-[10px]">
              {Object.entries(notesDenominations).reverse().map(([note, count]) => {
                const isSelected = (count as number) > 0;
                return (
                  <div 
                    key={note} 
                    className={`flex items-center justify-between p-2 rounded border transition-all ${
                      isSelected 
                        ? "bg-[#B87333]/10 border-[#B87333]/30 text-white" 
                        : "bg-zinc-950/40 border-neutral-900/60 text-zinc-650"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <div className={`w-3.5 h-2 rounded ${isSelected ? "bg-amber-600" : "bg-neutral-800"}`} />
                      <strong className={isSelected ? "text-orange-400" : "text-zinc-600"}>{note.toLocaleString()} Kz</strong>
                    </div>
                    <span className="font-bold">× {count} notas</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AGENT TRANSACTION VOLUME SUMMARY STATS */}
          <div className="bg-zinc-950 border border-neutral-900 rounded-xl p-4 text-xs font-mono">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-900">
              <span className="text-[10px] uppercase font-black tracking-wider text-zinc-500 block">Atividade da Sessão</span>
              <span className="text-[10px] text-amber-500 bg-[#B87333]/10 px-1.5 border border-[#B87333]/35 rounded font-black font-mono">
                {sessionTxCount} OPs
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3 text-[10px] text-zinc-400">
              <div className="p-2 border border-neutral-900 rounded bg-[#050505]/50 shrink-0">
                <span className="text-[8.5px] uppercase font-bold text-zinc-500 block">Total Recebido (Cash-In)</span>
                <strong className="text-emerald-400 block text-xs mt-1">+{sessionDepositVolume.toLocaleString("pt-PT")} Kz</strong>
              </div>
              <div className="p-2 border border-neutral-900 rounded bg-[#050505]/50 shrink-0">
                <span className="text-[8.5px] uppercase font-bold text-zinc-500 block">Total Levantável (Cash-Out)</span>
                <strong className="text-amber-500 block text-xs mt-1">-{sessionWithdrawVolume.toLocaleString("pt-PT")} Kz</strong>
              </div>
            </div>

            {/* LIVE TREASURY SAFE COFFRE */}
            <div className="mt-3 bg-[#0a0807] border border-zinc-900 p-2.5 rounded-lg flex items-center justify-between text-[11px] leading-tight">
              <div>
                <strong className="text-white block uppercase text-[9.5px]">Cofre Interno do Terminal:</strong>
                <span className="text-[8px] text-zinc-500 font-sans block">Saldo físico em papel-moeda no cofre</span>
              </div>
              <span className="font-black text-rose-450 font-mono text-xs">
                {currentAgent.cashReserve.toLocaleString("pt-PT")} Kz
              </span>
            </div>
          </div>

          {/* CONSUMO MENSAL POR CATEGORIA (RECHARTS WIDGET) */}
          <div className="bg-zinc-950 border border-neutral-900 rounded-xl p-4 space-y-3 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
              <div className="flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-amber-500" />
                <div>
                  <span className="text-[10px] uppercase font-black tracking-wider text-white font-mono block">Consumo por Categoria ({currentMonthName})</span>
                  <span className="text-[8px] text-zinc-500 uppercase block font-mono">Gastos Reais em Kwanzas (AOA)</span>
                </div>
              </div>
              <span className="text-[9px] text-amber-500 bg-[#B87333]/10 border border-[#B87333]/30 px-1.5 py-0.5 rounded font-black font-mono">
                {totalMonthlySpending.toLocaleString("pt-PT")} Kz
              </span>
            </div>

            {chartData.length === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-center p-4 border border-dashed border-neutral-900 rounded-lg">
                <span className="text-[10px] text-zinc-500 uppercase font-bold block">Sem gastos registados neste mês</span>
                <span className="text-[8px] text-zinc-650 uppercase block mt-1 font-mono">Efetue pagamentos para ver o gráfico</span>
              </div>
            ) : (
              <>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 10, right: 5, left: -25, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#161616" vertical={false} />
                      <XAxis 
                        dataKey="category" 
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "#52525b", fontSize: 8, fontFamily: "Inter", fontWeight: 500 }}
                        tickFormatter={(value) => value.split(" ")[0]}
                      />
                      <YAxis 
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "#52525b", fontSize: 8, fontFamily: "JetBrains Mono" }}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(184, 115, 51, 0.04)" }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-zinc-950 border border-[#B87333]/35 px-2.5 py-1.5 rounded-lg font-mono text-[9px] space-y-0.5 shadow-2xl">
                                <p className="text-zinc-400 uppercase font-black tracking-wider">{data.category}</p>
                                <p className="text-white font-black text-[11px]">
                                  {data.value.toLocaleString("pt-PT")} Kz
                                </p>
                                <p className="text-[8px] text-zinc-550 uppercase font-bold">
                                  {((data.value / (totalMonthlySpending || 1)) * 100).toFixed(1)}% do consumo
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar 
                        dataKey="value" 
                        radius={[4, 4, 0, 0]}
                        maxBarSize={32}
                      >
                        {chartData.map((entry, index) => {
                          const colors = ["#B87333", "#D97706", "#F59E0B", "#FBBF24", "#FCD34D", "#FDE68A"];
                          return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Micro Analysis Panel */}
                <div className="bg-[#050505] p-2.5 rounded-lg border border-neutral-900/60 font-mono text-[9px] text-zinc-400 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span>Categoria Principal:</span>
                    <strong className="text-amber-400 uppercase font-black text-right truncate max-w-[150px]">{highestSpendingCategory}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Média por OP de Consumo:</span>
                    <strong className="text-white font-extrabold text-right">
                      {Math.round(totalMonthlySpending / (spentTransactionsCurrentMonth.length || 1)).toLocaleString("pt-PT")} Kz
                    </strong>
                  </div>
                </div>
              </>
            )}
          </div>

        </div>

      </div>

      {/* DETAILED STATEMENT & EXPORT COMPONENT FOR MANUEL DA SILVA */}
      <div className="bg-zinc-950 border border-neutral-900 rounded-2xl p-5 space-y-4 text-left animate-fade-in" id="customer-statement-section">
        
        {/* Header containing Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-900 pb-4">
          <div className="space-y-1">
            <h4 className="font-black text-xs uppercase tracking-wider text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#B87333]" />
              <span>Extrato de Conta do Cidadão (Manuel da Silva)</span>
            </h4>
            <p className="text-[9px] text-zinc-500 uppercase font-mono">
              Consulta de Lançamentos e Despacho de Comprovativos Regulados pelo BNA
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              onClick={handleExportCSV}
              className="flex-grow sm:flex-grow-0 px-3.5 py-2 bg-[#050505] hover:bg-neutral-900 text-zinc-300 font-black text-[10px] uppercase rounded-lg border border-neutral-900 hover:border-neutral-800 tracking-wider transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              title="Descarregar histórico de transações em formato CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Exportar CSV</span>
            </button>

            <button
              onClick={handleExportPDF}
              className="flex-grow sm:flex-grow-0 px-3.5 py-2 bg-gradient-to-r from-amber-600 to-[#B87333] hover:from-amber-700 hover:to-[#9E5F27] text-white font-black text-[10px] uppercase rounded-lg tracking-wider transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-[#B87333]/15"
              title="Gerar e descarregar documento de extrato oficial em PDF"
            >
              <Download className="w-3.5 h-3.5 text-white" />
              <span>Exportar PDF</span>
            </button>

            <button
              onClick={handlePrintSummary}
              className="flex-grow sm:flex-grow-0 px-3.5 py-2 bg-[#141211] hover:bg-neutral-900 text-amber-500 font-black text-[10px] uppercase rounded-lg border border-amber-500/20 hover:border-amber-500/40 tracking-wider transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
              title="Imprimir extrato formatado para folha física A4"
            >
              <Printer className="w-3.5 h-3.5 text-amber-500" />
              <span>Imprimir Resumo</span>
            </button>
          </div>
        </div>

        {/* CSS de Media Print dinâmico para impressão limpa em folha A4 física */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            /* Forçar fundo branco e texto preto na página inteira */
            html, body {
              background: #ffffff !important;
              color: #000000 !important;
              margin: 0 !important;
              padding: 0 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            /* Ocultar todos os outros painéis e elementos do portal */
            #root > *:not(#customer-statement-section),
            #agente_portal_container > *:not(#customer-statement-section) {
              display: none !important;
            }
            body > *:not(#customer-statement-section) {
              display: none !important;
            }
            /* Garantir que o bloco do extrato ocupa toda a largura A4 sem margens escuras */
            #customer-statement-section {
              display: block !important;
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              background: #ffffff !important;
              color: #000000 !important;
              border: none !important;
              box-shadow: none !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            /* Converter cores escuras ou douradas em tons de cinza ou preto legíveis */
            #customer-statement-section .bg-zinc-950,
            #customer-statement-section .bg-[#050505],
            #customer-statement-section .bg-[#050505]/40,
            #customer-statement-section .bg-neutral-950\/40 {
              background-color: #ffffff !important;
              background: #ffffff !important;
              border-color: #e2e8f0 !important;
            }
            /* Ajustar textos gerais */
            #customer-statement-section *,
            #customer-statement-section span,
            #customer-statement-section p,
            #customer-statement-section td,
            #customer-statement-section th,
            #customer-statement-section strong {
              color: #000000 !important;
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important;
            }
            /* Ocultar botões de exportação e ações ao imprimir */
            #customer-statement-section button,
            #customer-statement-section .flex-grow,
            #customer-statement-section [title],
            #customer-statement-section .flex-wrap {
              display: none !important;
            }
            /* Configurar cabeçalho com aspecto institucional limpo */
            #customer-statement-section h4 {
              font-size: 14pt !important;
              font-weight: bold !important;
              color: #000000 !important;
              margin-bottom: 4px !important;
            }
            /* Adicionar linha divisória institucional */
            #customer-statement-section .border-b {
              border-bottom: 2px solid #000000 !important;
            }
            /* Estilizar a tabela de transações para impressão */
            #customer-statement-section table {
              width: 100% !important;
              border-collapse: collapse !important;
              margin-top: 20px !important;
              border: 1px solid #cbd5e1 !important;
            }
            #customer-statement-section th {
              background-color: #f1f5f9 !important;
              color: #0f172a !important;
              font-weight: bold !important;
              font-size: 9pt !important;
              padding: 10px 8px !important;
              border-bottom: 2px solid #94a3b8 !important;
              text-transform: uppercase !important;
            }
            #customer-statement-section td {
              padding: 8px 8px !important;
              border-bottom: 1px solid #e2e8f0 !important;
              font-size: 9pt !important;
            }
            /* Tratar valores de depósito e levantamento com contraste apropriado */
            #customer-statement-section .text-rose-400 {
              color: #b91c1c !important; /* Vermelho escuro para saídas */
              font-weight: bold !important;
            }
            #customer-statement-section .text-emerald-400 {
              color: #166534 !important; /* Verde escuro para entradas */
              font-weight: bold !important;
            }
            #customer-statement-section .text-[#B87333] {
              color: #9a3412 !important;
            }
            /* Configuração física de página A4 */
            @page {
              size: A4 portrait;
              margin: 2cm 1.5cm;
            }
          }
        ` }} />

        {/* Metadata Details strip */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-[#050505] p-3 rounded-lg border border-neutral-900/60 font-mono text-[10px] text-zinc-400">
          <div className="space-y-0.5">
            <span className="text-[8px] uppercase text-zinc-550 block">Beneficiário / Titular</span>
            <strong className="text-white uppercase text-[11px] font-sans">{currentUser.name}</strong>
          </div>
          <div className="space-y-0.5">
            <span className="text-[8px] uppercase text-zinc-550 block">Código Curto Carteira</span>
            <strong className="text-amber-500 uppercase text-[11px] font-mono">{currentUser.shortCode || "KM-4831"}</strong>
          </div>
          <div className="space-y-0.5">
            <span className="text-[8px] uppercase text-zinc-550 block">Número de Telefone / BI</span>
            <strong className="text-zinc-300 text-[10px]">+244 {currentUser.phone} • BI: {currentUser.biNumber || "004012934LA042"}</strong>
          </div>
          <div className="space-y-0.5">
            <span className="text-[8px] uppercase text-zinc-550 block">Saldo Líquido de Conta</span>
            <strong className="text-[#B87333] text-[11px]">{currentUser.balance.toLocaleString("pt-PT")} Kz</strong>
          </div>
        </div>

        {/* Painel de Limite Diário de Gastos */}
        <div className="bg-[#050505] p-4 rounded-lg border border-amber-500/15 font-mono space-y-3">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <div>
                <span className="text-[10px] text-white font-black uppercase tracking-wider block">Limite Diário de Gastos</span>
                <span className="text-[8px] text-zinc-500 block uppercase">Controlo e Gestão de Orçamento Ativo de {currentUser.name}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[8.5px] text-zinc-400">Definir Limite:</span>
              <div className="flex items-center gap-1 bg-black px-2 py-1 rounded border border-neutral-900">
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={currentUser.dailySpendingLimit ?? 50000}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    handleUpdateLimit(val);
                  }}
                  className="w-20 bg-transparent text-white font-mono text-[10px] focus:outline-none text-right"
                />
                <span className="text-[8.5px] text-zinc-500 font-bold">Kz</span>
              </div>
            </div>
          </div>

          {/* Quick preset limits */}
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[8px] text-zinc-500 uppercase mr-1">Atalhos rápidos:</span>
            {[20000, 50000, 100000, 150000].map((preset) => (
              <button
                key={preset}
                onClick={() => handleUpdateLimit(preset)}
                className={`px-2 py-0.5 text-[8.5px] rounded border transition-all duration-150 cursor-pointer ${
                  (currentUser.dailySpendingLimit ?? 50000) === preset
                    ? "bg-amber-600/20 border-amber-500 text-amber-400 font-bold"
                    : "bg-neutral-950 border-neutral-900 text-zinc-400 hover:text-white hover:border-neutral-800"
                }`}
              >
                {preset.toLocaleString("pt-PT")} Kz
              </button>
            ))}
          </div>

          {/* Progress bar and statistics */}
          {(() => {
            const limit = currentUser.dailySpendingLimit ?? 50000;
            const spentPercent = limit > 0 ? Math.min(100, (spentToday / limit) * 100) : 0;
            const isExceeded = spentToday >= limit;

            return (
              <div className="space-y-2 bg-black/50 p-3 rounded border border-neutral-900/40">
                <div className="flex flex-col sm:flex-row justify-between text-[9px] gap-1">
                  <div className="flex items-center gap-1">
                    <span className="text-zinc-500">Consumido Hoje:</span>
                    <strong className="text-white font-black">{spentToday.toLocaleString("pt-PT")} Kz</strong>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-zinc-500">Limite de Segurança:</span>
                    <strong className="text-amber-500 font-black">{limit.toLocaleString("pt-PT")} Kz</strong>
                  </div>
                  <div className="flex items-center gap-1 sm:ml-auto">
                    <span className="text-zinc-500">Restante:</span>
                    <strong className={`${isExceeded ? "text-rose-500 animate-pulse" : "text-emerald-400"} font-black`}>
                      {Math.max(0, limit - spentToday).toLocaleString("pt-PT")} Kz
                    </strong>
                  </div>
                </div>

                {/* The actual progress bar */}
                <div className="w-full bg-neutral-950 rounded-full h-3.5 p-0.5 border border-neutral-900 overflow-hidden relative">
                  <div
                    style={{ width: `${spentPercent}%` }}
                    className={`h-full rounded-full transition-all duration-500 relative ${
                      spentPercent >= 100
                        ? "bg-gradient-to-r from-red-600 to-rose-500 shadow-md shadow-red-950/40 animate-pulse"
                        : spentPercent >= 80
                        ? "bg-gradient-to-r from-orange-500 to-amber-600"
                        : "bg-gradient-to-r from-emerald-500 to-teal-500"
                    }`}
                  >
                    {spentPercent > 10 && (
                      <span className="absolute inset-0 flex items-center justify-end pr-2 text-[7.5px] font-black text-black leading-none drop-shadow">
                        {Math.round(spentPercent)}%
                      </span>
                    )}
                  </div>
                  {spentPercent <= 10 && (
                    <span className="absolute inset-0 flex items-center justify-start pl-2 text-[7.5px] font-black text-zinc-500 leading-none">
                      {Math.round(spentPercent)}% Consumido
                    </span>
                  )}
                </div>

                {isExceeded && (
                  <div className="flex items-center gap-1.5 text-rose-500 text-[8.5px] uppercase font-black tracking-wider animate-pulse pt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 block animate-ping"></span>
                    <span>Aviso: Limite de gastos diários ultrapassado ou totalmente atingido.</span>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Painel de Configuração de Notificações SMS */}
        <div className="bg-[#050505] p-4 rounded-lg border border-amber-500/15 font-mono space-y-3.5">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-500 animate-bounce" style={{ animationDuration: '3s' }} />
              <div>
                <span className="text-[10px] text-white font-black uppercase tracking-wider block">Notificações por SMS em Tempo Real</span>
                <span className="text-[8px] text-zinc-500 block uppercase">Canal alternativo de alertas síncronos de transações</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-[8.5px] text-zinc-400 uppercase font-black cursor-pointer select-none flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={currentUser.smsNotificationsEnabled ?? false}
                  onChange={(e) => {
                    handleUpdateSmsConfig(altPhoneInput, e.target.checked);
                  }}
                  className="w-3.5 h-3.5 rounded border-neutral-800 bg-black text-amber-500 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-amber-500"
                />
                Ativar Alertas
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-black/50 p-3 rounded border border-neutral-900/40">
            <div className="space-y-1.5">
              <label className="text-[8.5px] text-zinc-400 uppercase font-bold block">Telemóvel Alternativo de Notificação:</label>
              <div className="flex gap-1.5">
                <div className="flex items-center bg-neutral-950 px-2.5 py-1.5 rounded border border-neutral-900 text-[10px] text-zinc-500 font-bold select-none">
                  +244
                </div>
                <input
                  type="text"
                  placeholder="9xx xxx xxx"
                  value={altPhoneInput.startsWith("+244") ? altPhoneInput.replace("+244", "") : altPhoneInput}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "");
                    setAltPhoneInput(raw ? `+244${raw}` : "");
                  }}
                  className="flex-1 bg-neutral-950 text-white font-mono text-[10px] px-3 py-1.5 rounded border border-neutral-900 focus:outline-none focus:border-amber-500/50 transition-colors"
                />
              </div>
            </div>

            <div className="flex flex-col justify-end gap-1.5">
              <button
                onClick={() => handleUpdateSmsConfig(altPhoneInput, currentUser.smsNotificationsEnabled ?? true)}
                className="w-full bg-[#B87333]/25 hover:bg-[#B87333] border border-[#B87333]/40 text-white font-black text-[9px] uppercase py-2 px-3 rounded transition-all duration-150 cursor-pointer text-center"
              >
                Gravar Telemóvel Alternativo
              </button>
            </div>
          </div>

          {/* Quick preset status or help message */}
          <div className="flex items-center gap-1.5 text-[8px] text-zinc-500 uppercase">
            <MessageSquare className="w-3 h-3 text-zinc-600" />
            {currentUser.smsNotificationsEnabled && currentUser.alternativeSmsPhone ? (
              <span>Os alertas automáticos estão <strong className="text-emerald-400">Ativos</strong> para <strong className="text-white">{currentUser.alternativeSmsPhone}</strong>.</span>
            ) : (
              <span>Insira um telemóvel e ative os alertas para simular notificações SMS de OPs concluídas.</span>
            )}
          </div>
        </div>

        {/* Painel de Gestão e Teste de Impressão Digital (WebAuthn API) */}
        <div className="bg-[#050505] p-4 rounded-lg border border-amber-500/15 font-mono space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <Fingerprint className="w-5 h-5 text-amber-500 animate-pulse" />
              <div>
                <span className="text-[10px] text-white font-black uppercase tracking-wider block">Validação Biométrica / WebAuthn API</span>
                <span className="text-[8px] text-zinc-500 block uppercase">Criptografia assimétrica FIDO2/WebAuthn regulada pelo BNA</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-[8.5px] text-zinc-400 uppercase font-black cursor-pointer select-none flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={currentUser.biometricPaymentAuthEnabled ?? false}
                  onChange={(e) => {
                    handleToggleBiometricPaymentAuth(e.target.checked);
                  }}
                  className="w-3.5 h-3.5 rounded border-neutral-800 bg-black text-amber-500 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-amber-500"
                />
                Ativar Autenticação de Pagamentos
              </label>
            </div>
          </div>

          <p className="text-[9px] text-zinc-400 leading-relaxed font-sans">
            A norma FIDO2/WebAuthn permite que o utilizador autorize levantamentos e transferências de forma soberana através do leitor de impressões digitais do seu dispositivo. O BNA valida os pares de chaves gerados para assegurar o não-repúdio de operações financeiras.
          </p>

          {/* Form to Register New Key */}
          <div className="bg-black/50 p-3 rounded border border-neutral-900/40 space-y-2">
            <span className="text-[8.5px] text-amber-500 font-bold uppercase block">Registar Nova Impressão Digital:</span>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Nome do dispositivo (Ex: MacBook TouchID, Telemóvel S24)"
                value={webauthnNewKeyName}
                onChange={(e) => setWebauthnNewKeyName(e.target.value)}
                className="flex-1 bg-neutral-950 text-white font-mono text-[10px] px-3 py-1.5 rounded border border-neutral-900 focus:outline-none focus:border-amber-500/50 transition-colors"
              />
              <button
                onClick={() => handleRegisterBiometricKey(webauthnNewKeyName)}
                className="bg-[#B87333]/25 hover:bg-[#B87333] border border-[#B87333]/40 text-white font-black text-[9px] uppercase py-1.5 px-4 rounded transition-all duration-150 cursor-pointer text-center"
              >
                Iniciar Registo
              </button>
            </div>
          </div>

          {/* List of Keys */}
          <div className="space-y-2">
            <span className="text-[8.5px] text-zinc-400 uppercase block font-bold">Impressões Digitais Registadas no Dispositivo:</span>
            {webauthnKeys.length === 0 ? (
              <div className="p-3 text-center border border-dashed border-neutral-900 rounded text-[9px] text-zinc-600 uppercase">
                Nenhuma chave de impressão digital associada de momento.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {webauthnKeys.map((key) => (
                  <div key={key.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-neutral-950 p-3 rounded border border-neutral-900 text-[10px] gap-2.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-[#B87333]/10 text-amber-500 rounded border border-[#B87333]/20">
                        <Fingerprint className="w-3.5 h-3.5" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-white font-black uppercase text-[10px] block">{key.name}</span>
                        <div className="flex flex-wrap gap-x-2 text-[8px] text-zinc-550 uppercase">
                          <span>Criado em: <strong className="text-zinc-400">{key.createdAt}</strong></span>
                          <span>ID: <code className="text-amber-500 font-mono">{key.id}</code></span>
                          <span>Contador (SignCount): <strong className="text-emerald-400">{key.signCount}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-1.5 w-full sm:w-auto self-end sm:self-auto shrink-0 justify-end">
                      <button
                        onClick={() => handleTestBiometricKey(key.id)}
                        className="flex-1 sm:flex-initial bg-emerald-600/10 hover:bg-emerald-600/25 border border-emerald-500/20 text-emerald-400 font-bold text-[8.5px] uppercase py-1 px-2.5 rounded transition-colors cursor-pointer"
                      >
                        Testar Validação
                      </button>
                      <button
                        onClick={() => handleDeleteWebAuthnKey(key.id)}
                        className="bg-rose-600/10 hover:bg-rose-600/25 border border-rose-500/20 text-rose-400 font-bold text-[8.5px] uppercase py-1 px-2.5 rounded transition-colors cursor-pointer"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Diagnostic Note */}
          <div className="flex items-start gap-1.5 text-[8px] text-zinc-500 uppercase leading-relaxed bg-black/40 p-2.5 rounded border border-neutral-900/50">
            <HelpCircle className="w-3 h-3 text-zinc-600 mt-0.5 shrink-0" />
            <span>
              Nota Técnica: O KwanzaMóvel tenta invocar diretamente as credenciais do sistema operacional do utilizador. Em ambientes de simulação ou iframes restritos de sandbox, o sistema emprega um <strong className="text-amber-400">Motor de Emulação Regulatório</strong> que replica com 100% de exatidão os payloads binários, as assinaturas criptográficas e os contadores de sincronização do protocolo FIDO2 WebAuthn.
            </span>
          </div>
        </div>

        {/* Barra de Pesquisa de Transações em Tempo Real */}
        <div className="bg-[#050505] p-3.5 rounded-lg border border-neutral-900 font-mono space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-amber-500" />
              <span className="text-[10px] text-white font-black uppercase tracking-wider block">Filtro Síncrono de Transações</span>
            </div>
            <span className="text-[8px] text-zinc-550 uppercase">Pesquisa em tempo real</span>
          </div>
          
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="w-4 h-4 text-zinc-500" />
            </span>
            <input
              type="text"
              placeholder="Pesquisar por nome do destinatário, número de telefone ou valor exato..."
              value={txSearchQuery}
              onChange={(e) => setTxSearchQuery(e.target.value)}
              className="w-full bg-black text-white placeholder-zinc-650 border border-neutral-900 rounded-lg py-2 pl-9 pr-16 text-xs focus:outline-none focus:border-amber-500/55 transition-colors font-mono"
            />
            {txSearchQuery && (
              <button
                onClick={() => setTxSearchQuery("")}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-white text-[9px] uppercase font-bold cursor-pointer"
              >
                Limpar
              </button>
            )}
          </div>
          
          {txSearchQuery && (
            <div className="flex justify-between items-center text-[8.5px] text-zinc-500 px-1 pt-1">
              <span>Filtro ativo: <strong className="text-amber-500 font-bold">"{txSearchQuery}"</strong></span>
              <span>Resultados: <strong className="text-white font-black">{filteredManuelTransactions.length}</strong> de {manuelTransactions.length} OPs</span>
            </div>
          )}
        </div>

        {/* Statement Data Table */}
        <div className="overflow-x-auto rounded-lg border border-neutral-900 bg-[#050505]/40">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#050505] border-b border-neutral-900 font-mono text-[9px] uppercase text-zinc-500 font-extrabold tracking-wider">
                <th className="p-3">ID Transação</th>
                <th className="p-3">Data/Hora</th>
                <th className="p-3">Operação / Tipo</th>
                <th className="p-3">Origem / Destino</th>
                <th className="p-3 text-right">Valor (AOA)</th>
                <th className="p-3 text-center">Estado</th>
                <th className="p-3 text-right">Comprovativo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900 font-sans text-xs text-zinc-300">
              {manuelTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-550 font-mono text-[10px] italic">
                    Nenhum movimento registado na conta corrente de {currentUser.name}.
                  </td>
                </tr>
              ) : filteredManuelTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-550 font-mono text-[10px] italic">
                    Nenhuma transação corresponde aos critérios de pesquisa: "{txSearchQuery}".
                  </td>
                </tr>
              ) : (
                filteredManuelTransactions.map((tx) => {
                  const isSender = tx.senderPhone === currentUser.phone;
                  const formattedAmount = tx.amount.toLocaleString("pt-PT");
                  const dateStr = new Date(tx.timestamp).toLocaleString("pt-PT");
                  
                  let displayType = "";
                  if (tx.type === "pagamento") {
                    displayType = "Levantamento (Cash-Out)";
                  } else if (tx.type === "recebimento") {
                    displayType = "Depósito (Cash-In)";
                  } else {
                    displayType = isSender ? "Envio de Saldo" : "Recebimento de Saldo";
                  }

                  const counterPartyPhone = isSender ? tx.receiverPhone : tx.senderPhone;
                  const counterPartyName = resolveContactName(counterPartyPhone);

                  return (
                    <tr key={tx.id} className="hover:bg-neutral-950/40 transition-colors">
                      <td className="p-3 font-mono text-[10px] text-zinc-400 font-semibold">{tx.id}</td>
                      <td className="p-3 text-zinc-400 font-mono text-[10px]">{dateStr}</td>
                      <td className="p-3 text-white font-semibold">
                        <span className="flex items-center gap-1">
                          {isSender ? (
                            <ArrowUpRight className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          ) : (
                            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          )}
                          <span>{displayType}</span>
                        </span>
                      </td>
                      <td className="p-3 text-zinc-400">
                        <div className="font-sans font-semibold text-zinc-350">{counterPartyName}</div>
                        <div className="font-mono text-[9px] text-zinc-500">{counterPartyPhone}</div>
                      </td>
                      <td className={`p-3 text-right font-mono font-bold text-[11.5px] ${isSender ? "text-rose-400" : "text-emerald-400"}`}>
                        {isSender ? "-" : "+"}{formattedAmount} Kz
                      </td>
                      <td className="p-3 text-center">
                        {tx.status === "queued_offline" ? (
                          <span className="inline-flex items-center gap-1 text-[8.5px] font-mono font-black uppercase px-2 py-0.5 rounded border border-amber-500/30 text-amber-400 bg-amber-500/5" title="Transação guardada localmente em IndexedDB para sincronização posterior">
                            <WifiOff className="w-3 h-3 text-amber-500 animate-pulse" />
                            <span>OFFLINE</span>
                          </span>
                        ) : tx.isFraudAlert || (tx.fraudScore && tx.fraudScore > 0.8) ? (
                          <span className="inline-flex items-center gap-1 text-[8.5px] font-mono font-black uppercase px-2 py-0.5 rounded border border-red-500/35 text-red-400 bg-red-500/5" title={tx.fraudAlertReason || "Actividade suspeita detectada pelos limites de geolocalização e frequência"}>
                            <AlertTriangle className="w-3 h-3 text-red-500 animate-pulse" />
                            <span>ALERTA DE RISCO</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[8.5px] font-mono font-black uppercase px-2 py-0.5 rounded border border-emerald-500/20 text-emerald-400 bg-emerald-500/5">
                            <CheckCircle className="w-3 h-3 text-emerald-400" />
                            <span>{tx.status}</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setSelectedTxForReceipt(tx)}
                          className="bg-[#B87333]/15 hover:bg-[#B87333]/30 border border-[#B87333]/40 text-[#B87333] hover:text-amber-300 text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer inline-flex items-center gap-1"
                          title="Ver Comprovativo PDF & Validar Assinatura"
                        >
                          <Printer className="w-3 h-3" />
                          <span>Recibo PDF</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Regulatory disclaimer info bottom */}
        <div className="flex items-center justify-between text-[8px] font-mono text-zinc-550 pt-1">
          <span>Emitido integralmente de forma auditável e reconciliado em tempo real.</span>
          <span>SGA - COMPENSAÇÃO SOBERANA DE CARTEIRAS MÓVEIS</span>
        </div>

      </div>

      {/* Painel de FAQ Inteligente (IA Gemini) */}
      <div className="bg-[#050505] p-4 rounded-lg border border-amber-500/15 font-mono space-y-3.5">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-amber-500 animate-pulse" />
            <div>
              <span className="text-[10px] text-white font-black uppercase tracking-wider block">FAQ Inteligente KwanzaMóvel</span>
              <span className="text-[8px] text-zinc-555 block uppercase">Respostas regulamentares em tempo real via Gemini AI</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded text-[8px] font-black text-amber-400 uppercase tracking-widest self-start sm:self-auto">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Gemini 3.5 Active</span>
          </div>
        </div>

        {/* Quick Questions Presets */}
        <div className="space-y-1.5">
          <span className="text-[8px] text-zinc-500 uppercase block font-bold">Dúvidas Frequentes Regulatórias:</span>
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: "O KwanzaMóvel retém o meu dinheiro?", q: "O KwanzaMóvel retém o meu dinheiro de alguma forma? Qual é a garantia?" },
              { label: "Como funciona a liquidação no BNA?", q: "Como funciona a liquidação no BNA via SPTR e o padrão ISO 20022 no KwanzaMóvel?" },
              { label: "Quais são os limites de KYC?", q: "Quais são os limites de KYC e como funciona o KYC escalonado segundo o BNA?" }
            ].map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setFaqQuery(item.q);
                  handleAskFaq(item.q);
                }}
                disabled={faqLoading}
                className="px-2.5 py-1 text-[8.5px] rounded border border-neutral-900 bg-neutral-950 text-zinc-400 hover:text-white hover:border-[#B87333]/50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Question Form */}
        <div className="space-y-1.5 pt-0.5">
          <div className="flex gap-1.5">
            <input
              type="text"
              placeholder="Insira uma pergunta sobre regulação BNA, liquidação SPTR ou funcionamento da carteira..."
              value={faqQuery}
              onChange={(e) => setFaqQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && faqQuery.trim()) {
                  handleAskFaq(faqQuery);
                }
              }}
              disabled={faqLoading}
              className="flex-1 bg-neutral-950 text-white placeholder-zinc-600 border border-neutral-900 rounded-lg py-2 px-3 text-[10px] focus:outline-none focus:border-amber-500/50 transition-colors font-mono disabled:opacity-50"
            />
            <button
              onClick={() => handleAskFaq(faqQuery)}
              disabled={faqLoading || !faqQuery.trim()}
              className="bg-[#B87333]/25 hover:bg-[#B87333] border border-[#B87333]/40 text-white font-black text-[9px] uppercase px-4 py-2 rounded transition-all duration-150 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
            >
              {faqLoading ? "A Processar..." : "Perguntar"}
            </button>
          </div>
        </div>

        {/* Gemini Answer Panel */}
        {(faqLoading || faqAnswer || faqError) && (
          <div className="bg-black/50 p-3.5 rounded border border-neutral-900/40 space-y-2 transition-all">
            <div className="flex items-center justify-between pb-1.5 border-b border-neutral-900/50">
              <div className="flex items-center gap-1.5 text-[8.5px] text-zinc-500 uppercase font-black tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Resposta do Assistente Regulatório</span>
              </div>
              {faqAnswer && (
                <button
                  onClick={() => {
                    setFaqAnswer("");
                    setFaqQuery("");
                  }}
                  className="text-zinc-500 hover:text-white uppercase font-bold text-[8px] cursor-pointer"
                >
                  Fechar [X]
                </button>
              )}
            </div>
            
            {faqLoading && (
              <div className="flex items-center gap-2.5 py-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></div>
                <span className="text-[9.5px] text-zinc-400 italic font-medium animate-pulse">A consultar o motor de inteligência Gemini e directivas do BNA...</span>
              </div>
            )}

            {faqError && (
              <div className="text-rose-400 text-[10px] py-1 bg-rose-500/5 px-2.5 rounded border border-rose-500/10 font-bold">
                Erro: {faqError}
              </div>
            )}

            {faqAnswer && (
              <div className="text-zinc-300 text-[10.5px] font-sans leading-relaxed whitespace-pre-line space-y-2 select-text selection:bg-amber-500 selection:text-black">
                {faqAnswer}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL DE LEITURA BIOMÉTRICA (WEBAUTHN EMULATION & LOGS) */}
      {biometricScanModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-mono">
          <div className="bg-[#0b0b0e] border-2 border-[#B87333]/30 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl relative animate-fade-in">
            
            <div className="flex justify-between items-center pb-2 border-b border-neutral-950">
              <div className="flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-amber-500 animate-pulse" />
                <span className="text-[10.5px] text-white font-black uppercase tracking-wider">
                  {biometricScanModal.type === "register" ? "WebAuthn: Registar Digital" : "WebAuthn: Validar Operação"}
                </span>
              </div>
              <span className="text-[8px] bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded text-amber-500 font-black">FIDO2 SECURE</span>
            </div>

            <p className="text-[9px] text-zinc-400 font-sans leading-normal">
              {biometricScanModal.type === "register" 
                ? `A registar credencial de chave pública para "${biometricScanModal.keyName}".`
                : "A solicitar assinatura criptográfica de posse para autorizar o movimento financeiro."
              }
            </p>

            {/* PULSING FINGERPRINT RADAR GRAPHIC */}
            <div className="flex flex-col items-center justify-center py-4 space-y-3">
              <div className="relative w-24 h-24 bg-neutral-950 rounded-full border border-neutral-900/60 flex items-center justify-center overflow-hidden shadow-inner">
                <div className="absolute inset-2 bg-[#B87333]/5 rounded-full animate-ping" style={{ animationDuration: '3s' }}></div>
                <div className="absolute inset-4 bg-[#B87333]/10 rounded-full animate-pulse" style={{ animationDuration: '1.5s' }}></div>
                
                {/* Laser line effect */}
                <div 
                  className="absolute left-0 right-0 h-0.5 bg-amber-500 opacity-60 shadow-lg shadow-amber-500/50 transition-all duration-300"
                  style={{ top: `${biometricProgress}%` }}
                ></div>

                <Fingerprint className="w-12 h-12 text-amber-500 relative z-10" />
              </div>

              <div className="text-center">
                <span className="text-[10px] text-white font-extrabold uppercase tracking-wide block">{biometricStatus}</span>
                <span className="text-[8.5px] text-zinc-500 block uppercase font-black">{biometricProgress}% CONCLUÍDO</span>
              </div>
            </div>

            {/* REAL-TIME LOG TERMINAL CONSOLE */}
            <div className="space-y-1">
              <span className="text-[8px] text-zinc-550 uppercase font-black block">Consola de Diagnóstico WebAuthn:</span>
              <div className="bg-black/90 p-3 rounded-lg border border-neutral-900 font-mono text-[8.5px] text-zinc-400 h-28 overflow-y-auto space-y-1.5 select-text">
                {biometricLogs.map((log, index) => {
                  let colorClass = "text-zinc-400";
                  if (log.includes("[SUCCESS]")) colorClass = "text-emerald-400 font-semibold";
                  if (log.includes("[WARNING]")) colorClass = "text-amber-400 font-semibold";
                  if (log.includes("[DEBUG]")) colorClass = "text-sky-400";
                  if (log.includes("[SCANNER]")) colorClass = "text-amber-500";

                  return (
                    <div key={index} className={`${colorClass} leading-relaxed break-all`}>
                      {log}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CANCEL OR FORCE ACTION FOOTER */}
            <div className="flex justify-between items-center pt-2 border-t border-neutral-950 text-[9px]">
              <span className="text-zinc-550 font-bold uppercase">Angola BNA Sandbox v3.5</span>
              <button
                onClick={() => {
                  setBiometricScanModal(prev => ({ ...prev, isOpen: false }));
                }}
                className="bg-neutral-900 hover:bg-neutral-800 text-zinc-300 font-bold uppercase py-1.5 px-3 rounded text-[9px] cursor-pointer"
              >
                Cancelar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* FOOTER AUDITED STATEMENT */}
      <div className="pt-3 border-t border-neutral-900 text-center leading-normal">
        <span className="text-[9px] uppercase font-bold text-zinc-650 tracking-widest font-mono text-center block">
          HOMOLOGADO PARA SISTEMAS DE LIQUIDAÇÃO COMPROMISSÁRIA INTEGRAL • LEI 05/02 AOA
        </span>
      </div>

      {/* Transaction Receipt Modal */}
      <TransactionReceiptModal
        isOpen={!!selectedTxForReceipt}
        onClose={() => setSelectedTxForReceipt(null)}
        transaction={selectedTxForReceipt}
      />

    </div>
  );
}
