# Núcleo Compartilhado do Domínio (`backend/domain/shared`) — KwanzaMóvel

Este diretório contém o **Shared Kernel** (Núcleo Compartilhado) da nossa arquitetura orientada ao domínio (Domain-Driven Design). Ele provê as construções estruturais básicas, utilitários fundamentais e Value Objects financeiros transversais que são compartilhados por todos os subdomínios (carteiras, livro contábil, lojistas, compensações, identidade).

## 📋 Regra de Ouro Inegociável

Em conformidade absoluta com a Constituição de Engenharia do **KwanzaMóvel** (`/PLANO_DIRETOR_ENGENHARIA_KwanzaMóvel.md`):
* **Agnóstico por Padrão:** Nenhuma classe ou arquivo contido neste diretório pode possuir qualquer dependência externa, imports de frameworks de persistência (Drizzle, PostgreSQL, Firestore), servidores web (Express) ou bibliotecas de utilitários externos.
* **Isolamento de Infraestrutura:** Toda e qualquer verificação é lógica e matemática, garantindo acoplamento zero com infraestruturas físicas.

## 🧱 Componentes Estruturais

1. **`Result.ts`:** Implementação elegante do padrão Result para controle de fluxo de operações sem o custo de lançar exceções para fluxos de negócio previsíveis (ex: falhas de validação).
2. **`UniqueEntityId.ts`:** Abstração de identidade única para entidades do domínio. Gera UUIDv4 de forma nativa e sem bibliotecas externas.
3. **`ValueObject.ts`:** Classe base abstrata para objetos de valor. Garante a imutabilidade por congelamento estrutural (`Object.freeze`) e igualdade estrutural profunda baseada em propriedades.
4. **`Entity.ts`:** Classe base abstrata para todas as entidades identificáveis do domínio. Duas entidades são iguais se, e somente se, possuírem o mesmo `UniqueEntityId`.
5. **`AggregateRoot.ts`:** Base para agregados do domínio. Estende `Entity` e gerencia a emissão e ciclo de vida de Eventos de Domínio (`DomainEvents`).
6. **`DomainEvent.ts`:** Sistema de mensageria leve e interno de Eventos de Domínio para reações desacopladas e consistência eventual (ex: atualizar o Ledger contábil após uma transferência bem-sucedida).
7. **`Guard.ts`:** Mecanismo unificado e puramente declarativo para asserções e validações lógicas rápidas de invariantes do domínio (prevenção de nulos, limites numéricos, tamanho de string, etc.).
8. **`Clock.ts`:** Provedor desacoplado de tempo para manter os testes determinísticos, permitindo mockar ou congelar o tempo do sistema sem acoplamento com a rede.

## 💰 Componentes de Valor Financeiro (Floating-Point-Free)

1. **`Currency.ts`:** Objeto de valor que encapsula propriedades de moedas soberanas, fornecendo suporte nativo integrado para o **Kwanza Angolano (`AOA`)** com precisão padrão de duas casas decimais.
2. **`Money.ts`:** Classe de extrema precisão matemática para operações em Kwanzas.
   - **Dinheiro Nunca Usa Float:** Utiliza `bigint` por debaixo do capô para guardar o valor na menor unidade da moeda (ex: cêntimos de Kwanza).
   - Impede operações de moedas diferentes.
   - Fornece operações imutáveis de soma (`add`), subtração (`subtract`), multiplicação segura (`multiply`), e formatação avançada localizada para o padrão de Angola (`pt-AO`, ex: `1.500,00 Kz`).
