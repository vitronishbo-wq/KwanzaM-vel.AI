import { ValueObject } from "../../shared/ValueObject";
import { Result } from "../../shared/Result";
import { Guard } from "../../shared/Guard";

interface MccProps {
  code: string; // e.g. "5411", "5812"
  description: string;
}

export class Mcc extends ValueObject<MccProps> {
  private constructor(props: MccProps) {
    super(props);
  }

  public get code(): string {
    return this.props.code;
  }

  public get description(): string {
    return this.props.description;
  }

  public static create(code: string, description: string): Result<Mcc> {
    const guardResult = Guard.combine([
      Guard.againstNullOrUndefined(code, "MCC code"),
      Guard.againstNullOrUndefined(description, "MCC description"),
    ]);

    if (!guardResult.succeeded) {
      return Result.fail<Mcc>(guardResult.message!);
    }

    const trimmedCode = code.trim();
    if (!/^\d{4}$/.test(trimmedCode)) {
      return Result.fail<Mcc>(`Código de Categoria do Comerciante (MCC) deve ter exatamente 4 algarismos. Got: "${trimmedCode}"`);
    }

    return Result.ok<Mcc>(new Mcc({ code: trimmedCode, description: description.trim() }));
  }

  public static retail(): Mcc {
    return new Mcc({ code: "5411", description: "Supermercados e Retalho Alimentar" });
  }

  public static dining(): Mcc {
    return new Mcc({ code: "5812", description: "Restaurantes e Refeições" });
  }

  public static services(): Mcc {
    return new Mcc({ code: "7299", description: "Serviços Gerais" });
  }
}
