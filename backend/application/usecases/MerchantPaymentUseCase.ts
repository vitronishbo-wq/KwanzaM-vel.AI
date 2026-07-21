/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { userRepository, walletRepository, merchantRepository, auditRepository } from '../../repositories/Registry';
import { Transaction, JournalEntry } from '../../../src/types';

export interface MerchantPaymentDTO {
  userPhone: string;
  merchantCode: string;
  amount: number;
  correlationId?: string;
  traceId?: string;
  requestId?: string;
  sessionId?: string;
  deviceUserAgent?: string;
}

export class MerchantPaymentUseCase {
  public async execute(dto: MerchantPaymentDTO): Promise<Transaction> {
    const { userPhone, merchantCode, amount } = dto;
    const start = Date.now();

    if (amount <= 0) {
      throw new Error('O valor do pagamento deve ser maior que zero.');
    }

    const user = await userRepository.findByPhone(userPhone);
    const merchant = await merchantRepository.findByCode(merchantCode);

    if (!user) {
      throw new Error(`Utilizador (${userPhone}) não registado.`);
    }
    if (!merchant) {
      throw new Error(`Comerciante com o código (${merchantCode}) não encontrado.`);
    }

    // Verify sufficient funds
    const userBalance = await walletRepository.getBalance(userPhone);
    if (userBalance < amount) {
      const errorMsg = `Saldo insuficiente para efetuar o pagamento. O seu saldo atual é de ${userBalance.toLocaleString()} Kz.`;
      
      const failedTx: Transaction = {
        id: 'TX-' + Math.random().toString(36).substring(2, 11).toUpperCase(),
        senderPhone: userPhone,
        receiverPhone: merchantCode,
        amount,
        type: 'pagamento',
        status: 'blocked_aml',
        timestamp: new Date().toISOString(),
        latencyMs: Date.now() - start,
        fraudScore: 20,
        securityLog: ['Payment failed due to insufficient funds.'],
        failReason: errorMsg,
        correlationId: dto.correlationId,
        traceId: dto.traceId,
        requestId: dto.requestId,
        sessionId: dto.sessionId,
        deviceUserAgent: dto.deviceUserAgent,
      };

      await walletRepository.saveTransaction(failedTx);
      throw new Error(errorMsg);
    }

    // Process payment
    const newUserBalance = userBalance - amount;
    await walletRepository.updateBalance(userPhone, newUserBalance);
    await merchantRepository.updateBalance(merchantCode, amount);

    // Update Domain user state balance cache
    user.balance = newUserBalance;
    await userRepository.save(user);

    // Create completed Transaction log
    const txId = 'TX-' + Math.random().toString(36).substring(2, 11).toUpperCase();
    const completedTx: Transaction = {
      id: txId,
      senderPhone: userPhone,
      receiverPhone: merchantCode,
      amount,
      type: 'pagamento',
      status: 'completed',
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - start,
      fraudScore: 2,
      securityLog: [
        'Código de comerciante validado no sistema.',
        'Pagamento comercial deduzido com sucesso.',
      ],
      correlationId: dto.correlationId,
      traceId: dto.traceId,
      requestId: dto.requestId,
      sessionId: dto.sessionId,
      deviceUserAgent: dto.deviceUserAgent,
    };

    await walletRepository.saveTransaction(completedTx);

    // Double-Entry Bookkeeping
    const journalEntryId = 'JE-' + Math.random().toString(36).substring(2, 11).toUpperCase();
    const journalEntry: JournalEntry = {
      id: journalEntryId,
      txId,
      timestamp: completedTx.timestamp,
      description: `Pagamento ao Comerciante ${merchant.name}`,
      debitAccount: `Wallet ${user.name} (Ativo - Passivo Interno)`,
      creditAccount: `Merchant Account ${merchant.name} (Comercial)`,
      amount,
    };

    await walletRepository.saveJournalEntry(journalEntry);

    // Audit Log
    await auditRepository.saveAuditLog({
      id: 'AUD-' + Math.random().toString(36).substring(2, 11).toUpperCase(),
      timestamp: completedTx.timestamp,
      action: 'MERCHANT_PAYMENT',
      component: 'FinancialEngine',
      details: { txId, userPhone, merchantCode, amount, userBalanceAfter: newUserBalance },
      userId: userPhone,
      correlationId: dto.correlationId,
    });

    return completedTx;
  }
}
