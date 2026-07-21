/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { userRepository, walletRepository } from '../../repositories/Registry';
import { UserAccount } from '../../../src/types';

export class RegisterUserUseCase {
  public async execute(user: UserAccount): Promise<void> {
    if (!user || !user.phone || !user.name) {
      throw new Error('Dados de utilizador incompletos para registo.');
    }

    const existing = await userRepository.findByPhone(user.phone);
    if (!existing) {
      // Set default balances/registration state
      user.isRegistered = true;
      user.balance = user.balance ?? 0;
      await userRepository.save(user);
      await walletRepository.updateBalance(user.phone, user.balance);
    } else {
      // Update existing details, preserve balance if not specified
      const updatedUser = {
        ...existing,
        ...user,
        balance: user.balance !== undefined ? user.balance : existing.balance,
      };
      await userRepository.save(updatedUser);
      if (user.balance !== undefined) {
        await walletRepository.updateBalance(user.phone, user.balance);
      }
    }
  }
}
