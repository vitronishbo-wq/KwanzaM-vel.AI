import { ValueObject } from "../../shared/ValueObject";
import { Result } from "../../shared/Result";
import { Guard } from "../../shared/Guard";

export enum WalletStatusValue {
  ACTIVE = "ACTIVE",
  FROZEN = "FROZEN",
  SUSPENDED = "SUSPENDED",
}

interface WalletStatusProps {
  value: WalletStatusValue;
}

export class WalletStatus extends ValueObject<WalletStatusProps> {
  private constructor(props: WalletStatusProps) {
    super(props);
  }

  public get value(): WalletStatusValue {
    return this.props.value;
  }

  public isActive(): boolean {
    return this.props.value === WalletStatusValue.ACTIVE;
  }

  public isFrozen(): boolean {
    return this.props.value === WalletStatusValue.FROZEN;
  }

  public isSuspended(): boolean {
    return this.props.value === WalletStatusValue.SUSPENDED;
  }

  public static create(value: string): Result<WalletStatus> {
    const guardResult = Guard.combine([
      Guard.againstNullOrUndefined(value, "Wallet status value"),
      Guard.isOneOf(value, Object.values(WalletStatusValue), "Wallet status value"),
    ]);

    if (!guardResult.succeeded) {
      return Result.fail<WalletStatus>(guardResult.message!);
    }

    return Result.ok<WalletStatus>(new WalletStatus({ value: value as WalletStatusValue }));
  }

  public static active(): WalletStatus {
    return new WalletStatus({ value: WalletStatusValue.ACTIVE });
  }

  public static frozen(): WalletStatus {
    return new WalletStatus({ value: WalletStatusValue.FROZEN });
  }

  public static suspended(): WalletStatus {
    return new WalletStatus({ value: WalletStatusValue.SUSPENDED });
  }
}
