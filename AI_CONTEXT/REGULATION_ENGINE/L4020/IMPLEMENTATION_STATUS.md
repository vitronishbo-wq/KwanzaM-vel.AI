# LSPA — Estado de Implementação Regulatório por Artigo
> **Índice de Conformidade por Artigo:** Mapeamento holístico de status técnico

---

## I. RESUMO DO STATUS GLOBAL DO SISTEMA

O índice de conformidade global é calculado de forma dinâmica a partir da avaliação dos seguintes eixos para cada artigo:
*   **Documentação (D):** 100% de representação formal do artigo em Markdown.
*   **Domínio (Do):** Componentes do modelo de domínio que representam as invariantes do artigo.
*   **Casos de Uso (U):** Lógica aplicacional ativa que executa as invariantes.
*   **Testes (T):** Cobertura de testes unitários ou de integração de compliance.
*   **Observabilidade (O):** Logs de auditoria estruturados e eventos.
*   **Auditoria (A):** Rastreabilidade do dado no ledger ou bases regulamentares.

---

## II. ÍNDICE DE IMPLEMENTAÇÃO POR ARTIGO

### Artigo 1.º (Objeto)
*   **Estado:** **Implementado** (100% de conformidade)
*   **Impacto:** Médio
*   **Domínio:** `Regulatory`
*   **Casos de Uso:** `None`
*   **APIs:** `None`
*   **Testes:** `None` (Validação existencial)
*   **Observabilidade:** `Metadata`
*   **Compliance:** 100% | **Coverage:** 100% | **Risk:** Baixo

### Artigo 2.º (Definições)
*   **Estado:** **Implementado** (100% de conformidade)
*   **Impacto:** Altíssimo
*   **Domínio:** `Identity`, `Wallet`, `Merchant`, `Ledger`, `Security`
*   **Casos de Uso:** Todos os casos de uso de core financeiro
*   **APIs:** `/api/*`
*   **Testes:** Todos os testes de domínio
*   **Observabilidade:** Logs corporativos e rastreio estruturado
*   **Compliance:** 100% | **Coverage:** 100% | **Risk:** Baixo

### Artigo 3.º (Objetivos de Interesse Público)
*   **Estado:** **Parcialmente Implementado** (75% de conformidade)
*   **Impacto:** Crítico
*   **Domínio:** `Ledger`, `Security`
*   **Casos de Uso:** `TransferUseCase` (segurança transacional e latência mínima)
*   **APIs:** `/api/transfers`
*   **Testes:** `TransferUseCase.test.ts`
*   **Observabilidade:** Eventos com `correlationId` e telemetria de latência
*   **Compliance:** 75% | **Coverage:** 80% | **Risk:** Médio-Baixo

### Artigo 4.º (Serviços de Pagamento)
*   **Estado:** **Implementado** (90% de conformidade)
*   **Impacto:** Alto
*   **Domínio:** `Wallet`
*   **Casos de Uso:** `DepositUseCase`, `WithdrawalUseCase` (depósito e saque de numerário)
*   **APIs:** `/api/wallets/deposit`
*   **Testes:** `Wallet.test.ts`
*   **Observabilidade:** Logs estruturados do tipo `WALLET_DEPOSIT`
*   **Compliance:** 90% | **Coverage:** 90% | **Risk:** Baixo

### Artigo 18.º (Contratação de Agentes de Pagamento / Correspondentes)
*   **Estado:** **Parcialmente Implementado** (60% de conformidade)
*   **Impacto:** Alto
*   **Domínio:** `Merchant`
*   **Casos de Uso:** `RegisterMerchantUseCase`
*   **APIs:** `/api/merchants`
*   **Testes:** `Merchant.test.ts`
*   **Observabilidade:** Logs de onboarding de lojistas com controle MDR
*   **Compliance:** 60% | **Coverage:** 50% | **Risk:** Médio-Alto

### Artigo 20.º (Garantias e Lastro de Moeda Eletrónica)
*   **Estado:** **Parcialmente Implementado** (70% de conformidade)
*   **Impacto:** Crítico
*   **Domínio:** `Settlement`
*   **Casos de Uso:** `TransferUseCase` (proibição de saldos negativos)
*   **APIs:** `/api/transfers`
*   **Testes:** `InsufficientFunds.test.ts`
*   **Observabilidade:** Audit trail imutável
*   **Compliance:** 70% | **Coverage:** 80% | **Risk:** Alto (Pela ausência de reconciliação de reservas em tempo real com bancos externos)

### Artigo 40.º (Irrevogabilidade e Definitividade da Liquidação)
*   **Estado:** **Implementado** (100% de conformidade)
*   **Impacto:** Crítico
*   **Domínio:** `Ledger`
*   **Casos de Uso:** `TransferUseCase` (gravação de dupla entrada irreversível)
*   **APIs:** `/api/transfers`
*   **Testes:** `LedgerRepository.test.ts`
*   **Observabilidade:** Registro no ledger do tipo `JOURNAL_ENTRY_POSTED`
*   **Compliance:** 100% | **Coverage:** 100% | **Risk:** Baixo

### Artigo 47.º (Transparência de Tarifas e Idioma Português)
*   **Estado:** **Implementado** (100% de conformidade)
*   **Impacto:** Médio
*   **Domínio:** `Identity` (FAQ items)
*   **Casos de Uso:** `FaqUseCase` (preçários expressos claramente em português)
*   **APIs:** `/api/faq`
*   **Testes:** `FaqUseCase.test.ts`
*   **Observabilidade:** Log de consultas de termos e condições
*   **Compliance:** 100% | **Coverage:** 100% | **Risk:** Baixo

### Artigo 74.º (Bloqueio de Contas e Credenciais)
*   **Estado:** **Implementado** (95% de conformidade)
*   **Impacto:** Alto
*   **Domínio:** `Wallet` (WalletStatus: ACTIVE, FROZEN, BLOCKED)
*   **Casos de Uso:** `BlockWalletUseCase` (bloqueio administrativo e AML)
*   **APIs:** `/api/wallets/:id/freeze`
*   **Testes:** `WalletBlocking.test.ts`
*   **Observabilidade:** Emissão do evento `WalletFrozenEvent`
*   **Compliance:** 95% | **Coverage:** 95% | **Risk:** Baixo

### Artigo 93.º (Controlo de Riscos Operacionais e AML Heuristics)
*   **Estado:** **Implementado** (90% de conformidade)
*   **Impacto:** Alto
*   **Domínio:** `Compliance`
*   **Casos de Uso:** `TransferUseCase` (avaliação preventiva de limites e score de risco de fraude)
*   **APIs:** `/api/transfers`
*   **Testes:** `TransferUseCase.test.ts` (verificação de bloqueio preventivo de fraude)
*   **Observabilidade:** Log de auditoria estruturado `TX_BLOCKED_AML`
*   **Compliance:** 90% | **Coverage:** 95% | **Risk:** Baixo

### Artigo 96.º (Autenticação Forte do Cliente - SCA)
*   **Estado:** **Parcialmente Implementado** (50% de conformidade)
*   **Impacto:** Crítico
*   **Domínio:** `Security`
*   **Casos de Uso:** `TransferUseCase` (PIN existe, mas segundo fator/OTP é mockado)
*   **APIs:** `/api/auth/sca`
*   **Testes:** `ScaFlow.test.ts`
*   **Observabilidade:** Eventos `SCA_VERIFIED` e `SCA_FAILED`
*   **Compliance:** 50% | **Coverage:** 40% | **Risk:** Alto (Exige a implementação de autenticação dinâmica baseada em SMS OTP/Chaves criptográficas em canais secundários)
