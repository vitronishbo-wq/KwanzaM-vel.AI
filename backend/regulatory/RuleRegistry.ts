import { Money } from "../domain/shared/Money";
import { Currency } from "../domain/shared/Currency";

export interface RegulatoryRule<T> {
  id: string;
  diploma: string;
  article: string;
  description: string;
  value: T;
  version: string;
  effectiveDate: Date;
}

/**
 * Source of truth for all BNA regulatory parameters and institutional limits.
 * Under Law-Driven Architecture, rules are decoupled from hardcoded logic and managed declaratively.
 */
export class RuleRegistry {
  private static rules: Map<string, RegulatoryRule<any>> = new Map();

  static {
    // Populate Registry with official Banco Nacional de Angola (BNA) directives.
    
    // Aviso 03/22 Artigo 18 - KYC Daily spending limits
    this.register({
      id: "BNA-A0322-ART18-LIMIT-L1",
      diploma: "Aviso n.º 03/22",
      article: "Artigo 18.º",
      description: "Limite de transação diário acumulado para carteiras simplificadas de Nível 1 (Level-1)",
      value: 50000n * 100n, // 50,000.00 Kz (expressed in subunits / cêntimos)
      version: "1.0",
      effectiveDate: new Date("2022-02-02"),
    });

    this.register({
      id: "BNA-A0322-ART18-LIMIT-L2",
      diploma: "Aviso n.º 03/22",
      article: "Artigo 18.º",
      description: "Limite de transação diário acumulado para carteiras simplificadas de Nível 2 (Level-2)",
      value: 500000n * 100n, // 500,000.00 Kz (expressed in subunits / cêntimos)
      version: "1.0",
      effectiveDate: new Date("2022-02-02"),
    });

    this.register({
      id: "BNA-A0322-ART18-LIMIT-L3",
      diploma: "Aviso n.º 03/22",
      article: "Artigo 18.º",
      description: "Limite de transação diário acumulado para carteiras simplificadas de Nível 3 (Level-3)",
      value: 10000000n * 100n, // 10,000,000.00 Kz (expressed in subunits / cêntimos)
      version: "1.0",
      effectiveDate: new Date("2022-02-02"),
    });

    // Aviso 10/20 - Transparency and limits on commission rates (MDR maximum bounds)
    this.register({
      id: "BNA-A1020-MDR-MAX-BPS",
      diploma: "Aviso n.º 10/20",
      article: "Anexo Técnico",
      description: "Taxa máxima permitida para MDR (Merchant Discount Rate) em pontos base (bps)",
      value: 250n, // 2.50% maximum MDR rate
      version: "1.0",
      effectiveDate: new Date("2020-10-15"),
    });
  }

  /**
   * Registers a new regulatory rule in the memory repository
   */
  public static register<T>(rule: RegulatoryRule<T>): void {
    this.rules.set(rule.id, rule);
  }

  /**
   * Retrieves a rule by its unique identifier
   */
  public static getRule<T>(id: string): RegulatoryRule<T> | undefined {
    return this.rules.get(id);
  }

  /**
   * Safe getter for KYC tier limits, returning a typed Money value object
   */
  public static getTierDailyLimit(tierValue: string): Money {
    let ruleId = "BNA-A0322-ART18-LIMIT-L1";
    
    if (tierValue.toLowerCase() === "level-2") {
      ruleId = "BNA-A0322-ART18-LIMIT-L2";
    } else if (tierValue.toLowerCase() === "level-3") {
      ruleId = "BNA-A0322-ART18-LIMIT-L3";
    }

    const rule = this.getRule<bigint>(ruleId);
    const amountSubunits = rule ? rule.value : 50000n * 100n; // Fallback safety to Level-1 limit
    
    return Money.AOA(amountSubunits);
  }

  /**
   * Exposes all active rules in the registry for auditing/compliance coverage matrices
   */
  public static getAllRules(): RegulatoryRule<any>[] {
    return Array.from(this.rules.values());
  }
}
