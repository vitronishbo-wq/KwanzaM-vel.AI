/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OutboxRepository, OutboxMessage } from "../../domain/repository/OutboxRepository";
import { EventBus } from "../../domain/events/EventBus";

/**
 * Processador de Outbox do KMOS
 * 
 * Garante que eventos gerados em transações ACID sejam despachados de forma fiável,
 * agindo após o commit bem-sucedido na persistência local. Garante consistência eventual
 * no ecossistema de eventos sem bloquear a transação fiduciária principal.
 */
export class OutboxProcessor {
  private isProcessing = false;
  private outboxRepo: OutboxRepository;
  private eventBus: EventBus;

  constructor(outboxRepo: OutboxRepository, eventBus = EventBus.getInstance()) {
    this.outboxRepo = outboxRepo;
    this.eventBus = eventBus;
  }

  /**
   * Processa todas as mensagens pendentes no Outbox.
   * Pode ser invocado síncronamente logo após um commit transacional,
   * ou de forma reativa a intervalos regulares de polling.
   */
  public async processPending(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const pendingMessages = await this.outboxRepo.getPending();
      if (pendingMessages.length === 0) return;

      console.info(`[OutboxProcessor] Processando ${pendingMessages.length} mensagem(ns) pendente(s)...`);

      for (const message of pendingMessages) {
        try {
          // Despacha o evento no Barramento de Eventos (EventBus)
          this.eventBus.publish(message.event.type, message.event);

          // Atualiza status para processado com absoluto sucesso
          message.status = "PROCESSED";
          message.processedAt = new Date().toISOString();
          await this.outboxRepo.save(message);
        } catch (err: any) {
          console.error(`[OutboxProcessor] Erro ao processar mensagem ${message.id}:`, err);
          
          message.attempts += 1;
          message.lastError = err.message || "Erro desconhecido";
          
          if (message.attempts >= 5) {
            message.status = "FAILED";
            console.error(`[OutboxProcessor] Mensagem ${message.id} falhou definitivamente após ${message.attempts} tentativas.`);
          }
          
          await this.outboxRepo.save(message);
        }
      }
    } catch (globalErr) {
      console.error("[OutboxProcessor] Erro crítico no loop global de processamento:", globalErr);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Inicia o polling de background assíncrono para garantir a resiliência no processamento
   * caso chamadas imediatas pós-commit sofram interferências.
   */
  public startPolling(intervalMs = 3000): () => void {
    console.info(`[OutboxProcessor] Iniciando polling em background a cada ${intervalMs}ms`);
    const timer = setInterval(() => {
      this.processPending().catch(err => {
        console.error("[OutboxProcessor] Erro não tratado no polling em background:", err);
      });
    }, intervalMs);

    return () => {
      console.info("[OutboxProcessor] Parando polling em background");
      clearInterval(timer);
    };
  }
}
