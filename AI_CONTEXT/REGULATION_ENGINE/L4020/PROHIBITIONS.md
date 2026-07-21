# LSPA — Proibições e Restrições do Sistema (Prohibitions)
> **Defesa Fiduciária:** Práticas estritamente vedadas sob os normativos do BNA

---

## I. ENQUADRAMENTO JURÍDICO
Para assegurar a estabilidade macroeconómica de Angola e a integridade fiduciária das Instituições Financeiras Não Bancárias de Serviços de Pagamentos, a Lei 40/20 elenca um conjunto de práticas estritamente proibidas, as quais devem ser implementadas como invariantes de domínio rígidas no código do KwanzaMóvel.

---

## II. MATRIZ DE PROIBIÇÕES DO DOMÍNIO

### 1. Proibição de Atribuição de Juros sobre Moeda Eletrónica [Artigo 101.º]
*   **O que a Lei proíbe:** É expressamente proibida a atribuição de juros ou de qualquer outro benefício financeiro associado ao tempo de permanência de saldos em carteiras de moeda eletrónica (e-Money).
*   **Mapeamento de Engenharia:**
    *   *Aggregate:* `Wallet`
    *   *Invariante:* A carteira é um depósito fiduciário à ordem estéril. Não há rotinas, cron-jobs ou algoritmos capazes de incrementar o saldo de forma passiva com base em taxas de juro diárias ou mensais.
    *   *Verificação:* Testes automáticos verificam que o saldo de uma conta inativa permanece inalterável em subunidades por tempo indeterminado.

### 2. Proibição de Execução de Saldos Negativos (Descobertos) [Artigo 20.º]
*   **O que a Lei proíbe:** Um prestador de serviços de pagamento não pode conceder crédito ou descobertos em contas de moeda eletrónica. Cada transação deve possuir 100% de lastro em saldo real no momento de sua emissão.
*   **Mapeamento de Engenharia:**
    *   *Aggregate:* `Wallet`
    *   *Invariante:* `canTransfer(amount) => balance >= amount`
    *   *Verificação:* O `TransferDomainService` impede qualquer saldo menor que zero, rejeitando a operação na raiz com exceção de domínio puro (`InsufficientFundsException`).

### 3. Proibição de Cobrança de Taxas MDR Abusivas (Teto Aviso 10/20)
*   **O que a Lei proíbe:** Práticas abusivas ou acima dos tetos de comissões autorizados pela tabela regulada do BNA.
*   **Mapeamento de Engenharia:**
    *   *Aggregate:* `Merchant`
    *   *Invariante:* `RuleEvaluator.evaluateMdrFee(mdrRateBps) => mdrRateBps <= MaxAllowedBps (250n / 2.50%)`
    *   *Verificação:* A criação ou alteração de lojistas com taxas acima de 250 pontos base (bps) é barrada preventivamente no agregador do domínio, gerando o evento `RegulatoryMdrViolationEvent`.
