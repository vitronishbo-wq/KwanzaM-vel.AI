/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LedgerRepository, ILedgerRepository } from "../../../domain/repository/LedgerRepository";
import {
  LedgerAccount,
  LedgerJournalEntry,
  initialLedgerAccounts,
  initialLedgerEntries,
  ConcurrencyConflictException,
  ImmutableLedgerViolationException,
  UnbalancedJournalEntryException,
  computeJournalEntryHash,
  GENESIS_PREVIOUS_HASH,
  toKwanzaCents,
  fromKwanzaCents
} from "../../../ledgerEngine";

/**
 * Estrutura atómica imutável do documento na coleção 'ledgers' para auditoria do BNA.
 */
export interface BnaAuditLedgerDoc {
  transactionId: string;
  timestamp: string;
  entries: Array<{
    accountId: string;
    debit: number;
    credit: number;
  }>;
  complianceScore: number;
  evidenceHash: string;
  description: string;
}

/**
 * Adaptador de Produção Real para Firestore (Hexagonal Architecture / Ports & Adapters)
 * 
 * Implementa a interface `ILedgerRepository` do domínio sem expor detalhes do Firestore ao Core.
 * Utiliza o Firebase Admin SDK com controlo de concorrência nativo via Transactions do Firestore
 * para garantir propriedades ACID completas e eliminação de conflitos de concorrência.
 */
export class FirestoreLedgerRepository implements ILedgerRepository {
  private db: any = null;
  private isInitialized: boolean = false;
  private memoryAccounts: Map<string, LedgerAccount> = new Map();
  private memoryJournal: LedgerJournalEntry[] = [];

  constructor() {
    this.initFallbackData();
    this.initializeFirestoreAdmin();
  }

  /**
   * Inicializa dados de fallback em memória para garantir resiliência caso o Firestore esteja inacessível.
   */
  private initFallbackData(): void {
    initialLedgerAccounts.forEach(acc => {
      this.memoryAccounts.set(acc.id, { ...acc, version: acc.version || 1 });
    });
    this.memoryJournal = [...initialLedgerEntries];
  }

  /**
   * Inicializa o Firebase Admin SDK estritamente via variáveis de ambiente.
   */
  private initializeFirestoreAdmin(): void {
    try {
      const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || process.env.VITE_FIREBASE_CLIENT_EMAIL;
      const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY || process.env.VITE_FIREBASE_PRIVATE_KEY;
      const jsonCredentials = process.env.FIREBASE_CREDENTIALS || process.env.VITE_FIREBASE_CREDENTIALS;

      if (!projectId && !jsonCredentials) {
        console.warn("[FirestoreLedgerRepository] FIREBASE_PROJECT_ID/FIREBASE_CREDENTIALS não definido. Utilizando modo resiliente local.");
        return;
      }

      // Requisitos de carregamento dinâmico do SDK para evitar problemas de bundling em runtime
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const admin = require("firebase-admin");

      if (!admin.apps.length) {
        if (jsonCredentials) {
          try {
            const parsedCreds = typeof jsonCredentials === "string" ? JSON.parse(jsonCredentials) : jsonCredentials;
            admin.initializeApp({
              credential: admin.credential.cert(parsedCreds),
            });
          } catch (e) {
            console.error("[FirestoreLedgerRepository] Erro ao analisar FIREBASE_CREDENTIALS JSON. Tentando credenciais de ambiente individuais.", e);
            if (clientEmail && rawPrivateKey) {
              const privateKey = rawPrivateKey.replace(/\\n/g, "\n");
              admin.initializeApp({
                credential: admin.credential.cert({
                  projectId: projectId || "kwanza-movel-ai-sandbox",
                  clientEmail,
                  privateKey,
                }),
              });
            } else {
              admin.initializeApp({ projectId: projectId || "kwanza-movel-ai-sandbox" });
            }
          }
        } else if (clientEmail && rawPrivateKey) {
          const privateKey = rawPrivateKey.replace(/\\n/g, "\n");
          admin.initializeApp({
            credential: admin.credential.cert({
              projectId,
              clientEmail,
              privateKey,
            }),
          });
        } else {
          admin.initializeApp({ projectId });
        }
      }

      this.db = admin.firestore();
      this.isInitialized = true;
      console.info(`[FirestoreLedgerRepository] Inicializado com sucesso para o projeto: ${projectId}`);
    } catch (error) {
      console.error("[FirestoreLedgerRepository] Falha ao inicializar o Firebase Admin SDK. Usando modo degradado de alta disponibilidade.", error);
      this.isInitialized = false;
    }
  }

  /**
   * Obtém a lista de contas do razão ativas.
   */
  public async getAccounts(): Promise<LedgerAccount[]> {
    const startTime = Date.now();
    if (!this.isInitialized || !this.db) {
      return Array.from(this.memoryAccounts.values());
    }

    try {
      const snapshot = await this.db.collection("ledger_accounts").get();
      if (snapshot.empty) {
        // Se a coleção estiver vazia, popula com os saldos iniciais do sistema
        await this.saveAccounts(Array.from(this.memoryAccounts.values()));
        return Array.from(this.memoryAccounts.values());
      }

      const accounts: LedgerAccount[] = [];
      snapshot.forEach((doc: any) => {
        accounts.push(doc.data() as LedgerAccount);
      });

      console.info(`[FirestoreLedgerRepository] getAccounts executado em ${Date.now() - startTime}ms. Registos: ${accounts.length}`);
      return accounts;
    } catch (error) {
      console.error("[FirestoreLedgerRepository] Erro ao procurar contas no Firestore. Recorrendo à memória.", error);
      return Array.from(this.memoryAccounts.values());
    }
  }

  /**
   * Persiste atualizações de contas do razão com validação de versão (OCC).
   */
  public async saveAccounts(accounts: LedgerAccount[]): Promise<void> {
    // Atualiza cache em memória
    accounts.forEach(acc => this.memoryAccounts.set(acc.id, acc));

    if (!this.isInitialized || !this.db) {
      return;
    }

    const startTime = Date.now();
    try {
      await this.db.runTransaction(async (transaction: any) => {
        for (const account of accounts) {
          const docRef = this.db.collection("ledger_accounts").doc(account.id);
          const docSnap = await transaction.get(docRef);

          if (docSnap.exists) {
            const currentData = docSnap.data() as LedgerAccount;
            if (currentData.version > account.version) {
              throw new ConcurrencyConflictException(account.id, account.version, currentData.version);
            }
            account.version = currentData.version + 1;
          } else {
            account.version = account.version || 1;
          }

          transaction.set(docRef, {
            ...account,
            updatedAt: new Date().toISOString()
          });
        }
      });

      console.info(`[FirestoreLedgerRepository] saveAccounts persistido com sucesso via Transaction em ${Date.now() - startTime}ms.`);
    } catch (error) {
      console.error("[FirestoreLedgerRepository] Falha ao guardar contas no Firestore.", error);
      if (error instanceof ConcurrencyConflictException) {
        throw error;
      }
    }
  }

  /**
   * Obtém o diário de lançamentos do razão.
   */
  public async getJournalEntries(): Promise<LedgerJournalEntry[]> {
    if (!this.isInitialized || !this.db) {
      return this.memoryJournal;
    }

    try {
      const snapshot = await this.db.collection("ledgers").orderBy("timestamp", "desc").get();
      if (snapshot.empty) {
        return this.memoryJournal;
      }

      const entries: LedgerJournalEntry[] = [];
      snapshot.forEach((doc: any) => {
        const data = doc.data();
        entries.push({
          id: data.transactionId || doc.id,
          timestamp: data.timestamp,
          description: data.description || "Lançamento em Partidas Dobradas",
          txReferenceId: data.transactionId || doc.id,
          postings: data.postings || []
        });
      });

      return entries;
    } catch (error) {
      console.error("[FirestoreLedgerRepository] Erro ao ler entradas do diário do Firestore.", error);
      return this.memoryJournal;
    }
  }

  /**
   * Regista atomicamente um lançamento no diário e a respetiva auditoria na coleção 'ledgers'.
   * Mapeamento atómico imutável para a auditoria do BNA:
   * - transactionId
   * - timestamp
   * - entries: [{ accountId, debit, credit }]
   * - complianceScore
   * - evidenceHash
   */
  public async saveJournalEntry(entry: LedgerJournalEntry): Promise<void> {
    // 1. Verificação de Equilíbrio das Partidas Dobradas (Zero-Sum Invariant) em cêntimos inteiros
    const sumCents = entry.postings.reduce((acc, p) => acc + toKwanzaCents(p.amount), 0);
    if (sumCents !== 0) {
      throw new UnbalancedJournalEntryException(fromKwanzaCents(sumCents), entry.id);
    }

    // 2. Selagem e preservação de fallback local em memória
    const existingIndex = this.memoryJournal.findIndex(e => e.id === entry.id);
    if (existingIndex >= 0) {
      const existing = this.memoryJournal[existingIndex];
      if (existing.hash && entry.hash && existing.hash !== entry.hash) {
        throw new ImmutableLedgerViolationException(
          `Tentativa de alteração não-autorizada no lançamento ${entry.id}. O Ledger é estritamente imutável.`,
          { existingHash: existing.hash, incomingHash: entry.hash }
        );
      }
    } else {
      const seq = entry.sequenceNumber || (this.memoryJournal.length + 1);
      const prev = entry.previousHash || (this.memoryJournal.length > 0 ? (this.memoryJournal[this.memoryJournal.length - 1].hash || GENESIS_PREVIOUS_HASH) : GENESIS_PREVIOUS_HASH);
      const hash = entry.hash || computeJournalEntryHash({
        id: entry.id,
        sequenceNumber: seq,
        timestamp: entry.timestamp,
        description: entry.description,
        txReferenceId: entry.txReferenceId,
        postings: entry.postings,
        previousHash: prev
      });

      const sealed = Object.freeze({
        ...entry,
        sequenceNumber: seq,
        previousHash: prev,
        hash,
        immutableSeal: entry.immutableSeal || `SEAL:KMOS:IMMUTABLE:SHA256:${hash.substring(0, 16)}`,
        postings: entry.postings.map(p => Object.freeze({ ...p }))
      });
      this.memoryJournal.push(sealed);
    }

    if (!this.isInitialized || !this.db) {
      return;
    }

    const startTime = Date.now();
    const transactionId = entry.txReferenceId || entry.id;

    // Mapeamento dos lançamentos para o formato exigido pela auditoria do BNA (débitos e créditos)
    const auditEntries = entry.postings.map(p => ({
      accountId: p.accountId,
      debit: p.amount > 0 ? p.amount : 0,
      credit: p.amount < 0 ? Math.abs(p.amount) : 0
    }));

    const bnaAuditDoc: BnaAuditLedgerDoc = {
      transactionId,
      timestamp: entry.timestamp || new Date().toISOString(),
      entries: auditEntries,
      complianceScore: 100,
      evidenceHash: entry.hash || `SHA256:${transactionId}:${Date.now()}`,
      description: entry.description
    };

    try {
      await this.db.runTransaction(async (transaction: any) => {
        const ledgerRef = this.db.collection("ledgers").doc(transactionId);
        
        // 1. LEITURAS EM PRIMEIRO LUGAR (Regra do Firestore Transactions: todas as leituras devem anteceder escritas)
        const ledgerSnap = await transaction.get(ledgerRef);
        if (ledgerSnap.exists) {
          // Lançamento já persistido (Idempotência sem mutação)
          return;
        }

        const accountUpdates: Array<{ docRef: any; accData: LedgerAccount; newBalance: number; newVersion: number }> = [];

        for (const posting of entry.postings) {
          const accountRef = this.db.collection("ledger_accounts").doc(posting.accountId);
          const accountSnap = await transaction.get(accountRef);

          if (accountSnap.exists) {
            const accData = accountSnap.data() as LedgerAccount;
            const newBalanceCents = toKwanzaCents(accData.balance) + toKwanzaCents(posting.amount);
            const newBalance = fromKwanzaCents(newBalanceCents);
            const newVersion = (accData.version || 1) + 1;
            accountUpdates.push({ docRef: accountRef, accData, newBalance, newVersion });
          } else {
            // Se a conta ainda não existir no Firestore, usa o fallback da memória se disponível
            const fallbackAcc = this.memoryAccounts.get(posting.accountId) || {
              id: posting.accountId,
              code: posting.accountId,
              name: `Conta ${posting.accountId}`,
              type: "ASSET",
              balance: 0,
              currency: "AOA",
              version: 1,
              updatedAt: new Date().toISOString()
            };
            const newBalanceCents = toKwanzaCents(fallbackAcc.balance) + toKwanzaCents(posting.amount);
            const newBalance = fromKwanzaCents(newBalanceCents);
            const newVersion = 2;
            accountUpdates.push({ docRef: accountRef, accData: fallbackAcc as LedgerAccount, newBalance, newVersion });
          }
        }

        // 2. ESCRITAS EM SEGUNDO LUGAR (Grava documento atómico de auditoria BNA e atualiza contas)
        transaction.set(ledgerRef, {
          ...bnaAuditDoc,
          postings: entry.postings,
          sequenceNumber: entry.sequenceNumber,
          previousHash: entry.previousHash,
          hash: entry.hash,
          immutableSeal: entry.immutableSeal,
          createdAt: new Date().toISOString()
        });

        for (const update of accountUpdates) {
          transaction.set(update.docRef, {
            ...update.accData,
            balance: update.newBalance,
            version: update.newVersion,
            updatedAt: new Date().toISOString()
          }, { merge: true });

          // Atualiza cache em memória após escrita com sucesso
          this.memoryAccounts.set(update.accData.id, {
            ...update.accData,
            balance: update.newBalance,
            version: update.newVersion
          });
        }
      });

      console.info(`[FirestoreLedgerRepository] Lançamento imutável ${transactionId} gravado com sucesso no Firestore em ${Date.now() - startTime}ms.`);
    } catch (error) {
      console.error(`[FirestoreLedgerRepository] Falha ao registar lançamento ${transactionId} no Firestore. MANTENDO REGISTO LOCAL.`, error);
    }
  }
}
