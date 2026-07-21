# Banco de Dados Físico (`backend/database`) — KwanzaMóvel

Este diretório centraliza o esquema físico, configurações e scripts do Banco de Dados Relacional no ecossistema do **KwanzaMóvel**.

## 📋 Responsabilidades Técnicas

- **Mapeamento de Tabelas Físicas (Drizzle ORM / PostgreSQL):** Definir os esquemas relacionais, chaves estrangeiras, índices e restrições de integridade que espelham perfeitamente o estado das entidades contidas no Domínio (como tabelas de carteiras, lançamentos do ledger contábil, auditorias de KYC e perfis de lojistas).
- **Gerenciamento de Migrações:** Organizar e orquestrar as alterações estruturais do banco de dados (esquemas SQL gerados pelo Drizzle) garantindo integridade de dados e auditorias em ambientes de teste, staging e produção real.
- **Inicialização Segura (Lazy Load):** Implementar e gerenciar a inicialização preguiçosa (`lazy-load`) do banco de dados. Este mecanismo evita que a aplicação quebre durante a inicialização (startup do servidor) se as variáveis de ambiente ou credenciais do banco cloud PostgreSQL estiverem ausentes no AI Studio, emitindo alertas estruturados e chaveando para os repositórios em memória de forma transparente.

## 🛡️ Alinhamento com o Plano Diretor de Engenharia

* **Separado da Lógica de Negócio:** Nenhuma consulta SQL, query do ORM ou declaração de tabela física pode vazar para os Casos de Uso ou Domínio. O banco de dados físico é um detalhe de infraestrutura de última camada.
* **Garantia de Tipagem Relacional:** Garante que o banco físico respeite a consistência financeira extrema do KwanzaMóvel, impedindo que campos de valores decimais flutuantes (`float`) sejam criados (forçando tipos bigint/inteiros para cêntimos de Kwanzas).
