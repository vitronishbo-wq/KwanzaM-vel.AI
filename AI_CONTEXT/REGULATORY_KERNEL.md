# KwanzaMóvel Regulatory Domain Kernel (RDK)
> **Autoridade:** Banco Nacional de Angola (BNA)  
> **Status:** Ativo & Regulatório  
> **Versão Corrente:** 1.0 (Ajustado ao Aviso 03/22 e outros Avisos de 2020)

---

## I. INTRODUÇÃO
O **Regulatory Domain Kernel (RDK)** é a fonte única e soberana de verdade regulatória do KwanzaMóvel. Todas as restrições financeiras, limites operacionais, requisitos de KYC, obrigações de prevenção a branqueamento de capitais (AML) e regras de governação corporativa decorrem das normas oficiais estabelecidas pelo **Banco Nacional de Angola (BNA)**.

---

## II. MATRIZ DE DIPLOMAS REGULATÓRIOS DO BNA

### 1. Aviso n.º 03/22 (Contas Simplificadas e Moeda Eletrónica)
*   **Artigo 18 (Limites Operacionais):** Define os tetos transacionais diários por nível de KYC.
    *   **Nível 1 (Level-1):** Limite de transação acumulado diário de **50.000,00 Kz**.
    *   **Nível 2 (Level-2):** Limite de transação acumulado diário de **500.000,00 Kz**.
    *   **Nível 3 (Level-3):** Limite de transação acumulado diário de **10.000,00 Kz** (limite preventivo interno para segurança antes de autorização explícita ou até 10M Kz sob total conformidade).
*   **Artigo 19 (Requisitos KYC Simplificados):** Define o cadastro de contas simplificadas de baixo valor.
*   **Artigo 20 (Garantias e Lastro):** Obriga a constituição de reservas líquidas de 100% dos saldos de moeda eletrónica em circulação, salvaguardados em contas fiduciárias.

### 2. Aviso n.º 06/20 (Fintechs e Prestadores de Serviços de Pagamento)
*   Regulamenta a constituição e autorização de Instituições Financeiras Não Bancárias de Serviços de Pagamentos.
*   Impõe requisitos de capital social e salvaguarda de fundos.

### 3. Aviso n.º 11/20 (Compliance AML/CFT)
*   Obriga à triagem contínua de transações contra financiamento de terrorismo e branqueamento de capitais.
*   Define gatilhos de comportamento suspeito (ex: estouros rápidos de limites, transferências em lote sem coerência econômica).

### 4. Aviso n.º 10/20 (Proteção ao Consumidor Financeiro)
*   Transparência total em tabelas de MDR, taxas e encargos.
*   Garantia de que as fórmulas de taxas de comerciantes (Merchant Discount Rate) sejam auditáveis e explícitas.

---

## III. DEFINIÇÃO DECLARATIVA DE REGRAS FINANCEIRAS

Todas as validações no KwanzaMóvel devem ser estruturadas com base nos seguintes identificadores regulatórios:

| ID Regra | Diploma | Artigo | Âmbito | Parâmetro Regulatório | Descrição |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **BNA-A0322-ART18-L1** | Aviso 03/22 | Art. 18 | KYC Level-1 | `5000000n` (subunits) | Limite Diário de Gastos / Envio (50.000,00 Kz) |
| **BNA-A0322-ART18-L2** | Aviso 03/22 | Art. 18 | KYC Level-2 | `50000000n` (subunits) | Limite Diário de Gastos / Envio (500.000,00 Kz) |
| **BNA-A0322-ART18-L3** | Aviso 03/22 | Art. 18 | KYC Level-3 | `1000000000n` (subunits) | Limite Diário de Gastos / Envio (10.000,00 Kz preventivo ou 10.000.000,00 Kz regulamentar) |
| **BNA-A1120-AML-FROZEN** | Aviso 11/20 | Vários | Todas as Contas | `FROZEN` / `SUSPENDED` | Bloqueio imediato de qualquer débito/crédito em contas sob investigação. |
| **BNA-A1020-MDR-MAX** | Aviso 10/20 | Vários | Merchant MDR | Taxa MDR BPS máxima autorizada | Impede a aplicação de taxas abusivas ou não publicadas aos lojistas. |
