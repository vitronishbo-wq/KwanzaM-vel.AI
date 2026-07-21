import { Obligation, DomainObject, RegulatoryEvent, RegulatoryRelation } from './types';

export const OBLIGATIONS_REGISTRY: Record<string, Obligation> = {
  'L40-ART-3': {
    id: 'L40-ART-3',
    lei: 'Lei n.º 40/20',
    artigo: 'Artigo 3.º',
    capitulo: 'Capítulo I',
    tipo: 'Mandatory',
    actor: 'Banco Nacional de Angola / Payment Service Provider',
    trigger: 'All operations of the payment system',
    constraint: 'Ensure safety, operational reliability, efficiency, and transparency in all financial flows.',
    severity: 'Critical',
    testRequired: true,
    auditRequired: true,
    implementationStatus: 'Partially_Implemented',
    linkedUseCases: ['TransferUseCase', 'AuditTrailUseCase'],
    linkedRepositories: ['WalletRepository', 'AuditRepository'],
    linkedEvents: ['RegulatoryLimitBreachedEvent', 'WalletBlockedEvent'],
    linkedMetrics: ['system_latency_ms', 'transaction_success_rate_percent'],
    description: 'Establishment of the fundamental public interest objectives: safety, efficiency, and operational soundness.',
    concepts: ['Segurança Sistémica', 'Eficiência Operacional', 'Transparência de Fluxos'],
    rights: ['Direito de acesso a relatórios de auditoria pelo BNA'],
    prohibitions: ['Proibição de liquidação sem verificação de riscos operacionais'],
    evidenceRequired: {
      logs: ['LOG_SYSTEM_LATENCY', 'LOG_TRANSACTION_STATUS'],
      events: ['RegulatoryLimitBreachedEvent', 'WalletBlockedEvent'],
      databaseTables: ['system_audits', 'transactions'],
      retentionPeriodYears: 10
    },
    versioning: {
      effectiveFrom: '2020-12-15',
      dependsOn: []
    }
  },
  'L40-ART-4': {
    id: 'L40-ART-4',
    lei: 'Lei n.º 40/20',
    artigo: 'Artigo 4.º',
    capitulo: 'Capítulo I',
    tipo: 'Mandatory',
    actor: 'Payment Service Provider',
    trigger: 'Deposit or cash-out requested by user',
    constraint: 'Enable deposit and withdrawal services on payment accounts safely and according to regulated procedures.',
    severity: 'High',
    testRequired: true,
    auditRequired: true,
    implementationStatus: 'Implemented',
    linkedUseCases: ['DepositUseCase', 'WithdrawalUseCase'],
    linkedRepositories: ['WalletRepository'],
    linkedEvents: ['WalletDeposited', 'WalletWithdrawn'],
    linkedMetrics: ['cash_in_volume_aoa', 'cash_out_volume_aoa'],
    description: 'Regulation of services that enable cash deposits and withdrawals on payment accounts.',
    concepts: ['Conta de Pagamento', 'Depósito Físico', 'Levantamento de Fundos'],
    rights: ['Direito do utilizador de retirar fundos a qualquer momento'],
    prohibitions: ['Proibição de reter fundos de depósitos autorizados sem ordem judicial ou suspeita de AML'],
    evidenceRequired: {
      logs: ['LOG_DEPOSIT_INITIATED', 'LOG_WITHDRAWAL_COMPLETED'],
      events: ['WalletDeposited', 'WalletWithdrawn'],
      databaseTables: ['wallets', 'ledger_entries'],
      retentionPeriodYears: 5
    },
    versioning: {
      effectiveFrom: '2020-12-15',
      dependsOn: ['L40-ART-3']
    }
  },
  'L40-ART-18': {
    id: 'L40-ART-18',
    lei: 'Lei n.º 40/20',
    artigo: 'Artigo 18.º',
    capitulo: 'Capítulo II',
    tipo: 'Mandatory',
    actor: 'Payment Service Provider / Agents',
    trigger: 'Onboarding or transaction by commercial agents / proxies',
    constraint: 'Ensure agents are registered formally, verified under strict KYC limits, and comply with MDR ceilings.',
    severity: 'High',
    testRequired: true,
    auditRequired: true,
    implementationStatus: 'Partially_Implemented',
    linkedUseCases: ['RegisterMerchantUseCase', 'MerchantPaymentUseCase'],
    linkedRepositories: ['MerchantRepository'],
    linkedEvents: ['MerchantRegisteredEvent', 'RegulatoryMdrViolationEvent'],
    linkedMetrics: ['active_agents_count', 'agent_commissions_bps'],
    description: 'Use of third parties (agents/correspondents) for the distribution of payment services.',
    concepts: ['Agente Correspondente', 'Merchant Discount Rate (MDR)', 'Limites de Distribuição'],
    rights: ['Direito de remuneração comissionada de agentes'],
    prohibitions: ['Proibição de taxas acima do teto de MDR estabelecido pelo BNA'],
    evidenceRequired: {
      logs: ['LOG_MERCHANT_KYC_VERIFICATION', 'LOG_COMMISSION_DISBURSEMENT'],
      events: ['MerchantRegisteredEvent', 'RegulatoryMdrViolationEvent'],
      databaseTables: ['merchants', 'agent_transactions'],
      retentionPeriodYears: 5
    },
    versioning: {
      effectiveFrom: '2020-12-15',
      dependsOn: ['L40-ART-3']
    }
  },
  'L40-ART-20': {
    id: 'L40-ART-20',
    lei: 'Lei n.º 40/20',
    artigo: 'Artigo 20.º',
    capitulo: 'Capítulo II',
    tipo: 'Mandatory',
    actor: 'Payment Service Provider',
    trigger: 'Daily reconciliation routine and new emission of e-Money',
    constraint: 'Keep 100% of all issued electronic money backed by actual physical fiat reserves in commercial banks (liquidity safeguard). No overdrafts allowed.',
    severity: 'Critical',
    testRequired: true,
    auditRequired: true,
    implementationStatus: 'Partially_Implemented',
    linkedUseCases: ['TransferUseCase'],
    linkedRepositories: ['WalletRepository', 'LedgerRepository'],
    linkedEvents: ['BalanceDiscrepancyDetectedEvent'],
    linkedMetrics: ['emitted_emoney_sum', 'safeguarded_funds_sum'],
    description: 'Obligation to safeguard the funds received from payment service users through secure fiduciary accounts.',
    concepts: ['Património de Afectação', 'Lastro de Moeda Electrónica', 'Garantia de Liquidez'],
    rights: ['Direito de exclusão de fundos de garantia da massa falida do operador'],
    prohibitions: ['Proibição absoluta de conceder crédito ou descobertos a partir de contas de custódia'],
    evidenceRequired: {
      logs: ['LOG_RECONCILIATION_RUN', 'LOG_RESERVE_SYNC_SUCCESS'],
      events: ['BalanceDiscrepancyDetectedEvent'],
      databaseTables: ['ledger_reconciliations', 'reserve_balances'],
      retentionPeriodYears: 10
    },
    versioning: {
      effectiveFrom: '2020-12-15',
      dependsOn: ['L40-ART-40']
    }
  },
  'L40-ART-40': {
    id: 'L40-ART-40',
    lei: 'Lei n.º 40/20',
    artigo: 'Artigo 40.º',
    capitulo: 'Capítulo III',
    tipo: 'Mandatory',
    actor: 'Payment System Operator',
    trigger: 'Payment settlement process',
    constraint: 'A payment order entered and cleared in the system is definitive, final, and legally irrevocable.',
    severity: 'Critical',
    testRequired: true,
    auditRequired: true,
    implementationStatus: 'Implemented',
    linkedUseCases: ['TransferUseCase'],
    linkedRepositories: ['LedgerRepository'],
    linkedEvents: ['TransactionCompletedEvent'],
    linkedMetrics: ['ledger_integrity_score', 'cleared_transactions_count'],
    description: 'Definition of finality and irrevocability of transfer orders in payment systems.',
    concepts: ['Definitividade de Liquidação', 'Irrevogabilidade', 'Compensação Multilateral'],
    rights: ['Garantia de liquidação final a favor do beneficiário'],
    prohibitions: ['Proibição de estornar ou reverter uma transação liquidada sem consentimento do beneficiário'],
    evidenceRequired: {
      logs: ['LOG_LEDGER_BLOCK_SEALED', 'LOG_SETTLEMENT_FINALIZED'],
      events: ['TransactionCompletedEvent'],
      databaseTables: ['ledger_entries', 'settlement_logs'],
      retentionPeriodYears: 10
    },
    versioning: {
      effectiveFrom: '2020-12-15',
      dependsOn: []
    }
  },
  'L40-ART-47': {
    id: 'L40-ART-47',
    lei: 'Lei n.º 40/20',
    artigo: 'Artigo 47.º',
    capitulo: 'Capítulo IV',
    tipo: 'Mandatory',
    actor: 'Payment Service Provider',
    trigger: 'User consults terms of use, pricing, or fees',
    constraint: 'Provide terms, pricing tables, and contracts transparently in Portuguese language before any transaction is initiated.',
    severity: 'Medium',
    testRequired: true,
    auditRequired: false,
    implementationStatus: 'Implemented',
    linkedUseCases: ['FaqUseCase'],
    linkedRepositories: [],
    linkedEvents: [],
    linkedMetrics: ['pricing_view_count'],
    description: 'Requirements of transparency, pricing publication, and language requirements.',
    concepts: ['Dever de Informação', 'Publicação de Preçários', 'Transparência Contratual'],
    rights: ['Direito do consumidor de conhecer todas as tarifas aplicáveis de forma antecipada'],
    prohibitions: ['Proibição de cobrar qualquer comissão oculta ou não descrita no preçário homologado'],
    evidenceRequired: {
      logs: ['LOG_PRICING_RENDERED', 'LOG_USER_TERMS_ACCEPTED'],
      events: [],
      databaseTables: ['pricing_models', 'user_consents'],
      retentionPeriodYears: 5
    },
    versioning: {
      effectiveFrom: '2020-12-15',
      dependsOn: []
    }
  },
  'L40-ART-68': {
    id: 'L40-ART-68',
    lei: 'Lei n.º 40/20',
    artigo: 'Artigo 68.º',
    capitulo: 'Capítulo IV',
    tipo: 'Mandatory',
    actor: 'Payment Service Provider / User',
    trigger: 'Execution of a payment operation',
    constraint: 'Explicit consent must be provided by the payor before any transaction. Consent can be withdrawn before settlement.',
    severity: 'High',
    testRequired: true,
    auditRequired: true,
    implementationStatus: 'Partially_Implemented',
    linkedUseCases: ['TransferUseCase'],
    linkedRepositories: ['WalletRepository'],
    linkedEvents: ['ConsentVerifiedEvent', 'ConsentWithdrawnEvent'],
    linkedMetrics: ['consent_given_count', 'consent_failures_count'],
    description: 'Consent requirements for initiating and executing payment operations.',
    concepts: ['Consentimento Explicito', 'Revogabilidade do Consentimento', 'Autorização Prévia'],
    rights: ['Direito do ordenante de autorizar ou rejeitar individualmente cada transação'],
    prohibitions: ['Proibição de realizar débitos automáticos não autorizados previamente de forma expressa'],
    evidenceRequired: {
      logs: ['LOG_CONSENT_CHALLENGE', 'LOG_CONSENT_SIGNATURE_OK'],
      events: ['ConsentVerifiedEvent', 'ConsentWithdrawnEvent'],
      databaseTables: ['user_consents', 'transactions'],
      retentionPeriodYears: 7
    },
    versioning: {
      effectiveFrom: '2020-12-15',
      dependsOn: ['L40-ART-96']
    }
  },
  'L40-ART-74': {
    id: 'L40-ART-74',
    lei: 'Lei n.º 40/20',
    artigo: 'Artigo 74.º',
    capitulo: 'Capítulo IV',
    tipo: 'Mandatory',
    actor: 'Payment Service Provider',
    trigger: 'Notification of theft, loss, or unauthorized use of instrument',
    constraint: 'Provide immediate 24/7 channels for users to request freezing of credentials. Freeze account instantly on trigger.',
    severity: 'High',
    testRequired: true,
    auditRequired: true,
    implementationStatus: 'Implemented',
    linkedUseCases: ['BlockWalletUseCase', 'UnblockWalletUseCase'],
    linkedRepositories: ['WalletRepository'],
    linkedEvents: ['WalletFrozenEvent', 'SecurityAlertTriggeredEvent'],
    linkedMetrics: ['frozen_wallets_count', 'credential_freeze_time_ms'],
    description: 'Obligations of the payment service provider in relation to secure payment instruments.',
    concepts: ['Bloqueio Cautelar', 'Notificação de Fraude', 'Responsabilidade Civil Limitada'],
    rights: ['Isenção de responsabilidade civil do utilizador após comunicação de perda'],
    prohibitions: ['Proibição de cobrar taxas para desativar ou congelar credenciais de pagamento'],
    evidenceRequired: {
      logs: ['LOG_FREEZE_COMMAND_RECEIVED', 'LOG_ACCOUNT_STATUS_LOCKED'],
      events: ['WalletFrozenEvent', 'SecurityAlertTriggeredEvent'],
      databaseTables: ['wallets', 'security_alerts'],
      retentionPeriodYears: 5
    },
    versioning: {
      effectiveFrom: '2020-12-15',
      dependsOn: ['L40-ART-96']
    }
  },
  'L40-ART-93': {
    id: 'L40-ART-93',
    lei: 'Lei n.º 40/20',
    artigo: 'Artigo 93.º',
    capitulo: 'Capítulo IV',
    tipo: 'Mandatory',
    actor: 'Payment Service Provider',
    trigger: 'Transaction risk evaluation or AML daily limits check',
    constraint: 'Establish operational risk controls, AML scoring, and continuous anti-fraud monitors.',
    severity: 'High',
    testRequired: true,
    auditRequired: true,
    implementationStatus: 'Implemented',
    linkedUseCases: ['TransferUseCase'],
    linkedRepositories: ['AuditRepository'],
    linkedEvents: ['HighRiskTransactionFlaggedEvent'],
    linkedMetrics: ['flagged_aml_transactions_count', 'average_fraud_score'],
    description: 'Management of security and operational risks, including AML and CFT compliance framework.',
    concepts: ['Know Your Customer (KYC)', 'Prevenção de Branqueamento de Capitais (AML)', 'Gestão de Risco Operacional'],
    rights: ['Direito de reporte preventivo de transações suspeitas à UIF'],
    prohibitions: ['Proibição de aceitar fundos de remetentes não identificados conforme níveis regulamentares'],
    evidenceRequired: {
      logs: ['LOG_FRAUD_EVALUATOR_RUN', 'LOG_AML_RULE_TRIGGERED'],
      events: ['HighRiskTransactionFlaggedEvent'],
      databaseTables: ['aml_alerts', 'audit_logs'],
      retentionPeriodYears: 10
    },
    versioning: {
      effectiveFrom: '2020-12-15',
      dependsOn: []
    }
  },
  'L40-ART-94': {
    id: 'L40-ART-94',
    lei: 'Lei n.º 40/20',
    artigo: 'Artigo 94.º',
    capitulo: 'Capítulo IV',
    tipo: 'Mandatory',
    actor: 'Payment Service Provider',
    trigger: 'Identification of severe security or operational incident',
    constraint: 'Format and report severe operational or security incidents to the BNA within official timelines.',
    severity: 'Medium',
    testRequired: false,
    auditRequired: true,
    implementationStatus: 'Not_Implemented',
    linkedUseCases: [],
    linkedRepositories: ['AuditRepository'],
    linkedEvents: ['IncidentDetected', 'IncidentReported'],
    linkedMetrics: ['active_incidents_count', 'mean_time_to_report_hours'],
    description: 'Notification requirements of major operational and security incidents to the regulator (BNA).',
    concepts: ['Incidente Operacional Grave', 'Notificação Regulatória de Crise', 'SLA Sistémico'],
    rights: ['Canal direto com o Departamento de Supervisão do BNA'],
    prohibitions: ['Proibição de omitir, atenuar ou atrasar voluntariamente relatos de violação de dados de clientes'],
    evidenceRequired: {
      logs: ['LOG_INCIDENT_CRITICAL_ERROR', 'LOG_INCIDENT_REPORT_SUBMITTED'],
      events: ['IncidentDetected', 'IncidentReported'],
      databaseTables: ['incidents', 'incident_reports'],
      retentionPeriodYears: 5
    },
    versioning: {
      effectiveFrom: '2020-12-15',
      dependsOn: ['L40-ART-3']
    }
  },
  'L40-ART-96': {
    id: 'L40-ART-96',
    lei: 'Lei n.º 40/20',
    artigo: 'Artigo 96.º',
    capitulo: 'Capítulo IV',
    tipo: 'Mandatory',
    actor: 'Payment Service Provider',
    trigger: 'Access to payment accounts, initiation of high-value transfer, or any action prone to fraud',
    constraint: 'Mandate Strong Customer Authentication (SCA) using two or more independent factors (Knowledge, Possession, Inherence).',
    severity: 'Critical',
    testRequired: true,
    auditRequired: true,
    implementationStatus: 'Partially_Implemented',
    linkedUseCases: ['VerifyScaUseCase', 'TransferUseCase'],
    linkedRepositories: [],
    linkedEvents: ['ScaVerificationSuccessEvent', 'ScaVerificationFailedEvent'],
    linkedMetrics: ['sca_pass_rate_percent', 'sca_failures_count'],
    description: 'Obligation of Strong Customer Authentication for secure electronic transactions.',
    concepts: ['Strong Customer Authentication (SCA)', 'Autenticação Multifactor (MFA)', 'Fator de Inerência Biométrica'],
    rights: ['Isenção do utilizador em transações não autenticadas sob SCA por culpa do provedor'],
    prohibitions: ['Proibição de efetuar transferências acima do teto de simplificadas sem desafio MFA ativo'],
    evidenceRequired: {
      logs: ['LOG_MFA_CHALLENGE_GENERATED', 'LOG_MFA_FACTORS_COMPARED'],
      events: ['ScaVerificationSuccessEvent', 'ScaVerificationFailedEvent'],
      databaseTables: ['mfa_sessions', 'user_devices'],
      retentionPeriodYears: 7
    },
    versioning: {
      effectiveFrom: '2020-12-15',
      dependsOn: []
    }
  }
};

export const DOMAIN_OBJECTS_REGISTRY: DomainObject[] = [
  {
    name: 'Wallet',
    category: 'Aggregate',
    relatedUseCases: ['TransferUseCase', 'DepositUseCase', 'WithdrawalUseCase', 'BlockWalletUseCase'],
    description: 'The core consumer and corporate account representing electronic money. Holds balances and active KYC levels.'
  },
  {
    name: 'Merchant',
    category: 'Aggregate',
    relatedUseCases: ['RegisterMerchantUseCase', 'MerchantPaymentUseCase'],
    description: 'A specialized commercial entity utilizing the payment system with custom MDR (Merchant Discount Rate) constraints.'
  },
  {
    name: 'Agent',
    category: 'Entity',
    relatedUseCases: ['AgentOperationsUseCase'],
    description: 'An authorized physical proxy or retail partner facilitating cash-in and cash-out operations under fiduciaries.'
  },
  {
    name: 'Electronic Money',
    category: 'ValueObject',
    relatedUseCases: ['TransferUseCase', 'DepositUseCase'],
    description: 'The fiduciarily backed digit representing legal tender in Angola (AOA), calculated in integral cêntimos (bigint).'
  },
  {
    name: 'Settlement',
    category: 'DomainService',
    relatedUseCases: ['TransferUseCase'],
    description: 'Service orchestrating atomic clearing and final transfer between accounts, validating double-entry integrity.'
  },
  {
    name: 'Reserve Account',
    category: 'Repository',
    relatedUseCases: ['AuditTrailUseCase'],
    description: 'The external custodial ledger mirroring physical fiat holdings in commercial banks to prove 100% liquidity lastro.'
  },
  {
    name: 'Payment Instrument',
    category: 'ValueObject',
    relatedUseCases: ['VerifyScaUseCase'],
    description: 'Secure, personalized mechanism (such as mobile application keys, SMS endpoints) tied to SCA sessions.'
  },
  {
    name: 'Authentication',
    category: 'DomainService',
    relatedUseCases: ['VerifyScaUseCase'],
    description: 'System validating PIN correctness and OTP challenge-responses across independent cryptographic channels.'
  },
  {
    name: 'Incident',
    category: 'Entity',
    relatedUseCases: [],
    description: 'Structure identifying system faults, security threats, or server failures requiring BNA reporting.'
  },
  {
    name: 'Complaint',
    category: 'Entity',
    relatedUseCases: [],
    description: 'A customer-submitted report of financial grievance requiring immediate audit and resolution history.'
  },
  {
    name: 'BNA',
    category: 'Repository',
    relatedUseCases: ['AuditTrailUseCase'],
    description: 'External administrative interface representing the Banco Nacional de Angola as the system sovereign.'
  }
];

export const REGULATORY_EVENTS_REGISTRY: RegulatoryEvent[] = [
  {
    name: 'PaymentInitiated',
    articleId: 'L40-ART-68',
    description: 'Emitted when a customer initiates a transaction, expressing explicit intent prior to security verification.',
    payloadSchema: {
      transactionId: 'string',
      fromWallet: 'string',
      toWallet: 'string',
      amountCents: 'bigint',
      timestamp: 'string'
    }
  },
  {
    name: 'PaymentAuthorized',
    articleId: 'L40-ART-96',
    description: 'Emitted upon successful Strong Customer Authentication verifying transaction consent.',
    payloadSchema: {
      transactionId: 'string',
      scaSessionId: 'string',
      factorsValidated: 'string[]',
      timestamp: 'string'
    }
  },
  {
    name: 'PaymentRejected',
    articleId: 'L40-ART-93',
    description: 'Emitted when compliance evaluation or AML scores trigger a transaction failure.',
    payloadSchema: {
      transactionId: 'string',
      reason: 'string',
      fraudScore: 'number',
      timestamp: 'string'
    }
  },
  {
    name: 'SettlementCompleted',
    articleId: 'L40-ART-40',
    description: 'Emitted after irreversible ledger clearing of accounts, finalizing debit and credit.',
    payloadSchema: {
      transactionId: 'string',
      fromWalletBalanceAfter: 'bigint',
      toWalletBalanceAfter: 'bigint',
      timestamp: 'string'
    }
  },
  {
    name: 'WalletFrozen',
    articleId: 'L40-ART-74',
    description: 'Emitted when an account is blocked for theft, loss, or regulatory order 24/7.',
    payloadSchema: {
      walletId: 'string',
      triggerSource: 'string',
      reason: 'string',
      timestamp: 'string'
    }
  },
  {
    name: 'BalanceDiscrepancyDetected',
    articleId: 'L40-ART-20',
    description: 'Emitted when the aggregate e-Money circulation sum does not match custodial reserve banks.',
    payloadSchema: {
      discrepancyId: 'string',
      emittedSumCents: 'bigint',
      reserveSumCents: 'bigint',
      varianceCents: 'bigint',
      timestamp: 'string'
    }
  }
];

export const REGULATORY_RELATIONS: RegulatoryRelation[] = [
  { sourceId: 'L40-ART-74', targetId: 'L40-ART-96', type: 'depends' }, // Freeze/lock mechanisms rely on SCA validation structures
  { sourceId: 'L40-ART-96', targetId: 'L40-ART-93', type: 'depends' }, // Strong authentication is triggered based on Risk limits and AML evaluations
  { sourceId: 'L40-ART-18', targetId: 'L40-ART-4', type: 'depends' },  // Agent capabilities depend on fundamental deposit & cash-out services
  { sourceId: 'L40-ART-20', targetId: 'L40-ART-40', type: 'depends' }  // Safeguarding funds relies on definitive transaction settlements
];
