# KwanzaMóvel Regulatory Gap Analysis (L40/20)
> **Análise de Lacunas:** Nível de Conformidade Técnica com a Lei do Sistema de Pagamentos de Angola

---

## I. INTRODUÇÃO
Esta análise avalia a aderência do estado corrente do KwanzaMóvel à **Lei n.º 40/20 (LSPA)**, identificando lacunas regulatórias (gaps) que requerem remediação técnica, com indicação de prioridade, impacto e caminho de engenharia.

---

## II. MATRIZ DE ESTADO E LACUNAS

### GAP-01: Autenticação Forte de Cliente (SCA) completa [Artigo 96.º]
*   **Estado:** **Parcialmente Implementado**.
*   **Descrição:** O sistema possui proteção por PIN (fator de conhecimento), mas carece de um segundo fator dinâmico (fator de posse ou inerência) ativo na assinatura de transações de alto valor.
*   **Prioridade:** Crítica (Alta).
*   **Impacto Regulatório:** Altíssimo. A falta de SCA para pagamentos móveis e eletrónicos é uma violação direta das normas de combate à fraude do BNA.
*   **Impacto Arquitetural:** Médio. Requer a introdução de um middleware de segurança e geração de tokens OTP no backend, integrando com o `TransferUseCase`.
*   **Ficheiros Envolvidos:**
    *   `backend/application/usecases/TransferUseCase.ts`
    *   `backend/domain/wallet/entities/Wallet.ts`
    *   `backend/security/ScaService.ts` (a ser criado)
*   **Ordem de Implementação Recomendada:** 1.ª prioritária.

### GAP-02: Gestão Formal de Agentes de Pagamento [Artigo 18.º]
*   **Estado:** **Parcialmente Implementado**.
*   **Descrição:** O KwanzaMóvel possui suporte a lojistas (`Merchant`), mas não distingue claramente o papel do "Agente de Pagamento" (responsável por depósitos e levantamentos físicos em numerário — Cash-In/Cash-Out).
*   **Prioridade:** Alta.
*   **Impacto Regulatório:** Alto. O BNA exige o registo formal e limites específicos para cada agente credenciado.
*   **Impacto Arquitetural:** Alto. Requer a criação de um Agregado de Domínio `Agent` ou expansão estrutural do `Merchant` para herdar comportamentos de agente fiduciário.
*   **Ficheiros Envolvidos:**
    *   `backend/domain/merchant/entities/Merchant.ts`
    *   `backend/domain/merchant/value-objects/AgentStatus.ts` (a ser criado)
    *   `backend/application/usecases/AgentOperationsUseCase.ts` (a ser criado)
*   **Ordem de Implementação Recomendada:** 2.ª prioritária.

### GAP-03: Auditoria Ativa de Lastro Fiduciário em Tempo Real [Artigo 2.º, alínea pp)]
*   **Estado:** **Parcialmente Implementado**.
*   **Descrição:** O sistema garante a integridade individual de cada conta, mas não possui um processo periódico ou contínuo que compare a soma agregada dos saldos de e-Money emitidos com as reservas de salvaguarda reais depositadas (lastro de 100% regulado pelo BNA).
*   **Prioridade:** Média-Alta.
*   **Impacto Regulatório:** Crítico para o BNA. Qualquer emissor de moeda eletrónica deve demonstrar que o e-Money em circulação está totalmente garantido por depósitos bancários reais em contas fiduciárias.
*   **Impacto Arquitetural:** Baixo-Médio. Requer a criação de um serviço periódico (ou endpoint administrativo) que execute um reconciliador de balanço (Reconciliation Engine).
*   **Ficheiros Envolvidos:**
    *   `backend/domain/settlement/services/SettlementDomainService.ts`
    *   `backend/application/usecases/AuditTrailUseCase.ts`
*   **Ordem de Implementação Recomendada:** 3.ª prioritária.

### GAP-04: Relatório de Incidentes Operacionais Graves [Artigo 94.º]
*   **Estado:** **Não Implementado**.
*   **Descrição:** O BNA exige que incidentes de segurança graves sejam reportados num canal ou estrutura pré-definida em menos de 2 horas (ou no prazo oficial). O KwanzaMóvel não possui automação para formatar e alertar sobre incidentes graves.
*   **Prioridade:** Média.
*   **Impacto Regulatório:** Médio.
*   **Impacto Arquitetural:** Baixo. Requer apenas a escuta de eventos críticos de segurança (`SecurityAlertTriggeredEvent`) e gravação sob formato de relatório estruturado para exportação pelo regulador.
*   **Ficheiros Envolvidos:**
    *   `backend/regulatory/RegulatoryEvents.ts`
    *   `backend/application/usecases/IncidentReporterUseCase.ts` (a ser criado)
*   **Ordem de Implementação Recomendada:** 4.ª prioritária.

---

## III. CONCLUSÃO DO DIAGNÓSTICO
O KwanzaMóvel apresenta uma base sólida de dupla entrada (Double-Entry ledger) e controles básicos de limites (KYC Tiers), mas precisa evoluir para uma cobertura holística e forte de **SCA** e **Reconciliação de Lastro** para mitigar o risco regulatório de suspensão de licença operacional pelo BNA.
