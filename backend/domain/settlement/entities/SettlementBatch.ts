import { AggregateRoot } from "../../shared/AggregateRoot";
import { UniqueEntityId } from "../../shared/UniqueEntityId";
import { SettlementStatus } from "../value-objects/SettlementStatus";
import { Money } from "../../shared/Money";
import { Result } from "../../shared/Result";
import { Guard } from "../../shared/Guard";
import {
  SettlementStartedEvent,
  SettlementClosedEvent,
  SettlementDiscrepancyDetectedEvent,
} from "../events/SettlementEvents";

export interface SettlementBatchProps {
  startedAt: Date;
  closedAt?: Date;
  status: SettlementStatus;
  totalInstructionsVolume: Money;
  totalCustodyCover: Money;
  discrepancy: Money;
}

export class SettlementBatch extends AggregateRoot<SettlementBatchProps> {
  private constructor(props: SettlementBatchProps, id?: UniqueEntityId) {
    super(props, id);
  }

  public get startedAt(): Date {
    return this.props.startedAt;
  }

  public get closedAt(): Date | undefined {
    return this.props.closedAt;
  }

  public get status(): SettlementStatus {
    return this.props.status;
  }

  public get totalInstructionsVolume(): Money {
    return this.props.totalInstructionsVolume;
  }

  public get totalCustodyCover(): Money {
    return this.props.totalCustodyCover;
  }

  public get discrepancy(): Money {
    return this.props.discrepancy;
  }

  /**
   * Closes the settlement batch by verifying that the custody cash cover from BNA + banks
   * is equal to or greater than the circulating liabilities (100% safeguard backing invariant).
   *
   * @param custodyCover Total fiduciaries custody reserves backing the e-money
   */
  public close(custodyCover: Money): Result<void> {
    if (this.props.status.isClosed() || this.props.status.isFailed()) {
      return Result.fail<void>(`Cannot close settlement batch. Status is already ${this.props.status.value}.`);
    }

    if (!custodyCover.currency.equals(this.props.totalInstructionsVolume.currency)) {
      return Result.fail<void>("Currency mismatch between custody cover and instructions volume.");
    }

    this.props.totalCustodyCover = custodyCover;

    // Verify 100% backing compliance (BNA reserve law)
    if (custodyCover.isLessThan(this.props.totalInstructionsVolume)) {
      const shortfall = this.props.totalInstructionsVolume.subtract(custodyCover);
      
      this.props.status = SettlementStatus.failed();
      this.props.discrepancy = shortfall;
      this.props.closedAt = new Date();

      this.addDomainEvent(
        new SettlementDiscrepancyDetectedEvent(this.id, this.props.totalInstructionsVolume, custodyCover, shortfall)
      );

      return Result.fail<void>(
        `BNA Safeguard Violation: Insufficient custody reserves to back circulating digital Kwanza. Shortfall: ${shortfall.format()}.`
      );
    }

    const surplus = custodyCover.subtract(this.props.totalInstructionsVolume);
    this.props.discrepancy = surplus;
    this.props.status = SettlementStatus.closed();
    this.props.closedAt = new Date();

    this.addDomainEvent(
      new SettlementClosedEvent(this.id, this.props.totalInstructionsVolume, custodyCover, surplus)
    );

    return Result.ok<void>();
  }

  public static create(props: SettlementBatchProps, id?: UniqueEntityId): Result<SettlementBatch> {
    const guardResult = Guard.combine([
      Guard.againstNullOrUndefined(props.startedAt, "startedAt"),
      Guard.againstNullOrUndefined(props.status, "status"),
      Guard.againstNullOrUndefined(props.totalInstructionsVolume, "totalInstructionsVolume"),
      Guard.againstNullOrUndefined(props.totalCustodyCover, "totalCustodyCover"),
      Guard.againstNullOrUndefined(props.discrepancy, "discrepancy"),
    ]);

    if (!guardResult.succeeded) {
      return Result.fail<SettlementBatch>(guardResult.message!);
    }

    const batchId = id || new UniqueEntityId();
    const isNew = !id;

    const batch = new SettlementBatch(props, batchId);

    if (isNew) {
      batch.addDomainEvent(new SettlementStartedEvent(batchId, props.totalInstructionsVolume));
    }

    return Result.ok<SettlementBatch>(batch);
  }
}
