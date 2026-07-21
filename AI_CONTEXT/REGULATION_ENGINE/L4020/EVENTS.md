# LSPA — Catálogo de Eventos Regulatórios (Events)
> **Auditoria Reativa:** Eventos gerados para garantir rastreabilidade regulatória contínua

---

## I. INTRODUÇÃO
A Law-Driven Architecture assenta na emissão sistemática de eventos em resposta a ações operacionais ou violações de regras estabelecidas pelo BNA. Estes eventos constituem a base para o preenchimento automático do Compliance Dashboard e logs de auditoria.

---

## II. CATÁLOGO DE EVENTOS REGULATÓRIOS (EVENTS)

### 1. `RegulatoryLimitBreachedEvent`
*   **Artigo Conectado:** Artigo 18.º do Aviso n.º 03/22 (Limites Diários por Tier).
*   **Gatilho:** Tentativa de envio de valores que ultrapassem o teto acumulado permitido para o nível KYC do utilizador.
*   **Payload do Evento:**
    ```typescript
    interface RegulatoryLimitBreachedEvent {
      dateTimeOccurred: Date;
      walletId: UniqueEntityId;
      attemptedAmount: Money;
      alreadySpentToday: Money;
      activeLimit: Money;
      ruleId: string;
      diploma: string;
    }
    ```
*   **Impacto Telemetria:** Log de categoria `TX_BLOCKED_LIMIT`, incremento no indicador de risco AML do Dashboard Regulador.

### 2. `RegulatoryMdrViolationEvent`
*   **Artigo Conectado:** Anexo Técnico do Aviso n.º 10/20 (Limites de MDR de Lojista).
*   **Gatilho:** Tentativa de credenciamento ou alteração de taxa MDR de um comerciante para um valor acima de 2.50% (250 bps).
*   **Payload do Evento:**
    ```typescript
    interface RegulatoryMdrViolationEvent {
      dateTimeOccurred: Date;
      merchantId: UniqueEntityId;
      attemptedRateBps: number;
      maxAllowedBps: number;
      ruleId: string;
    }
    ```
*   **Impacto Telemetria:** Notificação crítica de conformidade, bloqueio imediato do onboarding administrativo do lojista.

### 3. `WalletFrozenEvent` (ou `WalletStatusChangedEvent`)
*   **Artigo Conectado:** Artigo 74.º da Lei 40/20 (Bloqueio Cautelar e Prevenção AML).
*   **Gatilho:** Bloqueio temporário ou congelamento de fundos por suspeita de fraude ou por ordem explícita das autoridades (AML / BNA).
*   **Payload do Evento:**
    ```typescript
    interface WalletFrozenEvent {
      dateTimeOccurred: Date;
      walletId: UniqueEntityId;
      reason: string;
      adminId?: UniqueEntityId;
    }
    ```
*   **Impacto Telemetria:** Congelamento imediato das operações de débito e crédito da conta fiduciária no Ledger do KwanzaMóvel.

### 4. `BalanceDiscrepancyDetectedEvent`
*   **Artigo Conectado:** Artigo 20.º do Aviso n.º 03/22 (Garantias e Lastro de 100%).
*   **Gatilho:** Identificação de incongruência entre a soma de todos os saldos de e-Money emitidos e o total de depósitos reais nas contas fiduciárias.
*   **Payload do Evento:**
    ```typescript
    interface BalanceDiscrepancyDetectedEvent {
      dateTimeOccurred: Date;
      totalEmitted: Money;
      totalSafeguarded: Money;
      difference: Money;
    }
    ```
*   **Impacto Telemetria:** Notificação crítica de conformidade via Webhook para a Direção Financeira e suspensão automática de novas emissões de moeda eletrónica.
