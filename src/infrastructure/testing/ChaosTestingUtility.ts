/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LedgerRepository } from "../../domain/repository/LedgerRepository";
import { LedgerAccount, LedgerJournalEntry } from "../../ledgerEngine";
import { EventBus } from "../../domain/events/EventBus";

export interface ChaosConfig {
  enabled: boolean;
  ledgerFailureRate: number;      // Probabilidade de erro (0.0 a 1.0)
  ledgerTimeoutRate: number;      // Probabilidade de latência/timeout (0.0 a 1.0)
  ledgerTimeoutMs: number;        // Tempo de atraso simulado (ms)
  eventBusFailureRate: number;    // Probabilidade de erro no EventBus (0.0 a 1.0)
  eventBusTimeoutRate: number;    // Probabilidade de latência no EventBus (0.0 a 1.0)
  eventBusTimeoutMs: number;      // Tempo de atraso no EventBus (ms)
}

const DEFAULT_CONFIG: ChaosConfig = {
  enabled: false,
  ledgerFailureRate: 0.25,
  ledgerTimeoutRate: 0.25,
  ledgerTimeoutMs: 1500,
  eventBusFailureRate: 0.25,
  eventBusTimeoutRate: 0.25,
  eventBusTimeoutMs: 1200,
};

/**
 * Utilitário Central de Engenharia de Caos (Chaos Engineering Utility) para o KMOS.
 * Permite simular de forma controlada falhas de rede, latências flutuantes e timeouts
 * no Ledger e no Barramento de Eventos para aferir a robustez transacional e rollbacks.
 */
export class ChaosTestingUtility {
  private static instance: ChaosTestingUtility | null = null;
  private config: ChaosConfig = { ...DEFAULT_CONFIG };
  private originalEventBusPublish: any = null;
  private logs: Array<{ timestamp: string; component: string; message: string; type: "error" | "delay" | "info" }> = [];

  private constructor() {
    this.loadFromStorage();
  }

  public static getInstance(): ChaosTestingUtility {
    if (!ChaosTestingUtility.instance) {
      ChaosTestingUtility.instance = new ChaosTestingUtility();
    }
    return ChaosTestingUtility.instance;
  }

  public getConfig(): ChaosConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<ChaosConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.saveToStorage();
    this.addLog("info", "Config", `Configuração de caos atualizada: ${JSON.stringify(this.config)}`);
  }

  public resetConfig(): void {
    this.config = { ...DEFAULT_CONFIG };
    this.saveToStorage();
    this.addLog("info", "Config", "Configuração de caos reposta para os valores de fábrica.");
  }

  private loadFromStorage(): void {
    if (typeof localStorage !== "undefined") {
      const saved = localStorage.getItem("kmos_chaos_config");
      if (saved) {
        try {
          this.config = { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
        } catch {
          // Ignorar se corrompido
        }
      }
    }
  }

  private saveToStorage(): void {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("kmos_chaos_config", JSON.stringify(this.config));
    }
  }

  public addLog(type: "error" | "delay" | "info", component: string, message: string): void {
    const logEntry = {
      timestamp: new Date().toLocaleTimeString(),
      component,
      message,
      type
    };
    this.logs.unshift(logEntry);
    if (this.logs.length > 50) {
      this.logs.pop();
    }
    console.log(`[Chaos ${component.toUpperCase()}] ${message}`);
  }

  public getLogs() {
    return this.logs;
  }

  public clearLogs(): void {
    this.logs = [];
  }

  /**
   * Determina se uma falha deve ser injetada com base em uma taxa de probabilidade específica.
   */
  public shouldFail(rate: number): boolean {
    return this.config.enabled && Math.random() < rate;
  }

  /**
   * Determina se um atraso deve ser injetado e retorna o tempo em milissegundos se aplicável.
   */
  public getDelay(rate: number, timeoutMs: number): number {
    if (this.config.enabled && Math.random() < rate) {
      return timeoutMs;
    }
    return 0;
  }

  /**
   * Embrulha o LedgerRepository original com um proxy injetor de caos.
   */
  public wrapLedgerRepository(underlying: LedgerRepository): LedgerRepository {
    const self = this;
    return {
      async getAccounts(): Promise<LedgerAccount[]> {
        await self.injectLedgerChaos("getAccounts");
        return underlying.getAccounts();
      },

      async saveAccounts(accounts: LedgerAccount[]): Promise<void> {
        await self.injectLedgerChaos("saveAccounts");
        return underlying.saveAccounts(accounts);
      },

      async getJournalEntries(): Promise<LedgerJournalEntry[]> {
        await self.injectLedgerChaos("getJournalEntries");
        return underlying.getJournalEntries();
      },

      async saveJournalEntry(entry: LedgerJournalEntry): Promise<void> {
        await self.injectLedgerChaos("saveJournalEntry");
        return underlying.saveJournalEntry(entry);
      }
    };
  }

  /**
   * Executa a injeção de atrasos ou falhas simuladas para interações com o Ledger.
   */
  private async injectLedgerChaos(methodName: string): Promise<void> {
    if (!this.config.enabled) return;

    // 1. Simulação de Latência / Timeout de Rede
    const delay = this.getDelay(this.config.ledgerTimeoutRate, this.config.ledgerTimeoutMs);
    if (delay > 0) {
      this.addLog("delay", "LedgerRepository", `Injetando latência de ${delay}ms no método '${methodName}'`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    // 2. Simulação de Falha Intermitente (ex: perda de conexão, indisponibilidade do banco, etc)
    if (this.shouldFail(this.config.ledgerFailureRate)) {
      this.addLog("error", "LedgerRepository", `Injetando falha de rede intermitente no método '${methodName}'`);
      throw new Error(`[Chaos SIMULATION] Erro intermitente de rede na ligação ao PostgreSQL ao chamar '${methodName}'`);
    }
  }

  /**
   * Aplica a injeção de caos no EventBus de forma dinâmica (monkey-patch).
   */
  public patchEventBus(eventBus: EventBus): void {
    if (this.originalEventBusPublish) return; // Já patcheado

    const self = this;
    this.originalEventBusPublish = eventBus.publish;

    eventBus.publish = function<T = any>(eventType: string, event: T): void {
      const originalPublish = self.originalEventBusPublish.bind(eventBus);

      if (!self.config.enabled) {
        originalPublish(eventType, event);
        return;
      }

      // 1. Simulação de atraso/timeout síncrono ou assíncrono ao publicar
      const delay = self.getDelay(self.config.eventBusTimeoutRate, self.config.eventBusTimeoutMs);
      const shouldFailSync = self.shouldFail(self.config.eventBusFailureRate);

      if (shouldFailSync) {
        self.addLog("error", "EventBus", `Injetando falha de despacho síncrona ao publicar evento [${eventType}]`);
        throw new Error(`[Chaos SIMULATION] Erro síncrono de ligação ao barramento de eventos (EventBus) para o tipo [${eventType}]`);
      }

      if (delay > 0) {
        self.addLog("delay", "EventBus", `Injetando latência de despacho de ${delay}ms para evento [${eventType}]`);
        setTimeout(() => {
          originalPublish(eventType, event);
        }, delay);
      } else {
        originalPublish(eventType, event);
      }
    };

    this.addLog("info", "EventBus", "Barramento de Eventos patcheado com sucesso para simulação de Caos.");
  }
}

export const chaosUtility = ChaosTestingUtility.getInstance();
