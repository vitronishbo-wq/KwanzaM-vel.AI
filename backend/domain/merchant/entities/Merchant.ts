import { AggregateRoot } from "../../shared/AggregateRoot";
import { UniqueEntityId } from "../../shared/UniqueEntityId";
import { Mcc } from "../value-objects/Mcc";
import { MerchantStatus } from "../value-objects/MerchantStatus";
import { Money } from "../../shared/Money";
import { Result } from "../../shared/Result";
import { Guard } from "../../shared/Guard";
import { MerchantRegisteredEvent, MerchantStatusChangedEvent } from "../events/MerchantEvents";
import { RuleEvaluator } from "../../../regulatory/RuleEvaluator";

export interface MerchantProps {
  ownerId: UniqueEntityId;
  name: string;
  mcc: Mcc;
  mdrRateBps: number; // Merchant Discount Rate in basis points (e.g. 150 = 1.5%)
  status: MerchantStatus;
  walletId: UniqueEntityId;
}

export class Merchant extends AggregateRoot<MerchantProps> {
  private constructor(props: MerchantProps, id?: UniqueEntityId) {
    super(props, id);
  }

  public get ownerId(): UniqueEntityId {
    return this.props.ownerId;
  }

  public get name(): string {
    return this.props.name;
  }

  public get mcc(): Mcc {
    return this.props.mcc;
  }

  public get mdrRateBps(): number {
    return this.props.mdrRateBps;
  }

  public get status(): MerchantStatus {
    return this.props.status;
  }

  public get walletId(): UniqueEntityId {
    return this.props.walletId;
  }

  /**
   * Computes the MDR (Merchant Discount Rate) commission fee for a given purchase amount.
   * Done using pure integer math to avoid any floating-point/rounding bugs.
   */
  public calculateMdrFee(amount: Money): Money {
    if (this.props.mdrRateBps <= 0) {
      return Money.zero(amount.currency);
    }

    // MDR Fee = (Amount * mdrRateBps) / 10000 using pure BigInt math via multiplyBps
    return amount.multiplyBps(BigInt(this.props.mdrRateBps));
  }

  /**
   * Activates the merchant account for active trading.
   */
  public activate(): Result<void> {
    if (this.props.status.isActive()) {
      return Result.fail<void>("Merchant is already active.");
    }

    const oldStatus = this.props.status;
    this.props.status = MerchantStatus.active();
    this.addDomainEvent(new MerchantStatusChangedEvent(this.id, oldStatus, this.props.status));
    return Result.ok<void>();
  }

  /**
   * Suspends the merchant account (blocks payments and payouts).
   */
  public suspend(): Result<void> {
    if (this.props.status.isSuspended()) {
      return Result.fail<void>("Merchant is already suspended.");
    }

    const oldStatus = this.props.status;
    this.props.status = MerchantStatus.suspended();
    this.addDomainEvent(new MerchantStatusChangedEvent(this.id, oldStatus, this.props.status));
    return Result.ok<void>();
  }

  public static create(props: MerchantProps, id?: UniqueEntityId): Result<Merchant> {
    const guardResult = Guard.combine([
      Guard.againstNullOrUndefined(props.ownerId, "ownerId"),
      Guard.againstNullOrUndefined(props.name, "name"),
      Guard.againstNullOrUndefined(props.mcc, "mcc"),
      Guard.againstNullOrUndefined(props.status, "status"),
      Guard.againstNullOrUndefined(props.walletId, "walletId"),
      Guard.againstAtLeast(2, props.name, "name"),
    ]);

    if (!guardResult.succeeded) {
      return Result.fail<Merchant>(guardResult.message!);
    }

    if (props.mdrRateBps < 0) {
      return Result.fail<Merchant>("MDR Rate basis points cannot be negative.");
    }

    // Evaluate against BNA limit dynamically using RuleEvaluator
    const mdrEvaluation = RuleEvaluator.evaluateMdrFee(BigInt(props.mdrRateBps));
    if (mdrEvaluation.isFailure) {
      return Result.fail<Merchant>(mdrEvaluation.error!);
    }

    const merchantId = id || new UniqueEntityId();
    const isNew = !id;

    const merchant = new Merchant(props, merchantId);

    if (isNew) {
      merchant.addDomainEvent(new MerchantRegisteredEvent(merchantId, props.ownerId, props.name));
    }

    return Result.ok<Merchant>(merchant);
  }
}
