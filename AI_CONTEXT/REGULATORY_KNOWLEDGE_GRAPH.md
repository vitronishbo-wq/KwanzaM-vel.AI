# KwanzaMóvel Regulatory Knowledge Graph (RKG)
> **Mapeamento:** Legislação ──► Casos de Uso ──► Elementos de Engenharia

---

## I. ENGENHARIA MAPAL DE CONFORMIDADE

O grafo regulatório liga os diplomas do Banco Nacional de Angola (BNA) aos ficheiros de código que executam as suas directivas:

```text
               [ Aviso 03/22 (Moeda Eletrónica) ]
                        │
       ┌────────────────┴────────────────┐
       ▼ (Artigo 18 - Limites)           ▼ (Artigo 20 - Lastro de Salvaguarda)
  [ RuleRegistry ]                  [ SettlementAggregate ]
       │                                 │
       ▼ (Resolução de Limites)          ▼ (Cálculos de Lastro)
  [ KYCTier.ts ]                    [ SettlementBatch.ts ]
       │                                 │
       ▼ (Verificações de Saldo)         ▼ (Validação de Liquidez)
  [ Wallet.ts ] ──────────────────► [ double-entry balance check ]
```

---

## II. RELACIONAMENTOS DO GRAFO COGNITIVO

### Nó 1: Aviso 03/22 (Meios de Pagamento Móveis e Contas Simplificadas)
*   **Aresta `LIMITS`:** Conecta ao `RuleRegistry.ts` (id: `BNA-A0322-ART18-L1`, `BNA-A0322-ART18-L2`, `BNA-A0322-ART18-L3`).
*   **Aresta `KYC_TIER`:** Conecta ao value object `KYCTier.ts` para determinar limites regulados sem hardcoding.
*   **Aresta `CUSTODY`:** Conecta ao agregado `SettlementBatch` e `SettlementService` para assegurar que cada Kwanza digital possui 100% de lastro em conta fiduciária real.

### Nó 2: Aviso 11/20 (Compliance AML/CFT)
*   **Aresta `SANCTIONS`:** Conecta ao `UserIdentity` e `Wallet` para gerir bloqueios cautelares (`freeze()` / `unfreeze()`).
*   **Aresta `FRAUD_DETECTION`:** Conecta ao `TransferUseCase` e ao motor heurístico que pontua transferências atípicas (AML Score).

### Nó 3: Aviso 10/20 (Transparência de Tarifas)
*   **Aresta `COMMISSIONS`:** Conecta ao `Merchant` e `MerchantPaymentUseCase` para garantir que taxas MDR calculadas via `multiplyBps` cumpram a regulação do BNA de forma transparente e livre de floats.
