# Contexto Delimitado de Carteiras (`domain/wallet`) — KwanzaMóvel

Responsável por encapsular o estado, limites, ciclo de vida e operações financeiras das carteiras digitais dos utilizadores do KwanzaMóvel, sob regras estritas do Banco Nacional de Angola (BNA).

## 🧱 Arquitetura e Estrutura de Subdiretórios

Alinhado perfeitamente com os preceitos de Domain-Driven Design (DDD) e a Constituição de Engenharia, este contexto é estruturado em:

```text
domain/wallet/
├── entities/
│   └── Wallet.ts              # Agregado Root (Entidade Principal)
├── value-objects/
│   ├── KYCTier.ts             # Regras de Nível KYC e Limites BNA
│   └── WalletStatus.ts        # Estados da Carteira (Active, Frozen, Suspended)
├── services/
│   └── TransferDomainService.ts # Serviço de Domínio de Transferência entre Carteiras
├── repositories/
│   └── WalletRepository.ts    # Contrato (Interface) de Repositório de Domínio
└── events/
    └── WalletEvents.ts        # Eventos de Domínio do Ciclo de Vida da Carteira
```

---

## 📋 Responsabilidades Técnicas

### 1. Agregado Root (`entities/Wallet.ts`)
*   Representa a identidade financeira soberana do utilizador, encapsulando saldo operacional (`balance`), saldo reservado (`reservedBalance`), nível regulatório (`tier`), status de segurança (`status`) e limites.
*   **Ações de Domínio Imutáveis**:
    *   `deposit(amount)`: Acrescenta fundos à carteira, bloqueando depósitos se a conta estiver congelada/suspensa.
    *   `withdraw(amount)`: Deduz fundos seguros do saldo disponível.
    *   `reserve(amount)`: Transfere fundos livres para reservas de transação pendente (escrow/partidas-dobradas).
    *   `release(amount)`: Libera fundos reservados de volta para a carteira disponível.
    *   `freeze(reason)` / `unfreeze()`: Controla o estado de compliance e segurança operacional.
    *   `canTransfer(amount, spentToday)`: Valida se o montante respeita o saldo e os limites de segurança diários.

### 2. Objetos de Valor (`value-objects/`)
*   **`KYCTier.ts`**: Define as faixas de compliance regulatório estabelecidas pelo BNA:
    *   **Level-1**: Limite diário de 50.000,00 Kz.
    *   **Level-2**: Limite diário de 500,000,00 Kz.
    *   **Level-3**: Limite diário de 10.000.000,00 Kz.
*   **`WalletStatus.ts`**: Impede que carteiras com restrições (`FROZEN`, `SUSPENDED`) realizem saques, transferências ou transações financeiras ativas.

### 3. Serviço de Domínio (`services/TransferDomainService.ts`)
*   Responsável pela orquestração atômica de transações P2P envolvendo mais de uma carteira. Garante que os débitos e créditos sejam executados de forma íntegra e com reversão automática (*rollback*) em caso de falha de qualquer ponta transacional.

### 4. Eventos de Domínio (`events/WalletEvents.ts`)
*   Eventos leves disparados para reações externas (ex: `WalletCreatedEvent`, `FundsDepositedEvent`, `FundsWithdrawnEvent`, `FundsReservedEvent`, `FundsReleasedEvent`, `WalletFrozenEvent`).

---

## 🚫 Agnosticismo de Infraestrutura e Frameworks

As regras contidas neste diretório não conhecem:
- Tabelas do PostgreSQL ou esquemas do Drizzle (`WalletTable`, etc.).
- Rotas ou controladores do Express HTTP.
- O formato de persistência física (se os saldos estão gravados no Firestore ou em arquivos).

Toda a lógica é testável de forma unitária pura, instanciando objetos e executando validações em memória de forma determinística.
