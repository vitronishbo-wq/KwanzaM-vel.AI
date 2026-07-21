# LSPA — Regime Sancionatório e Multas (Sanctions)
> **Gravidade Legal:** Penalizações do BNA por não conformidade técnica

---

## I. INTRODUÇÃO
O incumprimento dos limites transacionais, obrigações de salvaguarda ou falhas na prestação de relatórios sujeita o KwanzaMóvel a sanções gravíssimas emitidas pelo **Banco Nacional de Angola (BNA)** nos termos do **Capítulo VI (Regime Sancionatório)** da Lei 40/20.

---

## II. MATRIZ DE CONTRAVENÇÕES E MULTAS (Artigo 109.º)

### 1. Violação de Limites de KYC e Perfis Operacionais
*   **Artigo Conectado:** Artigo 109.º da Lei 40/20 e Artigo 18.º do Aviso n.º 03/22.
*   **Gravidade:** Muito Grave.
*   **Multa Aplicável:** Kz 1.000.000,00 a Kz 510.000.000,00 (dependendo do grau de dolo ou reincidência).
*   **Impacto de Engenharia:** Suspensão imediata da licença de emissão de moeda eletrónica pelo BNA.
*   **Mitigação:** Regras rígidas de controle por `RuleEvaluator` e bloqueio na camada do domínio.

### 2. Falta de Lastro Fiduciário (Emissão Sem Salvaguarda)
*   **Artigo Conectado:** Artigo 110.º da Lei 40/20 (Contravenções especialmente graves).
*   **Gravidade:** Crítica (Crime contra o sistema financeiro).
*   **Penalização:** Encerramento compulsivo da instituição, multas administrativas adicionais e responsabilização criminal dos administradores e desenvolvedores envolvidos.
*   **Impacto de Engenharia:** Verificação rigorosa em testes contínuos de integridade de balanço no ledger.

### 3. Inexistência de Canais de Bloqueio 24/7 (Artigo 74.º)
*   **Artigo Conectado:** Artigo 109.º da Lei 40/20.
*   **Gravidade:** Grave.
*   **Multas Aplicáveis:** Kz 350.000,00 a Kz 170.000.000,00.
*   **Impacto de Engenharia:** Obrigação de manter alta disponibilidade operacional no Cloud Run com rotas públicas para congelamento instantâneo de contas (`POST /api/wallets/:id/freeze`).
