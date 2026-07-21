import { IDomainEvent } from "../domain/shared/DomainEvent";
import { UniqueEntityId } from "../domain/shared/UniqueEntityId";
import { Money } from "../domain/shared/Money";

/**
 * Event published when a user tries to exceed BNA KYC limits, serving as an AML audit trail.
 */
export class RegulatoryLimitBreachedEvent implements IDomainEvent {
  public dateTimeOccurred: Date;
  public readonly walletId: UniqueEntityId;
  public readonly attemptedAmount: Money;
  public readonly alreadySpentToday: Money;
  public readonly activeLimit: Money;
  public readonly ruleId: string;
  public readonly diploma: string;

  constructor(
    walletId: UniqueEntityId,
    attemptedAmount: Money,
    alreadySpentToday: Money,
    activeLimit: Money,
    ruleId: string,
    diploma: string
  ) {
    this.dateTimeOccurred = new Date();
    this.walletId = walletId;
    this.attemptedAmount = attemptedAmount;
    this.alreadySpentToday = alreadySpentToday;
    this.activeLimit = activeLimit;
    this.ruleId = ruleId;
    this.diploma = diploma;
  }

  getAggregateId(): UniqueEntityId {
    return this.walletId;
  }
}

/**
 * Event published when a merchant's rate config violates BNA Aviso 10/20 caps.
 */
export class RegulatoryMdrViolationEvent implements IDomainEvent {
  public dateTimeOccurred: Date;
  public readonly merchantId: UniqueEntityId;
  public readonly attemptedRateBps: number;
  public readonly maxAllowedBps: number;
  public readonly ruleId: string;

  constructor(merchantId: UniqueEntityId, attemptedRateBps: number, maxAllowedBps: number, ruleId: string) {
    this.dateTimeOccurred = new Date();
    this.merchantId = merchantId;
    this.attemptedRateBps = attemptedRateBps;
    this.maxAllowedBps = maxAllowedBps;
    this.ruleId = ruleId;
  }

  getAggregateId(): UniqueEntityId {
    return this.merchantId;
  }
}
