import { ValueObject } from "../../shared/ValueObject";
import { Result } from "../../shared/Result";
import { Guard } from "../../shared/Guard";
import { Money } from "../../shared/Money";
import { RuleRegistry } from "../../../regulatory/RuleRegistry";

export enum KYCTierValue {
  LEVEL_1 = "Level-1",
  LEVEL_2 = "Level-2",
  LEVEL_3 = "Level-3",
}

interface KYCTierProps {
  value: KYCTierValue;
}

export class KYCTier extends ValueObject<KYCTierProps> {
  private constructor(props: KYCTierProps) {
    super(props);
  }

  public get value(): KYCTierValue {
    return this.props.value;
  }

  /**
   * Returns the BNA regulated default daily spending limit in Kwanza for this KYC Tier.
   * Derived dynamically from the law-driven RuleRegistry.
   */
  public getDefaultDailyLimit(): Money {
    return RuleRegistry.getTierDailyLimit(this.props.value);
  }

  public static create(value: string): Result<KYCTier> {
    const guardResult = Guard.combine([
      Guard.againstNullOrUndefined(value, "KYC Tier value"),
      Guard.isOneOf(value, Object.values(KYCTierValue), "KYC Tier value"),
    ]);

    if (!guardResult.succeeded) {
      return Result.fail<KYCTier>(guardResult.message!);
    }

    return Result.ok<KYCTier>(new KYCTier({ value: value as KYCTierValue }));
  }

  public static level1(): KYCTier {
    return new KYCTier({ value: KYCTierValue.LEVEL_1 });
  }

  public static level2(): KYCTier {
    return new KYCTier({ value: KYCTierValue.LEVEL_2 });
  }

  public static level3(): KYCTier {
    return new KYCTier({ value: KYCTierValue.LEVEL_3 });
  }
}
