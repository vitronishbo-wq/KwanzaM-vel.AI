# LSPA — Histórico de Sincronização e Versões (Changelog)
> **Historial de Alterações:** Rastreabilidade temporal das regras ativas do BNA

---

## [1.0.0] - 2026-07-08
### Adicionado
*   **Regulatory Knowledge Model (L40/20):** Criação da infraestrutura estruturada de arquivos do modelo de conformidade regulatória para o KwanzaMóvel em `/AI_CONTEXT/REGULATION_ENGINE/L4020/`.
*   **Metadados (METADATA.md):** Indexação preliminar do Diário da República, I Série — N.º 203 de 16 de Dezembro de 2020 contendo a Lei 40/20.
*   **Definições (DEFINITIONS.md):** Alinhamento conceitual das definições regulatórias do BNA (moeda eletrónica, conta de pagamento, SCA, correspondentes) com os objetos de domínio (aggregates, entities, value objects) da arquitetura de software.
*   **Participantes (PARTICIPANTS.md):** Modelagem formal das classes de atores do ecossistema e papéis na infraestrutura.
*   **Obrigações (OBLIGATIONS.md):** Catálogo formal contendo responsabilidades de execução, auditoria, testes e monitorização para cada diretiva legal (lastro, bloqueio de contas, SCA, controle de riscos operacionais).
*   **Direitos (RIGHTS.md):** Catálogo formal de garantias jurídicas asseguradas aos consumidores finais.
*   **Proibições (PROHIBITIONS.md):** Definição de restrições rígidas no domínio, com ênfase na proibição de atribuição de juros sobre moeda eletrónica e saldos negativos.
*   **Processos (PROCESSES.md):** Diagramas procedurais e fluxogramas textuais modelando onboarding, execução de transferências e reconciliação de reservas de salvaguarda.
*   **Eventos (EVENTS.md):** Definição de payloads de auditoria ativa do BNA para limite ultrapassado, violação de taxa MDR e congelamento cautelar de contas.
*   **Riscos (RISKS.md):** Avaliação holística de ameaças operacionais e financeiras, com estratégias de engenharia preventiva.
*   **Sanções (SANCTIONS.md):** Índice administrativo de multas por infrações de limites, desvio de lastro e ausência de canais de suspensão ativa.
*   **Requisitos Técnicos (TECHNICAL_REQUIREMENTS.md):** Definição de requisitos não-funcionais (NFRs) englobando criptografia de dados sensíveis, transações ACID com nível de isolamento serializável, alta disponibilidade operacional e trail de auditoria de dados por 10 anos.
*   **Estado de Implementação (IMPLEMENTATION_STATUS.md):** Índice detalhado por artigo apresentando estado (implementado, parcialmente implementado), prioridade, métricas de cobertura e classificação de riscos.
*   **Rastreabilidade (TRACEABILITY.md):** Rastreabilidade técnica ligando cada artigo da Lei 40/20 diretamente aos arquivos de código, use cases, logs estruturados e testes automatizados.
*   **Regulatory Engineering Framework (REF):** Desacoplamento de limites diários e taxas de lojistas das regras funcionais do software, concentrando a avaliação fiduciária sob um motor dinâmico e auditável de Law-Driven Architecture.
