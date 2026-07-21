import { ValueObject } from "./ValueObject";
import { Currency } from "./Currency";
import { Guard } from "./Guard";
import { Result } from "./Result";

interface MoneyProps {
  amount: bigint; // Stored as subunits (e.g., cêntimos)
  currency: Currency;
}

/**
 * Value Object Money representing a monetary amount under a specific Currency.
 * Implements strict immutability, uses bigint to represent subunits (cêntimos) 
 * to prevent decimal precision errors, and exposes validation methods for financial invariants.
 *
 * All financial math operations are strictly conducted using bigint to avoid floating-point drift.
 */
export class Money extends ValueObject<MoneyProps> {
  private constructor(props: MoneyProps) {
    super(props);
  }

  public get amount(): bigint {
    return this.props.amount;
  }

  public get currency(): Currency {
    return this.props.currency;
  }

  /**
   * Financial Invariant Validation: Ensures the amount is non-negative.
   */
  public isNonNegative(): boolean {
    return this.props.amount >= 0n;
  }

  /**
   * Financial Invariant Validation: Ensures the amount is strictly positive (greater than zero).
   */
  public isPositive(): boolean {
    return this.props.amount > 0n;
  }

  /**
   * Financial Invariant Validation: Ensures the amount is strictly negative (less than zero).
   */
  public isNegative(): boolean {
    return this.props.amount < 0n;
  }

  /**
   * Financial Invariant Validation: Ensures the amount is zero.
   */
  public isZero(): boolean {
    return this.props.amount === 0n;
  }

  /**
   * Financial Invariant Validation: Ensures that another Money instance has the same currency
   * before performing any financial math or comparisons.
   */
  public validateSameCurrency(other: Money): Result<void> {
    if (!this.currency.equals(other.currency)) {
      return Result.fail<void>(
        `Operação financeira inválida: Moedas divergentes (${this.currency.code} vs ${other.currency.code}).`
      );
    }
    return Result.ok<void>();
  }

  /**
   * Factory method to create an immutable Money instance using subunits (bigint).
   * By default, it blocks negative amounts unless explicitly required by business rules
   * (e.g., overdraft/adjustments, handled by passing allowNegative = true).
   */
  public static create(amountInSubunits: bigint, currency: Currency, allowNegative = false): Result<Money> {
    const guardResult = Guard.combine([
      Guard.againstNullOrUndefined(amountInSubunits, "amountInSubunits"),
      Guard.againstNullOrUndefined(currency, "currency"),
    ]);

    if (!guardResult.succeeded) {
      return Result.fail<Money>(guardResult.message!);
    }

    if (!allowNegative && amountInSubunits < 0n) {
      return Result.fail<Money>(
        "Invariante Financeiro Violado: Valores monetários negativos não são permitidos pelas regras padrão do KwanzaMóvel."
      );
    }

    return Result.ok<Money>(
      new Money({
        amount: amountInSubunits,
        currency,
      })
    );
  }

  /**
   * Static factory method for direct, strict AOA (Angolan Kwanza) currency instantiation with subunit (cêntimos) value.
   * By default, ensures no negative amounts unless explicitly allowed.
   */
  public static AOA(amountInSubunits: bigint, allowNegative = false): Money {
    if (!allowNegative && amountInSubunits < 0n) {
      throw new Error(
        "Invariante Financeiro Violado: Montante em Kwanza (AOA) não pode ser negativo sob as regras de negócio padrão."
      );
    }
    return new Money({
      amount: amountInSubunits,
      currency: Currency.AOA(),
    });
  }

  /**
   * Factory method to create an immutable Money instance using the main unit (e.g., standard Kwanza value as number).
   * Parses string parts to safely convert to cêntimos, strictly avoiding binary floating-point multiplication.
   */
  public static fromMainUnit(amount: number, currency: Currency, allowNegative = false): Result<Money> {
    const guardResult = Guard.againstNullOrUndefined(amount, "amount");
    if (!guardResult.succeeded) {
      return Result.fail<Money>(guardResult.message!);
    }

    // Convert number to fixed string format to parse parts and avoid any floating-point representation quirks
    const decimals = currency.decimals;
    const amountStr = amount.toFixed(decimals);
    
    const parts = amountStr.split(".");
    const integerStr = parts[0];
    const fractionalStr = parts[1] || "0";

    const isNegativeAmount = amount < 0;
    const absoluteInteger = isNegativeAmount ? BigInt(integerStr.replace("-", "")) : BigInt(integerStr);
    const absoluteFractional = BigInt(fractionalStr.padEnd(decimals, "0"));

    const factor = 10n ** BigInt(decimals);
    let subunitAmount = absoluteInteger * factor + absoluteFractional;

    if (isNegativeAmount) {
      subunitAmount = -subunitAmount;
    }

    return Money.create(subunitAmount, currency, allowNegative);
  }

  /**
   * Factory method to create an immutable zero Money instance.
   */
  public static zero(currency: Currency = Currency.AOA()): Money {
    return new Money({
      amount: 0n,
      currency,
    });
  }

  /**
   * Financial Math: Adds another Money instance, returning a new immutable Money instance.
   * Enforces currency matching.
   */
  public add(money: Money): Money {
    const validation = this.validateSameCurrency(money);
    if (validation.isFailure) {
      throw new Error(validation.error);
    }
    return new Money({
      amount: this.amount + money.amount,
      currency: this.currency,
    });
  }

  /**
   * Financial Math: Subtracts another Money instance, returning a new immutable Money instance.
   * Enforces currency matching.
   */
  public subtract(money: Money): Money {
    const validation = this.validateSameCurrency(money);
    if (validation.isFailure) {
      throw new Error(validation.error);
    }
    return new Money({
      amount: this.amount - money.amount,
      currency: this.currency,
    });
  }

  /**
   * Financial Math: Multiplies by a scale factor, returning a new immutable Money instance.
   * Conducted with 100% pure BigInt math.
   */
  public multiply(factor: bigint): Money {
    return new Money({
      amount: this.amount * factor,
      currency: this.currency,
    });
  }

  /**
   * Financial Math: Multiplies by basis points (BPS) and divides by 10000n.
   * Essential for safe tax, interest, and commission splits (e.g., MDR fees) without floats.
   */
  public multiplyBps(bps: bigint): Money {
    return new Money({
      amount: (this.amount * bps) / 10000n,
      currency: this.currency,
    });
  }

  /**
   * Financial Math: Divides the amount by a divisor, returning a new immutable Money instance.
   */
  public divide(divisor: bigint): Money {
    if (divisor === 0n) {
      throw new Error("Divisão por zero em cálculo financeiro.");
    }
    return new Money({
      amount: this.amount / divisor,
      currency: this.currency,
    });
  }

  /**
   * Comparison: Checks if this instance is greater than another.
   * Enforces currency matching.
   */
  public isGreaterThan(money: Money): boolean {
    const validation = this.validateSameCurrency(money);
    if (validation.isFailure) {
      throw new Error(validation.error);
    }
    return this.amount > money.amount;
  }

  /**
   * Comparison: Checks if this instance is greater than or equal to another.
   * Enforces currency matching.
   */
  public isGreaterThanOrEqual(money: Money): boolean {
    const validation = this.validateSameCurrency(money);
    if (validation.isFailure) {
      throw new Error(validation.error);
    }
    return this.amount >= money.amount;
  }

  /**
   * Comparison: Checks if this instance is less than another.
   * Enforces currency matching.
   */
  public isLessThan(money: Money): boolean {
    const validation = this.validateSameCurrency(money);
    if (validation.isFailure) {
      throw new Error(validation.error);
    }
    return this.amount < money.amount;
  }

  /**
   * Comparison: Checks if this instance is less than or equal to another.
   * Enforces currency matching.
   */
  public isLessThanOrEqual(money: Money): boolean {
    const validation = this.validateSameCurrency(money);
    if (validation.isFailure) {
      throw new Error(validation.error);
    }
    return this.amount <= money.amount;
  }

  /**
   * Value object equality check.
   */
  public equals(vo?: ValueObject<MoneyProps>): boolean {
    if (vo === null || vo === undefined) {
      return false;
    }
    if (!(vo instanceof Money)) {
      return false;
    }
    return this.amount === vo.amount && this.currency.equals(vo.currency);
  }

  /**
   * Converts the internal bigint subunit amount to the main currency unit as standard JS number.
   * Useful for serialization, third-party DTOs, and charting libraries (e.g. Recharts, D3).
   * Note: This is purely a projection method; internal domain math never depends on this.
   */
  public toFormatNumber(): number {
    const factor = 10n ** BigInt(this.currency.decimals);
    return Number(this.amount) / Number(factor);
  }

  /**
   * Formats the monetary value for display following Angolan/Portuguese standards.
   * Conducted with 100% pure BigInt string parsing, strictly avoiding float division.
   */
  public format(): string {
    const isNeg = this.props.amount < 0n;
    const absVal = isNeg ? -this.props.amount : this.props.amount;
    const factor = 10n ** BigInt(this.props.currency.decimals);
    
    const integerPart = absVal / factor;
    const fractionalPart = absVal % factor;
    
    const paddedFraction = fractionalPart.toString().padStart(this.props.currency.decimals, "0");
    
    // Add thousands dot separators following standard European style used in Angola
    const integerStr = integerPart.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    
    const sign = isNeg ? "-" : "";
    return `${sign}${integerStr},${paddedFraction} ${this.props.currency.symbol}`;
  }
}
