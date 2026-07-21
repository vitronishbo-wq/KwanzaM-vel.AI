# Contexto Delimitado de Credenciamento e Comissionamento de Lojistas (`domain/merchant`) — KwanzaMóvel

Gerencia as regras de negócio especiais associadas a contas de comerciantes, credenciamento empresarial e cálculo de taxas de intermediação financeira (MDR - Merchant Discount Rate).

## 📋 Responsabilidades Técnicas

- **Regras de Lojistas (`Merchant`):** Representar estabelecimentos comerciais credenciados na rede KwanzaMóvel, gerenciando dados de ponto de venda (PDV), níveis de risco operacional e categorias de atividade comercial (MCC - Merchant Category Code).
- **Cálculo de Tarifação e Split de Pagamentos:** Computar de forma imutável as taxas e comissões aplicáveis a cada venda efetuada pelo comerciante. Suportar divisões de pagamento (*split billing*) automáticas entre o parceiro de entrega, o comerciante e a plataforma KwanzaMóvel.
- **Limites e Ciclos de Repasse:** Definir janelas temporais de liquidação permitidas para os repasses financeiros de vendas consolidadas, em estreita conformidade com os regulamentos angolanos de arranjos de pagamento.

## 🚫 Agnosticismo de Infraestrutura e Frameworks

- Nenhuma dependência com bibliotecas de cálculo financeiro externas (ex: math.js, decimal.js) é aceita. Cálculos de taxas devem ser feitos utilizando operações matemáticas puras com inteiros (representando centésimos de por cento ou "pontos-base" / *basis points*) para evitar erros de precisão decimal.
- Este contexto desconhece se o lojista está integrado via API REST, Webhook ou QR Code físico no ponto de venda. Ele foca estritamente nas regras contratuais, tarifárias e de conformidade do estabelecimento.
