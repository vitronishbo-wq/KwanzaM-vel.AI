# Constituição do KMOS (KwanzaMóvel Operating System)

## Princípio Fundamental Único

> **O KMOS nunca representa código. O KMOS representa a instituição.**  
> **O código é apenas um dos ativos observados.**

Esta premissa inverte por completo a perspetiva de engenharia de software tradicional. O ecossistema KMOS não existe como um fim em si mesmo ou para ser monitorizado de forma isolada; ele opera como a expressão computacional dinâmica, automatizada e auditável da própria instituição, das suas regras prudenciais, das leis do Estado angolano (como a Lei n.º 40/20) e do conhecimento histórico do ecossistema financeiro.

---

## Princípios Operacionais de Conhecimento e Evolução

### 1. Prioridade do Conhecimento Institucional
O KMOS prioriza o **conhecimento e conformidade institucional** acima de métricas puramente técnicas de software. Métricas de infraestrutura (como latência, CPU ou throughput) e de engenharia (como cobertura de testes ou linhas de código) são submetidas e correlacionadas ao impacto institucional que suportam. Uma métrica técnica só tem valor real quando serve para atestar a estabilidade e integridade da operação da instituição.

### 2. O Código como Ativo Observável
O código-fonte (TypeScript, React, APIs, Scripts de Infraestrutura) é tratado meramente como uma das camadas observadas pelo sistema. A arquitetura física está subordinada à arquitetura regulatória. O ecossistema conhece o seu código através de manifestos declarativos, mapeamentos dinâmicos de dependências de regras de negócio e de grafos de conhecimento que ligam as leis e avisos diretamente ao código que as executa.

### 3. Critério de Evolução de Funcionalidades Futuras
Toda e qualquer funcionalidade futura, refatorização ou expansão de código do KMOS deve obedecer rigorosamente a pelo menos um destes critérios fundamentais:
*   **Responder a Necessidades Operacionais Reais**: Facilitar transações reguladas, melhorar a inclusão financeira rural, otimizar fluxos de custódia e liquidação no SPTR, ou garantir a integridade dos saldos das carteiras eletrónicas.
*   **Aumentar a Inteligência do Sistema**: Expandir o Grafo de Conhecimento (Knowledge Graph), enriquecer o motor de políticas (Policy Engine), fornecer rastreabilidade mais profunda das Decisões de Arquitetura (ADRs) ou aumentar as capacidades de auditoria e cognição da IA Institucional.

---

## Hierarquia de Abstração Sistémica

Para garantir a soberania tecnológica e a conformidade legislativa em tempo de execução, o KMOS estrutura-se do topo para a base:

1.  **Instituição** (Leis da República de Angola, Instruções e Regulamentos do BNA)
2.  **Operações** (Processos, Agentes de Pagamento, Comerciantes, Utilizadores e Limites KYC)
3.  **Serviços** (Compensação SPTR, Moeda Eletrónica, Auditoria Contabilística, Custódia Fiduciária)
4.  **Domínio** (Invariantes lógicas, Casos de Uso, Eventos de Negócio, Agregados de DDD)
5.  **Código** (Ficheiros TypeScript, Express APIs, Componentes React, Testes Unitários)
6.  **Infraestrutura** (Bases de Dados, HSMs Criptográficos, Redes de Comunicação, Logs Físicos)

---

## A Divisão em Quatro Sistemas Orgânicos

O KMOS está dividido em quatro sistemas com missões claras e complementares:

### 1. KMOS Core (Operação Real)
Responsável pela execução transacional em tempo de execução.
*   **Wallet**: Carteiras eletrónicas e saldos baseados nos limites KYC.
*   **Settlement**: Liquidação interbancária e compensação física no SPTR.
*   **Ledger**: Registo de dupla entrada (Double-Entry Bookkeeping) imutável e auditável.
*   **Reserve**: Salvaguarda e garantia de depósitos fiduciários com rácio 1:1.
*   **Merchant**: Rede de comércios aderentes e controlo de tarifas MDR.
*   **Identity**: Identificação e verificação civil/biométrica.

### 2. KMOS Intelligence (Compreensão)
Responsável pela cognição, análise de impacto e coerência do ecossistema de conhecimento.
*   **Knowledge Graph**: Grafo dinâmico ligando Leis, Módulos, Métricas e Testes.
*   **Dependency Graph**: Análise em cascata de impactos ao modificar regras ou código.
*   **Policy Engine**: Validação universal e ativa de políticas operacionais.
*   **Decision Engine**: Registo cognitivo das decisões arquiteturais (ADRs).
*   **Manifestos**: Declarações declarativas das responsabilidades e limites de cada módulo.

### 3. KMOS Observatory (Observação)
Responsável pelo monitoramento e telemetria operacional com significado institucional.
*   **Metrics**: Métricas transacionais e prudenciais em tempo real.
*   **Events**: Barramento de eventos de domínio gerados pelas transações.
*   **Telemetry**: Fluxos, tempos de latência e SLAs de canais físicos e digitais.
*   **Logs**: Registo detalhado das transações e conexões da base de dados.
*   **Tracing**: Rastreio ponta a ponta correlacionando logs à sua origem legal.
*   **Health & SLA**: Avaliação de conformidade e integridade contínua do ecossistema.

### 4. KMOS Governance (Garantia de Conformidade)
Responsável por garantir a obediência legal e operacional em tempo real.
*   **Lei 40/20**: Lei dos Sistemas de Pagamento de Angola incorporada como invariante sistémica.
*   **Avisos do BNA**: Regras prudenciais e caps de tarifas (Aviso 06/20, 07/20, 10/20, 11/20).
*   **Auditoria**: Rastreabilidade e assinaturas criptográficas de conformidade.
*   **Compliance & Risk**: Pontuação e deteção contínua de riscos transacionais e AML.

---

## Memória Institucional (Institutional Memory)

O KMOS possui consciência da sua história operacional e regulatória. A Memória Institucional do KMOS regista o contexto, o fundamento legal, as consequências sistémicas e a mitigação de riscos de cada decisão, permitindo que a plataforma evolua sem perder clareza nem coerência:

*   **2026**: Adoção do Ledger Imutável por Dupla Entrada. Motivo: Artigo 42.º da Lei 40/20. Consequência: Eliminação completa de divergências de conciliação. Risco mitigado: Muito Alto.
*   **2027**: Ativação do Settlement Offline Criptográfico. Motivo: Cobertura rural e literacia financeira. Consequência: Inclusão de +2 milhões de utilizadores rurais nas províncias sem rede estável. Risco mitigado: Alto (fraude contida por limites severos).
*   **2028**: Adaptação Automática do Aviso 11/2021. Motivo: Novos limites prudenciais e geo-velocity simplificados. Consequência: Reconfiguração em tempo real pelo Policy Engine sem necessidade de intervenção física ou reinstalação de servidores. Risco mitigado: Médio.
