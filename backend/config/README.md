# Configuração Geral do Sistema (`backend/config`) — KwanzaMóvel

Este diretório atua como o único guardião e mediador autorizado para a leitura de configurações e variáveis de ambiente no ecossistema do **KwanzaMóvel**.

## 📋 Responsabilidades Técnicas

- **Centralização de Variáveis de Ambiente:** Isolar totalmente as chamadas diretas a `process.env` da aplicação. Toda configuração externa (credenciais cloud, URLs de APIs, segredos de produção, chaves regulatórias) é processada unicamente aqui.
- **Configurações Fortemente Tipadas:** Validar, padronizar e tipar as configurações em tempo de execução, garantindo que o servidor do KwanzaMóvel falhe rapidamente (*fail-fast*) com mensagens de erro claras se variáveis obrigatórias (ex: `GEMINI_API_KEY`) não estiverem devidamente declaradas.
- **Limites e Padrões Regulatórios Angolanos:** Definir os parâmetros padrão globais do sistema, como limites máximos de transação diários/mensais padrão para cada nível de KYC (Tier 1, Tier 2, Tier 3) regulamentados pelo Banco Nacional de Angola (BNA).

## 🛡️ Alinhamento com o Plano Diretor de Engenharia

* **Isolamento Absoluto:** Nenhuma entidade de domínio, caso de uso ou controlador pode conter chamadas diretas a `process.env`. Isso preserva o sistema livre de segredos ocultos e permite alternar ambientes com segurança.
* **Configurações Imutáveis:** Os objetos de configuração expostos por este módulo são somente leitura, evitando que o comportamento estrutural do KwanzaMóvel seja corrompido em tempo de execução por outras rotinas.
