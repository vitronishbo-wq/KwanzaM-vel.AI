# LSPA — Regulatory DSL & Compliance Score Engine
> **Automatização de Compliance:** Linguagem Declarativa de Regras (DSL) e cálculo do Índice de Conformidade

---

## I. INTRODUÇÃO
Para evitar o acoplamento de leis no código de negócios e permitir a avaliação automatizada de conformidade, o KwanzaMóvel introduz duas ferramentas de engenharia de alta maturidade:
1.  **Regulatory DSL:** Uma linguagem declarativa padronizada para representar qualquer regra do BNA de forma uniforme.
2.  **Compliance Score Calculator:** Um algoritmo conceitual e modelo de dados para avaliar e pontuar a cobertura técnica de cada artigo da lei.

---

## II. REGULATORY DSL (Linguagem Padronizada)

Qualquer aviso, instrutivo ou lei do BNA é representado usando a seguinte estrutura uniforme de DSL. Isso permite que auditores e desenvolvedores verifiquem a integridade das invariantes sem ambiguidades.

### Exemplo de Definição DSL: L4020-ART074 (Bloqueio de Credenciais)
```yaml
RULE_ID: "L4020-ART074"
TYPE: "Mandatory"
ACTOR: "Payment Service Provider"
CATEGORY: "Security / Account Operations"
DIPLOMA: "Lei n.º 40/20"
ARTICLE: "Artigo 74.º"
WHEN: "User notifies theft, loss, or unauthorized access of credentials"
THEN: "Immediately freeze wallet debit and credit capabilities (24/7)"
EVIDENCE:
  - "Audit Log of type WALLET_FROZEN with timestamp and operatorId"
  - "Instantaneous status change in DB metadata block"
TESTS:
  - "WalletBlocking.test.ts"
COMPLIANCE_TARGET: 1.0
```

### Exemplo de Definição DSL: L4020-ART096 (Autenticação Forte)
```yaml
RULE_ID: "L4020-ART096"
TYPE: "Mandatory"
ACTOR: "Payment Service Provider"
CATEGORY: "Authentication"
DIPLOMA: "Lei n.º 40/20"
ARTICLE: "Artigo 96.º"
WHEN: "Transaction > Security Tier Limit OR accessing sensitive payment data"
THEN: "Require Strong Customer Authentication (SCA) with mutually independent factors"
EVIDENCE:
  - "Authentication Record containing factors checked (PIN, Possession OTP)"
TESTS:
  - "SCAComplianceTest"
COMPLIANCE_TARGET: 1.0
```

---

## III. COMPLIANCE SCORE AUTOMÁTICO (Fórmula e Modelo de Dados)

O cálculo do **Compliance Score** de cada artigo é baseado no nível de cobertura em seis eixos chaves da engenharia de software. Cada eixo possui um peso específico na composição da conformidade final:

$$\text{Compliance Score} = (0.15 \times \text{Documentação}) + (0.20 \times \text{Domínio}) + (0.20 \times \text{Caso de Uso}) + (0.15 \times \text{Testes}) + (0.15 \times \text{Observabilidade}) + (0.15 \times \text{Auditoria})$$

### Modelo de Dados JSON de Cobertura (Auditoria Operacional)
```json
{
  "diploma": "Lei n.º 40/20",
  "assessmentDate": "2026-07-08T22:00:00Z",
  "metrics": {
    "globalCompliance": 82.5,
    "globalCoverage": 91.0,
    "globalObservability": 75.0,
    "globalTests": 64.0,
    "overallRisk": "Medium"
  },
  "articles": [
    {
      "article": "Artigo 3.º",
      "description": "Objetivos de Interesse Público (Segurança e Fiabilidade)",
      "coverage": {
        "documentation": 1.0,
        "domain": 1.0,
        "useCase": 0.8,
        "tests": 0.6,
        "observability": 0.8,
        "auditing": 0.8
      },
      "score": 82.0,
      "risk": "Low"
    },
    {
      "article": "Artigo 20.º",
      "description": "Garantias e Lastro de Moeda Eletrónica",
      "coverage": {
        "documentation": 1.0,
        "domain": 0.8,
        "useCase": 0.8,
        "tests": 0.5,
        "observability": 0.6,
        "auditing": 0.8
      },
      "score": 73.5,
      "risk": "High"
    },
    {
      "article": "Artigo 40.º",
      "description": "Caráter Definitivo da Liquidação",
      "coverage": {
        "documentation": 1.0,
        "domain": 1.0,
        "useCase": 1.0,
        "tests": 1.0,
        "observability": 1.0,
        "auditing": 1.0
      },
      "score": 100.0,
      "risk": "Low"
    },
    {
      "article": "Artigo 96.º",
      "description": "Autenticação Forte do Cliente (SCA)",
      "coverage": {
        "documentation": 1.0,
        "domain": 0.6,
        "useCase": 0.5,
        "tests": 0.2,
        "observability": 0.4,
        "auditing": 0.4
      },
      "score": 48.0,
      "risk": "High"
    }
  ]
}
```

---

## IV. MOTOR AUTOMÁTICO DE SCORE DE CONFORMIDADE
O KwanzaMóvel possui no seu kernel de compliance uma rotina capaz de gerar este modelo de dados correlacionando a presença física de ficheiros de domínio, asserções de testes e logs estruturados para exportação em tempo real pelo BNA.
