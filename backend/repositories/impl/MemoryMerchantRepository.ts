/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MerchantRepository } from '../MerchantRepository';
import { MerchantAggregate } from '../../../src/types';

export class MemoryMerchantRepository implements MerchantRepository {
  private static merchants = new Map<string, MerchantAggregate>([
    [
      'MC-UNITEL',
      {
        code: 'MC-UNITEL',
        name: 'Unitel Angola (Recargas)',
        balance: 10000000,
        type: 'Telecomunicações',
      },
    ],
    [
      'MC-ENDE',
      {
        code: 'MC-ENDE',
        name: 'ENDE (Eletricidade)',
        balance: 5000000,
        type: 'Serviços Públicos',
      },
    ],
    [
      'MC-EPAL',
      {
        code: 'MC-EPAL',
        name: 'EPAL (Água)',
        balance: 2000000,
        type: 'Serviços Públicos',
      },
    ],
    [
      'MC-KERO',
      {
        code: 'MC-KERO',
        name: 'Hipermercado Kero Kilamba',
        balance: 12000000,
        type: 'Supermercado',
      },
    ],
  ]);

  public async findByCode(code: string): Promise<MerchantAggregate | null> {
    const merchant = MemoryMerchantRepository.merchants.get(code);
    return merchant ? { ...merchant } : null;
  }

  public async save(merchant: MerchantAggregate): Promise<void> {
    MemoryMerchantRepository.merchants.set(merchant.code, { ...merchant });
  }

  public async listAll(): Promise<MerchantAggregate[]> {
    return Array.from(MemoryMerchantRepository.merchants.values()).map((m) => ({ ...m }));
  }

  public async updateBalance(code: string, amount: number): Promise<void> {
    const merchant = MemoryMerchantRepository.merchants.get(code);
    if (merchant) {
      merchant.balance += amount;
      MemoryMerchantRepository.merchants.set(code, merchant);
    }
  }
}
