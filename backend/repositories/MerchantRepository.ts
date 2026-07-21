/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MerchantAggregate } from '../../src/types';

export interface MerchantRepository {
  findByCode(code: string): Promise<MerchantAggregate | null>;
  save(merchant: MerchantAggregate): Promise<void>;
  listAll(): Promise<MerchantAggregate[]>;
  updateBalance(code: string, amount: number): Promise<void>;
}
