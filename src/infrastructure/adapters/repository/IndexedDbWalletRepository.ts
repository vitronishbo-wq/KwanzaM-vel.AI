/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WalletRepository } from "../../../domain/repository/WalletRepository";
import { UserAccount } from "../../../types";
import { getUserAccount, saveUserAccount, initDB } from "../../../indexedDB";

/**
 * Adaptador de persistência para as carteiras de utilizador utilizando IndexedDB.
 */
export class IndexedDbWalletRepository implements WalletRepository {
  public async findByPhone(phone: string): Promise<UserAccount | null> {
    return getUserAccount(phone);
  }

  public async save(wallet: UserAccount): Promise<void> {
    await saveUserAccount(wallet);
  }

  public async getAll(): Promise<UserAccount[]> {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("user", "readonly");
      const store = transaction.objectStore("user");
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }
}
