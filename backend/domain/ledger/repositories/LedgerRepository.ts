import { Result } from "../../shared/Result";
import { UniqueEntityId } from "../../shared/UniqueEntityId";
import { Posting } from "../entities/Posting";
import { Money } from "../../shared/Money";

export interface LedgerRepository {
  /**
   * Saves an atomic, balanced Double-Entry Posting to the ledger.
   * This is an insert-only operation.
   */
  save(posting: Posting): Promise<Result<void>>;

  /**
   * Retrieves a specific Posting by its Unique Entity ID
   */
  findById(id: UniqueEntityId): Promise<Result<Posting>>;

  /**
   * Retrieves postings containing a specific external reference
   */
  findByReference(reference: string): Promise<Result<Posting[]>>;

  /**
   * Calculates the current balance of a specific account by summing up all its debit and credit posting lines.
   * Accounts can have typical debit balances (Assets, Expenses) or credit balances (Liabilities, Equity, Revenues).
   */
  getAccountBalance(accountCode: string): Promise<Result<Money>>;

  /**
   * Retrieves all historical postings for auditability and report generation
   */
  getAllPostings(): Promise<Result<Posting[]>>;
}
