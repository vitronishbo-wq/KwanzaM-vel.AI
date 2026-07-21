import { AggregateRoot } from "../../shared/AggregateRoot";
import { UniqueEntityId } from "../../shared/UniqueEntityId";
import { Nif } from "../value-objects/Nif";
import { KycStatus } from "../value-objects/KycStatus";
import { KYCTier } from "../../wallet/value-objects/KYCTier";
import { Result } from "../../shared/Result";
import { Guard } from "../../shared/Guard";
import { KycSubmittedEvent, KycApprovedEvent, KycRejectedEvent } from "../events/IdentityEvents";

export interface UserIdentityProps {
  ownerId: UniqueEntityId;
  nif: Nif;
  status: KycStatus;
  tier: KYCTier;
  documentUrl?: string;
  verifiedAt?: Date;
  rejectionReason?: string;
}

export class UserIdentity extends AggregateRoot<UserIdentityProps> {
  private constructor(props: UserIdentityProps, id?: UniqueEntityId) {
    super(props, id);
  }

  public get ownerId(): UniqueEntityId {
    return this.props.ownerId;
  }

  public get nif(): Nif {
    return this.props.nif;
  }

  public get status(): KycStatus {
    return this.props.status;
  }

  public get tier(): KYCTier {
    return this.props.tier;
  }

  public get documentUrl(): string | undefined {
    return this.props.documentUrl;
  }

  public get verifiedAt(): Date | undefined {
    return this.props.verifiedAt;
  }

  public get rejectionReason(): string | undefined {
    return this.props.rejectionReason;
  }

  /**
   * Approves the KYC process for a user, elevating them to a higher regulatory Tier.
   */
  public approve(targetTier: KYCTier): Result<void> {
    if (this.props.status.isApproved() && this.props.tier.equals(targetTier)) {
      return Result.fail<void>(`User identity is already approved at level ${targetTier.value}.`);
    }

    this.props.status = KycStatus.approved();
    this.props.tier = targetTier;
    this.props.verifiedAt = new Date();
    this.props.rejectionReason = undefined;

    this.addDomainEvent(new KycApprovedEvent(this.id, this.ownerId, targetTier));
    return Result.ok<void>();
  }

  /**
   * Rejects the KYC submission with a compliance audit reason.
   */
  public reject(reason: string): Result<void> {
    const guardResult = Guard.againstNullOrUndefined(reason, "Rejection reason");
    if (!guardResult.succeeded) {
      return Result.fail<void>(guardResult.message!);
    }

    this.props.status = KycStatus.rejected();
    this.props.rejectionReason = reason;
    this.props.verifiedAt = new Date();

    this.addDomainEvent(new KycRejectedEvent(this.id, this.ownerId, reason));
    return Result.ok<void>();
  }

  public static create(props: UserIdentityProps, id?: UniqueEntityId): Result<UserIdentity> {
    const guardResult = Guard.combine([
      Guard.againstNullOrUndefined(props.ownerId, "ownerId"),
      Guard.againstNullOrUndefined(props.nif, "nif"),
      Guard.againstNullOrUndefined(props.status, "status"),
      Guard.againstNullOrUndefined(props.tier, "tier"),
    ]);

    if (!guardResult.succeeded) {
      return Result.fail<UserIdentity>(guardResult.message!);
    }

    const identityId = id || new UniqueEntityId();
    const isNew = !id;

    const identity = new UserIdentity(props, identityId);

    if (isNew) {
      identity.addDomainEvent(new KycSubmittedEvent(identityId, props.ownerId, props.nif));
    }

    return Result.ok<UserIdentity>(identity);
  }
}
