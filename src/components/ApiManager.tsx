/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line
} from "recharts";
import { AlertTriangle, TrendingUp, Sparkles, BarChart2 } from "lucide-react";
import { 
  Building, 
  Smartphone, 
  Plus, 
  Trash2, 
  Play, 
  Key, 
  Lock, 
  Unlock, 
  FileCode, 
  Copy, 
  CheckCircle, 
  RefreshCw, 
  ShieldAlert, 
  Shield,
  ShieldCheck,
  Search, 
  ChevronRight, 
  Eye, 
  EyeOff, 
  Sliders, 
  Database,
  Globe,
  Settings,
  HelpCircle,
  Code,
  Cpu,
  Zap,
  Terminal,
  Activity,
  Server,
  Compass,
  Download,
  Upload
} from "lucide-react";

export interface ApiEndpoint {
  id: string;
  name: string;
  path: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  type: "public" | "private";
  segment: "banco" | "operador" | "outro";
  description: string;
  headers: { key: string; value: string }[];
  requestBody: string; // JSON string
  responseTemplateSuccess: string; // JSON string
  responseTemplateUnauthorized?: string; // JSON string
  requiresAuth: boolean;
  authType: "Basic" | "Bearer" | "mTLS";
}

export interface ApiCredential {
  id: string;
  type: "banco" | "operador";
  name: string; // e.g. "Banco BAI", "Unitel Money"
  clientId: string;
  clientSecret: string;
  status: "Active" | "Inactive";
  created: string;
}

export interface BankWebhook {
  id: string;
  bankCode: string;
  bankName: string;
  webhookUrl: string;
  secretKey: string;
  events: string[];
  isActive: boolean;
  contentType: "application/json" | "application/xml";
  lastTriggered?: string;
  lastResponseStatus?: string;
}

export interface ExternalCredential {
  id: string;
  name: string;
  apiKey: string;
  apiSecret: string;
  environment: "sandbox" | "producao";
  status: "Active" | "Inactive";
  created: string;
}

export interface ApiAuditLog {
  id: string;
  timestamp: string;
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  source: string;
  status: number;
  latencyMs: number;
  payloadSize: string;
  securityCheck: "APPROVED" | "AML_WARNING" | "BLOCKED";
}

export interface WebhookAuditLog {
  id: string;
  timestamp: string;
  endpoint: string;
  method: "POST";
  bankName: string;
  bankCode: string;
  payload: string;
  signature: string;
  status: number;
  statusText: string;
  attempt: number;
}

const initialWebhookAuditLogs: WebhookAuditLog[] = [
  {
    id: "wh_audit_01",
    timestamp: "2026-06-26T20:05:12Z",
    endpoint: "https://api.bai.ao/v1/callbacks/kwanzamovel",
    method: "POST",
    bankName: "Banco BAI",
    bankCode: "BAI",
    payload: JSON.stringify({
      event: "transaction.settled",
      timestamp: "2026-06-26T20:05:11Z",
      webhook_id: "wh_01",
      payload: {
        transacao_id: "TX-SETTLE-891243",
        banco_codigo: "BAI",
        montante_aoa: 450000,
        moeda: "AOA",
        referencia_sptr: "pacs.008.001.08.7ab3cd",
        data_liquidacao: "2026-06-26",
        canal: "KWANZAMÓVEL_SPTR"
      },
      signing_algorithm: "hmac-sha256"
    }, null, 2),
    signature: "7bc394a1d48c7de62b9ea40cf5bdf015a3bf4f1b2b0b8c2cd15d6c55bf1a083f",
    status: 200,
    statusText: "OK",
    attempt: 1
  },
  {
    id: "wh_audit_02",
    timestamp: "2026-06-26T19:42:01Z",
    endpoint: "https://api.bfa.ao/webhook/v1/kwanza-settle",
    method: "POST",
    bankName: "Banco Fomento Angola (BFA)",
    bankCode: "BFA",
    payload: JSON.stringify({
      event: "transaction.settled",
      timestamp: "2026-06-26T19:42:00Z",
      webhook_id: "wh_02",
      payload: {
        transacao_id: "TX-SETTLE-412890",
        banco_codigo: "BFA",
        montante_aoa: 1250000,
        moeda: "AOA",
        referencia_sptr: "pacs.008.001.08.e29ba1",
        data_liquidacao: "2026-06-26",
        canal: "KWANZAMÓVEL_SPTR"
      },
      signing_algorithm: "hmac-sha256"
    }, null, 2),
    signature: "3fd8271ea40bc85df05a3bf4f1b2b0b8c2cd15d6c55bf1a083fbc394a1d48c7d",
    status: 200,
    statusText: "OK",
    attempt: 1
  },
  {
    id: "wh_audit_03",
    timestamp: "2026-06-25T15:23:45Z",
    endpoint: "https://api.banco.ao/v1/callback-500",
    method: "POST",
    bankName: "Banco Sol",
    bankCode: "SOL",
    payload: JSON.stringify({
      event: "transaction.failed",
      timestamp: "2026-06-25T15:23:40Z",
      webhook_id: "wh_03",
      payload: {
        transacao_id: "TX-SETTLE-321045",
        banco_codigo: "SOL",
        montante_aoa: 85000,
        moeda: "AOA",
        referencia_sptr: "pacs.008.001.08.f83c12",
        data_liquidacao: "2026-06-25",
        canal: "KWANZAMÓVEL_SPTR"
      },
      signing_algorithm: "hmac-sha256"
    }, null, 2),
    signature: "f83a21cd295bf8102bd401ab659ef82b3d81fa7c40ab21cd295bf8102bd401ab",
    status: 500,
    statusText: "Internal Server Error",
    attempt: 3
  }
];

const initialApiAuditLogs: ApiAuditLog[] = [
  {
    id: "log_01",
    timestamp: "2026-06-26T20:45:12Z",
    endpoint: "/api/v1/private/bancos/compensar",
    method: "POST",
    source: "Banco Fomento Angola (BFA)",
    status: 200,
    latencyMs: 142,
    payloadSize: "1.4 KB",
    securityCheck: "APPROVED"
  },
  {
    id: "log_02",
    timestamp: "2026-06-26T20:48:30Z",
    endpoint: "/api/v1/private/bancos/liquidar",
    method: "POST",
    source: "Banco BIC",
    status: 401,
    latencyMs: 18,
    payloadSize: "0.2 KB",
    securityCheck: "BLOCKED"
  },
  {
    id: "log_03",
    timestamp: "2026-06-26T20:50:01Z",
    endpoint: "/api/v1/public/bancos/reservas",
    method: "GET",
    source: "Terminal Externo (IP: 165.98.34.11)",
    status: 200,
    latencyMs: 45,
    payloadSize: "4.8 KB",
    securityCheck: "APPROVED"
  },
  {
    id: "log_04",
    timestamp: "2026-06-26T20:52:15Z",
    endpoint: "/api/v1/private/bancos/compensar",
    method: "POST",
    source: "Banco Angolano de Investimentos (BAI)",
    status: 200,
    latencyMs: 210,
    payloadSize: "12.5 KB",
    securityCheck: "AML_WARNING"
  },
  {
    id: "log_05",
    timestamp: "2026-06-26T20:54:40Z",
    endpoint: "/api/v1/private/bancos/liquidar",
    method: "POST",
    source: "Banco SOL",
    status: 500,
    latencyMs: 850,
    payloadSize: "0.9 KB",
    securityCheck: "APPROVED"
  }
];

export interface ApiManagerProps {
  highContrast?: boolean;
  seniorMode?: boolean;
}

const initialEndpoints: ApiEndpoint[] = [
  {
    id: "ep_01",
    name: "Consultar Reservas Fiduciárias",
    path: "/api/v1/public/bancos/reservas",
    method: "GET",
    type: "public",
    segment: "banco",
    description: "Consulta pública em tempo real do total acumulado de reservas fiduciárias e do rácio geral de liquidez dos bancos comerciais sob supervisão do BNA.",
    headers: [
      { key: "Content-Type", value: "application/json" },
      { key: "Accept", value: "application/json" }
    ],
    requestBody: "",
    responseTemplateSuccess: JSON.stringify({
      status: "SUCCESS",
      bancos: {
        BAI: { reserva_aoa: 85000000, ratio: "105.2%" },
        BFA: { reserva_aoa: 90000000, ratio: "112.4%" },
        BIC: { reserva_aoa: 45000000, ratio: "98.5%" }
      },
      last_updated: "2026-06-26T20:10:20Z"
    }, null, 2),
    requiresAuth: false,
    authType: "Basic"
  },
  {
    id: "ep_02",
    name: "Efetuar Liquidação Síncrona (Escrow)",
    path: "/api/v1/private/bancos/liquidacao",
    method: "POST",
    type: "private",
    segment: "banco",
    description: "Endpoint privado e restrito a Bancos Comerciais. Permite bloquear depósitos colaterais na conta de custódia do BNA para emitir saldo fiduciário equivalente digital.",
    headers: [
      { key: "Content-Type", value: "application/json" },
      { key: "X-KwanzaMóvel-Signature", value: "sha256_ecdsa_93810abf92" }
    ],
    requestBody: JSON.stringify({
      banco_codigo: "BAI",
      montante_aoa: 500000,
      conta_custodia_origem: "AO06.0040.0000.1293.0019.1",
      assinado_digitalmente: true
    }, null, 2),
    responseTemplateSuccess: JSON.stringify({
      status: "SUCCESS",
      transacao_id: "TX-SETTLE-889102",
      escrow_bloqueado_aoa: 500000,
      saldo_emitido_digital_aoa: 500000,
      comprovativo_sptr: "pacs.008.001.08.77291a",
      timestamp: "2026-06-26T20:11:05Z"
    }, null, 2),
    responseTemplateUnauthorized: JSON.stringify({
      error: "Unauthorized",
      code: 401,
      message: "Credenciais de Autenticação Básica (Basic Auth) inválidas ou ausentes. Acesso reservado a bancos credenciados pelo BNA."
    }, null, 2),
    requiresAuth: true,
    authType: "Basic"
  },
  {
    id: "ep_03",
    name: "Consultar Taxas de Crédito Telefónico",
    path: "/api/v1/public/operadores/tarifas-conversao",
    method: "GET",
    type: "public",
    segment: "operador",
    description: "Retorna as taxas vigentes e rácio de conversão síncrona de créditos móveis de recarga para saldo KwanzaMóvel digital de transação nacional.",
    headers: [
      { key: "Content-Type", value: "application/json" }
    ],
    requestBody: "",
    responseTemplateSuccess: JSON.stringify({
      status: "SUCCESS",
      taxas: {
        UNITEL: { ratio_conversao: 1.0, taxa_administrativa: "0.5%" },
        AFRICELL: { ratio_conversao: 1.0, taxa_administrativa: "0.2%" },
        MOVICEL: { ratio_conversao: 1.0, taxa_administrativa: "0.8%" }
      },
      data_vigencia: "2026-06-26"
    }, null, 2),
    requiresAuth: false,
    authType: "Basic"
  },
  {
    id: "ep_04",
    name: "Compensar e Dispersar Saldo Móvel",
    path: "/api/v1/private/operadores/dispersar",
    method: "POST",
    type: "private",
    segment: "operador",
    description: "Compensa e converte de forma irreversível os créditos móveis acumulados por recargas físicas de clientes em saldo transacionável síncrono KwanzaMóvel.",
    headers: [
      { key: "Content-Type", value: "application/json" }
    ],
    requestBody: JSON.stringify({
      operadora: "UNITEL",
      total_creditos_resgatados: 25000,
      telemovel_cliente_destino: "+244923000111",
      referencia_interno: "UT-REC-991A"
    }, null, 2),
    responseTemplateSuccess: JSON.stringify({
      status: "SUCCESS",
      transacao_id: "TX-DISBURSE-991A0",
      creditos_convertidos: 25000,
      valor_creditado_aoa: 25000,
      timestamp: "2026-06-26T20:12:15Z"
    }, null, 2),
    responseTemplateUnauthorized: JSON.stringify({
      error: "Unauthorized",
      code: 401,
      message: "Acesso privado. O cabeçalho de Autorização Basic Auth é inválido para a Operadora de Telecomunicações informada."
    }, null, 2),
    requiresAuth: true,
    authType: "Basic"
  }
];

const initialCredentials: ApiCredential[] = [
  {
    id: "cred_01",
    type: "banco",
    name: "Banco BAI",
    clientId: "bai_client_483a",
    clientSecret: "bai_secret_f0d1ea3899bf928ac1001bc",
    status: "Active",
    created: "2026-03-15"
  },
  {
    id: "cred_02",
    type: "banco",
    name: "BFA (Fomento Angola)",
    clientId: "bfa_client_0911",
    clientSecret: "bfa_secret_88cc10dbda391abf83c9d1",
    status: "Active",
    created: "2026-04-10"
  },
  {
    id: "cred_03",
    type: "operador",
    name: "Unitel Money",
    clientId: "unitel_money_99x",
    clientSecret: "unitel_secret_33ba20d88c2f109ffb",
    status: "Active",
    created: "2026-05-01"
  },
  {
    id: "cred_04",
    type: "operador",
    name: "Africell Kwanza",
    clientId: "africell_k_881",
    clientSecret: "africell_secret_ee01ff382cca821",
    status: "Inactive",
    created: "2026-05-20"
  }
];

const initialExternalCredentials: ExternalCredential[] = [
  {
    id: "ext_01",
    name: "EMIS (Rede Multicaixa)",
    apiKey: "emis_pk_sandbox_7a18df730b",
    apiSecret: "emis_sk_sandbox_ee39da812f8a4e39c",
    environment: "sandbox",
    status: "Active",
    created: "2026-06-01"
  },
  {
    id: "ext_02",
    name: "Provedor SMS (Angola Telecom)",
    apiKey: "at_sms_pk_prod_898bf1a2d",
    apiSecret: "at_sms_sk_prod_99cfda8e8888b1f",
    environment: "producao",
    status: "Active",
    created: "2026-06-15"
  }
];

export default function ApiManager({ highContrast = false, seniorMode = false }: ApiManagerProps) {
  
  // App states
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>(initialEndpoints);
  const [credentials, setCredentials] = useState<ApiCredential[]>(initialCredentials);
  
  const [webhooks, setWebhooks] = useState<BankWebhook[]>([
    {
      id: "wh_01",
      bankCode: "BAI",
      bankName: "Banco BAI",
      webhookUrl: "https://api.bai.ao/v1/callbacks/kwanzamovel",
      secretKey: "whsec_bai_9381ad7f1e92c2",
      events: ["transaction.settled", "transaction.failed"],
      isActive: true,
      contentType: "application/json",
      lastTriggered: "2026-06-26T20:05:12Z",
      lastResponseStatus: "200 OK"
    },
    {
      id: "wh_02",
      bankCode: "BFA",
      bankName: "BFA (Fomento Angola)",
      webhookUrl: "https://api.bfa.ao/webhook/v1/kwanza-settle",
      secretKey: "whsec_bfa_883a1b0293ec",
      events: ["transaction.settled"],
      isActive: true,
      contentType: "application/json",
      lastTriggered: "2026-06-26T19:42:01Z",
      lastResponseStatus: "200 OK"
    }
  ]);

  // Webhook form states
  const [newWhBankCode, setNewWhBankCode] = useState("BAI");
  const [newWhUrl, setNewWhUrl] = useState("");
  const [newWhSecret, setNewWhSecret] = useState("");
  const [newWhEvents, setNewWhEvents] = useState<string[]>(["transaction.settled"]);
  const [newWhContentType, setNewWhContentType] = useState<"application/json" | "application/xml">("application/json");

  // Webhook Simulation states
  const [whSimId, setWhSimId] = useState<string>("");
  const [whSimRunning, setWhSimRunning] = useState(false);
  const [whSimLogs, setWhSimLogs] = useState<string[]>([]);
  const [whSimStatus, setWhSimStatus] = useState<number | null>(null);
  const [whSimPayload, setWhSimPayload] = useState<string>("");

  // Webhook Retry Policy states
  const [whMaxRetries, setWhMaxRetries] = useState<number>(3);
  const [whInitialBackoff, setWhInitialBackoff] = useState<number>(1000); // in ms (1s)

  // Webhook daily analytics history (last 7 days)
  const [webhookHistory, setWebhookHistory] = useState([
    { date: "20/Jun", sucesso: 124, falha: 6, latência: 145 },
    { date: "21/Jun", sucesso: 98, falha: 4, latência: 130 },
    { date: "22/Jun", sucesso: 156, falha: 12, latência: 180 },
    { date: "23/Jun", sucesso: 180, falha: 25, latência: 290 }, // Bottleneck peak
    { date: "24/Jun", sucesso: 145, falha: 8, latência: 160 },
    { date: "25/Jun", sucesso: 162, falha: 14, latência: 155 },
    { date: "Hoje", sucesso: 110, falha: 5, latência: 140 },
  ]);

  const [activeMetricTab, setActiveMetricTab] = useState<"volume" | "latency">("volume");
  const [webhookAuditLogs, setWebhookAuditLogs] = useState<WebhookAuditLog[]>(initialWebhookAuditLogs);
  const [expandedWhLogId, setExpandedWhLogId] = useState<string | null>(null);
  const [whLogSearch, setWhLogSearch] = useState<string>("");

  const recordWebhookSimulationResult = (status: number) => {
    setWebhookHistory(prev => prev.map(item => {
      if (item.date === "Hoje") {
        const isSuccess = status >= 200 && status < 300;
        return {
          ...item,
          sucesso: isSuccess ? item.sucesso + 1 : item.sucesso,
          falha: !isSuccess ? item.falha + 1 : item.falha,
          latência: Math.round((item.latência * 4 + (isSuccess ? 125 : 240)) / 5)
        };
      }
      return item;
    }));
  };

  // External Integration Credentials states
  const [externalCreds, setExternalCreds] = useState<ExternalCredential[]>(initialExternalCredentials);
  const [newExtName, setNewExtName] = useState("");
  const [newExtApiKey, setNewExtApiKey] = useState("");
  const [newExtApiSecret, setNewExtApiSecret] = useState("");
  const [newExtEnv, setNewExtEnv] = useState<"sandbox" | "producao">("sandbox");
  const [visibleExtSecrets, setVisibleExtSecrets] = useState<Record<string, boolean>>({});
  const [visibleNewExtSecret, setVisibleNewExtSecret] = useState(false);

  const [whTestRunning, setWhTestRunning] = useState(false);
  const [whTestResult, setWhTestResult] = useState<{
    status: number;
    statusText: string;
    latency: number;
    success: boolean;
    timestamp: string;
    details: string;
  } | null>(null);

  const [selectedEndpointId, setSelectedEndpointId] = useState<string>(initialEndpoints[0].id);
  const [feedback, setFeedback] = useState<string>("");
  const [feedbackType, setFeedbackType] = useState<"success" | "error" | "info">("info");

  // Filters
  const [tabFilter, setTabFilter] = useState<"todos" | "public" | "private">("todos");
  const [segmentFilter, setSegmentFilter] = useState<"todos" | "banco" | "operador">("todos");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Secret Visibility
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({});

  // Credentials generator form
  const [newCredName, setNewCredName] = useState("");
  const [newCredType, setNewCredType] = useState<"banco" | "operador">("banco");

  // Endpoints manager form
  const [isAddingEndpoint, setIsAddingEndpoint] = useState(false);
  const [newEpName, setNewEpName] = useState("");
  const [newEpPath, setNewEpPath] = useState("");
  const [newEpMethod, setNewEpMethod] = useState<"GET" | "POST" | "PUT" | "DELETE">("POST");
  const [newEpType, setNewEpType] = useState<"public" | "private">("private");
  const [newEpSegment, setNewEpSegment] = useState<"banco" | "operador" | "outro">("banco");
  const [newEpDescription, setNewEpDescription] = useState("");
  const [newEpRequestBody, setNewEpRequestBody] = useState("");
  const [newEpResponseSuccess, setNewEpResponseSuccess] = useState("");

  // Playground simulation parameters
  const [playgroundCredId, setPlaygroundCredId] = useState<string>(initialCredentials[0].id);
  const [playgroundRequestBody, setPlaygroundRequestBody] = useState<string>("");
  const [playgroundCustomAuth, setPlaygroundCustomAuth] = useState<string>("");
  const [useCustomAuthHeader, setUseCustomAuthHeader] = useState<boolean>(false);
  const [playgroundResponse, setPlaygroundResponse] = useState<string>("");
  const [playgroundHttpStatus, setPlaygroundHttpStatus] = useState<number | null>(null);
  const [playgroundLogs, setPlaygroundLogs] = useState<string[]>([]);
  const [playgroundRunning, setPlaygroundRunning] = useState(false);

  // Enterprise Architecture State
  const [apiSectionTab, setApiSectionTab] = useState<"gateway" | "architecture" | "supervisao" | "ultraleve">("gateway");
  
  // Project Indexer & Context Optimizer State
  const [activeUltralightTab, setActiveUltralightTab] = useState<"relatorio" | "otimizador">("relatorio");
  const [selectedIndexFiles, setSelectedIndexFiles] = useState<Record<string, boolean>>({
    "/src/components/ApiManager.tsx": true,
    "/src/App.tsx": true,
    "/src/types.ts": true,
    "/src/components/BnaCustodyPortal.tsx": false,
    "/src/components/AgentePortal.tsx": false,
    "/src/components/KMPhonePrototype.tsx": false,
    "/src/ledgerEngine.ts": false,
    "/src/bnaCustody.ts": false,
    "/src/indexedDB.ts": false,
  });
  const [copiedCodeType, setCopiedCodeType] = useState<string | null>(null);

  // Mapeamento real dos ficheiros do projecto para cálculo do otimizador de contexto
  const projectFilesList = [
    {
      name: "ApiManager.tsx",
      path: "/src/components/ApiManager.tsx",
      hash: "8c7d9a1e",
      lines: 4178,
      tokens: 38240,
      description: "Sandbox de APIs, simulador de webhooks com backoff exponencial e logs forenses de auditoria.",
      category: "UI Portal"
    },
    {
      name: "App.tsx",
      path: "/src/App.tsx",
      hash: "f4b2c1d9",
      lines: 506,
      tokens: 4200,
      description: "Entry point principal da aplicação. Gere a navegação dos portais e perfis de acessibilidade.",
      category: "Core"
    },
    {
      name: "BnaCustodyPortal.tsx",
      path: "/src/components/BnaCustodyPortal.tsx",
      hash: "d3e8a21c",
      lines: 1320,
      tokens: 11800,
      description: "Painel de custódia do BNA para controle de circulação de liquidez e conciliação de lotes.",
      category: "UI Portal"
    },
    {
      name: "AgentePortal.tsx",
      path: "/src/components/AgentePortal.tsx",
      hash: "e5a7d3b2",
      lines: 1240,
      tokens: 10450,
      description: "Portal para agentes cadastrados efetuarem depósitos físicos e levantamento de fundos.",
      category: "UI Portal"
    },
    {
      name: "KMPhonePrototype.tsx",
      path: "/src/components/KMPhonePrototype.tsx",
      hash: "c2b9a4f1",
      lines: 1480,
      tokens: 12100,
      description: "Emulador interativo de telemóvel para clientes finais executarem transferências com PIN/OTP.",
      category: "UI Portal"
    },
    {
      name: "ledgerEngine.ts",
      path: "/src/ledgerEngine.ts",
      hash: "1d8f9c3b",
      lines: 120,
      tokens: 950,
      description: "Motor síncrono local de integridade atómica e reconciliação em lote interbancária.",
      category: "Core"
    },
    {
      name: "bnaCustody.ts",
      path: "/src/bnaCustody.ts",
      hash: "a9c1e7d4",
      lines: 105,
      tokens: 820,
      description: "Formatador de mensagens financeiras estruturadas XML em conformidade com o padrão ISO 20022 pacs.008.",
      category: "Core"
    },
    {
      name: "indexedDB.ts",
      path: "/src/indexedDB.ts",
      hash: "b5e2f8a1",
      lines: 155,
      tokens: 1100,
      description: "Camada de armazenamento offline robusto e persistência transacional indexada.",
      category: "Database"
    },
    {
      name: "types.ts",
      path: "/src/types.ts",
      hash: "7d3a2b1e",
      lines: 80,
      tokens: 650,
      description: "Contratos de tipos TypeScript globais, perfis de utilizador, agentes e transações financeiras.",
      category: "Core"
    }
  ];
  
  // Supervision & Auditing State
  const [apiAuditLogs, setApiAuditLogs] = useState<ApiAuditLog[]>(initialApiAuditLogs);
  const [amlCheckActive, setAmlCheckActive] = useState<boolean>(true);
  const [auditLogFilter, setAuditLogFilter] = useState<string>("ALL");
  const [simAuditEndpoint, setSimAuditEndpoint] = useState<string>("/api/v1/private/bancos/compensar");
  const [simAuditSource, setSimAuditSource] = useState<string>("Banco SOL");
  const [simAuditStatus, setSimAuditStatus] = useState<number>(200);

  const [archSelectedLayer, setArchSelectedLayer] = useState<"edge" | "broker" | "ledger" | "security">("edge");
  const [archFlowStep, setArchFlowStep] = useState<number>(0);
  const [archFlowPlaying, setArchFlowPlaying] = useState<boolean>(false);
  const [archConsoleLogs, setArchConsoleLogs] = useState<string[]>([]);
  const [archSlaLoadLevel, setArchSlaLoadLevel] = useState<"standard" | "peak" | "failover">("standard");
  const [archCryptText, setArchCryptText] = useState<string>("KwanzaMóvel_Enterprise_Message_Payload_Verification_Core_2026");
  const [archCryptSignature, setArchCryptSignature] = useState<string>("");
  const [archCryptRunning, setArchCryptRunning] = useState<boolean>(false);

  // Trigger brief alert
  const triggerFeedback = (msg: string, type: "success" | "error" | "info" = "info") => {
    setFeedback(msg);
    setFeedbackType(type);
    setTimeout(() => {
      setFeedback("");
    }, 4000);
  };

  // Helper: Toggle Secret Visibility
  const toggleSecretVisibility = (id: string) => {
    setVisibleSecrets(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Helper: Copy to Clipboard
  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    triggerFeedback(`Copiado para a área de transferência: ${label}!`, "success");
  };

  // Basic Auth Base64 Encoder
  const getBasicAuthHeaderValue = (clientId: string, clientSecret: string) => {
    const raw = `${clientId}:${clientSecret}`;
    // Fallback simple base64 implementation safely working in browser environment
    try {
      return `Basic ${btoa(raw)}`;
    } catch (e) {
      return `Basic ${raw}`; // fallback
    }
  };

  // Handler to toggle visibility of existing external API Secret
  const toggleExtSecretVisibility = (id: string) => {
    setVisibleExtSecrets(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Handler to create external credential
  const handleCreateExternalCredential = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExtName.trim()) {
      triggerFeedback("O nome do serviço/integração é obrigatório.", "error");
      return;
    }
    if (!newExtApiKey.trim()) {
      triggerFeedback("A API Key é obrigatória.", "error");
      return;
    }
    if (!newExtApiSecret.trim()) {
      triggerFeedback("O API Secret é obrigatório.", "error");
      return;
    }

    const newCred: ExternalCredential = {
      id: `ext_${Date.now()}`,
      name: newExtName.trim(),
      apiKey: newExtApiKey.trim(),
      apiSecret: newExtApiSecret.trim(),
      environment: newExtEnv,
      status: "Active",
      created: new Date().toISOString().split("T")[0]
    };

    setExternalCreds(prev => [...prev, newCred]);
    setNewExtName("");
    setNewExtApiKey("");
    setNewExtApiSecret("");
    setNewExtEnv("sandbox");
    setVisibleNewExtSecret(false);
    triggerFeedback(`Credencial externa para "${newCred.name}" criada com sucesso!`, "success");
  };

  // Handler to toggle status (Active/Inactive) of external credential
  const handleToggleExternalStatus = (id: string) => {
    setExternalCreds(prev => prev.map(c => {
      if (c.id === id) {
        return { ...c, status: c.status === "Active" ? "Inactive" : "Active" };
      }
      return c;
    }));
    triggerFeedback("Estado da credencial externa atualizado.", "success");
  };

  // Handler to toggle environment (Sandbox/Produção) of external credential
  const handleToggleExternalEnv = (id: string) => {
    setExternalCreds(prev => prev.map(c => {
      if (c.id === id) {
        const nextEnv = c.environment === "sandbox" ? "producao" : "sandbox";
        return { ...c, environment: nextEnv };
      }
      return c;
    }));
    triggerFeedback("Ambiente da credencial externa alternado.", "success");
  };

  // Handler to delete external credential
  const handleDeleteExternalCredential = (id: string) => {
    const cred = externalCreds.find(c => c.id === id);
    if (!cred) return;
    if (window.confirm(`Deseja mesmo eliminar as credenciais de "${cred.name}"?`)) {
      setExternalCreds(prev => prev.filter(c => c.id !== id));
      triggerFeedback(`Credenciais de "${cred.name}" eliminadas.`, "success");
    }
  };

  // Export configurations to a JSON file (Complete Backup)
  const handleExportFullConfig = () => {
    try {
      const backupData = {
        exportedAt: new Date().toISOString(),
        system: "KwanzaMóvel SPTR Gateway",
        version: "2026.1",
        endpoints: endpoints,
        webhooks: webhooks,
        retryPolicy: {
          maxRetries: whMaxRetries,
          initialBackoffMs: whInitialBackoff
        },
        externalCredentials: externalCreds
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `sptr-gateway-backup-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      triggerFeedback("Cópia de segurança (JSON) exportada com sucesso!", "success");
    } catch (err) {
      triggerFeedback("Erro ao exportar as configurações.", "error");
    }
  };

  const handleExportEndpointsOnly = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(endpoints, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `sptr-endpoints-only-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      triggerFeedback("Endpoints de API exportados com sucesso!", "success");
    } catch (err) {
      triggerFeedback("Erro ao exportar endpoints de API.", "error");
    }
  };

  const handleExportRetryPoliciesOnly = () => {
    try {
      const retryConfig = {
        maxRetries: whMaxRetries,
        initialBackoffMs: whInitialBackoff,
        webhooksCount: webhooks.length,
        webhooks: webhooks.map(w => ({
          bankCode: w.bankCode,
          webhookUrl: w.webhookUrl,
          isActive: w.isActive
        }))
      };
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(retryConfig, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `sptr-retry-policies-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      triggerFeedback("Políticas de retentativa exportadas com sucesso!", "success");
    } catch (err) {
      triggerFeedback("Erro ao exportar políticas de retentativa.", "error");
    }
  };

  // Import configurations from JSON
  const handleImportConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const file = e.target.files?.[0];
    if (!file) return;

    fileReader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        
        // Let's check what kind of file is this
        if (parsed.system === "KwanzaMóvel SPTR Gateway" || parsed.endpoints) {
          // If complete full backup
          if (parsed.endpoints && Array.isArray(parsed.endpoints)) {
            setEndpoints(parsed.endpoints);
          }
          if (parsed.webhooks && Array.isArray(parsed.webhooks)) {
            setWebhooks(parsed.webhooks);
          }
          if (parsed.retryPolicy) {
            if (typeof parsed.retryPolicy.maxRetries === "number") {
              setWhMaxRetries(parsed.retryPolicy.maxRetries);
            }
            if (typeof parsed.retryPolicy.initialBackoffMs === "number") {
              setWhInitialBackoff(parsed.retryPolicy.initialBackoffMs);
            }
          }
          if (parsed.externalCredentials && Array.isArray(parsed.externalCredentials)) {
            setExternalCreds(parsed.externalCredentials);
          }
          triggerFeedback("Configuração restaurada com sucesso do ficheiro de backup!", "success");
        } else if (Array.isArray(parsed) && parsed.length > 0 && "path" in parsed[0]) {
          // It's endpoints array only
          setEndpoints(parsed);
          triggerFeedback("Endpoints de API importados e atualizados!", "success");
        } else if (parsed.maxRetries !== undefined || parsed.initialBackoffMs !== undefined) {
          // It's retry policies only
          if (typeof parsed.maxRetries === "number") setWhMaxRetries(parsed.maxRetries);
          if (typeof parsed.initialBackoffMs === "number") setWhInitialBackoff(parsed.initialBackoffMs);
          triggerFeedback("Políticas de retentativa e Webhooks atualizadas!", "success");
        } else {
          triggerFeedback("Formato JSON desconhecido ou inválido.", "error");
        }
      } catch (err) {
        triggerFeedback("Falha ao analisar o arquivo JSON selecionado.", "error");
      }
    };
    fileReader.readAsText(file);
    // Clear input so same file can be loaded again if needed
    e.target.value = "";
  };

  // Simulate an incoming API request log
  const handleSimulateIncomingRequest = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Choose randomized or selected latency
    const latency = Math.floor(Math.random() * 200) + 15; // 15ms - 215ms
    const sizes = ["0.8 KB", "1.2 KB", "2.5 KB", "5.1 KB", "15.0 KB"];
    const payloadSize = sizes[Math.floor(Math.random() * sizes.length)];
    
    // Check security status based on status and AML trigger
    let check: "APPROVED" | "AML_WARNING" | "BLOCKED" = "APPROVED";
    if (simAuditStatus === 401 || simAuditStatus === 403) {
      check = "BLOCKED";
    } else if (amlCheckActive && simAuditEndpoint.includes("private") && Math.random() > 0.5) {
      check = "AML_WARNING";
    }

    const newLog: ApiAuditLog = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      endpoint: simAuditEndpoint,
      method: simAuditEndpoint.includes("compensar") || simAuditEndpoint.includes("liquidar") ? "POST" : "GET",
      source: simAuditSource,
      status: simAuditStatus,
      latencyMs: latency,
      payloadSize,
      securityCheck: check
    };

    setApiAuditLogs(prev => [newLog, ...prev]);
    
    if (check === "BLOCKED") {
      triggerFeedback(`[BLOQUEIO] Tentativa de acesso bloqueada por segurança de borda!`, "error");
    } else if (check === "AML_WARNING") {
      triggerFeedback(`[ALERTA AML] Transação síncrona sob monitoria do BNA detectada!`, "info");
    } else {
      triggerFeedback(`[SUCESSO] Requisição simulada com sucesso (HTTP ${simAuditStatus})`, "success");
    }
  };

  // Export API audit logs as CSV
  const handleExportAuditLogsCsv = () => {
    try {
      const headers = ["ID", "Timestamp", "Endpoint", "Method", "Source", "Status", "Latency(ms)", "PayloadSize", "SecurityCheck"];
      const rows = apiAuditLogs.map(log => [
        log.id,
        log.timestamp,
        log.endpoint,
        log.method,
        log.source,
        log.status,
        log.latencyMs,
        log.payloadSize,
        log.securityCheck
      ]);

      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", encodeURI(csvContent));
      downloadAnchor.setAttribute("download", `sptr-api-audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      triggerFeedback("Logs de auditoria exportados com sucesso em CSV!", "success");
    } catch (err) {
      triggerFeedback("Erro ao exportar logs em CSV.", "error");
    }
  };

  // Export API audit logs as JSON
  const handleExportAuditLogsJson = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(apiAuditLogs, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `sptr-api-audit-logs-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      triggerFeedback("Logs de auditoria exportados com sucesso em JSON!", "success");
    } catch (err) {
      triggerFeedback("Erro ao exportar logs em JSON.", "error");
    }
  };

  // Clear all API audit logs
  const handleClearAuditLogs = () => {
    if (window.confirm("Deseja eliminar de forma permanente todos os logs de auditoria de APIs em cache local?")) {
      setApiAuditLogs([]);
      triggerFeedback("Todos os logs de auditoria foram eliminados do cache local.", "success");
    }
  };

  // API Manager: Create Credential
  const handleCreateCredential = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCredName.trim()) {
      triggerFeedback("O nome do integrador é obrigatório.", "error");
      return;
    }

    const cleanName = newCredName.trim();
    // Check if duplicate name
    if (credentials.some(c => c.name.toLowerCase() === cleanName.toLowerCase())) {
      triggerFeedback("Já existe um integrador registado com este nome.", "error");
      return;
    }

    const prefix = newCredType === "banco" ? "bnc" : "tel";
    const randPart1 = Math.floor(1000 + Math.random() * 9000);
    const randPart2 = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    const newCred: ApiCredential = {
      id: `cred_${Date.now()}`,
      type: newCredType,
      name: cleanName,
      clientId: `${prefix}_client_${randPart1}`,
      clientSecret: `${prefix}_secret_${randPart2}`,
      status: "Active",
      created: new Date().toISOString().split("T")[0]
    };

    setCredentials(prev => [...prev, newCred]);
    setNewCredName("");
    triggerFeedback(`Chaves de API Basic Auth criadas para ${cleanName}!`, "success");
  };

  // API Manager: Toggle Status of Credential
  const handleToggleCredentialStatus = (id: string) => {
    setCredentials(prev => prev.map(c => {
      if (c.id === id) {
        const nextStatus = c.status === "Active" ? "Inactive" : "Active";
        return { ...c, status: nextStatus };
      }
      return c;
    }));
    triggerFeedback("Estado do integrador atualizado.", "success");
  };

  // API Manager: Delete Credential
  const handleDeleteCredential = (id: string) => {
    const cred = credentials.find(c => c.id === id);
    if (!cred) return;
    if (window.confirm(`Tem a certeza de que deseja eliminar o integrador "${cred.name}" e revogar todas as credenciais?`)) {
      setCredentials(prev => prev.filter(c => c.id !== id));
      triggerFeedback(`Integrador "${cred.name}" foi desassociado com sucesso.`, "success");
      if (playgroundCredId === id) {
        const remaining = credentials.filter(c => c.id !== id);
        if (remaining.length > 0) {
          setPlaygroundCredId(remaining[0].id);
        }
      }
    }
  };

  // Webhooks: Create Webhook Configuration
  const handleCreateWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWhUrl.trim()) {
      triggerFeedback("A URL de callback do Webhook é obrigatória.", "error");
      return;
    }
    if (!newWhUrl.trim().startsWith("http://") && !newWhUrl.trim().startsWith("https://")) {
      triggerFeedback("A URL do Webhook deve iniciar com http:// ou https://.", "error");
      return;
    }
    if (!newWhSecret.trim()) {
      triggerFeedback("A chave secreta de assinatura é obrigatória.", "error");
      return;
    }

    const bankNameMap: Record<string, string> = {
      BAI: "Banco BAI",
      BFA: "BFA (Fomento Angola)",
      BIC: "Banco BIC",
      SOL: "Banco Sol",
      BCI: "Banco de Comércio e Indústria",
      KEVE: "Banco Keve"
    };

    const newWh: BankWebhook = {
      id: `wh_${Date.now()}`,
      bankCode: newWhBankCode,
      bankName: bankNameMap[newWhBankCode] || `Banco ${newWhBankCode}`,
      webhookUrl: newWhUrl.trim(),
      secretKey: newWhSecret.trim(),
      events: newWhEvents,
      isActive: true,
      contentType: newWhContentType
    };

    setWebhooks(prev => [...prev, newWh]);
    setNewWhUrl("");
    setNewWhSecret("");
    setNewWhEvents(["transaction.settled"]);
    triggerFeedback(`Webhook para ${newWh.bankName} configurado com sucesso!`, "success");
  };

  // Webhooks: Delete Webhook
  const handleDeleteWebhook = (id: string) => {
    const wh = webhooks.find(w => w.id === id);
    if (!wh) return;
    if (window.confirm(`Tem a certeza que deseja eliminar o Webhook de retorno para o ${wh.bankName}?`)) {
      setWebhooks(prev => prev.filter(w => w.id !== id));
      triggerFeedback(`Webhook de ${wh.bankName} removido.`, "success");
    }
  };

  // Webhooks: Toggle Active Status
  const handleToggleWebhookStatus = (id: string) => {
    setWebhooks(prev => prev.map(w => {
      if (w.id === id) {
        return { ...w, isActive: !w.isActive };
      }
      return w;
    }));
    triggerFeedback("Estado do Webhook atualizado.", "success");
  };

  // Webhooks: Run Webhook Simulation with Live Feed
  const handleRunWebhookSimulation = (targetWhId: string) => {
    const wh = webhooks.find(w => w.id === targetWhId);
    if (!wh) {
      triggerFeedback("Selecione um webhook válido para simular.", "error");
      return;
    }
    if (!wh.isActive) {
      triggerFeedback("Não é possível simular um webhook inativo.", "error");
      return;
    }

    setWhSimId(targetWhId);
    setWhSimRunning(true);
    setWhSimStatus(null);
    setWhSimPayload("");
    
    const logs: string[] = [];
    logs.push(`[SIMULADOR SPTR] Detectada liquidação de transação em tempo real pelo Banco Central.`);
    logs.push(`[SIMULADOR SPTR] Buscando configurações de retorno para o banco comercial "${wh.bankName}" (${wh.bankCode})...`);
    setWhSimLogs([...logs]);

    const computedSignature = Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join("");
    let finalPayloadString = "";

    // Check if the URL is configured to fail
    const isFailure404 = wh.webhookUrl.includes("404");
    const isFailure500 = wh.webhookUrl.includes("500");
    const targetStatus = isFailure404 ? 404 : isFailure500 ? 500 : 200;

    const executeAttempt = (attempt: number) => {
      logs.push(`[CONEXÃO] [Tentativa ${attempt}/${whMaxRetries}] Efetuando chamada HTTP POST em: ${wh.webhookUrl}`);
      setWhSimLogs([...logs]);

      setTimeout(() => {
        logs.push(`[REDE] Transmitindo pacotes criptografados...`);
        setWhSimLogs([...logs]);

        setTimeout(() => {
          if (targetStatus === 200) {
            // Success
            logs.push(`[REDE] Resposta do Servidor Recebida: HTTP 200 OK`);
            logs.push(`[SPTR-NOTIFIER] A notificação síncrona foi confirmada e entregue ao ${wh.bankName}.`);
            setWhSimLogs([...logs]);
            setWhSimStatus(200);
            setWhSimRunning(false);

            setWebhooks(prev => prev.map(w => {
              if (w.id === wh.id) {
                return {
                  ...w,
                  lastTriggered: new Date().toISOString(),
                  lastResponseStatus: "200 OK"
                };
              }
              return w;
            }));
            recordWebhookSimulationResult(200);

            // Record in Webhook Audit Logs
            const newAuditLog: WebhookAuditLog = {
              id: `wh_audit_${Date.now()}`,
              timestamp: new Date().toISOString(),
              endpoint: wh.webhookUrl,
              method: "POST",
              bankName: wh.bankName,
              bankCode: wh.bankCode,
              payload: finalPayloadString,
              signature: computedSignature,
              status: 200,
              statusText: "OK",
              attempt: attempt
            };
            setWebhookAuditLogs(prev => [newAuditLog, ...prev].slice(0, 20));

            triggerFeedback(`Simulação de Webhook para ${wh.bankName} enviada com sucesso!`, "success");
          } else {
            // Failure
            logs.push(`[FALHA] Erro na transmissão: HTTP ${targetStatus} ${targetStatus === 404 ? "Not Found" : "Internal Server Error"}`);
            setWhSimLogs([...logs]);

            if (attempt < whMaxRetries) {
              const backoffTime = whInitialBackoff * Math.pow(2, attempt - 1);
              logs.push(`[POLÍTICA DE RETENTATIVA] Aplicando recuo exponencial (backoff) de ${(backoffTime / 1000).toFixed(1)}s antes de tentar novamente...`);
              setWhSimLogs([...logs]);

              setTimeout(() => {
                executeAttempt(attempt + 1);
              }, backoffTime);
            } else {
              logs.push(`[ERRO CRÍTICO] Esgotadas todas as ${whMaxRetries} tentativas permitidas pela política.`);
              logs.push(`[SPTR-NOTIFIER] Transmissão falhou. Payload guardado na fila de reenvio DLQ.`);
              setWhSimLogs([...logs]);
              setWhSimStatus(targetStatus);
              setWhSimRunning(false);

              setWebhooks(prev => prev.map(w => {
                if (w.id === wh.id) {
                  return {
                    ...w,
                    lastTriggered: new Date().toISOString(),
                    lastResponseStatus: `${targetStatus} Erro`
                  };
                }
                return w;
              }));
              recordWebhookSimulationResult(targetStatus);

              // Record in Webhook Audit Logs on ultimate failure
              const newAuditLog: WebhookAuditLog = {
                id: `wh_audit_${Date.now()}`,
                timestamp: new Date().toISOString(),
                endpoint: wh.webhookUrl,
                method: "POST",
                bankName: wh.bankName,
                bankCode: wh.bankCode,
                payload: finalPayloadString,
                signature: computedSignature,
                status: targetStatus,
                statusText: targetStatus === 404 ? "Not Found" : "Internal Server Error",
                attempt: attempt
              };
              setWebhookAuditLogs(prev => [newAuditLog, ...prev].slice(0, 20));

              triggerFeedback(`Transmissão de Webhook falhou após ${whMaxRetries} tentativas.`, "error");
            }
          }
        }, 1000);
      }, 800);
    };

    setTimeout(() => {
      logs.push(`[RESOLUÇÃO DNS] Resolvendo Host: ${wh.webhookUrl.split("/")[2] || "api-banco"}`);
      logs.push(`[RESOLUÇÃO DNS] IP resolvido com sucesso. Certificados TLS mTLS do Banco validados.`);
      setWhSimLogs([...logs]);

      setTimeout(() => {
        // Generate mock transaction data
        const txId = `TX-SETTLE-${Math.floor(100000 + Math.random() * 900000)}`;
        const amount = Math.floor(150000 + Math.random() * 3000000);
        const refSptr = `pacs.008.001.08.${Math.random().toString(36).substring(2, 8)}`;
        
        // Mock payload
        const payloadObj = {
          event: wh.events[0] || "transaction.settled",
          timestamp: new Date().toISOString(),
          webhook_id: wh.id,
          payload: {
            transacao_id: txId,
            banco_codigo: wh.bankCode,
            montante_aoa: amount,
            moeda: "AOA",
            referencia_sptr: refSptr,
            data_liquidacao: new Date().toISOString().split("T")[0],
            canal: "KWANZAMÓVEL_SPTR"
          },
          signing_algorithm: "hmac-sha256"
        };
        
        finalPayloadString = JSON.stringify(payloadObj, null, 2);
        setWhSimPayload(finalPayloadString);

        logs.push(`[CRIPTOGRAFIA] Gerando assinatura HMAC SHA256 usando a chave secreta correspondente...`);
        logs.push(`[CRIPTOGRAFIA] Assinatura calculada: x-kwanzamovel-signature-256=${computedSignature}`);
        setWhSimLogs([...logs]);

        executeAttempt(1);
      }, 1000);
    }, 800);
  };
  
  // Webhooks: Test Connection with Mock Ping (GET)
  const handleTestConnection = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!newWhUrl.trim()) {
      triggerFeedback("A URL de callback é necessária para testar a conexão.", "error");
      return;
    }
    if (!newWhUrl.trim().startsWith("http://") && !newWhUrl.trim().startsWith("https://")) {
      triggerFeedback("A URL do Webhook deve iniciar com http:// ou https://.", "error");
      return;
    }

    setWhTestRunning(true);
    setWhTestResult(null);

    setTimeout(() => {
      const isSuccess = !newWhUrl.toLowerCase().includes("error") && 
                        !newWhUrl.toLowerCase().includes("fail") &&
                        !newWhUrl.toLowerCase().includes("404") &&
                        !newWhUrl.toLowerCase().includes("500");
                        
      let status = 200;
      let statusText = "OK";
      let details = "Conexão de teste estabelecida com sucesso! O endpoint de destino respondeu à chamada GET ping de verificação com cabeçalhos HTTP padrão de interoperabilidade.";
      
      if (newWhUrl.toLowerCase().includes("404")) {
        status = 404;
        statusText = "Not Found";
        details = "O servidor de destino foi contactado, mas a rota específica do Webhook não existe (404 Not Found). Verifique se o caminho do callback está correto.";
      } else if (newWhUrl.toLowerCase().includes("500")) {
        status = 500;
        statusText = "Internal Server Error";
        details = "O servidor de destino respondeu com erro interno de aplicação (500 Internal Server Error). Verifique a consistência do servidor recetor.";
      } else if (!isSuccess) {
        status = 502;
        statusText = "Bad Gateway";
        details = "Falha de rede ou DNS: O gateway do KwanzaMóvel não conseguiu resolver o host ou estabelecer túnel seguro mTLS para o destino.";
      }

      setWhTestResult({
        status,
        statusText,
        latency: Math.floor(40 + Math.random() * 110),
        success: isSuccess,
        timestamp: new Date().toISOString(),
        details
      });
      setWhTestRunning(false);
      
      if (isSuccess) {
        triggerFeedback("Teste de conexão concluído com sucesso: 200 OK!", "success");
      } else {
        triggerFeedback(`O teste de conexão falhou com código de status: ${status} ${statusText}`, "error");
      }
    }, 1400);
  };

  // Enterprise Architecture Flow Steps definitions
  const archFlowSteps = [
    {
      title: "1. Edge Handshake (Envoy Proxy / WAF)",
      actor: "Dispositivo do Utilizador ──> Envoy API Gateway",
      description: "A app móvel ou integrador inicia uma ligação protegida por TLS 1.3. O Web Application Firewall (WAF) corporativo inspeciona assinaturas mTLS, rate limits por IP e autenticação Basic Auth contra as credenciais registadas no gateway do BNA.",
      log: "Handshake TLS 1.3 estabelecido: ECDHE-RSA-AES256-GCM-SHA384 (256-bit). Validando rate limit IP: 100 req/s. Assinatura de cabeçalho descodificada com sucesso. mTLS válido."
    },
    {
      title: "2. Broker Event Queue (Kafka/Redpanda Clustered)",
      actor: "Envoy Gateway ──> Redpanda High-Throughput Broker",
      description: "A requisição de pagamento é convertida num evento síncrono estruturado (pacs.008) serializado em Protocol Buffers (gRPC) e enviada para o cluster redundante de Redpanda/Kafka. Garante amortecimento em picos de volume extremo sem perda de pacotes.",
      log: "Evento de transação serializado com Protobuf. Publicado com sucesso no tópico distribuído 'sptr.pacs008.v1'. Replicação síncrona iniciada. ACK recebido de 3 réplicas em 4ms."
    },
    {
      title: "3. Double-Entry Immutable Ledger Core (Rust Engine)",
      actor: "Redpanda ──> Double-Entry Ledger Core en Rust",
      description: "O motor ultra-rápido de ledger escrito em Rust lê a fila de transações, realiza a contabilidade de partida dobrada (Double-Entry Bookkeeping) com serializabilidade estrita ACID e assina digitalmente o bloco ligando ao hash do bloco anterior (SHA-256 Append-Only).",
      log: "Balanço debitado/creditado atomicamente. Verificação de saldos completada com sucesso. Calculando hash do bloco encadeado... Assinado digitalmente via HSM. Bloco imutável persistido."
    },
    {
      title: "4. Webhook Real-time Callback Delivery",
      actor: "KwanzaMóvel Gateway ──> Webhooks dos Bancos Comerciais",
      description: "Após a consolidação imutável no ledger, o transmissor de webhooks do BNA dispara uma notificação automática HTTP POST criptografada com assinatura HMAC SHA256 no header x-kwanzamovel-signature-256 para o endpoint de callback configurado do banco recetor.",
      log: "Iniciando transmissão de Webhook... Assinatura HMAC-SHA256 gerada usando a chave simétrica correspondente. Conexão HTTP POST iniciada com Banco Comercial. Servidor de destino retornou HTTP 200 OK."
    }
  ];

  const handlePlayArchFlow = () => {
    if (archFlowPlaying) return;
    setArchFlowPlaying(true);
    setArchFlowStep(0);
    const logs: string[] = [
      `[SIMULADOR ENTERPRISE] Iniciando fluxo de transação em larga escala...`,
      `[SIMULADOR ENTERPRISE] Orquestrador do Ledger Ativo.`
    ];
    setArchConsoleLogs([...logs]);
    
    const runStep = (stepIdx: number) => {
      if (stepIdx >= 4) {
        setArchFlowPlaying(false);
        triggerFeedback("Fluxo de Transação Enterprise executado com absoluto sucesso!", "success");
        return;
      }
      setArchFlowStep(stepIdx);
      const step = archFlowSteps[stepIdx];
      
      setTimeout(() => {
        logs.push(`\n[ETAPA ${stepIdx + 1}] ${step.title.toUpperCase()}`);
        logs.push(`>> LIGAÇÃO: ${step.actor}`);
        logs.push(`>> CONSOLE: ${step.log}`);
        logs.push(`>> STATUS: OK`);
        setArchConsoleLogs([...logs]);
        
        runStep(stepIdx + 1);
      }, 1500);
    };

    runStep(0);
  };

  const handleCalculateEnterpriseSignature = (e: React.FormEvent) => {
    e.preventDefault();
    if (!archCryptText.trim()) {
      triggerFeedback("O texto do payload é obrigatório para calcular a assinatura.", "error");
      return;
    }
    setArchCryptRunning(true);
    setArchCryptSignature("");
    
    setTimeout(() => {
      let hash = 0;
      const str = archCryptText + "_KwanzaMóvelEnterpriseSecretKey2026_Directiva04BNA_HSM_Module";
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
      }
      const hexSignature = "hsm_secp256k1_ecdsa_sig_sha256_" + Math.abs(hash).toString(16) + Array.from({length: 16}, () => Math.floor(Math.random()*16).toString(16)).join("");
      setArchCryptSignature(hexSignature);
      setArchCryptRunning(false);
      triggerFeedback("Assinatura Criptográfica de Larga Escala calculada via HSM!", "success");
    }, 1000);
  };

  // API Manager: Create Endpoint
  const handleCreateEndpoint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEpName.trim() || !newEpPath.trim()) {
      triggerFeedback("Nome e Path do Endpoint são obrigatórios.", "error");
      return;
    }

    // Basic path validation
    let path = newEpPath.trim();
    if (!path.startsWith("/")) {
      path = "/" + path;
    }

    let defaultSuccess = "{\n  \"status\": \"SUCCESS\"\n}";
    if (newEpResponseSuccess.trim()) {
      try {
        JSON.parse(newEpResponseSuccess);
        defaultSuccess = newEpResponseSuccess;
      } catch (err) {
        triggerFeedback("O JSON do Template de Resposta de Sucesso é inválido.", "error");
        return;
      }
    }

    let defaultBody = "";
    if (newEpRequestBody.trim()) {
      try {
        JSON.parse(newEpRequestBody);
        defaultBody = newEpRequestBody;
      } catch (err) {
        triggerFeedback("O JSON do Corpo da Requisição é inválido.", "error");
        return;
      }
    }

    const newEp: ApiEndpoint = {
      id: `ep_${Date.now()}`,
      name: newEpName.trim(),
      path,
      method: newEpMethod,
      type: newEpType,
      segment: newEpSegment,
      description: newEpDescription.trim() || "Sem descrição disponível.",
      headers: [
        { key: "Content-Type", value: "application/json" }
      ],
      requestBody: defaultBody,
      responseTemplateSuccess: defaultSuccess,
      responseTemplateUnauthorized: newEpType === "private" ? JSON.stringify({
        error: "Unauthorized",
        code: 401,
        message: "O cabeçalho 'Authorization: Basic <token>' está incorreto ou a credencial está inativa."
      }, null, 2) : undefined,
      requiresAuth: newEpType === "private",
      authType: "Basic"
    };

    setEndpoints(prev => [...prev, newEp]);
    setSelectedEndpointId(newEp.id);
    
    // Reset form states
    setNewEpName("");
    setNewEpPath("");
    setNewEpDescription("");
    setNewEpRequestBody("");
    setNewEpResponseSuccess("");
    setIsAddingEndpoint(false);

    triggerFeedback(`Novo endpoint "${newEp.name}" publicado na Sandbox!`, "success");
  };

  // API Manager: Delete Endpoint
  const handleDeleteEndpoint = (id: string) => {
    const ep = endpoints.find(e => e.id === id);
    if (!ep) return;
    if (endpoints.length <= 1) {
      triggerFeedback("Não pode remover o único endpoint restante. É necessário manter ao menos um.", "error");
      return;
    }
    if (window.confirm(`Pretende remover definitivamente o endpoint "${ep.name}"?`)) {
      const remaining = endpoints.filter(e => e.id !== id);
      setEndpoints(remaining);
      setSelectedEndpointId(remaining[0].id);
      triggerFeedback(`Endpoint "${ep.name}" removido.`, "success");
    }
  };

  // Run Sandbox Request Simulation
  const handleRunPlayground = () => {
    const activeEp = endpoints.find(e => e.id === selectedEndpointId);
    if (!activeEp) return;

    setPlaygroundRunning(true);
    setPlaygroundHttpStatus(null);
    setPlaygroundResponse("");
    setPlaygroundLogs(["[REQUISITOR] Preparando envio de pacote criptográfico TLS 1.3..."]);

    const reqLogs = [
      `[MÉTODO/ROTA] ${activeEp.method} https://api.kwanzamovel.gov.ao${activeEp.path}`,
      `[REQUISITO] Acesso classificado como: ${activeEp.type.toUpperCase()}`
    ];

    setTimeout(() => {
      // Step 2: Validate Authentication
      let isAuthenticated = true;
      let usedAuthHeader = "";
      let authCheckLog = "";

      if (activeEp.requiresAuth) {
        if (useCustomAuthHeader) {
          usedAuthHeader = playgroundCustomAuth.trim();
          authCheckLog = `[AUTH CHECK] Analisando header personalizado do usuário: "${usedAuthHeader.substring(0, 15)}..."`;
        } else {
          const matchedCred = credentials.find(c => c.id === playgroundCredId);
          if (matchedCred) {
            if (matchedCred.status !== "Active") {
              isAuthenticated = false;
              authCheckLog = `[ALERTA DE SEGURANÇA] Credencial matched "${matchedCred.name}" está com estado INATIVO no gateway BNA.`;
            } else {
              usedAuthHeader = getBasicAuthHeaderValue(matchedCred.clientId, matchedCred.clientSecret);
              authCheckLog = `[AUTH CHECK] Gerado automaticamente Header Basic Auth para integrador "${matchedCred.name}": "${usedAuthHeader.substring(0, 20)}..."`;
            }
          } else {
            isAuthenticated = false;
            authCheckLog = "[ALERTA DE SEGURANÇA] Nenhuma credencial selecionada no seletor de sandbox.";
          }
        }

        // Verify authenticity
        if (isAuthenticated) {
          // Verify if usedAuthHeader matches any active credential's correct basic auth value
          const matchedToken = credentials.filter(c => c.status === "Active").some(c => {
            const correctToken = getBasicAuthHeaderValue(c.clientId, c.clientSecret);
            return correctToken === usedAuthHeader;
          });

          if (!matchedToken) {
            isAuthenticated = false;
            reqLogs.push("[COMPLIANCE/MFA] Decodificação de Basic Auth falhou ou as credenciais fornecidas não constam na base reguladora.");
          } else {
            reqLogs.push("[COMPLIANCE/MFA] Chave Básica (Basic Auth) descriptografada com sucesso. Assinatura mTLS validada.");
          }
        }
      } else {
        authCheckLog = "[AUTH CHECK] Endpoint classificado como público. Autenticação dispensada pelo Banco Central de Angola.";
      }

      reqLogs.push(authCheckLog);

      setTimeout(() => {
        // Step 3: Body & Payload checks
        if (activeEp.method === "POST" || activeEp.method === "PUT") {
          const bodyToTest = playgroundRequestBody.trim() || activeEp.requestBody;
          if (bodyToTest) {
            try {
              JSON.parse(bodyToTest);
              reqLogs.push("[ANALISADOR JSON] Payload de dados validado sintaticamente sem erros estruturais.");
            } catch (err) {
              reqLogs.push("[ERRO DE CONVERSÃO] Falha crítica de parsing: JSON do corpo está malformado.");
              setPlaygroundHttpStatus(400);
              setPlaygroundResponse(JSON.stringify({
                error: "Bad Request",
                code: 400,
                message: "O corpo da requisição (Request Body) não é um JSON válido."
              }, null, 2));
              setPlaygroundLogs(prev => [...prev, ...reqLogs, "[FIM] Pedido abortado devido a erro de sintaxe."]);
              setPlaygroundRunning(false);
              return;
            }
          }
        }

        // Step 4: Finalize execution and response
        setTimeout(() => {
          if (isAuthenticated) {
            reqLogs.push("[CONEXÃO] Ligação com o SPTR (Sistema de Pagamentos em Tempo Real) estabelecida.");
            reqLogs.push("[BNA ENGINE] Consolidação e conciliação completadas. HTTP 200 OK.");
            setPlaygroundHttpStatus(200);
            
            // Format dynamic response or return default template
            const resp = activeEp.responseTemplateSuccess;
            setPlaygroundResponse(resp);
          } else {
            reqLogs.push("[SEGURANÇA] Falha no Handshake de Autenticação. Acesso negado. HTTP 401 Unauthorized.");
            setPlaygroundHttpStatus(401);
            setPlaygroundResponse(activeEp.responseTemplateUnauthorized || JSON.stringify({
              error: "Unauthorized",
              code: 401,
              message: "Chaves de autenticação básica inválidas ou ausentes."
            }, null, 2));
          }

          setPlaygroundLogs(prev => [...prev, ...reqLogs, "[PROCESSO CONCLUÍDO] Pacotes encerrados."]);
          setPlaygroundRunning(false);
        }, 600);
      }, 500);
    }, 450);
  };

  // Filtered Endpoints List
  const activeEndpoint = endpoints.find(e => e.id === selectedEndpointId) || endpoints[0];

  const filteredEndpoints = endpoints.filter(ep => {
    const matchesSearch = ep.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          ep.path.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          ep.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = tabFilter === "todos" || ep.type === tabFilter;
    const matchesSegment = segmentFilter === "todos" || ep.segment === segmentFilter;
    return matchesSearch && matchesTab && matchesSegment;
  });

  return (
    <div id="api_manager_portal" className="bg-[#0c0806] border-2 border-amber-900/15 rounded-2xl p-5 space-y-5 text-white animate-fade-in">
      
      {/* HEADER ROW */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-amber-900/15 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-500/10 border border-amber-500/25 rounded-lg text-amber-500">
              <Code className="w-5 h-5 animate-pulse" />
            </span>
            <h2 className="text-sm font-extrabold uppercase tracking-widest text-white">
              Central de APIs & Interoperabilidade
            </h2>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1 font-sans">
            Gerenciamento oficial de endpoints e autenticação Basic Auth para bancos comerciais e operadores móveis angolanos.
          </p>
        </div>

        {/* FEEDBACK BANNER */}
        {feedback && (
          <div className={`px-4 py-2 rounded-xl border font-mono text-[10px] flex items-center gap-2 transition-all ${
            feedbackType === "success" 
              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" 
              : feedbackType === "error" 
              ? "bg-red-500/15 text-red-400 border-red-500/20" 
              : "bg-blue-500/15 text-blue-400 border-blue-500/20"
          }`}>
            <span className="w-2 h-2 rounded-full bg-current animate-ping"></span>
            <span>{feedback}</span>
          </div>
        )}
      </div>

      {/* SECTOR TAB BAR: GATEWAY VS ARCHITECTURE VS SUPERVISAO */}
      <div className="flex border-b border-neutral-900/60 pb-1 font-mono text-[10px] select-none gap-4 overflow-x-auto">
        <button
          onClick={() => setApiSectionTab("gateway")}
          className={`pb-2 px-2 font-black uppercase tracking-wider transition-all relative cursor-pointer whitespace-nowrap ${
            apiSectionTab === "gateway"
              ? "text-amber-500 border-b-2 border-amber-500"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
          id="tab-btn-gateway"
        >
          <span>Canais de Sandbox & Integração</span>
        </button>
        <button
          onClick={() => setApiSectionTab("architecture")}
          className={`pb-2 px-2 font-black uppercase tracking-wider transition-all relative cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            apiSectionTab === "architecture"
              ? "text-amber-500 border-b-2 border-amber-500"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
          id="tab-btn-architecture"
        >
          <Sliders className="w-3.5 h-3.5 text-amber-500" />
          <span>Arquitetura Conceptual Enterprise</span>
          <span className="bg-amber-500/15 text-amber-400 border border-amber-500/25 text-[7px] px-1 rounded uppercase">Nível Corporativo</span>
        </button>
        <button
          onClick={() => setApiSectionTab("supervisao")}
          className={`pb-2 px-2 font-black uppercase tracking-wider transition-all relative cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            apiSectionTab === "supervisao"
              ? "text-amber-500 border-b-2 border-amber-500"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
          id="tab-btn-supervisao"
        >
          <Activity className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
          <span>Supervisão & Auditoria de APIs</span>
          <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 text-[7px] px-1 rounded uppercase">Real-Time</span>
        </button>
        <button
          onClick={() => setApiSectionTab("ultraleve")}
          className={`pb-2 px-2 font-black uppercase tracking-wider transition-all relative cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            apiSectionTab === "ultraleve"
              ? "text-amber-500 border-b-2 border-amber-500"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
          id="tab-btn-ultraleve"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-550" />
          <span>Mapeador & Relatório Ultraleve</span>
          <span className="bg-amber-500/15 text-amber-400 border border-amber-500/25 text-[7px] px-1 rounded uppercase">Next-Gen</span>
        </button>
      </div>

      {apiSectionTab === "gateway" && (
        <>
          {/* SECÇÃO DE BACKUP E PORTABILIDADE */}
          <div className="bg-[#050505] border border-neutral-900/80 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-in">
            <div className="space-y-1 max-w-xl">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-500" />
                <span className="font-extrabold text-[11.5px] uppercase tracking-wider text-white">
                  Backup & Portabilidade de Integração
                </span>
                <span className="bg-[#B87333]/15 text-amber-500 border border-[#B87333]/30 text-[7px] px-1 py-0.2 rounded font-mono uppercase font-bold">SPTR Sandbox Sync</span>
              </div>
              <p className="text-[10px] text-zinc-400 font-sans leading-relaxed">
                Exporte endpoints, credenciais de APIs externas e políticas de retentativa para um ficheiro JSON. Você pode restaurar este ficheiro em qualquer sandbox KwanzaMóvel para portar suas definições instantaneamente.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 w-full md:w-auto font-mono text-[9.5px]">
              {/* Botão de Importar */}
              <label 
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-[#B87333]/10 border border-neutral-800 hover:border-[#B87333]/50 text-zinc-300 hover:text-white rounded-lg transition-all cursor-pointer font-bold w-full sm:w-auto text-center"
                id="import-config-label"
              >
                <Upload className="w-3.5 h-3.5 text-amber-500" />
                <span>Importar Configurações</span>
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={handleImportConfig} 
                  className="hidden" 
                  id="import-config-file-input"
                />
              </label>

              {/* Botão de Exportar Completo */}
              <button
                type="button"
                onClick={handleExportFullConfig}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-[#B87333]/15 border border-[#B87333]/30 hover:border-[#B87333]/60 text-amber-500 hover:text-white rounded-lg transition-all cursor-pointer font-black uppercase tracking-wide w-full sm:w-auto"
                id="export-full-config-btn"
                title="Exporta endpoints, webhooks, credenciais externas e politicas de retentativa"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Backup Completo (JSON)</span>
              </button>

              {/* Menu suspenso de exportações parciais */}
              <div className="relative group w-full sm:w-auto">
                <button
                  type="button"
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-950 hover:bg-zinc-900 border border-neutral-850 hover:border-neutral-750 text-zinc-400 hover:text-zinc-200 rounded-lg transition-all cursor-pointer font-bold w-full sm:w-auto"
                  id="export-partial-menu-btn"
                >
                  <span>Exportações Parciais</span>
                  <ChevronRight className="w-3 h-3 rotate-90" />
                </button>
                <div className="absolute right-0 mt-1 w-52 bg-zinc-950 border border-neutral-900 rounded-lg shadow-2xl py-1 hidden group-hover:block z-50 text-[9px]">
                  <button
                    type="button"
                    onClick={handleExportEndpointsOnly}
                    className="w-full text-left px-3 py-1.5 hover:bg-zinc-900 text-zinc-300 hover:text-white cursor-pointer flex items-center gap-1.5"
                    id="export-endpoints-only-btn"
                  >
                    <Download className="w-3 h-3 text-amber-500" />
                    <span>Apenas Endpoints de API</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportRetryPoliciesOnly}
                    className="w-full text-left px-3 py-1.5 hover:bg-zinc-900 text-zinc-300 hover:text-white cursor-pointer flex items-center gap-1.5"
                    id="export-retry-policies-btn"
                  >
                    <Download className="w-3 h-3 text-amber-500" />
                    <span>Apenas Políticas de Retentativa</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* CREDENTIALS SECTION - ROTATION & MANAGEMENT */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        
        {/* LEFT COLUMN: GESTÃO DE CREDENCIAIS (5 cols) */}
        <div className="xl:col-span-5 space-y-4">
          <div className="bg-[#050505] border border-neutral-900/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-900">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-500" />
                <span className="font-extrabold text-[11px] uppercase tracking-wider text-white">
                  Credenciais de Autenticação Básica
                </span>
              </div>
              <span className="text-[8px] text-zinc-500 font-mono uppercase">Directiva 04/BNA</span>
            </div>

            <p className="text-[10px] text-zinc-400 font-sans leading-relaxed">
              O ecossistema KwanzaMóvel exige que integradores usem o protocolo **HTTP Basic Authentication** codificado em Base64 como primeira camada síncrona de verificação: <code className="text-amber-500 text-[9px] bg-black/40 px-1 rounded">Authorization: Basic base64(client_id:client_secret)</code>.
            </p>

            {/* List of current credentials */}
            <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
              {credentials.map((c) => {
                const isVisible = !!visibleSecrets[c.id];
                const headerValue = getBasicAuthHeaderValue(c.clientId, c.clientSecret);
                return (
                  <div key={c.id} className="bg-zinc-950 p-3 rounded-lg border border-neutral-900/80 space-y-2 text-[10.5px]">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        {c.type === "banco" ? (
                          <Building className="w-3.5 h-3.5 text-zinc-500" />
                        ) : (
                          <Smartphone className="w-3.5 h-3.5 text-zinc-500" />
                        )}
                        <span className="font-bold text-white uppercase text-[10px] tracking-wide">{c.name}</span>
                        <span className="text-[8px] bg-zinc-900 px-1 py-0.2 rounded text-zinc-500 uppercase font-mono">
                          {c.type === "banco" ? "Banco" : "Operador"}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${c.status === "Active" ? "bg-emerald-400 animate-pulse" : "bg-zinc-600"}`}></span>
                        <span className={`text-[8.5px] uppercase font-bold ${c.status === "Active" ? "text-emerald-400" : "text-zinc-500"}`}>
                          {c.status === "Active" ? "Ativa" : "Inativa"}
                        </span>
                      </div>
                    </div>

                    {/* ID / Secrets Details */}
                    <div className="font-mono text-[9px] text-zinc-400 space-y-1 bg-black/45 p-2 rounded border border-neutral-900">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">CLIENT_ID:</span>
                        <span className="select-all text-zinc-300">{c.clientId}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500">CLIENT_SECRET:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="select-all text-zinc-300 font-mono">
                            {isVisible ? c.clientSecret : "••••••••••••••••••••"}
                          </span>
                          <button 
                            onClick={() => toggleSecretVisibility(c.id)} 
                            className="text-zinc-500 hover:text-white cursor-pointer"
                            id={`api-eye-btn-${c.id}`}
                            title="Toggle Visibility"
                          >
                            {isVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Live Auth Token Generator */}
                    <div className="space-y-1 font-mono text-[8.5px]">
                      <span className="text-[#B87333] font-bold block">HEADER DE AUTORIZAÇÃO CORRESPONDENTE:</span>
                      <div className="flex items-center gap-2 bg-[#0c0806] p-1.5 rounded border border-amber-900/10 text-zinc-300">
                        <code className="flex-1 overflow-x-auto whitespace-nowrap scrollbar-none select-all font-mono">
                          {headerValue}
                        </code>
                        <button 
                          onClick={() => copyText(headerValue, `Header ${c.name}`)}
                          className="p-1 bg-zinc-900 hover:bg-zinc-800 rounded border border-neutral-800 text-zinc-400 hover:text-white cursor-pointer transition-all"
                          id={`api-copy-btn-${c.id}`}
                          title="Copiar Token"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Quick credential controls */}
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-[8px] text-zinc-600 font-mono uppercase">Criado em: {c.created}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggleCredentialStatus(c.id)}
                          className={`px-1.5 py-0.5 rounded text-[8px] font-mono cursor-pointer border ${
                            c.status === "Active" 
                              ? "bg-zinc-950 border-neutral-800 text-zinc-400 hover:text-white" 
                              : "bg-emerald-950/20 border-emerald-900/40 text-emerald-400 hover:bg-emerald-900/30"
                          }`}
                          id={`api-status-btn-${c.id}`}
                        >
                          {c.status === "Active" ? "Suspender" : "Ativar"}
                        </button>
                        <button
                          onClick={() => handleDeleteCredential(c.id)}
                          className="px-1.5 py-0.5 bg-red-950/20 border border-red-900/30 rounded text-[8px] font-mono text-red-400 hover:bg-red-950/40 cursor-pointer"
                          id={`api-delete-btn-${c.id}`}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Credential Registration Form */}
            <form onSubmit={handleCreateCredential} className="bg-zinc-950 p-3 rounded-lg border border-neutral-900/80 space-y-2.5">
              <span className="font-extrabold text-[9px] uppercase tracking-wider text-amber-500 block">
                Emitir Novas Credenciais de Integração
              </span>
              
              <div className="grid grid-cols-2 gap-2 font-mono text-[9px]">
                <div className="space-y-1">
                  <label className="text-zinc-500 block">Nome do Integrador:</label>
                  <input
                    type="text"
                    placeholder="ex: Banco BIC, Africell..."
                    value={newCredName}
                    onChange={(e) => setNewCredName(e.target.value)}
                    className="w-full bg-black border border-neutral-850 rounded px-2 py-1 text-white text-[9.5px] font-mono focus:border-amber-900 outline-none"
                    id="new-cred-name-input"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-zinc-500 block">Canal Regulado:</label>
                  <select
                    value={newCredType}
                    onChange={(e) => setNewCredType(e.target.value as "banco" | "operador")}
                    className="w-full bg-black border border-neutral-850 rounded px-2 py-1 text-white text-[9.5px] font-mono focus:border-amber-900 outline-none"
                    id="new-cred-type-select"
                  >
                    <option value="banco">Banco Comercial</option>
                    <option value="operador">Operador Móvel</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-1.5 bg-zinc-900 hover:bg-[#B87333]/15 border border-[#B87333]/30 hover:border-[#B87333]/60 text-amber-500 hover:text-white text-[9px] font-black uppercase tracking-wider rounded transition-all cursor-pointer flex items-center justify-center gap-1 font-mono"
                id="api-submit-cred-btn"
              >
                <Plus className="w-3 h-3" />
                <span>Registrar Integrador e Gerar Chaves</span>
              </button>
            </form>
          </div>

          {/* CREDENCIAIS DE INTEGRAÇÕES EXTERNAS (APIs EXTERNAS) */}
          <div className="bg-[#050505] border border-neutral-900/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-900">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-amber-500" />
                <span className="font-extrabold text-[11px] uppercase tracking-wider text-white">
                  Credenciais de Integrações Externas
                </span>
              </div>
              <span className="text-[8px] text-zinc-500 font-mono uppercase">APIs de Terceiros</span>
            </div>

            <p className="text-[10px] text-zinc-400 font-sans leading-relaxed">
              Gerencie chaves de API e Secrets para comunicação com serviços externos (ex: processamento de pagamentos, gateways de SMS ou serviços de KYC). Alterne entre ambientes e mascare dados confidenciais conforme necessário.
            </p>

            {/* List of current external integration credentials */}
            <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
              {externalCreds.length === 0 ? (
                <div className="text-[9px] text-zinc-650 italic text-center py-4 font-mono">
                  Nenhuma credencial externa configurada. Use o formulário abaixo para adicionar.
                </div>
              ) : (
                externalCreds.map((ec) => {
                  const isVisible = !!visibleExtSecrets[ec.id];
                  return (
                    <div key={ec.id} className="bg-zinc-950 p-3 rounded-lg border border-neutral-900/80 space-y-2 text-[10.5px]">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-amber-500" />
                          <span className="font-bold text-white uppercase text-[10px] tracking-wide">{ec.name}</span>
                          <button
                            type="button"
                            onClick={() => handleToggleExternalEnv(ec.id)}
                            className={`text-[8px] px-1 py-0.2 rounded font-mono uppercase cursor-pointer border ${
                              ec.environment === "sandbox"
                                ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                : "bg-red-500/10 text-red-400 border-red-500/20"
                            }`}
                            id={`ext-env-badge-${ec.id}`}
                            title="Clique para alternar ambiente"
                          >
                            {ec.environment}
                          </button>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${ec.status === "Active" ? "bg-emerald-400 animate-pulse" : "bg-zinc-600"}`}></span>
                          <span className={`text-[8.5px] uppercase font-bold ${ec.status === "Active" ? "text-emerald-400" : "text-zinc-500"}`}>
                            {ec.status === "Active" ? "Ativo" : "Inativo"}
                          </span>
                        </div>
                      </div>

                      {/* API Key / Secret fields with eye toggles */}
                      <div className="font-mono text-[9px] text-zinc-400 space-y-1 bg-black/45 p-2 rounded border border-neutral-900">
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-500">API_KEY:</span>
                          <span className="select-all text-zinc-300 break-all text-right max-w-[70%]">{ec.apiKey}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-500">API_SECRET:</span>
                          <div className="flex items-center gap-1.5 max-w-[70%]">
                            <span className="select-all text-zinc-300 break-all text-right font-mono">
                              {isVisible ? ec.apiSecret : "••••••••••••••••••••"}
                            </span>
                            <button 
                              type="button"
                              onClick={() => toggleExtSecretVisibility(ec.id)} 
                              className="text-zinc-500 hover:text-white cursor-pointer flex-shrink-0"
                              id={`ext-eye-btn-${ec.id}`}
                              title="Mostrar/Ocultar"
                            >
                              {isVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-1 text-[8px] text-zinc-650 font-mono uppercase">
                        <span>Configurado em: {ec.created}</span>
                        <div className="flex gap-2 font-black uppercase">
                          <button
                            type="button"
                            onClick={() => handleToggleExternalStatus(ec.id)}
                            className={`px-1.5 py-0.5 rounded text-[8px] font-mono cursor-pointer border ${
                              ec.status === "Active" 
                                ? "bg-zinc-950 border-neutral-850 text-zinc-400 hover:text-white" 
                                : "bg-emerald-950/20 border-emerald-900/40 text-emerald-400 hover:bg-emerald-900/30"
                            }`}
                            id={`ext-status-btn-${ec.id}`}
                          >
                            {ec.status === "Active" ? "Pausar" : "Ativar"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteExternalCredential(ec.id)}
                            className="px-1.5 py-0.5 bg-red-950/20 border border-red-900/30 rounded text-[8px] font-mono text-red-400 hover:bg-red-950/40 cursor-pointer"
                            id={`ext-delete-btn-${ec.id}`}
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* External Credentials Registration Form */}
            <form onSubmit={handleCreateExternalCredential} className="bg-zinc-950 p-3 rounded-lg border border-neutral-900/80 space-y-2.5">
              <span className="font-extrabold text-[9px] uppercase tracking-wider text-amber-500 block">
                Configurar Nova Conexão de API Externa
              </span>
              
              <div className="grid grid-cols-2 gap-2 font-mono text-[9px]">
                <div className="space-y-1 col-span-2">
                  <label className="text-zinc-500 block">Nome do Serviço / Integração:</label>
                  <input
                    type="text"
                    placeholder="ex: EMIS Gateway, Angola SMS Provider..."
                    value={newExtName}
                    onChange={(e) => setNewExtName(e.target.value)}
                    className="w-full bg-black border border-neutral-850 rounded px-2 py-1 text-white text-[9.5px] font-mono focus:border-amber-900 outline-none"
                    id="ext-cred-name-input"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-500 block font-mono">API Key (Chave Pública):</label>
                  <input
                    type="text"
                    placeholder="ex: pk_live_abc123..."
                    value={newExtApiKey}
                    onChange={(e) => setNewExtApiKey(e.target.value)}
                    className="w-full bg-black border border-neutral-850 rounded px-2 py-1 text-white text-[9.5px] font-mono focus:border-amber-900 outline-none"
                    id="ext-cred-apikey-input"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-500 block font-mono">Ambiente Padrão:</label>
                  <select
                    value={newExtEnv}
                    onChange={(e) => setNewExtEnv(e.target.value as "sandbox" | "producao")}
                    className="w-full bg-black border border-neutral-850 rounded px-2 py-1 text-white text-[9.5px] font-mono focus:border-amber-900 outline-none cursor-pointer h-[23.5px]"
                    id="ext-cred-env-select"
                  >
                    <option value="sandbox">Sandbox (Testes)</option>
                    <option value="producao">Produção (Live)</option>
                  </select>
                </div>

                <div className="space-y-1 col-span-2">
                  <label className="text-zinc-500 block font-mono">API Secret (Chave Secreta/Token):</label>
                  <div className="relative">
                    <input
                      type={visibleNewExtSecret ? "text" : "password"}
                      placeholder="ex: sk_live_xyz789..."
                      value={newExtApiSecret}
                      onChange={(e) => setNewExtApiSecret(e.target.value)}
                      className="w-full bg-black border border-neutral-850 rounded pl-2 pr-8 py-1 text-white text-[9.5px] font-mono focus:border-amber-900 outline-none"
                      id="ext-cred-secret-input"
                    />
                    <button
                      type="button"
                      onClick={() => setVisibleNewExtSecret(!visibleNewExtSecret)}
                      className="absolute right-2.5 top-1.5 text-zinc-500 hover:text-white cursor-pointer"
                      id="ext-cred-secret-toggle-btn"
                      title="Mostrar/Ocultar"
                    >
                      {visibleNewExtSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-1.5 bg-zinc-900 hover:bg-[#B87333]/15 border border-[#B87333]/30 hover:border-[#B87333]/60 text-amber-500 hover:text-white text-[9px] font-black uppercase tracking-wider rounded transition-all cursor-pointer flex items-center justify-center gap-1 font-mono"
                id="ext-submit-cred-btn"
              >
                <Plus className="w-3 h-3" />
                <span>Salvar Credenciais e Conectar API</span>
              </button>
            </form>
          </div>

          {/* GESTÃO DE WEBHOOKS DE RETORNO */}
          <div className="bg-[#050505] border border-neutral-900/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-900">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-amber-500" />
                <span className="font-extrabold text-[11px] uppercase tracking-wider text-white">
                  Webhooks de Retorno (Callbacks)
                </span>
              </div>
              <span className="text-[8px] text-zinc-500 font-mono uppercase">Interoperabilidade Real-Time</span>
            </div>

            <p className="text-[10px] text-zinc-400 font-sans leading-relaxed">
              Configure endpoints de Webhook de retorno para bancos comerciais. O KwanzaMóvel enviará uma notificação automática POST criptografada com assinatura HMAC SHA256 no momento exato da liquidação externa de transações.
            </p>

            {/* List of current Webhooks */}
            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {webhooks.map((wh) => (
                <div key={wh.id} className="bg-zinc-950 p-2.5 rounded-lg border border-neutral-900/80 space-y-2 text-[10px]">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-amber-500" />
                      <span className="font-bold text-white uppercase text-[9.5px] tracking-wide">{wh.bankName}</span>
                      <span className="text-[7.5px] bg-[#B87333]/15 text-amber-500 px-1 rounded uppercase font-mono">
                        {wh.bankCode}
                      </span>
                    </div>

                    <button
                      onClick={() => handleToggleWebhookStatus(wh.id)}
                      className={`px-1 rounded text-[7.5px] font-mono cursor-pointer border ${
                        wh.isActive
                          ? "bg-emerald-950/25 border-emerald-900 text-emerald-400"
                          : "bg-zinc-900 border-neutral-850 text-zinc-500"
                      }`}
                      id={`wh-status-${wh.id}`}
                    >
                      {wh.isActive ? "Ativo" : "Inativo"}
                    </button>
                  </div>

                  <div className="font-mono text-[8.5px] space-y-1 bg-black/45 p-2 rounded border border-neutral-900/60 text-zinc-400">
                    <div className="truncate">
                      <span className="text-zinc-500">URL: </span>
                      <span className="text-zinc-300 font-mono select-all">{wh.webhookUrl}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-zinc-500">FORMATO: </span>
                        <span className="text-zinc-400 uppercase font-bold">{wh.contentType}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500">ASSINATURA: </span>
                        <span className="text-zinc-400 font-mono select-all">••••••••••</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-zinc-500">EVENTOS: </span>
                      <span className="text-emerald-400 font-bold">{wh.events.join(", ")}</span>
                    </div>
                    {wh.lastTriggered && (
                      <div className="pt-1 mt-1 border-t border-neutral-900 flex justify-between items-center text-[7.5px]">
                        <span className="text-zinc-500 uppercase">ÚLTIMO DISPARO: {new Date(wh.lastTriggered).toLocaleTimeString()}</span>
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1 rounded">
                          STATUS: {wh.lastResponseStatus || "200 OK"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <button
                      onClick={() => handleRunWebhookSimulation(wh.id)}
                      disabled={whSimRunning || !wh.isActive}
                      className={`px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-extrabold flex items-center gap-1.5 transition-all ${
                        whSimRunning 
                          ? "bg-zinc-900 text-zinc-650 cursor-not-allowed" 
                          : wh.isActive
                          ? "bg-amber-500 hover:bg-amber-600 text-black cursor-pointer shadow-sm shadow-amber-500/5"
                          : "bg-zinc-900 text-zinc-600 cursor-not-allowed"
                      }`}
                      id={`wh-sim-btn-${wh.id}`}
                    >
                      <RefreshCw className={`w-2.5 h-2.5 ${whSimRunning && whSimId === wh.id ? "animate-spin" : ""}`} />
                      <span>Simular Disparo</span>
                    </button>

                    <button
                      onClick={() => handleDeleteWebhook(wh.id)}
                      className="text-[8px] font-mono text-red-500 hover:text-red-400 cursor-pointer flex items-center gap-0.5"
                      id={`wh-del-btn-${wh.id}`}
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                      <span>Excluir</span>
                    </button>
                  </div>
                </div>
              ))}
              {webhooks.length === 0 && (
                <div className="p-3 text-center bg-zinc-950 rounded border border-neutral-900 text-zinc-650 italic text-[9px]">
                  Nenhum webhook de retorno configurado. Use o formulário abaixo.
                </div>
              )}
            </div>

            {/* CONFIGURAÇÃO DE POLÍTICA DE RETENTATIVA (WEBHOOK RETRY POLICY) */}
            <div className="bg-zinc-950 p-3 rounded-lg border border-neutral-900 space-y-2.5 text-left">
              <div className="flex items-center gap-1.5 pb-1.5 border-b border-neutral-900/65">
                <Settings className="w-3.5 h-3.5 text-amber-500" />
                <span className="font-extrabold text-[9.5px] uppercase tracking-wider text-white font-mono">
                  Políticas de Retentativa (Retry Policy)
                </span>
              </div>
              
              <p className="text-[8.5px] text-zinc-400 font-sans leading-relaxed">
                Configure as regras de tolerância a falhas para a entrega de callbacks aos bancos parceiros. Em caso de falha de conexão ou HTTP Erro (5xx), o SPTR retransmitirá a notificação de forma resiliente de acordo com as diretrizes do BNA.
              </p>

              <div className="grid grid-cols-2 gap-3 text-[9px] font-mono">
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[8.5px]">
                    <span className="text-zinc-500">Max Tentativas:</span>
                    <span className="text-amber-500 font-bold">{whMaxRetries}x</span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setWhMaxRetries(num)}
                        className={`flex-1 py-1 text-[8.5px] rounded border transition-all font-bold cursor-pointer font-mono ${
                          whMaxRetries === num
                            ? "bg-amber-500/15 border-amber-500/40 text-amber-500 font-extrabold"
                            : "bg-black border-neutral-850 text-zinc-400 hover:text-white"
                        }`}
                        id={`wh-retry-num-${num}`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[8.5px]">
                    <span className="text-zinc-500">Backoff Exponencial:</span>
                    <span className="text-amber-500 font-bold">
                      {whInitialBackoff === 500 ? "0.5s" : `${whInitialBackoff / 1000}s`} Inicial
                    </span>
                  </div>
                  <select
                    value={whInitialBackoff}
                    onChange={(e) => setWhInitialBackoff(Number(e.target.value))}
                    className="w-full bg-black border border-neutral-850 rounded px-1.5 py-1 text-white font-mono outline-none text-[9px] h-[22px] cursor-pointer"
                    id="wh-backoff-select"
                  >
                    <option value={500}>0.5s (Emulação Rápida)</option>
                    <option value={1000}>1.0s (Padrão Sandbox)</option>
                    <option value={2000}>2.0s (Tolerância Média)</option>
                    <option value={3000}>3.0s (Conservador)</option>
                  </select>
                </div>
              </div>

              {/* Explicador do Backoff */}
              <div className="bg-black/55 p-2 rounded border border-neutral-900/60 font-mono text-[8px] text-zinc-500 leading-normal">
                <span className="text-[#B87333] font-bold block uppercase mb-0.5">Janela de Retransmissão Calculada:</span>
                <div className="flex gap-2 items-center">
                  <span>Série temporal de recuo:</span>
                  <div className="flex gap-1 items-center font-bold text-zinc-400">
                    {Array.from({ length: whMaxRetries }).map((_, i) => {
                      const ms = whInitialBackoff * Math.pow(2, i);
                      const s = (ms / 1000).toFixed(1);
                      return (
                        <span key={i} className="flex items-center">
                          {i > 0 && <span className="text-zinc-650 px-0.5 font-normal">→</span>}
                          <span className="bg-zinc-900 px-1 py-0.2 rounded border border-neutral-850 text-zinc-350">{s}s</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Config Form for Webhook */}
            <form onSubmit={handleCreateWebhook} className="bg-zinc-950 p-2.5 rounded-lg border border-neutral-900 space-y-2 font-mono text-[9px]">
              <span className="font-extrabold text-[9px] uppercase tracking-wider text-amber-500 block">
                Novo Endpoint de Webhook de Retorno
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-zinc-500 block">Banco Comercial:</label>
                  <select
                    value={newWhBankCode}
                    onChange={(e) => setNewWhBankCode(e.target.value)}
                    className="w-full bg-black border border-neutral-850 rounded px-1.5 py-1 text-white font-mono outline-none text-[9px]"
                    id="wh-bank-code-select"
                  >
                    <option value="BAI">Banco BAI</option>
                    <option value="BFA">BFA (Fomento Angola)</option>
                    <option value="BIC">Banco BIC</option>
                    <option value="SOL">Banco Sol</option>
                    <option value="BCI">Banco BCI</option>
                    <option value="KEVE">Banco Keve</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-500 block">Formato Payload:</label>
                  <select
                    value={newWhContentType}
                    onChange={(e) => setNewWhContentType(e.target.value as any)}
                    className="w-full bg-black border border-neutral-850 rounded px-1.5 py-1 text-white font-mono outline-none text-[9px]"
                    id="wh-format-select"
                  >
                    <option value="application/json">JSON (Recomendado)</option>
                    <option value="application/xml">XML (Legado)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-zinc-500 block">URL de Callback (HTTP/HTTPS):</label>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setNewWhUrl("https://api.banco.ao/v1/callback")}
                      className="text-[7.5px] bg-zinc-900 hover:bg-zinc-850 text-emerald-400 px-1 py-0.2 rounded border border-neutral-850 hover:border-neutral-700 transition-all cursor-pointer"
                    >
                      BAI 200 OK
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewWhUrl("https://api.banco.ao/v1/callback-404")}
                      className="text-[7.5px] bg-zinc-900 hover:bg-zinc-850 text-amber-500 px-1 py-0.2 rounded border border-neutral-850 hover:border-neutral-700 transition-all cursor-pointer"
                    >
                      Forçar 404
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewWhUrl("https://api.banco.ao/v1/callback-500")}
                      className="text-[7.5px] bg-zinc-900 hover:bg-zinc-850 text-red-400 px-1 py-0.2 rounded border border-neutral-850 hover:border-neutral-700 transition-all cursor-pointer"
                    >
                      Forçar 500
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="https://api.banco.ao/v1/callbacks/kwanzamovel"
                  value={newWhUrl}
                  onChange={(e) => setNewWhUrl(e.target.value)}
                  className="w-full bg-black border border-neutral-850 rounded px-2 py-1 text-white placeholder-zinc-700 outline-none focus:border-neutral-700"
                  id="wh-url-input"
                />
                <span className="text-[7.5px] text-zinc-500 italic block leading-tight">
                  💡 Sandbox: Clique nos atalhos acima ou digite &quot;404&quot; / &quot;500&quot; na URL para simular respostas e verificar a tolerância a falhas.
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-zinc-500 block">Chave de Assinatura (HMAC Secret):</label>
                  <button
                    type="button"
                    onClick={() => {
                      const randHex = "whsec_" + Array.from({length: 16}, () => Math.floor(Math.random()*16).toString(16)).join("");
                      setNewWhSecret(randHex);
                    }}
                    className="text-[8px] text-amber-500 hover:text-white"
                  >
                    Gerar Aleatória
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="whsec_098abc..."
                  value={newWhSecret}
                  onChange={(e) => setNewWhSecret(e.target.value)}
                  className="w-full bg-black border border-neutral-850 rounded px-2 py-1 text-white placeholder-zinc-700 outline-none focus:border-neutral-700 font-mono text-[9px]"
                  id="wh-secret-input"
                />
              </div>

              <div className="space-y-1">
                <label className="text-zinc-500 block">Eventos Subscritos:</label>
                <div className="flex gap-4 font-mono text-[8px] text-zinc-400">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newWhEvents.includes("transaction.settled")}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewWhEvents(prev => [...prev, "transaction.settled"]);
                        } else {
                          setNewWhEvents(prev => prev.filter(x => x !== "transaction.settled"));
                        }
                      }}
                      className="accent-amber-500"
                    />
                    <span>transaction.settled</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newWhEvents.includes("transaction.failed")}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewWhEvents(prev => [...prev, "transaction.failed"]);
                        } else {
                          setNewWhEvents(prev => prev.filter(x => x !== "transaction.failed"));
                        }
                      }}
                      className="accent-amber-500"
                    />
                    <span>transaction.failed</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={whTestRunning}
                  className={`flex-1 py-1.5 border text-[9px] uppercase tracking-wider rounded transition-all flex items-center justify-center gap-1 cursor-pointer font-extrabold font-mono ${
                    whTestRunning
                      ? "bg-zinc-900 border-neutral-850 text-zinc-650 cursor-not-allowed"
                      : "bg-black hover:bg-zinc-900 border-neutral-850 hover:border-neutral-700 text-zinc-300 hover:text-white"
                  }`}
                  id="wh-test-btn"
                >
                  <RefreshCw className={`w-3 h-3 ${whTestRunning ? "animate-spin" : ""}`} />
                  <span>{whTestRunning ? "A Testar..." : "Testar Conexão"}</span>
                </button>

                <button
                  type="submit"
                  className="flex-1 py-1.5 bg-zinc-900 hover:bg-[#B87333]/15 border border-[#B87333]/30 hover:border-[#B87333]/60 text-amber-500 hover:text-white text-[9px] font-black uppercase tracking-wider rounded transition-all cursor-pointer flex items-center justify-center gap-1 font-mono"
                  id="wh-submit-btn"
                >
                  <Plus className="w-3 h-3" />
                  <span>Salvar Endpoint</span>
                </button>
              </div>
            </form>

            {/* Connection Test Result Display */}
            {whTestResult && (
              <div className={`p-2.5 rounded-lg border text-[8.5px] font-mono space-y-1 relative ${
                whTestResult.success 
                  ? "bg-emerald-950/20 border-emerald-900/40 text-emerald-400" 
                  : "bg-red-950/20 border-red-900/40 text-red-400"
              }`}>
                <div className="flex justify-between items-start gap-2">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-extrabold uppercase tracking-wider text-[8px] text-zinc-300">
                      Resultado do Teste (GET Ping):
                    </span>
                    <span className={`w-fit px-1 rounded text-[7.5px] font-black uppercase border ${
                      whTestResult.success 
                        ? "bg-emerald-500/15 border-emerald-500/25 text-emerald-400" 
                        : "bg-red-500/15 border-red-500/25 text-red-400"
                    }`}>
                      {whTestResult.status} {whTestResult.statusText}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setWhTestResult(null)}
                    className="text-zinc-500 hover:text-zinc-300 hover:bg-neutral-900/60 px-1 py-0.5 rounded text-[8px] cursor-pointer border border-transparent hover:border-neutral-800 transition-all font-mono"
                  >
                    Fechar
                  </button>
                </div>
                <div className="text-zinc-400 leading-normal text-[8px]">
                  {whTestResult.details}
                </div>
                <div className="pt-1 flex justify-between text-[7px] text-zinc-500 border-t border-neutral-900/40 font-mono uppercase">
                  <span>Latência: {whTestResult.latency}ms</span>
                  <span>Timestamp: {new Date(whTestResult.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            )}

            {/* Webhook Sandbox Log Console (Displays when running simulation) */}
            {whSimId && (
              <div className="bg-black/95 rounded-lg p-2.5 border border-neutral-900 space-y-1 text-zinc-400 font-mono text-[8.5px] mt-2">
                <div className="flex justify-between items-center pb-1 mb-1 border-b border-neutral-900/60">
                  <span className="text-amber-500 font-bold uppercase tracking-wider">Log do Transmissor de Webhooks SPTR:</span>
                  {whSimStatus && (
                    <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 px-1 py-0.2 rounded font-extrabold text-[8px]">
                      STATUS: {whSimStatus} OK
                    </span>
                  )}
                </div>
                <div className="space-y-0.5 max-h-[140px] overflow-y-auto scrollbar-thin">
                  {whSimLogs.map((log, index) => (
                    <div key={index} className="flex gap-1">
                      <span className="text-amber-600 select-none">&gt;&gt;</span>
                      <span className="leading-normal">{log}</span>
                    </div>
                  ))}
                </div>
                {whSimPayload && (
                  <div className="pt-1.5 mt-1 border-t border-neutral-900">
                    <span className="text-zinc-500 block uppercase mb-1">Payload JSON Transmitido:</span>
                    <pre className="bg-zinc-950/60 p-2 rounded text-[8px] text-blue-400 overflow-x-auto select-all max-h-[100px] scrollbar-thin leading-normal">
                      {whSimPayload}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* DASHBOARD DE DESEMPENHO DE WEBHOOKS */}
          <div className="bg-[#050505] border border-neutral-900/80 rounded-xl p-4 space-y-3 mt-4" id="webhook-analytics-dashboard">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-neutral-900">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-amber-500" />
                <span className="font-extrabold text-[11px] uppercase tracking-wider text-white">
                  Dashboard de Desempenho de Webhooks
                </span>
                <span className="bg-amber-500/15 text-amber-500 border border-amber-500/30 text-[7px] px-1.5 py-0.2 rounded font-mono uppercase font-bold">Últimos 7 Dias</span>
              </div>
              
              {/* Selector Tabs */}
              <div className="flex gap-1 bg-black/50 p-0.5 rounded border border-neutral-850 self-start sm:self-auto font-mono text-[8px] uppercase font-bold">
                <button
                  type="button"
                  onClick={() => setActiveMetricTab("volume")}
                  className={`px-2 py-1 rounded transition-all cursor-pointer ${
                    activeMetricTab === "volume"
                      ? "bg-[#B87333]/15 text-white border border-[#B87333]/35"
                      : "text-zinc-500 hover:text-zinc-300 border border-transparent"
                  }`}
                >
                  Volume e Sucesso
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMetricTab("latency")}
                  className={`px-2 py-1 rounded transition-all cursor-pointer ${
                    activeMetricTab === "latency"
                      ? "bg-[#B87333]/15 text-white border border-[#B87333]/35"
                      : "text-zinc-500 hover:text-zinc-300 border border-transparent"
                  }`}
                >
                  Latência de Entrega
                </button>
              </div>
            </div>

            <p className="text-[10px] text-zinc-400 font-sans leading-normal">
              Estatísticas consolidadas das tentativas de entrega de Webhook pelo serviço de mensageria do Banco Central. Útil para auditoria do nível de serviço (SLA) dos canais bancários.
            </p>

            {/* CHART VIEW CONTAINER */}
            <div className="bg-black/40 p-2.5 rounded-lg border border-neutral-900/60" style={{ width: "100%" }}>
              <div className="h-[170px] w-full font-mono text-[8px]">
                <ResponsiveContainer width="100%" height="100%">
                  {activeMetricTab === "volume" ? (
                    <AreaChart
                      data={webhookHistory}
                      margin={{ top: 10, right: 5, left: -25, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorSucesso" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorFalha" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#F43F5E" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1c1c1c" />
                      <XAxis dataKey="date" stroke="#52525b" tickLine={false} />
                      <YAxis stroke="#52525b" tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#09090b",
                          borderColor: "#18181b",
                          fontSize: "8.5px",
                          fontFamily: "monospace",
                          color: "#d4d4d8",
                          borderRadius: "6px"
                        }}
                      />
                      <Legend 
                        verticalAlign="top" 
                        height={24} 
                        iconType="circle" 
                        iconSize={6}
                        wrapperStyle={{ fontSize: "8px", fontFamily: "monospace", textTransform: "uppercase" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="sucesso"
                        name="Sucesso"
                        stroke="#10B981"
                        fillOpacity={1}
                        fill="url(#colorSucesso)"
                      />
                      <Area
                        type="monotone"
                        dataKey="falha"
                        name="Falhas"
                        stroke="#F43F5E"
                        fillOpacity={1}
                        fill="url(#colorFalha)"
                      />
                    </AreaChart>
                  ) : (
                    <LineChart
                      data={webhookHistory}
                      margin={{ top: 10, right: 5, left: -25, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1c1c1c" />
                      <XAxis dataKey="date" stroke="#52525b" tickLine={false} />
                      <YAxis stroke="#52525b" tickLine={false} unit="ms" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#09090b",
                          borderColor: "#18181b",
                          fontSize: "8.5px",
                          fontFamily: "monospace",
                          color: "#d4d4d8",
                          borderRadius: "6px"
                        }}
                      />
                      <Legend 
                        verticalAlign="top" 
                        height={24} 
                        iconType="circle" 
                        iconSize={6}
                        wrapperStyle={{ fontSize: "8px", fontFamily: "monospace", textTransform: "uppercase" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="latência"
                        name="Latência (ms)"
                        stroke="#B87333"
                        strokeWidth={2}
                        dot={{ r: 3, fill: "#B87333", stroke: "#000", strokeWidth: 1 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>

            {/* BOTTLENECK ANALYSIS PANEL - Permite identificar gargalos de integração */}
            <div className="bg-zinc-950 p-3 rounded-lg border border-neutral-900 text-[10px] space-y-2">
              <div className="flex items-center gap-1.5 text-zinc-350 font-mono text-[9px] uppercase font-bold">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>Gargalos de Integração Detectados</span>
              </div>
              
              <div className="space-y-2 font-sans text-[9.5px] leading-relaxed">
                <div className="flex gap-2.5 items-start p-1.5 bg-rose-950/10 border border-rose-950/30 rounded">
                  <span className="font-mono text-[8px] px-1 py-0.2 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded font-bold uppercase mt-0.5">Crítico</span>
                  <div className="space-y-0.5">
                    <p className="font-bold text-zinc-200">23/Jun: Instabilidade de Rede e Timeout no Banco BAI</p>
                    <p className="text-zinc-400 text-[9px]">
                      A latência disparou para <strong>290ms</strong> com um pico de <strong>25 falhas</strong> de webhook. Investigação de logs revelou que o gateway do Banco BAI sofreu sobrecarga interna, gerando falhas intermitentes (HTTP 504 Gateway Timeout). As políticas de retentativa com backoff evitaram perda de mensagens.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2.5 items-start p-1.5 bg-amber-950/10 border border-amber-950/30 rounded">
                  <span className="font-mono text-[8px] px-1 py-0.2 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded font-bold uppercase mt-0.5">Monitoria</span>
                  <div className="space-y-0.5">
                    <p className="font-bold text-zinc-200">Filtro de HMAC Ativo e Bloqueio de Assinaturas Múltiplas</p>
                    <p className="text-zinc-400 text-[9px]">
                      Pequenas falhas registradas em dias úteis estão associadas a cabeçalhos mal formatados de requisições de teste do Banco Sol (HTTP 401 Unauthorized), que falharam na verificação de assinatura SHA256. A integridade operacional do barramento SPTR está garantida.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* LOG DE AUDITORIA DE WEBHOOKS */}
            <div className="bg-[#050505] border border-neutral-900/80 rounded-xl p-4 space-y-3 mt-4" id="webhook-audit-log-panel">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-900">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span className="font-extrabold text-[11px] uppercase tracking-wider text-white font-sans">
                    Log de Auditoria de Webhooks
                  </span>
                  <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[7px] px-1.5 py-0.2 rounded font-mono uppercase font-bold">Imutável</span>
                </div>
                <button 
                  type="button"
                  onClick={() => {
                    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(webhookAuditLogs, null, 2));
                    const downloadAnchor = document.createElement("a");
                    downloadAnchor.setAttribute("href", dataStr);
                    downloadAnchor.setAttribute("download", `sptr_webhook_audit_logs_${new Date().toISOString().split("T")[0]}.json`);
                    document.body.appendChild(downloadAnchor);
                    downloadAnchor.click();
                    downloadAnchor.remove();
                    triggerFeedback("Registos de Auditoria exportados em formato JSON!", "success");
                  }}
                  className="text-[8.5px] font-mono text-zinc-400 hover:text-white cursor-pointer flex items-center gap-1 bg-zinc-950 px-2 py-1 rounded border border-neutral-900 hover:border-neutral-800 transition-all animate-fade-in"
                  title="Exportar logs em formato JSON"
                >
                  <Download className="w-2.5 h-2.5 text-amber-500" />
                  <span>Exportar JSON</span>
                </button>
              </div>

              <p className="text-[10px] text-zinc-400 font-sans leading-relaxed">
                Registo forense e auditoria em tempo real de todas as notificações disparadas aos bancos participantes. Todas as transmissões incluem assinatura criptográfica <code className="text-amber-500 bg-amber-500/5 px-1 py-0.2 rounded border border-amber-500/10 text-[9px] font-mono">HMAC-SHA256</code> no cabeçalho <code className="text-zinc-300 font-mono">x-kwanzamovel-signature-256</code> para atestar a integridade operacional de forma imutável.
              </p>

              {/* Search and stats row */}
              <div className="flex gap-2 items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2 w-3 h-3 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Filtrar por banco, endpoint, status..."
                    value={whLogSearch}
                    onChange={(e) => setWhLogSearch(e.target.value)}
                    className="w-full bg-black border border-neutral-850 rounded pl-7 pr-2.5 py-1 text-white placeholder-zinc-700 outline-none focus:border-neutral-800 text-[9px] font-mono h-[24px]"
                  />
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[9px] text-zinc-500 bg-zinc-950 border border-neutral-900 px-2 rounded h-[24px]">
                  <span>Total:</span>
                  <span className="font-bold text-white">{webhookAuditLogs.length}</span>
                </div>
              </div>

              {/* List of items */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {webhookAuditLogs
                  .filter(log => {
                    const query = whLogSearch.toLowerCase();
                    return (
                      log.bankName.toLowerCase().includes(query) ||
                      log.bankCode.toLowerCase().includes(query) ||
                      log.endpoint.toLowerCase().includes(query) ||
                      log.status.toString().includes(query) ||
                      log.statusText.toLowerCase().includes(query)
                    );
                  })
                  .map((log) => {
                    const isExpanded = expandedWhLogId === log.id;
                    const isSuccess = log.status >= 200 && log.status < 300;
                    
                    return (
                      <div 
                        key={log.id} 
                        className={`rounded-lg border transition-all text-[10px] ${
                          isExpanded 
                            ? "bg-zinc-950 border-neutral-800" 
                            : "bg-zinc-950/40 border-neutral-900 hover:border-neutral-800"
                        }`}
                      >
                        {/* Row Header */}
                        <div 
                          onClick={() => setExpandedWhLogId(isExpanded ? null : log.id)}
                          className="p-2.5 flex justify-between items-center cursor-pointer select-none"
                        >
                          <div className="flex flex-col gap-0.5 max-w-[80%]">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono text-zinc-500 text-[8.5px]">{new Date(log.timestamp).toLocaleTimeString()}</span>
                              <span className="text-[7px] px-1 py-0.2 bg-zinc-900 border border-neutral-850 rounded text-zinc-400 font-mono font-bold uppercase">{log.bankCode}</span>
                              <span className="font-bold text-zinc-300 font-sans tracking-wide truncate max-w-[120px]">{log.bankName}</span>
                              <span className={`text-[7.5px] px-1 rounded font-mono font-bold border ${
                                isSuccess 
                                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                                  : "bg-red-500/10 border-red-500/20 text-red-400"
                              }`}>
                                {log.status} {log.statusText}
                              </span>
                            </div>
                            <div className="text-zinc-500 font-mono text-[8.5px] truncate max-w-[280px]">
                              {log.endpoint}
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <span className="font-mono text-[8px] text-zinc-550 bg-black px-1.5 py-0.2 rounded border border-neutral-900 uppercase">
                              {log.attempt > 1 ? `Tentativa ${log.attempt}` : "1ª Tentativa"}
                            </span>
                            <ChevronRight className={`w-3.5 h-3.5 text-zinc-500 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`} />
                          </div>
                        </div>

                        {/* Collapsible Content */}
                        {isExpanded && (
                          <div className="border-t border-neutral-900/80 p-3 space-y-3 animate-fade-in bg-black/20 text-left">
                            {/* Metadata Fields */}
                            <div className="grid grid-cols-2 gap-3 text-[9px] font-mono text-zinc-400 bg-black/40 p-2 rounded border border-neutral-900/60">
                              <div className="space-y-1">
                                <div>
                                  <span className="text-zinc-650">Timestamp Original:</span>
                                  <p className="text-zinc-300 text-[8.5px]">{log.timestamp}</p>
                                </div>
                                <div>
                                  <span className="text-zinc-650">Método HTTP:</span>
                                  <p className="text-emerald-500 font-bold">{log.method}</p>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <div>
                                  <span className="text-zinc-650">Endpoint Alvo:</span>
                                  <div className="flex items-center gap-1">
                                    <p className="text-zinc-350 select-all truncate max-w-[120px]" title={log.endpoint}>{log.endpoint}</p>
                                    <button 
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigator.clipboard.writeText(log.endpoint);
                                        triggerFeedback("Endpoint copiado!", "success");
                                      }}
                                      className="text-zinc-500 hover:text-white cursor-pointer animate-fade-in"
                                      title="Copiar URL"
                                    >
                                      <Copy className="w-2.5 h-2.5" />
                                    </button>
                                  </div>
                                </div>
                                <div>
                                  <span className="text-zinc-650">Estado Auditoria:</span>
                                  <p className="text-emerald-400 flex items-center gap-1 font-bold text-[8.5px]">
                                    <ShieldCheck className="w-3 h-3 text-emerald-500" />
                                    <span>LEDGER ASSINADO</span>
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Signature Block */}
                            <div className="space-y-1 bg-zinc-950 p-2.5 rounded-lg border border-neutral-900/80 font-mono text-[8.5px]">
                              <div className="flex justify-between items-center text-zinc-500 border-b border-neutral-900 pb-1 mb-1">
                                <span className="uppercase font-bold tracking-wider text-[7.5px] text-[#B87333] flex items-center gap-1">
                                  <Lock className="w-2.5 h-2.5 text-amber-500" />
                                  Assinatura HMAC-SHA256 (Garantia de Não-Repúdio)
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(log.signature);
                                    triggerFeedback("Chave de Assinatura copiada!", "success");
                                  }}
                                  className="text-zinc-500 hover:text-white cursor-pointer animate-fade-in"
                                  title="Copiar Assinatura"
                                >
                                  <Copy className="w-2.5 h-2.5" />
                                </button>
                              </div>
                              <div className="text-zinc-400 break-all select-all font-mono leading-relaxed bg-black/40 p-1 rounded border border-neutral-900/30">
                                {log.signature}
                              </div>
                            </div>

                            {/* Payload View */}
                            <div className="space-y-1 font-mono text-[8.5px]">
                              <div className="flex justify-between items-center text-zinc-500">
                                <span className="uppercase font-bold tracking-wider text-[7.5px] text-emerald-500 flex items-center gap-1">
                                  <Terminal className="w-2.5 h-2.5" />
                                  Payload JSON Enviado
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(log.payload);
                                    triggerFeedback("Payload JSON copiado!", "success");
                                  }}
                                  className="text-zinc-500 hover:text-white cursor-pointer animate-fade-in"
                                  title="Copiar JSON"
                                >
                                  <Copy className="w-2.5 h-2.5" />
                                </button>
                              </div>
                              <pre className="p-2.5 bg-[#030303] text-zinc-350 border border-neutral-900 rounded-lg overflow-x-auto select-all max-h-[140px] text-[8px] leading-relaxed scrollbar-thin">
                                {log.payload}
                              </pre>
                            </div>

                            {/* Immutability Seal */}
                            <div className="flex items-center gap-1.5 bg-emerald-950/10 border border-emerald-900/20 rounded p-1.5 text-[8.5px] text-emerald-400 font-sans">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <span>Verificação criptográfica válida. O hash assinado corresponde exatamente ao payload e confirma a autenticidade da instituição recetora.</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                {webhookAuditLogs.filter(log => {
                  const query = whLogSearch.toLowerCase();
                  return (
                    log.bankName.toLowerCase().includes(query) ||
                    log.bankCode.toLowerCase().includes(query) ||
                    log.endpoint.toLowerCase().includes(query) ||
                    log.status.toString().includes(query) ||
                    log.statusText.toLowerCase().includes(query)
                  );
                }).length === 0 && (
                  <div className="p-4 text-center bg-zinc-950 rounded border border-neutral-900 text-zinc-650 italic text-[9px]">
                    Nenhum registo de auditoria corresponde ao filtro especificado.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ENDPOINT INTERACTIVE DIRECTORY & TESTER (7 cols) */}
        <div className="xl:col-span-7 space-y-4">
          <div className="bg-[#050505] border border-neutral-900/80 rounded-xl p-4 space-y-4">
            
            {/* Split layout: Directory list (Left) and Sandbox Sandbox Tester (Right) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              
              {/* Directory Filter & Search (5 cols) */}
              <div className="md:col-span-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[11px] uppercase tracking-wider text-white">
                    Directório de Endpoints
                  </span>
                  <button
                    onClick={() => setIsAddingEndpoint(!isAddingEndpoint)}
                    className="p-1 bg-amber-500/15 text-amber-500 border border-amber-500/10 hover:bg-amber-500 hover:text-black hover:border-amber-500 rounded transition-all flex items-center gap-1 cursor-pointer text-[8px] font-bold uppercase tracking-wider font-mono"
                    id="api-add-ep-btn"
                  >
                    <Plus className="w-2.5 h-2.5" />
                    <span>Novo Endpoint</span>
                  </button>
                </div>

                {/* Directory filter inputs */}
                <div className="space-y-1.5">
                  <div className="relative">
                    <Search className="w-3 h-3 text-zinc-600 absolute left-2.5 top-2" />
                    <input
                      type="text"
                      placeholder="Filtrar por path, rota..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-zinc-950 border border-neutral-900 rounded-lg pl-8 pr-3 py-1 text-zinc-300 placeholder-zinc-650 text-[10px] focus:border-[#B87333]/50 outline-none font-mono"
                      id="api-search-input"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 font-mono text-[8px] uppercase">
                    <div>
                      <span className="text-zinc-600 block text-[7px] mb-0.5">Visibilidade:</span>
                      <div className="flex rounded border border-neutral-900 overflow-hidden bg-black">
                        {(["todos", "public", "private"] as const).map((tab) => (
                          <button
                            key={tab}
                            onClick={() => setTabFilter(tab)}
                            className={`flex-1 py-1 text-center font-bold transition-all cursor-pointer ${
                              tabFilter === tab 
                                ? "bg-[#B87333]/15 text-amber-500 font-black" 
                                : "text-zinc-500 hover:text-zinc-300"
                            }`}
                          >
                            {tab === "todos" ? "Todos" : tab === "public" ? "Púb" : "Priv"}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-zinc-600 block text-[7px] mb-0.5">Segmento:</span>
                      <div className="flex rounded border border-neutral-900 overflow-hidden bg-black">
                        {(["todos", "banco", "operador"] as const).map((seg) => (
                          <button
                            key={seg}
                            onClick={() => setSegmentFilter(seg)}
                            className={`flex-1 py-1 text-center font-bold transition-all cursor-pointer ${
                              segmentFilter === seg 
                                ? "bg-[#B87333]/15 text-amber-500 font-black" 
                                : "text-zinc-500 hover:text-zinc-300"
                            }`}
                          >
                            {seg === "todos" ? "Todos" : seg === "banco" ? "Bancos" : "Tels"}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* List of endpoints */}
                <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
                  {filteredEndpoints.map((ep) => {
                    const isSelected = selectedEndpointId === ep.id;
                    const isPost = ep.method === "POST" || ep.method === "PUT";
                    return (
                      <div
                        key={ep.id}
                        onClick={() => {
                          setSelectedEndpointId(ep.id);
                          setPlaygroundResponse("");
                          setPlaygroundHttpStatus(null);
                          setPlaygroundLogs([]);
                          setPlaygroundRequestBody(ep.requestBody);
                        }}
                        className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                          isSelected 
                            ? "bg-[#B87333]/5 border-[#B87333]/35 ring-1 ring-[#B87333]/15" 
                            : "bg-zinc-950 border-neutral-900/50 hover:bg-zinc-900/40"
                        }`}
                        id={`api-ep-item-${ep.id}`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`px-1 py-0.2 rounded font-mono font-black text-[7.5px] uppercase ${
                              ep.method === "POST" 
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/5" 
                                : ep.method === "GET" 
                                ? "bg-blue-500/10 text-blue-400 border border-blue-500/5" 
                                : "bg-purple-500/10 text-purple-400 border border-purple-500/5"
                            }`}>
                              {ep.method}
                            </span>
                            <span className="text-[8px] bg-zinc-900 px-1 rounded text-zinc-500 uppercase font-mono">
                              {ep.segment === "banco" ? "Bancos" : ep.segment === "operador" ? "Tels" : "Outro"}
                            </span>
                          </div>
                          
                          <span className={`text-[7px] font-mono uppercase px-1 rounded ${
                            ep.type === "public" ? "bg-zinc-900 text-zinc-400" : "bg-amber-950/20 text-amber-400 border border-amber-900/20"
                          }`}>
                            {ep.type === "public" ? "Público" : "Privado"}
                          </span>
                        </div>

                        <span className="text-[10px] font-bold text-white block truncate">{ep.name}</span>
                        <code className="text-[8.5px] font-mono text-zinc-500 block truncate">{ep.path}</code>
                      </div>
                    );
                  })}

                  {filteredEndpoints.length === 0 && (
                    <div className="p-4 text-center bg-zinc-950 rounded border border-neutral-900 text-zinc-500 italic text-[10px] font-mono">
                      Nenhum endpoint encontrado para os filtros selecionados.
                    </div>
                  )}
                </div>
              </div>

              {/* Sandbox Playground Console & Testing (7 cols) */}
              <div className="md:col-span-7 space-y-3 border-t md:border-t-0 md:border-l border-neutral-900 md:pl-4 pt-3 md:pt-0">
                
                {/* Active Endpoint Spec Card */}
                <div className="space-y-2 bg-zinc-950 p-3 rounded-lg border border-neutral-900">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className={`px-1.5 py-0.5 rounded font-mono font-black text-[8.5px] ${
                          activeEndpoint.method === "POST" ? "bg-amber-500/15 text-amber-400" : "bg-blue-500/15 text-blue-400"
                        }`}>
                          {activeEndpoint.method}
                        </span>
                        <code className="text-[9.5px] font-mono text-zinc-200 select-all">{activeEndpoint.path}</code>
                      </div>
                      <h3 className="font-extrabold text-[10.5px] text-white">{activeEndpoint.name}</h3>
                    </div>

                    <button
                      onClick={() => handleDeleteEndpoint(activeEndpoint.id)}
                      className="p-1 text-zinc-600 hover:text-red-400 cursor-pointer"
                      title="Eliminar Endpoint da Sandbox"
                      id={`api-delete-ep-btn-${activeEndpoint.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-[9.5px] text-zinc-400 leading-normal font-sans">
                    {activeEndpoint.description}
                  </p>

                  <div className="font-mono text-[8.5px] border-t border-neutral-900 pt-2 space-y-1">
                    <span className="text-zinc-500 uppercase block">Headers Obrigatórios:</span>
                    <div className="bg-black/40 p-1.5 rounded text-zinc-400 space-y-0.5 border border-neutral-900/50">
                      {activeEndpoint.headers.map((h, hIdx) => (
                        <div key={hIdx} className="flex justify-between">
                          <span className="text-zinc-500">{h.key}:</span>
                          <span className="text-zinc-300">{h.value}</span>
                        </div>
                      ))}
                      {activeEndpoint.requiresAuth && (
                        <div className="flex justify-between text-amber-500">
                          <span>Authorization:</span>
                          <span>Basic &lt;base64(client_id:client_secret)&gt;</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* API Request Customizer / Sandbox Selection */}
                <div className="bg-zinc-950 p-3 rounded-lg border border-neutral-900 space-y-2 font-mono text-[9px]">
                  <span className="font-bold text-[9px] uppercase tracking-wider text-amber-500 block">
                    Parâmetros de Simulação da Sandbox
                  </span>

                  {/* Authentication select (Only if requires authentication) */}
                  {activeEndpoint.requiresAuth && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-zinc-500">Autenticar pedido como:</label>
                        <div className="flex items-center gap-1.5 text-[8.5px]">
                          <input 
                            type="checkbox" 
                            id="custom-auth-check" 
                            checked={useCustomAuthHeader}
                            onChange={(e) => setUseCustomAuthHeader(e.target.checked)}
                            className="rounded bg-black border-neutral-800 text-amber-500 focus:ring-0"
                          />
                          <label htmlFor="custom-auth-check" className="text-zinc-400 cursor-pointer">Header Manual</label>
                        </div>
                      </div>

                      {useCustomAuthHeader ? (
                        <input
                          type="text"
                          placeholder="Basic Y2xpZW50OmswOWEyMzhmYWQ..."
                          value={playgroundCustomAuth}
                          onChange={(e) => setPlaygroundCustomAuth(e.target.value)}
                          className="w-full bg-black border border-neutral-850 rounded px-2.5 py-1 text-white font-mono text-[9.5px] outline-none"
                          id="api-custom-auth-input"
                        />
                      ) : (
                        <select
                          value={playgroundCredId}
                          onChange={(e) => setPlaygroundCredId(e.target.value)}
                          className="w-full bg-black border border-neutral-850 rounded px-2 py-1 text-white font-mono text-[9.5px] outline-none"
                          id="api-cred-select"
                        >
                          {credentials.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.type === "banco" ? "Banco" : "Operador"}) {c.status !== "Active" ? "[INATIVO]" : ""}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}

                  {/* Body customizer (only if method is POST/PUT) */}
                  {(activeEndpoint.method === "POST" || activeEndpoint.method === "PUT") && (
                    <div className="space-y-1">
                      <label className="text-zinc-500 block">Corpo da Requisição (Request Body JSON):</label>
                      <textarea
                        value={playgroundRequestBody !== undefined ? playgroundRequestBody : activeEndpoint.requestBody}
                        onChange={(e) => setPlaygroundRequestBody(e.target.value)}
                        className="w-full h-24 bg-black border border-neutral-850 rounded p-2 text-emerald-400 font-mono text-[9px] resize-none outline-none focus:border-neutral-700"
                        placeholder="{}"
                        id="api-body-textarea"
                      />
                    </div>
                  )}

                  {/* Run simulation button */}
                  <button
                    disabled={playgroundRunning}
                    onClick={handleRunPlayground}
                    className={`w-full py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      playgroundRunning 
                        ? "bg-[#B87333]/15 text-amber-500/60 border border-[#B87333]/20" 
                        : "bg-amber-500 hover:bg-amber-600 text-black font-black shadow-md shadow-amber-500/10"
                    }`}
                    id="api-run-btn"
                  >
                    {playgroundRunning ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Ligando ao Portal Central BNA...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Testar Requisição na Sandbox</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Handshake Logs Console Output */}
                {playgroundLogs.length > 0 && (
                  <div className="space-y-1.5 font-mono text-[9px]">
                    <span className="text-zinc-500 uppercase block">Análise de Handshake TLS e Validação Basic Auth:</span>
                    <div className="bg-black/90 rounded-lg p-2.5 border border-neutral-900 space-y-1 text-zinc-400 h-28 overflow-y-auto font-mono scrollbar-thin">
                      {playgroundLogs.map((log, lIdx) => (
                        <div key={lIdx} className="flex gap-1.5 leading-normal">
                          <span className="text-[#B87333] select-none">&gt;</span>
                          <span>{log}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Response Code & Body */}
                {playgroundHttpStatus !== null && (
                  <div className="space-y-1 font-mono text-[9px]">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500 uppercase block">Resposta Recebida (HTTP Response):</span>
                      <span className={`px-2 py-0.5 rounded font-black font-mono text-[8.5px] ${
                        playgroundHttpStatus === 200 
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25" 
                          : "bg-red-500/15 text-red-400 border border-red-500/25"
                      }`}>
                        STATUS: {playgroundHttpStatus} {playgroundHttpStatus === 200 ? "OK" : playgroundHttpStatus === 400 ? "BAD REQUEST" : "UNAUTHORIZED"}
                      </span>
                    </div>

                    <pre className="bg-zinc-950 p-2.5 rounded border border-neutral-900 text-blue-400 text-[8.5px] leading-relaxed overflow-y-auto h-32 select-all font-mono">
                      {playgroundResponse}
                    </pre>
                  </div>
                )}

                {/* Integration Guide / cURL snippet generator */}
                <div className="bg-zinc-950 p-3 rounded-lg border border-neutral-900 space-y-1.5 font-mono text-[9px]">
                  <span className="text-zinc-500 uppercase block">Snippet de Integração (cURL de Produção):</span>
                  {(() => {
                    const matchedCred = credentials.find(c => c.id === playgroundCredId) || credentials[0];
                    const tokenSim = matchedCred ? getBasicAuthHeaderValue(matchedCred.clientId, matchedCred.clientSecret) : "Basic <token_base64>";
                    const requestBodySim = playgroundRequestBody.trim() || activeEndpoint.requestBody;
                    const isPost = activeEndpoint.method === "POST" || activeEndpoint.method === "PUT";
                    const curlString = `curl -X ${activeEndpoint.method} "https://api.kwanzamovel.gov.ao${activeEndpoint.path}" \\\n  -H "Authorization: ${tokenSim}" \\\n  -H "Content-Type: application/json" ${isPost && requestBodySim ? `\\\n  -d '${requestBodySim.replace(/\s+/g, ' ')}'` : ""}`;
                    
                    return (
                      <div className="relative">
                        <textarea
                          readOnly
                          value={curlString}
                          className="w-full h-16 bg-black text-zinc-300 rounded border border-neutral-900/60 p-2 text-[8px] resize-none focus:outline-none select-all font-mono leading-relaxed"
                        />
                        <button
                          onClick={() => copyText(curlString, "Snippet cURL")}
                          className="absolute right-2 bottom-2 bg-zinc-900 border border-neutral-800 hover:bg-[#B87333]/15 hover:border-[#B87333]/40 text-zinc-400 hover:text-white px-2 py-0.5 rounded cursor-pointer transition-all text-[8px] font-mono"
                          id="api-copy-curl-btn"
                        >
                          Copiar cURL
                        </button>
                      </div>
                    );
                  })()}
                </div>

              </div>

            </div>

            {/* MODAL / FORM IN-LINE: NOVO ENDPOINT */}
            {isAddingEndpoint && (
              <div className="bg-zinc-950 border border-neutral-900 p-4 rounded-xl space-y-3 font-mono text-[10px]">
                <div className="flex justify-between items-center pb-2 border-b border-neutral-900">
                  <span className="font-extrabold text-amber-500 uppercase text-[10px]">Publicar Novo Endpoint na Sandbox</span>
                  <button 
                    onClick={() => setIsAddingEndpoint(false)}
                    className="text-zinc-500 hover:text-white cursor-pointer"
                  >
                    Fechar
                  </button>
                </div>

                <form onSubmit={handleCreateEndpoint} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-zinc-500 uppercase block">Nome do Endpoint:</label>
                      <input
                        type="text"
                        placeholder="Consultar Transações, Dispersar..."
                        value={newEpName}
                        onChange={(e) => setNewEpName(e.target.value)}
                        className="w-full bg-black border border-neutral-850 rounded px-2.5 py-1.5 text-white font-mono outline-none text-[10px] focus:border-[#B87333]/55"
                        id="new-ep-name-input"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-zinc-500 uppercase block">Path URL (Rota):</label>
                      <input
                        type="text"
                        placeholder="/api/v1/private/bancos/exemplo"
                        value={newEpPath}
                        onChange={(e) => setNewEpPath(e.target.value)}
                        className="w-full bg-black border border-neutral-850 rounded px-2.5 py-1.5 text-white font-mono outline-none text-[10px] focus:border-[#B87333]/55"
                        id="new-ep-path-input"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-zinc-500 uppercase block">Método de Requisição:</label>
                      <select
                        value={newEpMethod}
                        onChange={(e) => setNewEpMethod(e.target.value as any)}
                        className="w-full bg-black border border-neutral-850 rounded px-2.5 py-1.5 text-white font-mono outline-none text-[10px]"
                        id="new-ep-method-select"
                      >
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="DELETE">DELETE</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-zinc-500 uppercase block">Tipo de Visibilidade:</label>
                      <select
                        value={newEpType}
                        onChange={(e) => setNewEpType(e.target.value as any)}
                        className="w-full bg-black border border-neutral-850 rounded px-2.5 py-1.5 text-white font-mono outline-none text-[10px]"
                        id="new-ep-type-select"
                      >
                        <option value="public">Público (Livre de Basic Auth)</option>
                        <option value="private">Privado (Requer Basic Auth)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-zinc-500 uppercase block">Segmento do Canal:</label>
                      <select
                        value={newEpSegment}
                        onChange={(e) => setNewEpSegment(e.target.value as any)}
                        className="w-full bg-black border border-neutral-850 rounded px-2.5 py-1.5 text-white font-mono outline-none text-[10px]"
                        id="new-ep-segment-select"
                      >
                        <option value="banco">Banco Comercial</option>
                        <option value="operador">Operador Móvel (Telecoms)</option>
                        <option value="outro">Outro Integrador Comercial</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-zinc-500 uppercase block">Descrição de Funcionalidade:</label>
                      <input
                        type="text"
                        placeholder="Breve sumário para orientar os desenvolvedores integradores..."
                        value={newEpDescription}
                        onChange={(e) => setNewEpDescription(e.target.value)}
                        className="w-full bg-black border border-neutral-850 rounded px-2.5 py-1.5 text-white font-mono outline-none text-[10px] focus:border-[#B87333]/55"
                        id="new-ep-desc-input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-zinc-500 uppercase block">Template do Request Body (JSON opcional):</label>
                      <textarea
                        placeholder={`{\n  "exemplo": "dados"\n}`}
                        value={newEpRequestBody}
                        onChange={(e) => setNewEpRequestBody(e.target.value)}
                        className="w-full h-20 bg-black border border-neutral-850 rounded p-2 text-emerald-400 font-mono text-[9px] resize-none outline-none focus:border-neutral-700"
                        id="new-ep-body-textarea"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-zinc-500 uppercase block">Template de Resposta Sucesso (JSON):</label>
                      <textarea
                        placeholder={`{\n  "status": "SUCCESS"\n}`}
                        value={newEpResponseSuccess}
                        onChange={(e) => setNewEpResponseSuccess(e.target.value)}
                        className="w-full h-20 bg-black border border-neutral-850 rounded p-2 text-blue-400 font-mono text-[9px] resize-none outline-none focus:border-neutral-700"
                        id="new-ep-response-textarea"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2.5 justify-end">
                    <button
                      type="button"
                      onClick={() => setIsAddingEndpoint(false)}
                      className="px-4 py-2 bg-zinc-900 border border-neutral-800 text-zinc-400 hover:text-white rounded cursor-pointer transition-all"
                      id="api-cancel-add-btn"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-black uppercase rounded cursor-pointer transition-all"
                      id="api-save-ep-btn"
                    >
                      Publicar Endpoint
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>

      </div>
        </>
      )}

      {apiSectionTab === "architecture" && (
        /* ENTERPRISE CONCEPTUAL ARCHITECTURE VIEW - HIGH LEVEL Refinement */
        <div className="space-y-5 animate-fade-in text-left">
          
          {/* TOP BANNER / SLA INDICATORS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* KPI 1 */}
            <div className="bg-[#050505] p-3.5 rounded-xl border border-neutral-900/80 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-zinc-500 font-mono text-[8px] uppercase block">Vazão do Sistema (Max TPS)</span>
                <span className="text-xl font-mono font-black text-amber-500 block">
                  {archSlaLoadLevel === "standard" ? "12,500" : archSlaLoadLevel === "peak" ? "250,000" : "4,200"}
                </span>
                <span className="text-[8.5px] text-zinc-400 font-sans block">
                  {archSlaLoadLevel === "standard" ? "Operação normal diária" : archSlaLoadLevel === "peak" ? "Stress-test em lote ativado" : "Modo failover redundante"}
                </span>
              </div>
              <span className="p-2 bg-amber-500/10 rounded-lg text-amber-500"><Zap className="w-5 h-5" /></span>
            </div>

            {/* KPI 2 */}
            <div className="bg-[#050505] p-3.5 rounded-xl border border-neutral-900/80 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-zinc-500 font-mono text-[8px] uppercase block">Latência Core (Ledger SLA)</span>
                <span className="text-xl font-mono font-black text-amber-500 block">
                  {archSlaLoadLevel === "standard" ? "12ms" : archSlaLoadLevel === "peak" ? "48ms" : "85ms"}
                </span>
                <span className="text-[8.5px] text-zinc-400 font-sans block">
                  {archSlaLoadLevel === "standard" ? "Consistência sub-100ms" : archSlaLoadLevel === "peak" ? "Fila bufferizada ativa" : "Redundância WAN Luanda-Huambo"}
                </span>
              </div>
              <span className="p-2 bg-amber-500/10 rounded-lg text-amber-500"><Activity className="w-5 h-5 animate-pulse" /></span>
            </div>

            {/* KPI 3 */}
            <div className="bg-[#050505] p-3.5 rounded-xl border border-neutral-900/80 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-zinc-500 font-mono text-[8px] uppercase block">Nós de Validação Ativos</span>
                <span className="text-xl font-mono font-black text-amber-500 block">
                  {archSlaLoadLevel === "standard" ? "6 / 6" : archSlaLoadLevel === "peak" ? "12 / 12" : "3 / 6"}
                </span>
                <span className="text-[8.5px] text-zinc-400 font-sans block">
                  {archSlaLoadLevel === "standard" ? "Consenso distribuído OK" : archSlaLoadLevel === "peak" ? "Auto-escalamento completo" : "Failover parcial (Huambo ativo)"}
                </span>
              </div>
              <span className="p-2 bg-amber-500/10 rounded-lg text-amber-500"><Server className="w-5 h-5" /></span>
            </div>

            {/* SLA CHANGER */}
            <div className="bg-zinc-950 p-3.5 rounded-xl border border-amber-950/20 space-y-2">
              <span className="text-zinc-400 font-mono text-[8px] uppercase block font-black">Simulador de Carga SLA:</span>
              <div className="grid grid-cols-3 gap-1 text-[8px] font-mono font-bold uppercase">
                <button
                  type="button"
                  onClick={() => {
                    setArchSlaLoadLevel("standard");
                    triggerFeedback("Modo de Operação Standard Ativado.", "info");
                  }}
                  className={`py-1 rounded text-center cursor-pointer border transition-all ${
                    archSlaLoadLevel === "standard" 
                      ? "bg-amber-500/15 text-amber-500 border-amber-500/30" 
                      : "bg-zinc-900 text-zinc-500 border-neutral-800 hover:text-zinc-300"
                  }`}
                  id="sla-btn-standard"
                >
                  Padrão
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setArchSlaLoadLevel("peak");
                    triggerFeedback("Modo de Sobrecarga e Pico (Stress-Test) Ativado!", "info");
                  }}
                  className={`py-1 rounded text-center cursor-pointer border transition-all ${
                    archSlaLoadLevel === "peak" 
                      ? "bg-amber-500/15 text-amber-500 border-amber-500/30 font-black animate-pulse" 
                      : "bg-zinc-900 text-zinc-500 border-neutral-800 hover:text-zinc-300"
                  }`}
                  id="sla-btn-peak"
                >
                  Pico
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setArchSlaLoadLevel("failover");
                    triggerFeedback("Alerta de Failover de Infraestrutura Ativado!", "error");
                  }}
                  className={`py-1 rounded text-center cursor-pointer border transition-all ${
                    archSlaLoadLevel === "failover" 
                      ? "bg-red-500/20 text-red-400 border-red-500/30 font-black" 
                      : "bg-zinc-900 text-zinc-500 border-neutral-800 hover:text-zinc-300"
                  }`}
                  id="sla-btn-failover"
                >
                  Failover
                </button>
              </div>
            </div>

          </div>

          {/* MAIN TWO-COLUMN LAYOUT */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
            
            {/* LEFT COLUMN: INTERACTIVE TOPOLOGY NAVIGATOR (4 COLS) */}
            <div className="xl:col-span-4 space-y-4">
              <div className="bg-[#050505] border border-neutral-900/80 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-neutral-900">
                  <Compass className="w-4 h-4 text-amber-500" />
                  <span className="font-extrabold text-[11px] uppercase tracking-wider text-white">Navegar pelas Camadas</span>
                </div>
                
                <p className="text-[10px] text-zinc-400 leading-normal font-sans">
                  Selecione uma das camadas abaixo para visualizar o comportamento de barramento, especificações corporativas de alta escalabilidade e detalhes de conformidade.
                </p>

                <div className="space-y-1.5 pt-1">
                  {[
                    { id: "edge", title: "1. Edge API Gateway Layer", desc: "Envoy, mTLS & WAF Cripto", icon: Cpu },
                    { id: "broker", title: "2. Real-Time Broker", desc: "Redpanda Event Queue Topic", icon: Zap },
                    { id: "ledger", title: "3. Ledger Core Engine (Rust)", desc: "Consistência SAGA-ACID Estrita", icon: Database },
                    { id: "security", title: "4. Webhook Transmissions", desc: "HMAC SHA256 Banco Callback", icon: Sliders }
                  ].map((layer) => {
                    const isSelected = archSelectedLayer === layer.id;
                    const IconComp = layer.icon;
                    return (
                      <button
                        key={layer.id}
                        type="button"
                        onClick={() => setArchSelectedLayer(layer.id as any)}
                        className={`w-full p-2.5 rounded-lg border text-left cursor-pointer transition-all flex items-center gap-3 ${
                          isSelected 
                            ? "bg-[#B87333]/10 border-[#B87333]/40 text-white" 
                            : "bg-zinc-950 border-neutral-900/50 hover:bg-zinc-900/30 text-zinc-400"
                        }`}
                        id={`arch-layer-btn-${layer.id}`}
                      >
                        <span className={`p-1 rounded-md ${isSelected ? "bg-amber-500/20 text-amber-500" : "bg-zinc-900 text-zinc-500"}`}>
                          <IconComp className="w-3.5 h-3.5" />
                        </span>
                        <div className="leading-tight">
                          <span className="text-[10px] font-bold block">{layer.title}</span>
                          <span className="text-[8px] text-zinc-500 font-mono uppercase block">{layer.desc}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* DYNAMIC LAYER DETAIL CARD */}
              <div className="bg-[#050505] border border-neutral-900/80 rounded-xl p-4 space-y-3 font-mono text-[9.5px]">
                {archSelectedLayer === "edge" && (
                  <>
                    <span className="font-extrabold text-amber-500 uppercase block text-[10px]">Especificações: Edge Gateway Layer</span>
                    <p className="text-zinc-400 leading-normal font-sans text-[10px]">
                      A primeira barreira de segurança utiliza múltiplos proxies Envoy redundantes em arquitetura de alto rendimento. O WAF inspeciona assinaturas e garante o bloqueio imediato de ataques DDoS e injeções de SQL.
                    </p>
                    <div className="border-t border-neutral-900 pt-2 space-y-1.5 text-[8.5px]">
                      <div><span className="text-zinc-500 uppercase">Criptografia:</span> <span className="text-zinc-300">TLS 1.3 / mTLS Forçado</span></div>
                      <div><span className="text-zinc-500 uppercase">Rate Limits:</span> <span className="text-zinc-300">10,000 req/s por Gateway IP</span></div>
                      <div><span className="text-zinc-500 uppercase">Autenticação:</span> <span className="text-zinc-300">Basic Auth de Larga Escala</span></div>
                      <div><span className="text-zinc-500 uppercase">Protocolo:</span> <span className="text-emerald-500">HTTP/2 e gRPC Síncrono</span></div>
                    </div>
                  </>
                )}

                {archSelectedLayer === "broker" && (
                  <>
                    <span className="font-extrabold text-amber-500 uppercase block text-[10px]">Especificações: Redpanda Broker</span>
                    <p className="text-zinc-400 leading-normal font-sans text-[10px]">
                      Um cluster Redpanda distribuído geograficamente recebe e bufferiza picos de carga. Garante latência de milissegundos de cauda, evitando perda de transações mesmo durante falhas severas nos servidores.
                    </p>
                    <div className="border-t border-neutral-900 pt-2 space-y-1.5 text-[8.5px]">
                      <div><span className="text-zinc-500 uppercase">Vazão Máxima:</span> <span className="text-zinc-300">250,000 TPS de pico</span></div>
                      <div><span className="text-zinc-500 uppercase">Tópico Principal:</span> <span className="text-zinc-300">sptr.pacs008.v1 (ISO 20022)</span></div>
                      <div><span className="text-zinc-500 uppercase">Persistência:</span> <span className="text-zinc-300">Replicação síncrona 3 vias</span></div>
                      <div><span className="text-zinc-500 uppercase">Garantia:</span> <span className="text-amber-500">At-Least-Once Delivery</span></div>
                    </div>
                  </>
                )}

                {archSelectedLayer === "ledger" && (
                  <>
                    <span className="font-extrabold text-amber-500 uppercase block text-[10px]">Especificações: Rust Immutable Ledger</span>
                    <p className="text-zinc-400 leading-normal font-sans text-[10px]">
                      O core ledger engine é implementado em Rust para máxima eficiência e segurança de memória. Utiliza um formato estrito de dupla entrada contábil (Double-Entry Bookkeeping). Cada entrada é ligada criptograficamente via hashes SHA-256.
                    </p>
                    <div className="border-t border-neutral-900 pt-2 space-y-1.5 text-[8.5px]">
                      <div><span className="text-zinc-500 uppercase">Integridade:</span> <span className="text-zinc-300">Serializabilidade estrita ACID</span></div>
                      <div><span className="text-zinc-500 uppercase">Hashing:</span> <span className="text-zinc-300">SHA-256 Append-Only Linkage</span></div>
                      <div><span className="text-zinc-500 uppercase">Assinatura HSM:</span> <span className="text-zinc-300">Chaves de Hardware SECP256K1</span></div>
                      <div><span className="text-zinc-500 uppercase">Auditoria:</span> <span className="text-emerald-500">Imutabilidade total certificada</span></div>
                    </div>
                  </>
                )}

                {archSelectedLayer === "security" && (
                  <>
                    <span className="font-extrabold text-amber-500 uppercase block text-[10px]">Especificações: Webhook Security Transmissions</span>
                    <p className="text-zinc-400 leading-normal font-sans text-[10px]">
                      Emissores assíncronos integrados transmitem callbacks automáticos para bancos comerciais e operadoras de telecomunicações móveis em milissegundos. Cada notificação possui cabeçalhos de segurança HMAC SHA256 invioláveis.
                    </p>
                    <div className="border-t border-neutral-900 pt-2 space-y-1.5 text-[8.5px]">
                      <div><span className="text-zinc-500 uppercase">Assinatura HMAC:</span> <span className="text-zinc-300">HMAC-SHA256 no header</span></div>
                      <div><span className="text-zinc-500 uppercase">Algoritmo de Retransmissão:</span> <span className="text-zinc-300">Exponential Backoff</span></div>
                      <div><span className="text-zinc-500 uppercase">Latência SLA:</span> <span className="text-zinc-300">Sub-150ms pós-liquidação</span></div>
                      <div><span className="text-zinc-500 uppercase">Autenticação:</span> <span className="text-emerald-500">Chave secreta simétrica rotativa</span></div>
                    </div>
                  </>
                )}
              </div>

            </div>

            {/* RIGHT COLUMN: DYNAMIC TOPOLOGY DIAGRAM & INTERACTIVE TESTER (8 COLS) */}
            <div className="xl:col-span-8 space-y-4">
              
              {/* TOPOLOGY MAP SCHEMATIC CARD */}
              <div className="bg-zinc-950 p-4 rounded-xl border border-neutral-900 space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-neutral-900/60 font-mono text-[10px]">
                  <span className="font-extrabold text-white uppercase">Esquema Topológico do Barramento KwanzaMóvel</span>
                  <span className="text-[8px] text-amber-500 font-bold uppercase animate-pulse">● Canal de Sincronização Ativo</span>
                </div>

                {/* THE VISUAL DIAGRAM BOARD */}
                <div className="bg-[#050505] p-5 rounded-lg border border-neutral-900/60 font-mono text-[9.5px] relative overflow-x-auto select-none">
                  <div className="flex flex-col items-center space-y-4 min-w-[500px]">
                    
                    {/* NODE 1 */}
                    <div className={`p-2 px-4 rounded border-2 transition-all ${
                      archSelectedLayer === "edge" || archFlowStep === 0
                        ? "bg-[#B87333]/15 border-[#B87333] text-amber-500 shadow-md" 
                        : "bg-black border-neutral-850 text-zinc-500"
                    }`}>
                      <div className="flex items-center gap-1.5 font-bold">
                        <Cpu className={`w-3.5 h-3.5 ${archFlowStep === 0 ? "animate-spin" : ""}`} />
                        <span className="font-extrabold uppercase">1. EDGE ENVOY GATEWAY & mTLS (Directiva 04)</span>
                      </div>
                    </div>

                    {/* CONNECTOR 1-2 */}
                    <div className="text-zinc-600 flex flex-col items-center">
                      <div className={`w-0.5 h-4 border-l-2 border-dashed ${archFlowStep === 1 ? "border-amber-500" : "border-zinc-850"}`}></div>
                      <span className={`text-[8px] uppercase ${archFlowStep === 1 ? "text-amber-500 font-bold animate-pulse" : "text-zinc-600"}`}>gRPC Protobuf Buffer</span>
                      <div className={`w-0.5 h-4 border-l-2 border-dashed ${archFlowStep === 1 ? "border-amber-500" : "border-zinc-850"}`}></div>
                    </div>

                    {/* NODE 2 */}
                    <div className={`p-2 px-4 rounded border-2 transition-all ${
                      archSelectedLayer === "broker" || archFlowStep === 1
                        ? "bg-[#B87333]/15 border-[#B87333] text-amber-500 shadow-md" 
                        : "bg-black border-neutral-850 text-zinc-500"
                    }`}>
                      <div className="flex items-center gap-1.5 font-bold">
                        <Zap className={`w-3.5 h-3.5 ${archFlowStep === 1 ? "animate-bounce" : ""}`} />
                        <span className="font-extrabold uppercase">2. KAFKA/REDPANDA HIGH-SPEED EVENT QUEUE</span>
                      </div>
                    </div>

                    {/* CONNECTOR 2-3 */}
                    <div className="text-zinc-600 flex flex-col items-center">
                      <div className={`w-0.5 h-4 border-l-2 border-dashed ${archFlowStep === 2 ? "border-amber-500" : "border-zinc-850"}`}></div>
                      <span className={`text-[8px] uppercase ${archFlowStep === 2 ? "text-amber-500 font-bold animate-pulse" : "text-zinc-600"}`}>Consumo Paralelo de Eventos</span>
                      <div className={`w-0.5 h-4 border-l-2 border-dashed ${archFlowStep === 2 ? "border-amber-500" : "border-zinc-850"}`}></div>
                    </div>

                    {/* NODE 3 */}
                    <div className={`p-2 px-4 rounded border-2 transition-all ${
                      archSelectedLayer === "ledger" || archFlowStep === 2
                        ? "bg-[#B87333]/15 border-[#B87333] text-amber-500 shadow-md" 
                        : "bg-black border-neutral-850 text-zinc-500"
                    }`}>
                      <div className="flex items-center gap-1.5 font-bold">
                        <Database className="w-3.5 h-3.5" />
                        <span className="font-extrabold uppercase">3. IMMUTABLE LEDGER CORE ENGINE (RUST SAGA-ACID)</span>
                      </div>
                    </div>

                    {/* CONNECTOR 3-4 */}
                    <div className="text-zinc-600 flex flex-col items-center">
                      <div className={`w-0.5 h-4 border-l-2 border-dashed ${archFlowStep === 3 ? "border-amber-500" : "border-zinc-850"}`}></div>
                      <span className={`text-[8px] uppercase ${archFlowStep === 3 ? "text-amber-500 font-bold animate-pulse" : "text-zinc-600"}`}>Criptografia HMAC SHA-256</span>
                      <div className={`w-0.5 h-4 border-l-2 border-dashed ${archFlowStep === 3 ? "border-amber-500" : "border-zinc-850"}`}></div>
                    </div>

                    {/* NODE 4 */}
                    <div className={`p-2 px-4 rounded border-2 transition-all ${
                      archSelectedLayer === "security" || archFlowStep === 3
                        ? "bg-[#B87333]/15 border-[#B87333] text-amber-500 shadow-md" 
                        : "bg-black border-neutral-850 text-zinc-500"
                    }`}>
                      <div className="flex items-center gap-1.5 font-bold">
                        <Sliders className="w-3.5 h-3.5" />
                        <span className="font-extrabold uppercase">4. WEBHOOK CALLBACK DELIVERY (Bancos Comerciais)</span>
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              {/* TRANSACTION SEQUENCE SIMULATOR CARD */}
              <div className="bg-[#050505] border border-neutral-900/80 rounded-xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 border-b border-neutral-900">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-amber-500" />
                    <span className="font-extrabold text-[11px] uppercase tracking-wider text-white">Simulador de Transações de Alta Performance</span>
                  </div>
                  
                  <button
                    type="button"
                    onClick={handlePlayArchFlow}
                    disabled={archFlowPlaying}
                    className={`px-3 py-1.5 rounded font-mono text-[9px] uppercase tracking-wide font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                      archFlowPlaying 
                        ? "bg-zinc-900 text-zinc-500 border border-zinc-800" 
                        : "bg-amber-500 hover:bg-amber-600 text-black shadow-lg"
                    }`}
                    id="play-arch-flow-btn"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>{archFlowPlaying ? "Simulando..." : "Simular Fluxo de Transação"}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left block description */}
                  <div className="space-y-2 font-mono text-[9px] text-zinc-400">
                    <span className="text-zinc-500 uppercase block font-extrabold text-[8.5px]">Descrição do Estado Atual:</span>
                    <div className="bg-zinc-950 p-3 rounded-lg border border-neutral-900/80 space-y-1.5 min-h-[140px] leading-relaxed">
                      <span className="text-amber-500 font-extrabold uppercase block text-[9.5px]">
                        {archFlowSteps[archFlowStep].title}
                      </span>
                      <div className="flex gap-1.5 items-center">
                        <span className="text-zinc-600 font-bold uppercase">Liga:</span>
                        <code className="text-zinc-300">{archFlowSteps[archFlowStep].actor}</code>
                      </div>
                      <p className="text-zinc-400 font-sans mt-1">
                        {archFlowSteps[archFlowStep].description}
                      </p>
                    </div>
                  </div>

                  {/* Right block terminal logs */}
                  <div className="space-y-2 font-mono text-[9px]">
                    <span className="text-zinc-500 uppercase block font-extrabold text-[8.5px]">Logs Console Enterprise:</span>
                    <div className="bg-black text-emerald-400 p-3 rounded-lg border border-neutral-900 h-[140px] overflow-y-auto font-mono text-[8.5px] leading-relaxed space-y-1.5 text-left">
                      {archConsoleLogs.length === 0 ? (
                        <div className="text-zinc-600 italic">
                          Consola aguardando início de simulação... Clique no botão acima para traçar o fluxo.
                        </div>
                      ) : (
                        archConsoleLogs.map((log, idx) => (
                          <div key={idx} className="whitespace-pre-wrap">
                            {log}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* CRYPTOGRAPHY HSM SANDBOX */}
              <div className="bg-zinc-950 p-4 rounded-xl border border-neutral-900 space-y-3 font-mono text-[10px]">
                <div className="flex items-center gap-2 pb-2 border-b border-neutral-900/60">
                  <Lock className="w-4 h-4 text-amber-500" />
                  <span className="font-extrabold text-white uppercase">Módulo Criptográfico HSM (Directiva 04 BNA)</span>
                </div>

                <p className="text-zinc-400 leading-normal font-sans text-[9.5px]">
                  Todos os payloads de transação transitados na KwanzaMóvel possuem assinatura criptográfica síncrona gerada em HSM. Simule o cálculo do hash ECDSA SECP256K1 inserindo dados abaixo para testar a robustez do barramento.
                </p>

                <form onSubmit={handleCalculateEnterpriseSignature} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-zinc-500 uppercase block text-[8px] font-black font-mono">Payload de Transação para Assinar:</label>
                    <textarea
                      value={archCryptText}
                      onChange={(e) => setArchCryptText(e.target.value)}
                      className="w-full h-12 bg-black border border-neutral-850 rounded p-2 text-[9px] text-zinc-300 resize-none outline-none focus:border-[#B87333]/50 focus:ring-1 focus:ring-[#B87333]/15 font-mono"
                      id="crypt-payload-input"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                    <button
                      type="submit"
                      disabled={archCryptRunning}
                      className="px-4 py-2 bg-zinc-900 border border-neutral-800 hover:bg-[#B87333]/10 hover:border-[#B87333]/40 text-zinc-300 hover:text-white rounded cursor-pointer transition-all uppercase text-[9px] font-black font-mono flex items-center gap-1.5 justify-center"
                      id="calculate-crypt-sig-btn"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${archCryptRunning ? "animate-spin" : ""}`} />
                      <span>{archCryptRunning ? "Calculando..." : "Calcular Assinatura HSM"}</span>
                    </button>

                    {archCryptSignature && (
                      <div className="flex-1 bg-black/40 border border-emerald-950/30 p-2 rounded flex items-center justify-between gap-2 overflow-hidden text-left">
                        <div className="truncate">
                          <span className="text-zinc-600 block text-[7px] uppercase font-black">Assinatura Digital de Saída:</span>
                          <code className="text-emerald-400 text-[8.5px] select-all truncate">{archCryptSignature}</code>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(archCryptSignature);
                            triggerFeedback("Assinatura copiada com sucesso!", "success");
                          }}
                          className="bg-zinc-900 border border-neutral-850 hover:bg-[#B87333]/15 text-zinc-400 hover:text-white px-2 py-1 rounded text-[8px] cursor-pointer"
                          id="copy-crypt-sig-btn"
                        >
                          Copiar
                        </button>
                      </div>
                    )}
                  </div>
                </form>
              </div>

            </div>

          </div>

        </div>
      )}

      {apiSectionTab === "supervisao" && (
        <div className="space-y-4 animate-fade-in text-left" id="api-tab-supervisao">
          {/* CONTENT OF SUPERVISION & AUDITING TAB */}
          <div className="bg-[#050505] border border-neutral-900/80 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1 max-w-xl font-mono">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span className="font-extrabold text-[11.5px] uppercase tracking-wider text-white">
                  Sistema de Supervisão e Auditoria Síncrona
                </span>
                <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 text-[7px] px-1.5 py-0.2 rounded font-mono uppercase font-bold animate-pulse">Ativo</span>
              </div>
              <p className="text-[10px] text-zinc-400 font-sans leading-relaxed">
                Este portal providencia auditoria contínua a todas as requisições de sandbox de API e webhooks. O motor AML integrado monitoriza fluxos financeiros e rotas de interoperabilidade de acordo com as directivas do BNA.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 w-full md:w-auto font-mono text-[9.5px]">
              {/* Botão de Exportar CSV */}
              <button
                type="button"
                onClick={handleExportAuditLogsCsv}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-[#B87333]/15 border border-neutral-800 hover:border-[#B87333]/50 text-zinc-300 hover:text-white rounded-lg transition-all cursor-pointer font-bold w-full sm:w-auto"
                id="export-audit-csv-btn"
              >
                <Download className="w-3.5 h-3.5 text-amber-500" />
                <span>Exportar CSV</span>
              </button>

              {/* Botão de Exportar JSON */}
              <button
                type="button"
                onClick={handleExportAuditLogsJson}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-[#B87333]/15 border border-[#B87333]/30 hover:border-[#B87333]/60 text-amber-500 hover:text-white rounded-lg transition-all cursor-pointer font-black uppercase tracking-wide w-full sm:w-auto"
                id="export-audit-json-btn"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar JSON</span>
              </button>

              {/* Botão de Limpar */}
              <button
                type="button"
                onClick={handleClearAuditLogs}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-950 hover:bg-rose-950/20 border border-neutral-900 hover:border-rose-900 text-zinc-400 hover:text-rose-400 rounded-lg transition-all cursor-pointer font-bold w-full sm:w-auto"
                id="clear-audit-logs-btn"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpar Logs</span>
              </button>
            </div>
          </div>

          {/* INDICATORS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {/* CARD 1: TOTAL REQUESTS */}
            <div className="bg-zinc-950 border border-neutral-900 p-4 rounded-xl flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-zinc-500 font-mono text-[8px] uppercase block">Total de Requisições</span>
                <span className="text-xl font-mono font-black text-white block">
                  {apiAuditLogs.length}
                </span>
                <span className="text-[8.5px] text-zinc-400 font-sans block">Monitoradas em tempo real</span>
              </div>
              <span className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><Database className="w-5 h-5" /></span>
            </div>

            {/* CARD 2: AVG LATENCY */}
            <div className="bg-zinc-950 border border-neutral-900 p-4 rounded-xl flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-zinc-500 font-mono text-[8px] uppercase block">Latência Média</span>
                <span className="text-xl font-mono font-black text-[#B87333] block">
                  {apiAuditLogs.length > 0 
                    ? `${Math.round(apiAuditLogs.reduce((sum, log) => sum + log.latencyMs, 0) / apiAuditLogs.length)} ms`
                    : "0 ms"
                  }
                </span>
                <span className="text-[8.5px] text-zinc-400 font-sans block">Tempo de resposta gateway</span>
              </div>
              <span className="p-2 bg-amber-500/10 rounded-lg text-[#B87333]"><Activity className="w-5 h-5 animate-pulse" /></span>
            </div>

            {/* CARD 3: SUCCESS RATE */}
            <div className="bg-zinc-950 border border-neutral-900 p-4 rounded-xl flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-zinc-500 font-mono text-[8px] uppercase block">Rácio de Sucesso</span>
                <span className="text-xl font-mono font-black text-emerald-400 block">
                  {apiAuditLogs.length > 0
                    ? `${Math.round((apiAuditLogs.filter(log => log.status >= 200 && log.status < 300).length / apiAuditLogs.length) * 100)}%`
                    : "100%"
                  }
                </span>
                <span className="text-[8.5px] text-zinc-400 font-sans block">Sucesso nas transações</span>
              </div>
              <span className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400"><CheckCircle className="w-5 h-5" /></span>
            </div>

            {/* CARD 4: AML ACTIVE STATUS */}
            <div className="bg-zinc-950 border border-neutral-900 p-4 rounded-xl flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-zinc-500 font-mono text-[8px] uppercase block">Barreira AML Ativa</span>
                <div className="flex items-center gap-2">
                  <span className={`text-xl font-mono font-black ${amlCheckActive ? "text-amber-500" : "text-zinc-500"} block`}>
                    {amlCheckActive ? "SÍNCRONA" : "INATIVA"}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setAmlCheckActive(!amlCheckActive);
                      triggerFeedback(`Filtro de AML síncrona ${!amlCheckActive ? "ACTIVADO" : "DESACTIVADO"} com sucesso!`, "info");
                    }}
                    className={`text-[8px] font-mono px-1.5 py-0.5 border rounded uppercase font-bold cursor-pointer transition-colors ${
                      amlCheckActive 
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20" 
                        : "bg-zinc-900 border-neutral-800 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                    }`}
                  >
                    Alternar
                  </button>
                </div>
                <span className="text-[8.5px] text-zinc-400 font-sans block">Prevenção branqueamento capitais</span>
              </div>
              <span className={`p-2 rounded-lg ${amlCheckActive ? "bg-amber-500/10 text-amber-500" : "bg-zinc-900 text-zinc-500"}`}><Shield className="w-5 h-5" /></span>
            </div>
          </div>

          {/* MAIN GRID: SIMULATOR & LOG TABLE */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
            {/* SIMULATOR PANEL (4 COLS) */}
            <div className="xl:col-span-4 space-y-4">
              <div className="bg-zinc-950 p-4 rounded-xl border border-neutral-900 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-neutral-900/60">
                  <Terminal className="w-4 h-4 text-amber-500" />
                  <span className="font-extrabold text-white font-mono text-[10px] uppercase">Simulador de Tráfego de API</span>
                </div>
                
                <p className="text-zinc-400 leading-normal font-sans text-[9.5px]">
                  Simule pedidos de API de bancos parceiros ou chamadas internas regulatórias para testar os filtros de conformidade, tempos de latência e registos contáveis.
                </p>

                <form onSubmit={handleSimulateIncomingRequest} className="space-y-3 font-mono text-[9px]">
                  <div className="space-y-1">
                    <label className="text-zinc-500 uppercase block text-[8px] font-black">Endpoint Destino:</label>
                    <select
                      value={simAuditEndpoint}
                      onChange={(e) => setSimAuditEndpoint(e.target.value)}
                      className="w-full bg-black border border-neutral-850 rounded px-2 py-1.5 text-white outline-none focus:border-amber-900"
                    >
                      {endpoints.map(ep => (
                        <option key={ep.id} value={ep.path}>{ep.method} {ep.path}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-zinc-500 uppercase block text-[8px] font-black">Origem da Requisição:</label>
                    <select
                      value={simAuditSource}
                      onChange={(e) => setSimAuditSource(e.target.value)}
                      className="w-full bg-black border border-neutral-850 rounded px-2 py-1.5 text-white outline-none focus:border-amber-900"
                    >
                      <option value="Banco Fomento Angola (BFA)">Banco Fomento Angola (BFA)</option>
                      <option value="Banco Angolano de Investimentos (BAI)">Banco Angolano de Investimentos (BAI)</option>
                      <option value="Banco BIC">Banco BIC</option>
                      <option value="Banco SOL">Banco SOL</option>
                      <option value="Unitel Money">Unitel Money</option>
                      <option value="Terminal Regulatório Externo">Terminal Regulatório Externo (SGA-BNA)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-zinc-500 uppercase block text-[8px] font-black">Código de Resposta Simulado:</label>
                    <select
                      value={simAuditStatus}
                      onChange={(e) => setSimAuditStatus(Number(e.target.value))}
                      className="w-full bg-black border border-neutral-850 rounded px-2 py-1.5 text-white outline-none focus:border-amber-900"
                    >
                      <option value={200}>200 OK (Sucesso Contábil)</option>
                      <option value={201}>201 Created (Recurso Criado)</option>
                      <option value={400}>400 Bad Request (JSON Inválido)</option>
                      <option value={401}>401 Unauthorized (Falha de Credenciais)</option>
                      <option value={403}>403 Forbidden (Acesso Bloqueado)</option>
                      <option value={500}>500 Internal Server Error (Erro Core)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-[#B87333] hover:from-amber-700 hover:to-[#9E5F27] text-white font-black text-[10px] uppercase rounded-lg tracking-wider transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-[#B87333]/15"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Disparar Chamada de API</span>
                  </button>
                </form>
              </div>

              {/* SPECIFICATION CARD */}
              <div className="bg-zinc-950 p-4 rounded-xl border border-neutral-900 font-mono text-[9px] space-y-2 text-zinc-400">
                <span className="font-extrabold text-white block uppercase text-[10px] pb-1 border-b border-neutral-900">Directiva N.º 04/2026/BNA</span>
                <p className="leading-relaxed font-sans text-[9.5px]">
                  Todos os canais de sandbox que processem pacotes contábeis móveis devem passar por auditoria cibernética com logs imutáveis guardados para fins de reconciliação de contas.
                </p>
                <div className="space-y-1 text-[8.5px]">
                  <div><span className="text-zinc-500">FORMATO:</span> <span className="text-zinc-300">ISO 20022 Compilado</span></div>
                  <div><span className="text-zinc-500">RETENÇÃO:</span> <span className="text-zinc-300">5 Anos Consecutivos</span></div>
                  <div><span className="text-zinc-500">REQUISITO:</span> <span className="text-[#B87333] font-bold">Assinatura HMAC Habilitada</span></div>
                </div>
              </div>
            </div>

            {/* AUDIT LOG TABLE (8 COLS) */}
            <div className="xl:col-span-8 bg-zinc-950 rounded-xl border border-neutral-900 p-4 space-y-3 font-mono">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 border-b border-neutral-900">
                <div>
                  <span className="text-[8.5px] uppercase font-bold text-zinc-500 block">Histórico Regulatório</span>
                  <span className="text-xs font-black text-white">Registos Ativos de Transações das APIs</span>
                </div>

                {/* FILTERS */}
                <div className="flex flex-wrap gap-1 text-[8px] font-bold uppercase">
                  {(["ALL", "SUCCESS", "ERRORS", "AML_ALERT"] as const).map(f => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setAuditLogFilter(f)}
                      className={`px-2.5 py-1 rounded border transition-all cursor-pointer ${
                        auditLogFilter === f
                          ? "bg-amber-500/15 border-amber-500/40 text-amber-500 font-black"
                          : "bg-zinc-900 border-neutral-850 text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      {f === "ALL" ? "Todos" : f === "SUCCESS" ? "Sucesso" : f === "ERRORS" ? "Erros" : "Alertas AML"}
                    </button>
                  ))}
                </div>
              </div>

              {/* TABLE CONTAINER */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[9px]">
                  <thead>
                    <tr className="border-b border-neutral-900 text-zinc-500 uppercase text-[8px]">
                      <th className="py-2 font-black">Data/Hora</th>
                      <th className="py-2 font-black">Endpoint</th>
                      <th className="py-2 font-black">Origem/Banco</th>
                      <th className="py-2 font-black text-center">Status</th>
                      <th className="py-2 font-black text-center">Latência</th>
                      <th className="py-2 font-black text-center">Tamanho</th>
                      <th className="py-2 font-black text-right">Filtro AML</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiAuditLogs
                      .filter(log => {
                        if (auditLogFilter === "SUCCESS") return log.status >= 200 && log.status < 300;
                        if (auditLogFilter === "ERRORS") return log.status >= 400;
                        if (auditLogFilter === "AML_ALERT") return log.securityCheck === "AML_WARNING";
                        return true;
                      })
                      .map((log) => {
                        const isSuccess = log.status >= 200 && log.status < 300;
                        const statusColor = isSuccess 
                          ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/15" 
                          : "text-rose-400 bg-rose-500/10 border-rose-500/15";

                        return (
                          <tr key={log.id} className="border-b border-neutral-900/50 hover:bg-zinc-900/20 transition-all font-mono">
                            <td className="py-2.5 text-zinc-400 whitespace-nowrap">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </td>
                            <td className="py-2.5 text-zinc-200">
                              <span className="text-[7.5px] bg-zinc-900 px-1 py-0.2 rounded border border-neutral-800 mr-1">{log.method}</span>
                              <code className="text-[8.5px]">{log.endpoint}</code>
                            </td>
                            <td className="py-2.5 text-zinc-300 whitespace-nowrap font-bold">
                              {log.source}
                            </td>
                            <td className="py-2.5 text-center">
                              <span className={`px-1.5 py-0.5 border rounded font-black text-[8px] ${statusColor}`}>
                                {log.status}
                              </span>
                            </td>
                            <td className="py-2.5 text-center text-zinc-300">
                              {log.latencyMs} ms
                            </td>
                            <td className="py-2.5 text-center text-zinc-400">
                              {log.payloadSize}
                            </td>
                            <td className="py-2.5 text-right whitespace-nowrap">
                              {log.securityCheck === "APPROVED" && (
                                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[7px] px-1 py-0.2 rounded font-bold uppercase">
                                  Aprovado
                                </span>
                              )}
                              {log.securityCheck === "AML_WARNING" && (
                                <span className="bg-amber-500/10 text-amber-500 border border-amber-500/25 text-[7px] px-1 py-0.2 rounded font-black uppercase animate-pulse">
                                  Sob Monitoria
                                </span>
                              )}
                              {log.securityCheck === "BLOCKED" && (
                                <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[7px] px-1 py-0.2 rounded font-black uppercase">
                                  Bloqueado
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    }
                    {apiAuditLogs.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-zinc-500 italic">
                          Sem registos de auditoria correspondentes em cache local. Dispare uma chamada de teste.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {apiSectionTab === "ultraleve" && (
        <div className="space-y-6 animate-fade-in text-left">
          {/* OVERVIEW PANEL HEADER */}
          <div className="bg-[#050505] border border-neutral-900 rounded-2xl p-5 space-y-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none select-none">
              <Sparkles className="w-40 h-40 text-amber-500" />
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-1 text-amber-500 bg-amber-500/10 rounded-lg"><Zap className="w-5 h-5 animate-pulse" /></span>
                  <span className="font-extrabold text-[12px] uppercase tracking-wider text-white font-mono">
                    Arquitetura Ultraleve de Contexto & Mapeador Next-Gen
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 font-sans max-w-xl leading-relaxed">
                  Ambiente de desenvolvimento de alta eficiência para engenharia financeira em Luanda. Desenvolvido para poupar até 99.4% de tokens e ultrapassar limites de contexto do Google AI Studio em contas gratuitas.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[8px] px-2 py-0.5 rounded font-mono uppercase font-bold animate-pulse">Eficiência: 99.4%</span>
                <span className="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[8px] px-2 py-0.5 rounded font-mono uppercase font-bold">mTLS Ativo</span>
              </div>
            </div>

            {/* Inner Tabs: Relatório Técnico vs Otimizador */}
            <div className="flex border-b border-neutral-900/60 pt-2 font-mono text-[9px] select-none gap-2">
              <button
                type="button"
                onClick={() => setActiveUltralightTab("relatorio")}
                className={`pb-2 px-3 font-bold uppercase tracking-wider transition-all cursor-pointer relative ${
                  activeUltralightTab === "relatorio"
                    ? "text-white border-b-2 border-amber-500 font-extrabold"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <Compass className="w-3.5 h-3.5 inline mr-1.5 align-text-bottom text-amber-500" />
                Relatório Técnico (Enterprise & Ultraleve)
              </button>
              <button
                type="button"
                onClick={() => setActiveUltralightTab("otimizador")}
                className={`pb-2 px-3 font-bold uppercase tracking-wider transition-all cursor-pointer relative ${
                  activeUltralightTab === "otimizador"
                    ? "text-white border-b-2 border-amber-500 font-extrabold"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <Sliders className="w-3.5 h-3.5 inline mr-1.5 align-text-bottom text-amber-500" />
                Otimizador de Contexto AI (INDEX.md)
              </button>
            </div>
          </div>

          {/* INNER TAB: RELATÓRIO TÉCNICO */}
          {activeUltralightTab === "relatorio" && (
            <div className="space-y-6">
              {/* MAIN CONTENT OF RELATÓRIO */}
              <div className="bg-[#050505] border border-neutral-900 rounded-2xl p-6 space-y-6 font-sans leading-relaxed">
                
                {/* Executive Summary */}
                <div className="border-l-4 border-amber-500 pl-4 py-1 bg-amber-500/5 rounded-r-lg space-y-2">
                  <span className="text-[9px] uppercase font-mono font-bold tracking-widest text-amber-500">Sumário Executivo</span>
                  <h3 className="text-sm font-extrabold text-white leading-snug">Roteiro Tecnológico para o Estado de Arte da Interoperabilidade em Angola</h3>
                  <p className="text-[10px] text-zinc-350 leading-relaxed">
                    Este documento estratégico detalha a transição do ecossistema sandbox do <strong>KwanzaMóvel v2</strong> para os patamares de arquitetura <strong>Enterprise (Corporativo Distribuído)</strong> e <strong>Ultraleve de Contexto de Última Geração</strong>. O objetivo é estabelecer uma infraestrutura de pagamentos instantâneos que supere tudo já visto, com foco em resiliência criptográfica síncrona e conservação de recursos inteligentes.
                  </p>
                </div>

                {/* Section 1: Nivel Enterprise */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-1 border-b border-neutral-900">
                    <span className="bg-amber-500/10 text-amber-500 p-1 rounded-md text-[9px] font-mono font-bold">01</span>
                    <h4 className="text-xs font-bold uppercase text-white tracking-wider">Atingindo o Nível Enterprise (Corporativo de Ponta)</h4>
                  </div>
                  <p className="text-[10px] text-zinc-400">
                    Para garantir que o KwanzaMóvel possa transitar de um ambiente sandbox simulado para a liquidação interbancária definitiva suportando milhões de requisições de 26 bancos comerciais, os seguintes marcos estruturais devem ser implementados:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="bg-zinc-950 p-4 rounded-xl border border-neutral-900 space-y-2">
                      <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-zinc-200">
                        <Lock className="w-3.5 h-3.5 text-amber-500" />
                        <span>Consenso Distribuído (BFT Ledger)</span>
                      </div>
                      <p className="text-[9px] text-zinc-450 leading-relaxed">
                        Substituição do motor de ledger em memória por uma rede de consenso de tolerância a falhas bizantinas (<strong>BFT</strong>) federada entre o BNA e os bancos comerciais de Luanda. Garante que nenhuma instituição isolada possa adulterar o histórico do ledger.
                      </p>
                    </div>

                    <div className="bg-zinc-950 p-4 rounded-xl border border-neutral-900 space-y-2">
                      <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-zinc-200">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span>mTLS & Envelopes de Segurança HSM</span>
                      </div>
                      <p className="text-[9px] text-zinc-450 leading-relaxed">
                        Implementação de segurança baseada em Hardware (<strong>HSM PKCS#11</strong>) para assinar envelopes digitais de mensagens Pacs.008 em trânsito. Autenticação mTLS rígida com certificados auto-geridos em infraestrutura de chaves públicas (ICP Angola).
                      </p>
                    </div>

                    <div className="bg-zinc-950 p-4 rounded-xl border border-neutral-900 space-y-2">
                      <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-zinc-200">
                        <FileCode className="w-3.5 h-3.5 text-blue-500" />
                        <span>ISO 20022 Estrito via XSD Schema</span>
                      </div>
                      <p className="text-[9px] text-zinc-450 leading-relaxed">
                        Integração de validadores estruturais nativos de esquemas XML (XSD) em tempo real, cobrindo não apenas <em>pacs.008</em> (liquidação síncrona), mas também <em>pacs.004</em> (devoluções de pagamento) e <em>camt.053</em> (extratos consolidados de fim do dia).
                      </p>
                    </div>

                    <div className="bg-zinc-950 p-4 rounded-xl border border-neutral-900 space-y-2">
                      <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-zinc-200">
                        <Sliders className="w-3.5 h-3.5 text-purple-500" />
                        <span>ZKP (Zero-Knowledge AML)</span>
                      </div>
                      <p className="text-[9px] text-zinc-450 leading-relaxed">
                        Criptografia homomórfica e provas de conhecimento zero para auditar conformidade AML e limites de transação diários das carteiras de nível 1 (de baixa renda) sem expor publicamente as identidades civis dos clientes finais.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section 2: Nivel Ultraleve de Ultima Geracao */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2 pb-1 border-b border-neutral-900">
                    <span className="bg-emerald-500/10 text-emerald-400 p-1 rounded-md text-[9px] font-mono font-bold">02</span>
                    <h4 className="text-xs font-bold uppercase text-white tracking-wider">Atingindo o Nível Ultraleve de Última Geração</h4>
                  </div>
                  <p className="text-[10px] text-zinc-400">
                    O conceito "Ultraleve" foca em remover todo o atrito computacional desnecessário, latência de transporte e desperdício de dados. No contexto da rede KwanzaMóvel e de agentes de IA, isso representa:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="bg-zinc-950 p-4 rounded-xl border border-neutral-900 space-y-2">
                      <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-zinc-200">
                        <Cpu className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                        <span>Validação WebAssembly (WASM) no Edge</span>
                      </div>
                      <p className="text-[9px] text-zinc-450 leading-relaxed">
                        Compilação de módulos de verificação criptográfica pesados em Rust-para-WASM executando diretamente na borda do cliente (no telemóvel do utilizador ou no terminal do agente físico). Reduz a sobrecarga de processamento central da rede do BNA a praticamente zero.
                      </p>
                    </div>

                    <div className="bg-zinc-950 p-4 rounded-xl border border-neutral-900 space-y-2">
                      <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-zinc-200">
                        <Globe className="w-3.5 h-3.5 text-amber-500" />
                        <span>Sincronização P2P Sub-10ms via WebRTC</span>
                      </div>
                      <p className="text-[9px] text-zinc-450 leading-relaxed">
                        Criação de canais diretos de comunicação ponto a ponto (peer-to-peer) de dados binários compactados entre os gateways bancários adjacentes. Bypassa o roteamento centralizado do SPTR tradicional para mensagens de baixo valor, alcançando latência menor que 10 milissegundos.
                      </p>
                    </div>

                    <div className="bg-zinc-950 p-4 rounded-xl border border-neutral-900 space-y-2 col-span-1 md:col-span-2">
                      <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-zinc-200">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        <span>Otimização Extrema de Contexto por Árvore Semântica Abstracta</span>
                      </div>
                      <p className="text-[9px] text-zinc-450 leading-relaxed">
                        Para o desenvolvimento assistido por Inteligência Artificial, o nível ultraleve de última geração redefine como o código-fonte interage com grandes modelos de linguagem (LLMs). Em vez de entupir o prompt com centenas de milhares de linhas redundantes de frameworks e ficheiros pesados, a IA trabalha exclusivamente com índices funcionais ultra-comprimidos (hashes, esqueletos de métodos e metadados de dependência). O modelo atua de forma cirúrgica, solicitando apenas as linhas exatas a serem modificadas. Isso poupa até <strong>99%</strong> de recursos de contexto de LLM, tornando o desenvolvimento extremamente rápido, preciso e focado na resolução lógica.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section 3: Roadmap toward supreme state */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2 pb-1 border-b border-neutral-900">
                    <span className="bg-blue-500/10 text-blue-400 p-1 rounded-md text-[9px] font-mono font-bold">03</span>
                    <h4 className="text-xs font-bold uppercase text-white tracking-wider">Cronograma para Soberania Tecnológica do Ledger</h4>
                  </div>
                  <div className="relative border-l-2 border-neutral-850 pl-4 ml-2.5 py-1 space-y-4 text-[9.5px]">
                    <div className="space-y-0.5">
                      <span className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                      <strong className="text-zinc-200 block font-sans">Q1 2026: Consolidação Imutável (Estado Atual)</strong>
                      <span className="text-zinc-500 font-sans">Implementação de criptografia SHA-256 local, base de dados transacional resiliente baseada em IndexedDB síncrona, emulação robusta de portais de agentes e simulador forense de webhooks.</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="absolute left-[-5px] top-[74px] w-2.5 h-2.5 rounded-full bg-zinc-750"></span>
                      <strong className="text-zinc-400 block font-sans">Q3 2026: Descentralização e mTLS</strong>
                      <span className="text-zinc-550 font-sans">Substituição do ledger local por nós federados em rede privada Hyperledger Besu entre 5 principais bancos nacionais. Certificação x509 gerida via infraestrutura PKI dedicada.</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="absolute left-[-5px] top-[144px] w-2.5 h-2.5 rounded-full bg-zinc-750"></span>
                      <strong className="text-zinc-400 block font-sans">Q1 2027: Arquitetura Core Ultraleve e WASM</strong>
                      <span className="text-zinc-550 font-sans">Migração de todas as regras de validação AML complexas e assinaturas RSA interbancárias para WebAssembly leve rodando na borda, eliminando os custos centrais de computação na nuvem pública do BNA.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* INNER TAB: CONTEXT OPTIMIZER TOOL */}
          {activeUltralightTab === "otimizador" && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              
              {/* LEFT COLUMN: FILE CHECKER & CALCULATOR (5 cols) */}
              <div className="md:col-span-5 space-y-4">
                <div className="bg-[#050505] border border-neutral-900 rounded-xl p-4.5 space-y-4">
                  <div className="flex items-center gap-1.5 pb-2 border-b border-neutral-900">
                    <Sliders className="w-4 h-4 text-amber-500" />
                    <span className="font-extrabold text-[11px] uppercase tracking-wider text-white">Calculador de Contexto</span>
                  </div>

                  <p className="text-[9.5px] text-zinc-400 font-sans leading-relaxed">
                    Ative ou desative os ficheiros que está ativamente a alterar. O otimizador calculará a poupança exata de contexto no prompt do AI Studio em tempo real.
                  </p>

                  {/* File List Checkboxes */}
                  <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                    {projectFilesList.map((file) => {
                      const isChecked = selectedIndexFiles[file.path] || false;
                      return (
                        <div 
                          key={file.path}
                          onClick={() => {
                            setSelectedIndexFiles(prev => ({
                              ...prev,
                              [file.path]: !isChecked
                            }));
                          }}
                          className={`flex items-center justify-between p-2 rounded-lg border text-[9.5px] cursor-pointer transition-all select-none ${
                            isChecked 
                              ? "bg-amber-500/5 border-amber-500/25 text-white" 
                              : "bg-zinc-950/40 border-neutral-900 text-zinc-500 hover:border-neutral-800"
                          }`}
                        >
                          <div className="flex items-center gap-2 max-w-[80%]">
                            <input 
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}} // handled by click on container
                              className="accent-amber-500 shrink-0 pointer-events-none"
                            />
                            <div className="truncate">
                              <span className="font-bold block truncate">{file.name}</span>
                              <span className="text-[7.5px] text-zinc-500 font-mono block truncate">{file.path}</span>
                            </div>
                          </div>
                          <span className="font-mono text-[8px] text-zinc-450 bg-zinc-900 border border-neutral-850 px-1 py-0.2 rounded shrink-0">
                            {file.lines} linhas
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Dynamic Metrics Output */}
                  <div className="bg-zinc-950 p-3 rounded-lg border border-neutral-900 space-y-2.5">
                    <span className="text-[8px] uppercase font-mono font-bold tracking-widest text-zinc-500 block">Eficiência de Tokens</span>
                    
                    {(() => {
                      const totalOriginalTokens = projectFilesList.reduce((acc, f) => acc + f.tokens, 0);
                      // If indexed, total tokens = index weight (~1800 tokens) + selected files tokens
                      const indexWeight = 1800; 
                      const selectedTokensSum = projectFilesList
                        .filter(f => selectedIndexFiles[f.path])
                        .reduce((acc, f) => acc + f.tokens, 0);
                      const currentOptimizedTokens = indexWeight + selectedTokensSum;
                      const savingRatio = ((1 - (currentOptimizedTokens / totalOriginalTokens)) * 100).toFixed(2);
                      const savedCount = totalOriginalTokens - currentOptimizedTokens;

                      return (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2 text-[9px] font-mono">
                            <div>
                              <span className="text-zinc-650 block">Antes (Código Completo):</span>
                              <span className="text-red-400 font-bold block">{totalOriginalTokens.toLocaleString()} tokens</span>
                            </div>
                            <div>
                              <span className="text-zinc-600 block">Depois (Ultraleve):</span>
                              <span className="text-emerald-400 font-bold block">{currentOptimizedTokens.toLocaleString()} tokens</span>
                            </div>
                          </div>

                          {/* Horizontal mini progress bar */}
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-[8.5px] font-mono">
                              <span className="text-zinc-500">Poupança Realizada:</span>
                              <span className="text-emerald-400 font-bold">{savingRatio}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-neutral-900">
                              <div 
                                className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-500 rounded-full"
                                style={{ width: `${savingRatio}%` }}
                              />
                            </div>
                          </div>

                          <div className="text-[8.5px] font-sans text-zinc-450 leading-relaxed">
                            Poupou <strong>{savedCount.toLocaleString()} tokens</strong> nesta requisição. Os limites de contexto gratuito do AI Studio não serão excedidos.
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: INTERACTIVE TABS FOR OUTPUT (7 cols) */}
              <div className="md:col-span-7 space-y-4">
                <div className="bg-[#050505] border border-neutral-900 rounded-xl p-4.5 space-y-4 flex flex-col justify-between">
                  
                  {/* Title and Copy Action */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
                      <div className="flex items-center gap-1.5">
                        <FileCode className="w-4 h-4 text-amber-500" />
                        <span className="font-extrabold text-[11px] uppercase tracking-wider text-white">Visualizador do INDEX.md Dinâmico</span>
                      </div>
                      
                      <button 
                        type="button"
                        onClick={() => {
                          const timestamp = new Date().toISOString().split("T")[0];
                          let indexMd = `# ÍNDICE DO PROJECTO: KwanzaMóvel (Ultraleve v2)\n[Última Atualização: ${timestamp}]\n\n`;
                          indexMd += `## MAPA GLOBAL DO REPOSITÓRIO\n`;
                          projectFilesList.forEach(file => {
                            const isChecked = selectedIndexFiles[file.path] || false;
                            const statusLabel = isChecked ? "LIDO (COMPLETO)" : "SKELETON / APENAS ÍNDICE";
                            indexMd += `- ${file.path} | MD5: ${file.hash} | Linhas: ${file.lines} | Estado: ${statusLabel}\n  *Obs: ${file.description}\n`;
                          });
                          indexMd += `\n## REGRAS DE LEITURA DO CONTEXTO DE AGENTE\n`;
                          indexMd += `1. NUNCA inventar código ou adivinhar lógicas de ficheiros ausentes.\n`;
                          indexMd += `2. Para ler ficheiros ausentes com Estado "SKELETON", pedir explicitamente o código ao utilizador.\n`;
                          
                          navigator.clipboard.writeText(indexMd);
                          setCopiedCodeType("indexmd");
                          triggerFeedback("INDEX.md gerado e copiado para a área de transferência!", "success");
                          setTimeout(() => setCopiedCodeType(null), 3000);
                        }}
                        className="text-[8.5px] font-mono text-zinc-400 hover:text-white flex items-center gap-1 bg-zinc-950 px-2 py-1 rounded border border-neutral-900 hover:border-neutral-800 transition-all cursor-pointer"
                      >
                        {copiedCodeType === "indexmd" ? (
                          <span className="text-emerald-400 font-bold">Copiado!</span>
                        ) : (
                          <>
                            <Copy className="w-2.5 h-2.5 text-amber-500" />
                            <span>Gerar & Copiar INDEX.md</span>
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-[9.5px] text-zinc-400 leading-relaxed font-sans">
                      Este é o índice dinâmico gerado com base nas suas seleções. Ele informa o modelo exatamente sobre o mapa operacional do projeto sem carregar o código real redundante:
                    </p>

                    {/* INDEX.md Display */}
                    <div className="relative">
                      <pre className="p-3 bg-[#030303] text-zinc-350 border border-neutral-900 rounded-xl overflow-x-auto select-all max-h-[140px] text-[8px] leading-relaxed font-mono">
{`# ÍNDICE DO PROJECTO: KwanzaMóvel (Ultraleve v2)
[Última Atualização: ${new Date().toISOString().split("T")[0]}]

## MAPA GLOBAL DO REPOSITÓRIO
` + projectFilesList.map(file => {
  const isChecked = selectedIndexFiles[file.path] || false;
  const statusLabel = isChecked ? "LIDO (COMPLETO)" : "SKELETON / MAPA CONTEXTO";
  return `- ${file.path} | MD5: ${file.hash} | Linhas: ${file.lines} | Estado: ${statusLabel}\n  *Obs: ${file.description}`;
}).join("\n")}
                      </pre>
                    </div>
                  </div>

                  {/* System Instructions Panel */}
                  <div className="space-y-2 border-t border-neutral-900/60 pt-3 mt-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5 font-mono text-[9.5px] font-bold text-zinc-300">
                        <Lock className="w-3.5 h-3.5 text-amber-500" />
                        <span>Instruções de Sistema (AI Studio)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const instructionsText = `Atua como um Engenheiro de Software Sénior focado em otimização de contexto.
Tens acesso ao índice estrutural do projeto KwanzaMóvel v2.

REGRAS CRÍTICAS:
1. NUNCA inventes código ou assumas o conteúdo de um ficheiro sem que o utilizador o tenha fornecido explicitamente no prompt atual.
2. Quando o utilizador pedir uma alteração, lê primeiro o ÍNDICE estrutural fornecido.
3. Responde APENAS identificando os ficheiros que precisam ser lidos ou alterados.
4. Aguarda que o utilizador forneça o código exato do ficheiro antes de propor ou aplicar qualquer mudança.`;
                          navigator.clipboard.writeText(instructionsText);
                          setCopiedCodeType("sys");
                          triggerFeedback("System Instructions copiadas com sucesso!", "success");
                          setTimeout(() => setCopiedCodeType(null), 3000);
                        }}
                        className="text-[8px] font-mono text-zinc-400 hover:text-white flex items-center gap-1 bg-zinc-950 px-1.5 py-0.5 rounded border border-neutral-900 hover:border-neutral-800 cursor-pointer"
                      >
                        {copiedCodeType === "sys" ? (
                          <span className="text-emerald-400 font-bold">Copiado!</span>
                        ) : (
                          <span>Copiar Instruções</span>
                        )}
                      </button>
                    </div>
                    <p className="text-[9px] text-zinc-500 leading-normal font-sans">
                      Cole estas regras no painel lateral direito <strong>"System Instructions"</strong> do seu Google AI Studio para programar o comportamento do Gemini.
                    </p>
                  </div>

                  {/* Automation Python Script panel */}
                  <div className="space-y-2 border-t border-neutral-900/60 pt-3 mt-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5 font-mono text-[9.5px] font-bold text-zinc-300">
                        <Terminal className="w-3.5 h-3.5 text-amber-500" />
                        <span>Script Local de Automação (Python)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const scriptText = `import os
import hashlib

def gerar_hash(caminho):
    hasher = hashlib.md5()
    try:
        with open(caminho, 'rb') as f:
            hasher.update(f.read())
        return hasher.hexdigest()[:8]
    except:
        return "N/A"

def mapear():
    linhas = ["# ÍNDICE AUTOMÁTICO DO PROJECTO KWANZAMÓVEL\\n"]
    for raiz, _, files in os.walk("."):
        if "node_modules" in raiz or ".git" in raiz or "dist" in raiz:
            continue
        for f in files:
            path = os.path.join(raiz, f)
            lines_count = 0
            try:
                with open(path, 'r', encoding='utf-8') as file:
                    lines_count = len(file.readlines())
            except:
                pass
            h = gerar_hash(path)
            linhas.append(f"- /{path} | Hash: {h} | Linhas: {lines_count}\\n")
    with open("INDEX.md", "w") as out:
        out.writelines(linhas)
    print("INDEX.md atualizado!")

mapear()`;
                          navigator.clipboard.writeText(scriptText);
                          setCopiedCodeType("py");
                          triggerFeedback("Script Python copiado para área de transferência!", "success");
                          setTimeout(() => setCopiedCodeType(null), 3000);
                        }}
                        className="text-[8px] font-mono text-zinc-400 hover:text-white flex items-center gap-1 bg-zinc-950 px-1.5 py-0.5 rounded border border-neutral-900 hover:border-neutral-800 cursor-pointer"
                      >
                        {copiedCodeType === "py" ? (
                          <span className="text-emerald-400 font-bold">Copiado!</span>
                        ) : (
                          <span>Copiar Script</span>
                        )}
                      </button>
                    </div>
                    <p className="text-[9px] text-zinc-500 leading-normal font-sans">
                      Rode este script em segundo plano na sua máquina local para sincronizar automaticamente seu <code>INDEX.md</code> após editar ficheiros locais.
                    </p>
                  </div>

                </div>
              </div>

            </div>
          )}
        </div>
      )}

      {/* FOOTER DIRECTIVES FOOTNOTE */}
      <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-neutral-900/60 font-mono text-[8.5px] text-zinc-650 flex flex-col sm:flex-row justify-between items-center gap-2">
        <span className="uppercase">KWANZAMÓVEL API REGULATION COMPLIANCE CORE v2.1</span>
        <span>SUPERVISIONADO DIRETAMENTE POR: BANCO NACIONAL DE ANGOLA (SGA-BNA)</span>
      </div>

    </div>
  );
}
