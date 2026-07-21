# Contexto Delimitado de Razão Imutável (`domain/ledger`) — KwanzaMóvel

Este submódulo gerencia o livro de registros financeiros históricos do sistema através de uma arquitetura estrita de partidas dobradas (Double-Entry Bookkeeping).

## 📋 Responsabilidades Técnicas

- **Lançamentos por Partidas Dobradas (Double-Entry Bookkeeping):** Garantir que toda transação financeira se traduza obrigatoriamente em pelo menos dois lançamentos correspondentes: um débito (`Debit`) em uma conta de origem e um crédito (`Credit`) em uma conta de destino.
- **Equilíbrio Contábil Inegociável:** Garantir a invariável fundamental do sistema: a soma de todos os débitos históricos deve corresponder exatamente à soma de todos os créditos históricos em todo o ecossistema (`Total Debits === Total Credits`).
- **Imutabilidade Absoluta (Somente Inserção):** Lançamentos no Ledger são estritamente de apenas inserção e leitura (*insert-only*). Operações de `UPDATE` ou `DELETE` são logicamente impossíveis nesta camada. Correções de erros operacionais são realizadas unicamente por meio de lançamentos adicionais de estorno e contrapartida financeira.
- **Histórico e Contas T (`T-Accounts`):** Estruturar contas contábeis em formato de árvore para auditoria instantânea por órgãos reguladores como o Banco Nacional de Angola (BNA).

## 🚫 Agnosticismo de Infraestrutura e Frameworks

- Este módulo não define chaves primárias autoincrementais ou anotações ORM.
- Não há lógica de conexões com banco de dados ou controle de transações SQL físicas (`BEGIN TRANSACTION`, `COMMIT`). A garantia de atomicidade no nível físico é responsabilidade das implementações de repositório na camada de infraestrutura.
- Opera unicamente com objetos de negócio representando Entradas (`LedgerEntry`) e Transações do Razão (`LedgerTransaction`).
