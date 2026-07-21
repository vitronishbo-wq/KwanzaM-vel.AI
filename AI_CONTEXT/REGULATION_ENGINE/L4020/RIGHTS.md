# LSPA — Direitos do Utilizador de Serviços de Pagamento (Rights)
> **Proteção do Consumidor:** Garantia jurídica de clareza, transparência e segurança

---

## I. ENQUADRAMENTO JURÍDICO
Os utilizadores de serviços de pagamento no KwanzaMóvel possuem um conjunto robusto de direitos assegurados pela Lei 40/20, particularmente no que concerne à transparência contratual, limites de encargos e ao direito à reclamação célere.

---

## II. PRINCIPAIS DIREITOS DO UTILIZADOR

### 1. Direito à Informação Prévia e Transparência [Artigo 47.º]
*   **O que garante:** O utilizador tem direito a conhecer todos os encargos, tarifas, comissões, prazos e taxas de câmbio aplicáveis antes de autorizar qualquer operação financeira.
*   **Implementação KwanzaMóvel:**
    *   Tabela pública de FAQ e preçários estruturada em português.
    *   Exibição clara de comissões calculadas de forma determinística antes da confirmação da transação de envio de Kwanzas.

### 2. Direito ao Consentimento Explícito [Artigo 68.º]
*   **O que garante:** Nenhuma transação pode ser executada sem a autorização prévia e o consentimento explícito do ordenante.
*   **Implementação KwanzaMóvel:**
    *   Uso de PIN criptográfico e autenticação multifator SCA como pré-requisitos para a assinatura digital do use case `TransferUseCase`.

### 3. Direito ao Reembolso por Operações Não Autorizadas [Artigo 75.º]
*   **O que garante:** Caso ocorra uma transação não autorizada, o prestador de serviços deve restituir o valor subtraído imediatamente, salvo em casos de negligência grave comprovada do utilizador.
*   **Implementação KwanzaMóvel:**
    *   Uso do Ledger imutável de dupla entrada para certificar o estado das contas em qualquer timestamp.
    *   Capacidade de estorno do saldo por transação compensatória registada no ledger.

### 4. Direito ao Procedimento Célere de Reclamações [Artigo 102.º]
*   **O que garante:** O utilizador tem o direito de apresentar queixas e reclamações formais, as quais devem ser analisadas e decididas num prazo célere pelas instâncias de suporte do prestador de serviços.
*   **Implementação KwanzaMóvel:**
    *   Interface dedicada no aplicativo para registo e rastreio de reclamações conectada à auditoria transacional.
