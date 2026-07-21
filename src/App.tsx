/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Layers, 
  Accessibility,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  Fingerprint,
  Building,
  Coins,
  Code,
  Server,
  Scale
} from "lucide-react";

import { UserAccount, Transaction, BnaCustodyState, DomainEvent } from "./types";
import { 
  saveUserAccount, 
  getUserAccount, 
  saveTransaction, 
  getTransactions 
} from "./indexedDB";

import KMPhonePrototype from "./components/KMPhonePrototype";
import FinancialOperatingSystem from "./components/FinancialOperatingSystem";
import { defaultBnaCustodyState, generatePacs008Message } from "./bnaCustody";

export default function App() {
  
  // Accessibility state (Persisted in localStorage for robust offline utility)
  const [seniorMode, setSeniorMode] = useState<boolean>(() => {
    return localStorage.getItem("seniorMode") === "true";
  });
  const [highContrast, setHighContrast] = useState<boolean>(() => {
    return localStorage.getItem("highContrast") === "true";
  });
  const [voiceOver, setVoiceOver] = useState<boolean>(() => {
    return localStorage.getItem("voiceOver") === "true";
  });

  // Persist accessibility changes
  useEffect(() => {
    localStorage.setItem("seniorMode", String(seniorMode));
  }, [seniorMode]);

  useEffect(() => {
    localStorage.setItem("highContrast", String(highContrast));
  }, [highContrast]);

  useEffect(() => {
    localStorage.setItem("voiceOver", String(voiceOver));
  }, [voiceOver]);

  // Active Back-office/Agent Portal Tab: "agente" (Default) | "bna" | "api" | "robustez" | "operacional" | "regulation"
  const [activePortal, setActivePortal] = useState<"bna" | "agente" | "api" | "robustez" | "operacional" | "regulation">("regulation");

  // User Profile
  const [currentUser, setCurrentUser] = useState<UserAccount>({
    phone: "+244923000111",
    name: "Manuel da Silva",
    biNumber: "00593845LA042",
    balance: 25000,
    tier: "Level-1",
    pinHash: "1234",
    deviceId: "device_ang_mx952",
    isRegistered: true,
    shortCode: "KM-4831",
    recoveryConfig: {
      emailRecovery: "manuel.silva@netangola.ao",
      backupCodesCreated: true,
      backupCodesCount: 8,
      biometricActive: true,
      trustedAgentOverride: true
    }
  });

  // Dynamic Transaction History list
  const [history, rawSetHistory] = useState<Transaction[]>([]);

  // Session ID persistent for the browser tab session
  const [currentSessionId] = useState(() => {
    let sId = sessionStorage.getItem("km_session_id");
    if (!sId) {
      sId = "sess_" + Math.random().toString(16).substring(2, 10) + Math.random().toString(16).substring(2, 10);
      sessionStorage.setItem("km_session_id", sId);
    }
    return sId;
  });

  const setHistory: React.Dispatch<React.SetStateAction<Transaction[]>> = (value) => {
    rawSetHistory((prevHistory) => {
      const resolved = typeof value === "function" ? value(prevHistory) : value;
      return resolved.map((tx) => {
        const enrichedTx = { ...tx };
        if (!enrichedTx.sessionId) enrichedTx.sessionId = currentSessionId;
        if (!enrichedTx.correlationId) {
          enrichedTx.correlationId = "corr_" + Math.random().toString(16).substring(2, 10) + Math.random().toString(16).substring(2, 10);
        }
        if (!enrichedTx.traceId) {
          enrichedTx.traceId = "trace_" + Math.random().toString(16).substring(2, 12) + Math.random().toString(16).substring(2, 12);
        }
        if (!enrichedTx.requestId) {
          enrichedTx.requestId = "req_" + Math.random().toString(16).substring(2, 10);
        }
        if (!enrichedTx.systemVersion) {
          enrichedTx.systemVersion = "v2.7.4-prod";
        }
        if (!enrichedTx.approvedBy) {
          enrichedTx.approvedBy = tx.amount > 50000 ? "SGA BNA Automated Auditor & Maker-Checker" : "KwanzaMóvel Gateway Manager";
        }
        if (!enrichedTx.deviceUserAgent) {
          enrichedTx.deviceUserAgent = navigator.userAgent || "Mozilla/5.0 (KwanzaMóvel MobileApp v2.7)";
        }
        return enrichedTx;
      });
    });
  };

  // Domain Events Log (Fase 2.5 Pure Event-Driven)
  const [domainEvents, setDomainEvents] = useState<DomainEvent[]>([]);

  // BNA Custody & Compliance state
  const [bnaState, setBnaState] = useState<BnaCustodyState>({
    ...defaultBnaCustodyState,
    totalCirculation: 25000 + 20500 // Synchronize circulation to Manuel's balance plus seeded wallets
  });

  // Automatically sync BNA custody circulation and generate ISO 20022 message on budget change
  useEffect(() => {
    setBnaState(prev => {
      const otherWalletsCirculation = 20500;
      const liveCirculation = currentUser.balance + otherWalletsCirculation;

      let latestIso = prev.lastSptrMsgIso20022;
      let pendingCount = prev.pendingSettlementsCount;

      if (history.length > 0) {
        const latestTx = history[0];
        latestIso = generatePacs008Message(latestTx);
        pendingCount = history.length;
      }

      return {
        ...prev,
        totalCirculation: liveCirculation,
        lastSptrMsgIso20022: latestIso,
        pendingSettlementsCount: Math.min(pendingCount || 1, 88)
      };
    });
  }, [currentUser.balance, history]);

  // Initialize DB and load offline details
  useEffect(() => {
    async function loadOfflineStorage() {
      try {
        let userAcc = await getUserAccount("+244923000111");
        if (!userAcc) {
          const initialUser: UserAccount = {
            phone: "+244923000111",
            name: "Manuel da Silva",
            biNumber: "00593845LA042",
            balance: 25000,
            tier: "Level-1",
            pinHash: "1234",
            deviceId: "device_ang_mx952",
            isRegistered: true,
            shortCode: "KM-4831",
            recoveryConfig: {
              emailRecovery: "manuel.silva@netangola.ao",
              backupCodesCreated: true,
              backupCodesCount: 8,
              biometricActive: true,
              trustedAgentOverride: true
            }
          };
          await saveUserAccount(initialUser);
          userAcc = initialUser;
        } else if (!userAcc.shortCode) {
          userAcc.shortCode = "KM-4831";
          await saveUserAccount(userAcc);
        }
        setCurrentUser(userAcc);

        let txs = await getTransactions();
        if (txs.length === 0) {
          const now = new Date();
          const yr = now.getFullYear();
          const mo = String(now.getMonth() + 1).padStart(2, '0');
          const defaultTxs: Transaction[] = [
            {
              id: "TX-SEED-01",
              senderPhone: "+244923000111",
              receiverPhone: "933999888",
              amount: 15000,
              type: "envio",
              status: "completed",
              timestamp: `${yr}-${mo}-20T11:20:00.000Z`,
              latencyMs: 110,
              fraudScore: 0.05,
              securityLog: ["Assinatura digital síncrona", "Validação AML conforme"],
              locationName: "Luanda",
              latitude: -8.8368,
              longitude: 13.2343
            },
            {
              id: "TX-SEED-02",
              senderPhone: "+244923000111",
              receiverPhone: "ENDE_PAGAMENTOS",
              amount: 8500,
              type: "pagamento",
              status: "completed",
              timestamp: `${yr}-${mo}-12T09:15:00.000Z`,
              latencyMs: 95,
              fraudScore: 0.02,
              securityLog: ["Transação de utilidade pública", "Canal síncrono SPTR"],
              locationName: "Luanda",
              latitude: -8.8368,
              longitude: 13.2343
            },
            {
              id: "TX-SEED-03",
              senderPhone: "+244923000111",
              receiverPhone: "ALIMENTA_ANGOLA",
              amount: 12500,
              type: "pagamento",
              status: "completed",
              timestamp: `${yr}-${mo}-05T14:30:00.000Z`,
              latencyMs: 105,
              fraudScore: 0.04,
              securityLog: ["Lojista certificado BNA", "PIN de segurança verificado"],
              locationName: "Cazenga",
              latitude: -8.8168,
              longitude: 13.2843
            },
            {
              id: "TX-SEED-04",
              senderPhone: "+244923000111",
              receiverPhone: "UNITEL_RECARGAS",
              amount: 2000,
              type: "pagamento",
              status: "completed",
              timestamp: `${yr}-${mo}-18T18:45:00.000Z`,
              latencyMs: 85,
              fraudScore: 0.01,
              securityLog: ["Recarga direta de telecomunicações"],
              locationName: "Viana",
              latitude: -8.9068,
              longitude: 13.3543
            },
            {
              id: "TX-SEED-05",
              senderPhone: "+244923000111",
              receiverPhone: "EPAL_PAGAMENTOS",
              amount: 4500,
              type: "pagamento",
              status: "completed",
              timestamp: `${yr}-${mo}-22T08:00:00.000Z`,
              latencyMs: 115,
              fraudScore: 0.03,
              securityLog: ["Pagamento de fatura de água"],
              locationName: "Luanda",
              latitude: -8.8368,
              longitude: 13.2343
            },
            {
              id: "TX-SEED-06",
              senderPhone: "+244923000111",
              receiverPhone: "CANDONGUEIRO_TAXIS",
              amount: 1500,
              type: "pagamento",
              status: "completed",
              timestamp: `${yr}-${mo}-23T17:10:00.000Z`,
              latencyMs: 75,
              fraudScore: 0.02,
              securityLog: ["Micro-pagamento de transportes rápidos"],
              locationName: "Samba",
              latitude: -8.8568,
              longitude: 13.2143
            },
            {
              id: "TX-SEED-07",
              senderPhone: "EMPRESA_SILVA_LDA",
              receiverPhone: "+244923000111",
              amount: 45000,
              type: "recebimento",
              status: "completed",
              timestamp: `${yr}-${mo}-01T08:00:00.000Z`,
              latencyMs: 140,
              fraudScore: 0.01,
              securityLog: ["Depósito de salários síncrono", "Compensação interbancária"],
              locationName: "Maianga",
              latitude: -8.8328,
              longitude: 13.2313
            }
          ];
          for (const tx of defaultTxs) {
            await saveTransaction(tx);
          }
          txs = defaultTxs;
        }
        setHistory(txs);
      } catch (e) {
        console.warn("DB initialization error:", e);
      }
    }
    loadOfflineStorage();
  }, []);

  // Sync changes back to IndexedDB
  useEffect(() => {
    if (currentUser) {
      saveUserAccount(currentUser).catch(err => console.warn(err));
    }
  }, [currentUser]);

  useEffect(() => {
    if (history.length > 0) {
      saveTransaction(history[0]).catch(err => console.warn(err));
    }
  }, [history]);

  // onLedgerUpdate callback
  const handleLedgerUpdate = (newJournal: any[], newBnaSptrMsg: string, txAmount: number, syncBatch?: any, events?: DomainEvent[]) => {
    if (events && events.length > 0) {
      setDomainEvents(prev => [...events, ...prev]);
    }
    setBnaState(prev => {
      let finalBatch = syncBatch;
      if (!finalBatch && newJournal.length > 0) {
        finalBatch = {
          id: `BATCH-RT-${Math.floor(100000 + Math.random() * 900000)}`,
          timestamp: new Date().toISOString(),
          txCount: newJournal.length,
          totalAmount: txAmount,
          status: "COMPLETED" as const,
          networkRetries: 0,
          atomicIntegrityVerified: true,
          systemMessage: "Instrução individual síncrona liquidada e validada em tempo real.",
          txIds: newJournal.map((j: any) => j.id || j.txId || "")
        };
      }

      const updatedBatches = prev.syncBatches ? [...prev.syncBatches] : [];
      if (finalBatch) {
        updatedBatches.unshift(finalBatch);
      }

      // ONLY increment pendingSettlementsCount when atomic batch has completed successfully!
      const addedSettlements = finalBatch && finalBatch.status === "COMPLETED" ? finalBatch.txCount : 0;

      return {
        ...prev,
        totalCirculation: (currentUser ? currentUser.balance : 0) + 20500,
        lastSptrMsgIso20022: newBnaSptrMsg || prev.lastSptrMsgIso20022,
        pendingSettlementsCount: prev.pendingSettlementsCount + addedSettlements,
        syncBatches: updatedBatches
      };
    });
  };

  // Sizing styles
  const layoutContainerClass = highContrast ? "bg-black text-white" : "bg-zinc-950 text-slate-100";

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-all duration-300 ${layoutContainerClass}`}>
      
      {/* SOLID SYSTEM STATUS BAR */}
      <div className="bg-black/95 p-3.5 border-b border-neutral-900 select-none">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-center">
          <div className="flex items-center gap-2">
            <span className="p-1 text-[#B87333]"><Layers className="w-5 h-5 animate-pulse" /></span>
            <div className="text-left leading-tight">
              <span className="font-extrabold text-[#FFF] tracking-widest text-xs uppercase block">KWANZAMÓVEL v2</span>
              <span className="text-[10px] text-zinc-500 uppercase font-mono block">Diretriz Reguladora do Banco Nacional de Angola</span>
            </div>
          </div>

          {/* ACCESSIBILITY BAR */}
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <span className="text-[10.5px] uppercase font-bold text-zinc-500 flex items-center gap-1">
              <Accessibility className="w-3.5 h-3.5" /> Acessibilidade:
            </span>

            <button 
              onClick={() => setSeniorMode(!seniorMode)}
              className={`px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-extrabold transition-all border ${
                seniorMode 
                ? "bg-[#B87333] text-white border-[#B87333]" 
                : "bg-transparent text-zinc-400 border-neutral-800 hover:text-white"
              }`}
            >
              Modo Sénior {seniorMode ? "ON" : "OFF"}
            </button>

            <button 
              onClick={() => setHighContrast(!highContrast)}
              className={`px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-extrabold transition-all border ${
                highContrast 
                ? "bg-white text-black border-white" 
                : "bg-transparent text-zinc-400 border-neutral-800 hover:text-white"
              }`}
            >
              Contraste {highContrast ? "ALTO" : "NORMAL"}
            </button>

            <button 
              onClick={() => {
                const turnOn = !voiceOver;
                setVoiceOver(turnOn);
                if (turnOn && "speechSynthesis" in window) {
                  window.speechSynthesis.cancel();
                  const ut = new SpeechSynthesisUtterance("Leitor de voz ativado.");
                  ut.lang = "pt-PT";
                  window.speechSynthesis.speak(ut);
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-extrabold transition-all border ${
                voiceOver 
                ? "bg-[#B87333] text-white border-[#B87333]" 
                : "bg-transparent text-zinc-400 border-neutral-800 hover:text-white"
              }`}
            >
              Leitor de Voz {voiceOver ? "LIGADO" : "DESLIGADO"}
            </button>
          </div>
        </div>
      </div>

      {/* SYSTEM PLAYGROUND VIEW */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-8 items-start justify-center">
        
        {/* LEFT COLUMN: INTERACTIVE PHONE */}
        <div className="w-full lg:w-auto flex justify-center">
          <KMPhonePrototype 
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
            ledger={history}
            setLedger={setHistory}
            onLedgerUpdate={handleLedgerUpdate}
            seniorMode={seniorMode}
            setSeniorMode={setSeniorMode}
            voiceOver={voiceOver}
            setVoiceOver={setVoiceOver}
            highContrast={highContrast}
          />
        </div>

        {/* RIGHT COLUMN: FINANCIAL OPERATING SYSTEM WORKBENCH */}
        <div className="w-full lg:flex-1 max-w-5xl flex flex-col gap-4">
          <FinancialOperatingSystem 
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
            ledger={history}
            setLedger={setHistory}
            onLedgerUpdate={handleLedgerUpdate}
            bnaState={bnaState}
            setBnaState={setBnaState}
            highContrast={highContrast}
            seniorMode={seniorMode}
            voiceOver={voiceOver}
          />
        </div>

      </div>

    </div>
  );
}
