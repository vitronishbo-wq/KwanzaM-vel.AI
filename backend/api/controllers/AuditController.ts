/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response } from 'express';
import { AuditTrailUseCase } from '../../application/usecases/AuditTrailUseCase';
import { Logger } from '../../shared/logger';

export class AuditController {
  private auditTrailUseCase = new AuditTrailUseCase();

  public getLogs = async (req: Request, res: Response): Promise<void> => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 100;
      const logs = await this.auditTrailUseCase.execute(limit);
      res.status(200).json(logs);
    } catch (err: any) {
      Logger.error('[AuditController] Falha ao carregar logs de segurança/auditoria.', { error: err.message });
      res.status(500).json({ error: 'Erro ao aceder ao arquivo frio de auditoria.', details: err.message });
    }
  };
}

export const auditController = new AuditController();
