# Controladores HTTP (`backend/controllers`) — KwanzaMóvel

Os Controladores (Controllers) constituem os cérebros de recebimento da camada de Apresentação HTTP do **KwanzaMóvel**.

## 📋 Responsabilidades Técnicas

- **Extração de Parâmetros e Contexto:** Extrair e tipar dados essenciais das requisições (`req.body`, `req.params`, `req.query`), bem como as informações de contexto do utilizador autenticado e rastreamento de telemetria.
- **Invocação de Casos de Uso (Orquestração):** Acionar os casos de uso de negócio apropriados (ex: `TransferUseCase`, `RegisterUserUseCase`) através do padrão **Registry** de injeção de dependências, garantindo o isolamento do núcleo financeiro.
- **Controle de Idempotência:** Coordenar com a infraestrutura a verificação de chaves de idempotência em transações de transferência ou pagamentos críticos para mitigar riscos de gasto duplo.
- **Tratamento de Exceções de Domínio:** Capturar as exceções ricas lançadas pela camada de domínio e traduzi-las em respostas de erros informativas e humanamente legíveis (ex: `InsufficientBalanceException` vira um payload de erro `422 Unprocessable Entity` detalhando o saldo em Kwanzas).

## 🛡️ Alinhamento com o Plano Diretor de Engenharia

* **Sem Conhecimento de Persistência:** Um controlador nunca sabe se os dados estão armazenados no PostgreSQL, no Firestore ou em memória. Ele lida estritamente com lógica de apresentação web e injeção de interfaces de casos de uso.
* **Foco em DTOs Fortes:** Todas as entradas de dados fiduciários que atravessam os controladores são fortemente tipadas, evitando que valores inseguros ou strings maliciosas corrompam o núcleo de domínio.
