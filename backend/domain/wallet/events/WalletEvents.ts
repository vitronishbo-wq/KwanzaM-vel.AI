import { IDomainEvent } from "../../shared/DomainEvent";
import { UniqueEntityId } from "../../shared/UniqueEntityId";
import { Money } from "../../shared/Money";
import { KYCTier } from "../value-objects/KYCTier";

export class WalletCreatedEvent implements IDomainEvent {
  public readonly dateTimeOccurred: Date;
  public readonly walletId: UniqueEntityId;
  public readonly ownerId: UniqueEntityId;
  public readonly tier: KYCTier;

  constructor(walletId: UniqueEntityId, ownerId: UniqueEntityId, tier: KYCTier) {
    this.dateTimeOccurred = new Date();
    this.walletId = walletId;
    this.ownerId = ownerId;
    this.tier = tier;
  }

  public getAggregateId(): UniqueEntityId {
    return this.walletId;
  }
}

export class FundsDepositedEvent implements IDomainEvent {
  public readonly dateTimeOccurred: Date;
  public readonly walletId: UniqueEntityId;
  public readonly amount: Money;
  public readonly newBalance: Money;

  constructor(walletId: UniqueEntityId, amount: Money, newBalance: Money) {
    this.dateTimeOccurred = new Date();
    this.walletId = walletId;
    this.amount = amount;
    this.newBalance = newBalance;
  }

  public getAggregateId(): UniqueEntityId {
    return this.walletId;
  }
}

export class FundsWithdrawnEvent implements IDomainEvent {
  public readonly dateTimeOccurred: Date;
  public readonly walletId: UniqueEntityId;
  public readonly amount: Money;
  public readonly newBalance: Money;

  constructor(walletId: UniqueEntityId, amount: Money, newBalance: Money) {
    this.dateTimeOccurred = new Date();
    this.walletId = walletId;
    this.amount = amount;
    this.newBalance = newBalance;
  }

  public getAggregateId(): UniqueEntityId {
    return this.walletId;
  }
}

export class FundsReservedEvent implements IDomainEvent {
  public readonly dateTimeOccurred: Date;
  public readonly walletId: UniqueEntityId;
  public readonly amount: Money;
  public readonly newReservedBalance: Money;

  constructor(walletId: UniqueEntityId, amount: Money, newReservedBalance: Money) {
    this.dateTimeOccurred = new Date();
    this.walletId = walletId;
    this.amount = amount;
    this.newReservedBalance = newReservedBalance;
  }

  public getAggregateId(): UniqueEntityId {
    return this.walletId;
  }
}

export class FundsReleasedEvent implements IDomainEvent {
  public readonly dateTimeOccurred: Date;
  public readonly walletId: UniqueEntityId;
  public readonly amount: Money;
  public readonly newReservedBalance: Money;

  constructor(walletId: UniqueEntityId, amount: Money, newReservedBalance: Money) {
    this.dateTimeOccurred = new Date();
    this.walletId = walletId;
    this.amount = amount;
    this.newReservedBalance = newReservedBalance;
  }

  public getAggregateId(): UniqueEntityId {
    return this.walletId;
  }
}

export class WalletFrozenEvent implements IDomainEvent {
  public readonly dateTimeOccurred: Date;
  public readonly walletId: UniqueEntityId;
  public readonly reason: string;

  constructor(walletId: UniqueEntityId, reason: string) {
    this.dateTimeOccurred = new Date();
    this.walletId = walletId;
    this.reason = reason;
  }

  public getAggregateId(): UniqueEntityId {
    return this.walletId;
  }
}

export class WalletUnfrozenEvent implements IDomainEvent {
  public readonly dateTimeOccurred: Date;
  public readonly walletId: UniqueEntityId;

  constructor(walletId: UniqueEntityId) {
    this.dateTimeOccurred = new Date();
    this.walletId = walletId;
  }

  public getAggregateId(): UniqueEntityId {
    return this.walletId;
  }
}
