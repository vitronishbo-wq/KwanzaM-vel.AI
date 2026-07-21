import { IDomainEvent } from "../../shared/DomainEvent";
import { UniqueEntityId } from "../../shared/UniqueEntityId";
import { KYCTier } from "../../wallet/value-objects/KYCTier";
import { Nif } from "../value-objects/Nif";

export class KycSubmittedEvent implements IDomainEvent {
  public readonly dateTimeOccurred: Date;
  public readonly kycId: UniqueEntityId;
  public readonly ownerId: UniqueEntityId;
  public readonly nif: Nif;

  constructor(kycId: UniqueEntityId, ownerId: UniqueEntityId, nif: Nif) {
    this.dateTimeOccurred = new Date();
    this.kycId = kycId;
    this.ownerId = ownerId;
    this.nif = nif;
  }

  public getAggregateId(): UniqueEntityId {
    return this.kycId;
  }
}

export class KycApprovedEvent implements IDomainEvent {
  public readonly dateTimeOccurred: Date;
  public readonly kycId: UniqueEntityId;
  public readonly ownerId: UniqueEntityId;
  public readonly approvedTier: KYCTier;

  constructor(kycId: UniqueEntityId, ownerId: UniqueEntityId, approvedTier: KYCTier) {
    this.dateTimeOccurred = new Date();
    this.kycId = kycId;
    this.ownerId = ownerId;
    this.approvedTier = approvedTier;
  }

  public getAggregateId(): UniqueEntityId {
    return this.kycId;
  }
}

export class KycRejectedEvent implements IDomainEvent {
  public readonly dateTimeOccurred: Date;
  public readonly kycId: UniqueEntityId;
  public readonly ownerId: UniqueEntityId;
  public readonly reason: string;

  constructor(kycId: UniqueEntityId, ownerId: UniqueEntityId, reason: string) {
    this.dateTimeOccurred = new Date();
    this.kycId = kycId;
    this.ownerId = ownerId;
    this.reason = reason;
  }

  public getAggregateId(): UniqueEntityId {
    return this.kycId;
  }
}
