# Camada de Apresentação HTTP (`backend/api`) — KwanzaMóvel

Este diretório atua como a fronteira de comunicação HTTP externa do ecossistema do **KwanzaMóvel**, expondo endpoints RESTful sob o namespace `/api/*` e orquestrando o fluxo inicial das requisições.

## 📋 Responsabilidades Técnicas

- **Interface Unificada de Comunicação:** Servir de ponte entre o Frontend React (ou clientes móveis) e o núcleo de casos de uso da aplicação (`backend/application/`).
- **Roteamento RESTful:** Definir de maneira hierárquica e semântica as rotas de acesso de todos os recursos (carteiras, transações, conciliação contábil, KYC e lojistas).
- **Validação Preliminar de Contratos:** Filtrar as entradas recebidas de dados fiduciários, garantindo que os corpos de requisição correspondam estritamente aos DTOs (Data Transfer Objects) especificados, descartando anomalias antes de acionar os casos de uso.
- **Estruturação de Respostas:** Traduzir os resultados das execuções e as exceções ricas de domínio em respostas HTTP padrão com os devidos códigos de status (ex: `200 OK`, `201 Created`, `400 Bad Request`, `422 Unprocessable Entity`).

## 🧱 Arquitetura e Subdiretórios

Esta camada é estruturada em:
1. **`routes/`:** Definições dos caminhos HTTP e associação com middlewares e controladores.
2. **`controllers/`:** Executores das requisições HTTP e invocadores dos Casos de Uso.
3. **`middlewares/`:** Interceptadores para logs de auditoria, tratamento global de erros, rate limiting e autenticação.

## 🛡️ Alinhamento com o Plano Diretor de Engenharia

Em conformidade com a Constituição de Engenharia do KwanzaMóvel:
* **Zero Lógica de Negócio:** Esta camada apenas decodifica HTTP e invoca o caso de uso. Não existem cálculos de taxas, comissões ou validações financeiras profundas aqui.
* **Zero Consultas Físicas:** Não é permitida nenhuma consulta SQL (`SELECT`, `INSERT`) ou comandos de banco de dados diretamente em arquivos deste diretório. Toda persistência é operada via injeção de Repositórios.
