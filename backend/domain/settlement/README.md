# Contexto Delimitado de Custódia e Liquidação Financeira (`domain/settlement`) — KwanzaMóvel

Controla as regras de salvaguarda, conciliação e comunicação de saldos com as instituições de custódia oficiais e bancos parceiros angolanos (BAI, BFA, BIC, BNA).

## 📋 Responsabilidades Técnicas

- **Conformidade Regulatória de Custódia (BNA):** Garantir que 100% do saldo em circulação na plataforma digital KwanzaMóvel esteja integralmente coberto por depósitos fiduciários reais depositados nas contas de salvaguarda e custódia reguladas pelo Banco Nacional de Angola.
- **Geração e Validação de Lotes de Liquidação (`Settlement Batch`):** Agrupar transações interbancárias em lotes padronizados para compensação de saldos entre as instituições financeiras integradas, minimizando o risco de liquidação.
- **Conciliação Ativa de Saldos:** Fornecer os algoritmos de reconciliação de conciliação diária de saldos operacionais versus saldos de depósitos de garantia reais informados pelos bancos custodiantes parceiros.

## 🚫 Agnosticismo de Infraestrutura e Frameworks

- O domínio de liquidação define regras lógicas de fechamento de lotes e cálculo de balanço compensatório de forma totalmente agnóstica do protocolo de transporte.
- Não há referências a APIs bancárias reais, arquivos bancários formatados (ex: arquivos de remessa/retorno CNAB do BNA) ou protocolos SFTP de transferência. Essas integrações físicas residem exclusivamente na pasta `backend/infrastructure/gateways/`.
