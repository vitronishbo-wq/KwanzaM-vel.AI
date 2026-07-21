# KwanzaMóvel Regulatory Knowledge Model (L40/20)
> **Referência Legal:** Lei n.º 40/20 de 16 de Dezembro — Lei do Sistema de Pagamentos de Angola (LSPA)  
> **Status:** Ativo & Regulatório — Fundamentação de Engenharia

---

## I. INTRODUÇÃO
Este modelo de conhecimento formaliza a **Lei n.º 40/20 de 16 de Dezembro** como um **ativo arquitetural executável** dentro do ecossistema do KwanzaMóvel. A legislação deixa de ser documentação estática e passa a ser mapeada em termos de conceitos de domínio, invariantes lógicas, atores e fluxos de engenharia.

---

## II. EXTRAÇÃO DE CONCEITOS E DEFINIÇÕES CHAVE (Artigo 2.º)

### 1. Entidades Regulatórias & Participantes
*   **Banco Nacional de Angola (BNA) [Art. 6.º]:** Autoridade regulatória e de supervisão máxima. Responsável por emitir licenças, fiscalizar e sancionar.
*   **Prestador de Serviços de Pagamento (PSP) [Art. 2.º, alínea ddd)]:** Entidades autorizadas a prestar serviços de pagamento. O KwanzaMóvel atua sob esta égide.
*   **Agente [Art. 2.º, alínea c); Art. 18.º]:** Pessoa singular ou coletiva que presta serviços de pagamento em nome de um PSP. Essencial para a rede de correspondentes do KwanzaMóvel nas províncias de Angola.
*   **Utilizador de Serviços de Pagamento (USP) [Art. 2.º, alínea dddd)]:** Pessoa singular ou coletiva que utiliza um serviço de pagamento na qualidade de ordenante e/ou beneficiário.

### 2. Instrumentos e Contas
*   **Moeda Eletrónica [Art. 2.º, alínea pp)]:** Valor monetário representado por um crédito sobre o emissor, emitido sob receção de fundos para efetuar transações. Deve possuir 100% de lastro fiduciário líquido.
*   **Conta de Pagamento [Art. 2.º, alínea o)]:** Conta detida em nome de um ou mais utilizadores de serviços de pagamento, utilizada para a execução de operações de pagamento (no KwanzaMóvel, associada ao telemóvel do utilizador).
*   **Instrumento de Pagamento [Art. 2.º, alínea gg)]:** Dispositivo personalizado ou conjunto de procedimentos acordados entre o utilizador e o prestador de serviços, utilizado para iniciar uma ordem de pagamento.

### 3. Segurança e Compliance
*   **Autenticação Forte do Cliente (SCA) [Art. 2.º, alínea h); Art. 96.º]:** Autenticação baseada no uso de dois ou mais elementos pertencentes às categorias de:
    *   *Conhecimento* (algo que apenas o utilizador sabe — ex: PIN/Senha);
    *   *Posse* (algo que apenas o utilizador possui — ex: telemóvel/dispositivo via OTP);
    *   *Inerência* (algo que o utilizador é — ex: biometria).
    These elements must be mutually independent, so that a breach of one does not compromise the reliability of the others, protecting the confidentiality of data.
*   **Dados de Pagamento Sensíveis [Art. 2.º, alínea u)]:** Dados que podem ser utilizados para cometer fraudes, incluindo credenciais de segurança personalizadas.

---

## III. OBJETIVOS DE INTERESSE PÚBLICO (Artigo 3.º)
O sistema KwanzaMóvel deve demonstrar conformidade arquitetural com os quatro pilares definidos pelo BNA:
1.  **Segurança:** Proteção física, digital e jurídica de todas as ordens de transferência (Criptografia, SCA, auditoria imutável via Ledger).
2.  **Fiabilidade Operacional:** Redundância técnica, alta disponibilidade e planos de continuidade de negócios no Cloud Run.
3.  **Eficiência:** Custos operacionais reduzidos, liquidação célere e mitigação de atrito transacional.
4.  **Transparência:** Divulgação clara de preçários, tabelas MDR de lojistas e termos de uso em português de Angola.

---

## IV. MAPA DE EVENTOS E FLUXOS REGULATÓRIOS

### 1. Ciclo de Vida do Consentimento (Artigo 68.º)
```text
  [ USP (Utilizador) ] ──( Dá Consentimento Explícito )──► [ Use Case / API ]
            │                                                      │
            ▼                                                      ▼
  [ Ordem de Pagamento ] ◄──( Autenticação Forte SCA [Art. 96] )───┘
```

### 2. Fluxo de Liquidação Irrevogável (Artigo 40.º)
Uma vez compensada no KwanzaMóvel, a liquidação é definitiva e irrevogável, não podendo ser anulada unilateralmente (Invariante do Ledger Imutável).

```text
  [ Débito da Conta Origem ] ──► [ Crédito da Conta Destino ] ──► [ Registo no Ledger ]
                                                                          │
                                                                          ▼
                                                              [ Liquidação Definitiva ]
                                                                 (Artigo 40.º LSPA)
```
