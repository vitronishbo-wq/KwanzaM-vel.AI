# Contratos e Repositórios (`backend/repositories`) — KwanzaMóvel

O módulo de Repositórios gerencia a definição das interfaces de dados e o mecanismo centralizado de Injeção de Dependências do ecossistema do **KwanzaMóvel**.

## 📋 Responsabilidades Técnicas

- **Definição de Interfaces de Domínio (Contratos):** Estabelecer os contratos tipados puros (ex: `UserRepository.ts`, `WalletRepository.ts`) que declaram exatamente como as camadas superiores podem criar, consultar e atualizar os agregados de domínio.
- **Inversão de Dependências (Registry Pattern):** Prover o Registro Centralizado (`Registry.ts`) do sistema. Este componente atua como o catálogo dinâmico de dependências do KwanzaMóvel, resolvendo em tempo de execução quais classes concretas de persistência ou de gateway devem ser providas para cada caso de uso.
- **Repositórios em Memória (`impl/`):** Manter implementações em memória ricas e de alta fidelidade (ex: `MemoryWalletRepository.ts`) que imitam com perfeição o comportamento de um banco de dados real. Isso permite que a aplicação opere com performance incrível em ambientes de testes e desenvolvimento rápido (como o AI Studio), servindo de salvaguarda operacional resiliente.

## 🧱 Estrutura de Pastas

1. **`UserRepository.ts`, `WalletRepository.ts`:** Interfaces abstratas fundamentais.
2. **`Registry.ts`:** Centralizador de injeção de dependências e controle de inicialização do sistema.
3. **`impl/`:** Implementações de dados de desenvolvimento em memória e utilitários de simulação rápida.

## 🛡️ Alinhamento com o Plano Diretor de Engenharia

* **Inversão de Controle Inviolável:** O núcleo financeiro só se comunica com as interfaces contidas aqui. A persistência física real reside separada em `backend/infrastructure/persistence/`, garantindo acoplamento zero com bancos de dados.
* **Resiliência de Arranque:** Se o banco de dados PostgreSQL físico falhar ou estiver inacessível, o `Registry.ts` ativa o fallback transparente para o repositório em memória, mantendo o KwanzaMóvel online e plenamente operacional para demonstrações sem interrupções.
