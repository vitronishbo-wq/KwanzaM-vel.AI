/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserAccount } from '../../src/types';

export interface UserRepository {
  findByPhone(phone: string): Promise<UserAccount | null>;
  save(user: UserAccount): Promise<void>;
  updateTier(phone: string, tier: 'Level-1' | 'Level-2' | 'Level-3'): Promise<void>;
  delete(phone: string): Promise<void>;
  listAll(): Promise<UserAccount[]>;
}
