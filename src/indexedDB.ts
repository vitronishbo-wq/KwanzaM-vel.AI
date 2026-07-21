/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserAccount, Transaction, ReconciliationLog, ReconciliationEntry } from "./types";

const DB_NAME = "KwanzaMóvelDB";
const DB_VERSION = 4;

export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = request.result;
      if (!db.objectStoreNames.contains("user")) {
        db.createObjectStore("user", { keyPath: "phone" });
      }
      if (!db.objectStoreNames.contains("transactions")) {
        db.createObjectStore("transactions", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("reconciliations")) {
        db.createObjectStore("reconciliations", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("reconciliation_entries")) {
        db.createObjectStore("reconciliation_entries", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("reconciliationLogs")) {
        db.createObjectStore("reconciliationLogs", { keyPath: "id" });
      }
    };
  });
}

export async function saveUserAccount(user: UserAccount): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("user", "readwrite");
    const store = transaction.objectStore("user");
    const request = store.put(user);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getUserAccount(phone: string): Promise<UserAccount | null> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("user", "readonly");
    const store = transaction.objectStore("user");
    const request = store.get(phone);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function saveTransaction(tx: Transaction): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("transactions", "readwrite");
    const store = transaction.objectStore("transactions");
    const request = store.put(tx);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function saveTransactionsBatch(txs: Transaction[]): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("transactions", "readwrite");
    const store = transaction.objectStore("transactions");
    for (const tx of txs) {
      store.put(tx);
    }
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getTransactions(): Promise<Transaction[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("transactions", "readonly");
    const store = transaction.objectStore("transactions");
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function saveReconciliationLog(log: ReconciliationLog): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("reconciliations", "readwrite");
    const store = transaction.objectStore("reconciliations");
    const request = store.put(log);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getReconciliationLogs(): Promise<ReconciliationLog[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("reconciliations", "readonly");
    const store = transaction.objectStore("reconciliations");
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function addReconciliationEntry(
  param1: any,
  param2?: any,
  param3?: any,
  param4?: any,
  param5?: any,
  param6?: any
): Promise<void> {
  let finalEntry: any;

  if (typeof param1 === "object" && param1 !== null) {
    // If we received a parsed object, use its keys and safeguard compatible schemas
    const obj = param1;
    finalEntry = {
      id: obj.id || `RE-${Math.floor(100000 + Math.random() * 900000)}`,
      txId: obj.txId || "",
      txHash: obj.txHash || obj.hash || `SHA256-GEN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      hash: obj.hash || obj.txHash || `SHA256-GEN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      settlementStatus: obj.settlementStatus || obj.status || "liquidação_síncrona",
      status: obj.status || obj.settlementStatus || "liquidação_síncrona",
      timestamp: obj.timestamp || new Date().toISOString(),
      debitAccount: obj.debitAccount || "Carteira Cliente",
      creditAccount: obj.creditAccount || "Custódia Fideicomissária",
      amount: obj.amount || 0,
      ledgerRootHash: obj.ledgerRootHash || `MERKLE-GEN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    };
  } else if (
    typeof param1 === "string" &&
    typeof param2 === "string" &&
    typeof param3 === "string"
  ) {
    // Signature: addReconciliationEntry(hash, status, timestamp, amount?, debitAccount?, creditAccount?)
    const hashVal = param1;
    const statusVal = param2 || "liquidação_síncrona";
    const timestampVal = param3;
    const amountVal = typeof param4 === "number" ? param4 : 0;
    const debitAcc = typeof param5 === "string" ? param5 : "Carteira Cliente";
    const creditAcc = typeof param6 === "string" ? param6 : "Custódia Fideicomissária";

    finalEntry = {
      id: `RE-${Math.floor(100000 + Math.random() * 900000)}`,
      txId: `TX-GEN-${Math.floor(1000 + Math.random() * 9000)}`,
      txHash: hashVal,
      hash: hashVal,
      settlementStatus: statusVal,
      status: statusVal,
      timestamp: timestampVal,
      debitAccount: debitAcc,
      creditAccount: creditAcc,
      amount: amountVal,
      ledgerRootHash: `MERKLE-GEN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    };
  } else {
    // Signature: addReconciliationEntry(txId, status, amount, debitAccount, creditAccount)
    const txId = param1;
    const statusVal = param2 || "liquidação_síncrona";
    const amountVal = typeof param3 === "number" ? param3 : 0;
    const debitAcc = typeof param4 === "string" ? param4 : "Carteira Cliente (Ativo)";
    const creditAcc = typeof param5 === "string" ? param5 : "Custódia Fideicomissária (Passivo)";

    // Generate cryptographic simulation hash
    const p1 = Math.random().toString(36).substring(2, 10);
    const p2 = Math.random().toString(36).substring(2, 10);
    const hashVal = `SHA256-BNA-${p1}${p2}`.toUpperCase();
    const ledgerRootHash = `MERKLE-BNA-${p2}${p1}`.toUpperCase();

    finalEntry = {
      id: `RE-${Math.floor(100000 + Math.random() * 900000)}`,
      txId,
      txHash: hashVal,
      hash: hashVal,
      settlementStatus: statusVal,
      status: statusVal,
      timestamp: new Date().toISOString(),
      debitAccount: debitAcc,
      creditAccount: creditAcc,
      amount: amountVal,
      ledgerRootHash
    };
  }

  const db = await initDB();
  
  // Save in reconciliation_entries
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction("reconciliation_entries", "readwrite");
    const store = transaction.objectStore("reconciliation_entries");
    const request = store.put(finalEntry);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });

  // Save in reconciliationLogs
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction("reconciliationLogs", "readwrite");
    const store = transaction.objectStore("reconciliationLogs");
    const request = store.put(finalEntry);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function addReconciliationEntriesBatch(entries: any[]): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["reconciliation_entries", "reconciliationLogs"], "readwrite");
    const entriesStore = transaction.objectStore("reconciliation_entries");
    const logsStore = transaction.objectStore("reconciliationLogs");
    
    for (const entry of entries) {
      // Setup identical shape as addReconciliationEntry
      const p1 = Math.random().toString(36).substring(2, 10);
      const p2 = Math.random().toString(36).substring(2, 10);
      const hashVal = entry.txHash || `SHA256-BNA-${p1}${p2}`.toUpperCase();
      const ledgerRootHash = entry.ledgerRootHash || `MERKLE-BNA-${p2}${p1}`.toUpperCase();

      const finalEntry = {
        id: entry.id || `RE-${Math.floor(100000 + Math.random() * 900000)}`,
        txId: entry.txId || "",
        txHash: hashVal,
        hash: hashVal,
        settlementStatus: entry.status || "reconciliado_bna",
        status: entry.status || "reconciliado_bna",
        timestamp: entry.timestamp || new Date().toISOString(),
        debitAccount: entry.debitAccount || "Carteira Cliente (Ativo)",
        creditAccount: entry.creditAccount || "Custódia Fideicomissária (Passivo)",
        amount: entry.amount || 0,
        ledgerRootHash
      };

      entriesStore.put(finalEntry);
      logsStore.put(finalEntry);
    }

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getReconciliationEntries(): Promise<ReconciliationEntry[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("reconciliation_entries", "readonly");
    const store = transaction.objectStore("reconciliation_entries");
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function getReconciliationLogsByStore(): Promise<any[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("reconciliationLogs", "readonly");
    const store = transaction.objectStore("reconciliationLogs");
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}


