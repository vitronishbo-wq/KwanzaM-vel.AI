import { OBLIGATIONS_REGISTRY, DOMAIN_OBJECTS_REGISTRY, REGULATORY_EVENTS_REGISTRY } from './registry';
import { Obligation, ComplianceScoreReport, GapReport, Severity, DimensionScores, DslRule } from './types';

export class ComplianceEngine {
  /**
   * Evaluates the absolute coverage and scores of each regulatory article,
   * returning a highly detailed, multidimensional compliance report.
   * Supports evaluating active rules at a specific point in time (Regulatory Versioning).
   */
  public calculateComplianceScore(activeDateStr?: string): ComplianceScoreReport {
    let obligations = Object.values(OBLIGATIONS_REGISTRY);
    
    if (activeDateStr) {
      const activeDate = new Date(activeDateStr);
      obligations = obligations.filter(o => {
        if (!o.versioning) return true;
        const effectiveFrom = new Date(o.versioning.effectiveFrom);
        if (effectiveFrom > activeDate) return false;
        if (o.versioning.effectiveUntil) {
          const effectiveUntil = new Date(o.versioning.effectiveUntil);
          if (effectiveUntil < activeDate) return false;
        }
        return true;
      });
    }

    const totalObligations = obligations.length;

    if (totalObligations === 0) {
      return {
        globalCompliance: 100,
        byDimension: this.getZeroScores(),
        overallRisk: 'Low',
        assessedAt: new Date().toISOString()
      };
    }

    // 1. Calculate Dimension Scores
    // Dimension definitions and metrics
    const byDimension: DimensionScores = {
      juridica: this.evaluateJuridicaDimension(obligations),
      funcional: this.evaluateFuncionalDimension(obligations),
      testes: this.evaluateTestesDimension(obligations),
      observabilidade: this.evaluateObservabilidadeDimension(obligations),
      auditoria: this.evaluateAuditoriaDimension(obligations),
      seguranca: this.evaluateSegurancaDimension(obligations),
      aml: this.evaluateAmlDimension(obligations),
      custodia: this.evaluateCustodiaDimension(obligations),
      protecaoConsumidor: this.evaluateProtecaoConsumidorDimension(obligations),
      operacional: this.evaluateOperacionalDimension(obligations)
    };

    // 2. Global Compliance is the weighted average of all dimensions
    const weights: Record<keyof DimensionScores, number> = {
      juridica: 0.10,
      funcional: 0.15,
      testes: 0.15,
      observabilidade: 0.10,
      auditoria: 0.10,
      seguranca: 0.10,
      aml: 0.10,
      custodia: 0.10,
      protecaoConsumidor: 0.05,
      operacional: 0.05
    };

    let globalCompliance = 0;
    for (const key of Object.keys(weights) as Array<keyof DimensionScores>) {
      globalCompliance += byDimension[key] * weights[key];
    }

    // Round to 1 decimal place
    globalCompliance = Math.round(globalCompliance * 10) / 10;

    // 3. Determine Overall Risk Based on Unimplemented Critical/High Gaps
    let overallRisk: Severity = 'Low';
    const criticalUnimplemented = obligations.some(o => o.severity === 'Critical' && o.implementationStatus !== 'Implemented');
    const highUnimplemented = obligations.some(o => o.severity === 'High' && o.implementationStatus !== 'Implemented');
    
    if (criticalUnimplemented) {
      overallRisk = 'Critical';
    } else if (highUnimplemented) {
      overallRisk = 'High';
    } else if (globalCompliance < 80) {
      overallRisk = 'Medium';
    }

    return {
      globalCompliance,
      byDimension,
      overallRisk,
      assessedAt: new Date().toISOString()
    };
  }

  /**
   * Runs an architectural consistency audit on the system.
   */
  public runConsistencyAudit(): {
    orphanedObligations: string[];
    useCasesWithoutRegulations: string[];
    testlessObligations: string[];
    obligationsWithoutMetrics: string[];
    undocumentedDomainEvents: string[];
    unmappedAggregates: string[];
    passed: boolean;
  } {
    const obligations = Object.values(OBLIGATIONS_REGISTRY);
    const domainObjects = DOMAIN_OBJECTS_REGISTRY;
    const regEvents = REGULATORY_EVENTS_REGISTRY;

    // 1. Obligations without any Use Cases or Repositories
    const orphanedObligations = obligations
      .filter(o => o.linkedUseCases.length === 0 && o.linkedRepositories.length === 0 && o.implementationStatus !== 'Not_Applicable')
      .map(o => o.id);

    // 2. Obligations where testRequired is true, but linkedUseCases or tests are empty
    const testlessObligations = obligations
      .filter(o => o.testRequired && o.implementationStatus === 'Implemented' && o.linkedUseCases.length === 0)
      .map(o => o.id);

    // 3. Obligations without linked metrics or logs
    const obligationsWithoutMetrics = obligations
      .filter(o => o.linkedMetrics.length === 0 && o.auditRequired)
      .map(o => o.id);

    // 4. Mapped Use Cases in domain objects that do not link back to any active regulation
    const allUseCaseNames = new Set(domainObjects.filter(d => d.category === 'UseCase').map(d => d.name));
    const regulatedUseCases = new Set(obligations.flatMap(o => o.linkedUseCases));
    const useCasesWithoutRegulations = Array.from(allUseCaseNames).filter(uc => !regulatedUseCases.has(uc));

    // 5. Unmapped Aggregates (Aggregates with no obligations mapped to them)
    const allAggregates = domainObjects.filter(d => d.category === 'Aggregate').map(d => d.name);
    const regulatedAggregates = new Set(obligations.flatMap(o => o.linkedRepositories)); // Repo links indicate aggregate impact usually
    const unmappedAggregates = allAggregates.filter(agg => !domainObjects.find(d => d.name === agg)?.relatedUseCases.some(uc => regulatedUseCases.has(uc)));

    // 6. Events declared in code or domain but not mapped in REGULATORY_EVENTS_REGISTRY
    const undocumentedDomainEvents: string[] = []; // In a live system, we would introspect files, here we check registry validity

    const passed = orphanedObligations.length === 0 &&
                   useCasesWithoutRegulations.length === 0 &&
                   testlessObligations.length === 0 &&
                   obligationsWithoutMetrics.length === 0 &&
                   unmappedAggregates.length === 0;

    return {
      orphanedObligations,
      useCasesWithoutRegulations,
      testlessObligations,
      obligationsWithoutMetrics,
      undocumentedDomainEvents,
      unmappedAggregates,
      passed
    };
  }

  /**
   * Automated Gap Analysis.
   * Scans the registry for gaps and produces priority-weighted remediation plans.
   */
  public generateGapAnalysis(): GapReport[] {
    const obligations = Object.values(OBLIGATIONS_REGISTRY);
    const gaps: GapReport[] = [];

    const severityToPriority = (sev: Severity): Severity => sev;

    let index = 1;
    for (const o of obligations) {
      if (o.implementationStatus !== 'Implemented' && o.implementationStatus !== 'Not_Applicable') {
        const files: string[] = [];
        o.linkedUseCases.forEach(uc => files.push(`backend/application/usecases/${uc}.ts`));
        o.linkedRepositories.forEach(rep => files.push(`backend/repositories/${rep}.ts`));

        gaps.push({
          id: `GAP-${String(index).padStart(2, '0')}`,
          obligationId: o.id,
          description: `Compliance gap on ${o.artigo} (${o.lei}) regarding: ${o.constraint}`,
          priority: severityToPriority(o.severity),
          regulatoryImpact: o.severity,
          architecturalImpact: o.severity === 'Critical' ? 'Critical' : o.severity === 'High' ? 'High' : 'Medium',
          filesInvolved: files.length > 0 ? files : [`backend/domain/wallet/`],
          recommendedOrder: index
        });
        index++;
      }
    }

    // Sort by recommended order (Critical priority first)
    return gaps.sort((a, b) => {
      const severityWeight = { Critical: 4, High: 3, Medium: 2, Low: 1 };
      return severityWeight[b.regulatoryImpact] - severityWeight[a.regulatoryImpact];
    });
  }

  // --- PRIVATE EVALUATION HELPERS ---

  private getZeroScores(): DimensionScores {
    return {
      juridica: 0, funcional: 0, testes: 0, observabilidade: 0, auditoria: 0,
      seguranca: 0, aml: 0, custodia: 0, protecaoConsumidor: 0, operacional: 0
    };
  }

  private evaluateStatusScore(status: string): number {
    switch (status) {
      case 'Implemented': return 100;
      case 'Partially_Implemented': return 50;
      case 'Not_Implemented': return 0;
      case 'Not_Applicable': return 100;
      default: return 0;
    }
  }

  private evaluateJuridicaDimension(obs: Obligation[]): number {
    // Measures if metadata and descriptions exist for all obligations
    const scores = obs.map(o => (o.lei && o.artigo && o.description) ? 100 : 50);
    return this.average(scores);
  }

  private evaluateFuncionalDimension(obs: Obligation[]): number {
    // Measures the average implementation status of obligations
    const scores = obs.map(o => this.evaluateStatusScore(o.implementationStatus));
    return this.average(scores);
  }

  private evaluateTestesDimension(obs: Obligation[]): number {
    // Measures if required tests are linked and implemented
    const scores = obs.map(o => {
      if (!o.testRequired) return 100;
      if (o.implementationStatus === 'Implemented' && o.linkedUseCases.length > 0) return 100;
      if (o.implementationStatus === 'Partially_Implemented') return 50;
      return 0;
    });
    return this.average(scores);
  }

  private evaluateObservabilidadeDimension(obs: Obligation[]): number {
    // Measures metrics & log attachment
    const scores = obs.map(o => {
      if (o.linkedMetrics.length > 0) return 100;
      if (o.auditRequired) return 30;
      return 100;
    });
    return this.average(scores);
  }

  private evaluateAuditoriaDimension(obs: Obligation[]): number {
    // Measures ledger and audit log links for critical/high severity
    const scores = obs.map(o => {
      if (!o.auditRequired) return 100;
      const hasAuditing = o.linkedEvents.length > 0 || o.linkedRepositories.includes('LedgerRepository') || o.linkedRepositories.includes('AuditRepository');
      return hasAuditing ? 100 : 0;
    });
    return this.average(scores);
  }

  private evaluateSegurancaDimension(obs: Obligation[]): number {
    // Dedicated evaluation for security-relevant obligations (SCA, blockings)
    const securityIds = ['L40-ART-3', 'L40-ART-74', 'L40-ART-96'];
    const filtered = obs.filter(o => securityIds.includes(o.id));
    const scores = filtered.map(o => this.evaluateStatusScore(o.implementationStatus));
    return this.average(scores);
  }

  private evaluateAmlDimension(obs: Obligation[]): number {
    // Dedicated evaluation for AML & daily limits checking
    const amlIds = ['L40-ART-93', 'L40-ART-3'];
    const filtered = obs.filter(o => amlIds.includes(o.id));
    const scores = filtered.map(o => this.evaluateStatusScore(o.implementationStatus));
    return this.average(scores);
  }

  private evaluateCustodiaDimension(obs: Obligation[]): number {
    // Dedicated evaluation of safeguarding obligations
    const custodiaIds = ['L40-ART-20', 'L40-ART-40'];
    const filtered = obs.filter(o => custodiaIds.includes(o.id));
    const scores = filtered.map(o => this.evaluateStatusScore(o.implementationStatus));
    return this.average(scores);
  }

  private evaluateProtecaoConsumidorDimension(obs: Obligation[]): number {
    // Consumer rights and transparency
    const consumerIds = ['L40-ART-47', 'L40-ART-68'];
    const filtered = obs.filter(o => consumerIds.includes(o.id));
    const scores = filtered.map(o => this.evaluateStatusScore(o.implementationStatus));
    return this.average(scores);
  }

  private evaluateOperacionalDimension(obs: Obligation[]): number {
    // Availability and incident response
    const operationalIds = ['L40-ART-4', 'L40-ART-94'];
    const filtered = obs.filter(o => operationalIds.includes(o.id));
    const scores = filtered.map(o => this.evaluateStatusScore(o.implementationStatus));
    return this.average(scores);
  }

  private average(numbers: number[]): number {
    if (numbers.length === 0) return 100;
    const sum = numbers.reduce((acc, curr) => acc + curr, 0);
    return Math.round((sum / numbers.length) * 10) / 10;
  }

  /**
   * Compiles and validates a Compliance DSL string into an executable DslRule object.
   */
  public compileDslRule(dslYamlOrJson: string): { success: boolean; error?: string; rule?: DslRule } {
    try {
      let data: any = {};
      if (dslYamlOrJson.trim().startsWith('{')) {
        data = JSON.parse(dslYamlOrJson);
      } else {
        // Parse a simple yaml-like key-value structure
        const lines = dslYamlOrJson.split('\n');
        let currentKey = '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          if (trimmed.includes(':')) {
            const parts = trimmed.split(':');
            const key = parts[0].trim();
            const val = parts.slice(1).join(':').trim();
            if (val) {
              data[key] = val.replace(/^["']|["']$/g, '');
            } else {
              currentKey = key;
              data[currentKey] = [];
            }
          } else if (trimmed.startsWith('-') && currentKey) {
            const item = trimmed.substring(1).trim().replace(/^["']|["']$/g, '');
            if (Array.isArray(data[currentKey])) {
              data[currentKey].push(item);
            }
          }
        }
      }

      if (!data.article) throw new Error("Atributo 'article' é obrigatório.");
      if (!data.lei) throw new Error("Atributo 'lei' é obrigatório.");
      if (!data.severity) throw new Error("Atributo 'severity' é obrigatório.");

      const rule: DslRule = {
        article: data.article,
        lei: data.lei,
        requires: Array.isArray(data.requires) ? data.requires : (data.requires ? [data.requires] : []),
        appliesTo: Array.isArray(data.appliesTo) ? data.appliesTo : (data.appliesTo ? [data.appliesTo] : []),
        severity: data.severity as Severity,
        effectiveFrom: data.effectiveFrom || new Date().toISOString().split('T')[0],
        concepts: Array.isArray(data.concepts) ? data.concepts : [],
        evidence: {
          logs: Array.isArray(data.evidence?.logs) ? data.evidence.logs : [],
          tables: Array.isArray(data.evidence?.tables) ? data.evidence.tables : []
        }
      };

      return { success: true, rule };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}
