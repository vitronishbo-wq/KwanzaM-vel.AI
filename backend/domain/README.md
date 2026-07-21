# Camada de Domínio Puro (Domain Layer) — KwanzaMóvel

Esta camada contém as regras de negócio centrais, entidades de domínio, objetos de valor e exceções fundamentais do ecossistema **KwanzaMóvel**.

## 🛡️ O Princípio do Isolamento Radical (Agnosticismo de Infraestrutura)

Em conformidade absoluta com o **Plano Diretor de Engenharia**, a Camada de Domínio é **sagrada e auto-contida**. Ela obedece a regras rígidas de isolamento:
- **Zero Dependências de Terceiros:** Não é permitida a importação de bibliotecas de framework, servidores HTTP (Express), drivers de persistência ou ORMs (Drizzle, Firestore, Mongoose, PostgreSQL).
- **Sem Conhecimento de I/O:** O domínio não sabe *como* ou *onde* os dados são persistidos ou como são recebidos do exterior. Ele opera exclusivamente através de lógica pura e em memória, recebendo dados necessários através de parâmetros de métodos e objetos de domínio imutáveis.
- **Inversão de Dependências:** Caso o domínio precise interagir com serviços externos (ex: validar um NIF na AGT ou consultar taxas de câmbio no BNA), ele deve definir uma interface abstrata (contrato) interna, cuja implementação concreta será provida pela camada de infraestrutura via injeção de dependências.

---

## 📂 Subdiretórios e Contextos Delimitados (Bounded Contexts)

Abaixo está a divisão lógica estabelecida para encapsular as complexidades financeiras e regulatórias angolanas:

1. **[`wallet/`](./wallet/README.md):** Controle de saldos de carteiras, limites operacionais por Tiers e status de bloqueio.
2. **[`ledger/`](./ledger/README.md):** Razão imutável operando em partidas dobradas (Contas T) para garantir consistência e auditoria.
3. **[`merchant/`](./merchant/README.md):** Regras de credenciamento de lojistas, comissionamento e taxas transacionais personalizáveis.
4. **[`settlement/`](./settlement/README.md):** Processamento de liquidação e reconciliação diária de custódia com o BNA e bancos parceiros.
5. **[`identity/`](./identity/README.md):** Regras de KYC, níveis regulatórios de conformidade e integridade transacional de identidade.
6. **[`exceptions/`](./exceptions/README.md):** Exceções de domínio ricas e semanticamente significativas (ex: saldo insuficiente, violação de limite diário).

---

## 📐 Diretrizes de Implementação

- **Dinheiro como Inteiro Seguro:** NUNCA utilize números decimais de ponto flutuante (`float`, `double`) para transações financeiras. Todas as representações monetárias devem usar valores inteiros (ex: cêntimos de Kwanza) encapsulados por um objeto de valor robusto.
- **Entidades Imutáveis:** Sempre que aplicável, modele as mudanças de estado por meio de métodos de transição limpos que retornem novas instâncias ou lancem exceções de domínio explícitas caso as regras de integridade sejam violadas.
