# Contexto Delimitado de Identidade, KYC e Conformidade (`domain/identity`) — KwanzaMóvel

Define as regras de validação de utilizadores, níveis de verificação de identidade (Know Your Customer - KYC) e conformidade com leis de combate à lavagem de dinheiro (AML - Anti-Money Laundering).

## 📋 Responsabilidades Técnicas

- **Níveis de KYC (Tiers):** Classificar os utilizadores em níveis baseados nos documentos fornecidos e verificados:
  - *Tier 1 (Simplificado):* Limites baixos de movimentação diária/mensal, ideal para pequenos pagamentos cotidianos.
  - *Tier 2 (Padrão):* Exige documento de identificação nacional (BI) válido e NIF verificado. Limites intermediários.
  - *Tier 3 (Enterprise/Completo):* Exige comprovativo de residência e verificação biométrica. Limites elevados.
- **Validação de NIF Angolano (Nível de Domínio):** Fornecer regras lógicas preliminares para validação sintática do Número de Identificação Fiscal angolano.
- **Regras de Triagem de Risco e Sanções:** Fornecer regras de conformidade que impeçam utilizadores em listas restritivas nacionais ou internacionais de criarem ou utilizarem carteiras ativas.

## 🚫 Agnosticismo de Infraestrutura e Frameworks

- Não inclui bibliotecas de criptografia física (ex: bcrypt, argon2) ou tokens JWT. As decisões de criptografia e assinaturas de chaves de autenticação ocorrem na camada de segurança e apresentação.
- Não contém integrações HTTP diretas com serviços externos da AGT (Administração Geral Tributária) ou portais de verificação do Governo de Angola. Tais consultas de dados externos são tratadas como adaptadores da infraestrutura por meio de gateways injetados via interfaces de contrato do repositório.
