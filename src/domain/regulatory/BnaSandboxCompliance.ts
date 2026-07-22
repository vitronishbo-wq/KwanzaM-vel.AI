/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TerritorialAddress, TerritoryDomainService } from "../territory/AngolaTerritory";

/**
 * Fases de Vida do Participante na Sandbox Regulatória do BNA
 * (Baseado no Aviso n.º 19/22 do Banco Nacional de Angola - LISPA)
 */
export type BnaSandboxStatus =
  | "CANDIDATO"            // Artigo 7.º - Formulário de Candidatura
  | "ADMITIDO"             // Artigo 8.º - Autorização do BNA
  | "EM_TESTE_OPERACIONAL" // Artigo 6.º - Testes em Ambiente Real Supervisionado (Até 12 + 6 meses)
  | "GRADUADO"             // Artigo 28.º - Licenciamento Definitivo para Produção
  | "REVOGADO"             // Artigo 11.º - Revogação por Incumprimento
  | "EXPIRADO";            // Artigo 10.º - Prescrição ou Fim do Período sem Licença

/**
 * Limites Operacionais Configurados pelo BNA para a Sandbox (Artigo 15.º)
 */
export interface BnaSandboxLimits {
  maxActiveCustomers: number;        // Limite máximo de clientes admitidos no teste
  maxTransactionValueKz: number;     // Valor máximo permitido por transação individual em Kwanzas
  maxDailyVolumeKz: number;          // Volume diário máximo agregado da plataforma em Kwanzas
  maxTestingDurationMonths: number;  // Duração máxima autorizada (12 meses normal, prorrogável +6)
  territorialCoverage: TerritorialAddress[]; // Âmbito geográfico autorizado (Provincias/Municípios)
}

/**
 * Matriz de Riscos e Salvaguardas exigida pelo Artigo 22.º do Aviso n.º 19/22
 */
export interface BnaRiskAssessment {
  cybersecurityControlsVerified: boolean;
  amlCftPolicyActive: boolean;            // Prevenção do Branqueamento de Capitais
  segregatedCustodyConfirmed: boolean;    // Proteção de Fundos dos Clientes (Artigo 16.º)
  exitStrategyApproved: boolean;          // Plano de Saída (Artigo 22.º, alínea d)
  disputeResolutionChannelUrl: string;    // Canal de Reclamações (Artigo 17.º)
}

/**
 * Relatório Periódico de Progresso para o BNA / LISPA (Artigos 24.º e 25.º)
 */
export interface BnaSandboxReportPayload {
  reportId: string;
  participantId: string;
  reportingPeriodIso: string;
  activeCustomerCount: number;
  totalTransactionCount: number;
  totalVolumeKz: number;
  discrepanciesCount: number;
  incidentsOrFraudsCount: number;
  customerComplaintsResolvedCount: number;
  invariantsAuditStatus: "SUCCESS" | "WARNING" | "CRITICAL_VIOLATION";
  territorialBreakdown: Record<string, number>; // Transações por Código de Província (ex: LUA, ICB, MXL)
  generatedAt: string;
}

/**
 * Módulo de Conformidade com o Aviso n.º 19/22 do Banco Nacional de Angola (Sandbox Regulatória)
 */
export class BnaSandboxComplianceEngine {
  private static readonly DEFAULT_LIMITS: BnaSandboxLimits = {
    maxActiveCustomers: 5000,
    maxTransactionValueKz: 500000, // 500.000 Kz por transação em Sandbox
    maxDailyVolumeKz: 50000000,    // 50.000.000 Kz diários
    maxTestingDurationMonths: 12,  // 12 Meses limite base
    territorialCoverage: []
  };

  /**
   * Avalia se uma transação cumpre os limites restritivos do ambiente de Sandbox (Artigo 15.º do Aviso 19/22)
   */
  public static validateSandboxTransaction(
    amountKz: number,
    currentDailyVolumeKz: number,
    customerLocation?: Partial<TerritorialAddress>,
    limits: BnaSandboxLimits = this.DEFAULT_LIMITS
  ): { isAllowed: boolean; reason?: string } {
    if (amountKz > limits.maxTransactionValueKz) {
      return {
        isAllowed: false,
        reason: `Aviso BNA 19/22 (Art. 15.º): Valor da transação (${amountKz.toLocaleString("pt-AO")} Kz) excede o teto máximo de Sandbox (${limits.maxTransactionValueKz.toLocaleString("pt-AO")} Kz).`
      };
    }

    if (currentDailyVolumeKz + amountKz > limits.maxDailyVolumeKz) {
      return {
        isAllowed: false,
        reason: `Aviso BNA 19/22 (Art. 15.º): Limite diário do ambiente de testes excedido (${limits.maxDailyVolumeKz.toLocaleString("pt-AO")} Kz).`
      };
    }

    if (customerLocation) {
      const geoCheck = TerritoryDomainService.validateAddress(customerLocation);
      if (!geoCheck.isValid) {
        return {
          isAllowed: false,
          reason: `Aviso BNA 19/22 (Art. 14.º): Localização fora do padrão territorial reconhecido (${geoCheck.errors.join("; ")}).`
        };
      }
    }

    return { isAllowed: true };
  }

  /**
   * Gera o Relatório Oficial BNA/LISPA exigido pelos Artigos 24.º e 25.º do Aviso n.º 19/22
   */
  public static buildBnaProgressReport(
    participantId: string,
    activeCustomers: number,
    txCount: number,
    volumeKz: number,
    incidentsCount: number,
    provinceStats: Record<string, number>
  ): BnaSandboxReportPayload {
    return {
      reportId: `REP-BNA-SBX-${Date.now()}`,
      participantId,
      reportingPeriodIso: new Date().toISOString(),
      activeCustomerCount: activeCustomers,
      totalTransactionCount: txCount,
      totalVolumeKz: volumeKz,
      discrepanciesCount: 0,
      incidentsOrFraudsCount: incidentsCount,
      customerComplaintsResolvedCount: incidentsCount,
      invariantsAuditStatus: incidentsCount === 0 ? "SUCCESS" : "WARNING",
      territorialBreakdown: provinceStats,
      generatedAt: new Date().toISOString()
    };
  }
}
