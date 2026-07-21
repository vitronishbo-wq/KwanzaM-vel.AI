import { OBLIGATIONS_REGISTRY, REGULATORY_RELATIONS, DOMAIN_OBJECTS_REGISTRY } from './registry';
import { ImpactAnalysisResult, RegulatoryRelation } from './types';

export class RegulatoryImpactAnalyzer {
  private relations: RegulatoryRelation[] = REGULATORY_RELATIONS;

  /**
   * Performs an automated Regulatory Impact Analysis (RIA) for a change in a given rule/article.
   * Calculates cascading effects and identifies all affected system modules, files, and resources.
   */
  public analyzeImpact(articleId: string): ImpactAnalysisResult {
    const obligation = OBLIGATIONS_REGISTRY[articleId];
    if (!obligation) {
      return {
        affectedAggregates: [],
        affectedApis: [],
        affectedDtos: [],
        affectedTestFiles: [],
        affectedEvents: [],
        affectedLogs: [],
        affectedDashboards: [],
        estimatedEffortInHours: 0,
        explanation: `Rule ${articleId} not found in the Regulatory Registry.`
      };
    }

    // 1. Trace cascading rule dependencies (Rules that depend on this rule)
    const affectedRuleIds = this.getDependentRulesRecursive(articleId);
    const allInvolvedRules = [articleId, ...affectedRuleIds];

    // 2. Map involved rules to Aggregates, APIs, and tests
    const affectedAggregatesSet = new Set<string>();
    const affectedApisSet = new Set<string>();
    const affectedDtosSet = new Set<string>();
    const affectedTestFilesSet = new Set<string>();
    const affectedEventsSet = new Set<string>();
    const affectedLogsSet = new Set<string>();
    const affectedDashboardsSet = new Set<string>();

    for (const ruleId of allInvolvedRules) {
      const o = OBLIGATIONS_REGISTRY[ruleId];
      if (!o) continue;

      // Map Aggregates/Repositories
      o.linkedRepositories.forEach(repo => {
        // Find corresponding Domain Object to see if it's an Aggregate
        const domainObj = DOMAIN_OBJECTS_REGISTRY.find(d => d.name + 'Repository' === repo || d.name === repo);
        if (domainObj) {
          affectedAggregatesSet.add(domainObj.name);
        } else {
          affectedAggregatesSet.add(repo.replace('Repository', ''));
        }
      });

      // Map Use Cases & APIs
      o.linkedUseCases.forEach(uc => {
        affectedApisSet.add(`/api/${this.camelToKebab(uc.replace('UseCase', 's'))}`);
        affectedDtosSet.add(`${uc.replace('UseCase', '')}Dto`);
        affectedTestFilesSet.add(`backend/application/usecases/${uc}.test.ts`);
      });

      // Map Events
      o.linkedEvents.forEach(ev => {
        affectedEventsSet.add(ev);
        affectedLogsSet.add(`LOG_${this.screamingSnakeCase(ev)}`);
      });

      // Map Metrics to Dashboards
      if (o.linkedMetrics.length > 0) {
        affectedDashboardsSet.add('Compliance Dashboard');
        if (o.linkedMetrics.some(m => m.includes('fiat') || m.includes('reserve') || m.includes('emitted'))) {
          affectedDashboardsSet.add('Treasury Safeguard Dashboard');
        }
        if (o.linkedMetrics.some(m => m.includes('aml') || m.includes('fraud'))) {
          affectedDashboardsSet.add('AML / Risk Control Desk');
        }
      }
    }

    // 3. Estimate development effort dynamically
    let baseHours = 0;
    for (const ruleId of allInvolvedRules) {
      const o = OBLIGATIONS_REGISTRY[ruleId];
      if (!o) continue;
      
      switch (o.severity) {
        case 'Critical': baseHours += 16; break;
        case 'High': baseHours += 10; break;
        case 'Medium': baseHours += 6; break;
        case 'Low': baseHours += 3; break;
      }
    }

    // Multipliers for cascades
    const cascadeMultiplier = 1 + (affectedRuleIds.length * 0.25);
    const estimatedEffortInHours = Math.round(baseHours * cascadeMultiplier);

    // 4. Construct narrative explanation of impact
    const cascadeText = affectedRuleIds.length > 0 
      ? ` This change has a cascading regulatory impact on dependent rules: ${affectedRuleIds.join(', ')}.`
      : '';
    const explanation = `A change in ${obligation.artigo} (${obligation.lei}) affects ${affectedAggregatesSet.size} core aggregates and ${affectedApisSet.size} API endpoints directly.${cascadeText} Estimated engineering effort is ${estimatedEffortInHours} hours.`;

    return {
      affectedAggregates: Array.from(affectedAggregatesSet),
      affectedApis: Array.from(affectedApisSet),
      affectedDtos: Array.from(affectedDtosSet),
      affectedTestFiles: Array.from(affectedTestFilesSet),
      affectedEvents: Array.from(affectedEventsSet),
      affectedLogs: Array.from(affectedLogsSet),
      affectedDashboards: Array.from(affectedDashboardsSet),
      estimatedEffortInHours,
      explanation
    };
  }

  /**
   * Recursively finds all rules that depend on the given rule (downward traversal of the dependency tree).
   */
  public getDependentRulesRecursive(startId: string, visited = new Set<string>()): string[] {
    const dependents: string[] = [];
    visited.add(startId);

    // Find direct dependents (where this rule is the target of a dependency relation, meaning the source depends on it)
    // Actually, in our relations: { sourceId: 'L40-ART-74', targetId: 'L40-ART-96', type: 'depends' }
    // means 74 depends on 96. If 96 changes, 74 is affected.
    // So if targetId === startId, then sourceId is a dependent.
    const directDependents = this.relations
      .filter(r => r.targetId === startId && r.type === 'depends')
      .map(r => r.sourceId);

    for (const depId of directDependents) {
      if (!visited.has(depId)) {
        dependents.push(depId);
        dependents.push(...this.getDependentRulesRecursive(depId, visited));
      }
    }

    return Array.from(new Set(dependents));
  }

  /**
   * Recursively finds all rules that the given rule depends upon (upward traversal of the dependency tree).
   */
  public getDependenciesRecursive(startId: string, visited = new Set<string>()): string[] {
    const dependencies: string[] = [];
    visited.add(startId);

    // If sourceId === startId, then targetId is what we depend on.
    const directDependencies = this.relations
      .filter(r => r.sourceId === startId && r.type === 'depends')
      .map(r => r.targetId);

    for (const depId of directDependencies) {
      if (!visited.has(depId)) {
        dependencies.push(depId);
        dependencies.push(...this.getDependenciesRecursive(depId, visited));
      }
    }

    return Array.from(new Set(dependencies));
  }

  // --- STRING FORMATTING HELPERS ---

  private camelToKebab(str: string): string {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  }

  private screamingSnakeCase(str: string): string {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase();
  }
}
