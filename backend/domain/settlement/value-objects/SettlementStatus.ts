import { ValueObject } from "../../shared/ValueObject";
import { Result } from "../../shared/Result";
import { Guard } from "../../shared/Guard";

export enum SettlementStatusValue {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  CLOSED = "CLOSED",
  FAILED = "FAILED",
}

interface SettlementStatusProps {
  value: SettlementStatusValue;
}

export class SettlementStatus extends ValueObject<SettlementStatusProps> {
  private constructor(props: SettlementStatusProps) {
    super(props);
  }

  public get value(): SettlementStatusValue {
    return this.props.value;
  }

  public isPending(): boolean {
    return this.props.value === SettlementStatusValue.PENDING;
  }

  public isProcessing(): boolean {
    return this.props.value === SettlementStatusValue.PROCESSING;
  }

  public isClosed(): boolean {
    return this.props.value === SettlementStatusValue.CLOSED;
  }

  public isFailed(): boolean {
    return this.props.value === SettlementStatusValue.FAILED;
  }

  public static create(value: string): Result<SettlementStatus> {
    const guardResult = Guard.combine([
      Guard.againstNullOrUndefined(value, "Settlement status value"),
      Guard.isOneOf(value, Object.values(SettlementStatusValue), "Settlement status value"),
    ]);

    if (!guardResult.succeeded) {
      return Result.fail<SettlementStatus>(guardResult.message!);
    }

    return Result.ok<SettlementStatus>(new SettlementStatus({ value: value as SettlementStatusValue }));
  }

  public static pending(): SettlementStatus {
    return new SettlementStatus({ value: SettlementStatusValue.PENDING });
  }

  public static processing(): SettlementStatus {
    return new SettlementStatus({ value: SettlementStatusValue.PROCESSING });
  }

  public static closed(): SettlementStatus {
    return new SettlementStatus({ value: SettlementStatusValue.CLOSED });
  }

  public static failed(): SettlementStatus {
    return new SettlementStatus({ value: SettlementStatusValue.FAILED });
  }
}
