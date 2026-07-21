# LSPA — Artigo 2.º: Definições e Alinhamento com o Domínio
> **Mapeamento Conceitual:** Termos Legais do BNA ──► Objetos de Domínio do KwanzaMóvel

---

## I. GLOSSÁRIO DE CONCEITOS LEGAIS (Artigo 2.º)

### 1. Moeda Eletrónica (pp)
*   **Definição Legal:** Valor monetário representado por um crédito sobre o emissor, emitido sob receção de fundos, com o fim de efetuar operações de pagamento, aceite por pessoa singular ou coletiva diferente do emissor.
*   **Domínio KwanzaMóvel:** Representado na entidade `Wallet` e no agregado `JournalEntry`. O saldo de moeda eletrónica é medido em subunidades (cêntimos) usando `bigint` para preservar precisão absoluta (zero floats).

### 2. Conta de Pagamento (o)
*   **Definição Legal:** Conta detida em nome de um ou mais utilizadores de serviços de pagamento, utilizada para a execução de operações de pagamento.
*   **Domínio KwanzaMóvel:** Implementado como `Wallet` e mapeado na base de dados no esquema `wallets`. É a carteira eletrónica do utilizador.

### 3. Autenticação Forte do Cliente (SCA) (h)
*   **Definição Legal:** Autenticação baseada na utilização de dois ou mais elementos pertencentes às categorias de conhecimento, posse e inerência, que são mutuamente independentes de tal forma que a violação de um não comprometa a fiabilidade dos outros.
*   **Domínio KwanzaMóvel:** Controlado pelo subsistema `Security` e validado em use cases via `ScaService` ou PIN hashing.

### 4. Instrumento de Pagamento (gg)
*   **Definição Legal:** Dispositivo personalizado ou conjunto de procedimentos acordados entre o utilizador e o prestador de serviços de pagamento, utilizado por este para iniciar uma ordem de pagamento.
*   **Domínio KwanzaMóvel:** Implementado em value objects do telemóvel associados às chaves de assinatura e sessões criptográficas da `Wallet`.

### 5. Agente (c)
*   **Definição Legal:** Pessoa singular ou coletiva que presta serviços de pagamento em nome de um prestador de serviços de pagamento.
*   **Domínio KwanzaMóvel:** Representado como a entidade `Agent` (ou correspondente de saque/depósito fiduciário).

---

## II. CATÁLOGO DE OBJETOS DO DOMÍNIO REGULATÓRIO

Este catálogo liga cada termo explícito da Lei 40/20 ao correspondente objeto de arquitetura no KwanzaMóvel:

| Conceito Legal | Objeto Arquitetura | Tipo de Componente | Use Cases Relacionados | Responsabilidade Principal |
| :--- | :--- | :--- | :--- | :--- |
| **Banco Central** | `BNA` | External Actor / Gateway | `AuditTrailUseCase` | Fiscalizador e regulador soberano das regras financeiras. |
| **Conta de Pagamento** | `Wallet` | Aggregate Root | `TransferUseCase`, `DepositUseCase` | Mantém saldos de e-Money e controles de Tiers KYC. |
| **Utilizador** | `UserIdentity` | Aggregate Root | `RegisterUserUseCase`, `ApproveKycUseCase` | Guarda dados cadastrais e o nível ativo de KYC (Tier). |
| **Comerciante** | `Merchant` | Aggregate Root | `MerchantPaymentUseCase` | Lojista habilitado com taxa MDR em basis points (bps). |
| **Correspondente** | `Agent` | Entity | `AgentOperationsUseCase` | Facilita operações presenciais de Cash-In e Cash-Out. |
| **Moeda Eletrónica** | `Money` | Value Object | Todos | Representação monetária segura e imutável de Kwanzas (AOA). |
| **Razão Fiduciário** | `Ledger` | Infrastructure Domain | `TransferUseCase` | Registro cronológico, imutável e de dupla entrada de transações. |
| **Ordem de Pagamento** | `Transaction` | Entity | `TransferUseCase` | Instrução de movimentação de fundos assinada eletronicamente. |
| **Autenticação SCA** | `ScaSession` | Value Object / Session | `VerifyScaUseCase` | Controle multifator de login e autorizações de limites altos. |
| **Incidente Operacional** | `IncidentLog` | Entity | `IncidentReporterUseCase` | Registo estruturado de anomalias críticas para o BNA. |
