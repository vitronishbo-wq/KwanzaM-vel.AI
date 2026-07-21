/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type EventHandler<T = any> = (event: T) => void | Promise<void>;

/**
 * EventBus - Barramento de Eventos de Domínio Ultraleve
 * 
 * Implementa o padrão Publish-Subscribe para desacoplamento de serviços e
 * arquitetura reativa assíncrona/síncrona de escala bancária.
 */
export class EventBus {
  private static instance: EventBus | null = null;
  private handlers: Map<string, EventHandler[]> = new Map();

  private constructor() {}

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Subscreve um manipulador de eventos para um tipo específico.
   */
  public subscribe<T = any>(eventType: string, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);

    // Retorna função para cancelar a subscrição
    return () => {
      const list = this.handlers.get(eventType) || [];
      this.handlers.set(eventType, list.filter(h => h !== handler));
    };
  }

  /**
   * Publica um evento para todos os subscritores de forma não-bloqueante.
   */
  public publish<T = any>(eventType: string, event: T): void {
    const list = this.handlers.get(eventType) || [];
    // Executa em background de forma assíncrona para não atrasar a transação principal
    for (const handler of list) {
      setTimeout(async () => {
        try {
          await handler(event);
        } catch (err) {
          console.error(`Erro ao processar evento [${eventType}] no handler:`, err);
        }
      }, 0);
    }
  }
}
