/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { userRepository } from '../../repositories/Registry';
import { UserAccount } from '../../../src/types';

export class GetWalletUseCase {
  public async execute(phone: string): Promise<UserAccount | null> {
    if (!phone) {
      throw new Error('Número de telemóvel inválido ou vazio.');
    }
    return userRepository.findByPhone(phone);
  }
}
