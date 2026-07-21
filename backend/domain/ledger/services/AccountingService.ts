import { Result } from "../../shared/Result";
import { Money } from "../../shared/Money";
import { Posting } from "../entities/Posting";
import { PostingLine } from "../value-objects/PostingLine";
import { UniqueEntityId } from "../../shared/UniqueEntityId";

export class AccountingService {
  /**
   * Generates a standard P2P transfer journal posting.
   * Debits the sender's liability wallet and credits the receiver's liability wallet.
   *
   * @param senderOwnerId Unique ID of the sender
   * @param receiverOwnerId Unique ID of the receiver
   * @param amount Money to transfer
   * @param transactionId Reference to the higher-level P2P transfer ID
   */
  public createP2PTransferPosting(
    senderOwnerId: UniqueEntityId,
    receiverOwnerId: UniqueEntityId,
    amount: Money,
    transactionId: string
  ): Result<Posting> {
    const senderAccount = `liabilities:wallets:${senderOwnerId.toString()}`;
    const receiverAccount = `liabilities:wallets:${receiverOwnerId.toString()}`;

    // Create the balanced double-entry lines
    const debitLineResult = PostingLine.debit(senderAccount, amount);
    if (debitLineResult.isFailure) return Result.fail<Posting>(debitLineResult.error!);

    const creditLineResult = PostingLine.credit(receiverAccount, amount);
    if (creditLineResult.isFailure) return Result.fail<Posting>(creditLineResult.error!);

    return Posting.create({
      description: `Transferência P2P de ${senderOwnerId.toString()} para ${receiverOwnerId.toString()}`,
      lines: [debitLineResult.getValue(), creditLineResult.getValue()],
      createdAt: new Date(),
      externalReference: transactionId,
    });
  }

  /**
   * Generates a merchant payment journal posting with an integrated MDR commission split.
   * - Debits the customer's wallet liability.
   * - Credits the merchant's wallet liability (net amount).
   * - Credits the platform's revenue account (MDR fee amount).
   *
   * Invariant: Debit (Customer Wallet) === Net Credit (Merchant Net Net) + Credit (KwanzaMóvel MDR Revenue)
   */
  public createMerchantPaymentPosting(
    customerOwnerId: UniqueEntityId,
    merchantOwnerId: UniqueEntityId,
    totalAmount: Money,
    mdrFee: Money,
    transactionId: string
  ): Result<Posting> {
    const customerAccount = `liabilities:wallets:${customerOwnerId.toString()}`;
    const merchantAccount = `liabilities:merchants:${merchantOwnerId.toString()}`;
    const revenueAccount = "revenues:commissions:mdr";

    const netAmount = totalAmount.subtract(mdrFee);

    const lines: PostingLine[] = [];

    // 1. Debit the customer for the full purchase amount
    const customerDebitResult = PostingLine.debit(customerAccount, totalAmount);
    if (customerDebitResult.isFailure) return Result.fail<Posting>(customerDebitResult.error!);
    lines.push(customerDebitResult.getValue());

    // 2. Credit the merchant for the net amount
    if (netAmount.isPositive()) {
      const merchantCreditResult = PostingLine.credit(merchantAccount, netAmount);
      if (merchantCreditResult.isFailure) return Result.fail<Posting>(merchantCreditResult.error!);
      lines.push(merchantCreditResult.getValue());
    }

    // 3. Credit the platform revenue for the MDR fee
    if (mdrFee.isPositive()) {
      const revenueCreditResult = PostingLine.credit(revenueAccount, mdrFee);
      if (revenueCreditResult.isFailure) return Result.fail<Posting>(revenueCreditResult.error!);
      lines.push(revenueCreditResult.getValue());
    }

    return Posting.create({
      description: `Pagamento de Lojista: Cliente ${customerOwnerId.toString()} para Lojista ${merchantOwnerId.toString()}`,
      lines,
      createdAt: new Date(),
      externalReference: transactionId,
    });
  }

  /**
   * Generates a BNA safeguard reconciliation posting.
   * Debits BNA Custody Reserve (Asset) and credits Bank Custody account (Asset).
   */
  public createSafeguardLiquidationPosting(
    custodianBankCode: string,
    amount: Money,
    reconciliationId: string
  ): Result<Posting> {
    const custodyReserveAccount = "assets:custody:bna_reserve";
    const bankAccount = `assets:custody:${custodianBankCode.toLowerCase()}`;

    const debitResult = PostingLine.debit(custodyReserveAccount, amount);
    if (debitResult.isFailure) return Result.fail<Posting>(debitResult.error!);

    const creditResult = PostingLine.credit(bankAccount, amount);
    if (creditResult.isFailure) return Result.fail<Posting>(creditResult.error!);

    return Posting.create({
      description: `Liquidação de Salvaguarda BNA - Banco Custodiante: ${custodianBankCode.toUpperCase()}`,
      lines: [debitResult.getValue(), creditResult.getValue()],
      createdAt: new Date(),
      externalReference: reconciliationId,
    });
  }
}
