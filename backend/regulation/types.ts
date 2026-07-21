export type ImplementationStatus = 'Implemented' | 'Partially_Implemented' | 'Not_Implemented' | 'Not_Applicable';

export type Severity = 'Critical' | 'High' | 'Medium' | 'Low';

export type RuleType = 'Mandatory' | 'Optional' | 'Prohibitive';

export interface EvidenceRequired {
  logs: string[];
  events: string[];
  databaseTables: string[];
  retentionPeriodYears: number;
}

export interface RuleVersioning {
  effectiveFrom: string; // ISO date string or YYYY-MM-DD
  effectiveUntil?: string;
  supersedes?: string; // ID of the obligation replaced
  dependsOn?: string[]; // IDs of dependent obligations
}

export interface Obligation {
  id: string; // e.g. "L40-ART-74"
  lei: string; // e.g. "Lei n.º 40/20"
  artigo: string; // e.g. "Artigo 74.º"
  capitulo: string; // e.g. "Capítulo IV"
  tipo: RuleType;
  actor: string;
  trigger: string;
  constraint: string;
  severity: Severity;
  testRequired: boolean;
  auditRequired: boolean;
  implementationStatus: ImplementationStatus;
  linkedUseCases: string[];
  linkedRepositories: string[];
  linkedEvents: string[];
  linkedMetrics: string[];
  description: string;
  
  // New properties for Regulatory Knowledge Kernel
  evidenceRequired?: EvidenceRequired;
  versioning?: RuleVersioning;
  rights?: string[];
  prohibitions?: string[];
  concepts?: string[];
}

export interface DomainObject {
  name: string;
  category: 'Aggregate' | 'Entity' | 'ValueObject' | 'DomainService' | 'Repository' | 'UseCase';
  relatedUseCases: string[];
  description: string;
}

export interface RegulatoryEvent {
  name: string;
  articleId: string;
  description: string;
  payloadSchema: Record<string, string>;
}

export interface RegulatoryRelation {
  sourceId: string;
  targetId: string;
  type: 'depends' | 'modifies' | 'supersedes' | 'compliments';
}

export interface DimensionScores {
  juridica: number;        // Weight of legal documentation & alignment
  funcional: number;       // Weight of mapped domain objects & use cases
  testes: number;          // Weight of tests linked and verifying
  observabilidade: number; // Weight of logs & metrics linked
  auditoria: number;       // Weight of audit trails / ledger linked
  seguranca: number;       // Weight of encryption & SCA controls
  aml: number;             // Weight of KYC tiers and AML rule evaluators
  custodia: number;        // Weight of fiduciary trust & reserve matching
  protecaoConsumidor: number; // Weight of transparent fees & complaint handles
  operacional: number;     // Weight of service availability & limits
}

export interface ComplianceScoreReport {
  globalCompliance: number;
  byDimension: DimensionScores;
  overallRisk: Severity;
  assessedAt: string;
}

export interface GapReport {
  id: string;
  obligationId: string;
  description: string;
  priority: Severity;
  regulatoryImpact: Severity;
  architecturalImpact: Severity;
  filesInvolved: string[];
  recommendedOrder: number;
}

export interface ImpactAnalysisResult {
  affectedAggregates: string[];
  affectedApis: string[];
  affectedDtos: string[];
  affectedTestFiles: string[];
  affectedEvents: string[];
  affectedLogs: string[];
  affectedDashboards: string[];
  estimatedEffortInHours: number;
  explanation: string;
}

export interface ArchitecturalDecisionRecord {
  id: string; // ADR-XXX
  articleId: string;
  title: string;
  decisor: string;
  interpretation: string;
  justification: string;
  date: string;
  architecturalImpact: string;
  status: 'Proposed' | 'Accepted' | 'Rejected' | 'Deprecated';
}

export interface DslRule {
  article: string;
  lei: string;
  requires: string[];
  appliesTo: string[];
  severity: Severity;
  effectiveFrom: string;
  concepts?: string[];
  evidence?: {
    logs: string[];
    tables: string[];
  };
}
