/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Módulo Criptográfico Puro do Razão (Ledger Cryptography & Chain Integrity)
 * 
 * Implementação determinística de SHA-256 em TypeScript puro sem dependências externas.
 * Garante a imutabilidade do diário contábil através de encadeamento criptográfico
 * (Hash Chaining), verificação de prova de integridade e selagem digital de não-repúdio.
 */

export const GENESIS_PREVIOUS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";

/**
 * Calcula o hash SHA-256 de uma string de forma pura e determinística.
 */
export function computeSha256(ascii: string): string {
  function rightRotate(value: number, amount: number): number {
    return (value >>> amount) | (value << (32 - amount));
  }

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = "length";
  let i: number, j: number;
  let result = "";

  const words: number[] = [];
  const asciiBitLength = ascii[lengthProperty] * 8;

  let hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;

  const isComposite: Record<number, boolean> = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 300; i += candidate) {
        isComposite[i] = true;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  let formattedAscii = ascii + "\x80";
  while ((formattedAscii[lengthProperty] % 64) - 56) formattedAscii += "\x00";
  for (i = 0; i < formattedAscii[lengthProperty]; i++) {
    j = formattedAscii.charCodeAt(i);
    words[i >> 2] |= (j & 0xff) << ((3 - (i % 4)) * 8);
  }
  words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0;
  words[words[lengthProperty]] = asciiBitLength;

  for (j = 0; j < words[lengthProperty]; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash;
    hash = hash.slice(0, 8);

    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15] || 0;
      const w2 = w[i - 2] || 0;

      const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
      const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
      w[i] =
        i < 16
          ? (w[i] || 0)
          : (((w[i - 16] || 0) + s0 + (w[i - 7] || 0) + s1) & 0xffffffff);

      const s1_ = rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);
      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const temp1 = (hash[7] + s1_ + ch + k[i] + (w[i] | 0)) | 0;
      const s0_ = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const temp2 = (s0_ + maj) | 0;

      hash = [(temp1 + temp2) | 0, hash[0], hash[1], hash[2], (hash[3] + temp1) | 0, hash[4], hash[5], hash[6]];
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const b = (hash[i] >> (8 * j)) & 255;
      result += (b < 16 ? "0" : "") + b.toString(16);
    }
  }
  return result;
}

export interface LedgerPostingPayload {
  accountId: string;
  accountName: string;
  amount: number;
  type: "DEBIT" | "CREDIT";
}

/**
 * Calcula o hash criptográfico canónico de um lançamento no diário do razão.
 */
export function computeJournalEntryHash(params: {
  id: string;
  sequenceNumber: number;
  timestamp: string;
  description: string;
  txReferenceId: string;
  postings: LedgerPostingPayload[];
  previousHash: string;
}): string {
  // Ordena os postings para garantir representação canónica e determinística
  const sortedPostings = [...params.postings].sort((a, b) => a.accountId.localeCompare(b.accountId));
  const canonicalPayload = JSON.stringify({
    id: params.id,
    seq: params.sequenceNumber,
    ts: params.timestamp,
    desc: params.description,
    ref: params.txReferenceId,
    prev: params.previousHash,
    postings: sortedPostings.map(p => ({
      acc: p.accountId,
      amt: p.amount,
      type: p.type
    }))
  });

  return computeSha256(canonicalPayload);
}

/**
 * Exceção lançada quando qualquer violação de imutabilidade é detetada no Ledger.
 */
export class ImmutableLedgerViolationException extends Error {
  constructor(message: string, public readonly details?: Record<string, unknown>) {
    super(`[IMMUTABLE_LEDGER_VIOLATION] ${message}`);
    this.name = "ImmutableLedgerViolationException";
  }
}

/**
 * Exceção lançada quando é tentada qualquer modificação retroativa, exclusão, truncamento
 * ou sobrescrita num registo histórico já assentado no Razão Contábil.
 */
export class RetroactiveModificationProhibitedException extends Error {
  public readonly entryId: string;
  public readonly attemptedOperation: "UPDATE" | "DELETE" | "TRUNCATE" | "OVERWRITE" | "BACKDATED_INSERT";
  public readonly details?: Record<string, unknown>;

  constructor(
    entryId: string,
    attemptedOperation: "UPDATE" | "DELETE" | "TRUNCATE" | "OVERWRITE" | "BACKDATED_INSERT",
    message?: string,
    details?: Record<string, unknown>
  ) {
    super(
      message ||
        `[VETO_RETROATIVO_BNA] Operação '${attemptedOperation}' estritamente proibida no registo '${entryId}'. O Razão Financeiro é Append-Only (WORM). Correções exigem estorno compensatório (Reversal Posting).`
    );
    this.name = "RetroactiveModificationProhibitedException";
    this.entryId = entryId;
    this.attemptedOperation = attemptedOperation;
    this.details = details;
  }
}

/**
 * Exceção lançada quando uma adulteração criptográfica (tampering) é detectada na cadeia do Ledger.
 */
export class LedgerHistoryTamperException extends Error {
  public readonly brokenSequence: number;
  public readonly entryId: string;
  public readonly tamperType: "HASH_MISMATCH" | "PREVIOUS_HASH_ALTERED" | "SEQUENCE_GAP" | "PAYLOAD_MUTATED" | "UNBALANCED_ENTRY";
  public readonly details?: Record<string, unknown>;

  constructor(
    brokenSequence: number,
    entryId: string,
    tamperType: "HASH_MISMATCH" | "PREVIOUS_HASH_ALTERED" | "SEQUENCE_GAP" | "PAYLOAD_MUTATED" | "UNBALANCED_ENTRY",
    message: string,
    details?: Record<string, unknown>
  ) {
    super(`[CRITICAL_TAMPER_DETECTED] Adulteração no histórico contábil [Seq #${brokenSequence} - ${entryId}] (${tamperType}): ${message}`);
    this.name = "LedgerHistoryTamperException";
    this.brokenSequence = brokenSequence;
    this.entryId = entryId;
    this.tamperType = tamperType;
    this.details = details;
  }
}

/**
 * Congela profundamente qualquer objeto ou estrutura de dados em memória,
 * tornando mutações em tempo de execução impossíveis (Deep Immutability).
 */
export function deepFreeze<T>(obj: T): Readonly<T> {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  // Previne loops se houver referências circulares
  Object.freeze(obj);

  Object.getOwnPropertyNames(obj).forEach((prop) => {
    const val = (obj as any)[prop];
    if (val !== null && (typeof val === "object" || typeof val === "function") && !Object.isFrozen(val)) {
      deepFreeze(val);
    }
  });

  return obj as Readonly<T>;
}

/**
 * Guardião Formal de Imutabilidade e Não-Retroatividade do Razão (Ledger Immutability Guard).
 */
export class LedgerImmutabilityGuard {
  /**
   * Valida se uma nova entrada cumpre estritamente a política Append-Only.
   * Proíbe sobrescritas, números de sequência retrógrados ou lacunas.
   */
  public static assertAppendOnly(
    existingChain: Array<{ id: string; sequenceNumber?: number; hash?: string }>,
    newEntry: { id: string; sequenceNumber?: number; previousHash?: string }
  ): void {
    const existingIndex = existingChain.findIndex((e) => e.id === newEntry.id);
    if (existingIndex !== -1) {
      throw new RetroactiveModificationProhibitedException(
        newEntry.id,
        "OVERWRITE",
        `Veto Fiduciário: O lançamento '${newEntry.id}' já existe no Razão no bloco #${existingIndex + 1}. Sobrescrita ou re-execução proibida.`
      );
    }

    const expectedSeq = existingChain.length + 1;
    const actualSeq = newEntry.sequenceNumber ?? expectedSeq;

    if (actualSeq < expectedSeq) {
      throw new RetroactiveModificationProhibitedException(
        newEntry.id,
        "BACKDATED_INSERT",
        `Veto Fiduciário: Tentativa de inserção retroativa na sequência #${actualSeq} (atual da cadeia é #${expectedSeq}).`
      );
    }

    if (actualSeq > expectedSeq) {
      throw new LedgerHistoryTamperException(
        actualSeq,
        newEntry.id,
        "SEQUENCE_GAP",
        `Lacuna de sequência detectada: esperado #${expectedSeq}, recebido #${actualSeq}. Continuidade contábil violada.`
      );
    }

    const expectedPrevHash = existingChain.length > 0 ? (existingChain[existingChain.length - 1].hash || GENESIS_PREVIOUS_HASH) : GENESIS_PREVIOUS_HASH;
    if (newEntry.previousHash && newEntry.previousHash !== expectedPrevHash) {
      throw new LedgerHistoryTamperException(
        actualSeq,
        newEntry.id,
        "PREVIOUS_HASH_ALTERED",
        `Elo criptográfico corrompido: previousHash fornecido (${newEntry.previousHash}) não corresponde ao topo da cadeia (${expectedPrevHash}).`
      );
    }
  }

  /**
   * Valida se uma tentativa de alteração de registo existente é ilegal.
   */
  public static assertNoRetroactiveModification(
    originalEntry: { id: string; hash?: string },
    attemptedMutation: { id: string; hash?: string }
  ): void {
    if (originalEntry.id === attemptedMutation.id) {
      if (originalEntry.hash && attemptedMutation.hash && originalEntry.hash !== attemptedMutation.hash) {
        throw new RetroactiveModificationProhibitedException(
          originalEntry.id,
          "UPDATE",
          `Veto Fiduciário: Tentativa de adulteração do registo '${originalEntry.id}'. Hashes incompatíveis.`
        );
      }
    }
  }
}

/**
 * Exceção lançada quando um lançamento de diário viola a regra das partidas dobradas (débitos != créditos).
 */
export class UnbalancedJournalEntryException extends Error {
  constructor(totalSum: number, entryId: string) {
    super(`[UNBALANCED_JOURNAL_ENTRY] Lançamento ${entryId} desequilibrado. A soma dos lançamentos deve ser 0 Kz, mas obteve-se ${totalSum} Kz.`);
    this.name = "UnbalancedJournalEntryException";
  }
}

export interface LedgerIntegrityReport {
  isValid: boolean;
  totalEntries: number;
  genesisHash: string;
  latestHash: string;
  brokenAtSequence?: number;
  violationType?: "SEQUENCE_GAP" | "HASH_MISMATCH" | "PREVIOUS_HASH_MISMATCH" | "UNBALANCED_ENTRY" | "PAYLOAD_TAMPERED";
  errorMessage?: string;
  errors?: string[];
  totalEntriesVerified?: number;
  auditTimestamp: string;
}

/**
 * Audita a cadeia completa do Diário Contábil e atesta matematicamente a imutabilidade absoluta.
 */
export function verifyLedgerChainIntegrity(entries: Array<{
  id: string;
  sequenceNumber?: number;
  timestamp: string;
  description: string;
  txReferenceId: string;
  postings: LedgerPostingPayload[];
  previousHash?: string;
  hash?: string;
}>): LedgerIntegrityReport {
  const auditTimestamp = new Date().toISOString();

  if (!entries || entries.length === 0) {
    return {
      isValid: true,
      totalEntries: 0,
      totalEntriesVerified: 0,
      genesisHash: GENESIS_PREVIOUS_HASH,
      latestHash: GENESIS_PREVIOUS_HASH,
      errors: [],
      auditTimestamp
    };
  }

  let expectedPreviousHash = GENESIS_PREVIOUS_HASH;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const expectedSeq = i + 1;
    const actualSeq = entry.sequenceNumber ?? expectedSeq;

    // 1. Verificação de continuidade de sequência
    if (actualSeq !== expectedSeq) {
      const msg = `Quebra de sequência no Ledger: esperado #${expectedSeq}, mas encontrado #${actualSeq} no registo ${entry.id}.`;
      return {
        isValid: false,
        totalEntries: entries.length,
        totalEntriesVerified: i,
        genesisHash: GENESIS_PREVIOUS_HASH,
        latestHash: entry.hash || "UNKNOWN",
        brokenAtSequence: actualSeq,
        violationType: "SEQUENCE_GAP",
        errorMessage: msg,
        errors: [msg],
        auditTimestamp
      };
    }

    // 2. Verificação de Equilíbrio das Partidas Dobradas (Zero-Sum Invariant)
    const sum = entry.postings.reduce((acc, p) => acc + p.amount, 0);
    if (Math.abs(sum) > 0.0001) {
      const msg = `Violação fiduciária de balanço no registo #${actualSeq} (${entry.id}): soma das linhas é ${sum} Kz (deve ser 0).`;
      return {
        isValid: false,
        totalEntries: entries.length,
        totalEntriesVerified: i,
        genesisHash: GENESIS_PREVIOUS_HASH,
        latestHash: entry.hash || "UNKNOWN",
        brokenAtSequence: actualSeq,
        violationType: "UNBALANCED_ENTRY",
        errorMessage: msg,
        errors: [msg],
        auditTimestamp
      };
    }

    // 3. Verificação do Elo da Corrente (Previous Hash)
    const actualPrevHash = entry.previousHash || (i === 0 ? GENESIS_PREVIOUS_HASH : entries[i - 1].hash);
    if (actualPrevHash !== expectedPreviousHash) {
      const msg = `Adulteração detectada na cadeia criptográfica no registo #${actualSeq}: previousHash (${actualPrevHash}) não corresponde ao hash do bloco anterior (${expectedPreviousHash}).`;
      return {
        isValid: false,
        totalEntries: entries.length,
        totalEntriesVerified: i,
        genesisHash: GENESIS_PREVIOUS_HASH,
        latestHash: entry.hash || "UNKNOWN",
        brokenAtSequence: actualSeq,
        violationType: "PREVIOUS_HASH_MISMATCH",
        errorMessage: msg,
        errors: [msg],
        auditTimestamp
      };
    }

    // 4. Verificação do Hash do Bloco Atual
    const calculatedHash = computeJournalEntryHash({
      id: entry.id,
      sequenceNumber: actualSeq,
      timestamp: entry.timestamp,
      description: entry.description,
      txReferenceId: entry.txReferenceId,
      postings: entry.postings,
      previousHash: expectedPreviousHash
    });

    if (entry.hash && entry.hash !== calculatedHash) {
      const msg = `Assinatura de hash corrompida no registo #${actualSeq} (${entry.id}): hash gravado (${entry.hash}) difere do payload real (${calculatedHash}).`;
      return {
        isValid: false,
        totalEntries: entries.length,
        totalEntriesVerified: i,
        genesisHash: GENESIS_PREVIOUS_HASH,
        latestHash: entry.hash,
        brokenAtSequence: actualSeq,
        violationType: "HASH_MISMATCH",
        errorMessage: msg,
        errors: [msg],
        auditTimestamp
      };
    }

    expectedPreviousHash = calculatedHash;
  }

  return {
    isValid: true,
    totalEntries: entries.length,
    totalEntriesVerified: entries.length,
    genesisHash: GENESIS_PREVIOUS_HASH,
    latestHash: expectedPreviousHash,
    errors: [],
    auditTimestamp
  };
}

/**
 * Cria um lançamento contábil de estorno (Compensatory Reversal) estritamente imutável.
 * No KMOS e na regulação bancária do BNA, registros contábeis nunca são alterados ou excluídos.
 * Correções são realizadas exclusivamente via lançamentos de contrapartida.
 */
export function createReversalJournalEntry(
  entryOrParams:
    | {
        id: string;
        description: string;
        txReferenceId: string;
        postings: LedgerPostingPayload[];
        sequenceNumber?: number;
        hash?: string;
      }
    | {
        originalEntry: {
          id: string;
          description: string;
          txReferenceId: string;
          postings: LedgerPostingPayload[];
          sequenceNumber?: number;
          hash?: string;
        };
        reason: string;
        author?: string;
        nextSequenceNumber?: number;
        previousHash?: string;
      },
  reasonArg?: string,
  authorArg?: string,
  nextSeqArg?: number,
  prevHashArg?: string
): {
  id: string;
  timestamp: string;
  description: string;
  txReferenceId: string;
  postings: LedgerPostingPayload[];
  sequenceNumber: number;
  previousHash: string;
  hash: string;
  immutableSeal: string;
} {
  let targetEntry: {
    id: string;
    description: string;
    txReferenceId: string;
    postings: LedgerPostingPayload[];
    sequenceNumber?: number;
    hash?: string;
  };
  let reason: string;
  let author: string;
  let nextSeq: number;
  let prevHash: string;

  if ("originalEntry" in entryOrParams) {
    targetEntry = entryOrParams.originalEntry;
    reason = entryOrParams.reason;
    author = entryOrParams.author || "COMPLIANCE_OFFICER";
    nextSeq = entryOrParams.nextSequenceNumber ?? ((targetEntry.sequenceNumber || 1) + 1);
    prevHash = entryOrParams.previousHash ?? (targetEntry.hash || GENESIS_PREVIOUS_HASH);
  } else {
    targetEntry = entryOrParams;
    reason = reasonArg || "Estorno Contábil Regulatório BNA";
    author = authorArg || "COMPLIANCE_OFFICER";
    nextSeq = nextSeqArg ?? ((targetEntry.sequenceNumber || 1) + 1);
    prevHash = prevHashArg ?? (targetEntry.hash || GENESIS_PREVIOUS_HASH);
  }

  const reversedPostings: LedgerPostingPayload[] = targetEntry.postings.map(p => ({
    accountId: p.accountId,
    accountName: p.accountName,
    amount: -p.amount, // Inverte débitos e créditos com precisão
    type: (p.type === "DEBIT" ? "CREDIT" : "DEBIT") as "DEBIT" | "CREDIT"
  }));

  const reversalId = `REV-${targetEntry.id}`;
  const timestamp = new Date().toISOString();
  const description = `[ESTORNO/REVERSAL] ${reason} (Ref: ${targetEntry.id}) Autor: ${author}`;

  const hash = computeJournalEntryHash({
    id: reversalId,
    sequenceNumber: nextSeq,
    timestamp,
    description,
    txReferenceId: `reversal_${targetEntry.txReferenceId}`,
    postings: reversedPostings,
    previousHash: prevHash
  });

  const entry = {
    id: reversalId,
    timestamp,
    description,
    txReferenceId: `reversal_${targetEntry.txReferenceId}`,
    postings: reversedPostings,
    sequenceNumber: nextSeq,
    previousHash: prevHash,
    hash,
    immutableSeal: `SEAL:KMOS:IMMUTABLE:SHA256:${hash.substring(0, 16)}`
  };

  return deepFreeze(entry);
}

/**
 * Detector de Adulterações Retroativas e Invasões no Histórico Financeiro.
 * Analisa cada entrada individual e as relações de vizinhança criptográfica.
 */
export function detectHistoricalTampering(
  originalChain: Array<{
    id: string;
    sequenceNumber?: number;
    timestamp: string;
    description: string;
    txReferenceId: string;
    postings: LedgerPostingPayload[];
    previousHash?: string;
    hash?: string;
  }>
): {
  isTampered: boolean;
  tamperedEntriesCount: number;
  tamperReports: Array<{
    sequenceNumber: number;
    entryId: string;
    reason: string;
    expectedHash: string;
    actualHash?: string;
  }>;
} {
  const reports: Array<{
    sequenceNumber: number;
    entryId: string;
    reason: string;
    expectedHash: string;
    actualHash?: string;
  }> = [];

  let prevHash = GENESIS_PREVIOUS_HASH;

  for (let i = 0; i < originalChain.length; i++) {
    const entry = originalChain[i];
    const seq = entry.sequenceNumber ?? (i + 1);

    const calculatedHash = computeJournalEntryHash({
      id: entry.id,
      sequenceNumber: seq,
      timestamp: entry.timestamp,
      description: entry.description,
      txReferenceId: entry.txReferenceId,
      postings: entry.postings,
      previousHash: prevHash
    });

    if (entry.previousHash && entry.previousHash !== prevHash) {
      reports.push({
        sequenceNumber: seq,
        entryId: entry.id,
        reason: `Elo quebrado: previousHash (${entry.previousHash}) diverge do hash do bloco anterior (${prevHash}).`,
        expectedHash: prevHash,
        actualHash: entry.previousHash
      });
    }

    if (entry.hash && entry.hash !== calculatedHash) {
      reports.push({
        sequenceNumber: seq,
        entryId: entry.id,
        reason: `Payload adulterado: o hash gravado (${entry.hash}) difere do cálculo determinístico (${calculatedHash}).`,
        expectedHash: calculatedHash,
        actualHash: entry.hash
      });
    }

    prevHash = calculatedHash;
  }

  return {
    isTampered: reports.length > 0,
    tamperedEntriesCount: reports.length,
    tamperReports: reports
  };
}


