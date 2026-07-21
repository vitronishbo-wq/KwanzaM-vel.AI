# KwanzaMóvel Regulatory Roadmap (L40/20)
> **Roadmap de Engenharia:** Planeamento de Implementação Orientado a Leis (Law-Driven Development)

---

## I. INTRODUÇÃO
Este planeamento organiza o desenvolvimento de funcionalidades no KwanzaMóvel sob um regime estrito de **Law-Driven Development (LDD)**. Cada funcionalidade é entregue sob o selo de um artigo específico da **Lei n.º 40/20 (LSPA)**, minimizando o risco regulatório e maximizando a rastreabilidade.

---

## II. FASES DO PLANEAMENTO REGULATÓRIO

```text
  [ FASE L40.1: Core de Compliance ] ──► [ FASE L40.2: Autenticação SCA ] ──► [ FASE L40.3: Correspondentes ]
                 │                                      │                                      │
                 ▼                                      ▼                                      ▼
           (Art. 3.º & 40.º)                        (Art. 96.º)                            (Art. 18.º)
```

---

### FASE L40.1 — Estabilização do Core de Compliance (Segurança e Lastro)
*   **Artigos Alvo:** Artigo 3.º (Segurança), Artigo 40.º (Irrevogabilidade), Artigo 2.º alínea pp) (Lastro de Moeda Eletrónica).
*   **Objetivos Técnicos:**
    *   Assegurar integridade absoluta do Ledger imutável de dupla entrada.
    *   Estabelecer a API de reconciliação de lastro em tempo real.
*   **Módulos Impactados:** `Ledger`, `Settlement`.
*   **Prazo Estimado:** Sprint 1.

### FASE L40.2 — Implementação de Autenticação Forte (SCA)
*   **Artigos Alvo:** Artigo 2.º alínea h) (Definição de SCA), Artigo 96.º (Obrigatoriedade de SCA), Artigo 74.º (Segurança das Credenciais).
*   **Objetivos Técnicos:**
    *   Criar mecanismo de OTP dinâmico de posse associado a transações acima do limite básico de segurança.
    *   Integrar fluxo de confirmação multifator no `TransferUseCase`.
*   **Módulos Impactados:** `Security`, `Wallet`, `Application UseCases`.
*   **Prazo Estimado:** Sprint 2.

### FASE L40.3 — Rede de Correspondentes e Agentes de Pagamento
*   **Artigos Alvo:** Artigo 18.º (Contratação de Agentes de Pagamento), Artigo 4.º (Serviços Autorizados).
*   **Objetivos Técnicos:**
    *   Expandir o Agregado `Merchant` para suportar credenciamento de correspondentes fiduciários (Agentes).
    *   Introduzir limites diários e mensais operacionais dedicados para transações de depósito e levantamento de correspondentes.
*   **Módulos Impactados:** `Merchant`, `Wallet`.
*   **Prazo Estimado:** Sprint 3.

### FASE L40.4 — Relatório Automatizado de Incidentes e Auditoria BNA
*   **Artigos Alvo:** Artigo 6.º (Supervisão do BNA), Artigo 93.º (Riscos Operacionais), Artigo 94.º (Relatório de Incidentes).
*   **Objetivos Técnicos:**
    *   Criar o endpoint `/api/regulatory/compliance-dashboard` para visualização das regras ativas do BNA.
    *   Desenvolver motor de exportação de logs de auditoria em conformidade com o formato oficial requerido pelo BNA.
*   **Módulos Impactados:** `Compliance`, `Infrastructure`, `Audit`.
*   **Prazo Estimado:** Sprint 4.

---

## III. CONCLUSÃO
Seguindo este roteiro estruturado, o KwanzaMóvel eleva a sua arquitetura para o nível de conformidade exigido de uma **Instituição Financeira Não Bancária autorizada pelo Banco Nacional de Angola**, oferecendo garantias fiduciárias e digitais robustas aos seus utilizadores e reguladores.
