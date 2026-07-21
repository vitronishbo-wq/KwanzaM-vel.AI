# LSPA — Matriz de Rastreabilidade Técnica Completa (Traceability)
> **Lineage Traceability:** Ligando o texto da Lei n.º 40/20 ao código executável do KwanzaMóvel

---

## I. INTRODUÇÃO
A rastreabilidade técnica garante que qualquer auditor do BNA consiga auditar a implementação do sistema com total visibilidade do fluxo jurídico-técnico de dados.

---

## II. LINHA DE HERANÇA REGULATÓRIA (LINEAGE)

A herança regulatória segue o padrão formal:
`Lei n.º 40/20` ──► `Capítulo` ──► `Artigo` ──► `Requisito` ──► `Domínio` ──► `Caso de Uso` ──► `API Rota` ──► `Métricas & Logs` ──► `Testes Unitários`.

---

## III. MATRIZ DE RASTREABILIDADE TÉCNICA

### L4020-TR-01: Irrevogabilidade de Saldos Ledger [Artigo 40.º]
*   **Artigo:** Artigo 40.º (Caráter definitivo da liquidação).
*   **Módulo Domínio:** `/backend/domain/ledger/`
*   **Aggregate Root:** `JournalEntry` (Lançamento contábil de dupla entrada).
*   **Caso de Uso:** `TransferUseCase`
*   **API Rota:** `POST /api/transfers`
*   **Logs de Auditoria:** `JOURNAL_ENTRY_POSTED` contendo `correlationId` e `traceId`.
*   **Testes:** `LedgerRepository.test.ts`
*   **Ponto de Verificação (Auditor):** Constatação de que não existem métodos `UPDATE` ou `DELETE` no Ledger Repository (imutabilidade garantida ao nível do código).

### L4020-TR-02: Bloqueio Preventivo por KYC [Artigos 3.º e 18.º do Aviso 03/22]
*   **Artigo:** Artigo 3.º (Segurança e limites regulamentados).
*   **Módulo Domínio:** `/backend/regulatory/` e `/backend/domain/wallet/`
*   **Aggregate Root:** `Wallet` (Carteira) e value object `KYCTier`.
*   **Caso de Uso:** `TransferUseCase`
*   **API Rota:** `POST /api/transfers`
*   **Logs de Auditoria:** `TX_BLOCKED_LIMIT` com detalhes de limites diários estourados por Tier.
*   **Testes:** `TransferUseCase.test.ts` (Teste de comportamento de estouro de limite).
*   **Ponto de Verificação (Auditor):** Chamada de validação dinâmica ao `RuleEvaluator.evaluateDailyLimit` que herda os tetos fiduciários do `RuleRegistry`.

### L4020-TR-03: Bloqueio Administrativo por Sanção [Artigo 74.º]
*   **Artigo:** Artigo 74.º (Obrigações de bloqueio cautelar 24/7).
*   **Módulo Domínio:** `/backend/domain/wallet/`
*   **Aggregate Root:** `Wallet`
*   **Caso de Uso:** `BlockWalletUseCase`
*   **API Rota:** `POST /api/wallets/:phone/freeze`
*   **Logs de Auditoria:** `WALLET_FROZEN` registando data, hora, motivo e ID do administrador fiscalizador.
*   **Testes:** `WalletBlocking.test.ts`
*   **Ponto de Verificação (Auditor):** Constatação de que carteiras com status `FROZEN` rejeitam qualquer transação no `TransferDomainService` antes de atingir as camadas de persistência.
