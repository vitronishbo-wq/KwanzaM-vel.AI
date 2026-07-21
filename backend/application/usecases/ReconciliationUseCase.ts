/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { userRepository, settlementRepository, auditRepository } from '../../repositories/Registry';
import { ReconciliationLog } from '../../../src/types';

export class ReconciliationUseCase {
  public async execute(auditorName: string = 'SGA BNA Automated Auditor'): Promise<ReconciliationLog> {
    const start = Date.now();

    // 1. Calculate sum of all user balances (Total Circulation)
    const users = await userRepository.listAll();
    const totalCirculation = users.reduce((sum, u) => sum + u.balance, 0);

    // 2. Load custody backing reserves from settlementRepository
    const custodyState = await settlementRepository.getCustodyState();

    const backingTotal =
      custodyState.bnaCustodyBalance +
      custodyState.bfaReserveBalance +
      custodyState.baiReserveBalance +
      custodyState.bicReserveBalance;

    const discrepancy = backingTotal - totalCirculation;
    const isHealthy = discrepancy >= 0;

    // 3. Create Reconciliation Log
    const cycleId = 'CYC-' + new Date().toISOString().substring(0, 10) + '-' + Math.random().toString(36).substring(2, 5).toUpperCase();
    const logId = 'REC-' + Math.random().toString(36).substring(2, 11).toUpperCase();

    const log: ReconciliationLog = {
      id: logId,
      timestamp: new Date().toISOString(),
      cycleId,
      totalInstructionsBalance: totalCirculation,
      bnaCustodyBalance: custodyState.bnaCustodyBalance,
      bfaReserveBalance: custodyState.bfaReserveBalance,
      baiReserveBalance: custodyState.baiReserveBalance,
      bicReserveBalance: custodyState.bicReserveBalance,
      totalCustodyReserves: backingTotal,
      discrepancy,
      status: isHealthy ? 'reconciled' : 'discrepancy_alert',
      complianceStatement: isHealthy
        ? 'CONFORME: Todos os fundos de reserva cobrem 100% do passivo emitido em circulação digital.'
        : 'ALERTA: Divergência detetada. O saldo de custódia e reservas é inferior ao passivo em circulação.',
      auditedBy: auditorName,
      remarks: `Auditoria de compensação concluída em ${Date.now() - start}ms. Total de utilizadores verificados: ${users.length}.`,
    };

    // Save log
    await settlementRepository.saveReconciliationLog(log);

    // Sync custody state circulation
    custodyState.totalCirculation = totalCirculation;
    await settlementRepository.saveCustodyState(custodyState);

    // Log in Audit Trail
    await auditRepository.saveAuditLog({
      id: 'AUD-' + Math.random().toString(36).substring(2, 11).toUpperCase(),
      timestamp: log.timestamp,
      action: 'RECONCILIATION_RUN',
      component: 'SettlementEngine',
      details: { logId, cycleId, totalCirculation, backingTotal, discrepancy, status: log.status },
      userId: 'system',
    });

    return log;
  }
}
