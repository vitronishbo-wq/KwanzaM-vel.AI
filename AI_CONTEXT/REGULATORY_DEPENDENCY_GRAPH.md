# KwanzaMóvel Regulatory Dependency Graph (RDG)
> **Hierarquia:** Regulamentos ──► Domínio de Regras ──► Casos de Uso do Negócio

---

## I. FLUXO DE DEPENDÊNCIAS DE COMPLIANCE

Nenhuma funcionalidade do KwanzaMóvel pode operar sem herdar as invariantes de conformidade garantidas pelo núcleo regulatório. O gráfico de dependências lógicas distribui-se da seguinte forma:

```text
    [ BNA Regulatory Kernel (Documentação) ]
                    │
                    ▼
    [ backend/regulatory/RuleRegistry.ts ] ──► (Gere chaves e valores legais)
                    │
       ┌────────────┴────────────┐
       ▼                         ▼
  [ RuleResolver ]         [ RuleEvaluator ]
       │                         │
       ▼                         ▼
  [ KYCTier.ts ]           [ TransferUseCase.ts ]
  [ Wallet.ts ]            [ MerchantPaymentUseCase.ts ]
```

---

## II. INTERDEPENDÊNCIA DE EDICÕES (MATRIZ DE IMPACTO)

1.  **Modificações no `RuleRegistry`:**
    *   **Impacto:** Crítico. Altera os valores dos limites diários do sistema e as taxas padrão de comerciantes.
    *   **Verificação:** Exige linter imediato (`npm run lint`) e remontagem preventiva com `compile_applet`.

2.  **Modificações nas Regras do BNA (Avisos):**
    *   **Impacto:** Alto. Requer alteração de versão no `RuleVersionManager.ts` e alteração correspondente no `RuleRegistry.ts`.
    *   **Verificação:** Executar testes jurídicos e de limites para verificar retrocompatibilidade.
