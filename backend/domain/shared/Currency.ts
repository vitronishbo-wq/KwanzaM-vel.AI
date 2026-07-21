import { ValueObject } from "./ValueObject";
import { Guard } from "./Guard";
import { Result } from "./Result";

interface CurrencyProps {
  code: string;
  name: string;
  symbol: string;
  decimals: number;
}

export class Currency extends ValueObject<CurrencyProps> {
  private constructor(props: CurrencyProps) {
    super(props);
  }

  public get code(): string {
    return this.props.code;
  }

  public get name(): string {
    return this.props.name;
  }

  public get symbol(): string {
    return this.props.symbol;
  }

  public get decimals(): number {
    return this.props.decimals;
  }

  public static create(code: string, name: string, symbol: string, decimals: number = 2): Result<Currency> {
    const guardResult = Guard.combine([
      Guard.againstNullOrUndefined(code, "code"),
      Guard.againstNullOrUndefined(name, "name"),
      Guard.againstNullOrUndefined(symbol, "symbol"),
      Guard.againstAtLeast(3, code, "code"),
      Guard.againstAtMost(3, code, "code"),
    ]);

    if (!guardResult.succeeded) {
      return Result.fail<Currency>(guardResult.message!);
    }

    return Result.ok<Currency>(
      new Currency({
        code: code.toUpperCase(),
        name,
        symbol,
        decimals,
      })
    );
  }

  public static AOA(): Currency {
    return new Currency({
      code: "AOA",
      name: "Kwanza Angolano",
      symbol: "Kz",
      decimals: 2,
    });
  }
}
