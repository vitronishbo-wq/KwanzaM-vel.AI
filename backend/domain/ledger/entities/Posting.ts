import { AggregateRoot } from "../../shared/AggregateRoot";
import { UniqueEntityId } from "../../shared/UniqueEntityId";
import { Money } from "../../shared/Money";
import { PostingLine } from "../value-objects/PostingLine";
import { Result } from "../../shared/Result";
import { Guard } from "../../shared/Guard";
import { LedgerPostedEvent } from "../events/LedgerEvents";

export interface PostingProps {
  description: string;
  lines: PostingLine[];
  createdAt: Date;
  externalReference?: string; // e.g. transactionId, settlementBlockId
}

export class Posting extends AggregateRoot<PostingProps> {
  private constructor(props: PostingProps, id?: UniqueEntityId) {
    super(props, id);
  }

  public get description(): string {
    return this.props.description;
  }

  public get lines(): PostingLine[] {
    return [...this.props.lines];
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get externalReference(): string | undefined {
    return this.props.externalReference;
  }

  /**
   * Helper method to calculate the sum of all debits
   */
  public totalDebits(): Money {
    const debitLines = this.props.lines.filter((l) => l.isDebit());
    if (debitLines.length === 0) return Money.zero();
    
    let total = Money.zero(debitLines[0].amount.currency);
    for (const line of debitLines) {
      total = total.add(line.amount);
    }
    return total;
  }

  /**
   * Helper method to calculate the sum of all credits
   */
  public totalCredits(): Money {
    const creditLines = this.props.lines.filter((l) => l.isCredit());
    if (creditLines.length === 0) return Money.zero();

    let total = Money.zero(creditLines[0].amount.currency);
    for (const line of creditLines) {
      total = total.add(line.amount);
    }
    return total;
  }

  /**
   * Validates if the posting lines maintain perfect double-entry equilibrium:
   * Σ Debit === Σ Credit
   */
  public isBalanced(): boolean {
    const debits = this.totalDebits();
    const credits = this.totalCredits();
    return debits.equals(credits);
  }

  /**
   * Factory method to create a valid transaction Posting
   */
  public static create(props: PostingProps, id?: UniqueEntityId): Result<Posting> {
    const guardResult = Guard.combine([
      Guard.againstNullOrUndefined(props.description, "description"),
      Guard.againstNullOrUndefined(props.lines, "lines"),
      Guard.againstNullOrUndefined(props.createdAt, "createdAt"),
    ]);

    if (!guardResult.succeeded) {
      return Result.fail<Posting>(guardResult.message!);
    }

    if (props.lines.length < 2) {
      return Result.fail<Posting>("A valid Double-Entry Posting must contain at least two posting lines.");
    }

    // Ensure all lines have the same currency to allow proper balancing
    const firstCurrency = props.lines[0].amount.currency;
    for (const line of props.lines) {
      if (!line.amount.currency.equals(firstCurrency)) {
        return Result.fail<Posting>(
          `Multi-currency postings are not supported in the core ledger. Discrepancy found: ${firstCurrency.code} vs ${line.amount.currency.code}`
        );
      }
    }

    const postingId = id || new UniqueEntityId();
    const posting = new Posting(props, postingId);

    // Enforce the fundamental rule: Σ Debit == Σ Credit
    if (!posting.isBalanced()) {
      const debits = posting.totalDebits().format();
      const credits = posting.totalCredits().format();
      return Result.fail<Posting>(
        `Accounting Equation Violation (Σ Debit == Σ Credit): Total Debits (${debits}) must equal Total Credits (${credits}) in a Double-Entry system.`
      );
    }

    const isNew = !id;
    if (isNew) {
      posting.addDomainEvent(new LedgerPostedEvent(postingId, posting.totalDebits(), props.description));
    }

    return Result.ok<Posting>(posting);
  }
}
