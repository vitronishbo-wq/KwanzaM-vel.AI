/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserRepository } from '../UserRepository';
import { UserAccount } from '../../../src/types';

export class MemoryUserRepository implements UserRepository {
  private static users = new Map<string, UserAccount>([
    [
      '+244923000111',
      {
        phone: '+244923000111',
        name: 'Manuel da Silva',
        biNumber: '00593845LA042',
        balance: 25000,
        tier: 'Level-1',
        pinHash: '1234',
        deviceId: 'device_ang_mx952',
        isRegistered: true,
        shortCode: 'KM-4831',
        recoveryConfig: {
          emailRecovery: 'manuel.silva@netangola.ao',
          backupCodesCreated: true,
          backupCodesCount: 8,
          biometricActive: true,
          trustedAgentOverride: true,
        },
      },
    ],
    [
      '+244931999222',
      {
        phone: '+244931999222',
        name: 'Agostinho Neto',
        biNumber: '00123456LA071',
        balance: 450000,
        tier: 'Level-3',
        pinHash: '4321',
        deviceId: 'device_ang_ag883',
        isRegistered: true,
        shortCode: 'KM-9922',
        recoveryConfig: {
          emailRecovery: 'agostinho.neto@kwanza.ao',
          backupCodesCreated: true,
          backupCodesCount: 12,
          biometricActive: true,
          trustedAgentOverride: true,
        },
      },
    ],
  ]);

  public async findByPhone(phone: string): Promise<UserAccount | null> {
    const user = MemoryUserRepository.users.get(phone);
    return user ? { ...user } : null;
  }

  public async save(user: UserAccount): Promise<void> {
    MemoryUserRepository.users.set(user.phone, { ...user });
  }

  public async updateTier(phone: string, tier: 'Level-1' | 'Level-2' | 'Level-3'): Promise<void> {
    const user = MemoryUserRepository.users.get(phone);
    if (user) {
      user.tier = tier;
      MemoryUserRepository.users.set(phone, user);
    }
  }

  public async delete(phone: string): Promise<void> {
    MemoryUserRepository.users.delete(phone);
  }

  public async listAll(): Promise<UserAccount[]> {
    return Array.from(MemoryUserRepository.users.values()).map((u) => ({ ...u }));
  }
}
