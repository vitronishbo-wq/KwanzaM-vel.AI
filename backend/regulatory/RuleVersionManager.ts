import { RegulatoryRule, RuleRegistry } from "./RuleRegistry";

export interface VersionedHistory {
  version: string;
  startDate: Date;
  endDate?: Date;
  value: any;
}

/**
 * Registry of regulatory rule histories, enabling full-trace back-testing
 * of historic transactions against the rules that were legally active on that specific date.
 */
export class RuleVersionManager {
  private static histories: Map<string, VersionedHistory[]> = new Map();

  static {
    // Populate historic versions of BNA Rules to demonstrate retrospective validation
    
    // BNA-A0322-ART18-LIMIT-L1 versions
    this.addHistory("BNA-A0322-ART18-LIMIT-L1", [
      {
        version: "0.9-PRE",
        startDate: new Date("2020-01-01"),
        endDate: new Date("2022-02-01"),
        value: 20000n * 100n, // Level-1 was 20,000 Kz before Aviso 03/22
      },
      {
        version: "1.0",
        startDate: new Date("2022-02-02"),
        value: 50000n * 100n, // Updated to 50,000 Kz in 2022
      }
    ]);
  }

  /**
   * Tracks and adds a history log of values for a specific ruleId
   */
  public static addHistory(ruleId: string, history: VersionedHistory[]): void {
    this.histories.set(ruleId, history);
  }

  /**
   * Resolves the historic value for a ruleId at any precise point in time
   */
  public static resolveHistoricalValue<T>(ruleId: string, date: Date): T {
    const historyList = this.histories.get(ruleId);
    
    if (!historyList || historyList.length === 0) {
      // Fallback directly to current registry value if no history exists
      const rule = RuleRegistry.getRule<T>(ruleId);
      if (!rule) {
        throw new Error(`Sem histórico nem regra ativa encontrada para o ID: ${ruleId}`);
      }
      return rule.value;
    }

    const found = historyList.find((h) => {
      const startMatches = date >= h.startDate;
      const endMatches = !h.endDate || date <= h.endDate;
      return startMatches && endMatches;
    });

    if (!found) {
      // Fallback to the latest version available
      return historyList[historyList.length - 1].value as T;
    }

    return found.value as T;
  }
}
