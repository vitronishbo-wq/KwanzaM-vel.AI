/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response } from 'express';
import { GetWalletUseCase } from '../../application/usecases/GetWalletUseCase';
import { RegisterUserUseCase } from '../../application/usecases/RegisterUserUseCase';
import { TransferUseCase } from '../../application/usecases/TransferUseCase';
import { MerchantPaymentUseCase } from '../../application/usecases/MerchantPaymentUseCase';
import { GetLedgerUseCase } from '../../application/usecases/GetLedgerUseCase';
import { walletRepository } from '../../repositories/Registry';
import { Logger } from '../../shared/logger';

export class WalletController {
  private getWalletUseCase = new GetWalletUseCase();
  private registerUserUseCase = new RegisterUserUseCase();
  private transferUseCase = new TransferUseCase();
  private merchantPaymentUseCase = new MerchantPaymentUseCase();
  private getLedgerUseCase = new GetLedgerUseCase();

  public getWallet = async (req: Request, res: Response): Promise<void> => {
    try {
      const { phone } = req.params;
      const wallet = await this.getWalletUseCase.execute(phone);

      if (!wallet) {
        res.status(404).json({ error: 'Carteira não encontrada.' });
        return;
      }

      res.status(200).json(wallet);
    } catch (err: any) {
      Logger.error('[WalletController] Falha ao ler carteira.', { error: err.message });
      res.status(500).json({ error: 'Erro ao processar consulta de carteira.', details: err.message });
    }
  };

  public registerWallet = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.registerUserUseCase.execute(req.body);
      res.status(201).json({ message: 'Registo ou atualização de carteira concluído com sucesso.' });
    } catch (err: any) {
      Logger.error('[WalletController] Falha ao registar/atualizar carteira.', { error: err.message });
      res.status(400).json({ error: 'Erro de validação ou processamento.', details: err.message });
    }
  };

  public transfer = async (req: Request, res: Response): Promise<void> => {
    try {
      const tx = await this.transferUseCase.execute({
        senderPhone: req.body.senderPhone,
        receiverPhone: req.body.receiverPhone,
        amount: Number(req.body.amount),
        correlationId: (req as any).correlationId,
        traceId: (req as any).traceId,
        requestId: (req as any).requestId,
        sessionId: req.body.sessionId,
        deviceUserAgent: req.headers['user-agent'],
      });

      res.status(200).json({
        message: 'Transferência concluída com sucesso (Liquidação Síncrona).',
        transaction: tx,
      });
    } catch (err: any) {
      Logger.error('[WalletController] Erro crítico ao processar transferência financeira.', { error: err.message });
      res.status(400).json({ error: 'Falha na transferência.', message: err.message });
    }
  };

  public pay = async (req: Request, res: Response): Promise<void> => {
    try {
      const tx = await this.merchantPaymentUseCase.execute({
        userPhone: req.body.userPhone,
        merchantCode: req.body.merchantCode,
        amount: Number(req.body.amount),
        correlationId: (req as any).correlationId,
        traceId: (req as any).traceId,
        requestId: (req as any).requestId,
        sessionId: req.body.sessionId,
        deviceUserAgent: req.headers['user-agent'],
      });

      res.status(200).json({
        message: 'Pagamento ao comerciante efetuado com sucesso.',
        transaction: tx,
      });
    } catch (err: any) {
      Logger.error('[WalletController] Erro ao processar pagamento de comerciante.', { error: err.message });
      res.status(400).json({ error: 'Falha no pagamento.', message: err.message });
    }
  };

  public getLedger = async (req: Request, res: Response): Promise<void> => {
    try {
      const ledger = await this.getLedgerUseCase.execute();
      res.status(200).json(ledger);
    } catch (err: any) {
      Logger.error('[WalletController] Falha ao ler partidas dobradas e contas T.', { error: err.message });
      res.status(500).json({ error: 'Erro ao processar livro-razão.', details: err.message });
    }
  };

  public getTransactions = async (req: Request, res: Response): Promise<void> => {
    try {
      const { phone } = req.params;
      const limit = req.query.limit ? Number(req.query.limit) : 50;
      const transactions = await walletRepository.getTransactions(phone, limit);
      res.status(200).json(transactions);
    } catch (err: any) {
      Logger.error('[WalletController] Falha ao obter histórico operacional de transações.', { error: err.message });
      res.status(500).json({ error: 'Erro ao consultar histórico transacional.', details: err.message });
    }
  };
}

export const walletController = new WalletController();
