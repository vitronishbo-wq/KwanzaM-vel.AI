# Middlewares Globais (`backend/middleware`) — KwanzaMóvel

O diretório de Middlewares centraliza os interceptadores de fluxo de requisições e respostas HTTP no backend do **KwanzaMóvel**.

## 📋 Responsabilidades Técnicas

- **Segurança e Autenticação Ativa:** Interceptar requisições HTTP para validar cabeçalhos, tokens de sessão e autenticação de utilizador (adaptador Firebase Auth) antes de delegar a execução aos controladores da API.
- **Tratamento Global de Erros:** Capturar falhas não tratadas na cadeia de execução, formatando erros em payloads JSON limpos e padronizados e garantindo que exceções internas críticas (ex: falhas de conectividade de banco ou segredos) não vazem detalhes de infraestrutura ou stack traces vulneráveis para o utilizador final.
- **Prevenção de Lavagem de Dinheiro (AML) e Bloqueio Cautelar:** Executar validações em nível de tráfego contra IPs suspeitos, rate limiting contra ataques DDoS ou chamadas duplicadas repetitivas, e monitoramento preliminar de limites operacionais de conformidade regulatória.
- **Rastreamento de Requisições (Request Correlation):** Injetar cabeçalhos de identificação exclusiva (`X-Correlation-ID`) em cada requisição de entrada, permitindo o acompanhamento de ponta a ponta de uma transação financeira na telemetria de logs estruturados.

## 🛡️ Alinhamento com o Plano Diretor de Engenharia

* **Isolamento de Fluxo:** Funciona como a primeira e última linha de defesa da API do KwanzaMóvel. Garante que os Controladores recebam apenas requisições sanitizadas, legítimas e seguras.
* **Auditoria de Conformidade BNA:** Cada requisição financeira gera logs imutáveis e correlacionados através dos middlewares, fornecendo rastro de auditoria instantâneo exigido pelos reguladores de pagamentos angolanos.
