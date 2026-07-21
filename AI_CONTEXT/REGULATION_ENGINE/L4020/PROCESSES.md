# LSPA — Fluxos e Processos Operacionais (Processes)
> **Fluxos de Engenharia:** Execução procedural de directivas regulatórias do BNA

---

## I. INTRODUÇÃO
Os processos de negócio do KwanzaMóvel devem mimetizar os limites e obrigações legais em fluxos de execução explícitos e auditáveis.

---

## II. PRINCIPAIS PROCESSOS MODELADOS

### 1. Processo de Registo de Utilizador e KYC Escalonado (Aviso 03/22 Artigo 19.º)
Este processo gere o onboarding do utilizador, atribuindo-lhe limites transacionais condizentes com a documentação apresentada e validada.

```text
  [ Entrada: Telemóvel ] ──► [ Cadastro Inicial: KYC Level-1 ] (Limite: 50.000 Kz)
                                         │
                                         ▼
                             [ Upload do BI de Angola ]
                                         │
                                         ▼
                            [ Validação do Registo Civil ]
                                         │
                                         ▼
                             [ Atribuição de KYC Level-2 ] (Limite: 500.000 Kz)
```

### 2. Processo de Execução de Transferência e Verificação de Limites (Aviso 03/22 Artigo 18.º)
Todas as operações de transferência de e-Money são submetidas a uma validação temporal contínua antes do débito real da carteira.

```text
  [ Início da Transferência ]
              │
              ▼
  [ Calcular Gasto Acumulado de Hoje ] (Via WalletRepository)
              │
              ▼
  [ Avaliar Limite KYC por Tier ] (Via RuleEvaluator.evaluateDailyLimit)
              │
      ┌───────┴───────┐
      ▼ (Sim)         ▼ (Não)
  [ Autoriza ]    [ Rejeita ] ──► [ Grava Evento de Abuso ] (RegulatoryLimitBreachedEvent)
      │
      ▼
  [ Executa Débito e Crédito ] ──► [ Registo Ledger Dupla Entrada ] (Artigo 40.º LSPA)
```

### 3. Processo de Reconciliação Periódica do Lastro (Aviso 03/22 Artigo 20.º)
Garante a equivalência total entre moeda eletrónica emitida e reservas de salvaguarda.

```text
  [ Cron Job / Gatilho Administrativo ]
                    │
                    ▼
  [ Somatório de Todos os Saldos de Wallets ] ──► (Total e-Money em Circulação)
                    │
                    ▼
  [ Consulta Saldo de Contas Fiduciárias Bancárias ] ──► (Total Reservas de Salvaguarda)
                    │
                    ▼
  [ Compara: e-Money == Reservas? ]
                    │
           ┌────────┴────────┐
           ▼ (Sim)           ▼ (Não)
     [ Balanço OK ]    [ ALERTA CRÍTICO COMPLIANCE ] ──► [ Notifica Administradores ]
```
