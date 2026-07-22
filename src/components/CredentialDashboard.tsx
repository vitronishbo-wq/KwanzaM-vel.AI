/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { CredentialManager, UserRole, AnyUserProfile, E2ETestSuiteResult } from "../domain/auth/CredentialManager";
import { Key, Shield, UserCheck, Eye, EyeOff, RefreshCw, CheckCircle, AlertTriangle, Cpu, Lock, UserPlus } from "lucide-react";

interface CredentialDashboardProps {
  currentUser?: AnyUserProfile;
  onSelectRole?: (role: UserRole) => void;
}

export const CredentialDashboard: React.FC<CredentialDashboardProps> = ({ currentUser, onSelectRole }) => {
  const credManager = new CredentialManager();
  const deusFundadorConfig = credManager.getDeusFundadorConfig();
  const defaultPassword = credManager.getDefaultPassword();

  const [showSecrets, setShowSecrets] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<E2ETestSuiteResult | null>(null);
  const [testing, setTesting] = useState<boolean>(false);
  
  // Estado para atribuição dinâmica de perfis/usuários
  const [dynamicUsers, setDynamicUsers] = useState<Array<{ name: string; email: string; role: UserRole; assignedAt: string }>>([
    { name: deusFundadorConfig.name, email: deusFundadorConfig.email, role: "ADMIN", assignedAt: new Date().toISOString() },
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
      const res = credManager.validateAllProfilesForE2E();
      setTestResult(res);
      setTesting(false);
    }, 400);
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
        
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/40">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-amber-400 tracking-wide uppercase">
              Painel de Credenciais & Gestão do Deus Fundador
            </h2>
            <p className="text-xs text-slate-400">
              Controlo Absoluto do Sistema KMOS • Acesso Irrestrito • Atribuição Dinâmica de Usuários & RBAC
            </p>
          </div>
        </div>

        {/* Credenciais Injetadas do Ambiente */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-lg">
            <span className="text-xs text-slate-400 block font-mono">KMOS_DEUS_FUNDADOR_NAME</span>
            <span className="text-sm font-semibold text-amber-300 font-mono">{deusFundadorConfig.name}</span>
          </div>

          <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-lg">
            <span className="text-xs text-slate-400 block font-mono">KMOS_DEUS_FUNDADOR_EMAIL</span>
            <span className="text-sm font-semibold text-emerald-400 font-mono">{deusFundadorConfig.email}</span>
          </div>

          <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-lg">
            <span className="text-xs text-slate-400 block font-mono">KMOS_DEUS_FUNDADOR_PHONE</span>
            <span className="text-sm font-semibold text-sky-400 font-mono">{deusFundadorConfig.phone}</span>
          </div>

          <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-lg flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block font-mono">KMOS_DEFAULT_PASSWORD</span>
              <span className="text-sm font-semibold text-rose-300 font-mono">
                {showSecrets ? defaultPassword : "••••••••••••••••"}
              </span>
            </div>
            <button
              onClick={() => setShowSecrets(!showSecrets)}
              className="p-1.5 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded transition-colors"
              title={showSecrets ? "Ocultar Chave" : "Revelar Chave"}
            >
              {showSecrets ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Informações adicionais do protótipo */}
        <div className="mt-4 p-3 bg-slate-850 border border-slate-800 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Lock className="w-4 h-4 text-amber-400" />
            <span>PIN de Confirmação Mobile / Testes: <strong className="text-amber-300 font-mono text-sm ml-1">1234</strong></span>
          </div>
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle className="w-4 h-4" />
            <span>Permissão SuperAdmin: <strong className="text-slate-100 font-mono">ALL_SYSTEM_ACCESS</strong></span>
          </div>
        </div>
      </div>

      {/* Bloco de Acesso Alternativo Dinâmico aos 5 Perfis do KMOS */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl">
        <h3 className="text-base font-semibold text-slate-200 flex items-center gap-2 mb-4">
          <UserCheck className="w-5 h-5 text-sky-400" />
          Alternar Perfil Ativo Instantaneamente (RBAC)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {(["ADMIN", "AUDITOR", "COMPLIANCE", "ENGINEER", "USER"] as UserRole[]).map((role) => {
            const profile = credManager.getProfileCredentials(role);
            const isCurrent = currentUser?.role === role;

            return (
              <div
                key={role}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isCurrent
                    ? "bg-amber-500/10 border-amber-500/60 shadow-lg shadow-amber-500/5"
                    : "bg-slate-800/60 border-slate-700/80 hover:border-slate-600 hover:bg-slate-800"
                }`}
                onClick={() => onSelectRole && onSelectRole(role)}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700 font-mono">
                      {role}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded font-bold uppercase">
                        Ativo
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-semibold text-slate-100 line-clamp-1">{profile.fullName}</h4>
                  <p className="text-[11px] text-slate-400 font-mono truncate">{profile.email}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-700/50 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Permissões: {profile.permissions.length}</span>
                  <span className="text-sky-400 hover:underline">Ativar &rarr;</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bloco de Atribuição Dinâmica de Contas / Usuários */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-200 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-400" />
            Atribuição Dinâmica de Contas & Perfis
          </h3>
          <span className="text-xs text-slate-400">Total Registado: {dynamicUsers.length}</span>
        </div>

        {successMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-lg flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleAddDynamicUser} className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-800/40 p-4 rounded-lg border border-slate-700/60">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Nome Completo</label>
            <input
              type="text"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              placeholder="Ex: Manuel Agostinho"
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Email do Usuário</label>
            <input
              type="email"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              placeholder="manuel@exemplo.ao"
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Perfil (Role RBAC)</label>
            <select
              value={newUserRole}
              onChange={(e) => setNewUserRole(e.target.value as UserRole)}
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            >
              <option value="USER">USER (Cliente Final)</option>
              <option value="ADMIN">ADMIN (SuperAdmin)</option>
              <option value="AUDITOR">AUDITOR (Auditoria BNA)</option>
              <option value="COMPLIANCE">COMPLIANCE (Oficial AML)</option>
              <option value="ENGINEER">ENGINEER (SRE / Dev)</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded transition-colors flex items-center justify-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Atribuir Conta
            </button>
          </div>
        </form>

        {/* Tabela de Usuários Atribuídos */}
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
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors shadow"
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
              {Object.entries(testResult.results).map(([role, res]) => (
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
