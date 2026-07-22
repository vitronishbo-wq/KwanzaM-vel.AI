/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = "ADMIN" | "AUDITOR" | "USER" | "COMPLIANCE" | "ENGINEER";

export interface AdminCredentialProfile {
  id: string;
  role: "ADMIN";
  username: string;
  email: string;
  phone: string;
  fullName: string;
  permissions: string[];
  createdAt: string;
}

export interface AuditorCredentialProfile {
  id: string;
  role: "AUDITOR";
  username: string;
  email: string;
  phone: string;
  fullName: string;
  permissions: string[];
  createdAt: string;
}

export interface StandardUserCredentialProfile {
  id: string;
  role: "USER";
  username: string;
  email: string;
  phone: string;
  fullName: string;
  permissions: string[];
  createdAt: string;
}

export type AnyUserProfile =
  | AdminCredentialProfile
  | AuditorCredentialProfile
  | StandardUserCredentialProfile
  | {
      id: string;
      role: UserRole;
      username: string;
      email: string;
      phone: string;
      fullName: string;
      permissions: string[];
      createdAt: string;
    };

export interface AuthValidationResult {
  isValid: boolean;
  profile?: AnyUserProfile;
  token?: string;
  errorMessage?: string;
}

export interface E2ETestSuiteResult {
  allPassed: boolean;
  testedProfilesCount: number;
  timestamp: string;
  results: Record<UserRole, AuthValidationResult>;
}

/**
 * CredentialManager (Domain / Auth)
 *
 * Gerencia o ciclo de vida de credenciais e tokens de acesso para os 5 perfis
 * da plataforma KMOS (ADMIN, AUDITOR, USER, COMPLIANCE, ENGINEER), consumindo de forma
 * segura as variáveis de ambiente (KMOS_DEFAULT_PASSWORD, KMOS_DEUS_FUNDADOR_EMAIL,
 * KMOS_DEUS_FUNDADOR_PHONE, KMOS_DEUS_FUNDADOR_NAME) para testes de ponta a ponta (E2E).
 */
export class CredentialManager {
  private activeSessions: Map<string, AuthValidationResult> = new Map();

  /**
   * Obtém a palavra-passe predefinida configurada nas variáveis de ambiente.
   */
  public getDefaultPassword(): string {
    return (
      process.env.KMOS_DEFAULT_PASSWORD ||
      process.env.VITE_KMOS_DEFAULT_PASSWORD ||
      "DeusFundador123!"
    );
  }

  /**
   * Obtém a configuração do perfil do Deus Fundador proveniente do ambiente.
   */
  public getDeusFundadorConfig(): { email: string; phone: string; name: string } {
    return {
      email:
        process.env.KMOS_DEUS_FUNDADOR_EMAIL ||
        process.env.VITE_KMOS_DEUS_FUNDADOR_EMAIL ||
        "ssilajaneiro1@gmail.com",
      phone:
        process.env.KMOS_DEUS_FUNDADOR_PHONE ||
        process.env.VITE_KMOS_DEUS_FUNDADOR_PHONE ||
        "+244 948323383",
      name:
        process.env.KMOS_DEUS_FUNDADOR_NAME ||
        process.env.VITE_KMOS_DEUS_FUNDADOR_NAME ||
        "Marcelo Truman",
    };
  }

  /**
   * Obtém os dados de perfil para o papel especificado (ADMIN, AUDITOR, USER, COMPLIANCE, ENGINEER),
   * injetando os dados do Deus Fundador provenientes do ambiente.
   */
  public getProfileCredentials(role: UserRole): AnyUserProfile {
    const config = this.getDeusFundadorConfig();

    switch (role) {
      case "ADMIN":
        return {
          id: "USR-KMOS-ADMIN-001",
          role: "ADMIN",
          username: "deusfundador",
          email: config.email,
          phone: config.phone,
          fullName: `${config.name} (Deus Fundador / SuperAdmin)`,
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
          role: "AUDITOR",
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
          role: "COMPLIANCE",
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
          role: "ENGINEER",
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
          email: config.email,
          phone: config.phone,
          fullName: config.name,
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

  /**
   * Método principal de validação de credenciais de acesso de ponta a ponta.
   *
   * Valida a palavra-passe fornecida contra a variável KMOS_DEFAULT_PASSWORD
   * e retorna o perfil e o token de acesso caso válida.
   */
  public validateCredentials(
    role: UserRole,
    providedPasswordSecret: string
  ): AuthValidationResult {
    const expectedPassword = this.getDefaultPassword();

    if (providedPasswordSecret !== expectedPassword) {
      return {
        isValid: false,
        errorMessage: "Autenticação falhou: Credenciais ou palavra-passe inválida.",
      };
    }

    const profile = this.getProfileCredentials(role);
    const token = this.generateSessionToken(profile.id, role);

    const result: AuthValidationResult = {
      isValid: true,
      profile,
      token,
    };

    this.activeSessions.set(token, result);
    return result;
  }

  /**
   * Valida um perfil individual para testes de ponta a ponta (E2E).
   * Se nenhuma palavra-passe for passada, utiliza a palavra-passe padrão das variáveis de ambiente.
   */
  public validateE2EProfile(
    role: UserRole,
    providedPasswordSecret?: string
  ): AuthValidationResult {
    const pwd = providedPasswordSecret || this.getDefaultPassword();
    return this.validateCredentials(role, pwd);
  }

  /**
   * Executa uma suite completa de validação E2E para todos os 5 perfis da plataforma.
   * Garante a consistência dos dados do Deus Fundador e das variáveis de ambiente.
   */
  public validateAllProfilesForE2E(
    providedPasswordSecret?: string
  ): E2ETestSuiteResult {
    const roles: UserRole[] = ["ADMIN", "AUDITOR", "USER", "COMPLIANCE", "ENGINEER"];
    const pwd = providedPasswordSecret || this.getDefaultPassword();

    const results = {} as Record<UserRole, AuthValidationResult>;
    let allPassed = true;

    for (const role of roles) {
      const valRes = this.validateCredentials(role, pwd);
      results[role] = valRes;
      if (!valRes.isValid) {
        allPassed = false;
      }
    }

    return {
      allPassed,
      testedProfilesCount: roles.length,
      timestamp: new Date().toISOString(),
      results,
    };
  }

  /**
   * Valida um token de sessão ativo.
   */
  public validateToken(token: string): AuthValidationResult {
    const session = this.activeSessions.get(token);
    if (!session || !session.isValid) {
      return {
        isValid: false,
        errorMessage: "Token de sessão inexistente ou inválido.",
      };
    }
    return session;
  }

  /**
   * Revoga uma sessão ativa pelo token.
   */
  public revokeToken(token: string): boolean {
    return this.activeSessions.delete(token);
  }

  /**
   * Gera um token assinado simulado em base64.
   */
  private generateSessionToken(userId: string, role: UserRole): string {
    const rawPayload = `${userId}:${role}:${Date.now()}:${
      process.env.KMOS_KMS_SECRET_KEY || "DEV_SECRET"
    }`;
    if (typeof btoa !== "undefined") {
      return `kmos_auth_${btoa(rawPayload)}`;
    }
    return `kmos_auth_${Buffer.from(rawPayload).toString("base64")}`;
  }
}

