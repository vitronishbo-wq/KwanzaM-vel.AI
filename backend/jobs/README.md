# Agendamento de Tarefas Periódicas (`backend/jobs`)

## 📌 Visão Geral
A pasta `backend/jobs` gerencia as **Tarefas Agendadas (Scheduled / Cron Jobs)** do ecossistema **KwanzaMóvel**. 

No ecossistema KwanzaMóvel, diversas rotinas de conformidade e manutenção não ocorrem em resposta a uma ação direta do utilizador, mas sim de forma programada em intervalos regulares de tempo (como de hora em hora, diariamente à meia-noite ou mensalmente). Este diretório abriga os scripts e orquestradores destas tarefas repetitivas e de auditoria automatizada.

---

## 🛠️ Principais Responsabilidades
Os jobs agendados no KwanzaMóvel desempenham um papel vital na integridade e governança do sistema:

1. **Conciliação e Fecho de Caixa Diário:** Rotina executada à meia-noite para verificar a soma de todos os débitos e créditos históricos do Ledger, validando que a soma de todas as contas do sistema continue rigorosamente zerada e auditada (princípio de partidas dobradas).
2. **Reconciliação de Salvaguarda (BNA Compliance):** Verifica de hora em hora se os passivos digitais em circulação emitidos na plataforma estão integralmente cobertos por depósitos de reserva nos bancos parceiros (BAI, BFA, BIC) e na conta de custódia do **Banco Nacional de Angola (BNA)**.
3. **Limpeza e Manutenção Preventiva:** Expurgo seguro de tokens expirados, caches antigos de chaves de idempotência que ultrapassaram a data de expiração legal, e arquivos temporários de transações.
4. **Relatórios Regulatórios Automáticos:** Geração e assinatura digital de relatórios consolidados em formato padrão XML/JSON exigidos pelo BNA para fins de conformidade e auditoria financeira.
5. **Auditorias Preventivas de Segurança:** Verificação de integridade de logs operacionais para detectar anomalias ou desvios de saldo.

---

## 🏛️ Alinhamento com o Plano Diretor de Engenharia
As seguintes regras arquiteturais regem este diretório de forma estrita:

* **Sem Interrupções no Loop Principal:** O disparo de jobs de longa duração (como a geração de um relatório de conciliação anual) deve ser delegado para Workers assíncronos (`backend/workers/`) por meio de envio de mensagens para filas, evitando de forma absoluta o travamento das APIs de atendimento do utilizador.
* **Isolamento de Estado:** Os jobs utilizam os Casos de Uso existentes na camada de aplicação para executar suas operações (por exemplo, invocando o `ReconciliationUseCase`). Eles nunca acessam o banco de dados diretamente via SQL bruto para realizar alterações de saldos, preservando a pureza arquitetural.
* **Logs Detalhados:** Todo início, conclusão ou falha de uma tarefa agendada deve ser exaustivamente registrado com metadados estruturados JSON na camada de Telemetria (`backend/telemetry/`), permitindo uma auditoria clara da regularidade de execução de tarefas regulatórias críticas.
