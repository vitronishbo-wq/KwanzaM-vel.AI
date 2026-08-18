/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * KwanzaMóvel / KMOS
 * CredentialFactory — Infrastructure Adapter
 *
 * Única fronteira de infraestrutura responsável por mapear variáveis de ambiente
 * (process.env / import.meta.env) e instanciar o CredentialManager de domínio
 * através de injeção rigorosa de CredentialConfiguration.
 */

import {
  CredentialManager,
  CredentialConfiguration,
  UserRole,
  UserCredentialProfile,
  AuthTokenSession,
} from "../../../domain/security/CredentialManager";

export class CredentialFactory {
  private static singletonInstance: CredentialManager | null = null;

  /**
   * Extrai a configuração segura a partir do ambiente de execução (Node.js ou Vite).
   */
  public static createConfigurationFromEnv(): CredentialConfiguration {
    const metaEnv =
      typeof import.meta !== "undefined" && (import.meta as any).env
        ? (import.meta as any).env
        : {};
    const procEnv =
      typeof process !== "undefined" && process.env ? process.env : {};

    const defaultPassword =
      procEnv.KMOS_DEFAULT_PASSWORD ||
      metaEnv.VITE_KMOS_DEFAULT_PASSWORD ||
      "DeusFundador123!";

    const superAdminEmail =
      procEnv.KMOS_DEUS_FUNDADOR_EMAIL ||
      metaEnv.VITE_KMOS_DEUS_FUNDADOR_EMAIL ||
      "ssilajaneiro1@gmail.com";

    const superAdminPhone =
      procEnv.KMOS_DEUS_FUNDADOR_PHONE ||
      metaEnv.VITE_KMOS_DEUS_FUNDADOR_PHONE ||
      "+244 948323383";

    const superAdminName =
      procEnv.KMOS_DEUS_FUNDADOR_NAME ||
      metaEnv.VITE_KMOS_DEUS_FUNDADOR_NAME ||
      "Marcelo Truman";

    const tokenSecret =
      procEnv.KMOS_KMS_SECRET_KEY ||
      procEnv.HSM_KMS_SECRET_KEY ||
      "KMOS_CANONICAL_TOKEN_SECRET_KEY_2026_PRODUCTION_HARDENING";

    return {
      defaultPassword,
      superAdminEmail,
      superAdminPhone,
      superAdminName,
      tokenSecret,
    };
  }

  /**
   * Fornece a instância singleton do CredentialManager devidamente injetada.
   */
  public static getInstance(
    customConfig?: Partial<CredentialConfiguration>
  ): CredentialManager {
    if (!this.singletonInstance || customConfig) {
      const baseConfig = this.createConfigurationFromEnv();
      const finalConfig: CredentialConfiguration = {
        defaultPassword: customConfig?.defaultPassword || baseConfig.defaultPassword,
        superAdminEmail: customConfig?.superAdminEmail || baseConfig.superAdminEmail,
        superAdminPhone: customConfig?.superAdminPhone || baseConfig.superAdminPhone,
        superAdminName: customConfig?.superAdminName || baseConfig.superAdminName,
        tokenSecret: customConfig?.tokenSecret || baseConfig.tokenSecret,
        sessionTtlMs: customConfig?.sessionTtlMs ?? baseConfig.sessionTtlMs,
      };

      const instance = new CredentialManager(finalConfig);
      if (!customConfig) {
        this.singletonInstance = instance;
      }
      return instance;
    }

    return this.singletonInstance;
  }
}

export type { UserRole, UserCredentialProfile, AuthTokenSession, CredentialConfiguration };
