import { IDomainEvent } from "../../shared/DomainEvent";
import { UniqueEntityId } from "../../shared/UniqueEntityId";
import { MerchantStatus } from "../value-objects/MerchantStatus";

export class MerchantRegisteredEvent implements IDomainEvent {
  public readonly dateTimeOccurred: Date;
  public readonly merchantId: UniqueEntityId;
  public readonly ownerId: UniqueEntityId;
  public readonly name: string;

  constructor(merchantId: UniqueEntityId, ownerId: UniqueEntityId, name: string) {
    this.dateTimeOccurred = new Date();
    this.merchantId = merchantId;
    this.ownerId = ownerId;
    this.name = name;
  }

  public getAggregateId(): UniqueEntityId {
    return this.merchantId;
  }
}

export class MerchantStatusChangedEvent implements IDomainEvent {
  public readonly dateTimeOccurred: Date;
  public readonly merchantId: UniqueEntityId;
  public readonly oldStatus: MerchantStatus;
  public readonly newStatus: MerchantStatus;

  constructor(merchantId: UniqueEntityId, oldStatus: MerchantStatus, newStatus: MerchantStatus) {
    this.dateTimeOccurred = new Date();
    this.merchantId = merchantId;
    this.oldStatus = oldStatus;
    this.newStatus = newStatus;
  }

  public getAggregateId(): UniqueEntityId {
    return this.merchantId;
  }
}
