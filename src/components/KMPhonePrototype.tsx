/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Send, 
  QrCode, 
  Clock, 
  Check, 
  Eye, 
  EyeOff, 
  Shield,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  HelpCircle,
  User,
  Building,
  Coins,
  MapPin,
  Fingerprint,
  PhoneCall,
  Volume2,
  Info,
  Lock,
  Sparkles,
  Smartphone,
  Unlock,
  KeyRound,
  Camera
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Transaction, UserAccount, JournalEntry, DomainEvent } from "../types";
import { createDoubleEntry, executeFinancialUseCase } from "../ledgerEngine";
import { QRGenerator } from "./QRGenerator";
import { generatePacs008Message } from "../bnaCustody";
import { addReconciliationEntry } from "../indexedDB";
import { TransactionReceiptModal } from "./TransactionReceiptModal";

interface KMPhonePrototypeProps {
  currentUser: UserAccount;
  setCurrentUser: React.Dispatch<React.SetStateAction<UserAccount>>;
  ledger: Transaction[];
  setLedger: React.Dispatch<React.SetStateAction<Transaction[]>>;
  onLedgerUpdate: (newJournal: JournalEntry[], newBnaSptrMsg: string, txAmount: number, syncBatch?: any, events?: DomainEvent[]) => void;
  seniorMode: boolean;
  setSeniorMode: (val: boolean) => void;
  voiceOver: boolean;
  setVoiceOver: (val: boolean) => void;
  highContrast?: boolean;
}

export default function KMPhonePrototype({
  currentUser,
  setCurrentUser,
  ledger,
  setLedger,
  onLedgerUpdate,
  seniorMode,
  setSeniorMode,
  voiceOver,
  setVoiceOver,
  highContrast = false
}: KMPhonePrototypeProps) {
  
  // Tab Navigation: "inicio" | "agentes" | "ajuda" | "perfil"
  const [activeTab, setActiveTab] = useState<"inicio" | "agentes" | "ajuda" | "perfil">("inicio");

  // Idempotency Tracking State (Fase 2.5)
  const [processedKeys, setProcessedKeys] = useState<string[]>([]);
  
  // First load is onboarding (Level 1: Splash/Onboarding) representing Rustic Premium Brand Campaign
  const [isOnboarded, setIsOnboarded] = useState<boolean>(false);
  
  // Flow Steps: "idle" | "reveal_pin" | "enviar_1" | "enviar_2" | "enviar_3" | "enviar_sucesso" | "receber" | "pagar_opcao" | "pagar_manual" | "pagar_scan" | "pagar_confirm" | "pagar_sucesso" | "historico" | "pagar_spoken" | "pagar_confirm_spoken" | "pagar_sucesso_spoken"
  const [step, setStep] = useState<string>("idle");

  // Privacy & Pin Validation
  const [balanceRevealed, setBalanceRevealed] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>("");
  const [pinError, setPinError] = useState<string>("");
  const [showBiometricModal, setShowBiometricModal] = useState<boolean>(false);
  const [biometricType, setBiometricType] = useState<"fingerprint" | "face_id">("fingerprint");
  const [fingerprintHolding, setFingerprintHolding] = useState<boolean>(false);
  const [fingerprintProgress, setFingerprintProgress] = useState<number>(0);
  const [faceIdScanning, setFaceIdScanning] = useState<boolean>(false);
  const [faceIdProgress, setFaceIdProgress] = useState<number>(0);
  const [faceIdStatus, setFaceIdStatus] = useState<string>("Pronto para escanear");
  const [biometricError, setBiometricError] = useState<string>("");
  const [biometricScanning, setBiometricScanning] = useState<boolean>(false);
  const [biometricSuccess, setBiometricSuccess] = useState<boolean>(false);

  // Inclusive features states
  const [receiveTab, setReceiveTab] = useState<"dinamico" | "humano_permanente">("dinamico");
  const [tokenFaladoCode, setTokenFaladoCode] = useState<string>("");
  const [spokenResolved, setSpokenResolved] = useState<{name: string, code: string, age: number, location: string, defaultAmount: number} | null>(null);
  const [customSpokenAmount, setCustomSpokenAmount] = useState<string>("");
  const [spokenNotification, setSpokenNotification] = useState<string>("");

  // Sending module state
  const [sendPhone, setSendPhone] = useState<string>("");
  const [sendAmount, setSendAmount] = useState<string>("");
  const [sendPin, setSendPin] = useState<string>("");
  const [sendError, setSendError] = useState<string>("");
  const [sendProcessing, setSendProcessing] = useState<boolean>(false);

  // Receiving state (Dynamic token rotation)
  const [receiveToken, setReceiveToken] = useState<string>("4891");
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [speakingToken, setSpeakingToken] = useState<boolean>(false);

  // Paying state
  const [payCode, setPayCode] = useState<string>("");
  const [selectedMerchant, setSelectedMerchant] = useState<{name: string, location: string, code: string, amount: number} | null>(null);
  const [payPin, setPayPin] = useState<string>("");
  const [payError, setPayError] = useState<string>("");
  const [payProcessing, setPayProcessing] = useState<boolean>(false);

  // Interactive Agent Simulator state
  const [agentStep, setAgentStep] = useState<"menu" | "deposit" | "withdraw" | "identity" | "success">("menu");
  const [agentDepositAmount, setAgentDepositAmount] = useState<string>("5000");
  const [agentWithdrawAmount, setAgentWithdrawAmount] = useState<string>("5000");
  const [agentWithdrawToken, setAgentWithdrawToken] = useState<string>("");
  const [agentBI, setAgentBI] = useState<string>("");
  const [identityStatus, setIdentityStatus] = useState<"idle" | "verifying" | "verified" | "error">("idle");
  const [verifiedUserData, setVerifiedUserData] = useState<{name: string, bi: string, tier: string} | null>(null);
  const [agentSuccessMsg, setAgentSuccessMsg] = useState<string>("");
  const [selectedTxForReceipt, setSelectedTxForReceipt] = useState<Transaction | null>(null);

  // Pre-seeded merchants (including the revolutionary QR Humano card option)
  const mockMerchants = [
    { name: "Mamã Teresa - Viana (QR Humano)", location: "Luanda (Mercado de Viana)", code: "KMV-84721", amount: 2500 },
    { name: "Táxi Candongueiro (Viana-Mutamba)", location: "Luanda", code: "TX-402", amount: 150 },
    { name: "Cantina do Sr. Kassoma (Huambo)", location: "Huambo Central", code: "MC-882", amount: 1200 },
    { name: "Avó Joana - Feira do Kifica", location: "Talatona", code: "FJ-110", amount: 4500 },
    { name: "Farmácia Comunitária Lobito", location: "Benguela", code: "FM-551", amount: 8900 }
  ];

  // Token Falado pre-seeded codes
  const mockSpokenTokens = [
    { name: "Avó Joana - Feira do Kifica", code: "5842", age: 72, location: "Huambo Central", defaultAmount: 1500 },
    { name: "Mamã Teresa - Mercado de Viana", code: "4721", age: 58, location: "Luanda (Viana)", defaultAmount: 2000 },
    { name: "Avô Kassoma - Lavra Catumbela", code: "8821", age: 75, location: "Benguela (Catumbela)", defaultAmount: 1200 },
    { name: "Maria João - Comércio Quintal", code: "4722", age: 66, location: "Huíla (Lubango)", defaultAmount: 3000 }
  ];

  // Dynamic token rotation for Receiver code (60 seconds)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === "receber") {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            const freshCode = Math.floor(1000 + Math.random() * 9000).toString();
            setReceiveToken(freshCode);
            if (voiceOver) {
              speakText(`Novo código de recebimento: ${freshCode.split("").join(" ")}`);
            }
            return 60;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, voiceOver]);

  // Read out voice assist (Portuguese)
  const speakText = (text: string) => {
    if (!voiceOver) return;
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "pt-PT";
      utterance.rate = seniorMode ? 0.75 : 0.90;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleRenewToken = () => {
    const freshCode = Math.floor(1000 + Math.random() * 9000).toString();
    setReceiveToken(freshCode);
    setTimeLeft(60);
    speakText(`Novo código de recebimento: ${freshCode.split("").join(" ")}`);
  };

  const handleSimulateReceive = (amount: number, senderName: string) => {
    const txId = "tx-" + Math.random().toString(36).substring(2, 9);
    const newTx: Transaction = {
      id: txId,
      senderPhone: senderName,
      receiverPhone: currentUser.name,
      amount: amount,
      type: "recebimento",
      status: "completed",
      timestamp: new Date().toISOString(),
      latencyMs: 88,
      fraudScore: 0,
      securityLog: ["Validação QR Code Dinâmico", "Assinatura digital autenticada"]
    };

    setCurrentUser(prev => ({ ...prev, balance: prev.balance + amount }));
    setLedger(prev => [newTx, ...prev]);

    const journal = createDoubleEntry(
      txId,
      `Recebimento QR Code (${senderName})`,
      "Wallet " + senderName + " (Ativo)",
      "Wallet " + currentUser.name + " (Ativo)",
      amount
    );
    
    onLedgerUpdate([journal], generatePacs008Message(newTx), amount);
    
    addReconciliationEntry(
      txId,
      "reconciliado_bna",
      amount,
      "Wallet " + senderName + " (Ativo)",
      "Wallet " + currentUser.name + " (Ativo)"
    ).catch(e => console.warn(e));

    speakText(`Recebeu um pagamento de ${amount.toLocaleString("pt-PT")} Kwanzas de ${senderName}.`);
  };

  // Simulated holding fingerprint integration
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (fingerprintHolding) {
      setBiometricError("");
      intervalId = setInterval(() => {
        setFingerprintProgress((prev) => {
          if (prev >= 100) {
            clearInterval(intervalId);
            setFingerprintHolding(false);
            setBalanceRevealed(true);
            setShowBiometricModal(false);
            setFingerprintProgress(0);
            speakText("Impressão digital validada com sucesso absoluta. Saldo confidencial desvelado!");
            return 100;
          }
          return prev + 5;
        });
      }, 40); // 800ms
    } else {
      if (fingerprintProgress < 100 && fingerprintProgress > 0) {
        setBiometricError("Leitura biométrica interrompida. Mantenha o dedo pressionado no sensor.");
        speakText("Erro. Leitura interrompida.");
        setFingerprintProgress(0);
      }
    }
    return () => clearInterval(intervalId);
  }, [fingerprintHolding]);

  // Simulated Face ID integration
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (faceIdScanning) {
      setBiometricError("");
      setFaceIdProgress(0);
      setFaceIdStatus("A localizar contornos temporais...");
      speakText("A alinhar sensores biométricos de profundidade tridimensional...");

      const statusTimeline = [
        { percent: 20, text: "A detetar pontos fiduciários da face..." },
        { percent: 50, text: "A analisar vetores de relevo 3D..." },
        { percent: 80, text: "A validar prova de vivacidade..." },
        { percent: 100, text: "Verificação facial autorizada!" }
      ];

      intervalId = setInterval(() => {
        setFaceIdProgress((prev) => {
          const nextVal = prev + 10;
          const currentStatusObj = statusTimeline.find(s => nextVal <= s.percent);
          if (currentStatusObj) {
            setFaceIdStatus(currentStatusObj.text);
          }

          if (nextVal >= 100) {
            clearInterval(intervalId);
            setFaceIdScanning(false);
            setBalanceRevealed(true);
            setShowBiometricModal(false);
            setFaceIdProgress(0);
            speakText("Rosto validado. Saldo confidencial revelado.");
            return 100;
          }
          return nextVal;
        });
      }, 150); // 1.5 seconds
    }
    return () => clearInterval(intervalId);
  }, [faceIdScanning]);

  // Announce screen change automatically for accessibility
  useEffect(() => {
    if (!isOnboarded) {
      speakText("KwanzaMóvel de Angola. A carregar ecrã de onboarding institucional.");
      return;
    }
    let msg = "";
    if (step !== "idle") {
      switch (step) {
        case "reveal_pin":
          msg = "Confirmar PIN para ver saldo de Kwanzas.";
          break;
        case "enviar_1":
          msg = "Enviar dinheiro. Digite o número de telemóvel do destinatário.";
          break;
        case "enviar_2":
          msg = `Destinatário +244 ${sendPhone}. Digite o valor que pretende enviar.`;
          break;
        case "enviar_3":
          msg = `A enviar ${sendAmount} Kwanzas. Introduza o PIN para assinar transação offline.`;
          break;
        case "enviar_sucesso":
          msg = "Dinheiro enviado síncronamente com sucesso absoluto.";
          break;
        case "receber":
          msg = `Ecrã receber. Mostre o código QR ou partilhe o código de quatro algarismos: ${receiveToken.split("").join(" ")}.`;
          break;
        case "pagar_opcao":
          msg = "Escolha pagar por câmara QR ou introduzir o código do lojista.";
          break;
        case "pagar_manual":
          msg = "Introduzir código de lojista de cinco letras ou números.";
          break;
        case "pagar_scan":
          msg = "Simulador de câmara para cartolina QR do comércio.";
          break;
        case "pagar_confirm":
          msg = `Confirmar pagamento comercial de ${selectedMerchant?.amount} Kwanzas para ${selectedMerchant?.name}. Digite o PIN.`;
          break;
        case "pagar_sucesso":
          msg = "Pagamento efetuado com sucesso.";
          break;
        case "historico":
          msg = "Histórico de movimentos guardados offline.";
          break;
      }
    } else {
      switch (activeTab) {
        case "inicio":
          msg = `Ecrã operacional. Saldo ${balanceRevealed ? currentUser.balance + " Kwanzas" : "ocultado para privacidade"}.`;
          break;
        case "agentes":
          msg = "Modo Agente Físico. Selecione efetuar depósito, levantamento de dinheiro em papel, ou validação de Bilhete de Identidade.";
          break;
        case "ajuda":
          msg = "Ecrã de informações técnicas e regulamentares da rede.";
          break;
        case "perfil":
          msg = `Ecrã de Perfil. Utilizador ${currentUser.name}. Opção para rever identidade da marca KwanzaMóvel disponível.`;
          break;
      }
    }
    speakText(msg);
  }, [step, activeTab, isOnboarded, balanceRevealed]);

  // Pin verify for revealing balance
  const handleVerifyBalance = (pinVal: string) => {
    if (pinVal === currentUser.pinHash) {
      setBalanceRevealed(true);
      setStep("idle");
      setPinInput("");
      setPinError("");
      speakText(`Identidade validada. Saldo de ${currentUser.balance} Kwanzas.`);
    } else {
      setPinError("PIN incorreto. Tente novamente.");
    }
  };

  // Simulates biometric hardware scan
  const startFaceIdScan = () => {
    if (faceIdScanning) return;
    setFaceIdScanning(true);
  };

  // Perform send operation
  const handleSendExecute = () => {
    if (sendPin !== currentUser.pinHash) {
      setSendError("PIN de segurança incorreto.");
      return;
    }
    const amt = parseFloat(sendAmount);
    if (isNaN(amt) || amt <= 0 || amt > currentUser.balance) {
      setSendError("Valor inválido ou saldo insuficiente.");
      return;
    }

    setSendProcessing(true);
    setSendError("");

    setTimeout(async () => {
      try {
        const idempotencyKey = `idemp_env_${currentUser.phone}_${sendPhone}_${amt}`;

        const res = executeFinancialUseCase({
          sender: currentUser,
          receiverPhone: sendPhone,
          amount: amt,
          type: "envio",
          direction: "outflow",
          description: `Envio offline para ${sendPhone}`,
          debitAccountName: "Wallet Manuel da Silva (Ativo)",
          creditAccountName: "Compensações Gerais de Saída (Passivo)",
          idempotencyKey,
          processedIdempotencyKeys: processedKeys
        });

        if (!res.success) {
          throw new Error(res.error || "Falha ao processar transação.");
        }

        // Add to processed idempotency keys
        setProcessedKeys(prev => [...prev, idempotencyKey]);

        setCurrentUser(res.updatedSender);
        setLedger(prev => [res.transaction, ...prev]);

        // Persist Reconciliation Entry (Infrastructure Layer)
        await addReconciliationEntry(
          res.transaction.id,
          "liquidação_síncrona",
          amt,
          "Wallet Manuel da Silva (Ativo)",
          "Compensações Gerais de Saída (Passivo)"
        );

        const sptrXml = generatePacs008Message(res.transaction);
        onLedgerUpdate([res.journalEntry], sptrXml, amt, null, res.events);

        setSendProcessing(false);
        setStep("enviar_sucesso");
      } catch (err: any) {
        setSendError(err.message || "Erro durante o processamento financeiro.");
        setSendProcessing(false);
      }
    }, 800);
  };

  // Perform payment operation
  const handlePayExecute = () => {
    if (!selectedMerchant) return;
    if (payPin !== currentUser.pinHash) {
      setPayError("PIN de segurança incorreto.");
      return;
    }
    const amt = selectedMerchant.amount;
    if (amt > currentUser.balance) {
      setPayError("Saldo insuficiente.");
      return;
    }

    setPayProcessing(true);
    setPayError("");

    setTimeout(async () => {
      try {
        const idempotencyKey = `idemp_pay_${currentUser.phone}_${selectedMerchant.code}_${amt}`;

        const res = executeFinancialUseCase({
          sender: currentUser,
          receiverPhone: selectedMerchant.code,
          amount: amt,
          type: "pagamento",
          direction: "outflow",
          description: `Pagamento Lojista: ${selectedMerchant.name}`,
          debitAccountName: "Wallet Manuel da Silva (Ativo)",
          creditAccountName: "Compensações de Lojistas BNA (Passivo)",
          idempotencyKey,
          processedIdempotencyKeys: processedKeys
        });

        if (!res.success) {
          throw new Error(res.error || "Falha ao processar pagamento.");
        }

        // Add to processed idempotency keys
        setProcessedKeys(prev => [...prev, idempotencyKey]);

        setCurrentUser(res.updatedSender);
        setLedger(prev => [res.transaction, ...prev]);

        // Persist Reconciliation Entry (Infrastructure Layer)
        await addReconciliationEntry(
          res.transaction.id,
          "liquidação_síncrona",
          amt,
          "Wallet Manuel da Silva (Ativo)",
          "Compensações de Lojistas BNA (Passivo)"
        );

        const sptrXml = generatePacs008Message(res.transaction);
        onLedgerUpdate([res.journalEntry], sptrXml, amt, null, res.events);

        setPayProcessing(false);
        setStep("pagar_sucesso");
      } catch (err: any) {
        setPayError(err.message || "Erro durante o pagamento.");
        setPayProcessing(false);
      }
    }, 850);
  };

  // AGENTES: Simulador de Depósito (Cash-In)
  const handleAgentDeposit = () => {
    const amt = parseFloat(agentDepositAmount);
    if (isNaN(amt) || amt <= 0) {
      alert("Por favor digite um montante de depósito válido.");
      return;
    }

    // Physical Agent injects funds
    const txId = "TX-AGD-" + Math.floor(100000 + Math.random() * 900000);
    const newTx: Transaction = {
      id: txId,
      senderPhone: "Agente Físico Autorizado #042",
      receiverPhone: currentUser.phone,
      amount: amt,
      type: "recebimento",
      status: "completed",
      timestamp: new Date().toISOString(),
      latencyMs: 75,
      fraudScore: 0,
      securityLog: ["Depósito em numerário síncrone", "Certificado pelo Agente Autorizado BNA"]
    };

    setCurrentUser(prev => ({ ...prev, balance: prev.balance + amt }));
    setLedger(prev => [newTx, ...prev]);

    const journal = createDoubleEntry(
      txId,
      `Depósito físico em numerário (Agente)`,
      "Garantia Bancária de Depósitos (Ativo BNA)",
      "Wallet Manuel da Silva (Ativo)",
      amt
    );
    
    onLedgerUpdate([journal], generatePacs008Message(newTx), amt);
    
    addReconciliationEntry(
      txId,
      "reconciliado_bna",
      amt,
      "Garantia Bancária de Depósitos (Ativo BNA)",
      "Wallet Manuel da Silva (Ativo)"
    ).catch(e => console.warn(e));

    setAgentSuccessMsg(`Depósito físico de ${amt.toLocaleString("pt-PT")} Kz realizado com sucesso! O saldo foi creditador de imediato na sua carteira.`);
    setAgentStep("success");
    speakText(`Depósito realizado. Recebeu ${amt} Kwanzas.`);
  };

  // AGENTES: Simulador de Levantamento (Cash-Out)
  const handleAgentWithdraw = () => {
    const amt = parseFloat(agentWithdrawAmount);
    if (isNaN(amt) || amt <= 0 || amt > currentUser.balance) {
      alert("Montante de levantamento inválido ou saldo insuficiente.");
      return;
    }

    const txId = "TX-AGW-" + Math.floor(100000 + Math.random() * 900000);
    const newTx: Transaction = {
      id: txId,
      senderPhone: currentUser.phone,
      receiverPhone: "Agente Físico Autorizado #042",
      amount: amt,
      type: "envio",
      status: "completed",
      timestamp: new Date().toISOString(),
      latencyMs: 80,
      fraudScore: 1,
      securityLog: ["Levantamento físico via Agente", "Desembolso físico efetuado com PIN"]
    };

    setCurrentUser(prev => ({ ...prev, balance: prev.balance - amt }));
    setLedger(prev => [newTx, ...prev]);

    const journal = createDoubleEntry(
      txId,
      `Levantamento físico em numerário (Agente)`,
      "Wallet Manuel da Silva (Ativo)",
      "Garantia Bancária de Depósitos (Ativo BNA)",
      amt
    );

    onLedgerUpdate([journal], generatePacs008Message(newTx), amt);

    addReconciliationEntry(
      txId,
      "reconciliado_bna",
      amt,
      "Wallet Manuel da Silva (Ativo)",
      "Garantia Bancária de Depósitos (Ativo BNA)"
    ).catch(e => console.warn(e));

    setAgentSuccessMsg(`Sucesso! Foram debitados ${amt.toLocaleString("pt-PT")} Kz da sua carteira. O Agente #042 fará agora a entrega do dinheiro físico em papel.`);
    setAgentStep("success");
    speakText(`Levantamento de ${amt} Kwanzas em numerário efetuado com sucesso.`);
  };

  // AGENTES: Simulador de Validação do Bilhete de Identidade (BI Angolano)
  const handleAgentBIValidation = () => {
    const biClean = agentBI.trim().toUpperCase();
    if (biClean.length < 8) {
      setIdentityStatus("error");
      speakText("Número de BI inválido. Tente novamente.");
      return;
    }

    setIdentityStatus("verifying");
    speakText("A verificar integridade criptográfica com a base nacional civil.");

    setTimeout(() => {
      // High-quality mock result simulating direct civil registration database query
      setIdentityStatus("verified");
      const nameMock = biClean.endsWith("LA042") ? "Manuel da Silva" : "Cláudio Kassoma Bento";
      const validated = {
        name: nameMock,
        bi: biClean,
        tier: "Level-3" as const
      };
      setVerifiedUserData(validated);
      
      // Upgrade user tier in live state
      setCurrentUser(prev => ({
        ...prev,
        tier: "Level-3",
        biNumber: biClean,
        name: nameMock
      }));

      speakText(`Excelente. Identidade de ${nameMock} confirmada com selo BNA. Limite diário elevado para ilimitado.`);
    }, 1200);
  };

  // Speak codes aloud (Receber flow helper)
  const triggerAudioReadout = () => {
    setSpeakingToken(true);
    const digitsMap: Record<string, string> = {
      "0": "zero", "1": "um", "2": "dois", "3": "três", "4": "quatro",
      "5": "cinco", "6": "seis", "7": "sete", "8": "oito", "9": "nove"
    };
    const codeDigits = receiveToken.split("").map(d => digitsMap[d] || d).join(" ");
    const phrase = `Token de recebimento: ${codeDigits}.`;
    
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(phrase);
      utterance.lang = "pt-PT";
      utterance.rate = 0.70;
      utterance.onend = () => setSpeakingToken(false);
      utterance.onerror = () => setSpeakingToken(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setSpeakingToken(false);
    }
  };

  // Direct manual code verification
  const handleVerifyMerchantCode = (code: string) => {
    const found = mockMerchants.find(m => m.code.toLowerCase() === code.trim().toLowerCase());
    if (found) {
      setSelectedMerchant(found);
      setStep("pagar_confirm");
      setPayError("");
    } else {
      setPayError("Comerciante não identificado. Verifique o código.");
    }
  };

  // Direct Token Falado code verification
  const handleVerifySpokenToken = (code: string) => {
    const found = mockSpokenTokens.find(t => t.code === code.trim() || t.code.toLowerCase() === code.trim().toLowerCase());
    if (found) {
      setSpokenResolved(found);
      setCustomSpokenAmount(String(found.defaultAmount));
      setPayPin("");
      setPayError("");
      setStep("pagar_confirm_spoken");
      speakText(`Código resolvido de ${found.name}. ID: KMV-${found.code}.`);
    } else {
      setPayError("Código falado inválido. Tente usar '5842' (Avó Joana) ou '4721' (Mamã Teresa).");
    }
  };

  // Executing the payment to a spoken token recipient completely offline on their side
  const handlePaySpokenExecute = () => {
    if (!spokenResolved) return;
    if (payPin !== currentUser.pinHash) {
      setPayError("PIN de segurança incorreto.");
      return;
    }
    const amt = parseFloat(customSpokenAmount);
    if (isNaN(amt) || amt <= 0) {
      setPayError("Digite um valor válido.");
      return;
    }
    if (amt > currentUser.balance) {
      setPayError("Saldo insuficiente.");
      return;
    }

    setPayProcessing(true);
    setPayError("");

    setTimeout(() => {
      const txId = "TX-PAY-ST-" + Math.floor(100000 + Math.random() * 900000);
      const newTx: Transaction = {
        id: txId,
        senderPhone: currentUser.phone,
        receiverPhone: spokenResolved.code,
        amount: amt,
        type: "pagamento",
        status: "completed",
        timestamp: new Date().toISOString(),
        latencyMs: Math.floor(40 + Math.random() * 20),
        fraudScore: 0,
        securityLog: [
          `Token Falado ${spokenResolved.code} resolvido com sucesso absoluto`,
          "Notificação offline por SMS em telemóvel simples enviada",
          "Anúncio de voz por sintetizador ativado na ponta do comerciante"
        ]
      };

      setCurrentUser(prev => ({ ...prev, balance: prev.balance - amt }));
      setLedger(prev => [newTx, ...prev]);

      const mainJournal = createDoubleEntry(
        txId,
        `Token Falado: ${spokenResolved.name}`,
        "Wallet Manuel da Silva (Ativo)",
        "Compensações de Lojistas BNA (Passivo)",
        amt
      );

      const sptrXml = generatePacs008Message(newTx);
      onLedgerUpdate([mainJournal], sptrXml, amt);

      addReconciliationEntry(
        txId,
        "liquidação_síncrona",
        amt,
        "Wallet Manuel da Silva (Ativo)",
        "Compensações de Lojistas BNA (Passivo)"
      ).catch(e => console.warn(e));

      setPayProcessing(false);
      setSpokenNotification(
        `Pagamento de ${amt.toLocaleString("pt-PT")} Kz concluído com sucesso.`
      );

      // Speak confirmation
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const ut = new SpeechSynthesisUtterance(
          `Recebido no telemóvel simples do comerciante! O KwanzaMóvel de ${spokenResolved.name} de ${spokenResolved.age} anos, anuncia por voz: Recebeu ${amt} Kwanzas!`
        );
        ut.lang = "pt-PT";
        window.speechSynthesis.speak(ut);
      }

      setStep("pagar_sucesso_spoken");
    }, 850);
  };

  // Typography scaling
  const textTitle = seniorMode ? "text-2xl font-black" : "text-lg font-bold";
  const textBody = seniorMode ? "text-base font-semibold" : "text-xs";
  const btnText = seniorMode ? "text-lg py-5 px-4 font-black" : "text-xs py-3 px-3 font-bold";

  return (
    <div id="phone_mockup_hardware_frame" className="relative w-full max-w-[390px] min-h-[720px] bg-[#000000] rounded-[48px] p-4 shadow-2xl border-4 border-neutral-800 flex flex-col justify-between">
      
      {/* Top simulated Speaker & Camera Lens notch */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-32 h-5 bg-neutral-900 rounded-full flex items-center justify-center z-20">
        <div className="w-12 h-1 bg-neutral-800 rounded-full mr-2"></div>
        <div className="w-2.5 h-2.5 bg-neutral-950 rounded-full border border-neutral-800"></div>
      </div>

      {/* Screen Canvas wrapper */}
      <div className="w-full flex-grow bg-[#000000] rounded-[36px] overflow-hidden flex flex-col relative border border-neutral-900 mt-2">
        
        {/* NETWORK & STATUS BAR */}
        <div className="bg-black px-6 pt-5 pb-1 flex justify-between items-center text-[10px] font-mono tracking-wider font-extrabold text-white border-b border-neutral-950 select-none">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
            <span>KwanzaMóvel-NET</span>
          </div>
          <span className="text-[9px]">LOBITO COMPLIANT</span>
          <span>100% OFFLINE</span>
        </div>

        {/* SCREEN SCROLL CONTROLLER - 100% BLACK THEMED */}
        <div className="flex-1 flex flex-col justify-between p-4.5 overflow-y-auto scrollbar-none pb-2 text-white">

          {/* ------------------------------------------------------------- */}
          {/* LEVEL 1 LAYER: BRAND SPLASH / ONBOARDING / INSTITUTIONAL      */}
          {/* ------------------------------------------------------------- */}
          {!isOnboarded ? (
            <div className="flex-1 flex flex-col justify-between animate-fade-in py-2">
              <div className="space-y-4 text-center">
                
                {/* Visual Campaign Accent (Rustic Copper Wire CSS/SVG) */}
                <div className="p-4 bg-gradient-to-b from-[#1c120c] to-black rounded-2xl border border-[#4a2e1d] shadow-lg relative my-4">
                  <div className="absolute top-1 right-2"><Sparkles className="w-4 h-4 text-[#B87333] animate-pulse" /></div>
                  
                  {/* Glowing Wire Art Logo spelling "KwanzaMóvel" */}
                  <div className="flex justify-center my-3 relative grayscale-0">
                    <svg viewBox="0 0 160 50" className="w-40 h-14">
                      <defs>
                        <filter id="wire-premium-glow" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="0.8" result="blur" />
                          <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                        <linearGradient id="glow-copper" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#C48052" />
                          <stop offset="35%" stopColor="#E5A67C" />
                          <stop offset="65%" stopColor="#8C5A2B" />
                          <stop offset="100%" stopColor="#B87333" />
                        </linearGradient>
                      </defs>
                      
                      {/* Artistic Wire Twisted paths representing traditional hand-twisted Angolan wire craftsmanship */}
                      {/* Letter K */}
                      <path d="M35,10 C35,20 33,30 35,38 M47,11 C43,15 39,19 35,23 C39,27 44,32 48,37 M35,23 Q41,23 46,21" fill="none" stroke="url(#glow-copper)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" filter="url(#wire-premium-glow)"/>
                      {/* Letter M */}
                      <path d="M58,38 V11 L70,31 L82,11 V38" fill="none" stroke="url(#glow-copper)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" filter="url(#wire-premium-glow)"/>
                      
                      {/* Small signature wire loop representing continuity and flow (Móvel) */}
                      <path d="M94,26 C99,18 106,18 110,22 C114,26 118,26 123,21 Q127,17 132,22 C136,26 140,26 144,21" fill="none" stroke="url(#glow-copper)" strokeWidth="2.5" strokeLinecap="round" filter="url(#wire-premium-glow)" />
                    </svg>
                  </div>

                  <span className="text-[10px] uppercase tracking-widest text-[#B87333] font-black block">Identidade de Campanha</span>
                  <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">
                     Inspirada na arte do <strong>Arame Artesanal</strong>, no <strong>Cobre Envelhecido</strong> e no <strong>Aço Oxidado</strong> das comunidades angolanas. Segurança ancestral combinada com tecnologia síncrona fiduciária.
                  </p>
                </div>

                <div className="text-left space-y-3.5 px-1 pt-2">
                  <div className="flex gap-2.5 items-start">
                    <div className="p-1 text-[#B87333]"><Check className="w-4 h-4 mt-0.5" /></div>
                    <div>
                      <strong className="text-xs uppercase text-white block">Rustic Premium v2</strong>
                      <span className="text-[11px] text-zinc-400">Uma marca inesquecível e profundamente enraizada na cultura de trabalho nacional de Angola.</span>
                    </div>
                  </div>

                  <div className="flex gap-2.5 items-start">
                    <div className="p-1 text-[#B87333]"><Check className="w-4 h-4 mt-0.5" /></div>
                    <div>
                      <strong className="text-xs uppercase text-white block">Inclusão Sem Custos</strong>
                      <span className="text-[11px] text-zinc-400">Apenas 0,15% ao comerciante. Sem internet ou faturas dispendiosas. Todo habitante incluído.</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mt-6">
                <button
                  onClick={() => setIsOnboarded(true)}
                  className="w-full bg-[#B87333] hover:bg-[#8C5A2B] text-white font-black uppercase text-xs py-4 rounded-xl tracking-wider hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <span>Entrar Na Carteira Operacional</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
                <div className="text-[10px] text-zinc-500 text-center uppercase tracking-widest block font-bold mt-1">
                  KwanzaMóvel COMPLIANT • 2026
                </div>
              </div>
            </div>
          ) : (
            
            // ------------------------------------------------------------- 
            // LEVEL 2 LAYER: ULTRA MINIMAL OPERATIONAL APP (APPLE WALLET/PIX) 
            // ------------------------------------------------------------- 
            <div className="flex-1 flex flex-col justify-between h-full">

              {/* FLOWS: ROOT PREPARATIONS */}
              {step !== "idle" ? (
                <div className="flex-grow flex flex-col justify-between">
                  
                  {/* SUB STEPS FLOW CONTROLLER */}

                  {/* REVEAL BALANCE PIN REQUEST */}
                  {step === "reveal_pin" && (
                    <div className="space-y-4 py-2 animate-fade-in">
                      <div className="flex items-center gap-1 text-[#B87333] font-bold text-xs" onClick={() => setStep("idle")}>
                        <ChevronLeft className="w-4 h-4 cursor-pointer" />
                        <span>Voltar</span>
                      </div>
                      
                      <div className="text-center">
                        <Lock className="w-6 h-6 text-[#B87333] mx-auto mb-2" />
                        <h3 className={`${textTitle} uppercase`}>Confirmar PIN</h3>
                        <p className={`${textBody} text-zinc-400 mt-1`}>
                          Introduza o PIN de segurança para revelar saldo confidencial:
                        </p>
                      </div>

                      <div className="flex flex-col items-center gap-2">
                        <input 
                          type="password"
                          maxLength={4}
                          value={pinInput}
                          onChange={(e) => {
                            setPinInput(e.target.value.replace(/\D/g, ""));
                            if (e.target.value.length === 4) {
                              handleVerifyBalance(e.target.value);
                            }
                          }}
                          placeholder="••••"
                          className="w-32 text-center text-3xl font-mono bg-[#050505] border-b-2 border-[#B87333] py-2 focus:outline-none text-white tracking-widest font-black"
                          autoFocus
                        />
                        <span className="text-[10px] text-zinc-500 font-bold uppercase mt-1">Dica de Teste: 1234</span>
                        {pinError && <span className="text-xs text-rose-500 font-bold">{pinError}</span>}
                      </div>

                      {/* COMPACT SOLID NUMPAD */}
                      <div className="grid grid-cols-3 gap-2 max-w-[220px] mx-auto pt-4">
                        {["1","2","3","4","5","6","7","8","9"].map(n => (
                          <button 
                            key={n} 
                            onClick={() => {
                              const v = pinInput + n;
                              if (v.length <= 4) {
                                setPinInput(v);
                                if (v.length === 4) handleVerifyBalance(v);
                              }
                            }}
                            className="bg-zinc-950 py-3 rounded-lg text-sm font-bold active:bg-[#B87333]/20"
                          >
                            {n}
                          </button>
                        ))}
                        <button onClick={() => setPinInput("")} className="bg-zinc-950 py-3 rounded-lg text-xs font-bold text-zinc-400">Limpar</button>
                        <button 
                          onClick={() => {
                            const v = pinInput + "0";
                            if (v.length <= 4) {
                              setPinInput(v);
                              if (v.length === 4) handleVerifyBalance(v);
                            }
                          }}
                          className="bg-zinc-950 py-3 rounded-lg text-sm font-bold"
                        >0</button>
                        <button onClick={() => setPinInput(prev => prev.slice(0, -1))} className="bg-zinc-950 py-3 rounded-lg text-xs font-bold text-rose-400">Apagar</button>
                      </div>
                    </div>
                  )}

                  {/* FLOW ENVIAR: 1. TELEMÓVEL */}
                  {step === "enviar_1" && (
                    <div className="space-y-4 py-2 flex flex-col justify-between flex-1">
                      <div>
                        <div className="flex items-center gap-1 text-[#B87333] font-bold text-xs cursor-pointer mb-3" onClick={() => setStep("idle")}>
                          <ChevronLeft className="w-4 h-4" />
                          <span>Mudar de ação</span>
                        </div>
                        <h3 className={`${textTitle} uppercase`}>1. Destinatário (Código Curto)</h3>
                        <p className={`${textBody} text-zinc-400 mt-1`}>Introduza o Código Curto da carteira (ex: KM-4831):</p>
                        
                        <div className="mt-4 flex items-center bg-[#050505] p-3 rounded-xl border border-zinc-900 gap-2 text-xl font-mono text-white">
                          <input 
                            type="text"
                            maxLength={7}
                            placeholder="KM-4831"
                            value={sendPhone}
                            onChange={(e) => {
                              const val = e.target.value.toUpperCase();
                              setSendPhone(val);
                            }}
                            className="bg-transparent border-0 focus:outline-none w-full text-white font-black text-center"
                          />
                        </div>
                      </div>

                      <div className="space-y-2 mt-auto">
                        <button
                          disabled={!/^KM-\d{4}$/i.test(sendPhone.trim())}
                          onClick={() => {
                            setSendError("");
                            setStep("enviar_2");
                          }}
                          className="w-full bg-[#B87333] disabled:opacity-30 disabled:cursor-not-allowed text-white uppercase text-xs py-3.5 rounded-xl font-black"
                        >
                          Prosseguir (Montante)
                        </button>
                      </div>
                    </div>
                  )}

                  {/* FLOW ENVIAR: 2. VALOR */}
                  {step === "enviar_2" && (
                    <div className="space-y-4 py-2 flex flex-col justify-between flex-1">
                      <div>
                        <div className="flex items-center gap-1 text-[#B87333] font-bold text-xs cursor-pointer mb-3" onClick={() => setStep("enviar_1")}>
                          <ChevronLeft className="w-4 h-4" />
                          <span>Voltar ao destinatário</span>
                        </div>
                        <h3 className={`${textTitle} uppercase`}>2. Quanto pretenda Enviar?</h3>
                        <p className={`${textBody} text-zinc-400 mt-1`}>Destinatário: <strong className="text-white">{sendPhone}</strong></p>
                        
                        <div className="mt-4 flex items-baseline justify-center bg-[#050505] p-4 rounded-xl border border-zinc-900 gap-2 text-3xl font-mono text-white">
                          <span className="text-zinc-500">Kz</span>
                          <input 
                            type="text"
                            placeholder="0"
                            value={sendAmount}
                            onChange={(e) => setSendAmount(e.target.value.replace(/\D/g, ""))}
                            className="bg-transparent border-0 focus:outline-none text-white text-center font-black w-36"
                          />
                        </div>
                        
                        <div className="text-[11px] text-zinc-500 text-center mt-2 font-bold">
                          Saldo disponível: {currentUser.balance.toLocaleString("pt-PT")} Kz
                        </div>
                      </div>

                      <div className="space-y-2 mt-auto">
                        <button
                          disabled={!sendAmount || parseFloat(sendAmount) <= 0 || parseFloat(sendAmount) > currentUser.balance}
                          onClick={() => {
                            setStep("enviar_3");
                          }}
                          className="w-full bg-[#B87333] disabled:opacity-30 disabled:cursor-not-allowed text-white uppercase text-xs py-3.5 rounded-xl font-black"
                        >
                          Prosseguir (Assinar PIN)
                        </button>
                      </div>
                    </div>
                  )}

                  {/* FLOW ENVIAR: 3. ASSINATURA PIN */}
                  {step === "enviar_3" && (
                    <div className="space-y-4 py-2 flex flex-col justify-between flex-1">
                      <div>
                        <div className="flex items-center gap-1 text-[#B87333] font-bold text-xs cursor-pointer mb-3" onClick={() => setStep("enviar_2")}>
                          <ChevronLeft className="w-4 h-4" />
                          <span>Mudar de montante</span>
                        </div>
                        <h3 className={`${textTitle} uppercase`}>3. Assinar Transação</h3>
                        
                        <div className="bg-[#050505] p-3 rounded-lg border border-zinc-900 text-xs text-zinc-400 font-mono space-y-1">
                          <div className="flex justify-between"><span>Destinatário:</span> <span className="text-white font-bold">{sendPhone}</span></div>
                          <div className="flex justify-between"><span>Montante:</span> <span className="text-white font-bold">{parseFloat(sendAmount).toLocaleString("pt-PT")} Kz</span></div>
                        </div>

                        <div className="mt-4 flex flex-col items-center gap-2">
                          <input 
                            type="password"
                            maxLength={4}
                            placeholder="••••"
                            value={sendPin}
                            onChange={(e) => {
                              setSendPin(e.target.value.replace(/\D/g, ""));
                              if (e.target.value.length === 4) setSendError("");
                            }}
                            className="w-32 text-center text-2xl font-mono bg-transparent border-b-2 border-[#B87333] py-1 text-white tracking-widest focus:outline-none"
                          />
                          <span className="text-[10px] text-zinc-500 font-bold uppercase mt-1">Dica: PIN de teste 1234</span>
                          {sendError && <span className="text-xs text-rose-500 font-bold">{sendError}</span>}
                        </div>
                      </div>

                      <div className="space-y-2 mt-auto">
                        <button
                          disabled={sendPin.length < 4 || sendProcessing}
                          onClick={handleSendExecute}
                          className="w-full bg-[#B87333] disabled:opacity-30 disabled:cursor-not-allowed text-white uppercase text-xs py-3.5 rounded-xl font-black"
                        >
                          {sendProcessing ? "A Sincronizar em Lote..." : "Confirmar e Enviar"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* FLOW ENVIAR: 4. SUCESSO */}
                  {step === "enviar_sucesso" && (
                    <div className="text-center py-6 flex flex-col justify-between flex-1">
                      <div className="space-y-4">
                        <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto">
                          <Check className="w-8 h-8" />
                        </div>
                        <h3 className={`${textTitle} uppercase text-white`}>Enviado com Sucesso</h3>
                        <p className={`${textBody} text-zinc-400`}>
                          Transação de <strong>{parseFloat(sendAmount).toLocaleString("pt-PT")} Kz</strong> realizada offline síncrona. Livro local e banco reconciliados em conformidade.
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          setStep("idle");
                          setSendPhone("");
                          setSendAmount("");
                          setSendPin("");
                        }}
                        className="w-full bg-zinc-900 border border-zinc-800 text-white font-bold uppercase text-xs py-3 rounded-xl tracking-wider mt-6"
                      >
                        Entendi
                      </button>
                    </div>
                  )}

                  {/* FLOW RECEBER: DYNAMIC QR & TOKEN & QR HUMANO PERMANENTE */}
                  {step === "receber" && (
                    <div className="space-y-4 py-2 flex flex-col justify-between flex-1 animate-fade-in">
                      <div>
                        <div className="flex items-center justify-between mb-3 text-xs">
                          <div className="flex items-center gap-1 text-[#B87333] font-bold cursor-pointer" onClick={() => setStep("idle")}>
                            <ChevronLeft className="w-4 h-4" />
                            <span>Voltar</span>
                          </div>
                          
                          {/* Segmented control for receiving tabs */}
                          <div className="bg-zinc-950 border border-zinc-900 p-0.5 rounded-lg flex items-center">
                            <button
                              onClick={() => {
                                setReceiveTab("dinamico");
                                speakText("Modo código digital dinâmico");
                              }}
                              className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${receiveTab === "dinamico" ? "bg-[#B87333] text-white" : "text-zinc-550 hover:text-white"}`}
                            >
                              Dinâmico
                            </button>
                            <button
                              onClick={() => {
                                setReceiveTab("humano_permanente");
                                speakText("Modo cartão permanente impresso qr humano");
                              }}
                              className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${receiveTab === "humano_permanente" ? "bg-[#B87333] text-white" : "text-zinc-550 hover:text-white"}`}
                            >
                              QR Humano
                            </button>
                          </div>
                        </div>

                        <h3 className={`${textTitle} uppercase`}>
                          {receiveTab === "dinamico" ? "Receber por Código" : "Cartão QR Humano"}
                        </h3>
                        <p className={`${textBody} text-zinc-400 mt-1`}>
                          {receiveTab === "dinamico" 
                            ? "Mostre estes dados ao pagador. O código expira periodicamente por segurança."
                            : "Prepara a tua folha A4 e plastifica o teu QR Humano. Pronto para receber pagamentos de qualquer smartphone sem teres telemóvel na feira!"
                          }
                        </p>

                        {/* TAB: DINÂMICO */}
                        {receiveTab === "dinamico" && (
                          <div className="my-2">
                            <QRGenerator
                              currentUser={currentUser}
                              receiveToken={receiveToken}
                              timeLeft={timeLeft}
                              onRenewToken={handleRenewToken}
                              onSimulateReceive={handleSimulateReceive}
                              highContrast={highContrast}
                            />
                          </div>
                        )}

                        {/* TAB: HUMANO PERMANENTE (LAMINADO DE BARRACA) */}
                        {receiveTab === "humano_permanente" && (
                          <div className="my-3 space-y-3">
                            {/* Permanent Display Card layout requested by user */}
                            <div className="p-4 rounded-xl bg-gradient-to-b from-[#15100a] to-zinc-950 border border-[#B87333]/30 flex flex-col items-center text-center animate-fade-in text-white shadow-xl">
                              <span className="text-[8px] bg-[#B87333]/20 border border-[#B87333] text-white px-2 py-0.5 rounded font-black uppercase tracking-wider mb-2">
                                CARTÃO LAMINADO PERMANENTE (QR HUMANO)
                              </span>
                              
                              <h4 className="text-sm font-black tracking-wide font-sans mb-0.5 uppercase text-white">
                                {currentUser.name}
                              </h4>
                              <p className="text-[10px] font-mono text-[#B87333] font-bold uppercase">
                                CARTEIRA ID: {currentUser.shortCode || "KM-4831"}
                              </p>
                              
                              {/* QR Code */}
                              <div className="p-2 bg-white rounded-lg my-2.5 shadow-md">
                                <svg className="w-20 h-20" viewBox="0 0 100 100" fill="black">
                                  <rect x="5" y="5" width="20" height="20" />
                                  <rect x="10" y="10" width="10" height="10" fill="white" />
                                  <rect x="75" y="5" width="20" height="20" />
                                  <rect x="80" y="10" width="10" height="10" fill="white" />
                                  <rect x="5" y="75" width="20" height="20" />
                                  <rect x="10" y="80" width="10" height="10" fill="white" />
                                  {/* permanent center anchor */}
                                  <rect x="35" y="35" width="30" height="30" />
                                  <rect x="42" y="42" width="16" height="16" fill="white" />
                                  <rect x="47" y="47" width="6" height="6" fill="#B87333" />
                                  {/* unique signature lines */}
                                  <rect x="40" y="15" width="10" height="10" />
                                  <rect x="15" y="40" width="10" height="10" />
                                </svg>
                              </div>
                              
                              <div className="text-[10px] text-zinc-300 font-mono tracking-wider font-extrabold uppercase">
                                Identificador: {currentUser.shortCode || "KM-4831"}
                              </div>
                            </div>
                            
                            <button
                              onClick={() => {
                                alert("Enviando solicitação de exportação de imagem de alta definição (A4 / Formato Crachá) do seu QR Humano permanente para download ou impressão local...");
                                speakText("Cartão permanente QR Humano de Manuel exportado.");
                              }}
                              className="w-full bg-[#B87333]/15 border border-[#B87333]/40 text-[#B87333] hover:bg-[#B87333]/30 font-bold uppercase text-[9px] py-2 rounded-lg text-center tracking-wider transition-all"
                            >
                              Exportar/Plastificar Cartão (PDF)
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5 mt-auto">
                        {receiveTab === "dinamico" && (
                          <button
                            onClick={triggerAudioReadout}
                            className={`w-full py-3.5 rounded-xl flex items-center justify-center gap-2 text-xs font-bold ${
                              speakingToken ? "bg-[#B87333] text-white animate-pulse" : "bg-zinc-900 text-zinc-300 border border-zinc-800"
                            }`}
                          >
                            <Volume2 className="w-4 h-4" />
                            <span>Ouvir código por voz</span>
                          </button>
                        )}
                        
                        <button
                          onClick={() => {
                            // Instant simulated inbound
                            const collectKz = 5000;
                            const txId = "TX-IN-" + Math.floor(100000 + Math.random() * 900000);
                            const newTx: Transaction = {
                              id: txId,
                              senderPhone: "+244933999888",
                              receiverPhone: currentUser.phone,
                              amount: collectKz,
                              type: "recebimento",
                              status: "completed",
                              timestamp: new Date().toISOString(),
                              latencyMs: 90,
                              fraudScore: 0,
                              securityLog: ["Assinatura de depósitos de garantia autorizada", "Dispositivo local sincronizado"]
                            };

                            setCurrentUser(prev => ({ ...prev, balance: prev.balance + collectKz }));
                            setLedger(prev => [newTx, ...prev]);

                            const journal = createDoubleEntry(
                              txId,
                              `Recebimento offline de +244 933 999 888`,
                              "Compensações Gerais de Entrada (Ativo)",
                              "Wallet Manuel da Silva (Ativo)",
                              collectKz
                            );
                            onLedgerUpdate([journal], generatePacs008Message(newTx), collectKz);

                            setStep("idle");
                            speakText(`Sucesso. Recebeu ${collectKz} Kwanzas.`);
                          }}
                          className="w-full bg-[#B87333] hover:bg-[#8C5A2B] text-white uppercase text-xs py-3.5 rounded-xl font-black mt-2"
                        >
                          Simular Recebimento (+5.000 Kz)
                        </button>
                      </div>
                    </div>
                  )}

                  {/* FLOW PAGAR: OPÇÕES */}
                  {step === "pagar_opcao" && (
                    <div className="space-y-4 py-2 flex flex-col justify-between flex-1 animate-fade-in">
                      <div>
                        <div className="flex items-center gap-1 text-[#B87333] font-bold text-xs cursor-pointer mb-3" onClick={() => setStep("idle")}>
                          <ChevronLeft className="w-4 h-4" />
                          <span>Voltar</span>
                        </div>
                        <h3 className={`${textTitle} uppercase`}>Pagar Comércio</h3>
                        <p className={`${textBody} text-zinc-400 mt-1`}>Deseja escanear a cartolina QR ou digitar o código do lojista?</p>
                      </div>

                      <div className="space-y-3 my-6">
                        <button
                          onClick={() => {
                            speakText("Câmara ativada para ler o código QR Humano");
                            setStep("pagar_scan");
                          }}
                          className="w-full bg-zinc-950 hover:bg-zinc-900 p-4 border border-zinc-900 rounded-xl flex flex-col items-center gap-1.5 active:scale-95 transition-all"
                        >
                          <QrCode className="w-6 h-6 text-[#B87333]" />
                          <span className="text-xs font-bold">Escanear QR Humano / Cartão (Câmara)</span>
                        </button>
                        
                        <button
                          onClick={() => setStep("pagar_manual")}
                          className="w-full bg-zinc-950 hover:bg-zinc-900 p-4 border border-zinc-900 rounded-xl flex flex-col items-center gap-1.5 active:scale-95 transition-all"
                        >
                          <Smartphone className="w-6 h-6 text-[#B87333]" />
                          <span className="text-xs font-bold">Digitar Código do Lojista Físico</span>
                        </button>

                        <button
                          onClick={() => {
                            setTokenFaladoCode("");
                            setSpokenResolved(null);
                            setPayError("");
                            setStep("pagar_spoken");
                            speakText("Introduza o Código por Voz do comerciante offline");
                          }}
                          className="w-full bg-gradient-to-r from-zinc-950 to-[#23150d] hover:to-[#382013] p-4 border border-[#B87333]/30 rounded-xl flex flex-col items-center gap-1.5 active:scale-95 transition-all text-[#B87333] shadow-md"
                        >
                          <Volume2 className="w-6 h-6 text-[#B87333] animate-pulse" />
                          <span className="text-xs font-black">Pagar com Token Falado (Sem Telemóvel)</span>
                        </button>
                      </div>

                      <div className="p-3 bg-[#050505] border border-zinc-950 rounded-lg text-[10px] text-zinc-500 leading-normal">
                        Comissões regulamentares de lojista travadas em apenas 0.15% à fidalitária nacional angolana.
                      </div>
                    </div>
                  )}

                  {/* FLOW PAGAR: SCANNER */}
                  {step === "pagar_scan" && (
                    <div className="space-y-4 py-2 flex flex-col justify-between flex-1">
                      <div>
                        <div className="flex items-center gap-1 text-[#B87333] font-bold text-xs cursor-pointer mb-3" onClick={() => setStep("pagar_opcao")}>
                          <ChevronLeft className="w-4 h-4" />
                          <span>Voltar</span>
                        </div>
                        <h3 className={`${textTitle} uppercase`}>Câmara Scanner</h3>
                        <p className={`${textBody} text-zinc-400 mt-1`}>Alvo de leitura óptica. Selecione um comerciante para simular:</p>
                        
                        <div className="border border-zinc-800 rounded-2xl h-28 bg-[#050505] flex flex-col items-center justify-center relative overflow-hidden my-3">
                          <div className="absolute top-0 left-0 w-full h-0.5 bg-rose-500 animate-bounce"></div>
                          <QrCode className="w-8 h-8 text-zinc-700 animate-pulse" />
                          <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest mt-1">Obtendo foco de câmara</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-wider block">Lojistas Identificados:</span>
                        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                          {mockMerchants.map(m => (
                            <button
                              key={m.code}
                              onClick={() => {
                                setSelectedMerchant(m);
                                setStep("pagar_confirm");
                                speakText(`Selecionei ${m.name}. Valor ${m.amount} Kwanzas.`);
                              }}
                              className="w-full text-left p-2 rounded-lg bg-zinc-950 border border-zinc-900 flex justify-between items-center text-xs hover:border-zinc-800"
                            >
                              <div>
                                <span className="font-bold text-white block">{m.name}</span>
                                <span className="text-[10px] text-zinc-500">{m.location} • Ref: {m.code}</span>
                              </div>
                              <span className="font-mono text-[#B87333] font-black">{m.amount} Kz</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* FLOW PAGAR: COD MANUAL */}
                  {step === "pagar_manual" && (
                    <div className="space-y-4 py-2 flex flex-col justify-between flex-1">
                      <div>
                        <div className="flex items-center gap-1 text-[#B87333] font-bold text-xs cursor-pointer mb-3" onClick={() => setStep("pagar_opcao")}>
                          <ChevronLeft className="w-4 h-4" />
                          <span>Voltar</span>
                        </div>
                        <h3 className={`${textTitle} uppercase`}>Código do Lojista</h3>
                        <p className={`${textBody} text-zinc-400 mt-1`}>Escreva o código fixado na barraca do lojista (ex: TX-402, MC-882):</p>
                        
                        <div className="mt-3 flex items-center bg-[#050505] p-3 rounded-xl border border-zinc-900 gap-2 text-lg font-mono">
                          <input 
                            type="text"
                            placeholder="TX-402"
                            value={payCode}
                            onChange={(e) => {
                              setPayError("");
                              setPayCode(e.target.value.toUpperCase());
                            }}
                            className="bg-transparent border-0 focus:outline-none text-white font-black w-full text-center uppercase"
                          />
                        </div>
                        {payError && <span className="text-xs text-rose-400 font-bold block mt-1">{payError}</span>}
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase">Lojistas para teste rápido:</span>
                        <div className="grid grid-cols-2 gap-1.5">
                          {mockMerchants.map(m => (
                            <button
                              key={m.code}
                              onClick={() => {
                                setPayCode(m.code);
                                handleVerifyMerchantCode(m.code);
                              }}
                              className="text-left p-1.5 rounded bg-zinc-950 border border-zinc-900 text-[10px]"
                            >
                              <strong className="text-white block font-mono">{m.code}</strong>
                              <span className="text-[9px] text-[#B87333] truncate block">{m.name.split(" ")[0]} ({m.amount} Kz)</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        disabled={!payCode}
                        onClick={() => handleVerifyMerchantCode(payCode)}
                        className="w-full bg-[#B87333] disabled:opacity-30 disabled:cursor-not-allowed text-white uppercase text-xs py-3 rounded-xl font-black mt-4"
                      >
                        Carregar Lojista
                      </button>
                    </div>
                  )}

                  {/* FLOW PAGAR: CONFIRMAR */}
                  {step === "pagar_confirm" && selectedMerchant && (
                    <div className="space-y-4 py-2 flex flex-col justify-between flex-1">
                      <div>
                        <div className="flex items-center gap-1 text-[#B87333] font-bold text-xs cursor-pointer mb-3" onClick={() => setStep("pagar_opcao")}>
                          <ChevronLeft className="w-4 h-4" />
                          <span>Voltar</span>
                        </div>
                        <h3 className={`${textTitle} uppercase`}>Confirmar Pagamento</h3>
                        
                        <div className="bg-[#050505] p-3 rounded-lg border border-zinc-900 text-xs text-zinc-400 font-mono space-y-1.5">
                          <div className="flex justify-between"><span>Comércio:</span> <strong className="text-white">{selectedMerchant.name}</strong></div>
                          <div className="flex justify-between"><span>Província:</span> <strong className="text-zinc-300">{selectedMerchant.location}</strong></div>
                          <div className="flex justify-between"><span>Montante total:</span> <strong className="text-[#B87333] font-black">{selectedMerchant.amount.toLocaleString("pt-PT")} Kz</strong></div>
                        </div>

                        <div className="mt-4 flex flex-col items-center gap-2">
                          <input 
                            type="password"
                            maxLength={4}
                            placeholder="••••"
                            value={payPin}
                            onChange={(e) => {
                              setPayPin(e.target.value.replace(/\D/g, ""));
                              if (e.target.value.length === 4) setPayError("");
                            }}
                            className="w-32 text-center text-2xl font-mono bg-transparent border-b-2 border-[#B87333] py-1 text-white tracking-widest focus:outline-none"
                          />
                          <span className="text-[10px] text-zinc-500 font-bold uppercase mt-1">PIN sugerido: 1234</span>
                          {payError && <span className="text-xs text-rose-500 font-bold">{payError}</span>}
                        </div>
                      </div>

                      <div className="space-y-2 mt-auto">
                        <button
                          disabled={payPin.length < 4 || payProcessing}
                          onClick={handlePayExecute}
                          className="w-full bg-[#B87333] disabled:opacity-30 disabled:cursor-not-allowed text-white uppercase text-xs py-3.5 rounded-xl font-black"
                        >
                          {payProcessing ? "A Sincronizar em Lote..." : "Autorizar Pagamento"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* FLOW PAGAR: SUCESSO */}
                  {step === "pagar_sucesso" && (
                    <div className="text-center py-6 flex flex-col justify-between flex-1 animate-fade-in">
                      <div className="space-y-4">
                        <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto">
                          <Check className="w-8 h-8" />
                        </div>
                        <h3 className={`${textTitle} uppercase text-white`}>Lojista Liquidado</h3>
                        <p className={`${textBody} text-zinc-400`}>
                          Pagamento comercial efetuado. A taxa regulamentar de 0.15% foi distribuída síncronase ao banco do comércio.
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          setStep("idle");
                          setPayCode("");
                          setPayPin("");
                        }}
                        className="w-full bg-zinc-900 border border-zinc-800 text-white font-bold uppercase text-xs py-3 rounded-xl tracking-wider mt-6"
                      >
                        Entendi
                      </button>
                    </div>
                  )}

                  {/* FLOW PAGAR: TOKEN FALADO INPUT */}
                  {step === "pagar_spoken" && (
                    <div className="space-y-4 py-2 flex flex-col justify-between flex-1 animate-fade-in">
                      <div>
                        <div className="flex items-center gap-1 text-[#B87333] font-bold text-xs cursor-pointer mb-3" onClick={() => setStep("pagar_opcao")}>
                          <ChevronLeft className="w-4 h-4" />
                          <span>Voltar</span>
                        </div>
                        <h3 className={`${textTitle} uppercase`}>Token Falado</h3>
                        <p className={`${textBody} text-zinc-400 mt-1`}>
                          Escreve os 4 números ditos pelo vendedor que não possui ecrã ou telemóvel moderno:
                        </p>
                        
                        <div className="mt-4 flex items-center bg-[#050505] p-3.5 rounded-xl border border-zinc-900 gap-2 text-2xl font-mono justify-center">
                          <input 
                            type="text"
                            placeholder="5842"
                            maxLength={4}
                            value={tokenFaladoCode}
                            onChange={(e) => {
                              setPayError("");
                              setTokenFaladoCode(e.target.value.replace(/\D/g, ""));
                            }}
                            className="bg-transparent border-0 focus:outline-none text-white font-black text-center tracking-widest w-36 uppercase"
                          />
                        </div>
                        {payError && <span className="text-xs text-rose-400 font-bold block text-center mt-2">{payError}</span>}
                      </div>

                      <div className="space-y-1.5 leading-tight">
                        <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Sugestões de teste rápido (Séniores):</span>
                        <div className="grid grid-cols-2 gap-1.5">
                          {mockSpokenTokens.map(tok => (
                            <button
                              key={tok.code}
                              onClick={() => {
                                setTokenFaladoCode(tok.code);
                                handleVerifySpokenToken(tok.code);
                              }}
                              className="text-left p-1.5 rounded bg-zinc-950 border border-zinc-900 text-[10px] hover:border-zinc-800 transition-all"
                            >
                              <strong className="text-white block font-mono">Código: {tok.code}</strong>
                              <span className="text-[9px] text-[#B87333] truncate block">{tok.name.split(" ")[0]} ({tok.age}a)</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        disabled={tokenFaladoCode.length < 4}
                        onClick={() => handleVerifySpokenToken(tokenFaladoCode)}
                        className="w-full bg-[#B87333] disabled:opacity-30 disabled:cursor-not-allowed text-white uppercase text-xs py-3.5 rounded-xl font-black mt-2"
                      >
                        Identificar Vendedor
                      </button>
                    </div>
                  )}

                  {/* FLOW PAGAR: CONFIRMAR TOKEN FALADO (WITH CUSTOMIZABLE AMOUNT & PIN) */}
                  {step === "pagar_confirm_spoken" && spokenResolved && (
                    <div className="space-y-4 py-2 flex flex-col justify-between flex-1 animate-fade-in">
                      <div>
                        <div className="flex items-center gap-1 text-[#B87333] font-bold text-xs cursor-pointer mb-2" onClick={() => setStep("pagar_spoken")}>
                          <ChevronLeft className="w-4 h-4" />
                          <span>Voltar</span>
                        </div>
                        <h3 className={`${textTitle} uppercase`}>Confirmar Inclusão</h3>
                        <p className={`${textBody} text-zinc-400 mb-2 leading-snug`}>
                          Vendedor identificado sem ecrã. Introduce o montante e o teu PIN:
                        </p>

                        <div className="bg-gradient-to-r from-zinc-950 to-neutral-950 p-3 rounded-lg border border-zinc-900 text-[11px] text-zinc-400 font-mono space-y-1">
                          <div className="flex justify-between">
                            <span>Vendedor Sénior:</span>
                            <strong className="text-white uppercase">{spokenResolved.name}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Idade:</span>
                            <span className="text-zinc-300">{spokenResolved.age} anos (Série Inclusão)</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Localização:</span>
                            <span className="text-zinc-300">{spokenResolved.location}</span>
                          </div>
                        </div>

                        {/* Interactive Dynamic Amount Setup */}
                        <div className="mt-3 bg-[#0a0807] p-2.5 rounded-xl border border-[#B87333]/20 text-center">
                          <span className="text-[8.5px] uppercase font-bold text-[#B87333] block mb-1">Montante a Pagar (Customizável)</span>
                          <div className="flex items-center justify-center gap-1.5">
                            <input
                              type="text"
                              value={customSpokenAmount}
                              onChange={(e) => {
                                setPayError("");
                                setCustomSpokenAmount(e.target.value.replace(/\D/g, ""));
                              }}
                              className="bg-transparent border-0 font-mono text-center text-xl font-black text-white w-32 focus:outline-none focus:ring-0"
                            />
                            <span className="text-xs font-bold text-[#B87333]">Kz</span>
                          </div>
                        </div>

                        {/* Secure Authorization PIN */}
                        <div className="mt-2.5 flex flex-col items-center gap-1.5 text-center">
                          <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold block">Teu PIN de Segurança</span>
                          <input 
                            type="password"
                            maxLength={4}
                            placeholder="••••"
                            value={payPin}
                            onChange={(e) => {
                              setPayPin(e.target.value.replace(/\D/g, ""));
                              if (e.target.value.length === 4) setPayError("");
                            }}
                            className="w-24 text-center text-xl font-mono bg-transparent border-b-2 border-[#B87333] py-0.5 text-white tracking-widest focus:outline-none"
                          />
                          <span className="text-[8.5px] text-neutral-600 font-bold">PIN Sugerido: 1234</span>
                          {payError && <span className="text-xs text-rose-500 font-black mt-1">{payError}</span>}
                        </div>
                      </div>

                      <div className="space-y-1.5 mt-auto">
                        <button
                          disabled={payPin.length < 4 || !customSpokenAmount || payProcessing}
                          onClick={handlePaySpokenExecute}
                          className="w-full bg-[#B87333] disabled:opacity-30 disabled:cursor-not-allowed text-white uppercase text-xs py-3.5 rounded-xl font-black shadow-md"
                        >
                          {payProcessing ? "Assinando offline via KwanzaHub..." : "Confirmar e Pagar Offline"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* FLOW PAGAR: SUCCESS TOKEN FALADO */}
                  {step === "pagar_sucesso_spoken" && spokenResolved && (
                    <div className="text-center py-5 flex flex-col justify-between flex-1 animate-fade-in">
                      <div className="space-y-4">
                        <div className="w-14 h-14 rounded-full bg-orange-500/15 border border-orange-500/40 flex items-center justify-center text-orange-400 mx-auto">
                          <Volume2 className="w-8 h-8 animate-pulse" />
                        </div>
                        <h3 className={`${textTitle} uppercase text-[#B87333]`}>Pago com Sucesso!</h3>
                        
                        <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl text-left space-y-1.5">
                          <div className="text-[10px] text-emerald-400 uppercase font-black tracking-widest flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Notificação por SMS e Chamada de Voz Disparada
                          </div>
                          <p className="text-[11px] text-zinc-350 leading-relaxed font-sans mb-1">
                            O KwanzaMóvel enviou SMS para o telemóvel simples da <strong className="text-white">{spokenResolved.name}</strong> ({spokenResolved.age} anos) no Huambo.
                          </p>
                          <div className="border-t border-zinc-900 pt-1.5 mt-1">
                            <span className="text-[8px] text-zinc-500 uppercase font-bold block">Texto dita-voz simulado na feira:</span>
                            <p className="text-[11px] font-bold text-orange-400 italic font-serif">
                              "Recebeu {parseFloat(customSpokenAmount).toLocaleString("pt-PT")} Kwanzas de Manuel da Silva!"
                            </p>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setStep("idle");
                          setTokenFaladoCode("");
                          setPayPin("");
                          setSpokenResolved(null);
                        }}
                        className="w-full bg-[#B87333] text-white font-extrabold uppercase text-xs py-3.5 rounded-xl mt-4 border border-[#B87333]/30"
                      >
                        Concluído
                      </button>
                    </div>
                  )}

                  {/* HISTÓRICO DE CADERNO */}
                  {step === "historico" && (
                    <div className="flex-grow flex flex-col justify-between animate-fade-in h-full">
                      <div>
                        <div className="flex items-center justify-between border-b border-zinc-900 pb-2 mb-3">
                          <button onClick={() => setStep("idle")} className="text-xs text-[#B87333] font-bold">← Painel</button>
                          <span className="text-[10px] font-black text-white uppercase font-mono">Movimentos</span>
                        </div>

                        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                          {ledger.length === 0 ? (
                            <div className="text-zinc-500 text-center py-8 text-xs">Sem movimentos registados neste livro.</div>
                          ) : (
                            ledger.map((tx) => {
                              const isIncoming = tx.type === "recebimento";
                              return (
                                <button 
                                  key={tx.id}
                                  onClick={() => setSelectedTxForReceipt(tx)}
                                  className="w-full bg-zinc-950 hover:bg-zinc-900/80 border border-zinc-900 hover:border-zinc-800 p-2.5 rounded-xl flex items-center justify-between text-left transition-all cursor-pointer group"
                                >
                                  <div className="flex items-center gap-1.5">
                                    <div className={`p-1 text-xs rounded-md font-bold ${isIncoming ? "bg-emerald-500/10 text-emerald-400" : "bg-neutral-900 text-orange-400"}`}>
                                      {isIncoming ? "IN" : "OUT"}
                                    </div>
                                    <div>
                                      <span className="font-bold text-white leading-none text-xs block group-hover:text-[#B87333] transition-colors">
                                        {isIncoming ? "Crédito Recebido" : tx.type === "pagamento" ? "Compra Comercial" : "Débito Enviado"}
                                      </span>
                                      <span className="text-[9px] text-zinc-500 font-mono tracking-wider">{tx.id} • {new Date(tx.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <span className={`font-mono text-xs font-black ${isIncoming ? "text-emerald-400" : "text-white"}`}>
                                      {isIncoming ? "" : "-"}{tx.amount.toLocaleString("pt-PT")} Kz
                                    </span>
                                    <span className="text-[8px] text-[#B87333] block font-bold group-hover:underline">VER COMPROVATIVO ➔</span>
                                  </div>
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => setStep("idle")}
                        className="w-full bg-zinc-900 text-zinc-300 font-extrabold text-xs py-3.5 rounded-xl mt-4 border border-zinc-800"
                      >
                        Fechar histórico
                      </button>
                    </div>
                  )}

                </div>
              ) : (
                
                // NO FLOW RUNNING: RENDER PRIMARY ACTIVE TAB OVERVIEW
                <div className="flex-1 flex flex-col justify-between h-full animate-fade-in">
                  
                  {/* TAB 1: OPERATIONAL INÍCIO DASHBOARD (APPLE WALLET / PIX) */}
                  {activeTab === "inicio" && (
                    <div className="flex-1 flex flex-col justify-between space-y-4">
                      
                      {/* Apple Wallet visual clean Header */}
                      <div className="flex items-center justify-between pt-1 pb-1 text-left border-b border-zinc-950">
                        <div className="flex items-center gap-1.5">
                          {/* Aesthetic clean arame signature line */}
                          <div className="h-4 w-1 bg-[#B87333]"></div>
                          <span className="text-sm font-black tracking-widest text-white uppercase font-sans">
                            KwanzaMóvel
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          {/* Discreet historic card clock icon */}
                          <button
                            onClick={() => setStep("historico")}
                            title="Ver Caderno de Histórico"
                            className="p-1 hover:bg-zinc-900 rounded text-zinc-550 hover:text-white transition-colors"
                          >
                            <Clock className="w-4 h-4 cursor-pointer" />
                          </button>
                          <span className="text-[9px] uppercase font-bold tracking-wider text-[#B87333] bg-[#B87333]/15 px-2 py-0.5 rounded-full border border-[#B87333]/30 animate-pulse">
                            KwanzaMóvel FIRST v2
                          </span>
                        </div>
                      </div>

                      {/* ULTRA MINIMAL BALANCE CARD BLOCK (NO TEXTURES, NO NOISE) */}
                      <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 text-center relative transition-all duration-300 shadow">
                        <span className="text-[9px] uppercase tracking-widest text-[#B87333] font-bold block mb-1">
                          Saldo Disponível
                        </span>
                        
                        <div className="flex items-center justify-center gap-1.5">
                          {balanceRevealed ? (
                            <span className="text-[27px] font-mono font-black text-white">
                              {currentUser.balance.toLocaleString("pt-PT")} <span className="text-xs font-sans text-[#B87333] font-normal">Kz</span>
                            </span>
                          ) : (
                            <span className="text-2xl tracking-widest text-zinc-650 font-mono">
                              •••••• <span className="text-xs font-sans text-zinc-550">Kz</span>
                            </span>
                          )}

                          <button 
                            onClick={() => {
                              if (balanceRevealed) {
                                setBalanceRevealed(false);
                              } else {
                                setShowBiometricModal(true);
                              }
                            }}
                            className="text-[#B87333] p-1 hover:text-white transition-colors"
                            title="Desvelar com Biometria"
                          >
                            {balanceRevealed ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                          </button>
                        </div>

                        <span className="text-[8.5px] font-bold text-zinc-500 uppercase mt-1.5 block tracking-wider">
                          {balanceRevealed ? "Balancete exibido de forma segura" : "Tocar para validação biométrica de segurança"}
                        </span>
                      </div>

                      {/* CARDS HORIZONTAIS GRANDES (ENVIAR | RECEBER | PAGAR) */}
                      {/* Altura mínima: 72px, Distância: 16px, Bordas: 20px / rounded-2xl */}
                      <div className="flex-1 flex flex-col justify-center gap-4 py-2 select-none">
                        
                        {/* CARD ENVIAR */}
                        <button
                          onClick={() => {
                            setSendPhone("");
                            setSendAmount("");
                            setSendPin("");
                            setStep("enviar_1");
                          }}
                          style={{ minHeight: "72px" }}
                          className="w-full bg-zinc-950 hover:bg-zinc-900 text-white rounded-2xl border border-zinc-900 flex items-center justify-between px-6 transition-all active:scale-[0.98]"
                        >
                          <span className="flex items-center gap-3">
                            <Send className="w-5 h-5 text-[#B87333]" />
                            <span className="text-xs uppercase font-extrabold tracking-wider">Enviar Dinheiro</span>
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">Imediato</span>
                        </button>

                        {/* CARD RECEBER */}
                        <button
                          onClick={() => {
                            const initialCode = Math.floor(1000 + Math.random() * 9000).toString();
                            setReceiveToken(initialCode);
                            setTimeLeft(60);
                            setReceiveTab("dinamico");
                            setStep("receber");
                          }}
                          style={{ minHeight: "72px" }}
                          className="w-full bg-zinc-950 hover:bg-zinc-900 text-white rounded-2xl border border-zinc-900 flex items-center justify-between px-6 transition-all active:scale-[0.98]"
                        >
                          <span className="flex items-center gap-3">
                            <QrCode className="w-5 h-5 text-[#B87333]" />
                            <span className="text-xs uppercase font-extrabold tracking-wider">Receber Dinheiro</span>
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">Offline</span>
                        </button>

                        {/* CARD PAGAR */}
                        <button
                          onClick={() => setStep("pagar_opcao")}
                          style={{ minHeight: "72px" }}
                          className="w-full bg-zinc-950 hover:bg-zinc-900 text-white rounded-2xl border border-zinc-900 flex items-center justify-between px-6 transition-all active:scale-[0.98]"
                        >
                          <span className="flex items-center gap-3">
                            <PhoneCall className="w-5 h-5 text-[#B87333]" />
                            <span className="text-xs uppercase font-extrabold tracking-wider">Pagar Comerciante</span>
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">Taxa 0.15%</span>
                        </button>

                      </div>

                    </div>
                  )}

                  {/* TAB 2: AGENTES (MODULO DE AGENTES FISICOS) */}
                  {activeTab === "agentes" && (
                    <div className="flex-1 flex flex-col justify-between space-y-3 animate-fade-in">
                      
                      {/* Sub-navigation inside Agents */}
                      <div className="border-b border-zinc-950 pb-2">
                        <div className="flex items-center justify-between">
                          <h3 className={`${textTitle} uppercase text-white flex items-center gap-1.5`}>
                            <Building className="w-4 h-4 text-[#B87333]" />
                            <span>Rede de Agentes</span>
                          </h3>
                          <span className="text-[9px] uppercase tracking-wider text-green-400 bg-green-400/5 px-2 py-0.5 rounded border border-green-400/20 font-bold">
                            Agente #042 Ativo
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
                          Angola depende fortemente de agências físicas. Use este simulador para depositar verbas, levantar dinheiro vivo ou validar identidade.
                        </p>
                      </div>

                      {/* AGENT VIEW RENDERER */}
                      <div className="flex-1 overflow-y-auto max-h-80 py-1 font-sans">
                        
                        {agentStep === "menu" && (
                          <div className="space-y-3">
                            
                            {/* CASH IN */}
                            <button
                              onClick={() => setAgentStep("deposit")}
                              className="w-full bg-zinc-950 hover:bg-zinc-900 text-left p-3.5 rounded-xl border border-zinc-900 flex items-center justify-between transition-colors cursor-pointer"
                            >
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#B87333]/10 text-[#B87333] rounded-lg">
                                  <Coins className="w-4.5 h-4.5" />
                                </div>
                                <div>
                                  <strong className="text-xs text-white block uppercase">Depositar Dinheiro (Cash-In)</strong>
                                  <span className="text-[10px] text-zinc-500 block">Entregue papel físico ao Agente para creditar digitalmente</span>
                                </div>
                              </div>
                              <ChevronRight className="w-4.5 h-4.5 text-zinc-500" />
                            </button>

                            {/* CASH OUT */}
                            <button
                              onClick={() => setAgentStep("withdraw")}
                              className="w-full bg-zinc-950 hover:bg-zinc-900 text-left p-3.5 rounded-xl border border-zinc-900 flex items-center justify-between transition-colors cursor-pointer"
                            >
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#B87333]/10 text-[#B87333] rounded-lg">
                                  <MapPin className="w-4.5 h-4.5" />
                                </div>
                                <div>
                                  <strong className="text-xs text-white block uppercase">Levantar Dinheiro (Cash-Out)</strong>
                                  <span className="text-[10px] text-zinc-500 block">Gere débito para receber moedas físicas com o Agente</span>
                                </div>
                              </div>
                              <ChevronRight className="w-4.5 h-4.5 text-zinc-500" />
                            </button>

                            {/* REGISTER BI */}
                            <button
                              onClick={() => {
                                setIdentityStatus("idle");
                                setAgentBI(currentUser.biNumber);
                                setAgentStep("identity");
                              }}
                              className="w-full bg-zinc-950 hover:bg-zinc-900 text-left p-3.5 rounded-xl border border-zinc-900 flex items-center justify-between transition-colors cursor-pointer"
                            >
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#B87333]/10 text-[#B87333] rounded-lg">
                                  <Fingerprint className="w-4.5 h-4.5" />
                                </div>
                                <div>
                                  <strong className="text-xs text-white block uppercase">Validar B.I. Angolano</strong>
                                  <span className="text-[10px] text-zinc-500 block">Sintonize com o Registo Civil BNA para ilimitar limites diários</span>
                                </div>
                              </div>
                              <ChevronRight className="w-4.5 h-4.5 text-zinc-500" />
                            </button>
                          </div>
                        )}

                        {/* SUB AGENT FLOWS: DEPOSIT */}
                        {agentStep === "deposit" && (
                          <div className="space-y-3">
                            <span className="text-[10px] text-[#B87333] uppercase font-black">Cash-In Simulador</span>
                            <h4 className="text-white text-xs font-bold leading-relaxed">Deposite notas físicas entregando-as ao operador do Agente:</h4>
                            
                            <div className="grid grid-cols-2 gap-1.5 pt-1">
                              {["1000", "2000", "5000", "10000", "20000"].map(v => (
                                <button
                                  key={v}
                                  onClick={() => setAgentDepositAmount(v)}
                                  className={`p-2 font-mono text-center text-xs font-bold rounded-lg border transition-all ${
                                    agentDepositAmount === v 
                                      ? "bg-[#B87333] text-white border-[#B87333] font-black" 
                                      : "bg-zinc-950 text-zinc-400 border-zinc-900"
                                  }`}
                                >
                                  {parseInt(v).toLocaleString("pt-PT")} Kz
                                </button>
                              ))}
                            </div>

                            <button
                              onClick={handleAgentDeposit}
                              className="w-full bg-[#B87333] text-white font-extrabold uppercase text-xs py-3 rounded-xl tracking-wider mt-4"
                            >
                              Efetuar depósito físico de {parseInt(agentDepositAmount).toLocaleString("pt-PT")} Kz
                            </button>
                            
                            <button
                              onClick={() => setAgentStep("menu")}
                              className="w-full text-center text-zinc-400 hover:text-white underline text-[11px] block py-1 font-bold"
                            >
                              Cancelar
                            </button>
                          </div>
                        )}

                        {/* SUB AGENT FLOWS: WITHDRAW */}
                        {agentStep === "withdraw" && (
                          <div className="space-y-3">
                            <span className="text-[10px] text-[#B87333] uppercase font-black">Cash-Out Simulador</span>
                            <h4 className="text-white text-xs font-bold leading-relaxed">Retire notas em papel no terminal do Agente:</h4>
                            
                            <div className="grid grid-cols-2 gap-1.5 pt-1">
                              {["1000", "2000", "5000", "10000"].map(v => (
                                <button
                                  key={v}
                                  onClick={() => setAgentWithdrawAmount(v)}
                                  className={`p-2 font-mono text-center text-xs font-bold rounded-lg border transition-all ${
                                    agentWithdrawAmount === v 
                                      ? "bg-[#B87333] text-white border-[#B87333] font-black" 
                                      : "bg-zinc-950 text-zinc-400 border-zinc-900"
                                  }`}
                                >
                                  {parseInt(v).toLocaleString("pt-PT")} Kz
                                </button>
                              ))}
                            </div>

                            <div className="text-[10.5px] text-zinc-500 leading-normal">
                              Será debitado na sua carteira digital ativa e o agente lhe dará o valor correspondente sob tutela BNA.
                            </div>

                            <button
                              onClick={handleAgentWithdraw}
                              disabled={parseFloat(agentWithdrawAmount) > currentUser.balance}
                              className="w-full bg-[#B87333] disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold uppercase text-xs py-3 rounded-xl tracking-wider mt-4"
                            >
                              Confirmar Levantamento de {parseInt(agentWithdrawAmount).toLocaleString("pt-PT")} Kz
                            </button>
                            
                            <button
                              onClick={() => setAgentStep("menu")}
                              className="w-full text-center text-zinc-400 hover:text-white underline text-[11px] block py-1 font-bold"
                            >
                              Cancelar
                            </button>
                          </div>
                        )}

                        {/* SUB AGENT FLOWS: CIVIL BI AUTHENTICATION */}
                        {agentStep === "identity" && (
                          <div className="space-y-3.5">
                            <span className="text-[10px] text-[#B87333] uppercase font-black">Homologação de Registo Civil</span>
                            <h4 className="text-white text-xs font-bold leading-relaxed">Introduzir o número do B.I. Angolano (Bilhete de Identidade):</h4>
                            
                            <input 
                              type="text"
                              maxLength={14}
                              placeholder="00593845LA042"
                              value={agentBI}
                              onChange={(e) => setAgentBI(e.target.value)}
                              className="w-full bg-[#050505] border border-zinc-900 text-white font-mono p-3 rounded-xl uppercase text-sm tracking-wide focus:border-[#B87333] focus:outline-none"
                            />

                            {identityStatus === "verifying" && (
                              <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-lg text-[11px] text-[#B87333] animate-pulse flex items-center gap-1.5">
                                <Clock className="w-4 h-4 animate-spin" />
                                <span>A verificar integridade com bases descentralizadas BNA...</span>
                              </div>
                            )}

                            {identityStatus === "verified" && verifiedUserData && (
                              <div className="p-3.5 bg-emerald-900/10 border border-emerald-500/20 text-emerald-400 rounded-xl leading-relaxed text-xs space-y-1">
                                <div className="flex justify-between"><span>Cidadão Validado:</span> <strong className="text-white">{verifiedUserData.name}</strong></div>
                                <div className="flex justify-between"><span>Nº B.I.:</span> <strong className="text-white font-mono">{verifiedUserData.bi}</strong></div>
                                <div className="flex justify-between"><span>Patamar KwanzaMóvel:</span> <strong className="text-yellow-400 font-bold uppercase">{verifiedUserData.tier} (Completo)</strong></div>
                                <span className="block text-[9.5px] text-zinc-500 font-bold uppercase pt-1 border-t border-zinc-900/40 mt-1">✓ Sincronizado ao Registo Nacional de Angola</span>
                              </div>
                            )}

                            {identityStatus === "error" && (
                              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-xs font-bold">
                                Erro nos detalhes do B.I. Por favor, valide o número de 13/14 caracteres.
                              </div>
                            )}

                            <button
                              onClick={handleAgentBIValidation}
                              disabled={identityStatus === "verifying"}
                              className="w-full bg-[#B87333] hover:bg-[#8C5A2B] text-white font-extrabold uppercase text-xs py-3 rounded-xl tracking-wider mt-4"
                            >
                              Validar Bilhete de Identidade Civil
                            </button>
                            
                            <button
                              onClick={() => {
                                setAgentStep("menu");
                                setIdentityStatus("idle");
                              }}
                              className="w-full text-center text-zinc-400 hover:text-white underline text-[11px] block py-1 font-bold"
                            >
                              Voltar
                            </button>
                          </div>
                        )}

                        {/* SUB AGENT FLOWS: SUCCESS SCREEN */}
                        {agentStep === "success" && (
                          <div className="text-center py-4 space-y-4">
                            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                              <Check className="w-6 h-6 animate-pulse" />
                            </div>
                            <h4 className="text-white uppercase font-black text-xs tracking-wider">Sucesso Governativo</h4>
                            <p className="text-[11px] text-zinc-400 leading-relaxed px-1">
                              {agentSuccessMsg}
                            </p>
                            
                            <button
                              onClick={() => setAgentStep("menu")}
                              className="w-full bg-zinc-900 text-zinc-300 font-bold text-xs py-3 rounded-xl border border-zinc-800"
                            >
                              Voltar ao Menu de Agentes
                            </button>
                          </div>
                        )}

                      </div>
                    </div>
                  )}

                  {/* TAB 3: AJUDA (MINIMALIST COMPLIANCE & SAFETY GUIDES) */}
                  {activeTab === "ajuda" && (
                    <div className="flex-1 flex flex-col justify-between space-y-3 animate-fade-in">
                      
                      <div className="border-b border-zinc-950 pb-2">
                        <h3 className={`${textTitle} uppercase text-white flex items-center gap-1.5`}>
                          <HelpCircle className="w-4.5 h-4.5 text-[#B87333]" />
                          <span>Informações úteis</span>
                        </h3>
                        <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
                          A rede síncrona KwanzaMóvel rege-se sob as diretivas oficiais de pagamentos sem internet em Angola.
                        </p>
                      </div>

                      <div className="flex-1 overflow-y-auto max-h-76 space-y-3 text-left">
                        
                        <div className="space-y-1 bg-zinc-950 p-3 rounded-xl border border-zinc-900">
                          <strong className="text-xs text-white block uppercase">1. Como funciona sem ligação à Internet?</strong>
                          <span className="text-[11px] text-zinc-400 block leading-relaxed">
                            O KwanzaMóvel opera um livro de partidas dobradas local encriptado no armazenamento do telemóvel (IndexedDB). As assinaturas e tokens são validados e reconciliados em lotes síncronos com o banco central.
                          </span>
                        </div>

                        <div className="space-y-1 bg-zinc-950 p-3 rounded-xl border border-zinc-900">
                          <strong className="text-xs text-white block uppercase">2. O KwanzaMóvel custodia dinheiro do público?</strong>
                          <span className="text-[11px] text-zinc-400 block leading-relaxed font-semibold text-[#B87333]">
                            Não. "KwanzaMóvel não retém dinheiro." 100% de todo saldo digital emitido possui contrapartida fiduciária depositada nos bancos licenciados (BFA, BAI, BIC, BNA). O KwanzaMóvel atua apenas como gateway de instruções financeiras.
                          </span>
                        </div>

                        <div className="space-y-1 bg-zinc-950 p-3 rounded-xl border border-zinc-900">
                          <strong className="text-xs text-white block uppercase">3. Existem micro-taxas?</strong>
                          <span className="text-[11px] text-zinc-400 block leading-relaxed">
                            Apenas de 0,15% no lojista comercial. A transferência direta entre carteiras de cidadãos é totalmente livre de custos regulamentares.
                          </span>
                        </div>

                      </div>

                      <div className="text-[9.5px] text-zinc-500 font-extrabold text-center uppercase">
                        SAGA COMPLIANT • DIRETIVA 06/2021 BNA
                      </div>
                    </div>
                  )}

                  {/* TAB 4: PERFIL & RELOAD ONBOARDING */}
                  {activeTab === "perfil" && (
                    <div className="flex-1 flex flex-col justify-between space-y-3 animate-fade-in">
                      
                      <div className="border-b border-zinc-950 pb-2">
                        <h3 className={`${textTitle} uppercase text-white flex items-center gap-1.5`}>
                          <User className="w-4.5 h-4.5 text-[#B87333]" />
                          <span>O seu Perfil</span>
                        </h3>
                        <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
                          Os seus dados estão vinculados ao Bilhete de Identidade com selo offline.
                        </p>
                      </div>

                      {/* Visually tactile clean detail block */}
                      <div className="bg-[#050505] border border-zinc-900 p-4 rounded-2xl space-y-2.5 text-xs text-left">
                        <div className="flex justify-between items-center bg-zinc-950/60 p-2 rounded border border-zinc-900/30">
                          <span className="text-zinc-500 uppercase tracking-wider text-[10px] font-bold">Cidadão Titular:</span>
                          <strong className="text-white font-bold">{currentUser.name}</strong>
                        </div>

                        <div className="flex justify-between items-center bg-zinc-950/60 p-2 rounded border border-zinc-900/30">
                          <span className="text-zinc-500 uppercase tracking-wider text-[10px] font-bold">Código Curto Carteira:</span>
                          <strong className="text-amber-500 font-mono text-[11px]">{currentUser.shortCode || "KM-4831"}</strong>
                        </div>
                        
                        <div className="flex justify-between items-center bg-zinc-950/60 p-2 rounded border border-zinc-900/30">
                          <span className="text-zinc-500 uppercase tracking-wider text-[10px] font-bold">Nº Telemóvel:</span>
                          <strong className="text-white font-mono">{currentUser.phone}</strong>
                        </div>

                        <div className="flex justify-between items-center bg-zinc-950/60 p-2 rounded border border-zinc-900/30">
                          <span className="text-zinc-500 uppercase tracking-wider text-[10px] font-bold">Bilhete de Identidade:</span>
                          <strong className="text-white font-mono">{currentUser.biNumber || "Não homolgado"}</strong>
                        </div>

                        <div className="flex justify-between items-center bg-zinc-950/60 p-2 rounded border border-zinc-900/30">
                          <span className="text-zinc-500 uppercase tracking-wider text-[10px] font-bold">Nível de Garantia:</span>
                          <strong className="text-yellow-400 uppercase font-black font-sans">{currentUser.tier}</strong>
                        </div>

                        <div className="flex justify-between items-center bg-zinc-950/60 p-2 rounded border border-zinc-900/30">
                          <span className="text-zinc-500 uppercase tracking-wider text-[10px] font-bold">ID Dispositivo:</span>
                          <strong className="text-zinc-350 font-mono text-[10px]">{currentUser.deviceId}</strong>
                        </div>
                      </div>

                      {/* RECOVERY SETTINGS INTEGRATION */}
                      <div className="bg-[#0c0806] border border-[#B87333]/25 p-3 rounded-2xl space-y-3 text-left">
                        <div className="flex items-center gap-1.5 border-b border-neutral-900 pb-1.5">
                          <KeyRound className="w-4 h-4 text-[#B87333]" />
                          <div>
                            <span className="text-[10px] text-white uppercase font-black tracking-wider block">Recuperação de Conta</span>
                            <span className="text-[8px] text-zinc-500 uppercase font-mono">Planear Migração para Neon (PostgreSQL)</span>
                          </div>
                        </div>

                        {/* Recovery Email Input */}
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-bold text-zinc-400 block">Email de Recuperação (Neon):</label>
                          <input 
                            type="email"
                            value={currentUser.recoveryConfig?.emailRecovery || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCurrentUser(prev => ({
                                ...prev,
                                recoveryConfig: {
                                  ...(prev.recoveryConfig || {
                                    backupCodesCreated: false,
                                    backupCodesCount: 0,
                                    biometricActive: false,
                                    trustedAgentOverride: false
                                  }),
                                  emailRecovery: val
                                }
                              }));
                            }}
                            placeholder="ex: cidadao@net.ao"
                            className="w-full bg-zinc-950 border border-zinc-900 rounded-lg p-2 text-[10.5px] text-white font-mono placeholder:text-zinc-700 outline-none focus:border-[#B87333]/60 transition-colors"
                          />
                        </div>

                        {/* Backup Codes */}
                        <div className="flex justify-between items-center bg-zinc-950/60 p-2 rounded border border-zinc-900/30 text-[10.5px]">
                          <div className="space-y-0.5">
                            <span className="text-zinc-500 uppercase font-black text-[8.5px] block">Códigos de Backup (mTLS):</span>
                            <span className="text-zinc-400 text-[10px]">
                              {currentUser.recoveryConfig?.backupCodesCreated 
                                ? `Ativos (${currentUser.recoveryConfig?.backupCodesCount} códigos)` 
                                : "Não configurado"}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setCurrentUser(prev => ({
                                ...prev,
                                recoveryConfig: {
                                  ...(prev.recoveryConfig || {
                                    emailRecovery: "",
                                    biometricActive: false,
                                    trustedAgentOverride: false
                                  }),
                                  backupCodesCreated: true,
                                  backupCodesCount: 8
                                }
                              }));
                              if ("speechSynthesis" in window && voiceOver) {
                                window.speechSynthesis.cancel();
                                const ut = new SpeechSynthesisUtterance("Oito códigos de recuperação simétricos foram gerados.");
                                ut.lang = "pt-PT";
                                window.speechSynthesis.speak(ut);
                              }
                            }}
                            className="bg-[#351e10] hover:bg-[#8C5A2B]/20 border border-[#B87333]/30 text-orange-200 text-[9px] font-black uppercase px-2 py-1 rounded transition-colors cursor-pointer"
                          >
                            Gerar
                          </button>
                        </div>

                        {/* Toggle Biometric Recovery */}
                        <div className="flex justify-between items-center bg-zinc-950/60 p-2 rounded border border-zinc-900/30 text-[10.5px]">
                          <div className="space-y-0.5">
                            <span className="text-zinc-500 uppercase font-black text-[8.5px] block">Bypass Biométrico (FaceID):</span>
                            <span className="text-zinc-400 text-[10px]">
                              {currentUser.recoveryConfig?.biometricActive ? "Ativo para Desbloqueio" : "Inativo"}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setCurrentUser(prev => ({
                                ...prev,
                                recoveryConfig: {
                                  ...(prev.recoveryConfig || {
                                    emailRecovery: "",
                                    backupCodesCreated: false,
                                    backupCodesCount: 0,
                                    trustedAgentOverride: false
                                  }),
                                  biometricActive: !prev.recoveryConfig?.biometricActive
                                }
                              }));
                            }}
                            className={`text-[9px] uppercase font-bold py-1 px-2 rounded border transition-all cursor-pointer ${
                              currentUser.recoveryConfig?.biometricActive 
                                ? "bg-emerald-950/40 text-emerald-300 border-emerald-900/40" 
                                : "bg-zinc-900 border-zinc-800 text-zinc-500"
                            }`}
                          >
                            {currentUser.recoveryConfig?.biometricActive ? "LIGADO" : "DESLIGADO"}
                          </button>
                        </div>

                        {/* Toggle Agent physical verification override */}
                        <div className="flex justify-between items-center bg-zinc-950/60 p-2 rounded border border-zinc-900/30 text-[10.5px]">
                          <div className="space-y-0.5">
                            <span className="text-zinc-500 uppercase font-black text-[8.5px] block">Agente Autorizado BNA:</span>
                            <span className="text-zinc-400 text-[10px]">
                              {currentUser.recoveryConfig?.trustedAgentOverride ? "Permitido" : "Não Autorizado"}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setCurrentUser(prev => ({
                                ...prev,
                                recoveryConfig: {
                                  ...(prev.recoveryConfig || {
                                    emailRecovery: "",
                                    backupCodesCreated: false,
                                    backupCodesCount: 0,
                                    biometricActive: false
                                  }),
                                  trustedAgentOverride: !prev.recoveryConfig?.trustedAgentOverride
                                }
                              }));
                            }}
                            className={`text-[9px] uppercase font-bold py-1 px-2 rounded border transition-all cursor-pointer ${
                              currentUser.recoveryConfig?.trustedAgentOverride 
                                ? "bg-emerald-950/40 text-[#B87333] border-[#B87333]/40" 
                                : "bg-zinc-900 border-zinc-800 text-zinc-500"
                            }`}
                          >
                            {currentUser.recoveryConfig?.trustedAgentOverride ? "ATIVO" : "DESAT."}
                          </button>
                        </div>
                      </div>

                      {/* OPTION TO RE-SHOW LEVEL 1: BRAND ONBOARDING ADVENT */}
                      <button
                        onClick={() => setIsOnboarded(false)}
                        className="w-full bg-[#351e10]/80 hover:bg-[#8C5A2B]/40 text-orange-200 border border-[#B87333]/30 font-black uppercase text-[10.5px] py-3 rounded-xl tracking-wider active:scale-95 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Sparkles className="w-4 h-4 text-[#B87333]" />
                        <span>Ver Campanha Institucional V2</span>
                      </button>

                    </div>
                  )}

                  {/* BOTTOM PHYSICAL NOIR NAVIGATION BAR */}
                  {/* Sem animações, sem publicidade, sem elementos promocionais */}
                  <div className="border-t border-zinc-950 bg-black pt-2 pb-1 grid grid-cols-4 gap-1 text-[11px] font-sans font-extrabold select-none">
                    
                    <button
                      onClick={() => {
                        setStep("idle");
                        setActiveTab("inicio");
                      }}
                      className={`py-1.5 rounded flex flex-col items-center gap-0.5 justify-center ${
                        activeTab === "inicio" && step === "idle" ? "text-white bg-[#0a0a0a]" : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      <span className="font-sans text-[10px] uppercase font-black block tracking-wider">Início</span>
                    </button>

                    <button
                      onClick={() => {
                        setStep("idle");
                        setAgentStep("menu");
                        setActiveTab("agentes");
                      }}
                      className={`py-1.5 rounded flex flex-col items-center gap-0.5 justify-center ${
                        activeTab === "agentes" && step === "idle" ? "text-white bg-[#0a0a0a]" : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      <span className="font-sans text-[10px] uppercase font-black block tracking-wider">Agentes</span>
                    </button>

                    <button
                      onClick={() => {
                        setStep("idle");
                        setActiveTab("ajuda");
                      }}
                      className={`py-1.5 rounded flex flex-col items-center gap-0.5 justify-center ${
                        activeTab === "ajuda" && step === "idle" ? "text-white bg-[#0a0a0a]" : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      <span className="font-sans text-[10px] uppercase font-black block tracking-wider">Ajuda</span>
                    </button>

                    <button
                      onClick={() => {
                        setStep("idle");
                        setActiveTab("perfil");
                      }}
                      className={`py-1.5 rounded flex flex-col items-center gap-0.5 justify-center ${
                        activeTab === "perfil" && step === "idle" ? "text-white bg-[#0a0a0a]" : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      <span className="font-sans text-[10px] uppercase font-black block tracking-wider">Perfil</span>
                    </button>

                  </div>

                </div>
              )}

            </div>
          )}

        </div>

        {/* BIOMETRIC SIMULATOR OVERLAY */}
        {showBiometricModal && (
          <div className="absolute inset-0 bg-black/95 backdrop-blur-lg z-40 flex flex-col justify-between p-5 animate-fade-in text-white select-none rounded-[36px]">
            
            {/* Custom Animations Stylesheet */}
            <style>{`
              @keyframes laser-sweep {
                0% { top: 0%; }
                50% { top: 100%; }
                100% { top: 0%; }
              }
              .animate-laser-sweep {
                animation: laser-sweep 2s infinite ease-in-out;
              }
              @keyframes sensor-pulse {
                0% { transform: scale(1); opacity: 0.3; }
                50% { transform: scale(1.15); opacity: 0.6; }
                100% { transform: scale(1); opacity: 0.3; }
              }
              .animate-sensor-pulse {
                animation: sensor-pulse 2s infinite ease-in-out;
              }
            `}</style>
            
            {/* Top Navigation Header */}
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#B87333] font-mono flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-ping"></span>
                <span>Segurança Dispositivo</span>
              </span>
              <button 
                onClick={() => {
                  setShowBiometricModal(false);
                  setFingerprintHolding(false);
                  setFingerprintProgress(0);
                  setFaceIdScanning(false);
                  setFaceIdProgress(0);
                  setBiometricError("");
                }}
                className="text-zinc-500 hover:text-white font-extrabold text-[10px] uppercase tracking-wide cursor-pointer"
              >
                Cancelar
              </button>
            </div>

            {/* Interactive Biometric Area */}
            <div className="flex-grow flex flex-col items-center justify-center py-4 text-center">
              
              {/* Authentication Type Selector (Touch ID vs Face ID) */}
              <div className="flex bg-[#050505] p-1 rounded-xl border border-zinc-900 max-w-[270px] mx-auto mb-6">
                <button 
                  onClick={() => {
                    setBiometricType("fingerprint");
                    setFingerprintHolding(false);
                    setFingerprintProgress(0);
                    setFaceIdScanning(false);
                    setFaceIdProgress(0);
                    setBiometricError("");
                  }}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-[9px] uppercase tracking-wider font-extrabold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                    biometricType === "fingerprint" 
                      ? "bg-[#B87333] text-white shadow" 
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <Fingerprint className="w-3.5 h-3.5" />
                  <span>Digital</span>
                </button>
                <button 
                  onClick={() => {
                    setBiometricType("face_id");
                    setFingerprintHolding(false);
                    setFingerprintProgress(0);
                    setFaceIdScanning(false);
                    setFaceIdProgress(0);
                    setBiometricError("");
                  }}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-[9px] uppercase tracking-wider font-extrabold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                    biometricType === "face_id" 
                      ? "bg-[#B87333] text-white shadow" 
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Rosto (Face ID)</span>
                </button>
              </div>

              {/* ACTIVE SIMULATION GRAPHIC TARGET */}
              <div className="my-2.5">
                {biometricType === "fingerprint" ? (
                  /* FINGERPRINT ULTRASONIC TARGET SENSOR */
                  <div className="flex flex-col items-center gap-5">
                    <div 
                      onMouseDown={() => setFingerprintHolding(true)}
                      onMouseUp={() => setFingerprintHolding(false)}
                      onMouseLeave={() => setFingerprintHolding(false)}
                      onTouchStart={() => setFingerprintHolding(true)}
                      onTouchEnd={() => setFingerprintHolding(false)}
                      className={`relative w-32 h-32 rounded-full bg-zinc-950 border border-zinc-900 flex items-center justify-center select-none cursor-pointer transition-transform active:scale-95 duration-100 ${
                        fingerprintHolding ? "border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.15)]" : ""
                      }`}
                    >
                      {/* Pulse ring decoration in background */}
                      <div className={`absolute inset-3 rounded-full border border-[#B87333]/10 bg-zinc-900-50 ${
                        fingerprintHolding ? "animate-sensor-pulse" : ""
                      }`} />

                      {/* Circular Progress SVG Loader (Stroke offsets from circumference) */}
                      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="44"
                          fill="transparent"
                          stroke="rgba(39,39,42,0.6)"
                          strokeWidth="3.5"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="44"
                          fill="transparent"
                          stroke="#B87333"
                          strokeWidth="4"
                          strokeDasharray={2 * Math.PI * 44}
                          strokeDashoffset={2 * Math.PI * 44 * (1 - fingerprintProgress / 100)}
                          strokeLinecap="round"
                          className="transition-all duration-75"
                        />
                      </svg>

                      {/* Fingerprint Glyph Core */}
                      <div className="relative z-10 flex flex-col items-center justify-center">
                        <Fingerprint className={`w-12 h-12 transition-colors duration-300 ${
                          fingerprintHolding ? "text-orange-400 scale-105 duration-150" : "text-[#B87333]"
                        }`} />
                        {fingerprintProgress > 0 && (
                          <span className="text-[10px] font-mono font-black text-orange-400 mt-1 block">
                            {fingerprintProgress}%
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <strong className="text-xs uppercase text-zinc-300 font-mono tracking-wider block">
                        {fingerprintHolding ? "A digitalizar..." : "Toque e mantenha o dedo premido"}
                      </strong>
                      <p className="text-[9.5px] text-zinc-500 uppercase leading-relaxed max-w-[240px] mx-auto">
                        Mantenha o dedo pressionado no sensor biométrico até atingir 100% da leitura colateral.
                      </p>
                    </div>
                  </div>
                ) : (
                  /* FACE ID SWEEPING LASER FRAME CAMERA RADAR */
                  <div className="flex flex-col items-center gap-5">
                    <div className="relative w-32 h-32 border border-zinc-900 bg-[#050505] rounded-3xl flex items-center justify-center overflow-hidden">
                      
                      {/* Sci-fi Corner Brackets Overlay */}
                      <div className="absolute top-2 left-2 w-3.5 h-3.5 border-t-2 border-l-2 border-[#B87333]"></div>
                      <div className="absolute top-2 right-2 w-3.5 h-3.5 border-t-2 border-r-2 border-[#B87333]"></div>
                      <div className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b-2 border-l-2 border-[#B87333]"></div>
                      <div className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b-2 border-r-2 border-[#B87333]"></div>

                      {/* Emerald Scanning laser wave sweep */}
                      {faceIdScanning && (
                        <div className="absolute left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-[#B87333] to-transparent animate-laser-sweep shadow-[0_0_10px_#B87333] z-10"></div>
                      )}

                      {/* Simulated facial landmarks scan vector circles */}
                      {faceIdScanning && (
                        <div className="absolute inset-4 rounded-full border border-dashed border-orange-500/10 animate-spin-slow"></div>
                      )}

                      <Camera className={`w-10 h-10 transition-colors duration-300 ${
                        faceIdScanning ? "text-orange-400 animate-pulseScale" : "text-zinc-700"
                      }`} />
                      
                      {faceIdScanning && (
                        <span className="absolute bottom-2 text-[9px] font-mono text-orange-400 font-black bg-black/40 px-1.5 py-0.5 rounded border border-neutral-900/60">
                          {faceIdProgress}%
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 w-full">
                      {faceIdScanning ? (
                        <div className="space-y-1 animate-fade-in">
                          <strong className="text-xs uppercase text-orange-400 font-mono tracking-wider block animate-pulse">
                            Escaneando Rosto...
                          </strong>
                          <span className="text-[9.5px] font-mono text-zinc-400 block max-w-[250px] mx-auto truncate font-medium">
                            {faceIdStatus}
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-[9.5px] text-zinc-500 uppercase leading-relaxed max-w-[240px] mx-auto">
                            Posicione a câmara frontal do telemóvel ao nível dos olhos para efetuar a validação.
                          </p>
                          <button
                            onClick={startFaceIdScan}
                            className="bg-[#B87333] hover:bg-amber-600 text-white font-extrabold text-[10px] uppercase font-mono tracking-widest px-4 py-2.5 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>Iniciar Scan Facial</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* BIOMETRIC ALERTS AND FEEDBACK */}
              {biometricError && (
                <div className="mt-4 px-3 py-2 bg-rose-500/5 text-rose-450 border border-rose-500/15 rounded-lg text-[10px] font-mono leading-tight flex items-center gap-1.5 max-w-[280px] mx-auto animate-fade-in">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                  <span>{biometricError}</span>
                </div>
              )}

            </div>

            {/* Bottom Safe Fallback Link Option */}
            <div className="border-t border-zinc-900 pt-3 space-y-2">
              <button
                onClick={() => {
                  setShowBiometricModal(false);
                  setFingerprintHolding(false);
                  setFingerprintProgress(0);
                  setFaceIdScanning(false);
                  setFaceIdProgress(0);
                  setBiometricError("");
                  setStep("reveal_pin");
                }}
                className="w-full py-3 rounded-xl border border-zinc-900 text-[10px] uppercase font-bold tracking-wider text-[#B87333] bg-zinc-950 hover:bg-neutral-900 active:bg-zinc-900 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                title="PIN de segurança backup"
              >
                <Lock className="w-3.5 h-3.5 text-[#B87333]" />
                <span>Alternar para PIN de Segurança</span>
              </button>
            </div>

          </div>
        )}

        {/* Home mechanics physical virtual button key */}
        <div className="bg-black py-2.5 border-t border-neutral-950 flex justify-center items-center">
          <button
            onClick={() => {
              if (isOnboarded) {
                setStep("idle");
                setActiveTab("inicio");
              }
            }}
            className="w-16 h-1 bg-zinc-800 hover:bg-white rounded-full transition-all cursor-pointer"
            title="Sair para Ecrã Principal"
          ></button>
        </div>

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
