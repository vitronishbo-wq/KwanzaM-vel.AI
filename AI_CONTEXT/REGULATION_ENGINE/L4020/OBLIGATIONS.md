# LSPA — Catálogo de Obrigações Regulatórias (Obligations)
> **Controlo Interno:** O que deve ser cumprido, como é validado e como é testado

---

## I. INTRODUÇÃO
A conformidade do KwanzaMóvel assenta num catálogo estrito de obrigações legais derivadas da Lei 40/20. Cada obrigação deve possuir responsáveis de execução, métodos de validação automática e evidências observáveis.

---

## II. TABELA DE OBRIGAÇÕES REGULATÓRIAS (OBLIGATIONS)

### L4020-OB-01: Garantia de Lastro Fiduciário (Salvaguarda de Fundos) [Artigo 20.º]
*   **Obrigação:** Manter 100% do saldo de moeda eletrónica emitido sob a forma de depósitos fiduciários em bancos comerciais autorizados.
*   **Quem Cumpre:** `SettlementDomainService`
*   **Quem Valida:** `SettlementAggregate` (Reconciliação diária de balanço)
*   **Quem Audita:** BNA (via exportações regulares e painel regulador)
*   **Onde está Implementada:** `/backend/domain/settlement/`
*   **Como é Testada:** `SettlementReconciliation.test.ts` (validação de igualdade de balanço)
*   **Como é Monitorizada:** Alertas de discrepância entre e-Money emitido e saldo em contas fiduciárias no Compliance Dashboard.

### L4020-OB-02: Bloqueio Imediato 24/7 por Perda de Credenciais [Artigo 74.º]
*   **Obrigação:** Fornecer meios gratuitos e céleres para o utilizador notificar o extravio ou roubo do instrumento de pagamento, procedendo ao bloqueio imediato da conta.
*   **Quem Cumpre:** `WalletService` / `BlockWalletUseCase`
*   **Quem Valida:** `Wallet.freeze()` (Invariante de bloqueio de transação)
*   **Quem Audita:** Direção de Operações do KwanzaMóvel e BNA
*   **Onde está Implementada:** `/backend/domain/wallet/entities/Wallet.ts`
*   **Como é Testada:** `WalletBlocking.test.ts` (verificação de bloqueio de débitos/créditos em carteiras congeladas)
*   **Como é Monitorizada:** Logs com evento `WALLET_FROZEN` gravados instantaneamente no Audit Trail.

### L4020-OB-03: Implementação de Autenticação Forte (SCA) [Artigo 96.º]
*   **Obrigação:** Exigir autenticação baseada em múltiplos fatores independentes para transações ou acessos a dados sensíveis de pagamento.
*   **Quem Cumpre:** `ScaService` / `VerifyScaUseCase`
*   **Quem Valida:** `ScaSession` (Validação de OTP/PIN por canais independentes)
*   **Quem Audita:** Auditores de Segurança da Informação e BNA
*   **Onde está Implementada:** `/backend/security/`
*   **Como é Testada:** `ScaFlow.test.ts` (simulação de tentativas de autenticação com dados corretos/incorretos)
*   **Como é Monitorizada:** Métrica de taxa de rejeição de SCA e logs de bloqueio de tentativas brutas.

### L4020-OB-04: Monitorização de Risco Operacional e Transacional [Artigo 93.º]
*   **Obrigação:** Estabelecer um quadro estruturado de mitigação de riscos operacionais e detecção de anomalias transacionais (Prevenção a fraudes e AML).
*   **Quem Cumpre:** `TransferUseCase` (AML score heuristic)
*   **Quem Valida:** `RuleEvaluator.evaluateDailyLimit()`
*   **Quem Audita:** BNA e Departamento de Riscos
*   **Onde está Implementada:** `/backend/regulatory/RuleEvaluator.ts`
*   **Como é Testada:** `AmlRuleEvaluation.test.ts` (simulação de estouros de limites e pontuação elevada de transações em lote)
*   **Como é Monitorizada:** Gráficos no Dashboard Regulador de pontuação média de transações suspeitas e incidentes contidos.
