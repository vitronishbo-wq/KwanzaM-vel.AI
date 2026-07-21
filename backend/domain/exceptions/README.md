# Contexto Delimitado de Exceções de Domínio Puras (`domain/exceptions`) — KwanzaMóvel

Contém a definição de exceções ricas e com significados de negócio claros que o domínio do KwanzaMóvel pode lançar em resposta a violações de regras operacionais ou financeiras.

## 📋 Responsabilidades Técnicas

- **Semântica de Negócio no Fluxo de Controle:** Em vez de utilizar erros genéricos do sistema ou códigos numéricos ambíguos, o domínio lança exceções especializadas e autoexplicativas para expressar anomalias de regras de negócio. Exemplos de exceções:
  - `InsufficientBalanceException`: Disparada quando uma carteira tenta debitar mais do que seu saldo disponível.
  - `TransactionLimitExceededException`: Lançada se um pagamento violar os limites diários, mensais ou por transação definidos pelo nível de KYC do utilizador.
  - `InactiveWalletException`: Lançada quando operações de débito ou crédito são direcionadas a carteiras suspensas, inativas ou bloqueadas por segurança.
  - `DoubleEntryMismatchException`: Sinalizada se o somatório dos débitos e créditos de uma transação financeira for diferente de zero.
- **Erros Ricos em Detalhes:** Fornecer contextos detalhados nas propriedades das exceções (ex: saldo atual, quantia requerida, limite estourado, Tier associado) para que as camadas superiores possam formatar mensagens úteis para o utilizador.

## 🚫 Agnosticismo de Infraestrutura e Frameworks

- Todas as exceções herdam da classe padrão JavaScript/TypeScript `Error` ou de uma classe base pura de domínio (ex: `DomainException`).
- Elas **não contêm** códigos de status HTTP (ex: 400, 403, 422) ou metadados de apresentação web. A tradução dessas exceções de domínio ricas em respostas HTTP limpas e formatadas é de responsabilidade exclusiva dos controladores ou middlewares globais de tratamento de erro na camada de Apresentação HTTP (`backend/api/`).
