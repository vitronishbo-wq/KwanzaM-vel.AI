# LSPA — Requisitos Técnicos e de Segurança (Technical Requirements)
> **Engineering Non-Functional Requirements (NFRs):** Especificações de infraestrutura e criptografia

---

## I. INTRODUÇÃO
A conformidade regulatória exige que as escolhas de infraestrutura, arquitetura de software e criptografia do KwanzaMóvel reflitam as diretivas de alta resiliência e integridade impostas pelo BNA.

---

## II. REQUISITOS TÉCNICOS NÃO-FUNCIONAIS (NFRs)

### 1. Criptografia de Dados Sensíveis e Comunicações [Artigo 96.º]
*   **Requisito:** Todos os dados de pagamento sensíveis em trânsito e em repouso devem ser cifrados com algoritmos seguros.
*   **Padrão Técnico:**
    *   *Comunicação:* Forçar tráfego exclusivamente via HTTPS/TLS 1.3 com suites de cifra robustas.
    *   *Dados em Repouso:* Senhas, PINs e chaves privadas cifrados usando hashes criptográficos robustos com sal (ex: bcrypt ou Argon2id).
    *   *Sessões:* JWT assinados com HS256/RS256 com tempo de expiração curto (máximo de 15 minutos de inatividade).

### 2. Transações ACID e Isolamento de Base de Dados [Artigo 40.º]
*   **Requisito:** A liquidação das transações deve possuir garantia transacional atômica para evitar duplicações de Kwanzas digitais em falhas de rede.
*   **Padrão Técnico:**
    *   *Isolamento:* Utilizar nível de isolamento de transação **Serializable** ou **Read Committed** com locks pessimistas (`SELECT ... FOR UPDATE`) na tabela de carteiras durante a transferência.
    *   *Atomicidade:* Todas as operações de débito, crédito e postagem de ledger devem ocorrer em transações de banco de dados ACID unificadas. Em caso de falha em qualquer etapa, a transação deve ser completamente desfeita (Rollback).

### 3. Alta Disponibilidade e Redundância [Artigo 3.º]
*   **Requisito:** Garantir funcionamento contínuo do sistema financeiro para saques e depósitos (SLA de 99.95%).
*   **Padrão Técnico:**
    *   *Orquestração:* Deployment em Cloud Run com auto-scaling imediato para lidar com picos de tráfego.
    *   *Monitorização:* Healtchecks automatizados `/api/health` respondendo em menos de 100ms.

### 4. Trail de Auditoria Imutável e Retenção de Dados [Artigo 23.º]
*   **Requisito:** Conservar registos detalhados de todas as transações, reclamações e incidentes por um prazo mínimo legal de 10 anos.
*   **Padrão Técnico:**
    *   *Ledger:* Razão fiduciário de dupla entrada imutável. Não é permitido efetuar atualizações diretas (`UPDATE`) nos registros de movimentações já efetuados; qualquer ajuste deve ser postado como nova entrada de ajuste.
    *   *Backup:* Rotina de backup incremental diário com replicação geográfica multi-região.
