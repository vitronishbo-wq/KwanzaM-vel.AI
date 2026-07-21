import { Money } from "../domain/shared/Money";
import { RuleRegistry } from "./RuleRegistry";
import { Result } from "../domain/shared/Result";

export interface EvaluationResult {
  allowed: boolean;
  ruleId: string;
  diploma: string;
  article: string;
  limit: Money;
  currentValue: Money;
  violationMessage?: string;
}

/**
 * Compliance evaluation engine that executes BNA regulations on domain assets.
 * Evaluates operational parameters against active legal rules and generates
 * trace-level explanations containing the exact article, number, and version.
 */
export class RuleEvaluator {
  /**
   * Evaluates if a transaction respects the active daily spending limits of the user's KYC tier.
   * Emits clear Portuguese/Kwanza warnings on failure with citations of the applicable BNA Notice.
   */
  public static evaluateDailyLimit(
    tierValue: string,
    amountToSpend: Money,
    alreadySpentToday: Money
  ): Result<EvaluationResult> {
    const dailyLimitMoney = RuleRegistry.getTierDailyLimit(tierValue);
    const totalSpentWithCurrent = alreadySpentToday.add(amountToSpend);

    const isWithinLimits = totalSpentWithCurrent.isLessThanOrEqual(dailyLimitMoney);

    let ruleId = "BNA-A0322-ART18-LIMIT-L1";
    if (tierValue.toLowerCase() === "level-2") {
      ruleId = "BNA-A0322-ART18-LIMIT-L2";
    } else if (tierValue.toLowerCase() === "level-3") {
      ruleId = "BNA-A0322-ART18-LIMIT-L3";
    }

    const rule = RuleRegistry.getRule<bigint>(ruleId);
    const diploma = rule ? rule.diploma : "Aviso n.º 03/22";
    const article = rule ? rule.article : "Artigo 18.º";

    const evalResult: EvaluationResult = {
      allowed: isWithinLimits,
      ruleId,
      diploma,
      article,
      limit: dailyLimitMoney,
      currentValue: totalSpentWithCurrent,
    };

    if (!isWithinLimits) {
      evalResult.violationMessage = 
        `Limite regulatório ultrapassado (${diploma}, ${article}): O montante máximo diário para o nível ${tierValue} é ${dailyLimitMoney.format()}. ` +
        `Com esta transação de ${amountToSpend.format()}, atingiria um total de ${totalSpentWithCurrent.format()} hoje (já gasto: ${alreadySpentToday.format()}).`;
      
      return Result.fail<EvaluationResult>(evalResult.violationMessage);
    }

    return Result.ok<EvaluationResult>(evalResult);
  }

  /**
   * Evaluates if a merchant MDR fee respects the maximum BNA bounds.
   */
  public static evaluateMdrFee(mdrRateBps: bigint): Result<void> {
    const maxBpsRule = RuleRegistry.getRule<bigint>("BNA-A1020-MDR-MAX-BPS");
    const maxBps = maxBpsRule ? maxBpsRule.value : 250n;

    if (mdrRateBps > maxBps) {
      return Result.fail<void>(
        `Violação de Invariante de Taxa (${maxBpsRule?.diploma || "Aviso 10/20"}): A taxa MDR solicitada (${(Number(mdrRateBps) / 100).toFixed(2)}%) ` +
        `excede o teto regulamentar máximo permitido de ${(Number(maxBps) / 100).toFixed(2)}%.`
      );
    }

    return Result.ok<void>();
  }
}
