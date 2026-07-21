/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response } from 'express';
import { ReconciliationUseCase } from '../../application/usecases/ReconciliationUseCase';
import { settlementRepository } from '../../repositories/Registry';
import { Logger } from '../../shared/logger';

export class SettlementController {
  private reconciliationUseCase = new ReconciliationUseCase();

  public getCustody = async (req: Request, res: Response): Promise<void> => {
    try {
      const state = await settlementRepository.getCustodyState();
      res.status(200).json(state);
    } catch (err: any) {
      Logger.error('[SettlementController] Falha ao ler estado de custódia e limites.', { error: err.message });
      res.status(500).json({ error: 'Erro de infraestrutura ao carregar custódia.', details: err.message });
    }
  };

  public saveCustody = async (req: Request, res: Response): Promise<void> => {
    try {
      await settlementRepository.saveCustodyState(req.body);
      res.status(200).json({ message: 'Definições de custódia e regras de liquidação salvas.' });
    } catch (err: any) {
      Logger.error('[SettlementController] Erro ao gravar definições de custódia.', { error: err.message });
      res.status(400).json({ error: 'Falha ao salvar definições de custódia.', details: err.message });
    }
  };

  public reconcile = async (req: Request, res: Response): Promise<void> => {
    try {
      const auditor = req.body.auditedBy || 'SGA BNA Automated Auditor';
      const log = await this.reconciliationUseCase.execute(auditor);
      res.status(200).json({
        message: 'Ciclo de conciliação diário executado com sucesso.',
        reconciliationLog: log,
      });
    } catch (err: any) {
      Logger.error('[SettlementController] Erro na reconciliação e custódia do regulador.', { error: err.message });
      res.status(500).json({ error: 'Erro no motor de conciliação.', details: err.message });
    }
  };

  public getReconciliationLogs = async (req: Request, res: Response): Promise<void> => {
    try {
      const logs = await settlementRepository.getReconciliationLogs();
      res.status(200).json(logs);
    } catch (err: any) {
      Logger.error('[SettlementController] Falha ao carregar logs de conciliação do BNA.', { error: err.message });
      res.status(500).json({ error: 'Erro ao listar histórico de reconciliação.', details: err.message });
    }
  };
}

export const settlementController = new SettlementController();
