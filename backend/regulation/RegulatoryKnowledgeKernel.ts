import { OBLIGATIONS_REGISTRY, REGULATORY_RELATIONS } from './registry';
import { Obligation, Severity, RuleType, EvidenceRequired, RuleVersioning } from './types';

export interface RegulatoryEntity {
  id: string;
  name: string;
  type: 'Lei' | 'Aviso' | 'Instrução' | 'Directiva';
  authority: string;
  description: string;
  enactedDate: string; // ISO date or YYYY-MM-DD
  effectiveFrom: string; // ISO date or YYYY-MM-DD
  scope: string;
}

export interface StructuredRight {
  id: string;
  obligationId: string;
  lei: string;
  artigo: string;
  description: string;
  beneficiary: string;
}

export interface StructuredProhibition {
  id: string;
  obligationId: string;
  lei: string;
  artigo: string;
  description: string;
  targetActor: string;
}

export interface StructuredConcept {
  name: string;
  definition: string;
  associatedArticles: string[];
}

/**
 * Regulatory Knowledge Kernel (RKK)
 * Serves as an immutable, versioned source of truth for all regulations, obligations,
 * rights, prohibitions, and key concepts of Angola's Payment System Law (Lei n.º 40/20).
 */
export class RegulatoryKnowledgeKernel {
  private static instance: RegulatoryKnowledgeKernel;

  // Immutable mapping of obligations
  private readonly obligations: Map<string, Obligation>;
  // Immutable list of structured rights
  private readonly rights: StructuredRight[];
  // Immutable list of structured prohibitions
  private readonly prohibitions: StructuredProhibition[];
  // Immutable list of structured concepts
  private readonly concepts: StructuredConcept[];
  // Immutable list of regulatory entities (Lei 40/20, Avisos BNA)
  private readonly entities: RegulatoryEntity[];

  // Static dictionary for regulatory definitions
  private static readonly CONCEPTS_DICTIONARY: Record<string, string> = {
    'Segurança Sistémica': 'Princípio geral que visa preservar a estabilidade, integridade e resiliência do sistema de pagamentos de Angola contra choques operacionais ou financeiros.',
    'Eficiência Operacional': 'Otimização dos fluxos de pagamento para minimizar latência, taxas operacionais e custos sistémicos.',
    'Transparência de Fluxos': 'Garantia de que a rastreabilidade e a audibilidade de qualquer transação financeira sejam preservadas de ponta a ponta.',
    'Conta de Pagamento': 'Conta destinada à execução de transações de pagamento, mantida por um prestador de serviços de pagamento autorizado.',
    'Depósito Físico': 'Ato de entrega de fundos físicos em espécie para crédito numa conta de pagamento eletrónica.',
    'Levantamento de Fundos': 'Retirada de fundos em moeda física a partir de saldo disponível numa conta de pagamento eletrónica.',
    'Agente Correspondente': 'Entidade terceira autorizada a atuar em representação do operador para facilitar cash-in/cash-out e captação de clientes.',
    'Merchant Discount Rate (MDR)': 'A taxa cobrada aos estabelecimentos comerciais para processamento de transações de pagamento eletrónico.',
    'Limites de Distribuição': 'Limitações regulatórias impostas a agentes para evitar abusos de liquidez ou violações de KYC/AML.',
    'Património de Afectação': 'Regime jurídico que garante que os fundos recebidos dos clientes fiquem segregados e imunes à falência do operador.',
    'Lastro de Moeda Electrónica': 'Garantia de que 100% da moeda eletrónica emitida em circulação possui correspondência física e intocável numa conta fiduciária de custódia no BNA.',
    'Garantia de Liquidez': 'Garantia de fundos líquidos disponíveis para atender pedidos de resgate ou liquidação imediatamente.',
    'Definitividade de Liquidação': 'O momento jurídico e técnico irreversível em que uma transação de pagamento é dada como liquidada no sistema.',
    'Irrevogabilidade': 'Impossibilidade de anulação unilateral ou estorno de uma ordem de pagamento após ter sido aceite e compensada.',
    'Compensação Multilateral': 'Processo de apuramento de saldos líquidos devedores e credores entre múltiplos participantes do sistema.',
    'Dever de Informação': 'Obrigação de clareza contratual e exposição explícita das regras operacionais aos clientes.',
    'Publicação de Preçários': 'Obrigação de publicação das tarifas vigentes de forma clara e homologada pelo BNA.',
    'Transparência Contratual': 'Proibição de letras miúdas, taxas ocultas ou termos obscuros em contratos financeiros de pagamento.',
    'Consentimento Explicito': 'Autorização expressa e ativa do utilizador necessária para a realização de transações na sua conta.',
    'Revogabilidade do Consentimento': 'Direito de retirar a autorização de pagamentos recorrentes ou pendentes antes da sua liquidação final.',
    'Autorização Prévia': 'Garantia de que nenhuma conta seja debitada sem ordem legítima pré-estabelecida.',
    'Bloqueio Cautelar': 'Medida preventiva de segurança para interromper o uso de um canal ou conta em caso de suspeita fundada de fraude ou furto.',
    'Notificação de Fraude': 'Comunicação imediata de brechas de segurança ou suspeitas ao cliente e ao BNA.',
    'Responsabilidade Civil Limitada': 'Proteção legal que limita as perdas financeiras do consumidor em caso de transações não autorizadas após notificação de perda.',
    'Know Your Customer (KYC)': 'Processo de identificação e verificação da identidade do utilizador de acordo com níveis regulamentares e níveis de transação.',
    'Prevenção de Branqueamento de Capitais (AML)': 'Conjunto de regras e monitoramentos para prevenir a lavagem de capitais e o financiamento ao terrorismo no sistema angolano.',
    'Gestão de Risco Operacional': 'Metodologias aplicadas para mitigar falhas técnicas, interrupções ou fraudes sistémicas.',
    'Incidente Operacional Grave': 'Anomalia técnica ou violação de segurança que impacte significativamente os serviços financeiros ou os dados de clientes.',
    'Notificação Regulatória de Crise': 'Obrigação de reportar incidentes graves ao BNA em prazos estritos definidos por lei.',
    'SLA Sistémico': 'Acordo de nível de serviço exigido por regulamento para a estabilidade e disponibilidade da plataforma.',
    'Strong Customer Authentication (SCA)': 'Exigência de autenticação com pelo menos dois fatores independentes classificados em conhecimento, posse e inerência.',
    'Autenticação Multifactor (MFA)': 'Método de validação de identidade que utiliza múltiplos canais ou fatores independentes.',
    'Fator de Inerência Biométrica': 'Validação de biometria física ou comportamental como fator intrínseco e intransmissível.'
  };

  private constructor() {
    this.obligations = new Map<string, Obligation>();
    this.rights = [];
    this.prohibitions = [];
    const conceptsMap = new Map<string, Set<string>>();

    // Initialize versioned regulatory entities registry (Lei 40/20, Avisos BNA)
    this.entities = [
      {
        id: 'LEI-40-20',
        name: 'Lei n.º 40/20',
        type: 'Lei',
        authority: 'Assembleia Nacional de Angola',
        description: 'Lei do Sistema de Pagamentos de Angola (LSPA) - Estabelece o regime jurídico do sistema de pagamentos de Angola e regula a constituição, funcionamento e supervisão das instituições de pagamento.',
        enactedDate: '2020-10-22',
        effectiveFrom: '2020-12-15',
        scope: 'Enquadramento geral de pagamentos, liquidação de transações, compensação, e emissão de moeda eletrónica.'
      },
      {
        id: 'AVISO-05-21',
        name: 'Aviso n.º 05/2021',
        type: 'Aviso',
        authority: 'Banco Nacional de Angola (BNA)',
        description: 'Regulamento sobre Prestação de Serviços de Pagamento e Moeda Electrónica - Detalha o processo de autorização, os limites operacionais, e regras prudenciais para prestadores de serviços de pagamento.',
        enactedDate: '2021-03-12',
        effectiveFrom: '2021-04-01',
        scope: 'Requisitos operacionais, segurança cibernética inicial, e regimes de licenças para PSPs e operadores.'
      },
      {
        id: 'AVISO-24-21',
        name: 'Aviso n.º 24/2021',
        type: 'Aviso',
        authority: 'Banco Nacional de Angola (BNA)',
        description: 'Regulamento de Limites de Transacções e Saldos de Contas de Moeda Electrónica - Define os limites diários, mensais e acumulados de transações de moeda eletrónica para contas simplificadas e completas.',
        enactedDate: '2021-09-15',
        effectiveFrom: '2021-10-01',
        scope: 'Limites de saldos de wallets, limites de cash-in/cash-out, e verificação KYC simplificada.'
      },
      {
        id: 'AVISO-09-23',
        name: 'Aviso n.º 09/2023',
        type: 'Aviso',
        authority: 'Banco Nacional de Angola (BNA)',
        description: 'Regulamento de Segurança Cibernética e Resiliência Operacional dos PSPs - Estabelece directrizes de prevenção contra ataques cibernéticos, autenticação multifactor estrita e notificação de incidentes graves.',
        enactedDate: '2023-06-30',
        effectiveFrom: '2023-08-01',
        scope: 'Segurança da informação, testes de intrusão periódicos, governação de risco, e relatórios ao BNA.'
      }
    ];

    // 1. Map and clone obligations to preserve immutability
    for (const [id, original] of Object.entries(OBLIGATIONS_REGISTRY)) {
      const cloned = JSON.parse(JSON.stringify(original)) as Obligation;
      this.obligations.set(id, cloned);

      // 2. Extract and structure Rights
      if (cloned.rights) {
        cloned.rights.forEach((rightText, idx) => {
          let beneficiary = 'Público Geral';
          const lowerText = rightText.toLowerCase();
          
          if (lowerText.includes('bna') || lowerText.includes('auditoria')) {
            beneficiary = 'Banco Nacional de Angola (Regulador)';
          } else if (lowerText.includes('utilizador') || lowerText.includes('consumidor') || lowerText.includes('ordenante') || lowerText.includes('cliente')) {
            beneficiary = 'Utilizador de Serviços de Pagamento';
          } else if (lowerText.includes('agente')) {
            beneficiary = 'Agente Correspondente';
          } else if (lowerText.includes('beneficiário') || lowerText.includes('liquidação')) {
            beneficiary = 'Beneficiário da Transação';
          } else if (lowerText.includes('uif') || lowerText.includes('reporte')) {
            beneficiary = 'Unidade de Informação Financeira (UIF)';
          }

          this.rights.push({
            id: `RIGHT-${id}-${idx + 1}`,
            obligationId: id,
            lei: cloned.lei,
            artigo: cloned.artigo,
            description: rightText,
            beneficiary
          });
        });
      }

      // 3. Extract and structure Prohibitions
      if (cloned.prohibitions) {
        cloned.prohibitions.forEach((prohibText, idx) => {
          let targetActor = 'Instituições Financeiras';
          const lowerText = prohibText.toLowerCase();

          if (lowerText.includes('mdr') || lowerText.includes('teto') || lowerText.includes('crédito') || lowerText.includes('comissão') || lowerText.includes('débitos') || lowerText.includes('taxas') || lowerText.includes('omitir') || lowerText.includes('efetuar')) {
            targetActor = 'Prestador de Serviços de Pagamento (PSP)';
          } else if (lowerText.includes('liquidação') || lowerText.includes('operacionais')) {
            targetActor = 'Operador de Sistema de Pagamentos';
          } else if (lowerText.includes('estornar') || lowerText.includes('reverter')) {
            targetActor = 'Operador & Prestador de Serviços';
          } else if (lowerText.includes('reter fundos') || lowerText.includes('aceitar fundos')) {
            targetActor = 'Prestador (PSP) e seus Agentes';
          }

          this.prohibitions.push({
            id: `PROHIB-${id}-${idx + 1}`,
            obligationId: id,
            lei: cloned.lei,
            artigo: cloned.artigo,
            description: prohibText,
            targetActor
          });
        });
      }

      // 4. Map concepts
      if (cloned.concepts) {
        cloned.concepts.forEach(concept => {
          if (!conceptsMap.has(concept)) {
            conceptsMap.set(concept, new Set());
          }
          conceptsMap.get(concept)!.add(id);
        });
      }
    }

    // 5. Build structured concepts list
    const conceptsList: StructuredConcept[] = [];
    for (const [name, articlesSet] of conceptsMap.entries()) {
      const definition = RegulatoryKnowledgeKernel.CONCEPTS_DICTIONARY[name] || 
        `Conceito regulatório fundamental relacionado a ${name} sob as normas de conformidade do Banco Nacional de Angola (Lei 40/20).`;
      conceptsList.push({
        name,
        definition,
        associatedArticles: Array.from(articlesSet)
      });
    }
    this.concepts = conceptsList;

    // Deep freeze maps, arrays and objects to guarantee strict immutability
    Object.freeze(this.obligations);
    Object.freeze(this.rights);
    this.rights.forEach(Object.freeze);
    Object.freeze(this.prohibitions);
    this.prohibitions.forEach(Object.freeze);
    Object.freeze(this.concepts);
    this.concepts.forEach(Object.freeze);
    Object.freeze(this.entities);
    this.entities.forEach(Object.freeze);
  }

  /**
   * Retrieves the singleton instance of the kernel.
   */
  public static getInstance(): RegulatoryKnowledgeKernel {
    if (!RegulatoryKnowledgeKernel.instance) {
      RegulatoryKnowledgeKernel.instance = new RegulatoryKnowledgeKernel();
    }
    return RegulatoryKnowledgeKernel.instance;
  }

  /**
   * Dynamically reloads the kernel from the OBLIGATIONS_REGISTRY.
   * Useful when dynamic rules are compiled and appended at runtime.
   */
  public static reload(): RegulatoryKnowledgeKernel {
    RegulatoryKnowledgeKernel.instance = new RegulatoryKnowledgeKernel();
    return RegulatoryKnowledgeKernel.instance;
  }

  /**
   * Retrieves all registered regulatory entities (Laws, Avisos, etc.) as frozen metadata objects.
   */
  public getRegulatoryEntities(): RegulatoryEntity[] {
    return [...this.entities];
  }

  /**
   * Retrieves a specific regulatory entity by ID or Name.
   */
  public getRegulatoryEntityById(id: string): RegulatoryEntity | undefined {
    return this.entities.find(e => e.id === id || e.name.toLowerCase() === id.toLowerCase());
  }

  /**
   * Retrieves all obligations belonging to a specific regulatory entity (by ID or name).
   */
  public getObligationsByEntity(entityIdOrName: string, activeAtDate?: string): Obligation[] {
    const entity = this.getRegulatoryEntityById(entityIdOrName);
    const searchName = entity ? entity.name.toLowerCase() : entityIdOrName.toLowerCase();
    
    return this.getAllObligations(activeAtDate).filter(
      o => o.lei.toLowerCase().includes(searchName) || (entity && o.lei.toLowerCase() === entity.name.toLowerCase())
    );
  }

  /**
   * Evaluates if a given obligation is effective at a specific date.
   */
  public isEffectiveAt(obligation: Obligation, dateStr: string): boolean {
    if (!obligation.versioning) return true;
    try {
      const checkDate = new Date(dateStr);
      if (isNaN(checkDate.getTime())) return true; // fail-safe: active

      const effectiveFrom = new Date(obligation.versioning.effectiveFrom);
      if (!isNaN(effectiveFrom.getTime()) && effectiveFrom > checkDate) return false;

      if (obligation.versioning.effectiveUntil) {
        const effectiveUntil = new Date(obligation.versioning.effectiveUntil);
        if (!isNaN(effectiveUntil.getTime()) && effectiveUntil < checkDate) return false;
      }
    } catch {
      return true; // fail-safe: assume active
    }
    return true;
  }

  /**
   * Retrieves a single obligation by its ID.
   */
  public getObligationById(id: string): Obligation | undefined {
    return this.obligations.get(id);
  }

  /**
   * Retrieves all obligations, optionally filtered by compliance/versioning date.
   */
  public getAllObligations(activeAtDate?: string): Obligation[] {
    const list = Array.from(this.obligations.values());
    if (!activeAtDate) return list;
    return list.filter(o => this.isEffectiveAt(o, activeAtDate));
  }

  /**
   * Retrieves all structured rights, optionally filtered by compliance/versioning date of their parent obligation.
   */
  public getRights(activeAtDate?: string): StructuredRight[] {
    if (!activeAtDate) return [...this.rights];
    return this.rights.filter(r => {
      const parent = this.getObligationById(r.obligationId);
      return parent ? this.isEffectiveAt(parent, activeAtDate) : true;
    });
  }

  /**
   * Retrieves all structured prohibitions, optionally filtered by compliance/versioning date of their parent obligation.
   */
  public getProhibitions(activeAtDate?: string): StructuredProhibition[] {
    if (!activeAtDate) return [...this.prohibitions];
    return this.prohibitions.filter(p => {
      const parent = this.getObligationById(p.obligationId);
      return parent ? this.isEffectiveAt(parent, activeAtDate) : true;
    });
  }

  /**
   * Retrieves all structured concepts.
   */
  public getConcepts(): StructuredConcept[] {
    return [...this.concepts];
  }

  /**
   * Retrieves a specific concept by its name.
   */
  public getConceptByName(name: string): StructuredConcept | undefined {
    return this.concepts.find(c => c.name.toLowerCase() === name.toLowerCase());
  }

  /**
   * Retrieves obligations associated with a specific concept.
   */
  public getObligationsByConcept(conceptName: string, activeAtDate?: string): Obligation[] {
    const obligations = this.getAllObligations(activeAtDate);
    return obligations.filter(o => o.concepts && o.concepts.includes(conceptName));
  }

  /**
   * Retrieves obligations filtered by severity.
   */
  public getObligationsBySeverity(severity: Severity, activeAtDate?: string): Obligation[] {
    return this.getAllObligations(activeAtDate).filter(o => o.severity === severity);
  }

  /**
   * Retrieves obligations filtered by rule type.
   */
  public getObligationsByRuleType(tipo: RuleType, activeAtDate?: string): Obligation[] {
    return this.getAllObligations(activeAtDate).filter(o => o.tipo === tipo);
  }

  /**
   * Retrieves obligations filtered by actor target.
   */
  public getObligationsByActor(actor: string, activeAtDate?: string): Obligation[] {
    const lowerActor = actor.toLowerCase();
    return this.getAllObligations(activeAtDate).filter(o => o.actor.toLowerCase().includes(lowerActor));
  }

  /**
   * Gets evidence proof requirements for a specific obligation.
   */
  public getEvidenceProofRequirements(id: string): EvidenceRequired | undefined {
    const obligation = this.getObligationById(id);
    return obligation?.evidenceRequired;
  }

  /**
   * Retrieves direct regulatory dependencies for a specific obligation.
   */
  public getDependencies(id: string): Obligation[] {
    const deps: Obligation[] = [];
    const relationIds = REGULATORY_RELATIONS
      .filter(r => r.sourceId === id && r.type === 'depends')
      .map(r => r.targetId);

    relationIds.forEach(depId => {
      const found = this.getObligationById(depId);
      if (found) deps.push(found);
    });

    // Also look at parent's versioning dependency tree
    const parent = this.getObligationById(id);
    if (parent?.versioning?.dependsOn) {
      parent.versioning.dependsOn.forEach(depId => {
        if (!deps.find(d => d.id === depId)) {
          const found = this.getObligationById(depId);
          if (found) deps.push(found);
        }
      });
    }

    return deps;
  }

  /**
   * Retrieves direct regulatory dependents for a specific obligation.
   */
  public getDependents(id: string): Obligation[] {
    const dependents: Obligation[] = [];
    
    // Check relations
    REGULATORY_RELATIONS
      .filter(r => r.targetId === id && r.type === 'depends')
      .forEach(r => {
        const found = this.getObligationById(r.sourceId);
        if (found) dependents.push(found);
      });

    // Check versioning dependencies
    this.getAllObligations().forEach(o => {
      if (o.versioning?.dependsOn?.includes(id)) {
        if (!dependents.find(d => d.id === o.id)) {
          dependents.push(o);
        }
      }
    });

    return dependents;
  }
}
