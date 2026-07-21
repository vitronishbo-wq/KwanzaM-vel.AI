# LSPA — Gestão de Riscos Operacionais e Conformidade (Risks)
> **Controlo Preventivo:** Avaliação e mitigação de vulnerabilidades regulatórias

---

## I. INTRODUÇÃO
O **Artigo 93.º (Gestão de riscos operacionais e de segurança)** impõe que o prestador de serviços de pagamento implemente controlos automáticos e heurísticas para antecipar, mitigar e auditar desvios ou riscos operacionais graves.

---

## II. MATRIZ DE RISCOS REGULATÓRIOS

### 1. Risco de Insolvência e Quebra de Lastro (Risco Financeiro)
*   **Artigo Conectado:** Artigo 20.º do Aviso n.º 03/22.
*   **Ameaça:** O emissor criar saldo digital de Kwanzas "do nada" (por falha de concorrência ou brechas sistémicas) sem correspondente depósito bancário real de lastro.
*   **Mitigação:** Algoritmos imutáveis no `TransferUseCase` de dupla entrada de depósitos. Execução periódica de reconciliações e testes automáticos de igualdade contábil (`sum(debits) == sum(credits)`).

### 2. Risco de Fraude e Usurpação de Identidade (Risco de Segurança)
*   **Artigo Conectado:** Artigos 74.º e 96.º da Lei 40/20.
*   **Ameaça:** Ataques de força bruta no PIN ou movimentação atípica de capital por invasão de conta.
*   **Mitigação:**
    *   Exigência de Autenticação Forte (SCA) baseada em múltiplos fatores dinâmicos (PIN + OTP via SMS/OTP).
    *   Bloqueio temporário imediato da conta após 3 tentativas consecutivas incorretas de PIN.

### 3. Risco de Branqueamento de Capitais e Fraudes Sistémicas (Risco de Compliance / AML)
*   **Artigo Conectado:** Aviso n.º 11/20 (Normas AML/CFT).
*   **Ameaça:** Fracionamento de transferências para fugir dos limites regulamentares por nível KYC (Structuring).
*   **Mitigação:**
    *   Cálculo contínuo do volume gasto diário acumulado (`spentToday`) antes da autorização de cada transferência.
    *   Motor de score heurístico integrado (`fraudScore > 80` gera bloqueio preventivo e alerta imediato de auditoria).
