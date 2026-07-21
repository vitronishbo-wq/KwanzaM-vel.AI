# LSPA — Participantes do Sistema de Pagamentos (Artigos 8.º a 10.º)
> **Governação de Ecossistema:** Definição formal das classes de atores autorizados

---

## I. ENQUADRAMENTO JURÍDICO
O **Artigo 8.º (Princípio da exclusividade)** estabelece as classes de entidades autorizadas a prestar serviços de pagamento em Angola:
1.  Bancos comerciais com sede em Angola.
2.  Instituições Financeiras Não Bancárias de Serviços de Pagamentos (como o KwanzaMóvel).
3.  Entidades prestadoras do Serviço Postal Universal.
4.  O Banco Nacional de Angola (BNA).

---

## II. MODELAGEM DOS PARTICIPANTES DO SISTEMA

No KwanzaMóvel, os participantes dividem-se em dois grandes blocos arquiteturais:

```text
                  ┌───────────────────────────────┐
                  │ BNA (Regulador & Supervisor)  │
                  └──────────────┬────────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
     ┌──────────────────────┐        ┌──────────────────────┐
     │   Payment Service    │        │  Third-Party Banks   │
     │   Provider (PSP)     │        │    (Lastro real)     │
     │    [KwanzaMóvel]     │        └──────────────────────┘
     └───────────┬──────────┘
                 │
         ┌───────┴───────┐
         ▼               ▼
     [ Agente ]     [ Cliente ]
```

---

## III. MATRIZ DE PARTICIPANTES E SEU DESIGN DE ENGENHARIA

### 1. Prestador de Serviços de Pagamento (KwanzaMóvel)
*   **Papel:** Emissor de moeda eletrónica, custodiante de saldos digitais e orquestrador do ledger.
*   **Implementação:** Representado pela aplicação server-side (`backend/server.ts`).
*   **Invariante:** O valor total de e-money em circulação deve ser exatamente correspondente às reservas custodiadas nos bancos parceiros.

### 2. Agente de Pagamento (Correspondente)
*   **Papel:** Ponto físico autorizado para captação de depósitos e execução de levantamentos.
*   **Implementação:** Mapeado no domínio do KwanzaMóvel como extensão da entidade `Merchant`.
*   **Controles:** Limites diários de caixa para evitar acumulação perigosa de fundos fiduciários sem reconciliação.

### 3. Cliente (Ordenante e Beneficiário)
*   **Papel:** Detentor da conta de moeda eletrónica final.
*   **Implementação:** Representado por `UserIdentity` e `Wallet`.
*   **Controles:** Níveis de KYC com base no cadastro de identidade (Bilhete de Identidade / BI de Angola).
