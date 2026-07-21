# Telemetria, Observabilidade e Auditoria Contábil (`backend/telemetry`) — KwanzaMóvel

Este diretório centraliza a coleta, formatação e envio de dados de observabilidade do **KwanzaMóvel**, fornecendo subsídios vitais para auditorias contínuas do BNA e diagnóstico operacional em tempo real.

## 📋 Responsabilidades Técnicas

- **Logs Estruturados JSON:** Fornecer o mecanismo unificado de logging estruturado empresarial em formato JSON para garantir que todos os logs sejam legíveis por máquinas e integrados diretamente com o Google Cloud Logging.
- **Rastreabilidade de Transações (Tracing):** Propagar e gerenciar o `Correlation ID` (identificador único de fluxo) em todas as camadas da aplicação, desde a recepção HTTP até chamadas de banco de dados ou processamento em segundo plano por workers.
- **Métricas Operacionais e KPIs Financeiros:** Monitorar indicadores de performance técnica (tempo de resposta, latência de banco, concorrência de filas) e KPIs transacionais (volume total transitado, taxa de sucesso de liquidações interbancárias).
- **Auditoria de Partidas Dobradas:** Validar de forma automatizada a integridade contábil do Ledger imutável, notificando imediatamente o comitê de segurança financeira caso ocorra qualquer discrepância na invariável contábil.

## 🛡️ Alinhamento com o Plano Diretor de Engenharia

* **Sem Telemetria Fake:** Não é permitida a criação de dados estatísticos fictícios ou simulações decorativas. Todos os logs e dados de telemetria emitidos por este módulo refletem o estado operacional exato em tempo real do ecossistema.
* **Isolamento de Bibliotecas de Terceiros:** Desacoplar os detalhes de implementação das ferramentas de telemetria (ex: Winston, OpenTelemetry, Pino) de modo que a aplicação utilize uma abstração estável e limpa.
* **Rastros Imutáveis para Compliance:** Garantir que logs críticos de transferências, auditorias de KYC e ações operacionais de lojistas sejam gravados de forma assíncrona, robusta e imutável para posterior investigação forense e conformidade regulatória com as leis angolanas de combate a crimes financeiros.
