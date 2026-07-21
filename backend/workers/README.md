# Processamento Assíncrono e Mensageria (`backend/workers`)

## 📌 Visão Geral
A pasta `backend/workers` armazena os **Trabalhadores em Segundo Plano (Background Workers)** do ecossistema **KwanzaMóvel**. 

Para assegurar uma experiência ultra-rápida e resiliente no canal de API HTTP principal, o KwanzaMóvel adota o padrão de arquitetura orientada a eventos e processamento assíncrono. Tarefas intensas em termos de I/O, processamento de dados massivos ou integrações lentas com APIs de terceiros não devem de forma alguma bloquear o loop de eventos principal do servidor Express. Essas tarefas são delegadas a workers especializados que as processam em segundo plano.

---

## 🛠️ Principais Responsabilidades
Os workers do KwanzaMóvel gerenciam tarefas assíncronas fundamentais para o funcionamento do ecossistema financeiro:

1. **Processamento de Filas de Mensagens (Queues):** Escutam tópicos e filas de mensageria para processamento e consumo de eventos de domínio (ex: atualizar o saldo visual do utilizador após um evento contábil de partidas dobradas ter sido gravado de forma imutável no ledger).
2. **Disparo em Lote de Notificações:** Envio massivo e assíncrono de notificações de alteração de saldo, e-mails de comprovativo de transações e push notifications para dispositivos móveis dos utilizadores.
3. **Consumo de Webhooks Externos:** Processamento desconectado e resiliente de confirmações de pagamento vindas de redes de cartões e outros parceiros financeiros.
4. **Alocação de Tarefas Pesadas:** Distribuição e conciliação em paralelo de grandes volumes de dados de transferência e liquidação, sem sobrecarregar a base de dados principal.

---

## 🏛️ Alinhamento com o Plano Diretor de Engenharia
As seguintes regras arquiteturais regem este diretório de forma estrita:

* **Desacoplamento Completo:** Os workers operam de forma isolada, comunicando-se com o restante do sistema por meio de eventos de domínio bem definidos (`backend/domain/events/`). Eles utilizam as mesmas interfaces de Repositórios injetadas pelo `Registry.ts` para garantir consistência operacional.
* **Idempotência no Consumo:** Como as redes de mensageria podem entregar eventos mais de uma vez (*at-least-once delivery*), os workers devem ser estritamente idempotentes. Toda ação de escrita deve verificar previamente se o evento em questão (identificado pelo seu ID exclusivo de transação ou de evento) já foi processado e concluído com sucesso.
* **Tolerância a Falhas e Retry:** Se uma integração com um gateway externo falhar por oscilação de rede, os workers devem implementar políticas inteligentes de retentativa com recuo exponencial (*exponential backoff*), evitando sobrecarregar o sistema de destino.
* **Gestão de Recursos:** Garantia de que o consumo de memória e conexões de rede não ultrapasse os limites alocados para a infraestrutura de Cloud Run, mantendo o ecossistema saudável em qualquer nível de escala.
