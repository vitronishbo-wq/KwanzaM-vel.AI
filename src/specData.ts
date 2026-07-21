/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SpecSection } from "./types";

export const specSections: SpecSection[] = [
  {
    id: "visao_geral",
    title: "1. Visão Geral do Produto",
    category: "operacao",
    icon: "layers",
    summary: "Missão, posicionamento estratégico e os três pilares que tornam o KwanzaMóvel a ferramenta definitiva para Angola.",
    content: `### 1. Visão Geral do Produto

O **KwanzaMóvel** é concebido como a infraestrutura nacional de pagamentos digitais e dinheiro móvel definitiva para a República de Angola. Desenvolvido com uma filosofia de **simplicidade radical**, o sistema visa desmaterializar as transações financeiras físicas sob o lema estratégico:

> **"Mais simples que o PIX para o utilizador, mais seguro que um banco para o regulador e mais barato que dinheiro físico para os comerciantes."**

#### Os Três Pilares Fundamentais:
1. **Inclusão Financeira Radical:** Aproximadamente 60% da população angolana permanece desbancarizada ou na economia informal. O KwanzaMóvel permite o uso através de Smartphones avançados e aparelhos de tecnologia básica (Feature Phones via protocolo USSD robusto), dependendo exclusivamente do número de telefone.
2. **Eficiência de Custos:** Ao contrário de redes internacionais de cartões de débito que cobram taxas elevadas (1.5% a 3.5%) e requerem terminais físicos caros (POS), o KwanzaMóvel trabalha em infraestrutura híbrida serverless de baixíssimo custo operacional, entregando transações gratuitas para utilizadores individuais e taxas inferiores a 0.2% para comerciantes.
3. **Soberania e Integração de Rede:** Integração nativa com os canais locais (EMIS/Multicaixa) de modo assíncrono e direto, sem o overhead de processamentos legados de core banking, desenhado a pensar na instabilidade das redes de telecomunicações regionais (Luanda, Huambo, Benguela, Cabinda).
`
  },
  {
    id: "arquitetura",
    title: "2. Arquitetura de Alta Escalabilidade",
    category: "arquitetura",
    icon: "cpu",
    summary: "Arquitetura híbrida assíncrona, tolerante a falhas, modelada para suportar até 50 milhões de utilizadores.",
    content: `### 2. Arquitetura Completa de Alta Escalabilidade

A arquitetura do KwanzaMóvel é orientada a eventos (EDA - Event-Driven Architecture), com capacidade de processamento distribuído de transações com consistência eventual garantida por algoritmo SAGA-Pattern e ACID localizado em Ledger Base.

\`\`\`
[Utilizador / App / USSD] ────> [API Gateway / Envoy]
                                         │ (Tokenização & TLS 1.3)
                                         ▼
                             [Microserviço de Transações] 
                             (Go/gRPC - Stateless)
                                 │              │
        ┌────────────────────────┘              └────────────────────────┐
        ▼                                                                ▼
[Redpanda/Kafka Queue]                                          [Serviço Antifraude Real-Time]
        │ (Processamento Assíncrono)                                     │ (MFA Dinâmico)
        ▼                                                                ▼
[Immutable Ledger Service (Rust)] <────────────────────────────── [Base de Dados Principal]
(Dupla Entrada / Double-Entry)                                    (CockroachDB/Spanner)
\`\`\`

#### Componentes de Infraestrutura de Dados:
* **CockroachDB / Google Cloud Spanner:** Escolhido como banco de dados principal pela sua capacidade de consistência transacional estrita (Serializabilidade ACID) em ambiente geograficamente distribuído. Garante que mesmo em caso de falha de Datacenters em Luanda, as operações continuam ativas noutra região.
* **Redpanda / Apache Kafka:** Motor de mensageria ultra-rápido para fila de transações. Permite bufferização de picos de carga de até 250.000 transações por segundo (TPS), protegendo o Immutable Ledger.
* **Immutable Transaction Store (Ledger em Rust):** Um motor de escrita sequencial (append-only) selado criptograficamente com hashes SHA-256 encadeados. Nenhuma transação pode ser alterada ou apagada depois de registada, servindo como a "fonte da verdade" auditável para o BNA.
`
  },
  {
    id: "fluxo_operacional",
    title: "3. Fluxo Operacional",
    category: "operacao",
    icon: "navigation",
    summary: "Fluxo de abertura em 2 minutos e envio de dinheiro em 10 segundos sem digitação de IBAN.",
    content: `### 3. Fluxo Operacional

Projetamos o fluxo com eliminação sistemática de fricção. Sem burocracias desnecessárias, mas mantendo validação estrita em segundo plano.

#### Fluxo 1: Criação de Conta (Apenas 2 minutos)
1. **Registo do Telefone:** Utilizador digita o número (+244) e recebe um OTP de 6 dígitos via canal SMS ou WhatsApp Empresarial (prioritário por motivos de custo).
2. **Scanner do BI (Bilhete de Identidade):** Captura fotográfica automatizada através de IA de OCR local. Os dados são estruturados e enviados via API para triangulação no Registo Civil Angolano.
3. **Definição de PIN:** Criação de PIN numérico de 4 dígitos para confirmação de transações diárias.
4. **Resultados em Tempo Real:** A conta é catalogada no Nível 1 baseada no perfil consultado e ativada imediatamente.

#### Fluxo 2: Envio de Dinheiro (Uso Simplificado em < 10 segundos)
\`\`\`
Utilizador              KwanzaMóvel Gateway            Base de Identidades            Ledger Principal
   │                             │                             │                             │
   │─── Enviar 10.000 AOA ──────>│                             │                             │
   │    para 923-000-111         │                             │                             │
   │                             │─── Confirmar Identidade ───>│                             │
   │                             │    e Estatuto AML           │                             │
   │                             │<── Registo Ativo ───────────│                             │
   │                             │                                                           │
   │<── Solicitar PIN / FaceID ──│                                                           │
   │                             │                                                           │
   │─── PIN Autorizado ─────────>│──────────────────────────────────────────────────────────>│ Grava Débito e
   │                             │                                                           │ Crédito na Base
   │                             │<──────────────────────────────────────────────────────────│ Sucesso (ACID)
   │<── Notificação SMS/Push ────│                                                           │
   │    "Dinheiro Disponível"    │                                                           │
\`\`\`
`
  },
  {
    id: "modelo_dados",
    title: "4. Modelo de Dados",
    category: "arquitetura",
    icon: "database",
    summary: "Estruturas de tabelas relacionais de alta integridade, com histórico de transações e contas por níveis.",
    content: `### 4. Modelo de Dados

O modelo relacional é desenhado para asseverar a integridade financeira e blindagem jurídica. Abaixo, o esquema DDL simplificado representativo e a estrutura relacional idealizada:

#### Schema de Tabela: Contas de Utilizador (\`users\`)
\`\`\`sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(15) UNIQUE NOT NULL, -- Ex: "+244923456789"
    full_name VARCHAR(120) NOT NULL,
    bi_number VARCHAR(15) UNIQUE NOT NULL,    -- Bilhete de Identidade Angolano
    kyc_level VARCHAR(10) NOT NULL DEFAULT 'LEVEL_1', -- 'LEVEL_1', 'LEVEL_2', 'LEVEL_3'
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',     -- 'ACTIVE', 'SUSPENDED', 'FLAGGED'
    device_fingerprint VARCHAR(64) NOT NULL,
    pin_hash VARCHAR(256) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
\`\`\`

#### Schema de Tabela: Plataforma de Ledger Imutável (\`ledger_entries\`)
Formato estrito de contabilidade de partida dobrada (Double-Entry Bookkeeping).
\`\`\`sql
CREATE TABLE ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_transaction_id UUID,
    source_account_id UUID REFERENCES users(id),
    destination_account_id UUID REFERENCES users(id),
    amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'AOA',
    entry_type VARCHAR(12) NOT NULL, -- 'TRANSFER_P2P', 'MERCHANT_PAY', 'CASH_IN', 'CASH_OUT'
    previous_hash VARCHAR(64) NOT NULL, -- Ligação criptográfica ao bloco anterior
    current_hash VARCHAR(64) NOT NULL,  -- SHA-256 do id + amount + previou_hash + timestamp
    signature_block BYTEA NOT NULL,      -- Assinado digitalmente pela chave do gateway
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_ledger_source ON ledger_entries(source_account_id);
CREATE INDEX idx_ledger_destination ON ledger_entries(destination_account_id);
\`\`\`
`
  },
  {
    id: "seguranca",
    title: "5. Modelo de Segurança & Zero Trust",
    category: "seguranca",
    icon: "shield-check",
    summary: "Políticas rígoras de Zero Trust, Criptografia de ponta a ponta, Assinaturas Locais HSM e Modelo de Ameaças.",
    content: `### 5. Modelo de Segurança & Zero Trust

A segurança do KwanzaMóvel não assume limites ou perímetros. Cada transação é autenticada individualmente, monitorizada e isolada.

#### 5.1 Princípios de Segurança Aplicados:
* **Zero Trust total:** Qualquer microserviço requer autenticação mútua via mTLS com certificados rotacionados semanalmente por um servidor HashiCorp Vault.
* **Criptografia de Hardware:** Uso obrigatório de Apple Secure Enclave & Android Keystore de forma a encriptar as chaves privadas biométricas localmente no smartphone do utilizador. O PIN do utilizador é apenas uma chave de derivação criptográfica (KDF) que não corre em redes públicas.
* **MFA Adaptativo:** Ativado com base em anomalias (mudança geométrica rápida Luanda-Lobito em menos de 1 hora, dispositivo desconhecido ou padrões incomuns de uso diário).

#### 5.2 Modelo de Ameaças STRIDE:

| Ameaça | Vetor no Contexto Mobile | Mitigação KwanzaMóvel |
| :--- | :--- | :--- |
| **Spoofing (Identidade)** | Clonagem de cartão SIM / SIM Swap | Bloqueio de SMS OTP como único vetor. Obrigatoriedade de assinatura baseada em chave local (Android KeyStore / Apple Secure Enclave). |
| **Tampering (Alteração)** | Alteração do valor da transação na rede externa | Toda transação é assinada digitalmente de ponta a ponta pela aplicação através de criptografia assimétrica (ECDSA secp256r1). |
| **Repudiation (Repúdio)** | Utilizador afirma que não fez a transação | Criação de log não-repudiável e imutável criptografado com carimbo de tempo assegurado por hardware seguro (TrustZone). |
| **Information Disclosure** | Interceção de saldos em conexões de dados instáveis | Tráfego encapsulado em túnel duplo (gRPC over TLS 1.3 + encriptação payload AES-256-GCM adicional). |
| **Denial of Service** | Ataques coordenados na rede nacional de pagamentos | Infraestrutura redundante hospedada em instâncias dedicadas na Cloud regional com proteção Cloudflare Magic Transit contra volumetria. |
`
  },
  {
    id: "antifraude",
    title: "6. Sistema Antifraude Inteligente",
    category: "seguranca",
    icon: "eye",
    summary: "Monitorização em tempo real baseada em regras inteligentes heurísticas e inteligência geográfica.",
    content: `### 6. Sistema Antifraude Inteligente

A motorização do KwanzaMóvel contra atividades fraudulentas baseia-se numa pipeline híbrida de análises instantâneas. O motor avalia o fluxo de transferências de capitais em **menos de 80 milissegundos**, gerando uma nota de risco (*Risk Scoring*) de 0 a 100.

#### Módulos de Inspeção Antifraude:
1. **Heurística de Velocidade Geográfica:** Bloqueio imediato se a mesma conta tentar liquidar operações em Luanda e no Lubango num intervalo físico impossível por transporte terrestre ou aéreo convencional.
2. **Histórico Comportamental do Lote:** Desvio abrupto do montante comum transacionado. Se uma conta Level-1 (limite diário de 50.000 AOA) transaciona repetidamente lotes no topo de 1 em 1 minuto, o pipeline AML sinaliza contenção e exige FaceID biometria sob pena de bloqueio por suspeita de lavagem de dinheiro (Money Mule).
3. **Rede de Grafos de Lojistas Cúmplices:** Caso um terminal comercial apresente taxas incomuns de devolução ou depósitos estruturados provenientes de novos utilizadores com contas criadas no mesmo dia, o sistema suspende temporariamente os desembolsos imediatos da conta do titular lojista para averiguação manual em 24h.
`
  },
  {
    id: "roadmap",
    title: "7. Roadmap de Desenvolvimento",
    category: "negocio",
    icon: "calendar",
    summary: "Cronograma estratégico dividido em quatro fases essenciais, estruturado em trimestres (Q1 a Q4).",
    content: `### 7. Roadmap de Desenvolvimento

Plano ágil e resiliente focado na validação tecnológica e jurídica antes da escala nacional massiva.

#### Fase 1: Arquitetura Core e Integração Criptográfica (Mês 1 - 3)
* Construção do Immutable Ledger Engine em Rust.
* Configuração da infraestrutura distribuída inicial.
* Desenvolvimento dos canais USSD de suporte legados para equipamentos básicos.
* Criação do primeiro protótipo de scanner OCR e inteligência local para BI angolano.

#### Fase 2: Integração com Sandbox BNA e EMIS (Mês 4 - 6)
* Submissão ao Sandbox Regulatório do Banco Nacional de Angola.
* Teste de interoperabilidade com canais Multicaixa (gateway de depósito automático via IBAN).
* Validação de fluxos de segurança física com auditoria externa de hacking ético.

#### Fase 3: Piloto Controlado em Províncias Selecionadas (Mês 7 - 9)
* Lançamento restrito a 10.000 voluntários selecionados em Luanda e Benguela.
* Cadastramento voluntário de 200 comerciantes-âncora (mercados municipais de Viana e Lobito).
* Calibração de velocidades de resposta e capacidade de sincronização offline.

#### Fase 4: Produção Geral e Expansão (Mês 10 - 12)
* Lançamento de produção pública nas lojas AppStore e PlayStore.
* Aceleração de campanhas de agentes comunitários no Huambo, Cabinda e Huíla.
* Integração de serviços governamentais de recebimento de impostos e apoio social.
`
  },
  {
    id: "plano_piloto",
    title: "8. Plano de Lançamento Piloto",
    category: "negocio",
    icon: "rocket",
    summary: "Desdobramento tático nas regiões de Luanda, Viana, Lobito e Benguela com foco em feiras e cooperativas.",
    content: `### 8. Plano de Lançamento Piloto

O sucesso do piloto depende da proximidade com a economia real de Angola. Faremos do piloto um teste em ambiente crítico para simular cenários de alta escassez de infraestrutura de dados estável.

#### 1. Foco Geográfico de Validação:
* **Luanda Metropolitana:** Comerciantes da Feira do Kifica (Talatona) e Mercado de Viana. Zona com alto volume de vendas a dinheiro físico e alta densidade populacional.
* **Benguela/Lobito:** cooperativas de pesca locais. Teste exaustivo de resistência física sob condições de redes móveis fracas próximas da linha costeira.

#### 2. Parâmetros de Avaliação (KPIs de Sucesso):
* **Fácil Aprendizado:** Percentual superior a 95% de criação de registo concluído sem ajuda externa de promotores na feira.
* **Velocidade de Execução:** Menos de 3 segundos de feedback de pagamento visual por parte do comprador e som de confirmação no altifalante no balcão do lojista.
* **Taxa de Retenção de Uso:** Pelo menos 4 transações semanais recorrentes em cada comerciante credenciado pelo ecossistema.
`
  },
  {
    id: "expansao_nacional",
    title: "9. Plano de Expansão Nacional",
    category: "negocio",
    icon: "map",
    summary: "Estratégia capilar para cobertura de 18 províncias, utilizando rede de postos móveis e agências simplificadas.",
    content: `### 9. Plano de Expansão Nacional

Passada a fase piloto, o KwanzaMóvel escalará com uma estratégia baseada em **capilaridade social**, dispensando a abertura de balcões bancários físicos tradicionais dispendiosos.

#### Os 'Postos KwanzaMóvel':
Substituiremos agências bancárias por uma forte cooperação com estabelecimentos locais (Kandarings, Cantinas, Postos de Combustíveis e Farmácias) promovidos a **Agentes Autorizados de Levantamento e Depósito**.

\`\`\`
                           [Plataforma KwanzaMóvel Core]
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        ▼                                ▼                                ▼
 [Agente Autorizado 1]            [Agente Autorizado 2]            [Agente Autorizado 3]
  (Cantina do Bairro)            (Farmácia Comunitária)            (Posto de Combustível)
        │                                │                                │
        ▼                                ▼                                ▼
Utilizadores Locais:              Utilizadores Locais:              Utilizadores Locais:
Moçâmedes e Huambo                Cabinda Interior                   Saurimo / Lunda Sul
\`\`\`

#### Aliança de Telecomunicações:
Acordo governamental com a Unitel e Movicel de forma a garantir a **isenção de cobrança de consumo de internet (Zero-Rating)** para a app KwanzaMóvel, removendo a necessidade do utilizador possuir pacotes de dados de internet móvel contratados para conseguir enviar ou receber dinheiro.
`
  },
  {
    id: "monetizacao",
    title: "10. Estratégia de Monetização",
    category: "negocio",
    icon: "trending-up",
    summary: "Monetização inteligente focada em micro taxas empresariais, mantendo gratuidade para o cidadão comum.",
    content: `### 10. Estratégia de Monetização

O KwanzaMóvel alinha-se com as premissas de inclusão financeira do BNA, onde transações entre utilizadores comuns (P2P) são **100% gratuitas**. O modelo de rentabilidade assenta puramente em economias de escala com o mercado corporativo.

#### Taxas Transparentes aos Comerciantes (B2C, B2B):
* **Comerciantes Locais Pequenos (Micro-empreendedor):** 0.15% por transação recebida. Sem custo de adesão, sem aluguer mensal, sem compra de terminais físicos.
* **Grandes Marcas e Supermercados (Kero, Candando, Maxi):** Taxa fixa de 0.10% por via de pagamento digital direto por código QR, em contraste com as pesadas comissões bancárias vigentes de 1.2% nos POS Multicaixa tradicionais.
* **Retirada de Saldo para Plataformas Bancárias Tradicionais (Cash-Out para IBAN):** Cobrança de uma taxa simbólica administrativa fixa de 50 AOA por transferência de saída para desincentivar a retirada física e manter a circulação do capital dentro da economia puramente digital do KwanzaMóvel.
`
  },
  {
    id: "estrutura_custos",
    title: "11. Estrutura de Custos Operacionais",
    category: "negocio",
    icon: "dollar-sign",
    summary: "Otimização de custos baseada em arquitetura Serverless, reduzindo em até 95% o custo operacional bancário tradicional.",
    content: `### 11. Estrutura de Custos

Para suportar transações gratuitas e sustentáveis, os custos de infraestrutura operacional precisam de estar em patamares substancialmente inferiores aos dos operadores de pagamentos convencionais.

#### Distribuição Ideada de Custos Tecnológicos:
* **Telecomunicações e SMS OTP:** O SMS tradicional representa um grande gargalo financeiro em Angola. Mitigamos esse custo em 80% ao forçar o envio preferencial de alertas e autenticação via canal WhatsApp Cloud API e notificação Push para Smartphones, retendo o SMS convencional para situações restritas a feature phones residuais sem acesso de internet ativa.
* **Custos Computadorizados de Nuvem:** Usando arquiteturas Serverless e computação em contêineres dimensionados de forma dinâmica pela plataforma Kubernetes, o custo operacional de infraestrutura computacional direta é estimado em **menos de 0.05 AOA por transação processada**.
* **Integração KYC do Governo:** Custos marginais fixos com o órgão de identificação governamental pela validação de registos, absorvidos pela comissão de grandes lojistas e volume agregado de operação.
`
  },
  {
    id: "governanca",
    title: "12. Governação Tecnológica",
    category: "arquitetura",
    icon: "globe",
    summary: "Padrões de soberania de dados, propriedade intelectual nacional e conformidade com auditoria governamental.",
    content: `### 12. Governação Tecnológica

Toda infraestrutura, código-fonte e segredos criptográficos constituem um ativo estratégico de importância nacional, com blindagem jurídica contra ingerências de corporações terceiras.

#### Regras de Governação Estritas:
1. **Soberania de Dados:** Todos os dados pessoais dos cidadãos, registos de tráfego financeiro e logs de autenticação devem ser armazenados geograficamente ou espelhados fisicamente em servidores e datacenters instalados em solo soberano angolano (ex: Datacenters da Angotic, MSTelcom ou parceiro governamental certificado).
2. **Auditoria de Código-Fonte Aberto ao Regulador:** Disponibilização de portais de submissão exclusivos ao BNA para auditorias cibernéticas automatizadas semanais a nível de repositórios Git, garantindo que não existem retrovias ou vulnerabilidades introduzidas de forma intencional por desenvolvedores terceiros contratados.
3. **Padrão Open Source para Interoperabilidade:** Fornecimento simplificado descritivo de bibliotecas de emparelhamento técnico para qualquer startup ou programador angolano construir soluções verticais baseadas no KwanzaMóvel.
`
  },
  {
    id: "gestao_risco",
    title: "13. Gestão de Riscos Operacionais",
    category: "regulamentacao",
    icon: "alert-triangle",
    summary: "Plano estratégico de contenção para riscos de liquidez, falha sistémica de telecomunicações e fraude em Angola.",
    content: `### 13. Gestão de Riscos Operacionais

Uma matriz de riscos estruturada que endereça as realidades geopolíticas, estruturais e humanas específicas da região angolana.

#### 1. Risco de Interrupção das Redes Móveis (Telecoms Outage)
* **Impacto:** Alto. Se a operadora Unitel ou Movicel sofrer falha de cobertura em certas regiões, as transações correm o risco de ser interrompidas.
* **Mitigação:** Desenvolvimento do **Modo de Assinatura Local Offline**. O smartphone gera um bilhete criptográfico temporário encriptado localmente sob assinatura privada segura. O lojista recolhe o bilhete via conexão Bluetooth de proximidade ou código numérico que é verificado localmente no terminal do lojista e liquidado no momento em que a rede reestabelecer.

#### 2. Risco de Lavagem de Dinheiro (AML Risk)
* **Impacto:** Alto. Lavagem de valores fracionados de origem criminosa.
* **Mitigação:** Definição de limites estritos baseados na validação dos níveis de KYC. Os utilizadores de nível de conta inicial (Level-1) estão restritos a saldos máximos de 50.000 AOA diários. Valores maiores necessitam de atualização biométrica de nível que solicita contrato profissional de trabalho ou licença de atividade comercial emitida localmente.
`
  },
  {
    id: "disaster_recovery",
    title: "14. Disaster Recovery & Alta Disponibilidade",
    category: "arquitetura",
    icon: "database",
    summary: "Estratégia ativo-ativo, backups geograficamente distribuídos e tolerância a falhas extremas.",
    content: `### 14. Disaster Recovery & Alta Disponibilidade

A disponibilidade cibernética requer redundância física e lógica constante capaz de mitigar intempéries severas e rotura de cabos de comunicação transoceânicos.

\`\`\`
       [Centro de Ligação A (Luanda)]                    [Centro de Ligação B (Benguela)]
       Datacenter Primário Ativo                          Datacenter de Redundância Ativo
                     │                                                 │
                     ▼                                                 ▼
             [CockroachDB Nó 1] ◄──── Replicação Síncrona ───► [CockroachDB Nó 2]
                     │                                                 │
                     └────────────────────────┬────────────────────────┘
                                              ▼
                                 [Armazenamento Frio Offline]
                                 Fita LTO / Backup Criptografado
                                 Semanal fora da rede
\`\`\`

#### Planos de Tolerância e RPO / RTO:
* **Recovery Point Objective (RPO):** < 500 milissegundos. Perda máxima admissível de dados em falha catastrófica de centro de dados de Luanda.
* **Recovery Time Objective (RTO):** < 3 segundos. Tempo para chaveamento automático de servidores (Auto-Failover) redirecionando todo o tráfego móvel nacional de dados para o polo geográfico alternativo da Huíla ou Benguela.
* **Backups Mecânicos Offline (Cold Backups):** Cópia física criptografada diária gravada em suportes offline fisicamente custodiados em cofres de segurança máxima do Banco de Angola, impossibilitando aniquilação e resiliência a ataques do tipo Ransomware de escala internacional.
`
  },
  {
    id: "apis_principais",
    title: "15. Documentação de APIs Principais",
    category: "arquitetura",
    icon: "code",
    summary: "Descrição Swagger de endpoints cruciais para transferências, pagamentos dinâmicos e validação KYC.",
    content: `### 15. APIs Principais de Integração

O KwanzaMóvel disponibiliza APIs OpenAPI 3.0 rápidas descritas com payload em formato puramente JSON e autenticação Bearer JWT associada a assinaturas criptográficas de integridade de payload.

#### API 1: Criar Intenção de Envio (P2P Transfer)
* **Endpoint:** \`POST /api/v1/transfers\`
* **Frequência Recomenda:** Síncrono-direto.

##### Payload de Requisição (Request JSON):
\`\`\`json
{
  "source_phone": "+244923000111",
  "destination_phone": "+244923000222",
  "amount": 5500.00,
  "currency": "AOA",
  "pin_signed_token": "sig_abcd1234efgh5678ijklmnop9012qrst",
  "device_fingerprint": "dev_9x8c7b6a5f4e3d2"
}
\`\`\`

##### Resposta de Sucesso (Response 201 Created):
\`\`\`json
{
  "transaction_id": "tx_fa7680ba-b87c-11ec-b909-0242ac120002",
  "status": "COMPLETED",
  "timestamp": "2026-06-22T13:22:21Z",
  "balance_remaining": 44500.00,
  "receipt_url": "https://receipt.kwanzamovel.ao/tx_fa7680ba"
}
\`\`\`

#### API 2: Verificação Instantânea de Nível KYC
* **Endpoint:** \`GET /api/v1/kyc/verify/+244923000111\`
`
  },
  {
    id: "ux_ui",
    title: "16. Especificações de UX/UI Minimalista",
    category: "operacao",
    icon: "smartphone",
    summary: "Garantia de usabilidade para analfabetos funcionais e interfaces simplificadas sem distração visual.",
    content: `### 16. UX/UI Minimalista e Acessibilidade

O maior erro dos sistemas de mobile money concorrentes é a poluição visual que afasta os utilizadores periféricos de baixa literacia digital. Reduzimos o ecrã principal da aplicação às **quatro ações imperativas de sobrevivência diária**.

#### As 4 Ações Principais:
1. **Saldo Actualizado:** Em tipografia de grande porte, visível na parte superior do ecrã com fácil opção de ocultação de privacidade via biometria com um toque.
2. **Botão Enviar (Transferência):** Abre imediatamente o teclado numérico do telefone para digitar número ou selecionar um contacto da lista telefónica.
3. **Botão Receber (QR Code / Token de Voz):** Mostra um código QR ou um código numérico curto alternativo de 4 dígitos audível, para o utilizador ditar verbalmente no balcão de um estabelecimento a receber capital.
4. **Botão Pagar a Lojista:** Ativa a câmara integrada do telefone para ler em menos de 0.5 segundos qualquer QR Code de estabelecimento local ou digitar o PIN da operação.
`
  },
  {
    id: "infraestrutura_cloud",
    title: "17. Infraestrutura Cloud Recomendada",
    category: "arquitetura",
    icon: "cloud",
    summary: "Especificações de topologia cloud com foco em latência reduzida e infraestrutura híbrida local.",
    content: `### 17. Infraestrutura Cloud Recomendada

A topologia do KwanzaMóvel tira proveito da virtualização na nuvem sem comprometer as exigências jurídicas de armazenamento de chaves e dados locais.

#### Proposta de Desenho Híbrido:
* **Edge Layer Computacional (Google Cloud Platform / AWS):** Hospedagem de instâncias Kubernetes (GKE) rápidas no ponto mais próximo de Angola (Edge locations de Joanesburgo em África do Sul e Luanda local) para servir conteúdo estático das apps em tempo recorde (< 40ms).
* **Core Ledger Physical Nodes:** Servidores base dedicados instalados em Datacenters com chancela estatal angolana rodando clusters seguros CockroachDB com replicação redundante imediata.
* **Segurança na Borda (Cloudflare):** Processamento antispam de requisições, compressão de pacotes ZIP e proteção total e ativa de borda com certificação antivírus e auditorias contínuas automatizadas.
`
  },
  {
    id: "regulamentos",
    title: "18. Requisitos Regulatórios do BNA",
    category: "regulamentacao",
    icon: "file-text",
    summary: "Equadramento com a Lei de Sistemas de Pagamentos de Angola e regras estritas do BNA.",
    content: `### 18. Requisitos Regulatórios do BNA

Toda iniciativa financeira em Angola deve operar em estreita obediência com o enquadramento regulatório do Banco Nacional de Angola (BNA).

#### Principais Leis e Requisitos Mapeados na Plataforma:
1. **Lei do Sistema de Pagamentos de Angola (Lei nº 40/20):** Enquadramento pleno como Instituição de Moeda Eletrónica (IME) e Prestador de Serviços de Pagamento (PSP).
2. **KYC Escalonado (Regulamento de Prevenção de Branqueamento de Capitais do BNA):**
   * **Nível 1 (Simplificado):** Cadastro apenas com Número de Telefone e Validação de BI. Limite diário de movimentação de 50.000 AOA. Limite de saldo acumulado de Máximo 300.000 AOA.
   * **Nível 2 (Intermediário):** Exigência de Fotografia de auto-identificação (Live Selfies) e verificação do Registo de Contribuinte (NIF). Limite diário de 500.000 AOA.
   * **Nível 3 (Completo - Comercial ou Alta Renda):** Exigência de comprovativo de morada de residência e documento de licença de atividade comercial ou contratação formal. Limite diário de 5.000.000 AOA.
3. **Reserva Bancária Segura:** 100% dos fundos custodiados na carteira digital devem ser salvaguardados em conta fiduciária de reserva do BNA ou distribuídos de forma segura em consórcios de Bancos Comerciais Públicos de Angola de modo a garantir risco de liquidez zero ao cidadão.
`
  },
  {
    id: "crescimento",
    title: "19. Estratégia de Crescimento Exponencial",
    category: "negocio",
    icon: "users",
    summary: "Hack de distribuição comunitária por alianças de micro comércio e incentivo aos agentes.",
    content: `### 19. Estratégia de Crescimento Exponencial

Para crescer num mercado com pouca educação financeira, evitaremos propaganda abstrata e cara de media tradicional e focaremos na estratégia base de **Incentivo e Conversão Social**.

#### Mecanismos Virais de Penetração de Mercado:
* **Conquista de Cooperativas e Associações de Táxis (Candongueiros):** Acordo institucional para os Candongueiros de Luanda e Huambo aceitarem pagamento KwanzaMóvel de forma prioritária. Os auxiliares de condução e motoristas ganham taxas zero ao acumular e podem pagar nos postos autorizados de combustível imediatamente sem precisar correr o risco de segurar grandes montes de notas físicas em Luanda.
* **Bónus comunitário de rede de Agente:** Cada cantina ou quiosque comercial de bairro que cadastrar um novo cliente recebe uma bonificação imediata de 200 AOA (pagos pelo próprio fundo governamental de fomento financeiro) por cada registo validado por KYC, transformando pequenas lojas numa força ativa e orgânica de vendas.
`
  },
  {
    id: "comparacao",
    title: "20. Comparação Técnica Avançada",
    category: "regulamentacao",
    icon: "git-merge",
    summary: "Análise profunda demonstrando como o KwanzaMóvel supera as limitações históricas do PIX, M-Pesa e PayPal.",
    content: `### 20. Comparação Técnica: KwanzaMóvel vs PIX vs M-Pesa vs PayPal

Abaixo, uma tabela comparativa evidenciando as escolhas de engenharia e os pilares de inclusão que fazem do KwanzaMóvel um ativo superior para África Austral:

| Característica | KwanzaMóvel | PIX (Brasil) | M-Pesa (Moçambique/Quénia) | PayPal |
| :--- | :--- | :--- | :--- | :--- |
| **Público Principal** | Economia informal rural/urbana e investidores angolanos. | Cidadãos bancarizados digitais da América Latina. | Moçambique, Tanzânia, Quénia via rede de operadoras SIM. | E-commerce global e transferências premium. |
| **Internet Mínima** | Isenção total de tráfego móvel nacional e USSD. | Requer rede móvel ou WiFi estável ativa de dados. | Baixa velocidade baseada em menus USSD básicos. | Requer banda larga estável em ambiente seguro. |
| **Custos Comerciante** | **< 0.20%** por venda concluída e sem aluguer mensal. | Variável (0.5% a 1.25% nos bancos) ou fixos elevados. | Custo elevado de retirada e transações comerciais encarecidas (1% - 2.5%). | Custos altíssimos de recebimento (~3.4% + taxa fixa). |
| **Tempo de Execução** | **< 2 segundos** em ambiente distribuído. | Instantâneo (< 2 segundos) em infraestrutura bancária rígida. | Lento (3 a 10 segundos para processamento de filas USSD SIM). | Lento das redes tradicionais (vários minutos para processar crédito). |
| **Redundância Offline** | **Modo Offline com Assinatura Criptográfica Local.** | Sem suporte. Requer rede de internet em tempo real em ambas as pontas. | Dependente da rede central e sinal satelital da operadora de telecom. | Sem suporte offline de qualquer esfera operacional. |
`
  }
];
