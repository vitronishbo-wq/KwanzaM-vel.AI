/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AntiReplayRepository, AntiReplayNonceRecord } from "../repository/AntiReplayRepository";

export class ReplayAttackException extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReplayAttackException";
  }
}

export class ExpiredTimestampException extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExpiredTimestampException";
  }
}

export class SequenceNumberViolationException extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SequenceNumberViolationException";
  }
}

export interface AntiReplayConfig {
  maxPastSkewMs?: number;    // Padrão: 300.000 ms (5 minutos)
  maxFutureSkewMs?: number;  // Padrão: 60.000 ms (1 minuto)
  clock?: () => number;
}

export interface ReplayValidationParams {
  sender: string;
  nonce?: string;
  timestamp?: string | number;
  sequenceNumber?: number;
  txId?: string;
}

export const DEFAULT_MAX_PAST_SKEW_MS = 5 * 60 * 1000;  // 5 minutos
export const DEFAULT_MAX_FUTURE_SKEW_MS = 60 * 1000;    // 1 minuto

/**
 * AntiReplayValidator (Domain Service)
 * 
 * Garante proteção robusta e determinística contra ataques de repetição (Replay Attacks)
 * e injeção de pacotes capturados:
 * 1. Validação de Janela Temporal (Clock Skew / Expiração de Timestamp)
 * 2. Unicidade Estrita de Nonces Criptográficos por Remetente
 * 3. Monotonicidade Estrita de Números de Sequência
 */
export class AntiReplayValidator {
  private readonly maxPastSkewMs: number;
  private readonly maxFutureSkewMs: number;
  private readonly clock: () => number;

  constructor(
    private readonly repository: AntiReplayRepository,
    config?: AntiReplayConfig
  ) {
    this.maxPastSkewMs = config?.maxPastSkewMs ?? DEFAULT_MAX_PAST_SKEW_MS;
    this.maxFutureSkewMs = config?.maxFutureSkewMs ?? DEFAULT_MAX_FUTURE_SKEW_MS;
    this.clock = config?.clock ?? (() => Date.now());
  }

  /**
   * Valida a frescura temporal, a unicidade do nonce e a monotonicidade da sequência.
   * Lança exceções de domínio tipadas em caso de violação.
   */
  public async validateRequest(params: ReplayValidationParams): Promise<{ valid: boolean; expiresAt: number }> {
    const now = this.clock();

    // 1. Validação de Janela Temporal (se timestamp for informado)
    if (params.timestamp !== undefined && params.timestamp !== null) {
      const txTime = typeof params.timestamp === "number"
        ? params.timestamp
        : new Date(params.timestamp).getTime();

      if (isNaN(txTime)) {
        throw new ExpiredTimestampException(`Timestamp inválido ou corrompido: '${params.timestamp}'.`);
      }

      // Rejeição de transação expirada no passado
      if (txTime < now - this.maxPastSkewMs) {
        const driftSec = Math.round((now - txTime) / 1000);
        throw new ExpiredTimestampException(
          `Ataque de Replay ou Transação Expirada: Timestamp tem ${driftSec}s de atraso (limite: ${this.maxPastSkewMs / 1000}s).`
        );
      }

      // Rejeição de transação com timestamp no futuro (clock drift excessivo)
      if (txTime > now + this.maxFutureSkewMs) {
        const futureSec = Math.round((txTime - now) / 1000);
        throw new ExpiredTimestampException(
          `Timestamp inválido no futuro: ${futureSec}s à frente do relógio do servidor (limite tolerado: ${this.maxFutureSkewMs / 1000}s).`
        );
      }
    }

    // 2. Validação de Não-Repetição de Nonce
    if (params.nonce) {
      const normalizedNonce = params.nonce.trim();
      if (!normalizedNonce) {
        throw new ReplayAttackException("Nonce fornecido está vazio ou corrompido.");
      }

      const alreadyUsed = await this.repository.hasNonce(params.sender, normalizedNonce);
      if (alreadyUsed) {
        throw new ReplayAttackException(
          `Ataque de Replay Detetado: O nonce '${normalizedNonce}' já foi consumido anteriormente para a conta '${params.sender}'.`
        );
      }
    }

    // 3. Validação de Monotonicidade do Número de Sequência
    if (params.sequenceNumber !== undefined && params.sequenceNumber !== null) {
      if (typeof params.sequenceNumber !== "number" || isNaN(params.sequenceNumber) || params.sequenceNumber < 0) {
        throw new SequenceNumberViolationException(`Número de sequência inválido: ${params.sequenceNumber}.`);
      }

      const lastSeq = await this.repository.getLastSequenceNumber(params.sender);
      if (params.sequenceNumber <= lastSeq) {
        throw new SequenceNumberViolationException(
          `Ataque de Replay de Sequência: O número de sequência ${params.sequenceNumber} é menor ou igual ao último número consolidado (${lastSeq}) para a conta '${params.sender}'.`
        );
      }
    }

    // Define expiração do registro de nonce para purga automática (janela de skew + margem de segurança)
    const expiresAt = now + this.maxPastSkewMs * 2;
    return { valid: true, expiresAt };
  }

  /**
   * Registra o nonce e atualiza o número de sequência após a conclusão bem-sucedida da transação.
   */
  public async commitNonce(params: {
    sender: string;
    nonce?: string;
    sequenceNumber?: number;
    txId?: string;
    expiresAt?: number;
  }): Promise<void> {
    const now = this.clock();
    const expiresAt = params.expiresAt ?? (now + this.maxPastSkewMs * 2);

    if (params.nonce) {
      const normalizedNonce = params.nonce.trim();
      const record: AntiReplayNonceRecord = {
        key: `${params.sender}:${normalizedNonce}`,
        sender: params.sender,
        nonce: normalizedNonce,
        txId: params.txId,
        sequenceNumber: params.sequenceNumber,
        createdAt: now,
        expiresAt
      };
      await this.repository.recordNonce(record);
    }

    if (params.sequenceNumber !== undefined && params.sequenceNumber !== null) {
      await this.repository.updateSequenceNumber(params.sender, params.sequenceNumber);
    }
  }

  /**
   * Helper para geração determinística/segura de Nonce criptográfico aleatório.
   */
  public static generateNonce(prefix: string = "kmos_nonce"): string {
    if (typeof globalThis.crypto !== "undefined" && typeof globalThis.crypto.getRandomValues === "function") {
      const buf = new Uint8Array(16);
      globalThis.crypto.getRandomValues(buf);
      const hex = Array.from(buf).map(b => b.toString(16).padStart(2, "0")).join("");
      return `${prefix}_${hex}`;
    }
    const rand = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    return `${prefix}_${Date.now()}_${rand}`;
  }
}
