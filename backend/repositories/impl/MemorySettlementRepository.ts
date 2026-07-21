/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SettlementRepository } from '../SettlementRepository';
import { ReconciliationLog, BnaCustodyState } from '../../../src/types';

export class MemorySettlementRepository implements SettlementRepository {
  private static reconciliationLogs: ReconciliationLog[] = [
    {
      id: 'REC-001',
      timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
      cycleId: 'CYC-2026-07-06-01',
      totalInstructionsBalance: 475000,
      bnaCustodyBalance: 150000000,
      bfaReserveBalance: 100000000,
      baiReserveBalance: 100000000,
      bicReserveBalance: 50000000,
      totalCustodyReserves: 400000000,
      discrepancy: 399525000, // Backing is much higher, which is fully compliant (no-deposit deficit check)
      status: 'reconciled',
      complianceStatement: 'Em estrita obediência às Diretivas de Salvaguarda de Depósitos do BNA.',
      auditedBy: 'SGA BNA Automated Auditor',
      remarks: 'Concluído sem quaisquer anomalias regulatórias detetadas.',
    },
  ];

  private static custodyState: BnaCustodyState = {
    bnaCustodyBalance: 150000000,
    bfaReserveBalance: 100000000,
    baiReserveBalance: 100000000,
    bicReserveBalance: 50000000,
    totalCirculation: 475000,
    pendingSettlementsCount: 0,
    lastSptrMsgIso20022: '',
    isSettling: false,
    criticalVolumeThreshold: 50000000,
    criticalPendingLimit: 20,
    criticalCirculationThreshold: 1000000000,
    criticalLiquidityThreshold: 100,
    largeTxThreshold: 50000,
    fraudEnabled: true,
    fraudGeoVelocityLimit: 300,
    fraudTxFrequencyLimit: 5,
    fraudTxTimeWindow: 60,
    syncBatches: [],
  };

  public async saveReconciliationLog(log: ReconciliationLog): Promise<void> {
    MemorySettlementRepository.reconciliationLogs.unshift({ ...log });
  }

  public async getReconciliationLogs(): Promise<ReconciliationLog[]> {
    return [...MemorySettlementRepository.reconciliationLogs];
  }

  public async getCustodyState(): Promise<BnaCustodyState> {
    return { ...MemorySettlementRepository.custodyState };
  }

  public async saveCustodyState(state: BnaCustodyState): Promise<void> {
    MemorySettlementRepository.custodyState = { ...state };
  }
}
