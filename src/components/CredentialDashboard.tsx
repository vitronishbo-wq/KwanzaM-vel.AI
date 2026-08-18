/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CredentialManager, UserRole, E2ETestSuiteResult } from '../domain/security/CredentialManager';

interface CredentialDashboardProps {
  credentialManager?: CredentialManager;
}

export const CredentialDashboard: React.FC<CredentialDashboardProps> = ({ credentialManager }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('ADMIN');
  const [testResult, setTestResult] = useState<E2ETestSuiteResult | null>(null);
  const [inputPassword, setInputPassword] = useState('');
  const [authStatus, setAuthStatus] = useState<string | null>(null);

  const handleRunE2ETests = () => {
    if (!credentialManager) {
      setAuthStatus('CredentialManager não instanciado no runtime.');
      return;
    }
    const results = credentialManager.validateAllProfilesForE2E();
    setTestResult(results);
  };

  const handleTestAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!credentialManager) {
      setAuthStatus('CredentialManager não instanciado no runtime.');
      return;
    }

    const validation = credentialManager.validateCredentials(selectedRole, inputPassword);
    if (validation.isValid) {
      setAuthStatus(`✅ Autenticado com sucesso! Token gerado: ${validation.token?.substring(0, 18)}...`);
    } else {
      setAuthStatus(`❌ Erro de Autenticação: ${validation.errorMessage}`);
    }
  };

  return (
    <div className="p-6 bg-slate-900 text-white rounded-xl border border-slate-800 shadow-2xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-wide text-amber-400">KMOS Credential & RBAC Dashboard</h2>
          <p className="text-sm text-slate-400">Gestão e Inspeção de Permissões de Segurança</p>
        </div>
        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-mono rounded-full border border-emerald-500/20">
          Zero-Hardcode Active
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Painel de Teste de Autenticação */}
        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-4">
          <h3 className="text-md font-semibold text-slate-200">Testar Autenticação RBAC</h3>
          <form onSubmit={handleTestAuth} className="space-y-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Papel / Role</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                className="w-full bg-slate-900 border border-slate-700 text-sm rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="ADMIN">ADMIN (SuperAdmin)</option>
                <option value="AUDITOR">AUDITOR (Regulador BNA)</option>
                <option value="COMPLIANCE">COMPLIANCE (AML/CFT)</option>
                <option value="ENGINEER">ENGINEER (SRE/DevOps)</option>
                <option value="USER">USER (Cliente)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Chave / Password Administrativa</label>
              <input
                type="password"
                value={inputPassword}
                onChange={(e) => setInputPassword(e.target.value)}
                placeholder="Introduza a credencial do ambiente"
                className="w-full bg-slate-900 border border-slate-700 text-sm rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-sm py-2 rounded transition-colors"
            >
              Validar Credenciais
            </button>
          </form>

          {authStatus && (
            <div className="mt-3 p-3 bg-slate-900 rounded text-xs font-mono text-slate-300 break-all border border-slate-800">
              {authStatus}
            </div>
          )}
        </div>

        {/* Suíte E2E */}
        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-md font-semibold text-slate-200">Suíte de Validação E2E</h3>
            <p className="text-xs text-slate-400 mt-1">
              Executa uma verificação ponta a ponta sobre todos os perfis do sistema.
            </p>
          </div>

          <button
            onClick={handleRunE2ETests}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm py-2 rounded border border-slate-700 transition-colors"
          >
            Executar Verificação E2E
          </button>

          {testResult && (
            <div className="p-3 bg-slate-900 rounded text-xs space-y-2 border border-slate-800">
              <div className="flex justify-between font-mono">
                <span>Resultado Global:</span>
                <span className={testResult.success ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                  {testResult.passed}/{testResult.total} PASSOU
                </span>
              </div>
              <div className="space-y-1">
                {testResult.results.map((r, i) => (
                  <div key={i} className="flex justify-between text-[11px] border-b border-slate-800/50 pb-1">
                    <span className="text-slate-400">{r.role}</span>
                    <span className={r.success ? 'text-emerald-400' : 'text-rose-400'}>
                      {r.success ? 'OK' : r.message || 'FALHA'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CredentialDashboard;