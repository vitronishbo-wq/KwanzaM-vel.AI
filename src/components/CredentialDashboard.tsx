/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole =
  | "ADMIN"
  | "AUDITOR"
  | "USER"
  | "COMPLIANCE"
  | "ENGINEER";

export interface UserCredentialProfile {
  id: string;
  role: UserRole;
  username: string;
  email: string;
  phone: string;
  fullName: string;
  permissions: string[];
  token?: string;
  createdAt: string;
}

export type AnyUserProfile = UserCredentialProfile;

export interface AuthTokenSession {
  token: string;
  profile: UserCredentialProfile;
  expiresAt: number;
  issuedAt: number;
}

export interface AuthValidationResult {
  isValid: boolean;
  profile?: UserCredentialProfile;
  token?: string;
  errorMessage?: string;
}

export interface E2ETestSuiteResult {
  success: boolean;
  total: number;
  passed: number;
  failed: number;
  results: Array<{
    role: UserRole;
    success: boolean;
    message?: string;
  }>;
}

/**
 * CredentialManager
 *
 * Fachada de compatibilidade da autenticação KMOS.
 *
 * Credenciais e segredos são obtidos exclusivamente do ambiente.
 * Nenhum segredo real é persistido neste módulo.
 */
export class CredentialManager {
  private readonly activeSessions = new Map<string, AuthTokenSession>();

  private getEnv(name: string): string | undefined {
    const runtimeEnv =
      typeof process !== "undefined" && process.env
        ? process.env
        : undefined;

    const runtimeValue = runtimeEnv?.[name];

    if (runtimeValue !== undefined && runtimeValue !== "") {
      return runtimeValue;
    }

    const viteEnv =
      typeof import.meta !== "undefined"
        ? (import.meta as ImportMeta & {
            env?: Record<string, string | undefined>;
          }).env
        : undefined;

    const viteValue = viteEnv?.[name];

    if (viteValue !== undefined && viteValue !== "") {
      return viteValue;
    }

    return undefined;
  }

  public getDefaultPassword(): string {
    return (
      this.getEnv("KMOS_DEFAULT_PASSWORD") ??
      this.getEnv("VITE_KMOS_DEFAULT_PASSWORD") ??
      ""
    );
  }

  private getBaseEmail(): string {
    return (
      this.getEnv("KMOS_DEUS_FUNDADOR_EMAIL") ??
      this.getEnv("VITE_KMOS_DEUS_FUNDADOR_EMAIL") ??
      ""
    );
  }

  private getBasePhone(): string {
    return (
      this.getEnv("KMOS_DEUS_FUNDADOR_PHONE") ??
      this.getEnv("VITE_KMOS_DEUS_FUNDADOR_PHONE") ??
      ""
    );
  }

  private getBaseName(): string {
    return (
      this.getEnv("KMOS_DEUS_FUNDADOR_NAME") ??
      this.getEnv("VITE_KMOS_DEUS_FUNDADOR_NAME") ??
      ""
    );
  }

  public getDeusFundadorConfig(): {
    email: string;
    phone: string;
    fullName: string;
  } {
    return {
      email: this.getBaseEmail(),
      phone: this.getBasePhone(),
      fullName: this.getBaseName(),
    };
  }

  public getProfileCredentials(role: UserRole): UserCredentialProfile {
    const baseEmail = this.getBaseEmail();
    const basePhone = this.getBasePhone();
    const baseName = this.getBaseName();

    switch (role) {
      case "ADMIN":
        return {
          id: "USR-KMOS-ADMIN-001",
          role,
          username: "deusfundador",
          email: baseEmail,
          phone: basePhone,
          fullName: `${baseName} (Deus Fundador / SuperAdmin)`,
          permissions: [
            "ALL_SYSTEM_ACCESS",
            "LEDGER_OVERRIDE",
            "HSM_KEY_ROTATE",
            "CONSTITUTION_MODIFY",
            "USER_MANAGE",
          ],
          createdAt: "2026-01-01T00:00:00.000Z",
        };

      case "AUDITOR":
        return {
          id: "USR-KMOS-AUDIT-002",
          role,
          username: "bna_auditor",
          email: "auditoria.bna@kwanza-movel.ao",
          phone: "+244 923000000",
          fullName: "Inspector Geral BNA (Regulador)",
          permissions: [
            "READ_ALL_LEDGERS",
            "INSPECT_EVIDENCE_VAULT",
            "READ_COMPLIANCE_REPORTS",
            "EXPORT_AUDIT_LOGS",
          ],
          createdAt: "2026-01-01T00:00:00.000Z",
        };

      case "COMPLIANCE":
        return {
          id: "USR-KMOS-COMPL-003",
          role,
          username: "compliance_officer",
          email: "compliance@kwanza-movel.ao",
          phone: "+244 923111222",
          fullName: "Oficial de Compliance AML/CFT",
          permissions: [
            "READ_COMPLIANCE_REPORTS",
            "BLOCK_SUSPICIOUS_ACCOUNTS",
            "VIEW_AML_TELEMETRY",
          ],
          createdAt: "2026-01-01T00:00:00.000Z",
        };

      case "ENGINEER":
        return {
          id: "USR-KMOS-ENG-004",
          role,
          username: "site_reliability_engineer",
          email: "sre@kwanza-movel.ao",
          phone: "+244 923333444",
          fullName: "Engenheiro SRE / DevOps",
          permissions: [
            "READ_RAW_TELEMETRY",
            "EXECUTE_TEST_SUITE",
            "INSPECT_HEALTH_READINESS",
          ],
          createdAt: "2026-01-01T00:00:00.000Z",
        };

      case "USER":
      default:
        return {
          id: "USR-KMOS-CLIENT-005",
          role: "USER",
          username: "marcelo_truman",
          email: baseEmail,
          phone: basePhone,
          fullName: baseName,
          permissions: [
            "EXECUTE_PAYMENT",
            "VIEW_OWN_WALLET",
            "GENERATE_RECEIPT",
            "RECOVER_ACCOUNT",
          ],
          createdAt: "2026-01-01T00:00:00.000Z",
        };
    }
  }

  public validateCredentials(
    role: UserRole,
    providedPasswordSecret: string,
  ): AuthValidationResult {
    try {
      const session = this.authenticate(role, providedPasswordSecret);

      return {
        isValid: true,
        profile: session.profile,
        token: session.token,
      };
    } catch (error: unknown) {
      return {
        isValid: false,
        errorMessage:
          error instanceof Error
            ? error.message
            : "Falha na validação de credenciais.",
      };
    }
  }

  public authenticate(
    role: UserRole,
    providedPasswordSecret: string,
  ): AuthTokenSession {
    const expectedPassword = this.getDefaultPassword();

    if (!expectedPassword) {
      throw new Error(
        "[CredentialManager] Credencial administrativa não configurada.",
      );
    }

    if (!providedPasswordSecret) {
      throw new Error(
        "[CredentialManager] Credencial fornecida é obrigatória.",
      );
    }

    if (providedPasswordSecret !== expectedPassword) {
      throw new Error(
        "[CredentialManager] Autenticação falhou: Credenciais inválidas.",
      );
    }

    const profile = this.getProfileCredentials(role);
    const issuedAt = Date.now();
    const expiresAt = issuedAt + 8 * 60 * 60 * 1000;
    const token = this.generateToken(profile.id, role, issuedAt);

    const session: AuthTokenSession = {
      token,
      profile: {
        ...profile,
        token,
      },
      issuedAt,
      expiresAt,
    };

    this.activeSessions.set(token, session);

    return session;
  }

  public validateToken(token: string): AuthTokenSession {
    if (!token) {
      throw new Error(
        "[CredentialManager] Token de sessão inexistente ou expirado.",
      );
    }

    const session = this.activeSessions.get(token);

    if (!session) {
      throw new Error(
        "[CredentialManager] Token de sessão inexistente ou expirado.",
      );
    }

    if (Date.now() >= session.expiresAt) {
      this.activeSessions.delete(token);

      throw new Error("[CredentialManager] Token de sessão expirado.");
    }

    return session;
  }

  public revokeSession(token: string): boolean {
    if (!token) {
      return false;
    }

    return this.activeSessions.delete(token);
  }

  public validateAllProfilesForE2E(
    password: string = this.getDefaultPassword(),
  ): E2ETestSuiteResult {
    const roles: UserRole[] = [
      "ADMIN",
      "AUDITOR",
      "USER",
      "COMPLIANCE",
      "ENGINEER",
    ];

    const results = roles.map((role) => {
      try {
        const result = this.validateCredentials(role, password);

        return {
          role,
          success: result.isValid,
          message: result.errorMessage,
        };
      } catch (error: unknown) {
        return {
          role,
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Falha desconhecida.",
        };
      }
    });

    const passed = results.filter((result) => result.success).length;

    return {
      success: passed === results.length,
      total: results.length,
      passed,
      failed: results.length - passed,
      results,
    };
  }

  private generateToken(
    userId: string,
    role: UserRole,
    timestamp: number,
  ): string {
    const secret = this.getEnv("KMOS_KMS_SECRET_KEY") ?? "";

    if (!secret) {
      throw new Error(
        "[CredentialManager] Segredo de assinatura não configurado.",
      );
    }

    const rawPayload = `${userId}:${role}:${timestamp}:${secret}`;

    const bytes = new TextEncoder().encode(rawPayload);

    let binary = "";
    for (const byte of bytes) {
      binary += String.fromCharCode(byte);
    }

    if (typeof btoa === "function") {
      return `kmos_tok_${btoa(binary)}`;
    }

    return `kmos_tok_${Buffer.from(rawPayload, "utf8").toString("base64")}`;
  }
}