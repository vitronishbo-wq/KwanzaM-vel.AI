/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ValidationItemResult {
  variable: string;
  category: "SECURITY" | "REGULATORY" | "PERSISTENCE" | "RBAC";
  configuredValue: string;
  maskedValue: string;
  isSimulatedOrDev: boolean;
  isValidForCurrentMode: boolean;
  notes: string;
}

export interface EnvironmentValidationReport {
  isProduction: boolean;
  signatureMode: "SIMULATED" | "PRODUCTION";
  bnaMode: "SIMULATED" | "PRODUCTION";
  allValid: boolean;
  blockingErrors: string[];
  warnings: string[];
  validatedAt: string;
  items: ValidationItemResult[];
}

/**
 * EnvironmentConfigValidator (Bootstrap Guard)
 * 
 * Validador estrito de configuração de arranque do KMOS.
 * 
 * Regra Absoluta:
 * - Em modo de Desenvolvimento/Sandbox: pode simular infraestrutura e usar adaptadores SIMULATED.
 * - Em modo de Produção: NÃO PODE simular, inventar ou embutir credenciais, chaves ou endpoints regulatórios.
 *   Se qualquer valor contiver 'DEV-*', 'SIMULATED', '.local', chaves padrão de teste ou endpoints fictícios,
 *   o arranque em produção é imediatamente abortado com erro fatal.
 */
export class EnvironmentConfigValidator {
  private static cachedReport: EnvironmentValidationReport | null = null;

  public static getEnv(key: string, defaultValue: string = ""): string {
    if (typeof process !== "undefined" && process.env && process.env[key] !== undefined) {
      return String(process.env[key]);
    }
    if (typeof import.meta !== "undefined" && (import.meta as any).env && (import.meta as any).env[`VITE_${key}`] !== undefined) {
      return String((import.meta as any).env[`VITE_${key}`]);
    }
    return defaultValue;
  }

  private static maskSecret(val: string): string {
    if (!val) return "[NÃO DEFINIDO]";
    if (val.length <= 8) return "••••••••";
    return val.substring(0, 3) + "••••••••" + val.substring(val.length - 3);
  }

  /**
   * Executa a auditoria completa de variáveis e conformidade de ambiente.
   */
  public static validate(throwOnProductionFailure: boolean = false): EnvironmentValidationReport {
    const nodeEnv = this.getEnv("NODE_ENV", "development").toLowerCase();
    const kmSignatureMode = (this.getEnv("KM_SIGNATURE_MODE", "SIMULATED")).toUpperCase() as "SIMULATED" | "PRODUCTION";
    const bnaMode = (this.getEnv("BNA_SPTR_MODE", "SIMULATED")).toUpperCase() as "SIMULATED" | "PRODUCTION";
    const isProduction = nodeEnv === "production" || kmSignatureMode === "PRODUCTION" || bnaMode === "PRODUCTION";

    const kmPrivKeyRef = this.getEnv("KM_PRIV_KEY_REF", "simulated://kmos-dev/keys/receipt-signer-v1");
    const bnaSptrEndpoint = this.getEnv("BNA_SPTR_ENDPOINT", "https://sandbox.sptr.local");
    const hsmSerialNumber = this.getEnv("HSM_SERIAL_NUMBER", "DEV-HSM-001");
    const defaultPassword = this.getEnv("KMOS_DEFAULT_PASSWORD", "DeusFundador123!");
    const firebaseProjectId = this.getEnv("FIREBASE_PROJECT_ID", "kwanza-movel-ai-sandbox");

    const blockingErrors: string[] = [];
    const warnings: string[] = [];
    const items: ValidationItemResult[] = [];

    // 1. Validar KM_SIGNATURE_MODE & KM_PRIV_KEY_REF
    const isDevKeyRef = kmPrivKeyRef.startsWith("simulated://") || kmPrivKeyRef.includes("dev") || kmPrivKeyRef.includes("test");
    if (isProduction && isDevKeyRef) {
      blockingErrors.push(`[SEGURANÇA] KM_PRIV_KEY_REF contém identificador de desenvolvimento ('${kmPrivKeyRef}') em modo de PRODUÇÃO.`);
    }
    items.push({
      variable: "KM_PRIV_KEY_REF",
      category: "SECURITY",
      configuredValue: kmPrivKeyRef,
      maskedValue: kmPrivKeyRef,
      isSimulatedOrDev: isDevKeyRef,
      isValidForCurrentMode: !isProduction || !isDevKeyRef,
      notes: isDevKeyRef ? "Referência de chave simulada/desenvolvimento" : "URI canônica KMS/HSM de produção"
    });

    // 2. Validar BNA_SPTR_MODE & BNA_SPTR_ENDPOINT
    const isFictitiousEndpoint = bnaSptrEndpoint.includes(".local") || bnaSptrEndpoint.includes("localhost") || bnaSptrEndpoint.includes("127.0.0.1") || bnaSptrEndpoint.includes("sandbox");
    if (isProduction && bnaMode === "PRODUCTION" && isFictitiousEndpoint) {
      blockingErrors.push(`[REGULATÓRIO] BNA_SPTR_ENDPOINT aponta para endpoint fictício ou local ('${bnaSptrEndpoint}') em modo de PRODUÇÃO.`);
    }
    if (bnaMode === "SIMULATED") {
      warnings.push(`[REGULATÓRIO] BNA_SPTR_MODE está em 'SIMULATED'. Liquidações operam em modo de contingência controlada.`);
    }
    items.push({
      variable: "BNA_SPTR_ENDPOINT",
      category: "REGULATORY",
      configuredValue: bnaSptrEndpoint,
      maskedValue: bnaSptrEndpoint,
      isSimulatedOrDev: isFictitiousEndpoint,
      isValidForCurrentMode: !isProduction || !isFictitiousEndpoint,
      notes: isFictitiousEndpoint ? "Endpoint de simulação/sandbox local" : "Endpoint institucional regulatório BNA"
    });

    // 3. Validar HSM_SERIAL_NUMBER
    const isDevHsm = hsmSerialNumber.startsWith("DEV-") || hsmSerialNumber.includes("SIMULATED");
    if (isProduction && isDevHsm) {
      blockingErrors.push(`[SEGURANÇA] HSM_SERIAL_NUMBER contém prefixo 'DEV-' ('${hsmSerialNumber}') em modo de PRODUÇÃO.`);
    }
    items.push({
      variable: "HSM_SERIAL_NUMBER",
      category: "SECURITY",
      configuredValue: hsmSerialNumber,
      maskedValue: hsmSerialNumber,
      isSimulatedOrDev: isDevHsm,
      isValidForCurrentMode: !isProduction || !isDevHsm,
      notes: isDevHsm ? "Identificador de HSM emulado para desenvolvimento" : "Serial do appliance físico HSM certificado"
    });

    // 4. Validar Palavra-Passe Padrão de RBAC
    const isDefaultDevPass = defaultPassword === "DeusFundador123!" || defaultPassword.includes("123");
    if (isProduction && isDefaultDevPass) {
      blockingErrors.push(`[RBAC] KMOS_DEFAULT_PASSWORD está a utilizar a credencial padrão fraca ('DeusFundador123!') em PRODUÇÃO.`);
    }
    items.push({
      variable: "KMOS_DEFAULT_PASSWORD",
      category: "RBAC",
      configuredValue: "[OCULTO]",
      maskedValue: this.maskSecret(defaultPassword),
      isSimulatedOrDev: isDefaultDevPass,
      isValidForCurrentMode: !isProduction || !isDefaultDevPass,
      notes: isDefaultDevPass ? "Senha padrão de laboratório (Não permitida em PROD)" : "Hash/Segredo forte de produção"
    });

    // 5. Validar Projeto Firebase / Firestore
    const isSandboxFirebase = firebaseProjectId.includes("sandbox") || firebaseProjectId.includes("demo");
    if (isProduction && isSandboxFirebase) {
      warnings.push(`[PERSISTÊNCIA] FIREBASE_PROJECT_ID aponta para ambiente de sandbox ('${firebaseProjectId}').`);
    }
    items.push({
      variable: "FIREBASE_PROJECT_ID",
      category: "PERSISTENCE",
      configuredValue: firebaseProjectId,
      maskedValue: firebaseProjectId,
      isSimulatedOrDev: isSandboxFirebase,
      isValidForCurrentMode: true,
      notes: isSandboxFirebase ? "Projeto sandbox/teste" : "Projeto Cloud Firestore de produção"
    });

    const report: EnvironmentValidationReport = {
      isProduction,
      signatureMode: kmSignatureMode,
      bnaMode,
      allValid: blockingErrors.length === 0,
      blockingErrors,
      warnings,
      validatedAt: new Date().toISOString(),
      items
    };

    EnvironmentConfigValidator.cachedReport = report;

    if (throwOnProductionFailure && !report.allValid && isProduction) {
      const errorMsg = `[KMOS BOOTSTRAP FATAL] Falha de validação de ambiente de produção:\n${blockingErrors.join("\n")}`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    return report;
  }

  public static getCachedReport(): EnvironmentValidationReport {
    if (!EnvironmentConfigValidator.cachedReport) {
      return EnvironmentConfigValidator.validate(false);
    }
    return EnvironmentConfigValidator.cachedReport;
  }
}
