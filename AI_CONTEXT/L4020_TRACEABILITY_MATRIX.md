# KwanzaMóvel Regulatory Traceability Matrix (L40/20)
> **Matriz de Rastreabilidade:** Da legislação de Angola ao código de engenharia do KwanzaMóvel

---

## I. INTRODUÇÃO
A Matriz de Rastreabilidade Regulatória assegura que cada imperativo legal definido na **Lei n.º 40/20 (LSPA)** possui uma linha de herança clara de implementação no código, logs de auditoria e testes de verificação.

---

## II. MATRIZ DE RASTREABILIDADE JURÍDICO-TÉCNICA

| Lei | Artigo | Descrição da Obrigação | Contexto Domínio | Agregado / Entidade | Caso de Uso | Rota API / Entrada | Logs & Telemetria | Ficheiros de Teste | Dashboard Regulador |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Lei 40/20** | **Art. 3.º** | Garantir a segurança física e digital das ordens de transferência | `Security` | `Wallet`, `JournalEntry` | `TransferUseCase` | `POST /api/transfers` | `TX_BLOCKED_LIMIT`, `correlationId` | `TransferUseCase.test.ts` | Indicador de Integridade do Ledger |
| **Lei 40/20** | **Art. 4.º** | Prestação de serviços de depósito e levantamento regulados | `Wallet` | `Wallet` | `DepositUseCase`, `WithdrawalUseCase` | `POST /api/wallets/deposit` | `WALLET_DEPOSIT`, `WALLET_WITHDRAWAL` | `Wallet.test.ts` | Estatísticas de Fluxo Operacional (M1) |
| **Lei 40/20** | **Art. 18.º** | Contratação de correspondentes / Agentes de Pagamento | `Merchant` | `Merchant` / `Agent` | `RegisterMerchantUseCase` | `POST /api/merchants` | `MERCHANT_REGISTERED`, `MdrRate` verification | `Merchant.test.ts` | Mapa de Agentes de Pagamento Ativos |
| **Lei 40/20** | **Art. 40.º** | Carácter definitivo e irrevogável da liquidação no Ledger | `Ledger` | `JournalEntry` | `TransferUseCase` | `POST /api/transfers` | `JOURNAL_ENTRY_POSTED`, zero-float validation | `LedgerRepository.test.ts` | Balanço Consolidado Ativo |
| **Lei 40/20** | **Art. 47.º** | Transparência de preçários e termos em Português de Angola | `Identity` | `FaqItem` | `FaqUseCase` | `GET /api/faq` | `FAQ_ACCESSED` | `FaqUseCase.test.ts` | Log de Conformidade do Consumidor |
| **Lei 40/20** | **Art. 68.º** | Verificação de consentimento explícito em operações | `Wallet` | `Wallet` | `TransferUseCase` | `POST /api/transfers` | `CONSENT_VERIFIED`, `signatureTimestamp` | `TransferUseCase.test.ts` | Registo de Assinaturas de Consentimento |
| **Lei 40/20** | **Art. 74.º** | Bloqueio imediato 24/7 de credenciais por roubo ou perda | `Security` | `Wallet` | `BlockWalletUseCase` | `POST /api/wallets/:id/freeze` | `WALLET_FROZEN`, `AML_BLOCK_TRIGGERED` | `Wallet.test.ts` | Painel de Contas Bloqueadas / Sanções |
| **Lei 40/20** | **Art. 93.º** | Estabelecer sistemas de controlo de risco operacional e AML | `Compliance` | `Wallet`, `AuditLog` | `TransferUseCase` (AML score) | `POST /api/transfers` | `TX_BLOCKED_AML`, `fraudScore` | `TransferUseCase.test.ts` | Indicador de Risco AML Consolidado |
| **Lei 40/20** | **Art. 96.º** | Aplicação de Autenticação Forte do Cliente (SCA) | `Security` | `ScaSession` | `VerifyScaUseCase` | `POST /api/auth/sca` | `SCA_VERIFIED`, `SCA_FAILED` | `ScaUseCase.test.ts` | Métrica de Tentativas SCA e Falhas |

---

## III. RESOLUÇÃO HISTÓRICA POR AUDITORES
Caso um auditor regulatório do **BNA** questione a plataforma sobre a conformidade de uma transação específica:

1.  O sistema extrai o `correlationId` ou `traceId` da transação.
2.  Cruza o log com a chave da regra ativa no momento de execução da transação (ex: `BNA-A0322-ART18-LIMIT-L1`).
3.  Determina que a regra decorre do **Artigo 18.º do Aviso 03/22** e do **Artigo 3.º da Lei 40/20** (Segurança e Limites).
4.  Gera o relatório de conformidade criptográfica atestando que a validação foi executada com base no estado legítimo do domínio na data indicada.
