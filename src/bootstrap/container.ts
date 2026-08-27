/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WalletRepository } from "../domain/repository/WalletRepository";
import { LedgerRepository } from "../domain/repository/LedgerRepository";
import { ReceiptRepository } from "../domain/repository/ReceiptRepository";
import { EvidenceRepository } from "../domain/repository/EvidenceRepository";
import { SettlementRepository } from "../domain/repository/SettlementRepository";
import { OutboxRepository } from "../domain/repository/OutboxRepository";
import { IdempotencyRepository } from "../domain/repository/IdempotencyRepository";
import { IBnaSptrDriver } from "../domain/regulatory/IBnaSptrDriver";
import { SignatureProvider } from "../domain/security/SignatureProvider";

import { IndexedDbWalletRepository } from "../infrastructure/adapters/repository/IndexedDbWalletRepository";
import { LocalStorageLedgerRepository } from "../infrastructure/adapters/repository/LocalStorageLedgerRepository";
import { PostgresLedgerRepository } from "../infrastructure/persistence/PostgresLedgerRepository";
import { FirestoreLedgerRepository } from "../infrastructure/adapters/database/FirestoreLedgerRepository";
import { LocalStorageReceiptRepository } from "../infrastructure/adapters/repository/LocalStorageReceiptRepository";
import { LocalStorageEvidenceRepository } from "../infrastructure/adapters/repository/LocalStorageEvidenceRepository";
import { LocalStorageSettlementRepository } from "../infrastructure/adapters/repository/LocalStorageSettlementRepository";
import { LocalStorageOutboxRepository } from "../infrastructure/adapters/repository/LocalStorageOutboxRepository";
import { IdempotencyStore } from "../infrastructure/persistence/IdempotencyStore";
import { SimulatedBnaSptrDriver } from "../infrastructure/adapters/regulatory/SimulatedBnaSptrDriver";
import { SignatureProviderFactory } from "../infrastructure/adapters/hsm/SignatureProviderFactory";
import { ReceiptSignature } from "../domain/evidence/ReceiptEngine";

import { OutboxProcessor } from "../infrastructure/outbox/OutboxProcessor";
import { TransactionManager } from "../domain/transaction/TransactionManager";
import { EventBus } from "../domain/events/EventBus";
import { chaosUtility } from "../infrastructure/testing/ChaosTestingUtility";
import { LedgerRepositoryChaosDecorator, EventBusChaosDecorator } from "../infrastructure/testing/chaos-engine";

/**
 * KMOS Dependency Injection Container
 * 
 * Centraliza e resolve o grafo de dependências da infraestrutura e do domínio,
 * seguindo os preceitos de Arquitetura Hexagonal.
 */
export class DIContainer {
  private static instance: DIContainer | null = null;

  public readonly walletRepository: WalletRepository;
  public readonly ledgerRepository: LedgerRepository;
  public readonly receiptRepository: ReceiptRepository;
  public readonly evidenceRepository: EvidenceRepository;
  public readonly settlementRepository: SettlementRepository;
  public readonly outboxRepository: OutboxRepository;
  public readonly idempotencyRepository: IdempotencyRepository;
  public readonly signatureProvider: SignatureProvider;
  public readonly bnaSptrDriver: IBnaSptrDriver;
  public readonly transactionManager: TransactionManager;
  public readonly eventBus: EventBus;

  private constructor() {
    // 1. Inicializa Provedor Criptográfico de Assinatura (Ports & Adapters)
    this.signatureProvider = SignatureProviderFactory.create();
    ReceiptSignature.injectSigner(this.signatureProvider);

    // 2. Inicializa Adaptadores Concretos
    const usePostgres = (typeof localStorage !== "undefined" && localStorage.getItem("kmos_use_postgres") === "true") ||
                        (typeof window !== "undefined" && (window as any).kmos_use_postgres === true);
    const useFirestore = (typeof localStorage !== "undefined" && localStorage.getItem("kmos_use_firestore") === "true") ||
                         Boolean(process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID);

    this.walletRepository = new IndexedDbWalletRepository();
    const baseLedgerRepository = useFirestore
      ? new FirestoreLedgerRepository()
      : (usePostgres ? new PostgresLedgerRepository() : new LocalStorageLedgerRepository());
    this.ledgerRepository = new LedgerRepositoryChaosDecorator(baseLedgerRepository);
    this.receiptRepository = new LocalStorageReceiptRepository();
    this.evidenceRepository = new LocalStorageEvidenceRepository();
    this.settlementRepository = new LocalStorageSettlementRepository();
    this.outboxRepository = new LocalStorageOutboxRepository();
    this.idempotencyRepository = new IdempotencyStore();
    this.bnaSptrDriver = new SimulatedBnaSptrDriver(this.signatureProvider);

    // 3. Inicializa Gestores de Domínio e Processadores
    const outboxProcessor = new OutboxProcessor(this.outboxRepository, EventBus.getInstance());
    this.transactionManager = new TransactionManager(
      this.walletRepository,
      this.ledgerRepository,
      this.settlementRepository,
      this.receiptRepository,
      this.evidenceRepository,
      this.outboxRepository,
      this.idempotencyRepository,
      outboxProcessor
    );

    // 3. Inicializa Barramento de Eventos
    this.eventBus = EventBus.getInstance();
    const eventBusDecorator = new EventBusChaosDecorator(this.eventBus);
    eventBusDecorator.decorate();
  }

  public static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }
}

// Exporta o container global para fácil acesso pelas camadas de aplicação e UI
export const container = DIContainer.getInstance();
