/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { walletRepository } from '../../repositories/Registry';
import { JournalEntry, TAccount } from '../../../src/types';

export interface LedgerSummaryDTO {
  journalEntries: JournalEntry[];
  tAccounts: TAccount[];
}

export class GetLedgerUseCase {
  public async execute(): Promise<LedgerSummaryDTO> {
    const journalEntries = await walletRepository.getJournalEntries();
    const tAccounts = await walletRepository.getTAccounts();

    return {
      journalEntries,
      tAccounts,
    };
  }
}
