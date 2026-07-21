# Serviços de Integração Técnica (`backend/services`) — KwanzaMóvel

Este diretório gerencia os serviços utilitários de aplicação e adaptadores de integração técnica do ecossistema **KwanzaMóvel**.

## 📋 Responsabilidades Técnicas

- **Serviços Utilitários de Aplicação:** Disponibilizar rotinas de utilidade e inteligência técnica para o backend que não representam regras de negócio puras de domínio, mas são vitais para o funcionamento do sistema (ex: criptografia de senhas, encriptação de payloads, geração de tokens, serviços de IA).
- **Provedores de Inteligência e IA:** Centralizar o uso do SDK da Gemini API (`GeminiService`) para auditoria de comprovativos, triagem de transações suspeitas AML, e assistência conversacional operacional ao lojista.
- **Integração de Notificações e Comunicação:** Fornecer motores assíncronos para processar o disparo de notificações push, SMS de confirmação OTP (One-Time Password) e emails operacionais para os utilizadores angolanos.

## 🛡️ Alinhamento com o Plano Diretor de Engenharia

* **Isolamento de Infraestrutura Externa:** Serviços que dependem de chaves secretas ou conexões de rede (como o processador Gemini) são isolados nesta camada técnica. Eles nunca são instanciados diretamente pelo Domínio ou pelos Casos de Uso.
* **Uso Seguro de Chaves de API:** Chaves e credenciais sensíveis (ex: `GEMINI_API_KEY`) são carregadas de forma estritamente protegida através da camada de configuração (`backend/config`), nunca expostas diretamente no código nem compartilhadas com o cliente React.
