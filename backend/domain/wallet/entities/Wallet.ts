import { AggregateRoot } from "../../shared/AggregateRoot";
import { UniqueEntityId } from "../../shared/UniqueEntityId";
import { Money } from "../../shared/Money";
import { WalletStatus } from "../value-objects/WalletStatus";
import { KYCTier } from "../value-objects/KYCTier";
import { Result } from "../../shared/Result";
import { Guard } from "../../shared/Guard";
import {
  WalletCreatedEvent,
  FundsDepositedEvent,
  FundsWithdrawnEvent,
  FundsReservedEvent,
  FundsReleasedEvent,
  WalletFrozenEvent,
  WalletUnfrozenEvent,
} from "../events/WalletEvents";

export interface WalletProps {
  ownerId: UniqueEntityId;
  balance: Money;
  status: WalletStatus;
  tier: KYCTier;
  dailyLimit?: Money; // Custom limit override (optional)
  reservedBalance: Money; // Pending transactions or escrow/safeguard reserves
}

export class Wallet extends AggregateRoot<WalletProps> {
  private constructor(props: WalletProps, id?: UniqueEntityId) {
    super(props, id);
  }

  public get ownerId(): UniqueEntityId {
    return this.props.ownerId;
  }

  public get balance(): Money {
    return this.props.balance;
  }

  public get status(): WalletStatus {
    return this.props.status;
  }

  public get tier(): KYCTier {
    return this.props.tier;
  }

  public get dailyLimit(): Money {
    return this.props.dailyLimit || this.props.tier.getDefaultDailyLimit();
  }

  public get reservedBalance(): Money {
    return this.props.reservedBalance;
  }

  /**
   * Calculates the available balance (Total Balance minus Reserved/Escrow Balance)
   */
  public getAvailableBalance(): Money {
    return this.props.balance.subtract(this.props.reservedBalance);
  }

  /**
   * Deposits money into the wallet
   */
  public deposit(amount: Money): Result<void> {
    if (this.status.isFrozen() || this.status.isSuspended()) {
      return Result.fail<void>(`Cannot deposit funds. Wallet is currently ${this.status.value}.`);
    }

    if (!amount.isPositive()) {
      return Result.fail<void>(`Deposit amount must be greater than zero. Got: ${amount.format()}`);
    }

    this.props.balance = this.props.balance.add(amount);
    
    this.addDomainEvent(new FundsDepositedEvent(this.id, amount, this.props.balance));
    return Result.ok<void>();
  }

  /**
   * Withdraws money from the wallet (from available funds)
   */
  public withdraw(amount: Money): Result<void> {
    if (this.status.isFrozen() || this.status.isSuspended()) {
      return Result.fail<void>(`Cannot withdraw funds. Wallet is currently ${this.status.value}.`);
    }

    if (!amount.isPositive()) {
      return Result.fail<void>(`Withdrawal amount must be greater than zero. Got: ${amount.format()}`);
    }

    const available = this.getAvailableBalance();
    if (amount.isGreaterThan(available)) {
      return Result.fail<void>(
        `Insufficient available funds. Available: ${available.format()}. Requested: ${amount.format()}.`
      );
    }

    this.props.balance = this.props.balance.subtract(amount);

    this.addDomainEvent(new FundsWithdrawnEvent(this.id, amount, this.props.balance));
    return Result.ok<void>();
  }

  /**
   * Reserves a portion of available funds for a pending transfer/escrow
   */
  public reserve(amount: Money): Result<void> {
    if (!this.status.isActive()) {
      return Result.fail<void>(`Cannot reserve funds. Wallet is not active (Status: ${this.status.value}).`);
    }

    if (!amount.isPositive()) {
      return Result.fail<void>(`Reservation amount must be greater than zero. Got: ${amount.format()}`);
    }

    const available = this.getAvailableBalance();
    if (amount.isGreaterThan(available)) {
      return Result.fail<void>(
        `Insufficient available funds to reserve. Available: ${available.format()}. Requested: ${amount.format()}.`
      );
    }

    this.props.reservedBalance = this.props.reservedBalance.add(amount);

    this.addDomainEvent(new FundsReservedEvent(this.id, amount, this.props.reservedBalance));
    return Result.ok<void>();
  }

  /**
   * Releases previously reserved funds back to the available balance
   */
  public release(amount: Money): Result<void> {
    if (!amount.isPositive()) {
      return Result.fail<void>(`Release amount must be greater than zero. Got: ${amount.format()}`);
    }

    if (amount.isGreaterThan(this.props.reservedBalance)) {
      return Result.fail<void>(
        `Cannot release more than the currently reserved balance. Reserved: ${this.props.reservedBalance.format()}. Requested release: ${amount.format()}.`
      );
    }

    this.props.reservedBalance = this.props.reservedBalance.subtract(amount);

    this.addDomainEvent(new FundsReleasedEvent(this.id, amount, this.props.reservedBalance));
    return Result.ok<void>();
  }

  /**
   * Freezes the wallet to block all debit/credit operations (compliance / security reason)
   */
  public freeze(reason: string): Result<void> {
    const guardResult = Guard.againstNullOrUndefined(reason, "Freeze reason");
    if (!guardResult.succeeded) {
      return Result.fail<void>(guardResult.message!);
    }

    this.props.status = WalletStatus.frozen();
    this.addDomainEvent(new WalletFrozenEvent(this.id, reason));
    return Result.ok<void>();
  }

  /**
   * Unfreezes the wallet, returning it to active status
   */
  public unfreeze(): Result<void> {
    this.props.status = WalletStatus.active();
    this.addDomainEvent(new WalletUnfrozenEvent(this.id));
    return Result.ok<void>();
  }

  /**
   * Validates if a transaction of the specified amount can be executed
   * against both balance constraints and BNA KYC daily spending limits.
   */
  public canTransfer(amount: Money, dailySpentAmountToday: Money): Result<boolean> {
    if (this.status.isFrozen() || this.status.isSuspended()) {
      return Result.fail<boolean>(`Transação rejeitada. Carteira encontra-se bloqueada (${this.status.value}).`);
    }

    if (!amount.isPositive()) {
      return Result.fail<boolean>("Transação rejeitada. O valor da transferência deve ser maior que zero.");
    }

    // Check available balance
    const available = this.getAvailableBalance();
    if (amount.isGreaterThan(available)) {
      return Result.fail<boolean>(
        `Transação rejeitada. Saldo insuficiente. Saldo disponível atual é de ${available.format()}.`
      );
    }

    // Check daily spending limit
    const totalWithCurrent = dailySpentAmountToday.add(amount);
    const limit = this.dailyLimit;
    if (totalWithCurrent.isGreaterThan(limit)) {
      return Result.fail<boolean>(
        `Limite de segurança excedido. O montante máximo diário permitido para o seu nível de KYC (${this.tier.value}) é de ${limit.format()}. Já utilizou hoje ${dailySpentAmountToday.format()}.`
      );
    }

    return Result.ok<boolean>(true);
  }

  /**
   * Factory method to construct a new Wallet aggregate
   */
  public static create(props: WalletProps, id?: UniqueEntityId): Result<Wallet> {
    const guardResult = Guard.combine([
      Guard.againstNullOrUndefined(props.ownerId, "ownerId"),
      Guard.againstNullOrUndefined(props.balance, "balance"),
      Guard.againstNullOrUndefined(props.status, "status"),
      Guard.againstNullOrUndefined(props.tier, "tier"),
      Guard.againstNullOrUndefined(props.reservedBalance, "reservedBalance"),
    ]);

    if (!guardResult.succeeded) {
      return Result.fail<Wallet>(guardResult.message!);
    }

    const walletId = id || new UniqueEntityId();
    const isNew = !id;

    const wallet = new Wallet(props, walletId);

    if (isNew) {
      wallet.addDomainEvent(new WalletCreatedEvent(walletId, props.ownerId, props.tier));
    }

    return Result.ok<Wallet>(wallet);
  }
}
