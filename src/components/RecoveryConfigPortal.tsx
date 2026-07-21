/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Mail, 
  Phone, 
  HelpCircle, 
  Database, 
  Terminal, 
  RefreshCw, 
  CheckCircle,
  AlertCircle,
  Lock,
  FileCode,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Bell,
  Sliders,
  MessageSquare,
  Fingerprint,
  Camera
} from "lucide-react";

interface RecoveryConfig {
  email: string;
  backupPhone: string;
  securityQuestionId: string;
  securityAnswer: string;
}

export default function RecoveryConfigPortal() {
  // Local state for simulation
  const [config, setConfig] = useState<RecoveryConfig>({
    email: "manuel.silva@netangola.ao",
    backupPhone: "+244 923 456 789",
    securityQuestionId: "2",
    securityAnswer: "Calulu de Peixe"
  });

  const [simulatedEntries, setSimulatedEntries] = useState<{
    id: string;
    email: string;
    backupPhone: string;
    question: string;
    isSynced: boolean;
    timestamp: string;
  }[]>([
    {
      id: "REC-9382",
      email: "manuel.silva@netangola.ao",
      backupPhone: "+244 923 456 789",
      question: "Qual é o seu prato angolano favorito?",
      isSynced: true,
      timestamp: new Date(Date.now() - 3600000 * 4).toISOString()
    },
    {
      id: "REC-1049",
      email: "altino.bessa@bna.gov.ao",
      backupPhone: "+244 931 888 221",
      question: "Qual foi a sua primeira escola?",
      isSynced: true,
      timestamp: new Date(Date.now() - 3600000 * 24).toISOString()
    }
  ]);

  const [emailInput, setEmailInput] = useState(config.email);
  const [phoneInput, setPhoneInput] = useState(config.backupPhone);
  const [questionId, setQuestionId] = useState(config.securityQuestionId);
  const [answerInput, setAnswerInput] = useState(config.securityAnswer);

  const [feedback, setFeedback] = useState<{ text: string; type: "success" | "error" | "info" | "" }>({
    text: "",
    type: ""
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeSchemaTab, setActiveSchemaTab] = useState<"sql_ddl" | "connection_neon" | "neon_api">("sql_ddl");

  // Tab control for RecoveryConfigPortal
  const [activePortalTab, setActivePortalTab] = useState<"canais" | "alertas" | "biometria">("canais");

  // State for FaceID biometrics
  const [faceIdEnabled, setFaceIdEnabled] = useState<boolean>(false);
  const [faceIdRegisteredAt, setFaceIdRegisteredAt] = useState<string>("");
  const [isScanningFace, setIsScanningFace] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [faceIdFeedback, setFaceIdFeedback] = useState<string>("");
  const [activeBiometricSchemaTab, setActiveBiometricSchemaTab] = useState<"biometric_sql" | "biometric_node">("biometric_sql");

  const [biometricLogs, setBiometricLogs] = useState<{
    id: string;
    event: string;
    status: string;
    timestamp: string;
  }[]>([
    {
      id: "BIO-9102",
      event: "Mapeamento biométrico inicial solicitado pelo BNA",
      status: "PENDENTE",
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
    }
  ]);

  const handleStartFaceScan = () => {
    setIsScanningFace(true);
    setScanProgress(0);
    setFaceIdFeedback("A inicializar câmara integrada...");

    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setScanProgress(progress);

      if (progress === 10) {
        setFaceIdFeedback("Câmara ativa. Rosto detetado, a alinhar sensores...");
      } else if (progress === 30) {
        setFaceIdFeedback("A alinhar malha tridimensional facial (3D Mesh)...");
      } else if (progress === 50) {
        setFaceIdFeedback("A recolher 128 pontos nodais de segurança...");
      } else if (progress === 70) {
        setFaceIdFeedback("A verificar conformidade com normas regulatórias do BNA...");
      } else if (progress === 90) {
        setFaceIdFeedback("A assinar vetor biométrico com chave assimétrica RSA...");
      } else if (progress >= 100) {
        clearInterval(interval);
        setIsScanningFace(false);
        setFaceIdEnabled(true);
        const now = new Date();
        setFaceIdRegisteredAt(now.toLocaleTimeString("pt-PT") + " " + now.toLocaleDateString("pt-PT"));
        setFaceIdFeedback("Sucesso! Biometria facial (FaceID) registada e sincronizada no Neon Database.");

        const newLog = {
          id: `BIO-${Math.floor(1000 + Math.random() * 9000)}`,
          event: "Registo e mapeamento biométrico facial concluído",
          status: "ATIVO",
          timestamp: now.toISOString()
        };
        setBiometricLogs(prev => [newLog, ...prev]);
      }
    }, 250);
  };

  const handleResetBiometrics = () => {
    setFaceIdEnabled(false);
    setFaceIdRegisteredAt("");
    setScanProgress(0);
    setFaceIdFeedback("Biometria facial removida. Estado de segurança reposto.");
    const now = new Date();
    const newLog = {
      id: `BIO-${Math.floor(1000 + Math.random() * 9000)}`,
      event: "Biometria facial desativada pelo utilizador",
      status: "DESATIVADO",
      timestamp: now.toISOString()
    };
    setBiometricLogs(prev => [newLog, ...prev]);
  };

  // State for security alerts
  const [smsAlertsEnabled, setSmsAlertsEnabled] = useState<boolean>(true);
  const [smsThresholdAmount, setSmsThresholdAmount] = useState<number>(100000);
  const [customSmsPhone, setCustomSmsPhone] = useState<string>("+244 923 456 789");
  const [simulatedTxAmount, setSimulatedTxAmount] = useState<string>("150000");
  const [alertFeedback, setAlertFeedback] = useState<string>("");
  const [isSavingAlerts, setIsSavingAlerts] = useState<boolean>(false);
  const [activeAlertSchemaTab, setActiveAlertSchemaTab] = useState<"trigger_sql" | "sms_node">("trigger_sql");

  const [alertLogs, setAlertLogs] = useState<{
    id: string;
    type: "SMS" | "SYSTEM";
    message: string;
    amount: number;
    timestamp: string;
    status: "ENVIADO" | "PENDENTE" | "FALHOU";
  }[]>([
    {
      id: "ALT-7701",
      type: "SMS",
      message: "KwanzaMóvel ALERTA: Retirada de 150.000 Kz efetuada na sua conta.",
      amount: 150000,
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      status: "ENVIADO"
    },
    {
      id: "ALT-3209",
      type: "SMS",
      message: "KwanzaMóvel ALERTA: Transferência de 120.000 Kz disparou notificação de limite.",
      amount: 120000,
      timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
      status: "ENVIADO"
    }
  ]);

  const handleSaveAlertSettings = () => {
    setIsSavingAlerts(true);
    setAlertFeedback("A sincronizar parâmetros com as regras de integridade do Neon Database...");
    
    setTimeout(() => {
      setIsSavingAlerts(false);
      setAlertFeedback(`Configuração guardada com sucesso! Alertas SMS ativados para transações superiores a ${smsThresholdAmount.toLocaleString("pt-PT")} Kz.`);
    }, 1200);
  };

  const handleSimulateTx = () => {
    const amountNum = parseFloat(simulatedTxAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setAlertFeedback("Erro: Insira um valor de transação válido.");
      return;
    }

    if (!smsAlertsEnabled) {
      setAlertFeedback(`Transação de ${amountNum.toLocaleString("pt-PT")} Kz simulada com sucesso, mas os alertas via SMS encontram-se desativados.`);
      return;
    }

    if (amountNum >= smsThresholdAmount) {
      const newLog = {
        id: `ALT-${Math.floor(1000 + Math.random() * 9000)}`,
        type: "SMS" as const,
        message: `KwanzaMóvel ALERTA: Transação de ${amountNum.toLocaleString("pt-PT")} Kz efetuada na conta. Destino SMS: ${customSmsPhone || phoneInput}`,
        amount: amountNum,
        timestamp: new Date().toISOString(),
        status: "ENVIADO" as const
      };
      setAlertLogs(prev => [newLog, ...prev]);
      setAlertFeedback(`[ALERTA DISPARADO] Transação de ${amountNum.toLocaleString("pt-PT")} Kz excede o limite de ${smsThresholdAmount.toLocaleString("pt-PT")} Kz! SMS de notificação enviado para ${customSmsPhone || phoneInput}.`);
    } else {
      setAlertFeedback(`Transação de ${amountNum.toLocaleString("pt-PT")} Kz registada silenciosamente (Abaixo do patamar de alerta de ${smsThresholdAmount.toLocaleString("pt-PT")} Kz).`);
    }
  };

  const securityQuestions = [
    { id: "1", text: "Qual era o nome do seu primeiro animal de estimação?" },
    { id: "2", text: "Qual é o seu prato angolano favorito?" },
    { id: "3", text: "Em qual província de Angola nasceu a sua mãe?" },
    { id: "4", text: "Qual foi a sua primeira escola primária?" }
  ];

  const getQuestionText = (id: string) => {
    return securityQuestions.find(q => q.id === id)?.text || "Pergunta não definida";
  };

  // Safe checks for validation
  const isEmailValid = emailInput.includes("@") && emailInput.includes(".");
  const isPhoneValid = phoneInput.trim().length >= 8;
  const isAnswerValid = answerInput.trim().length >= 3;

  // Compute security level score
  let activeMethodsCount = 0;
  if (isEmailValid) activeMethodsCount++;
  if (isPhoneValid) activeMethodsCount++;
  if (isAnswerValid) activeMethodsCount++;
  if (faceIdEnabled) activeMethodsCount++;

  let securityLabel = "MUITO BAIXO";
  let securityColor = "text-rose-600 bg-rose-500/5 border-rose-500/15";
  let securityProgressWidth = "15%";
  let progressColor = "bg-rose-600";

  if (activeMethodsCount === 1) {
    securityLabel = "BAIXO";
    securityColor = "text-rose-455 bg-rose-500/10 border-rose-500/25";
    securityProgressWidth = "25%";
    progressColor = "bg-rose-500";
  } else if (activeMethodsCount === 2) {
    securityLabel = "MÉDIO";
    securityColor = "text-amber-400 bg-amber-500/10 border-amber-500/25";
    securityProgressWidth = "50%";
    progressColor = "bg-amber-500";
  } else if (activeMethodsCount === 3) {
    securityLabel = "FORTE / HIGH SECURE";
    securityColor = "text-teal-400 bg-teal-500/10 border-teal-500/25";
    securityProgressWidth = "75%";
    progressColor = "bg-teal-500";
  } else if (activeMethodsCount === 4) {
    securityLabel = "MÁXIMO / CRIPTOGRÁFICO";
    securityColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/25";
    securityProgressWidth = "100%";
    progressColor = "bg-emerald-500";
  }

  const handleSimulateSync = () => {
    if (!isEmailValid) {
      setFeedback({ text: "Erro: Insira um email de recuperação válido.", type: "error" });
      return;
    }
    if (!isPhoneValid) {
      setFeedback({ text: "Erro: Forneça um contacto telefónico secundário para autenticação SMS backup.", type: "error" });
      return;
    }
    if (!isAnswerValid) {
      setFeedback({ text: "Erro: A resposta de segurança temporária deve ter pelo menos 3 caracteres.", type: "error" });
      return;
    }

    setIsSyncing(true);
    setFeedback({ text: "A estabelecer ligação TLS ao cluster serverless Neon (us-east-1)...", type: "info" });

    setTimeout(() => {
      setFeedback({ text: "Ligação mTLS efetuada. A gerar hashes Argon2id para respostas de segurança...", type: "info" });
      
      setTimeout(() => {
        const newConfig = {
          email: emailInput,
          backupPhone: phoneInput,
          securityQuestionId: questionId,
          securityAnswer: answerInput
        };

        setConfig(newConfig);

        // Add to simulated ledger database logs
        const newSim = {
          id: `REC-${Math.floor(1000 + Math.random() * 9000)}`,
          email: emailInput,
          backupPhone: phoneInput,
          question: getQuestionText(questionId),
          isSynced: true,
          timestamp: new Date().toISOString()
        };

        setSimulatedEntries(prev => [newSim, ...prev]);
        setIsSyncing(false);
        setFeedback({ 
          text: "Sucesso! Configuração guardada no repositório de desenvolvimento mTLS e mapeada para migração futura no Neon Database.", 
          type: "success" 
        });
      }, 1500);
    }, 1500);
  };

  // SQL scripts for preview
  const postgresDdlCode = `-- SCHEMA DE RECUPERAÇÃO DE CONTA PARA O NEON (POSTGRESQL)
-- Segurança Avançada com hashing criptográfico de respostas em back-end.

CREATE TABLE IF NOT EXISTS public.account_recovery_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_phone VARCHAR(20) NOT NULL UNIQUE,       -- Chave estrangeira para o cliente principal (KwanzaMóvel)
    recovery_email VARCHAR(255) NOT NULL,
    backup_phone VARCHAR(20) NOT NULL,
    security_question_id INTEGER NOT NULL,
    security_answer_hash VARCHAR(255) NOT NULL,    -- Encriptado no backend com bcrypt ou argon2
    is_mfa_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexação rápida para validações offline seguras do BNA
CREATE INDEX IF NOT EXISTS idx_recovery_user_phone ON public.account_recovery_methods(user_phone);`;

  const nodeNeonCode = `// EXEMPLO DE CONFIGURAÇÃO DE LIGAÇÃO E SALVAGUARDA (DRIZZLE ORM / NEON CLIENT)
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcrypt';

const sql = neon(process.env.DATABASE_URL); // Neon Serverless Connection

export async function saveRecoveryConfig(userPhone, email, backupPhone, questionId, rawAnswer) {
  // Nunca guardar passwords ou respostas de segurança em texto limpo!
  const answerHash = await bcrypt.hash(rawAnswer, 12);
  
  await sql\`
    INSERT INTO public.account_recovery_methods 
      (user_phone, recovery_email, backup_phone, security_question_id, security_answer_hash)
    VALUES 
      (\${userPhone}, \${email}, \${backupPhone}, \${questionId}, \${answerHash})
    ON CONFLICT (user_phone) 
    DO UPDATE SET 
      recovery_email = EXCLUDED.recovery_email,
      backup_phone = EXCLUDED.backup_phone,
      security_question_id = EXCLUDED.security_question_id,
      security_answer_hash = EXCLUDED.security_answer_hash,
      updated_at = NOW();
  \`;
}`;

  const alertSqlCode = `-- CONFIGURAÇÃO DO TRIGGER PARA ALERTAS SMS NO NEON POSTGRESQL
-- Tabela de configurações por utilizador regulada pelo BNA
CREATE TABLE IF NOT EXISTS public.security_alerts_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_phone VARCHAR(20) NOT NULL UNIQUE,
    sms_alerts_enabled BOOLEAN DEFAULT TRUE,
    sms_alert_threshold NUMERIC(15, 2) DEFAULT 100000.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trigger de segurança automática
CREATE OR REPLACE FUNCTION audit_large_transaction_sms()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.amount >= (SELECT sms_alert_threshold FROM public.security_alerts_config WHERE user_phone = NEW.sender_phone) THEN
        -- Adicionar à fila de envio de mensagens
        INSERT INTO public.outbound_sms_queue (destination_phone, message, status)
        VALUES (
            (SELECT backup_phone FROM public.account_recovery_methods WHERE user_phone = NEW.sender_phone),
            'KwanzaMóvel ALERTA: Detetada transação de ' || NEW.amount || ' Kz na sua conta.',
            'PENDING'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;`;

  const alertNodeCode = `// CÓDIGO DE DISPARO NO SERVER-SIDE (EXPRESS / DRIZZLE ORM)
import { neon } from '@neondatabase/serverless';
import axios from 'axios';

const sql = neon(process.env.DATABASE_URL);

export async function processTransactionWithAlerts(txId, senderPhone, amount) {
  // 1. Procurar as definições de alertas do utilizador
  const [config] = await sql\`
    SELECT sms_alerts_enabled, sms_alert_threshold 
    FROM public.security_alerts_config 
    WHERE user_phone = \${senderPhone}
  \`;

  if (config && config.sms_alerts_enabled && amount >= config.sms_alert_threshold) {
    // 2. Obter número de telemóvel de backup seguro
    const [recovery] = await sql\`
      SELECT backup_phone FROM public.account_recovery_methods 
      WHERE user_phone = \${senderPhone}
    \`;

    const targetPhone = recovery?.backup_phone || senderPhone;
    
    // 3. Efetuar envio via gateway de SMS nacional
    await axios.post('https://api.gateway-sms.ao/send', {
      to: targetPhone,
      message: \`[KwanzaMóvel] Alerta de Segurança: Foi efetuada uma transação de \${amount.toLocaleString('pt-PT')} Kz na sua conta.\`
    });
  }
}`;

  const biometricSqlCode = `-- CONFIGURAÇÃO DO SCHEMA DE BIOMETRIA NO NEON POSTGRESQL
-- Vinculação segura entre dispositivo físico e vetor de hash tridimensional facial
CREATE TABLE IF NOT EXISTS public.user_biometric_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_phone VARCHAR(20) NOT NULL UNIQUE,
    face_vector_hash VARCHAR(64) NOT NULL,       -- Assinatura SHA256 do mapa tridimensional facial
    biometric_active BOOLEAN DEFAULT TRUE,
    device_fingerprint VARCHAR(100) NOT NULL,    -- Vinculação segura ao hardware (Secure Enclave / TEE)
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_verification TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexação por número de telefone para autenticação em milissegundos
CREATE INDEX IF NOT EXISTS idx_biometric_user_phone 
ON public.user_biometric_credentials(user_phone);`;

  const biometricNodeCode = `// API DE AUTENTICAÇÃO BIOMÉTRICA (EXPRESS & NEON SERVERLESS)
import { neon } from '@neondatabase/serverless';
import crypto from 'crypto';

const sql = neon(process.env.DATABASE_URL);

// Registar vetor de FaceID recebido do dispositivo móvel do cidadão
export async function registerFaceBiometrics(userPhone, facePoints, deviceFingerprint) {
  // Gerar hash criptográfico a partir dos pontos da malha facial
  const faceVectorHash = crypto
    .createHash('sha256')
    .update(JSON.stringify(facePoints))
    .digest('hex');

  await sql\`
    INSERT INTO public.user_biometric_credentials (
      user_phone, face_vector_hash, device_fingerprint, biometric_active
    ) VALUES (
      \${userPhone}, \${faceVectorHash}, \${deviceFingerprint}, true
    )
    ON CONFLICT (user_phone) DO UPDATE SET
      face_vector_hash = EXCLUDED.face_vector_hash,
      device_fingerprint = EXCLUDED.device_fingerprint,
      last_verification = CURRENT_TIMESTAMP;
  \`;

  return { success: true, hash: faceVectorHash };
}`;

  return (
    <div className="space-y-4 animate-fade-in" id="recovery-config-portal">
      
      {/* Dev / Neon Banner */}
      <div className="bg-[#0b0807] border border-[#B87333]/30 p-3.5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-left">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-[10.5px] font-black text-amber-500 uppercase tracking-widest font-mono">
            <Database className="w-4 h-4 text-[#B87333]" />
            <span>Mapeador de Desenvolvimento do Neon PostgreSQL</span>
          </div>
          <p className="text-xs text-zinc-400">
            Estes parâmetros persistem atualmente de forma local (simulado) no ecrã de regulação. Para produção, as respostas são hasheadas via <strong>Argon2id</strong> e guardadas em tabelas relacionais do Neon.
          </p>
        </div>
        <span className="text-[9px] font-mono shrink-0 bg-[#B87333]/15 text-[#e0a96d] border border-[#B87333]/30 uppercase font-black px-2 py-1 rounded">
          Neon Cloud DB Stage: Planeado
        </span>
      </div>

      {/* High-level Tab Selector */}
      <div className="flex border-b border-neutral-900 pb-px gap-1">
        <button
          onClick={() => setActivePortalTab("canais")}
          className={`px-4 py-2 text-xs uppercase font-mono font-black tracking-wider transition-all duration-200 border-b-2 -mb-px flex items-center gap-2 cursor-pointer ${
            activePortalTab === "canais"
              ? "border-[#B87333] text-white bg-neutral-900/40 rounded-t-lg font-black"
              : "border-transparent text-zinc-500 hover:text-zinc-350"
          }`}
        >
          <Lock className="w-3.5 h-3.5 text-[#B87333]" />
          Canais de Recuperação
        </button>
        <button
          onClick={() => setActivePortalTab("alertas")}
          className={`px-4 py-2 text-xs uppercase font-mono font-black tracking-wider transition-all duration-200 border-b-2 -mb-px flex items-center gap-2 cursor-pointer ${
            activePortalTab === "alertas"
              ? "border-[#B87333] text-white bg-neutral-900/40 rounded-t-lg font-black"
              : "border-transparent text-zinc-500 hover:text-zinc-350"
          }`}
        >
          <Bell className="w-3.5 h-3.5 text-[#B87333]" />
          Alertas de Segurança
        </button>
        <button
          onClick={() => setActivePortalTab("biometria")}
          className={`px-4 py-2 text-xs uppercase font-mono font-black tracking-wider transition-all duration-200 border-b-2 -mb-px flex items-center gap-2 cursor-pointer ${
            activePortalTab === "biometria"
              ? "border-[#B87333] text-white bg-neutral-900/40 rounded-t-lg font-black"
              : "border-transparent text-zinc-500 hover:text-zinc-350"
          }`}
        >
          <Fingerprint className="w-3.5 h-3.5 text-[#B87333]" />
          Biometria Facial (FaceID)
        </button>
      </div>

      {activePortalTab === "canais" && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* Lado Esquerdo: Formulário de Simulação */}
            <div className="bg-zinc-950 border border-neutral-900 rounded-xl p-4.5 space-y-4 text-left">
              <div className="flex items-center gap-2 border-b border-neutral-900 pb-2.5">
                <Lock className="w-4 h-4 text-[#B87333]" />
                <div>
                  <h4 className="font-black text-xs uppercase tracking-wider text-white">Configurar Recuperação</h4>
                  <p className="text-[8.5px] text-zinc-500 uppercase font-mono">Simulador de Canais Alternativos de Credencial</p>
                </div>
              </div>

              <div className="space-y-3">
                {/* Email Input */}
                <div className="space-y-1.5">
                  <label className="text-[9.5px] uppercase font-bold text-zinc-400 block font-mono flex justify-between">
                    <span>1. Email de Contacto Principal</span>
                    {isEmailValid ? (
                      <span className="text-emerald-400 text-[8.5px] lowercase">Válido</span>
                    ) : (
                      <span className="text-rose-400 text-[8.5px] lowercase">Incompleto</span>
                    )}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-2.5 w-4 h-4 text-zinc-600" />
                    <input 
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full bg-[#050505] border border-neutral-900 rounded-lg py-2.5 pl-9 pr-3 text-xs text-white font-mono outline-none focus:border-[#B87333]/60 transition-colors"
                      placeholder="cidadao@bna.gov.ao"
                    />
                  </div>
                </div>

                {/* Phone Input */}
                <div className="space-y-1.5">
                  <label className="text-[9.5px] uppercase font-bold text-zinc-400 block font-mono flex justify-between">
                    <span>2. Telefone Secundário (SMS Offline)</span>
                    {isPhoneValid ? (
                      <span className="text-emerald-400 text-[8.5px]">Configurado</span>
                    ) : (
                      <span className="text-rose-455 text-[8.5px]">Insira o número</span>
                    )}
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-2.5 top-2.5 w-4 h-4 text-zinc-600" />
                    <input 
                      type="text"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      className="w-full bg-[#050505] border border-neutral-900 rounded-lg py-2.5 pl-9 pr-3 text-xs text-white font-mono outline-none focus:border-[#B87333]/60 transition-colors"
                      placeholder="+244 9xx xxx xxx"
                    />
                  </div>
                </div>

                {/* Security Questions Selection */}
                <div className="space-y-1.5">
                  <label className="text-[9.5px] uppercase font-bold text-zinc-400 block font-mono">
                    3. Pergunta de Autenticação KwanzaMóvel
                  </label>
                  <div className="relative">
                    <HelpCircle className="absolute left-2.5 top-2.5 w-4 h-4 text-zinc-600 pointer-events-none" />
                    <select
                      value={questionId}
                      onChange={(e) => setQuestionId(e.target.value)}
                      className="w-full bg-[#050505] border border-neutral-900 rounded-lg py-2.5 pl-9 pr-3 text-xs text-white font-sans outline-none focus:border-[#B87333]/60 transition-colors cursor-pointer appearance-none"
                    >
                      {securityQuestions.map(q => (
                        <option key={q.id} value={q.id} className="bg-zinc-950 text-white">
                          {q.text}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Security Answer Input */}
                <div className="space-y-1.5">
                  <label className="text-[9.5px] uppercase font-bold text-zinc-400 block font-mono">
                    Resposta de Segurança (Hashed no Neon)
                  </label>
                  <input 
                    type="text"
                    value={answerInput}
                    onChange={(e) => setAnswerInput(e.target.value)}
                    className="w-full bg-[#050505] border border-neutral-900 rounded-lg py-2.5 px-3 text-xs text-white font-mono outline-none focus:border-[#B87333]/60 transition-colors"
                    placeholder="Introduza a resposta confidencial"
                  />
                  <span className="text-[8px] text-zinc-550 block font-mono">Esta resposta substitui chaves privadas caso ocorra perda física do dispositivo.</span>
                </div>

                {/* Sync Feedback Message */}
                {feedback.text && (
                  <div className={`p-2.5 rounded-lg border text-[10px] font-mono leading-normal flex gap-1.5 ${
                    feedback.type === "success" 
                      ? "bg-emerald-950/20 text-emerald-300 border-emerald-900/50"
                      : feedback.type === "error"
                      ? "bg-rose-950/20 text-rose-300 border-rose-900/50"
                      : "bg-zinc-950 text-amber-300 border-neutral-900/45 animate-pulse"
                  }`}>
                    {feedback.type === "success" ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <span>{feedback.text}</span>
                  </div>
                )}

                {/* Buttons */}
                <button
                  onClick={handleSimulateSync}
                  disabled={isSyncing}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-[#B87333] hover:from-amber-700 hover:to-[#9E5F27] text-white font-extrabold text-[11px] uppercase rounded-xl tracking-wider transition-all duration-200 cursor-pointer shadow-md disabled:opacity-40 flex items-center justify-center gap-1.5"
                >
                  {isSyncing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 text-white animate-spin" />
                      <span>A Encriptar & Enviar para o Database...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-white animate-bounce" />
                      <span>Simular Sincronização NEON</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Lado Direito: Painel de Status Ativos */}
            <div className="space-y-3.5 flex flex-col justify-between">
              
              {/* Status Panel */}
              <div className="bg-zinc-950 border border-neutral-900 rounded-xl p-4 text-left space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
                  <span className="text-[10px] uppercase font-black tracking-wider text-zinc-500 font-mono">Status da Conta de Simulação</span>
                  <span className={`text-[8px] font-mono font-black border uppercase px-1.5 py-0.5 rounded ${securityColor}`}>
                    Nível: {securityLabel}
                  </span>
                </div>

                {/* Custom progress level bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[8px] font-mono text-zinc-500">
                    <span>Rácio de Segurança Alternativa</span>
                    <strong>{activeMethodsCount}/4 Métodos Ativos</strong>
                  </div>
                  <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${progressColor}`}
                      style={{ width: securityProgressWidth }}
                    />
                  </div>
                </div>

                {/* Visualization of the Channels status */}
                <div className="space-y-2 mt-2 font-mono text-[10px]">
                  
                  {/* Channel Email */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#050505] border border-neutral-900/60">
                    <div className="flex items-center gap-2">
                      <Mail className={`w-4 h-4 ${isEmailValid ? "text-emerald-400" : "text-zinc-600"}`} />
                      <div>
                        <span className="text-zinc-400 font-black text-[9px] block">CANAIS MAPPED: EMAIL</span>
                        <span className="text-zinc-500 text-[9px] truncate max-w-[150px] inline-block">{emailInput || "Não Ativo"}</span>
                      </div>
                    </div>
                    <div>
                      <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        isEmailValid ? "bg-emerald-950/30 text-emerald-350 border border-emerald-900/30" : "bg-neutral-900 text-zinc-600"
                      }`}>
                        {isEmailValid ? "Conforme" : "Não Ativo"}
                      </span>
                    </div>
                  </div>

                  {/* Channel SMS Backup */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#050505] border border-neutral-900/60">
                    <div className="flex items-center gap-2">
                      <Phone className={`w-4 h-4 ${isPhoneValid ? "text-emerald-400" : "text-zinc-600"}`} />
                      <div>
                        <span className="text-zinc-400 font-black text-[9px] block">SMS OFFLINE SECUNDÁRIO</span>
                        <span className="text-zinc-500 text-[9px]">{phoneInput || "Não Configurado"}</span>
                      </div>
                    </div>
                    <div>
                      <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        isPhoneValid ? "bg-emerald-950/30 text-emerald-350 border border-emerald-900/30" : "bg-neutral-900 text-zinc-600"
                      }`}>
                        {isPhoneValid ? "Monitorizado" : "Não Ativo"}
                      </span>
                    </div>
                  </div>

                  {/* Security Question Channel */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#050505] border border-neutral-900/60">
                    <div className="flex items-center gap-2">
                      <HelpCircle className={`w-4 h-4 ${isAnswerValid ? "text-[#B87333]" : "text-zinc-600"}`} />
                      <div>
                        <span className="text-zinc-400 font-black text-[9px] block">PERGUNTA SECRETA ENCRIPTADA</span>
                        <span className="text-zinc-500 text-[8.5px] truncate max-w-[140px] inline-block">{getQuestionText(questionId)}</span>
                      </div>
                    </div>
                    <div>
                      <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        isAnswerValid ? "bg-[#B87333]/15 text-[#e0a96d] border border-[#B87333]/20" : "bg-neutral-900 text-zinc-600"
                      }`}>
                        {isAnswerValid ? "Guardado" : "Pendente"}
                      </span>
                    </div>
                  </div>

                  {/* FaceID Biometric Channel */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#050505] border border-neutral-900/60">
                    <div className="flex items-center gap-2">
                      <Fingerprint className={`w-4 h-4 ${faceIdEnabled ? "text-emerald-400" : "text-zinc-600"}`} />
                      <div>
                        <span className="text-zinc-400 font-black text-[9px] block">BIOMETRIA FACIAL (FACEID)</span>
                        <span className="text-zinc-500 text-[8.5px]">
                          {faceIdEnabled ? `Ativo: ${faceIdRegisteredAt || "Registado"}` : "Não Ativa / Pendente"}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        faceIdEnabled ? "bg-emerald-950/30 text-emerald-350 border border-emerald-900/30" : "bg-neutral-900 text-zinc-600"
                      }`}>
                        {faceIdEnabled ? "Pronto" : "Não Ativo"}
                      </span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Database Plan - NEON PostgreSQL Relational schema */}
              <div className="bg-zinc-950 border border-neutral-900 rounded-xl p-4.5 text-left flex-grow flex flex-col">
                <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-teal-400" />
                    <span className="text-[10px] uppercase font-black tracking-wider text-zinc-300 font-mono">Dossier de Produção Neon SQL</span>
                  </div>
                  <div className="flex gap-1 bg-[#050505] p-0.5 rounded border border-neutral-800 text-[8px] font-mono">
                    <button 
                      onClick={() => setActiveSchemaTab("sql_ddl")}
                      className={`px-1.5 py-0.5 rounded ${activeSchemaTab === "sql_ddl" ? "bg-teal-900/30 text-teal-400" : "text-zinc-500"}`}
                    >
                      TABELA DDL
                    </button>
                    <button 
                      onClick={() => setActiveSchemaTab("neon_api")}
                      className={`px-1.5 py-0.5 rounded ${activeSchemaTab === "neon_api" ? "bg-teal-900/30 text-teal-400" : "text-zinc-500"}`}
                    >
                      NODE / SERVER
                    </button>
                  </div>
                </div>

                <div className="mt-2.5 bg-[#050505] border border-neutral-900/50 rounded-lg p-2.5 flex-grow font-mono text-[9px] leading-relaxed text-zinc-300 overflow-y-auto max-h-36 scrollbar-thin">
                  {activeSchemaTab === "sql_ddl" && (
                    <pre className="whitespace-pre overflow-x-auto text-[8.5px]">{postgresDdlCode}</pre>
                  )}
                  {activeSchemaTab === "neon_api" && (
                    <pre className="whitespace-pre overflow-x-auto text-[8.5px]">{nodeNeonCode}</pre>
                  )}
                </div>

                <div className="mt-2 text-[8px] font-mono text-zinc-550 flex items-center gap-1">
                  <FileCode className="w-3.5 h-3.5 text-zinc-650" />
                  <span>Configurado com índices de elevada performance para segurança.</span>
                </div>
              </div>

            </div>
          </div>

          {/* Simulated list ledger from Neon DB */}
          <div className="bg-zinc-950 border border-neutral-900 rounded-xl p-4.5 text-left space-y-3">
            <span className="text-[10px] uppercase font-black tracking-wider text-zinc-500 font-mono block">Histórico de Alterações Simulado (Transações de Recuperação Registadas)</span>
            <div className="space-y-1.5 font-mono max-h-48 overflow-y-auto scrollbar-thin">
              {simulatedEntries.map(e => (
                <div key={e.id} className="bg-[#050505] border border-neutral-900/60 rounded-lg p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-[10px] text-zinc-350">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-zinc-550 text-[8.5px] font-black underline">{e.id}</span>
                      <span className="text-[#B87333] font-black text-[9px]">{e.email}</span>
                    </div>
                    <div className="text-[9px] text-zinc-500">
                      Phone SMS: <strong className="text-zinc-400">{e.backupPhone}</strong> | Pergunta: <strong className="text-zinc-400">{e.question}</strong>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-right self-end sm:self-auto shrink-0">
                    <span className="text-[8px] text-zinc-550 block">{new Date(e.timestamp).toLocaleTimeString("pt-PT")}</span>
                    <span className="text-[8px] font-bold text-teal-400 bg-teal-500/10 px-1.5 py-0.5 rounded border border-teal-500/20 flex items-center gap-0.5">
                      <CheckCircle className="w-3 h-3 text-teal-400" />
                      Synced Neon
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {activePortalTab === "alertas" && (
        <div className="space-y-4 animate-fade-in" id="alerts-config-tab">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Lado Esquerdo: Formulário de Configuração & Simulador */}
            <div className="bg-zinc-950 border border-neutral-900 rounded-xl p-4.5 space-y-4 text-left">
              <div className="flex items-center gap-2 border-b border-neutral-900 pb-2.5">
                <Bell className="w-4 h-4 text-[#B87333]" />
                <div>
                  <h4 className="font-black text-xs uppercase tracking-wider text-white">Configurar Alertas de Transação</h4>
                  <p className="text-[8.5px] text-zinc-500 uppercase font-mono">Regras e Limiares para Notificações SMS</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* 1. Toggle SMS Notification */}
                <div className="flex items-center justify-between p-3 bg-[#050505] border border-neutral-900 rounded-lg">
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-zinc-300 block font-mono">Notificações SMS Ativas</span>
                    <span className="text-[8.5px] text-zinc-500 block">Enviar mensagem SMS ao detetar transação suspeita.</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={smsAlertsEnabled}
                      onChange={(e) => setSmsAlertsEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600 peer-checked:after:bg-white"></div>
                  </label>
                </div>

                {/* 2. Destination Phone Number */}
                <div className="space-y-1.5">
                  <label className="text-[9.5px] uppercase font-bold text-zinc-400 block font-mono flex justify-between">
                    <span>Contacto Destinatário do Alerta SMS</span>
                    <span className="text-zinc-500 text-[8.5px]">Cópia de Segurança</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-2.5 top-2.5 w-4 h-4 text-zinc-600" />
                    <input 
                      type="text"
                      value={customSmsPhone}
                      onChange={(e) => setCustomSmsPhone(e.target.value)}
                      className="w-full bg-[#050505] border border-neutral-900 rounded-lg py-2.5 pl-9 pr-3 text-xs text-white font-mono outline-none focus:border-[#B87333]/60 transition-colors"
                      placeholder="+244 9xx xxx xxx"
                    />
                  </div>
                </div>

                {/* 3. Value Threshold Slider & Input */}
                <div className="space-y-2 bg-[#050505] border border-neutral-900 p-3 rounded-lg">
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-zinc-400 uppercase font-black">Limiar de Valor Crítico (Kz)</span>
                    <strong className="text-[#B87333] font-black text-xs">{smsThresholdAmount.toLocaleString('pt-PT')} Kz</strong>
                  </div>
                  <input 
                    type="range"
                    min="5000"
                    max="1000000"
                    step="5000"
                    value={smsThresholdAmount}
                    onChange={(e) => setSmsThresholdAmount(parseInt(e.target.value))}
                    className="w-full accent-[#B87333] bg-neutral-900 h-1.5 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[8px] text-zinc-500 font-mono">
                    <span>5.000 Kz</span>
                    <span>500.000 Kz</span>
                    <span>1.000.000 Kz</span>
                  </div>

                  {/* Manual adjustment input to make it super elegant */}
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[9px] text-zinc-500 font-mono">Ajuste Preciso:</span>
                    <input 
                      type="number"
                      value={smsThresholdAmount}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val)) setSmsThresholdAmount(val);
                      }}
                      className="bg-zinc-950 border border-neutral-800 text-white font-mono text-[10px] rounded px-2 py-1 w-28 outline-none focus:border-[#B87333]/40"
                    />
                    <span className="text-[8.5px] text-zinc-500 font-mono">Kz</span>
                  </div>
                </div>

                {/* Action Button: Guardar Definições */}
                <button
                  onClick={handleSaveAlertSettings}
                  disabled={isSavingAlerts}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-[#B87333] hover:from-amber-700 hover:to-[#9E5F27] text-white font-extrabold text-[10px] uppercase rounded-lg tracking-wider transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isSavingAlerts ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                      <span>Sincronizando Parâmetros Neon...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3.5 h-3.5 text-white" />
                      <span>Guardar Parâmetros Regulatórios</span>
                    </>
                  )}
                </button>

                {/* --- TEST PLAYGROUND SECTION --- */}
                <div className="border-t border-neutral-900 pt-3.5 mt-2 space-y-3">
                  <div className="flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-teal-400" />
                    <span className="text-[9.5px] uppercase font-black text-teal-400 font-mono tracking-wider">Simulador de Alertas em Tempo Real</span>
                  </div>
                  <p className="text-[9px] text-zinc-400 font-sans">
                    Insira um montante de transação abaixo para verificar se o sistema deteta e envia a notificação por SMS para o telefone de backup parametrizado.
                  </p>

                  <div className="flex gap-2">
                    <div className="relative flex-grow">
                      <span className="absolute left-2.5 top-2.5 text-zinc-600 font-mono text-xs">Kz</span>
                      <input 
                        type="number"
                        value={simulatedTxAmount}
                        onChange={(e) => setSimulatedTxAmount(e.target.value)}
                        className="w-full bg-[#050505] border border-neutral-900 rounded-lg py-2 pl-7 pr-3 text-xs text-white font-mono outline-none focus:border-teal-500/50 transition-colors"
                        placeholder="Ex: 150000"
                      />
                    </div>
                    <button
                      onClick={handleSimulateTx}
                      className="bg-teal-900/30 hover:bg-teal-900/50 border border-teal-800/40 text-teal-300 font-black text-[10px] uppercase px-4 py-2 rounded-lg transition-all shrink-0 cursor-pointer font-bold"
                    >
                      Executar Transação
                    </button>
                  </div>
                </div>

                {/* Feedbacks for Alerts setting/simulation */}
                {alertFeedback && (
                  <div className="p-2.5 rounded-lg bg-teal-950/20 text-teal-300 border border-teal-900/50 text-[10px] font-mono leading-normal flex gap-1.5 animate-fade-in">
                    <MessageSquare className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                    <span>{alertFeedback}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Lado Direito: Dossier de Banco de Dados Neon */}
            <div className="space-y-3.5 flex flex-col justify-between">
              
              {/* Informações Regulatórias do BNA */}
              <div className="bg-zinc-950 border border-neutral-900 rounded-xl p-4 text-left space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
                  <span className="text-[10px] uppercase font-black tracking-wider text-zinc-500 font-mono">Segurança Sistémica</span>
                  <span className="text-[8px] font-mono font-black border border-emerald-500/20 text-emerald-400 bg-emerald-500/5 px-1.5 py-0.5 rounded">
                    Módulo Ativo
                  </span>
                </div>

                <div className="space-y-2.5 text-[10px] text-zinc-400 leading-relaxed font-sans">
                  <p>
                    O regulamento do BNA exige a aplicação de controlos de segurança em transações digitais, obrigando os operadores autorizados (KwanzaMóvel, etc.) a notificarem o titular imediatamente após a deteção de fluxos que excedam o limiar pré-definido.
                  </p>
                  <p className="text-[9.5px]">
                    Através desta consola de simulação, o regulador pode testar de que forma as tabelas relacionais do <strong className="text-white">Neon PostgreSQL</strong> respondem a inserções de transações volumosas e como o trigger automático coloca a notificação numa fila segura de mensagens offline.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2 mt-2 font-mono text-[9px] bg-[#050505] p-2 rounded-lg border border-neutral-900">
                    <div>
                      <span className="text-zinc-550 block uppercase text-[8px]">Limite Configurado</span>
                      <strong className="text-white">{smsThresholdAmount.toLocaleString('pt-PT')} Kz</strong>
                    </div>
                    <div>
                      <span className="text-zinc-550 block uppercase text-[8px]">Canal SMS</span>
                      <strong className="text-amber-500">{smsAlertsEnabled ? "ATIVO" : "DESATIVADO"}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dossier de Produção do Banco de Dados */}
              <div className="bg-zinc-950 border border-neutral-900 rounded-xl p-4.5 text-left flex-grow flex flex-col">
                <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-teal-400" />
                    <span className="text-[10px] uppercase font-black tracking-wider text-zinc-300 font-mono">Dossier de Produção Neon SQL</span>
                  </div>
                  <div className="flex gap-1 bg-[#050505] p-0.5 rounded border border-neutral-800 text-[8px] font-mono">
                    <button 
                      onClick={() => setActiveAlertSchemaTab("trigger_sql")}
                      className={`px-1.5 py-0.5 rounded ${activeAlertSchemaTab === "trigger_sql" ? "bg-teal-900/30 text-teal-400" : "text-zinc-500"}`}
                    >
                      TRIGGER SQL
                    </button>
                    <button 
                      onClick={() => setActiveAlertSchemaTab("sms_node")}
                      className={`px-1.5 py-0.5 rounded ${activeAlertSchemaTab === "sms_node" ? "bg-teal-900/30 text-teal-400" : "text-zinc-500"}`}
                    >
                      API SMS NODE
                    </button>
                  </div>
                </div>

                <div className="mt-2.5 bg-[#050505] border border-neutral-900/50 rounded-lg p-2.5 flex-grow font-mono text-[9px] leading-relaxed text-zinc-300 overflow-y-auto max-h-40 scrollbar-thin">
                  {activeAlertSchemaTab === "trigger_sql" && (
                    <pre className="whitespace-pre overflow-x-auto text-[8.5px]">{alertSqlCode}</pre>
                  )}
                  {activeAlertSchemaTab === "sms_node" && (
                    <pre className="whitespace-pre overflow-x-auto text-[8.5px]">{alertNodeCode}</pre>
                  )}
                </div>

                <div className="mt-2 text-[8px] font-mono text-zinc-550 flex items-center gap-1">
                  <FileCode className="w-3.5 h-3.5 text-zinc-650" />
                  <span>Otimizado com trigger plpgsql nativo no cluster Neon.</span>
                </div>
              </div>

            </div>
          </div>

          {/* Histórico de Alertas de Segurança Disparados */}
          <div className="bg-zinc-950 border border-neutral-900 rounded-xl p-4.5 text-left space-y-3">
            <span className="text-[10px] uppercase font-black tracking-wider text-zinc-500 font-mono block">Histórico de Alertas de Segurança Disparados (Logs SMS em Tempo Real)</span>
            <div className="space-y-1.5 font-mono max-h-48 overflow-y-auto scrollbar-thin">
              {alertLogs.length === 0 ? (
                <div className="text-zinc-550 text-center py-4 text-[10px]">Sem alertas de segurança registados para o limiar atual.</div>
              ) : (
                alertLogs.map(l => (
                  <div key={l.id} className="bg-[#050505] border border-neutral-900/60 rounded-lg p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-[10px] text-zinc-350">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-rose-400 text-[8.5px] font-black underline">{l.id}</span>
                        <span className="text-[#B87333] font-black text-[9px] uppercase">Alerta Disparado ({l.amount.toLocaleString('pt-PT')} Kz)</span>
                      </div>
                      <div className="text-[9px] text-zinc-400">
                        {l.message}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-right self-end sm:self-auto shrink-0">
                      <span className="text-[8px] text-zinc-550 block">{new Date(l.timestamp).toLocaleTimeString("pt-PT")}</span>
                      <span className="text-[8px] font-bold text-teal-400 bg-teal-500/10 px-1.5 py-0.5 rounded border border-teal-500/20 flex items-center gap-0.5">
                        <CheckCircle className="w-3 h-3 text-teal-400" />
                        {l.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activePortalTab === "biometria" && (
        <div className="space-y-4 animate-fade-in" id="biometrics-config-tab">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left Column: Interactive FaceID Registration & Scanner */}
            <div className="bg-zinc-950 border border-neutral-900 rounded-xl p-4.5 space-y-4 text-left">
              <div className="flex items-center gap-2 border-b border-neutral-900 pb-2.5">
                <Fingerprint className="w-4 h-4 text-[#B87333]" />
                <div>
                  <h4 className="font-black text-xs uppercase tracking-wider text-white">Registo de Biometria Facial (FaceID)</h4>
                  <p className="text-[8.5px] text-zinc-500 uppercase font-mono">Simulador de Mapeamento 3D Regulado pelo BNA</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Visual Scanner Box */}
                <div className="relative border border-neutral-900 rounded-xl bg-[#030303] overflow-hidden flex flex-col items-center justify-center p-6 h-64 select-none">
                  
                  {/* Neon Grid effect in background */}
                  <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(184,115,51,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(184,115,51,0.1)_1px,transparent_1px)] bg-[size:16px_16px]"></div>

                  {isScanningFace ? (
                    <div className="w-full flex flex-col items-center justify-center space-y-4 relative z-10">
                      {/* Scanning Line Animation */}
                      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent shadow-[0_0_10px_rgba(245,158,11,1)] animate-pulse" style={{ animationDuration: '2s' }}></div>
                      
                      <div className="relative w-28 h-28 border-2 border-dashed border-[#B87333] rounded-full flex items-center justify-center animate-spin" style={{ animationDuration: '8s' }}>
                        <div className="w-24 h-24 border border-teal-500/30 rounded-full flex items-center justify-center"></div>
                      </div>

                      <div className="absolute flex flex-col items-center justify-center text-center space-y-1">
                        <Camera className="w-8 h-8 text-[#B87333] animate-pulse" />
                        <span className="text-[14px] font-black font-mono text-[#B87333]">{scanProgress}%</span>
                      </div>

                      <div className="text-center">
                        <span className="text-[9px] uppercase font-black tracking-widest text-teal-400 font-mono block">A analisar características...</span>
                        <span className="text-[10px] text-zinc-400 mt-1 block h-4 font-mono max-w-xs">{faceIdFeedback}</span>
                      </div>
                    </div>
                  ) : faceIdEnabled ? (
                    <div className="flex flex-col items-center justify-center space-y-3 relative z-10 text-center animate-fade-in">
                      <div className="w-24 h-24 bg-emerald-500/10 border border-emerald-500/40 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                        <CheckCircle className="w-12 h-12 text-emerald-400" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-emerald-400 text-[10px] font-black font-mono uppercase tracking-wider block">Biometria Ativa & Autenticada</span>
                        <span className="text-[11px] text-zinc-300 font-sans block max-w-xs">
                          O seu vetor biométrico 3D facial encontra-se encriptado e mapeado com sucesso no Neon Database.
                        </span>
                        <span className="text-[8.5px] text-zinc-550 font-mono block mt-1">
                          Registado em: {faceIdRegisteredAt}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center space-y-3 relative z-10 text-center">
                      <div className="w-24 h-24 bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center text-zinc-600">
                        <Camera className="w-10 h-10 text-zinc-500" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-zinc-400 text-[10px] font-black font-mono uppercase tracking-wider block">Scanner Facial Inativo</span>
                        <span className="text-[10px] text-zinc-500 font-sans block max-w-xs">
                          O BNA recomenda a ativação de biometria facial para bypass seguro de transações que exijam níveis adicionais de MFA.
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Controller Buttons */}
                <div className="flex gap-2">
                  {!faceIdEnabled ? (
                    <button
                      onClick={handleStartFaceScan}
                      disabled={isScanningFace}
                      className="flex-grow py-3 bg-gradient-to-r from-amber-600 to-[#B87333] hover:from-amber-700 hover:to-[#9E5F27] text-white font-black text-[10px] uppercase rounded-lg tracking-wider transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
                    >
                      <Camera className="w-3.5 h-3.5 text-white" />
                      <span>{isScanningFace ? "A Executar Leitura..." : "Registar Biometria (FaceID)"}</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleResetBiometrics}
                      className="flex-grow py-3 bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 border border-rose-900/40 font-black text-[10px] uppercase rounded-lg tracking-wider transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                      <span>Excluir e Resetar FaceID</span>
                    </button>
                  )}
                </div>

                {/* Feedback message */}
                {faceIdFeedback && !isScanningFace && (
                  <div className="p-2.5 rounded-lg bg-teal-950/20 text-teal-300 border border-teal-900/50 text-[10px] font-mono leading-normal flex gap-1.5 animate-fade-in">
                    <MessageSquare className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                    <span>{faceIdFeedback}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Regulatory compliance and SQL code schema */}
            <div className="space-y-3.5 flex flex-col justify-between text-left">
              
              {/* Compliance card */}
              <div className="bg-zinc-950 border border-neutral-900 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
                  <span className="text-[10px] uppercase font-black tracking-wider text-zinc-500 font-mono">Regulação do BNA</span>
                  <span className="text-[8px] font-mono font-black border border-emerald-500/20 text-emerald-400 bg-emerald-500/5 px-1.5 py-0.5 rounded">
                    Norma Técnica nº 04/2026
                  </span>
                </div>

                <div className="space-y-2.5 text-[10px] text-zinc-400 leading-relaxed font-sans">
                  <p>
                    De acordo com o mais recente regulamento do Banco Nacional de Angola, as soluções de custódia e carteiras móveis devem fornecer mecanismos de autenticação biométrica integrados com os Enclaves Seguros de hardware (TEE) dos dispositivos móveis.
                  </p>
                  <p className="text-[9.5px]">
                    No simulador acima, a malha de sensores é projetada e calculada localmente. O hash resultante é guardado de forma persistente e rápida no cluster <strong className="text-white">Neon PostgreSQL</strong> para permitir auditoria rápida, prevenção de Money Mule (contas "laranja") e bypass sem PIN de transações seguras.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2 mt-2 font-mono text-[9px] bg-[#050505] p-2 rounded-lg border border-neutral-900">
                    <div>
                      <span className="text-zinc-550 block uppercase text-[8px]">Integridade Biométrica</span>
                      <strong className="text-white">{faceIdEnabled ? "VINCULADO (Neon DB)" : "NÃO INICIALIZADO"}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-550 block uppercase text-[8px]">Enclave Seguro</span>
                      <strong className="text-amber-500">{faceIdEnabled ? "ATIVO (RSA-2048)" : "INATIVO"}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Database Schema display for Biometrics */}
              <div className="bg-zinc-950 border border-neutral-900 rounded-xl p-4.5 flex-grow flex flex-col">
                <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-teal-400" />
                    <span className="text-[10px] uppercase font-black tracking-wider text-zinc-300 font-mono">Dossier de Produção Neon Biometrics</span>
                  </div>
                  <div className="flex gap-1 bg-[#050505] p-0.5 rounded border border-neutral-800 text-[8px] font-mono">
                    <button 
                      onClick={() => setActiveBiometricSchemaTab("biometric_sql")}
                      className={`px-1.5 py-0.5 rounded ${activeBiometricSchemaTab === "biometric_sql" ? "bg-teal-900/30 text-teal-400" : "text-zinc-500"}`}
                    >
                      TABELA SQL
                    </button>
                    <button 
                      onClick={() => setActiveBiometricSchemaTab("biometric_node")}
                      className={`px-1.5 py-0.5 rounded ${activeBiometricSchemaTab === "biometric_node" ? "bg-teal-900/30 text-teal-400" : "text-zinc-500"}`}
                    >
                      API NODE
                    </button>
                  </div>
                </div>

                <div className="mt-2.5 bg-[#050505] border border-neutral-900/50 rounded-lg p-2.5 flex-grow font-mono text-[9px] leading-relaxed text-zinc-300 overflow-y-auto max-h-40 scrollbar-thin">
                  {activeBiometricSchemaTab === "biometric_sql" && (
                    <pre className="whitespace-pre overflow-x-auto text-[8.5px]">{biometricSqlCode}</pre>
                  )}
                  {activeBiometricSchemaTab === "biometric_node" && (
                    <pre className="whitespace-pre overflow-x-auto text-[8.5px]">{biometricNodeCode}</pre>
                  )}
                </div>

                <div className="mt-2 text-[8px] font-mono text-zinc-550 flex items-center gap-1">
                  <FileCode className="w-3.5 h-3.5 text-zinc-650" />
                  <span>Compatível com extensão pgvector no cluster Neon.</span>
                </div>
              </div>

            </div>
          </div>

          {/* Biometrics Audit log Ledger */}
          <div className="bg-zinc-950 border border-neutral-900 rounded-xl p-4.5 text-left space-y-3">
            <span className="text-[10px] uppercase font-black tracking-wider text-zinc-500 font-mono block">Histórico de Eventos de Credenciais Biométricas (Neon Audit Logs)</span>
            <div className="space-y-1.5 font-mono max-h-48 overflow-y-auto scrollbar-thin">
              {biometricLogs.map(l => (
                <div key={l.id} className="bg-[#050505] border border-neutral-900/60 rounded-lg p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-[10px] text-zinc-350">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-zinc-550 text-[8.5px] font-black underline">{l.id}</span>
                      <span className="text-white font-black text-[9px]">{l.event}</span>
                    </div>
                    <div className="text-[9px] text-zinc-500">
                      Dispositivo Associado: <strong className="text-zinc-400">Apple iPhone Secure Enclave (Angola Unit-1)</strong>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-right self-end sm:self-auto shrink-0">
                    <span className="text-[8px] text-zinc-550 block">{new Date(l.timestamp).toLocaleTimeString("pt-PT")}</span>
                    <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded border flex items-center gap-0.5 ${
                      l.status === "ATIVO" 
                        ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" 
                        : l.status === "DESATIVADO" 
                        ? "text-rose-400 bg-rose-500/10 border-rose-500/20" 
                        : "text-amber-400 bg-amber-500/10 border-amber-500/20"
                    }`}>
                      {l.status === "ATIVO" ? (
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                      ) : l.status === "DESATIVADO" ? (
                        <AlertCircle className="w-3 h-3 text-rose-400" />
                      ) : (
                        <RefreshCw className="w-3 h-3 text-amber-400" />
                      )}
                      {l.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
