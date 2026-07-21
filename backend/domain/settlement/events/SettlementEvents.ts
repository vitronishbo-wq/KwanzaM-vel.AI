import { IDomainEvent } from "../../shared/DomainEvent";
import { UniqueEntityId } from "../../shared/UniqueEntityId";
import { Money } from "../../shared/Money";

export class SettlementStartedEvent implements IDomainEvent {
  public readonly dateTimeOccurred: Date;
  public readonly batchId: UniqueEntityId;
  public readonly initialVolume: Money;

  constructor(batchId: UniqueEntityId, initialVolume: Money) {
    this.dateTimeOccurred = new Date();
    this.batchId = batchId;
    this.initialVolume = initialVolume;
  }

  public getAggregateId(): UniqueEntityId {
    return this.batchId;
  }
}

export class SettlementClosedEvent implements IDomainEvent {
  public readonly dateTimeOccurred: Date;
  public readonly batchId: UniqueEntityId;
  public readonly totalInstructionsVolume: Money;
  public readonly totalCustodyCover: Money;
  public readonly discrepancy: Money;

  constructor(
    batchId: UniqueEntityId,
    totalInstructionsVolume: Money,
    totalCustodyCover: Money,
    discrepancy: Money
  ) {
    this.dateTimeOccurred = new Date();
    this.batchId = batchId;
    this.totalInstructionsVolume = totalInstructionsVolume;
    this.totalCustodyCover = totalCustodyCover;
    this.discrepancy = discrepancy;
  }

  public getAggregateId(): UniqueEntityId {
    return this.batchId;
  }
}

export class SettlementDiscrepancyDetectedEvent implements IDomainEvent {
  public readonly dateTimeOccurred: Date;
  public readonly batchId: UniqueEntityId;
  public readonly instructionsVolume: Money;
  public readonly custodyCover: Money;
  public readonly shortfall: Money;

  constructor(batchId: UniqueEntityId, instructionsVolume: Money, custodyCover: Money, shortfall: Money) {
    this.dateTimeOccurred = new Date();
    this.batchId = batchId;
    this.instructionsVolume = instructionsVolume;
    this.custodyCover = custodyCover;
    this.shortfall = shortfall;
  }

  public getAggregateId(): UniqueEntityId {
    return this.batchId;
  }
}
