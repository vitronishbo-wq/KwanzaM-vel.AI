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
  Scale,
  Lock,
  Unlock,
  KeyRound,
  Eye,
  EyeOff
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
import { UserRole, UserCredentialProfile } from "./domain/security/CredentialManager";
import { CredentialFactory } from "./infrastructure/adapters/auth/CredentialFactory";

export default function App() {
  // Estado de controle para o Painel Administrativo / SRE
  // Garantido: showAdminPanel = false no estado inicial
  const [showAdminPanel, setShowAdminPanel] = useState<boolean>(false);
  const [showAuthGateModal, setShowAuthGateModal] = useState<boolean>(false);
  const [adminAuthProfile, setAdminAuthProfile] = useState<UserCredentialProfile | null>(null);

  // Estados de autorização RBAC
  const [selectedRole, setSelectedRole] = useState<UserRole>("ADMIN");
  const [authPassword, setAuthPassword] = useState<string>("");
  const [authError, setAuthError] = useState<string>("");
  const [authProcessing, setAuthProcessing] = useState<boolean>(false);
  const [showPasswordText, setShowPasswordText] = useState<boolean>(false);
  
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

  // Instância do Gerenciador de Credenciais obtida via Factory de infraestrutura
  const credManager = CredentialFactory.getInstance();

  // Handlers para o fluxo rigoroso de desbloqueio e autorização administrativa
  const handleServiceCodeRecognized = () => {
    // 1. O código *#7668# foi reconhecido e limpo pelo telemóvel
    // 2. Abre a autorização administrativa real (RBAC) com campo de palavra-passe limpo
    setAuthError("");
    setAuthPassword("");
    setShowAuthGateModal(true);
  };

  const handleAuthorizeAdmin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthProcessing(true);
    setAuthError("");

    setTimeout(() => {
      const validation = credManager.validateCredentials(selectedRole, authPassword);
      if (validation.isValid && validation.profile) {
        setAdminAuthProfile(validation.profile);
        setShowAdminPanel(true);
        setShowAuthGateModal(false);
        setAuthPassword("");
      } else {
        setAuthError(validation.errorMessage || "Autorização falhou: credenciais ou palavra-passe incorreta.");
      }
      setAuthProcessing(false);
    }, 250);
  };

  const handleLockAndExitAdmin = () => {
    // Ação "Bloquear / Voltar ao KMOS":
    // 1. Destrói o estado de sessão administrativa
    // 2. Desmonta integralmente o painel FinancialOperatingSystem
    // 3. Retorna à superfície pública (KMPhonePrototype)
    // 4. Exige novo código *#7668# e nova autorização para novo acesso
    setShowAdminPanel(false);
    setShowAuthGateModal(false);
    setAdminAuthProfile(null);
    setAuthPassword("");
    setAuthError("");
  };

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
      
      {/* ADMIN STATE BAR / LOCK CONTROL (EXIBIDO SOMENTE APÓS AUTORIZAÇÃO REAL VÁLIDA) */}
      {showAdminPanel && adminAuthProfile && (
        <div className="bg-black/95 p-3 border-b border-neutral-900 select-none">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <div className="text-left leading-tight">
                <span className="text-[11px] font-mono font-bold text-amber-300 block">
                  {adminAuthProfile.role}: {adminAuthProfile.fullName}
                </span>
                <span className="text-[9.5px] font-mono text-zinc-400 block">
                  Sessão autorizada via CredentialManager
                </span>
              </div>
            </div>
            <button
              onClick={handleLockAndExitAdmin}
              className="px-3 py-1 bg-rose-950 hover:bg-rose-900 text-rose-200 hover:text-white text-[10px] font-mono uppercase font-black rounded-lg border border-rose-600/50 hover:border-rose-500 transition-all cursor-pointer flex items-center gap-1"
              title="Destruir sessão e voltar ao modo telemóvel público"
            >
              <Lock className="w-3 h-3" />
              <span>Bloquear / Voltar ao KMOS</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE AUTORIZAÇÃO ADMINISTRATIVA REAL (RBAC) */}
      {showAuthGateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-neutral-950 border border-amber-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-slate-100 font-mono">
            
            <div className="flex items-start justify-between pb-3 border-b border-neutral-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white uppercase tracking-wide">
                    Autorização Administrativa Requerida
                  </h3>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Código de serviço <strong className="text-amber-400">*#7668#</strong> reconhecido. Validação de identidade e credencial RBAC obrigatória.
                </p>
              </div>
              <button
                onClick={handleLockAndExitAdmin}
                className="text-zinc-500 hover:text-white p-1 rounded hover:bg-neutral-900 cursor-pointer"
                title="Cancelar e manter trancado"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAuthorizeAdmin} className="space-y-4 pt-1">
              
              {/* Select do Perfil RBAC */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 uppercase block">
                  Perfil de Acesso Administrativo (RBAC):
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                >
                  <option value="ADMIN">ADMIN — SuperAdmin / Deus Fundador (Acesso Total, SRE, Ledger)</option>
                  <option value="AUDITOR">AUDITOR — Inspetor Geral BNA (Auditoria & Vault de Evidências)</option>
                  <option value="COMPLIANCE">COMPLIANCE — Oficial de Compliance AML/CFT</option>
                  <option value="ENGINEER">ENGINEER — Engenheiro SRE / DevOps (Telemetria & Stress)</option>
                </select>
                <div className="text-[10px] text-zinc-400 bg-neutral-900/60 p-2 rounded-lg border border-neutral-800">
                  <span className="text-amber-400 font-bold">Titular: </span>
                  {credManager.getProfileCredentials(selectedRole).fullName} ({credManager.getProfileCredentials(selectedRole).email})
                </div>
              </div>

              {/* Campo de Palavra-Passe */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 uppercase block">
                  Palavra-passe de Autorização:
                </label>
                <div className="relative">
                  <input
                    type={showPasswordText ? "text" : "password"}
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="Introduza a palavra-passe de autorização..."
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-white pr-10 focus:outline-none focus:border-amber-500 font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordText(!showPasswordText)}
                    className="absolute right-3 top-2.5 text-zinc-400 hover:text-white"
                  >
                    {showPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Feedback de Erro */}
              {authError && (
                <div className="p-3 bg-rose-950/80 border border-rose-500/50 rounded-xl text-xs text-rose-300">
                  {authError}
                </div>
              )}

              {/* Ações do Modal */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleLockAndExitAdmin}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-800 hover:bg-neutral-900 text-zinc-400 hover:text-white text-xs uppercase font-bold transition-all cursor-pointer"
                >
                  Cancelar & Trancar
                </button>
                <button
                  type="submit"
                  disabled={authProcessing}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg"
                >
                  {authProcessing ? (
                    <span>Validando Credenciais...</span>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Validar & Montar Painel</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="text-[9.5px] text-zinc-500 text-center border-t border-neutral-900 pt-2">
              Regra de Segurança: O código *#7668# apenas desbloqueia a interface. A autorização é estritamente validada pelo CredentialManager.
            </div>

          </div>
        </div>
      )}

      {/* SYSTEM PLAYGROUND VIEW - PURE MOBILE PROTOTYPE WHEN LOCKED, EXPANDED WORKBENCH WHEN UNLOCKED VIA *#7668# + RBAC */}
      <div className={`flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex flex-col ${showAdminPanel && adminAuthProfile ? "lg:flex-row" : "items-center"} gap-8 items-start justify-center transition-all duration-300`}>
        
        {/* INTERACTIVE PHONE COLUMN */}
        <div className={`w-full ${showAdminPanel && adminAuthProfile ? "lg:w-auto" : "max-w-md"} flex justify-center`}>
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
            setHighContrast={setHighContrast}
            onUnlockAdmin={handleServiceCodeRecognized}
            isAdminUnlocked={showAdminPanel && !!adminAuthProfile}
            onLockAdmin={handleLockAndExitAdmin}
          />
        </div>

        {/* RIGHT COLUMN: FINANCIAL OPERATING SYSTEM WORKBENCH (MOUNTED ONLY AFTER VALID ADMINISTRATIVE AUTHORIZATION) */}
        {showAdminPanel && adminAuthProfile && (
          <div className="w-full lg:flex-1 max-w-5xl flex flex-col gap-4 animate-fade-in">
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
        )}

      </div>

    </div>
  );
}
