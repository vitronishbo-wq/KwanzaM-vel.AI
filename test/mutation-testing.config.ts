/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { runDomainTestSuite, DomainTestReport } from "../src/ledgerEngine";

export interface Mutant {
  id: string;
  name: string;
  description: string;
  category: "Arithmetic" | "Conditional" | "Logical" | "Exception" | "State";
  active: boolean;
}

export interface MutationTestResult {
  mutantId: string;
  mutantName: string;
  description: string;
  category: string;
  status: "KILLED" | "SURVIVED";
  killingTestName?: string;
  errorThrown?: string;
}

export interface MutationTestingSummary {
  totalMutants: number;
  killedCount: number;
  survivedCount: number;
  mutationScore: number; // percentage
  resilienceRating: "EXCELENTE" | "BOA" | "FRÁGIL" | "VULNERÁVEL";
  results: MutationTestResult[];
}

const MUTANT_DEFINITIONS: Omit<Mutant, "active">[] = [
  {
    id: "MUTANT_WALLET_BALANCE_CHECK",
    name: "Bypass de Saldo Insuficiente na Carteira",
    description: "Inibe o lançamento de erro de saldo insuficiente durante débitos, permitindo que o saldo fique negativo sem levantar a exceção correspondente.",
    category: "Conditional"
  },
  {
    id: "MUTANT_WALLET_DAILY_LIMIT",
    name: "Bypass do Limite Diário de Gastos",
    description: "Desativa o bloqueio transacional quando o limite diário de gastos é excedido, permitindo movimentações acima do teto estabelecido.",
    category: "Conditional"
  },
  {
    id: "MUTANT_WALLET_FREEZE_BYPASS",
    name: "Bypass de Bloqueio em Carteira Congelada",
    description: "Permite debitar fundos em carteiras que estão explicitamente congeladas/bloqueadas pelo sistema de compliance.",
    category: "Logical"
  },
  {
    id: "MUTANT_IDEMPOTENCY_BYPASS",
    name: "Invalidação do Filtro de Transações Duplicadas",
    description: "Desativa o mecanismo de detecção de chaves de idempotência repetidas em transações comerciais, permitindo repetições indevidas.",
    category: "Logical"
  },
  {
    id: "MUTANT_AGENT_LIQUIDITY_LIMIT",
    name: "Bypass de Limite de Liquidez Física do Agente",
    description: "Omite o erro de liquidez excedida quando um agente tenta efetuar levantamentos de float acima do seu saldo de tesouraria.",
    category: "Conditional"
  },
  {
    id: "MUTANT_FRAUD_SCORE_RANGE",
    name: "Bypass de Validação do Intervalo do Score de Fraude",
    description: "Permite instanciar objetos de Score de Fraude com valores inválidos (fora do intervalo estrito [0.0, 1.0]).",
    category: "Arithmetic"
  },
  {
    id: "MUTANT_SETTLEMENT_STATE_TRANSITION",
    name: "Bypass de Validação da Máquina de Estados (Settlement)",
    description: "Permite transições de estado arbitrárias no ciclo de vida de liquidação (como transitar direto de CREATED para SETTLED), quebrando a ordem do fluxo.",
    category: "State"
  },
  {
    id: "MUTANT_CONSTITUTION_MIN_AMOUNT",
    name: "Bypass de Valor Mínimo Transacionável (Constitucional)",
    description: "Inibe a verificação constitucional de transações com valor nulo ou negativo, permitindo criação de moeda sem nexo causal.",
    category: "Arithmetic"
  },
  {
    id: "MUTANT_CONSTITUTION_BALANCE_CHECK",
    name: "Bypass de Saldo Insuficiente Constitucional",
    description: "Inibe o veto constitucional quando o saldo da conta de origem é menor que o montante debitado.",
    category: "Conditional"
  },
  {
    id: "MUTANT_CONSTITUTION_KYC_LIMITS",
    name: "Desativação dos Limites Legais por KYC Tier",
    description: "Desativa as restrições do Aviso 11/2021 do BNA, permitindo transações acima dos limites permitidos para cada nível (50k, 200k, 1M).",
    category: "Logical"
  },
  {
    id: "MUTANT_CONSTITUTION_AML_BLOCKED",
    name: "Bypass de Bloqueio AML/Sanções BNA (Constitucional)",
    description: "Inibe a rejeição de transações envolvendo contas que se encontram sob bloqueio preventivo ou sanções de compliance.",
    category: "Logical"
  }
];

/**
 * Gestor Central de Mutação de Domínio (Domain Mutation Manager)
 * Controla a ativação dinâmica de mutants durante execuções isoladas de testes.
 */
export class MutationManager {
  private static instance: MutationManager | null = null;
  private mutants: Map<string, Mutant> = new Map();

  private constructor() {
    this.resetMutants();
  }

  public static getInstance(): MutationManager {
    if (!MutationManager.instance) {
      MutationManager.instance = new MutationManager();
    }
    return MutationManager.instance;
  }

  private resetMutants() {
    this.mutants.clear();
    for (const def of MUTANT_DEFINITIONS) {
      this.mutants.set(def.id, {
        ...def,
        active: false
      });
    }
  }

  public getMutants(): Mutant[] {
    return Array.from(this.mutants.values());
  }

  public getMutant(id: string): Mutant | undefined {
    return this.mutants.get(id);
  }

  public isEnabled(id: string): boolean {
    return this.mutants.get(id)?.active === true;
  }

  public setEnabled(id: string, active: boolean): void {
    const mutant = this.mutants.get(id);
    if (mutant) {
      mutant.active = active;
    }
  }

  public disableAll(): void {
    for (const mutant of this.mutants.values()) {
      mutant.active = false;
    }
  }
}

export const mutationManager = MutationManager.getInstance();

/**
 * Executa a suite completa de testes de mutação.
 * Ativa individualmente cada mutant cadastrado, executa os testes de domínio existentes
 * e afere se a alteração introduzida causou alguma falha (mutante morto) ou não (mutante sobrevivente).
 */
export function runMutationTestSuite(): MutationTestingSummary {
  const manager = MutationManager.getInstance();
  
  // Guardar estado original
  const originalState = manager.getMutants().map(m => ({ id: m.id, active: m.active }));
  const results: MutationTestResult[] = [];

  try {
    const mutants = manager.getMutants();

    for (const mutant of mutants) {
      // Isolar o mutant ativando unicamente ele
      manager.disableAll();
      manager.setEnabled(mutant.id, true);

      let reports: DomainTestReport[] = [];
      let executionError: string | undefined = undefined;

      try {
        reports = runDomainTestSuite();
      } catch (err: any) {
        executionError = err?.message || String(err);
      }

      if (executionError) {
        // Se a injeção quebrou o fluxo de inicialização ou estourou erro grave não tratado,
        // o mutant é considerado KILLED pela quebra de invariante de runtime.
        results.push({
          mutantId: mutant.id,
          mutantName: mutant.name,
          description: mutant.description,
          category: mutant.category,
          status: "KILLED",
          killingTestName: "Exceção Crítica de Domínio / Crash",
          errorThrown: executionError
        });
        continue;
      }

      // Analisa se algum teste falhou. Se falhou, o mutant foi morto.
      const failingTest = reports.find(r => r.passed === false);

      if (failingTest) {
        results.push({
          mutantId: mutant.id,
          mutantName: mutant.name,
          description: mutant.description,
          category: mutant.category,
          status: "KILLED",
          killingTestName: failingTest.name,
          errorThrown: failingTest.errorThrown || failingTest.errorExpected
        });
      } else {
        // Se todos os testes passaram mesmo com o mutant ativo, ele sobreviveu!
        results.push({
          mutantId: mutant.id,
          mutantName: mutant.name,
          description: mutant.description,
          category: mutant.category,
          status: "SURVIVED"
        });
      }
    }
  } finally {
    // Restaurar estado anterior
    manager.disableAll();
    for (const state of originalState) {
      manager.setEnabled(state.id, state.active);
    }
  }

  const totalMutants = results.length;
  const killedCount = results.filter(r => r.status === "KILLED").length;
  const survivedCount = totalMutants - killedCount;
  const mutationScore = totalMutants > 0 ? Number(((killedCount / totalMutants) * 100).toFixed(1)) : 0;

  let resilienceRating: "EXCELENTE" | "BOA" | "FRÁGIL" | "VULNERÁVEL" = "VULNERÁVEL";
  if (mutationScore >= 85) {
    resilienceRating = "EXCELENTE";
  } else if (mutationScore >= 65) {
    resilienceRating = "BOA";
  } else if (mutationScore >= 35) {
    resilienceRating = "FRÁGIL";
  }

  return {
    totalMutants,
    killedCount,
    survivedCount,
    mutationScore,
    resilienceRating,
    results
  };
}
