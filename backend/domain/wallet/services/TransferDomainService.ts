import { Result } from "../../shared/Result";
import { Wallet } from "../entities/Wallet";
import { Money } from "../../shared/Money";

export class TransferDomainService {
  /**
   * Coordinates a financial transfer between a sender wallet and a receiver wallet.
   * This domain service ensures that both balances are updated atomically and in compliance 
   * with daily spending limits and wallet states.
   *
   * @param sender The wallet sending the funds
   * @param receiver The wallet receiving the funds
   * @param amount The financial amount to transfer (Money Value Object)
   * @param senderDailySpentToday Money representing how much the sender has already transacted today
   */
  public executeTransfer(
    sender: Wallet,
    receiver: Wallet,
    amount: Money,
    senderDailySpentToday: Money
  ): Result<void> {
    // 1. Ensure wallets are distinct
    if (sender.id.equals(receiver.id)) {
      return Result.fail<void>("Não é permitido efetuar transferências para a própria carteira.");
    }

    // 2. Validate if sender can transfer this amount (includes balance and daily limit validations)
    const canSenderTransfer = sender.canTransfer(amount, senderDailySpentToday);
    if (canSenderTransfer.isFailure) {
      return Result.fail<void>(canSenderTransfer.error!);
    }

    // 3. Validate receiver wallet state (cannot receive funds if frozen or suspended)
    if (!receiver.status.isActive()) {
      return Result.fail<void>(
        `Transferência recusada. A carteira de destino não está ativa (Status: ${receiver.status.value}).`
      );
    }

    // 4. Perform the debit from sender
    const withdrawResult = sender.withdraw(amount);
    if (withdrawResult.isFailure) {
      return Result.fail<void>(withdrawResult.error!);
    }

    // 5. Perform the credit to receiver
    const depositResult = receiver.deposit(amount);
    if (depositResult.isFailure) {
      // Revert the withdraw from sender (Rollback)
      sender.deposit(amount);
      return Result.fail<void>(`Falha ao depositar na carteira de destino: ${depositResult.error}`);
    }

    return Result.ok<void>();
  }
}
