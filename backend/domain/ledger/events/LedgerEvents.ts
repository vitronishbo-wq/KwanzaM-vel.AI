import { IDomainEvent } from "../../shared/DomainEvent";
import { UniqueEntityId } from "../../shared/UniqueEntityId";
import { Money } from "../../shared/Money";

export class LedgerPostedEvent implements IDomainEvent {
  public readonly dateTimeOccurred: Date;
  public readonly postingId: UniqueEntityId;
  public readonly totalAmount: Money;
  public readonly description: string;

  constructor(postingId: UniqueEntityId, totalAmount: Money, description: string) {
    this.dateTimeOccurred = new Date();
    this.postingId = postingId;
    this.totalAmount = totalAmount;
    this.description = description;
  }

  public getAggregateId(): UniqueEntityId {
    return this.postingId;
  }
}
