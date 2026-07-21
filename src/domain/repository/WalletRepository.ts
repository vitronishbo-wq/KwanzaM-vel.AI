/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserAccount } from "../../types";

/**
 * Port: WalletRepository
 * 
 * Contrato abstrato para a persistência e recuperação de carteiras e contas de utilizador.
 */
export interface WalletRepository {
  findByPhone(phone: string): Promise<UserAccount | null>;
  save(wallet: UserAccount): Promise<void>;
  getAll(): Promise<UserAccount[]>;
}
