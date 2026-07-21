import { ValueObject } from "../../shared/ValueObject";
import { Result } from "../../shared/Result";
import { Guard } from "../../shared/Guard";

export enum KycStatusValue {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

interface KycStatusProps {
  value: KycStatusValue;
}

export class KycStatus extends ValueObject<KycStatusProps> {
  private constructor(props: KycStatusProps) {
    super(props);
  }

  public get value(): KycStatusValue {
    return this.props.value;
  }

  public isPending(): boolean {
    return this.props.value === KycStatusValue.PENDING;
  }

  public isApproved(): boolean {
    return this.props.value === KycStatusValue.APPROVED;
  }

  public isRejected(): boolean {
    return this.props.value === KycStatusValue.REJECTED;
  }

  public static create(value: string): Result<KycStatus> {
    const guardResult = Guard.combine([
      Guard.againstNullOrUndefined(value, "Kyc status value"),
      Guard.isOneOf(value, Object.values(KycStatusValue), "Kyc status value"),
    ]);

    if (!guardResult.succeeded) {
      return Result.fail<KycStatus>(guardResult.message!);
    }

    return Result.ok<KycStatus>(new KycStatus({ value: value as KycStatusValue }));
  }

  public static pending(): KycStatus {
    return new KycStatus({ value: KycStatusValue.PENDING });
  }

  public static approved(): KycStatus {
    return new KycStatus({ value: KycStatusValue.APPROVED });
  }

  public static rejected(): KycStatus {
    return new KycStatus({ value: KycStatusValue.REJECTED });
  }
}
