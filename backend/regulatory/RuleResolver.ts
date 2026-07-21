import { RuleRegistry, RegulatoryRule } from "./RuleRegistry";

export interface ResolutionContext {
  date?: Date;
  tier?: string;
  ruleId?: string;
}

/**
 * Dynamic resolver for BNA legal constraints.
 * Enables the system to ask: "What was the active daily limit for KYC Level-1 on 2026-07-08?"
 * Supporting full compliance audits and temporal regression testing.
 */
export class RuleResolver {
  /**
   * Resolves the active rule for a specific ruleId given a temporal context.
   */
  public static resolve<T>(id: string, context: ResolutionContext = {}): RegulatoryRule<T> {
    const targetDate = context.date || new Date();
    
    // In a fully persistent implementation, this might query historical rules.
    // For our core engine, we retrieve the active rule from our versioned registry.
    const rule = RuleRegistry.getRule<T>(id);
    
    if (!rule) {
      throw new Error(`Inconformidade Crítica de Engenharia: Regra regulatória BNA com ID '${id}' não encontrada.`);
    }

    if (rule.effectiveDate > targetDate) {
      throw new Error(
        `Regra de Compliance Inválida: A regra '${id}' só entra em vigor a ${rule.effectiveDate.toLocaleDateString()}. O contexto temporal solicitado (${targetDate.toLocaleDateString()}) é anterior.`
      );
    }

    return rule;
  }

  /**
   * Resolves the active maximum commission limit in BPS (basis points).
   */
  public static resolveMaxMdrBps(context: ResolutionContext = {}): bigint {
    const rule = this.resolve<bigint>("BNA-A1020-MDR-MAX-BPS", context);
    return rule.value;
  }
}
