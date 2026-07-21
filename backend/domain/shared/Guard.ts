export interface IGuardResult {
  succeeded: boolean;
  message?: string;
}

export interface IGuardArgument {
  argument: any;
  argumentName: string;
}

export type GuardArgumentCollection = IGuardArgument[];

export class Guard {
  public static combine(guardResults: IGuardResult[]): IGuardResult {
    for (const result of guardResults) {
      if (!result.succeeded) return result;
    }
    return { succeeded: true };
  }

  public static againstNullOrUndefined(argument: any, argumentName: string): IGuardResult {
    if (argument === null || argument === undefined) {
      return { succeeded: false, message: `${argumentName} is null or undefined` };
    }
    return { succeeded: true };
  }

  public static againstNullOrUndefinedBulk(args: GuardArgumentCollection): IGuardResult {
    for (const arg of args) {
      const result = this.againstNullOrUndefined(arg.argument, arg.argumentName);
      if (!result.succeeded) return result;
    }
    return { succeeded: true };
  }

  public static isOneOf(value: any, validValues: any[], argumentName: string): IGuardResult {
    for (const validValue of validValues) {
      if (value === validValue) {
        return { succeeded: true };
      }
    }
    return {
      succeeded: false,
      message: `${argumentName} is not one of the valid values: ${JSON.stringify(validValues)}. Got: ${value}`,
    };
  }

  public static againstAtLeast(numChars: number, text: string, argumentName: string): IGuardResult {
    if (text.length >= numChars) {
      return { succeeded: true };
    }
    return {
      succeeded: false,
      message: `${argumentName} must have at least ${numChars} characters.`,
    };
  }

  public static againstAtMost(numChars: number, text: string, argumentName: string): IGuardResult {
    if (text.length <= numChars) {
      return { succeeded: true };
    }
    return {
      succeeded: false,
      message: `${argumentName} must have at most ${numChars} characters.`,
    };
  }

  public static againstNegativeOrZero(num: number, argumentName: string): IGuardResult {
    if (num <= 0) {
      return { succeeded: false, message: `${argumentName} must be greater than zero. Got: ${num}` };
    }
    return { succeeded: true };
  }

  public static againstNegative(num: number, argumentName: string): IGuardResult {
    if (num < 0) {
      return { succeeded: false, message: `${argumentName} cannot be negative. Got: ${num}` };
    }
    return { succeeded: true };
  }
}
