/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LedgerRepository } from "../../domain/repository/LedgerRepository";
import { LedgerAccount, LedgerJournalEntry } from "../../ledgerEngine";
import { EventBus } from "../../domain/events/EventBus";
import { chaosUtility } from "./ChaosTestingUtility";

/**
 * TypeScript Method Decorator para injetar anomalias comportamentais de caos (latência e falhas intermitentes).
 * 
 * Funciona intercetando a execução do método original, aplicando regras probabilísticas de
 * latência flutuante e de falhas catastróficas em tempo de execução para avaliar a integridade transacional.
 * 
 * @param component O componente sobre o qual se injetam as anomalias ("LedgerRepository" | "EventBus")
 */
export function InjectChaos(component: "LedgerRepository" | "EventBus") {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const utility = chaosUtility;
      const config = utility.getConfig();

      // Só executa a injeção se o caos estiver ativado globalmente
      if (config.enabled) {
        if (component === "LedgerRepository") {
          // 1. Simulação de Latência / Timeout
          const delay = utility.getDelay(config.ledgerTimeoutRate, config.ledgerTimeoutMs);
          if (delay > 0) {
            utility.addLog(
              "delay", 
              "LedgerRepository", 
              `[Decorator:@InjectChaos] Latência induzida de ${delay}ms em '${propertyKey}'`
            );
            await new Promise(resolve => setTimeout(resolve, delay));
          }

          // 2. Simulação de Falha de Ligação PostgreSQL / Rede
          if (utility.shouldFail(config.ledgerFailureRate)) {
            utility.addLog(
              "error", 
              "LedgerRepository", 
              `[Decorator:@InjectChaos] Erro de rede injetado no método '${propertyKey}'`
            );
            throw new Error(`[Chaos SIMULATION] Erro intermitente de base de dados PostgreSQL ao chamar '${propertyKey}'`);
          }
        } else if (component === "EventBus") {
          // 1. Simulação de Latência / Timeout no barramento
          const delay = utility.getDelay(config.eventBusTimeoutRate, config.eventBusTimeoutMs);
          
          // 2. Simulação de falha de ligação no despacho de eventos
          if (utility.shouldFail(config.eventBusFailureRate)) {
            utility.addLog(
              "error", 
              "EventBus", 
              `[Decorator:@InjectChaos] Falha síncrona de despacho induzida no método '${propertyKey}'`
            );
            throw new Error(`[Chaos SIMULATION] Erro catastrófico de rede ao aceder ao barramento de eventos (EventBus) em '${propertyKey}'`);
          }

          if (delay > 0) {
            utility.addLog(
              "delay", 
              "EventBus", 
              `[Decorator:@InjectChaos] Latência induzida de ${delay}ms para o evento em '${propertyKey}'`
            );
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      // Executa o método original delegado
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * Implementação do Padrão de Desenho Decorator (Design Pattern Decorator)
 * para o LedgerRepository. Embrulha qualquer repositório concreto de Ledger (PostgreSQL, LocalStorage, etc.)
 * e utiliza os Decorators de TypeScript para injetar caos de forma elegante e transparente.
 */
export class LedgerRepositoryChaosDecorator implements LedgerRepository {
  constructor(private readonly underlying: LedgerRepository) {}

  @InjectChaos("LedgerRepository")
  public async getAccounts(): Promise<LedgerAccount[]> {
    return this.underlying.getAccounts();
  }

  @InjectChaos("LedgerRepository")
  public async saveAccounts(accounts: LedgerAccount[]): Promise<void> {
    return this.underlying.saveAccounts(accounts);
  }

  @InjectChaos("LedgerRepository")
  public async getJournalEntries(): Promise<LedgerJournalEntry[]> {
    return this.underlying.getJournalEntries();
  }

  @InjectChaos("LedgerRepository")
  public async saveJournalEntry(entry: LedgerJournalEntry): Promise<void> {
    return this.underlying.saveJournalEntry(entry);
  }
}

/**
 * Classe auxiliar interna para aplicar o decorator @InjectChaos na publicação de eventos.
 */
class EventBusDecoratedPublisher {
  constructor(private readonly originalPublish: any, private readonly eventBus: EventBus) {}

  @InjectChaos("EventBus")
  public async publishEvent<T>(eventType: string, event: T): Promise<void> {
    // Chamar com setTimeout de 0 para emular o comportamento não-bloqueante original
    setTimeout(() => {
      this.originalPublish.call(this.eventBus, eventType, event);
    }, 0);
  }
}

/**
 * Decorador para o Barramento de Eventos (EventBus).
 * Adapta e intercepta as chamadas de publicação de eventos do EventBus aplicando
 * as injeções de caos declaradas via decorators.
 */
export class EventBusChaosDecorator {
  private originalPublish: any;

  constructor(private readonly eventBus: EventBus) {
    this.originalPublish = this.eventBus.publish;
  }

  /**
   * Ativa a decoração dinamicamente no EventBus através de monkey-patching controlado.
   */
  public decorate(): void {
    const publisher = new EventBusDecoratedPublisher(this.originalPublish, this.eventBus);

    // Substitui o método publish do EventBus pelo decorado
    this.eventBus.publish = function<T = any>(eventType: string, event: T): void {
      publisher.publishEvent(eventType, event).catch(err => {
        console.error("[EventBusChaosDecorator] Erro no fluxo decorado de eventos:", err);
      });
    };

    chaosUtility.addLog("info", "EventBus", "EventBus decorado com sucesso usando @InjectChaos de Class Decorators.");
  }
}
