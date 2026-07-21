import { ValueObject } from "../../shared/ValueObject";
import { Money } from "../../shared/Money";
import { PostingLineType } from "./PostingLineType";
import { Result } from "../../shared/Result";
import { Guard } from "../../shared/Guard";

interface PostingLineProps {
  accountCode: string; // e.g. "liabilities:wallets:123", "assets:custody:bfa"
  type: PostingLineType;
  amount: Money; // Must be positive; the DEBIT/CREDIT type dictates the sign context
}

export class PostingLine extends ValueObject<PostingLineProps> {
  private constructor(props: PostingLineProps) {
    super(props);
  }

  public get accountCode(): string {
    return this.props.accountCode;
  }

  public get type(): PostingLineType {
    return this.props.type;
  }

  public get amount(): Money {
    return this.props.amount;
  }

  public isDebit(): boolean {
    return this.props.type === PostingLineType.DEBIT;
  }

  public isCredit(): boolean {
    return this.props.type === PostingLineType.CREDIT;
  }

  public static create(accountCode: string, type: PostingLineType, amount: Money): Result<PostingLine> {
    const guardResult = Guard.combine([
      Guard.againstNullOrUndefined(accountCode, "accountCode"),
      Guard.againstNullOrUndefined(type, "type"),
      Guard.againstNullOrUndefined(amount, "amount"),
      Guard.againstAtLeast(3, accountCode, "accountCode"),
    ]);

    if (!guardResult.succeeded) {
      return Result.fail<PostingLine>(guardResult.message!);
    }

    if (!amount.isPositive()) {
      return Result.fail<PostingLine>(`Posting line amount must be greater than zero. Got: ${amount.format()}`);
    }

    return Result.ok<PostingLine>(
      new PostingLine({
        accountCode,
        type,
        amount,
      })
    );
  }

  public static debit(accountCode: string, amount: Money): Result<PostingLine> {
    return this.create(accountCode, PostingLineType.DEBIT, amount);
  }

  public static credit(accountCode: string, amount: Money): Result<PostingLine> {
    return this.create(accountCode, PostingLineType.CREDIT, amount);
  }
}
