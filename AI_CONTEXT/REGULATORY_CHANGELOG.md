# KwanzaMóvel Regulatory Changelog (RCL)
> **Historial de Sincronização Legislação-Código**

---

## [1.0.0] - 2026-07-08
### Adicionado
*   **Regulatory Domain Kernel (RDK):** Inicialização da infraestrutura de Law-Driven Architecture orientada às directivas do Banco Nacional de Angola (BNA).
*   **RuleRegistry.ts:** Repositório declarativo centralizado de limites e taxas regulamentadas pelo BNA (Aviso 03/22, 11/20, 10/20).
*   **RuleResolver.ts:** Mecanismo dinâmico de resolução de regras operacionais com base no contexto ativo de carteira e utilitário.
*   **RuleEvaluator.ts:** Avaliador estrito de limites de movimentações para evitar sobrecarga ou hardcoding de regras em Use Cases.
*   **RuleVersionManager.ts:** Motor de controle temporal para herança de regras válidas no momento de execução da transação histórica.
*   **RegulatoryEvents.ts:** Eventos do domínio regulatório disparados em violações de limite e bloqueio AML, promovendo auditoria ativa.

### Alterado
*   **KYCTier.ts:** Desacoplamento total de limites diários numéricos hardcoded. Agora, o value object consulta a fonte soberana `RuleRegistry` para obter limites por Tier (Aviso 03/22 Artigo 18).
*   **TransferUseCase.ts:** Substituição de limites escritos manualmente por consulta ao `RuleRegistry` e avaliação via `RuleEvaluator.ts`.
