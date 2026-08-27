/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { UserRole, UserCredentialProfile } from "../domain/security/CredentialManager";
import { CredentialFactory } from "../infrastructure/adapters/auth/CredentialFactory";
import { Key, Shield, UserCheck, Eye, EyeOff, RefreshCw, CheckCircle, AlertTriangle, Cpu, Lock, UserPlus, Server, Radio, Check, X, Sliders } from "lucide-react";
import { EnvironmentConfigValidator, EnvironmentValidationReport } from "../bootstrap/EnvironmentConfigValidator";
import { container } from "../bootstrap/container";
import { SignatureProviderFactory, AdapterType } from "../infrastructure/adapters/hsm/SignatureProviderFactory";
import { ReceiptSignature } from "../domain/evidence/ReceiptEngine";

export interface AuthValidationResult {
  isValid: boolean;
  profile?: UserCredentialProfile;
  token?: string;
  errorMessage?: string;
}

export interface E2ETestSuiteResult {
  allPassed: boolean;
  testedProfilesCount: number;
  timestamp: string;
  results: Record<UserRole, AuthValidationResult>;
}

interface CredentialDashboardProps {
  currentUser?: UserCredentialProfile;
  onSelectRole?: (role: UserRole) => void;
}

export const CredentialDashboard: React.FC<CredentialDashboardProps> = ({ currentUser, onSelectRole }) => {
  const credManager = CredentialFactory.getInstance();
  const deusFundadorProfile = credManager.getProfileCredentials("ADMIN");
  const envConfig = CredentialFactory.createConfigurationFromEnv();
  const defaultPassword = envConfig.defaultPassword;

  const [showSecrets, setShowSecrets] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<E2ETestSuiteResult | null>(null);
  const [testing, setTesting] = useState<boolean>(false);
  const [envReport, setEnvReport] = useState<EnvironmentValidationReport>(EnvironmentConfigValidator.getCachedReport());
  const [activeProviderMetadata, setActiveProviderMetadata] = useState(container.signatureProvider.getMetadata());
  const [selectedAdapterType, setSelectedAdapterType] = useState<AdapterType>("LOCAL_DEV");
  const [showAdapterModal, setShowAdapterModal] = useState<boolean>(false);

  // Estado para atribuição dinâmica de perfis/usuários
  const [dynamicUsers, setDynamicUsers] = useState<Array<{ name: string; email: string; role: UserRole; assignedAt: string }>>([
    { name: deusFundadorProfile.fullName, email: deusFundadorProfile.email, role: "ADMIN", assignedAt: new Date().toISOString() },
    { name: "Inspetor BNA - LISPA", email: "auditoria@bna.ao", role: "AUDITOR", assignedAt: new Date().toISOString() },
    { name: "Oficial de Compliance AML", email: "compliance@kmos.ao", role: "COMPLIANCE", assignedAt: new Date().toISOString() },
    { name: "Engenharia SRE", email: "sre@kmos.ao", role: "ENGINEER", assignedAt: new Date().toISOString() },
    { name: "Cliente Final KwanzaMóvel", email: "cliente@kmos.ao", role: "USER", assignedAt: new Date().toISOString() },
  ]);

  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<UserRole>("USER");
  const [successMsg, setSuccessMsg] = useState("");

  const handleRunE2ETest = () => {
    setTesting(true);
    setTimeout(() => {
      const roles: UserRole[] = ["ADMIN", "AUDITOR", "COMPLIANCE", "ENGINEER", "USER"];
      const results: Record<UserRole, AuthValidationResult> = {} as any;
      let allPassed = true;

      for (const role of roles) {
        const validation = credManager.validateCredentials(role, defaultPassword);
        results[role] = validation;
        if (!validation.isValid) {
          allPassed = false;
        }
      }

      setTestResult({
        allPassed,
        testedProfilesCount: roles.length,
        timestamp: new Date().toISOString(),
        results,
      });
      setEnvReport(EnvironmentConfigValidator.validate(false));
      setTesting(false);
    }, 400);
  };

  const handleSwitchAdapter = (type: AdapterType) => {
    setSelectedAdapterType(type);
    const newSigner = SignatureProviderFactory.create({
      adapterType: type,
      forceSimulated: type === "LOCAL_DEV"
    });
    ReceiptSignature.injectSigner(newSigner);
    setActiveProviderMetadata(newSigner.getMetadata());
    setShowAdapterModal(false);
    setSuccessMsg(`Adaptador de assinatura alterado para '${newSigner.getMetadata().providerName}' sem impacto no domínio!`);
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const handleAddDynamicUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    const newUser = {
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      role: newUserRole,
      assignedAt: new Date().toISOString()
    };

    setDynamicUsers(prev => [newUser, ...prev]);
    setNewUserName("");
    setNewUserEmail("");
    setSuccessMsg(`Usuário '${newUser.name}' atribuído com sucesso ao perfil '${newUser.role}'!`);
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      {/* Cabeçalho de Deus Fundador */}
      <div className="p-6 bg-slate-900 border border-amber-500/30 rounded-xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Shield className="w-32 h-32 text-amber-500" />
        </div>
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 border border-amber-500/40 rounded-lg text-amber-400">
              <Key className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Painel Criptográfico & Gestão de Credenciais (Zero-Trust)
                <span className="px-2.5 py-0.5 text-xs font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full">
                  DEUS FUNDADOR
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Auditoria estrita de variáveis de ambiente, portas de assinatura hexagonal e conformidade regulatória BNA.
              </p>
            </div>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 rounded-lg text-xs font-medium flex items-center gap-2 shadow-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* PAINEL CRIPTOGRÁFICO DE ASSINATURA (PORT & ADAPTERS) */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                Contrato Único de Assinatura: <span className="font-mono text-cyan-300">SignatureProvider</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  activeProviderMetadata.isSimulated ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                }`}>
                  {activeProviderMetadata.mode}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Desacoplamento puro entre o núcleo de negócio e provedores criptográficos (KMS/HSM).
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAdapterModal(true)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            Alternar Adaptador
          </button>
        </div>

        {/* Grade de Telemetria Criptográfica Inline */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 bg-slate-800/50 border border-slate-800 rounded-lg">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">PROVEDOR ATIVO</span>
            <div className="font-semibold text-slate-200 truncate">{activeProviderMetadata.providerName}</div>
          </div>

          <div className="p-3 bg-slate-800/50 border border-slate-800 rounded-lg">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">KEY REFERENCE (OPAQUE URI)</span>
            <div className="font-semibold text-cyan-300 truncate" title={activeProviderMetadata.keyReference}>
              {activeProviderMetadata.keyReference}
            </div>
          </div>

          <div className="p-3 bg-slate-800/50 border border-slate-800 rounded-lg">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">ALGORITMO / HARDWARE</span>
            <div className="font-semibold text-slate-200 truncate">
              {activeProviderMetadata.algorithm} ({activeProviderMetadata.hsmSlot || "N/A"})
            </div>
          </div>

          <div className="p-3 bg-slate-800/50 border border-slate-800 rounded-lg">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">ISOLAMENTO ZERO-TRUST</span>
            <div className="font-semibold text-emerald-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> 0 CHAVES EM MEMÓRIA
            </div>
          </div>
        </div>
      </div>

      {/* MATRIZ DE AUDITORIA DE CONFIGURAÇÃO DE AMBIENTE (BOOTSTRAP GUARD) */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-400" />
              Auditoria de Configuração de Arranque (Bootstrap Guard)
            </h3>
            <p className="text-[11px] text-slate-400">
              Regra: Produção rejeita fatalmente valores DEV-*, SIMULATED ou endpoints fictícios (.local).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300">
              Ambiente: <strong className={envReport.isProduction ? "text-emerald-400" : "text-amber-400"}>{envReport.isProduction ? "PRODUCTION" : "DEV/SIMULATED"}</strong>
            </span>
            <span className={`text-xs font-mono px-2 py-1 rounded border ${
              envReport.allValid ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300" : "bg-rose-950/60 border-rose-500/40 text-rose-300"
            }`}>
              {envReport.allValid ? "CONFIGURAÇÃO VÁLIDA" : "ERROS DETETADOS"}
            </span>
          </div>
        </div>

        {envReport.blockingErrors.length > 0 && (
          <div className="p-3 bg-rose-950/80 border border-rose-500/50 rounded-lg text-xs space-y-1">
            <div className="font-bold text-rose-300 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> Erros de Bloqueio em Produção:
            </div>
            {envReport.blockingErrors.map((err, idx) => (
              <div key={idx} className="font-mono text-rose-200 pl-5 text-[11px]">• {err}</div>
            ))}
          </div>
        )}

        {/* Tabela Densa Inline de Variáveis de Ambiente */}
        <div className="overflow-x-auto border border-slate-800 rounded-lg">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-800/40">
                <th className="p-2.5">VARIÁVEL</th>
                <th className="p-2.5">CATEGORIA</th>
                <th className="p-2.5">VALOR / REFERÊNCIA</th>
                <th className="p-2.5">NATUREZA</th>
                <th className="p-2.5">CONFORMIDADE</th>
                <th className="p-2.5">OBSERVAÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-[11px]">
              {envReport.items.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30">
                  <td className="p-2.5 font-bold text-slate-200">{item.variable}</td>
                  <td className="p-2.5">
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                      {item.category}
                    </span>
                  </td>
                  <td className="p-2.5 text-cyan-300 truncate max-w-xs" title={item.configuredValue}>
                    {item.maskedValue}
                  </td>
                  <td className="p-2.5">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      item.isSimulatedOrDev
                        ? "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                        : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                    }`}>
                      {item.isSimulatedOrDev ? "DEV / SIMULATED" : "PRODUCTION"}
                    </span>
                  </td>
                  <td className="p-2.5">
                    {item.isValidForCurrentMode ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Check className="w-3 h-3" /> OK
                      </span>
                    ) : (
                      <span className="text-rose-400 flex items-center gap-1 font-bold">
                        <X className="w-3 h-3" /> INVÁLIDO PROD
                      </span>
                    )}
                  </td>
                  <td className="p-2.5 text-slate-400 text-[10px]">{item.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Seleção de Adaptadores Criptográficos */}
      {showAdapterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" /> Selecionar Adaptador de Assinatura
              </h3>
              <button onClick={() => setShowAdapterModal(false)} className="text-slate-400 hover:text-white text-xs font-mono">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Demonstração do desacoplamento de portas e adaptadores. O domínio permanece inalterado:
            </p>

            <div className="space-y-2 text-xs">
              <button
                onClick={() => handleSwitchAdapter("LOCAL_DEV")}
                className={`w-full p-3 rounded-lg border text-left flex items-center justify-between transition-colors ${
                  selectedAdapterType === "LOCAL_DEV"
                    ? "bg-amber-500/10 border-amber-500/50 text-amber-200"
                    : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750"
                }`}
              >
                <div>
                  <div className="font-bold flex items-center gap-2">
                    <span>LocalDevSigner / MockSigner</span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded">SIMULATED</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Execução em software sem dependência de hardware/nuvem.</div>
                </div>
                {selectedAdapterType === "LOCAL_DEV" && <Check className="w-4 h-4 text-amber-400" />}
              </button>

              <button
                onClick={() => handleSwitchAdapter("GOOGLE_KMS")}
                className={`w-full p-3 rounded-lg border text-left flex items-center justify-between transition-colors ${
                  selectedAdapterType === "GOOGLE_KMS"
                    ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-200"
                    : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750"
                }`}
              >
                <div>
                  <div className="font-bold flex items-center gap-2">
                    <span>GoogleKmsSigner</span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-cyan-500/20 text-cyan-300 rounded">CLOUD PRODUCTION</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Chaves assimétricas em nuvem gerenciadas pelo Google Cloud KMS.</div>
                </div>
                {selectedAdapterType === "GOOGLE_KMS" && <Check className="w-4 h-4 text-cyan-400" />}
              </button>

              <button
                onClick={() => handleSwitchAdapter("HARDWARE_HSM")}
                className={`w-full p-3 rounded-lg border text-left flex items-center justify-between transition-colors ${
                  selectedAdapterType === "HARDWARE_HSM"
                    ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-200"
                    : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750"
                }`}
              >
                <div>
                  <div className="font-bold flex items-center gap-2">
                    <span>HsmSigner / HsmSignerAdapter</span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded">HARDWARE HSM</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Appliance físico PKCS#11 FIPS 140-2/3 para ambiente BNA soberano.</div>
                </div>
                {selectedAdapterType === "HARDWARE_HSM" && <Check className="w-4 h-4 text-emerald-400" />}
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowAdapterModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid de Atribuição Dinâmica de Contas & Perfis */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-200 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-amber-400" />
              Atribuição Dinâmica de Perfis (RBAC)
            </h3>
            <p className="text-xs text-slate-400">
              Conceda e provisione perfis operacionais no ecossistema KMOS com persistência em tempo de execução.
            </p>
          </div>
        </div>

        <form onSubmit={handleAddDynamicUser} className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 bg-slate-800/40 border border-slate-800 rounded-lg">
          <div>
            <label className="text-[11px] font-mono text-slate-400 block mb-1">Nome Completo</label>
            <input
              type="text"
              placeholder="Ex: Inspetor SGA BNA"
              value={newUserName}
              onChange={e => setNewUserName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-mono text-slate-400 block mb-1">E-mail Operacional</label>
            <input
              type="email"
              placeholder="Ex: auditor@bna.ao"
              value={newUserEmail}
              onChange={e => setNewUserEmail(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-mono text-slate-400 block mb-1">Perfil (Role)</label>
            <select
              value={newUserRole}
              onChange={e => setNewUserRole(e.target.value as UserRole)}
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="USER">USER (Cliente Final)</option>
              <option value="ADMIN">ADMIN (Operador Administrador)</option>
              <option value="AUDITOR">AUDITOR (Regulador BNA / LISPA)</option>
              <option value="COMPLIANCE">COMPLIANCE (Oficial AML / KYC)</option>
              <option value="ENGINEER">ENGINEER (Engenheiro SRE / Core)</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded transition-colors cursor-pointer"
            >
              Atribuir Conta
            </button>
          </div>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-800/30">
                <th className="p-2.5 font-mono">NOME</th>
                <th className="p-2.5 font-mono">EMAIL</th>
                <th className="p-2.5 font-mono">PERFIL ATRIBUÍDO</th>
                <th className="p-2.5 font-mono">DATA DE ATRIBUIÇÃO</th>
                <th className="p-2.5 font-mono text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {dynamicUsers.map((u, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30">
                  <td className="p-2.5 font-medium text-slate-200">{u.name}</td>
                  <td className="p-2.5 font-mono text-slate-400">{u.email}</td>
                  <td className="p-2.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-amber-300 border border-slate-700">
                      {u.role}
                    </span>
                  </td>
                  <td className="p-2.5 font-mono text-slate-400">
                    {new Date(u.assignedAt).toLocaleString("pt-AO")}
                  </td>
                  <td className="p-2.5 text-right font-mono text-emerald-400 font-semibold">
                    ATIVO
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bloco de Testes E2E do CredentialManager */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-200 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-400" />
              Verificação E2E do CredentialManager
            </h3>
            <p className="text-xs text-slate-400">
              Validação automatizada de consistência para todos os 5 perfis RBAC com base nas variáveis de ambiente.
            </p>
          </div>

          <button
            onClick={handleRunE2ETest}
            disabled={testing}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors shadow cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${testing ? "animate-spin" : ""}`} />
            {testing ? "A Testar..." : "Executar Teste E2E"}
          </button>
        </div>

        {testResult && (
          <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-lg space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-700">
              <div className="flex items-center gap-2">
                {testResult.allPassed ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                )}
                <span className="text-sm font-bold text-slate-100">
                  {testResult.allPassed
                    ? "SUITE E2E APROVADA: Todos os 5 perfis autenticados com sucesso!"
                    : "FALHA DE VALIDAÇÃO E2E"}
                </span>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {new Date(testResult.timestamp).toLocaleTimeString("pt-AO")}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              {(Object.entries(testResult.results) as [UserRole, AuthValidationResult][]).map(([role, res]) => (
                <div
                  key={role}
                  className={`p-2.5 rounded border text-xs font-mono ${
                    res.isValid
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                      : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                  }`}
                >
                  <div className="font-bold flex items-center justify-between">
                    <span>{role}</span>
                    <span>{res.isValid ? "PASS" : "FAIL"}</span>
                  </div>
                  <div className="text-[10px] opacity-80 mt-1 truncate">
                    Token: {res.token ? `${res.token.slice(0, 10)}...` : "N/A"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CredentialDashboard;
