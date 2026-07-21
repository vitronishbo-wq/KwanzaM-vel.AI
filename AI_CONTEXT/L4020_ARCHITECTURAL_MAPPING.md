# KwanzaMóvel Architectural Mapping (L40/20)
> **Mapeamento:** Artigo da Lei ──► Elementos de Engenharia

---

## I. INTRODUÇÃO
Este documento apresenta o mapeamento detalhado da **Lei n.º 40/20 (LSPA)** nos componentes do software KwanzaMóvel, determinando os pontos de contato e a situação de conformidade de cada requisito legal.

---

## II. MATRIZ DE MAPEAMENTO ARQUITETURAL

### 1. Artigo 3.º — Segurança, Fiabilidade Operacional, Eficiência e Transparência
*   **Módulo Afetado:** Infraestrutura, Security Middleware, Ledger.
*   **Estado de Implementação:** Parcialmente Implementado.
*   **Componentes de Domínio:**
    *   *Aggregate:* `Wallet`, `LedgerEntry`
    *   *Value Object:* `Money`, `Currency`
    *   *Use Case:* `TransferUseCase`, `AuditTrailUseCase`
    *   *Repository:* `WalletRepository`, `AuditRepository`
    *   *API Impactada:* `/api/wallets/*`, `/api/audit/*`
*   **Evidências & Observabilidade:**
    *   *Eventos:* `RegulatoryLimitBreachedEvent`, `WalletBlockedEvent`
    *   *Logs:* Registo estruturado com `correlationId`, `traceId` e tempos de latência (`latencyMs`).
    *   *Métricas:* Latência média de transações, taxa de sucesso operacional.
    *   *Auditoria:* Ledger imutável de dupla entrada (Double-Entry Ledger) para provar integridade física do lastro.

### 2. Artigo 18.º — Prestação de Serviços por Terceiros (Agentes)
*   **Módulo Afetado:** Merchant & Agent Management Domain.
*   **Estado de Implementação:** Parcialmente Implementado (Lojistas/Merchants existem, mas o conceito formal de correspondente / Agente requer expansão).
*   **Componentes de Domínio:**
    *   *Aggregate:* `Merchant` (Lojista) / `Agent` (Agente de Pagamento)
    *   *Value Object:* `MdrRate` (basis points / bps), `KYCTier` (para limite de movimentação do agente)
    *   *Use Case:* `MerchantPaymentUseCase`, `RegisterMerchantUseCase`
    *   *Repository:* `MerchantRepository`
    *   *API Impactada:* `/api/merchants/*`
*   **Evidências & Observabilidade:**
    *   *Eventos:* `MerchantRegisteredEvent`, `RegulatoryMdrViolationEvent`
    *   *Logs:* Auditoria de onboarding de agentes de pagamento e suas comissões.
    *   *Métricas:* Volume transacionado por agentes, depósitos/levantamentos por correspondente.
    *   *Auditoria:* Relatórios de comissões calculados exclusivamente em basis points (`bigint`) para evitar perdas de cêntimos.

### 3. Artigo 40.º — Carácter Definitivo e Irrevogável da Liquidação
*   **Módulo Afetado:** Ledger (Razão Imutável), Settlement (Liquidação).
*   **Estado de Implementação:** Implementado.
*   **Componentes de Domínio:**
    *   *Aggregate:* `JournalEntry`
    *   *Value Object:* `TransactionId`
    *   *Use Case:* `TransferUseCase`
    *   *Repository:* `LedgerRepository` (Drizzle/Memory)
*   **Evidências & Observabilidade:**
    *   *Eventos:* `TransactionCompletedEvent`
    *   *Logs:* Gravação física e imutável de transações com hash criptográfico preventivo.
    *   *Métricas:* Consistência de balanço global (Soma dos débitos = Soma dos créditos).
    *   *Auditoria:* Auditoria de integridade do ledger onde o estorno de uma transação exige a criação de uma nova transação compensatória, nunca modificando a transação original.

### 4. Artigo 47.º — Idioma e Transparência de Taxas e Tarifas
*   **Módulo Afetado:** API de FAQ, Interface de Utilizador (Frontend).
*   **Estado de Implementação:** Implementado.
*   **Componentes de Domínio:**
    *   *Use Case:* `FaqUseCase`
    *   *API Impactada:* `/api/faq`
*   **Evidências & Observabilidade:**
    *   *Logs:* Registro de visualizações do preçário e termos de serviço.
    *   *Auditoria:* Disponibilização pública de tabela de encargos legível.

### 5. Artigo 68.º — Consentimento e Retirada do Consentimento
*   **Módulo Afetado:** API de Autorização, Wallet Security.
*   **Estado de Implementação:** Parcialmente Implementado (Presumido pelo login e PIN, mas falta consentimento explícito por transação via tokens de uso único).
*   **Componentes de Domínio:**
    *   *Aggregate:* `Wallet`
    *   *Use Case:* `TransferUseCase` (Exige validação de PIN de assinatura digital)
*   **Evidências & Observabilidade:**
    *   *Eventos:* `ConsentVerifiedEvent`, `ConsentWithdrawnEvent`
    *   *Logs:* Registo do timestamp do consentimento eletrónico do utilizador.
    *   *Auditoria:* Log criptográfico de assinatura de transação (PIN / Biometria do utilizador).

### 6. Artigo 74.º — Obrigações dos PSPs sobre Instrumentos de Pagamento
*   **Módulo Afetado:** Security / Autenticação Forte, Gestão de Credenciais.
*   **Estado de Implementação:** Implementado.
*   **Componentes de Domínio:**
    *   *Aggregate:* `Wallet`
    *   *Value Object:* `WalletStatus` (`ACTIVE`, `FROZEN`, `BLOCKED`)
    *   *Use Case:* `BlockWalletUseCase`, `UnblockWalletUseCase`
*   **Evidências & Observabilidade:**
    *   *Eventos:* `WalletStatusChangedEvent`, `SecurityAlertTriggeredEvent`
    *   *Logs:* Alertas em tempo real de suspeita de comprometimento de credenciais.
    *   *Auditoria:* Logs detalhados de ações administrativas de bloqueio temporário e definitivo.

### 7. Artigo 93.º — Gestão de Riscos Operacionais e de Segurança
*   **Módulo Afetado:** Compliance & AML Middleware.
*   **Estado de Implementação:** Implementado.
*   **Componentes de Domínio:**
    *   *Use Case:* `TransferUseCase` (avaliação de `fraudScore`)
    *   *Repository:* `AuditRepository`
*   **Evidências & Observabilidade:**
    *   *Eventos:* `HighRiskTransactionFlaggedEvent`
    *   *Logs:* Gravação de telemetria de score de fraude e razões de bloqueio.
    *   *Métricas:* Percentual de transações bloqueadas preventivamente.
    *   *Auditoria:* Trail de auditoria AML integrado.

### 8. Artigo 96.º — Autenticação Forte do Cliente (SCA)
*   **Módulo Afetado:** Gateway de Autenticação, API de Assinatura.
*   **Estado de Implementação:** Parcialmente Implementado (PIN existe, mas segundo fator/OTP é simulado).
*   **Componentes de Domínio:**
    *   *Value Object:* `ScaToken`
    *   *Use Case:* `VerifyScaUseCase`
*   **Evidências & Observabilidade:**
    *   *Eventos:* `ScaVerificationSuccessEvent`, `ScaVerificationFailedEvent`
    *   *Logs:* Tentativas de autenticação malsucedidas e bloqueios temporários de conta.
    *   *Métricas:* Taxa de falhas de autenticação.
    *   *Auditoria:* Logs criptográficos de verificação multifator.
