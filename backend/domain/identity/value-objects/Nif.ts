import { ValueObject } from "../../shared/ValueObject";
import { Result } from "../../shared/Result";
import { Guard } from "../../shared/Guard";

interface NifProps {
  value: string;
}

export class Nif extends ValueObject<NifProps> {
  private constructor(props: NifProps) {
    super(props);
  }

  public get value(): string {
    return this.props.value;
  }

  /**
   * Validates if the NIF is syntactically valid under Angola rules.
   * - Enterprise NIF: Exactly 9 digits.
   * - Individual NIF (Bilhete de Identidade - BI): 14 characters total, containing 9 digits, followed by 2 letters, followed by 3 digits.
   */
  public static isValidAngolanNif(value: string): boolean {
    const cleanValue = value.replace(/\s+/g, "").toUpperCase();
    
    // Enterprise NIF (9 digits)
    const enterpriseRegex = /^\d{9}$/;
    if (enterpriseRegex.test(cleanValue)) {
      return true;
    }

    // Individual National ID / BI (9 digits + 2 letters + 3 digits = 14 characters)
    const individualRegex = /^\d{9}[A-Z]{2}\d{3}$/;
    if (individualRegex.test(cleanValue)) {
      return true;
    }

    return false;
  }

  public static create(value: string): Result<Nif> {
    const guardResult = Guard.againstNullOrUndefined(value, "NIF/BI value");
    if (!guardResult.succeeded) {
      return Result.fail<Nif>(guardResult.message!);
    }

    const trimmedValue = value.trim();
    if (!this.isValidAngolanNif(trimmedValue)) {
      return Result.fail<Nif>(
        `Número de Identificação Fiscal (NIF) ou Bilhete de Identidade (BI) angolano inválido: "${trimmedValue}". Deve conter exatamente 9 algarismos (Empresa) ou 14 caracteres no formato 9 dígitos + 2 letras + 3 dígitos (Cidadão).`
      );
    }

    return Result.ok<Nif>(new Nif({ value: trimmedValue.toUpperCase() }));
  }
}
