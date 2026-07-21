/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserRepository } from './UserRepository';
import { WalletRepository } from './WalletRepository';
import { MerchantRepository } from './MerchantRepository';
import { SettlementRepository } from './SettlementRepository';
import { AuditRepository } from './AuditRepository';

import { MemoryUserRepository } from './impl/MemoryUserRepository';
import { MemoryWalletRepository } from './impl/MemoryWalletRepository';
import { MemoryMerchantRepository } from './impl/MemoryMerchantRepository';
import { MemorySettlementRepository } from './impl/MemorySettlementRepository';
import { MemoryAuditRepository } from './impl/MemoryAuditRepository';

// In the future, once database is wired:
// import { PostgresUserRepository } from './impl/PostgresUserRepository';
// ...

class RepositoryRegistry {
  private static instance: RepositoryRegistry | null = null;

  private userRepo: UserRepository;
  private walletRepo: WalletRepository;
  private merchantRepo: MerchantRepository;
  private settlementRepo: SettlementRepository;
  private auditRepo: AuditRepository;

  private constructor() {
    const isDbEnabled = process.env.DB_ENABLED === 'true';

    // We default to Memory repositories for local development/architecture prototyping
    // This allows seamless swapping to PostgresRepository later by changing this check
    if (isDbEnabled) {
      // Setup Postgres implementations if they existed
      this.userRepo = new MemoryUserRepository();
      this.walletRepo = new MemoryWalletRepository();
      this.merchantRepo = new MemoryMerchantRepository();
      this.settlementRepo = new MemorySettlementRepository();
      this.auditRepo = new MemoryAuditRepository();
    } else {
      this.userRepo = new MemoryUserRepository();
      this.walletRepo = new MemoryWalletRepository();
      this.merchantRepo = new MemoryMerchantRepository();
      this.settlementRepo = new MemorySettlementRepository();
      this.auditRepo = new MemoryAuditRepository();
    }
  }

  public static getInstance(): RepositoryRegistry {
    if (!RepositoryRegistry.instance) {
      RepositoryRegistry.instance = new RepositoryRegistry();
    }
    return RepositoryRegistry.instance;
  }

  public getUserRepository(): UserRepository {
    return this.userRepo;
  }

  public getWalletRepository(): WalletRepository {
    return this.walletRepo;
  }

  public getMerchantRepository(): MerchantRepository {
    return this.merchantRepo;
  }

  public getSettlementRepository(): SettlementRepository {
    return this.settlementRepo;
  }

  public getAuditRepository(): AuditRepository {
    return this.auditRepo;
  }
}

export const registry = RepositoryRegistry.getInstance();
export const userRepository = registry.getUserRepository();
export const walletRepository = registry.getWalletRepository();
export const merchantRepository = registry.getMerchantRepository();
export const settlementRepository = registry.getSettlementRepository();
export const auditRepository = registry.getAuditRepository();
