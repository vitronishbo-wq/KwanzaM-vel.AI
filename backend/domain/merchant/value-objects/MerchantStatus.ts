import { ValueObject } from "../../shared/ValueObject";
import { Result } from "../../shared/Result";
import { Guard } from "../../shared/Guard";

export enum MerchantStatusValue {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
}

interface MerchantStatusProps {
  value: MerchantStatusValue;
}

export class MerchantStatus extends ValueObject<MerchantStatusProps> {
  private constructor(props: MerchantStatusProps) {
    super(props);
  }

  public get value(): MerchantStatusValue {
    return this.props.value;
  }

  public isPending(): boolean {
    return this.props.value === MerchantStatusValue.PENDING;
  }

  public isActive(): boolean {
    return this.props.value === MerchantStatusValue.ACTIVE;
  }

  public isSuspended(): boolean {
    return this.props.value === MerchantStatusValue.SUSPENDED;
  }

  public static create(value: string): Result<MerchantStatus> {
    const guardResult = Guard.combine([
      Guard.againstNullOrUndefined(value, "Merchant status value"),
      Guard.isOneOf(value, Object.values(MerchantStatusValue), "Merchant status value"),
    ]);

    if (!guardResult.succeeded) {
      return Result.fail<MerchantStatus>(guardResult.message!);
    }

    return Result.ok<MerchantStatus>(new MerchantStatus({ value: value as MerchantStatusValue }));
  }

  public static pending(): MerchantStatus {
    return new MerchantStatus({ value: MerchantStatusValue.PENDING });
  }

  public static active(): MerchantStatus {
    return new MerchantStatus({ value: MerchantStatusValue.ACTIVE });
  }

  public static suspended(): MerchantStatus {
    return new MerchantStatus({ value: MerchantStatusValue.SUSPENDED });
  }
}
