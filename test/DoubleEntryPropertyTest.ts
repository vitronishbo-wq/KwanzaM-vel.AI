/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * TESTES BASEADOS EM PROPRIEDADES E STRESS DE DOUBLE-ENTRY BOOKKEEPING
 * 
 * Verifica matematicamente as invariantes fundamentais:
 * Invariante 1: \sum(Débitos) == \sum(Créditos) em 100% das transações geradas.
 * Invariante 2: Conservação de Massa Monetária (Zero-Sum Invariant).
 * Invariante 3: Integridade do Balancete de Verificação (Trial Balance).
 * Invariante 4: Neutralização Exata de Estornos Compensatórios (Reversal Invariant).
 */

import {
  roundToKwanzaCents,
  validateDoubleEntryBalance,
  createP2PPostings,
  createMerchantPaymentPostings,
  createCashInPostings,
  createCashOutPostings,
  executeDoubleEntryTransaction,
  executeAtomicDoubleEntryTransaction,
  AtomicUnitOfWork,
  computeTrialBalance,
  validateNonNegativeBalance,
  validateSystemMathematicalInvariants,
  NegativeBalanceViolationException
} from "../src/domain/ledger/DoubleEntryBookkeeping";
import { LedgerAccount, LedgerPosting, initialLedgerAccounts } from "../src/ledgerEngine";
import {
  UnbalancedJournalEntryException,
  createReversalJournalEntry,
  computeJournalEntryHash,
  GENESIS_PREVIOUS_HASH,
  LedgerImmutabilityGuard,
  RetroactiveModificationProhibitedException,
  LedgerHistoryTamperException,
  detectHistoricalTampering,
  verifyLedgerChainIntegrity,
  deepFreeze
} from "../src/domain/ledger/LedgerCryptography";

export interface PropertyTestResult {
  suiteName: string;
  totalIterations: number;
  passed: boolean;
  violationsCount: number;
  details: string[];
  executionTimeMs: number;
}

export class DoubleEntryPropertyTester {
  /**
   * Executa a bateria completa de testes de propriedade de partidas dobradas.
   */
  public static runAllPropertyTests(iterationsPerProperty: number = 500): {
    allPassed: boolean;
    reports: PropertyTestResult[];
    totalTestsRun: number;
  } {
    const reports: PropertyTestResult[] = [];
    const startTime = Date.now();

    // Propriedade 1: Invariante Zero-Sum em Transferências P2P Aleatórias
    reports.push(this.testP2PZeroSumProperty(iterationsPerProperty));

    // Propriedade 2: Invariante de Split de Pagamento Comercial (Payer = Net + Fee + Tax)
    reports.push(this.testMerchantSplitProperty(iterationsPerProperty));

    // Propriedade 3: Invariante de Custódia e Emissão (Cash-In & Cash-Out com BNA)
    reports.push(this.testCashInCashOutProperty(iterationsPerProperty));

    // Propriedade 4: Invariante de Estorno Compensatório (Lançamento Original + Estorno === 0)
    reports.push(this.testCompensatoryReversalProperty(iterationsPerProperty));

    // Propriedade 5: Rejeição Inviolável de Lançamentos Assimétricos
    reports.push(this.testAsymmetricEntryRejectionProperty(iterationsPerProperty));

    // Propriedade 6: Consistência do Balancete de Verificação (Trial Balance Invariant)
    reports.push(this.testTrialBalanceProperty(iterationsPerProperty));

    // Propriedade 7: Impossibilidade Absoluta de Saldo Negativo sob Demanda Excessiva
    reports.push(this.testNegativeBalanceImpossibilityProperty(iterationsPerProperty));

    // Propriedade 8: Auditoria Global de Invariantes Matemáticas do Sistema
    reports.push(this.testSystemMathematicalInvariantsAuditProperty(iterationsPerProperty));

    // Propriedade 9: Impossibilidade Absoluta de Alteração Retroativa (Veto WORM & Append-Only)
    reports.push(this.testRetroactiveModificationProhibitionProperty(iterationsPerProperty));

    // Propriedade 10: Detecção Criptográfica Instantânea de Adulteração Histórica (Tamper Resistance)
    reports.push(this.testHistoricalTamperDetectionProperty(iterationsPerProperty));

    // Propriedade 11: Atomicidade Indivisível ACID (Débito, Crédito e Estado Indivisíveis com Rollback Total Garantido)
    reports.push(this.testAtomicityAllOrNothingProperty(iterationsPerProperty));

    const allPassed = reports.every(r => r.passed);
    const totalTestsRun = reports.reduce((acc, r) => acc + r.totalIterations, 0);

    return {
      allPassed,
      reports,
      totalTestsRun
    };
  }

  private static testP2PZeroSumProperty(iterations: number): PropertyTestResult {
    const tStart = Date.now();
    let violations = 0;
    const details: string[] = [];

    for (let i = 0; i < iterations; i++) {
      const amount = roundToKwanzaCents(Math.random() * 500000 + 0.01);
      const sender = { id: `USER_SND_${i}`, name: `Remetente ${i}` };
      const receiver = { id: `USER_RCV_${i}`, name: `Destinatário ${i}` };

      try {
        const postings = createP2PPostings({
          senderAccount: sender,
          receiverAccount: receiver,
          amount
        });

        const sum = roundToKwanzaCents(postings.reduce((acc, p) => acc + p.amount, 0));
        const debitSum = roundToKwanzaCents(postings.filter(p => p.type === "DEBIT").reduce((acc, p) => acc + p.amount, 0));
        const creditSum = roundToKwanzaCents(postings.filter(p => p.type === "CREDIT").reduce((acc, p) => acc + Math.abs(p.amount), 0));

        if (Math.abs(sum) > 0.0001 || Math.abs(debitSum - creditSum) > 0.0001) {
          violations++;
          details.push(`Iteração ${i}: Falha de equilíbrio no P2P para valor ${amount} Kz. Soma=${sum}`);
        }
      } catch (err: any) {
        violations++;
        details.push(`Iteração ${i}: Exceção inesperada: ${err.message}`);
      }
    }

    return {
      suiteName: "Propriedade 1: Invariante Zero-Sum em Transferências P2P (\\sum Débito == \\sum Crédito)",
      totalIterations: iterations,
      passed: violations === 0,
      violationsCount: violations,
      details,
      executionTimeMs: Date.now() - tStart
    };
  }

  private static testMerchantSplitProperty(iterations: number): PropertyTestResult {
    const tStart = Date.now();
    let violations = 0;
    const details: string[] = [];

    for (let i = 0; i < iterations; i++) {
      const amount = roundToKwanzaCents(Math.random() * 1000000 + 1.00);
      const feeRate = Number((Math.random() * 0.02).toFixed(4)); // 0% a 2%
      const taxRate = Number((Math.random() * 0.01).toFixed(4)); // 0% a 1%

      const payer = { id: "USER_PAYER", name: "Cliente Pagador" };
      const merchant = { id: "MERCH_STORE", name: "Lojista" };
      const feeVault = { id: "KM_FEES_VAULT", name: "Cofre de Taxas" };
      const taxVault = { id: "KM_TAX_VAULT", name: "Cofre de Impostos" };

      try {
        const postings = createMerchantPaymentPostings({
          payerAccount: payer,
          merchantAccount: merchant,
          feeVaultAccount: feeVault,
          taxVaultAccount: taxVault,
          totalAmount: amount,
          feePercentage: feeRate,
          taxPercentage: taxRate
        });

        const debitSum = roundToKwanzaCents(
          postings.filter(p => p.type === "DEBIT").reduce((acc, p) => acc + Math.abs(p.amount), 0)
        );
        const creditSum = roundToKwanzaCents(
          postings.filter(p => p.type === "CREDIT").reduce((acc, p) => acc + Math.abs(p.amount), 0)
        );

        if (Math.abs(debitSum - creditSum) > 0.0001 || Math.abs(debitSum - amount) > 0.0001) {
          violations++;
          details.push(`Iteração ${i}: Split inconsistente para montante ${amount} Kz. Débito=${debitSum}, Crédito=${creditSum}`);
        }
      } catch (err: any) {
        violations++;
        details.push(`Iteração ${i}: Erro no split comercial: ${err.message}`);
      }
    }

    return {
      suiteName: "Propriedade 2: Invariante de Split de Pagamento Comercial com Taxas e Retenção",
      totalIterations: iterations,
      passed: violations === 0,
      violationsCount: violations,
      details,
      executionTimeMs: Date.now() - tStart
    };
  }

  private static testCashInCashOutProperty(iterations: number): PropertyTestResult {
    const tStart = Date.now();
    let violations = 0;
    const details: string[] = [];

    const escrow = { id: "BNA_ESCROW_RESERVE", name: "Custódia BNA" };
    const user = { id: "USER_WALLET", name: "Carteira Utilizador" };
    const feeVault = { id: "KM_FEES_VAULT", name: "Cofre de Taxas" };

    for (let i = 0; i < iterations; i++) {
      const amount = roundToKwanzaCents(Math.random() * 2000000 + 10.00);

      // Testar Cash-In
      try {
        const cashInPostings = createCashInPostings({
          escrowAccount: escrow,
          userAccount: user,
          amount
        });
        const cashInBalance = validateDoubleEntryBalance(cashInPostings);
        if (cashInBalance.discrepancy > 0.0001) {
          violations++;
          details.push(`Cash-In falhou na iteração ${i}`);
        }
      } catch (err: any) {
        violations++;
        details.push(`Erro no Cash-In: ${err.message}`);
      }

      // Testar Cash-Out
      try {
        const cashOutPostings = createCashOutPostings({
          userAccount: user,
          escrowAccount: escrow,
          feeVaultAccount: feeVault,
          amount,
          feeAmount: roundToKwanzaCents(amount * 0.005) // 0.5% taxa de levantamento
        });
        const cashOutBalance = validateDoubleEntryBalance(cashOutPostings);
        if (cashOutBalance.discrepancy > 0.0001) {
          violations++;
          details.push(`Cash-Out falhou na iteração ${i}`);
        }
      } catch (err: any) {
        violations++;
        details.push(`Erro no Cash-Out: ${err.message}`);
      }
    }

    return {
      suiteName: "Propriedade 3: Invariante Fiduciária de Custódia e Emissão (Cash-In / Cash-Out BNA)",
      totalIterations: iterations,
      passed: violations === 0,
      violationsCount: violations,
      details,
      executionTimeMs: Date.now() - tStart
    };
  }

  private static testCompensatoryReversalProperty(iterations: number): PropertyTestResult {
    const tStart = Date.now();
    let violations = 0;
    const details: string[] = [];

    for (let i = 0; i < iterations; i++) {
      const amount = roundToKwanzaCents(Math.random() * 100000 + 5.00);
      const originalPostings = createP2PPostings({
        senderAccount: { id: "USER_A", name: "Conta A" },
        receiverAccount: { id: "USER_B", name: "Conta B" },
        amount
      });

      const originalEntry = {
        id: `JE-ORIG-${i}`,
        description: `Transação Original ${i}`,
        txReferenceId: `tx_orig_${i}`,
        postings: originalPostings,
        sequenceNumber: i + 1,
        hash: `HASH_${i}`
      };

      try {
        const reversalEntry = createReversalJournalEntry(originalEntry, "Auditoria BNA");

        // A soma de cada conta entre o original e o estorno deve ser exatamente zero
        const combinedPostings = [...originalEntry.postings, ...reversalEntry.postings];
        const accountBalances: Record<string, number> = {};

        for (const p of combinedPostings) {
          accountBalances[p.accountId] = roundToKwanzaCents((accountBalances[p.accountId] || 0) + p.amount);
        }

        for (const [accId, bal] of Object.entries(accountBalances)) {
          if (Math.abs(bal) > 0.0001) {
            violations++;
            details.push(`Iteração ${i}: Estorno não anulou saldo da conta ${accId}. Saldo residual: ${bal}`);
          }
        }
      } catch (err: any) {
        violations++;
        details.push(`Erro no estorno compensatório: ${err.message}`);
      }
    }

    return {
      suiteName: "Propriedade 4: Invariante de Estorno Compensatório (Lançamento Original + Estorno == 0)",
      totalIterations: iterations,
      passed: violations === 0,
      violationsCount: violations,
      details,
      executionTimeMs: Date.now() - tStart
    };
  }

  private static testAsymmetricEntryRejectionProperty(iterations: number): PropertyTestResult {
    const tStart = Date.now();
    let violations = 0;
    const details: string[] = [];

    for (let i = 0; i < iterations; i++) {
      const asymmetricAmount = roundToKwanzaCents(Math.random() * 10000 + 1.00);
      const deviation = roundToKwanzaCents(Math.random() * 100 + 0.05);

      const invalidPostings: LedgerPosting[] = [
        { accountId: "ACC_1", accountName: "Conta 1", amount: asymmetricAmount, type: "DEBIT" },
        { accountId: "ACC_2", accountName: "Conta 2", amount: -(asymmetricAmount + deviation), type: "CREDIT" }
      ];

      try {
        validateDoubleEntryBalance(invalidPostings, `INVALID_TX_${i}`);
        // Se não lançou exceção, é uma violação de segurança!
        violations++;
        details.push(`Iteração ${i}: Lançamento desbalanceado com desvio de ${deviation} Kz foi incorretamente aceito.`);
      } catch (err) {
        if (!(err instanceof UnbalancedJournalEntryException)) {
          violations++;
          details.push(`Iteração ${i}: Tipo de exceção incorreto para desbalanceamento: ${err}`);
        }
      }
    }

    return {
      suiteName: "Propriedade 5: Rejeição Inviolável de Lançamentos Assimétricos (Zero Tolerância a Desbalanceamento)",
      totalIterations: iterations,
      passed: violations === 0,
      violationsCount: violations,
      details,
      executionTimeMs: Date.now() - tStart
    };
  }

  private static testTrialBalanceProperty(iterations: number): PropertyTestResult {
    const tStart = Date.now();
    let violations = 0;
    const details: string[] = [];

    // Inicializa plano de contas com saldos canónicos
    let currentAccounts: LedgerAccount[] = initialLedgerAccounts.map(a => ({ ...a }));

    for (let i = 0; i < iterations; i++) {
      const amount = roundToKwanzaCents(Math.random() * 5000 + 1.00);
      const postings = createP2PPostings({
        senderAccount: { id: "USER_ANTONIO", name: "António Mateus" },
        receiverAccount: { id: "USER_BENEFICIARY", name: "Beneficiário" },
        amount
      });

      const txResult = executeDoubleEntryTransaction({
        accounts: currentAccounts,
        postings,
        description: `Transferência de Stress #${i}`,
        txReferenceId: `tx_stress_${i}`
      });

      if (!txResult.success) {
        violations++;
        details.push(`Iteração ${i}: Falha ao executar transação de partidas dobradas: ${txResult.error}`);
        continue;
      }

      currentAccounts = txResult.updatedAccounts;

      // Calcular Balancete de Verificação
      const trialBalance = computeTrialBalance(currentAccounts);
      if (!trialBalance.isBalanced || trialBalance.discrepancy > 0.001) {
        violations++;
        details.push(`Iteração ${i}: Balancete de verificação desequilibrado! Discrepância: ${trialBalance.discrepancy} Kz`);
      }
    }

    return {
      suiteName: "Propriedade 6: Consistência Contínua do Balancete de Verificação (Trial Balance Invariant)",
      totalIterations: iterations,
      passed: violations === 0,
      violationsCount: violations,
      details,
      executionTimeMs: Date.now() - tStart
    };
  }

  private static testNegativeBalanceImpossibilityProperty(iterations: number): PropertyTestResult {
    const tStart = Date.now();
    let violations = 0;
    const details: string[] = [];

    for (let i = 0; i < iterations; i++) {
      const currentBalance = roundToKwanzaCents(Math.random() * 1000 + 10.00);
      const excessiveAmount = roundToKwanzaCents(currentBalance + Math.random() * 500 + 0.01);

      // Teste 1: Validador direto
      try {
        validateNonNegativeBalance(
          { id: `USER_TEST_${i}`, name: `Utilizador ${i}`, balance: currentBalance },
          excessiveAmount
        );
        // Se não lançou exceção, falhou!
        violations++;
        details.push(`Iteração ${i}: validateNonNegativeBalance permitiu saldo negativo. Saldo: ${currentBalance}, Débito: ${excessiveAmount}`);
      } catch (err) {
        if (!(err instanceof NegativeBalanceViolationException)) {
          violations++;
          details.push(`Iteração ${i}: Exceção incorreta ao tentar debitar montante excessivo: ${err}`);
        }
      }

      // Teste 2: Através do executeDoubleEntryTransaction
      const accounts: LedgerAccount[] = [
        { id: `USER_TEST_${i}`, name: `Utilizador ${i}`, balance: currentBalance, type: "LIABILITY", description: "Conta teste", version: 1 },
        { id: `MERCH_TEST_${i}`, name: `Lojista ${i}`, balance: 0, type: "LIABILITY", description: "Conta lojista", version: 1 }
      ];

      const postings = createP2PPostings({
        senderAccount: { id: `USER_TEST_${i}`, name: `Utilizador ${i}` },
        receiverAccount: { id: `MERCH_TEST_${i}`, name: `Lojista ${i}` },
        amount: excessiveAmount
      });

      const txResult = executeDoubleEntryTransaction({
        accounts,
        postings,
        description: "Tentativa de Saque a Descoberto",
        txReferenceId: `tx_overdraft_${i}`
      });

      if (txResult.success) {
        violations++;
        details.push(`Iteração ${i}: executeDoubleEntryTransaction permitiu saldo negativo na conta! Saldo original: ${currentBalance}, Valor: ${excessiveAmount}`);
      }
    }

    return {
      suiteName: "Propriedade 7: Impossibilidade Absoluta de Saldo Negativo (Zero Tolerância a Descoberto)",
      totalIterations: iterations,
      passed: violations === 0,
      violationsCount: violations,
      details,
      executionTimeMs: Date.now() - tStart
    };
  }

  private static testSystemMathematicalInvariantsAuditProperty(iterations: number): PropertyTestResult {
    const tStart = Date.now();
    let violations = 0;
    const details: string[] = [];

    for (let i = 0; i < iterations; i++) {
      const accounts: LedgerAccount[] = initialLedgerAccounts.map(a => ({ ...a }));
      const custodyState = {
        bnaCustodyBalance: 2500000000,
        bfaReserveBalance: 500000000,
        baiReserveBalance: 500000000,
        bicReserveBalance: 500000000,
        totalCirculation: 15420500,
        pendingSettlementsCount: 0,
        lastSptrMsgIso20022: "<pacs.008/>",
        isSettling: false,
        criticalVolumeThreshold: 100000000,
        criticalPendingLimit: 50,
        criticalCirculationThreshold: 500000000
      };

      const auditReport = validateSystemMathematicalInvariants({
        accounts,
        custodyState
      });

      if (!auditReport.isFullyCompliant || auditReport.invariantsFailed > 0) {
        violations++;
        details.push(`Iteração ${i}: Auditoria matemática global reportou falhas: ${auditReport.discrepancies.join("; ")}`);
      }
    }

    return {
      suiteName: "Propriedade 8: Auditoria Global de Invariantes Matemáticas do Sistema (100% Conformidade)",
      totalIterations: iterations,
      passed: violations === 0,
      violationsCount: violations,
      details,
      executionTimeMs: Date.now() - tStart
    };
  }

  private static testRetroactiveModificationProhibitionProperty(iterations: number): PropertyTestResult {
    const tStart = Date.now();
    let violations = 0;
    const details: string[] = [];

    for (let i = 0; i < iterations; i++) {
      const existingChain = [
        { id: `ENTRY-001`, sequenceNumber: 1, hash: "a".repeat(64) },
        { id: `ENTRY-002`, sequenceNumber: 2, hash: "b".repeat(64) },
        { id: `ENTRY-003`, sequenceNumber: 3, hash: "c".repeat(64) }
      ];

      // Cenário 1: Tentativa de sobrescrever registo existente (OVERWRITE)
      try {
        LedgerImmutabilityGuard.assertAppendOnly(existingChain, {
          id: "ENTRY-002",
          sequenceNumber: 2,
          previousHash: "a".repeat(64)
        });
        violations++;
        details.push(`Iteração ${i}: assertAppendOnly permitiu sobrescrita do registo histórico ENTRY-002.`);
      } catch (err: any) {
        if (!(err instanceof RetroactiveModificationProhibitedException) || err.attemptedOperation !== "OVERWRITE") {
          violations++;
          details.push(`Iteração ${i}: Exceção incorreta na tentativa de sobrescrita: ${err}`);
        }
      }

      // Cenário 2: Tentativa de inserção retroativa no passado (BACKDATED_INSERT)
      try {
        LedgerImmutabilityGuard.assertAppendOnly(existingChain, {
          id: `ENTRY-BACKDATED-${i}`,
          sequenceNumber: 2, // Cadeia atual está no seq #3, próximo deve ser #4
          previousHash: "a".repeat(64)
        });
        violations++;
        details.push(`Iteração ${i}: assertAppendOnly permitiu inserção retroativa na sequência #2.`);
      } catch (err: any) {
        if (!(err instanceof RetroactiveModificationProhibitedException) || err.attemptedOperation !== "BACKDATED_INSERT") {
          violations++;
          details.push(`Iteração ${i}: Exceção incorreta na tentativa de inserção retroativa: ${err}`);
        }
      }

      // Cenário 3: Tentativa de criar lacuna de sequência (SEQUENCE_GAP)
      try {
        LedgerImmutabilityGuard.assertAppendOnly(existingChain, {
          id: `ENTRY-GAP-${i}`,
          sequenceNumber: 10, // Esperado era #4
          previousHash: "c".repeat(64)
        });
        violations++;
        details.push(`Iteração ${i}: assertAppendOnly permitiu lacuna de sequência #10.`);
      } catch (err: any) {
        if (!(err instanceof LedgerHistoryTamperException) || err.tamperType !== "SEQUENCE_GAP") {
          violations++;
          details.push(`Iteração ${i}: Exceção incorreta na tentativa de inserção com lacuna: ${err}`);
        }
      }

      // Cenário 4: Tentativa de adulteração de hash em registo existente (UPDATE)
      try {
        LedgerImmutabilityGuard.assertNoRetroactiveModification(
          { id: "ENTRY-001", hash: "a".repeat(64) },
          { id: "ENTRY-001", hash: "f".repeat(64) }
        );
        violations++;
        details.push(`Iteração ${i}: assertNoRetroactiveModification permitiu mutação de hash.`);
      } catch (err: any) {
        if (!(err instanceof RetroactiveModificationProhibitedException) || err.attemptedOperation !== "UPDATE") {
          violations++;
          details.push(`Iteração ${i}: Exceção incorreta na tentativa de mutação de hash: ${err}`);
        }
      }
    }

    return {
      suiteName: "Propriedade 9: Impossibilidade Absoluta de Alteração Retroativa (Veto WORM & Append-Only)",
      totalIterations: iterations,
      passed: violations === 0,
      violationsCount: violations,
      details,
      executionTimeMs: Date.now() - tStart
    };
  }

  private static testHistoricalTamperDetectionProperty(iterations: number): PropertyTestResult {
    const tStart = Date.now();
    let violations = 0;
    const details: string[] = [];

    for (let i = 0; i < iterations; i++) {
      // 1. Construir uma cadeia criptográfica determinística válida de N blocos
      const chainLength = 5;
      const validChain: any[] = [];
      let prevHash = GENESIS_PREVIOUS_HASH;

      for (let seq = 1; seq <= chainLength; seq++) {
        const entryId = `JOURNAL-TEST-${i}-${seq}`;
        const timestamp = new Date(Date.now() - (chainLength - seq) * 1000).toISOString();
        const description = `Lançamento Contábil #${seq}`;
        const txReferenceId = `tx_ref_${i}_${seq}`;
        const postings = [
          { accountId: "USER_A", accountName: "Utilizador A", amount: -100.0, type: "DEBIT" as const },
          { accountId: "USER_B", accountName: "Utilizador B", amount: 100.0, type: "CREDIT" as const }
        ];

        const hash = computeJournalEntryHash({
          id: entryId,
          sequenceNumber: seq,
          timestamp,
          description,
          txReferenceId,
          postings,
          previousHash: prevHash
        });

        validChain.push({
          id: entryId,
          sequenceNumber: seq,
          timestamp,
          description,
          txReferenceId,
          postings,
          previousHash: prevHash,
          hash
        });

        prevHash = hash;
      }

      // Validação 1: Cadeia intacta deve passar com 0 violações
      const cleanCheck = detectHistoricalTampering(validChain);
      if (cleanCheck.isTampered || cleanCheck.tamperedEntriesCount !== 0) {
        violations++;
        details.push(`Iteração ${i}: Cadeia intacta reportou falsos positivos de adulteração.`);
      }

      // Validação 2: Injetar mutação em um bloco aleatório (ex.: alterar montante de 100.0 para 100.01 Kz)
      const tamperedBlockIdx = Math.floor(Math.random() * chainLength);
      const tamperedChain = validChain.map((entry, idx) => {
        if (idx === tamperedBlockIdx) {
          return {
            ...entry,
            postings: [
              { accountId: "USER_A", accountName: "Utilizador A", amount: -100.01, type: "DEBIT" as const },
              { accountId: "USER_B", accountName: "Utilizador B", amount: 100.01, type: "CREDIT" as const }
            ]
          };
        }
        return { ...entry };
      });

      const tamperReport = detectHistoricalTampering(tamperedChain);
      const integrityReport = verifyLedgerChainIntegrity(tamperedChain);

      // Deve detectar adulteração obrigatoriamente
      if (!tamperReport.isTampered || integrityReport.isValid) {
        violations++;
        details.push(`Iteração ${i}: Adulteração injetada no bloco #${tamperedBlockIdx + 1} não foi detectada!`);
      }
    }

    return {
      suiteName: "Propriedade 10: Detecção Criptográfica Instantânea de Adulteração Histórica (Tamper Resistance)",
      totalIterations: iterations,
      passed: violations === 0,
      violationsCount: violations,
      details,
      executionTimeMs: Date.now() - tStart
    };
  }

  private static testAtomicityAllOrNothingProperty(iterations: number): PropertyTestResult {
    const tStart = Date.now();
    let violations = 0;
    const details: string[] = [];

    for (let i = 0; i < iterations; i++) {
      const initialSenderBalance = roundToKwanzaCents(1000 + Math.random() * 50000);
      const initialReceiverBalance = roundToKwanzaCents(200 + Math.random() * 10000);

      const accounts: LedgerAccount[] = [
        {
          id: `SENDER_${i}`,
          name: `Remetente ${i}`,
          balance: initialSenderBalance,
          type: "LIABILITY",
          description: "Carteira Utilizador",
          version: 1
        },
        {
          id: `RECEIVER_${i}`,
          name: `Destinatário ${i}`,
          balance: initialReceiverBalance,
          type: "LIABILITY",
          description: "Carteira Lojista",
          version: 1
        }
      ];

      // Caso 1: Transação Válida -> Atomicidade deve cometer ambos (débito e crédito) com state == "COMMITTED"
      const transferAmount = roundToKwanzaCents(initialSenderBalance * 0.5);
      const validPostings = [
        { accountId: `SENDER_${i}`, accountName: `Remetente ${i}`, amount: -transferAmount, type: "DEBIT" as const },
        { accountId: `RECEIVER_${i}`, accountName: `Destinatário ${i}`, amount: transferAmount, type: "CREDIT" as const }
      ];

      const successResult = executeAtomicDoubleEntryTransaction({
        accounts,
        postings: validPostings,
        description: `Transferência atômica válida #${i}`,
        txReferenceId: `tx_atomic_valid_${i}`
      });

      if (!successResult.success || successResult.lifecycleState !== "COMMITTED") {
        violations++;
        details.push(`Iteração ${i}: Transação válida não foi marcada como COMMITTED.`);
      }

      const senderAfter = successResult.updatedAccounts.find(a => a.id === `SENDER_${i}`)!;
      const receiverAfter = successResult.updatedAccounts.find(a => a.id === `RECEIVER_${i}`)!;

      if (
        senderAfter.balance !== roundToKwanzaCents(initialSenderBalance - transferAmount) ||
        receiverAfter.balance !== roundToKwanzaCents(initialReceiverBalance + transferAmount)
      ) {
        violations++;
        details.push(`Iteração ${i}: Saldos pós-commit não coincidem exatamente com débito e crédito.`);
      }

      if (!successResult.journalEntry || !successResult.journalEntry.hash) {
        violations++;
        details.push(`Iteração ${i}: Entrada do diário não foi selada criptograficamente.`);
      }

      // Caso 2: Transação Inválida (Débito excessivo) -> Rollback estrito, state == "ABORTED", 0 saldos alterados
      const excessiveAmount = roundToKwanzaCents(initialSenderBalance + 10000);
      const invalidPostings = [
        { accountId: `SENDER_${i}`, accountName: `Remetente ${i}`, amount: -excessiveAmount, type: "DEBIT" as const },
        { accountId: `RECEIVER_${i}`, accountName: `Destinatário ${i}`, amount: excessiveAmount, type: "CREDIT" as const }
      ];

      const failResult = executeAtomicDoubleEntryTransaction({
        accounts, // usando as contas originais
        postings: invalidPostings,
        description: `Transferência excessiva com falha #${i}`,
        txReferenceId: `tx_atomic_excessive_${i}`
      });

      if (failResult.success || failResult.lifecycleState !== "ABORTED") {
        violations++;
        details.push(`Iteração ${i}: Transação falha não transitou indivisivelmente para ABORTED.`);
      }

      const senderRolledBack = failResult.updatedAccounts.find(a => a.id === `SENDER_${i}`)!;
      const receiverRolledBack = failResult.updatedAccounts.find(a => a.id === `RECEIVER_${i}`)!;

      if (
        senderRolledBack.balance !== initialSenderBalance ||
        receiverRolledBack.balance !== initialReceiverBalance
      ) {
        violations++;
        details.push(`Iteração ${i}: Rollback violado! Saldos foram parcialmente mutados em transação abortada.`);
      }

      if (failResult.journalEntry !== null) {
        violations++;
        details.push(`Iteração ${i}: Registo no diário contábil foi incorretamente gerado para transação abortada.`);
      }

      // Caso 3: Transação com conta inexistente no plano de contas -> Rollback total e state == "ABORTED"
      const nonExistentPostings = [
        { accountId: `SENDER_${i}`, accountName: `Remetente ${i}`, amount: -100, type: "DEBIT" as const },
        { accountId: `NON_EXISTENT_ACCOUNT`, accountName: "Inexistente", amount: 100, type: "CREDIT" as const }
      ];

      const nonExistentResult = executeAtomicDoubleEntryTransaction({
        accounts,
        postings: nonExistentPostings,
        description: `Transferência para conta fantasma #${i}`,
        txReferenceId: `tx_atomic_ghost_${i}`
      });

      if (nonExistentResult.success || nonExistentResult.lifecycleState !== "ABORTED") {
        violations++;
        details.push(`Iteração ${i}: Transação com conta fantasma não foi abortada.`);
      }

      const senderGhostCheck = nonExistentResult.updatedAccounts.find(a => a.id === `SENDER_${i}`)!;
      if (senderGhostCheck.balance !== initialSenderBalance) {
        violations++;
        details.push(`Iteração ${i}: Débito fantasma foi debitado sem crédito correspondente!`);
      }
    }

    return {
      suiteName: "Propriedade 11: Atomicidade Indivisível ACID (Débito, Crédito e Estado Indivisíveis com Rollback Total)",
      totalIterations: iterations,
      passed: violations === 0,
      violationsCount: violations,
      details,
      executionTimeMs: Date.now() - tStart
    };
  }
}


