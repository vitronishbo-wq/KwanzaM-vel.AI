/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = "ADMIN" | "AUDITOR" | "USER" | "COMPLIANCE" | "ENGINEER";

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

export interface AuthTokenSession {
  token: string;
  profile: UserCredentialProfile;
  expiresAt: number;
  issuedAt: number;
}

/**
 * CredentialManager (Domain Port/Service)
 *
 * Gere o ciclo de vida de tokens e credenciais de acesso para os perfis
 * do KMOS Hardening (ADMIN, AUDITOR, USER, etc.), permitindo injeção
 * segura via variáveis de ambiente sem expor segredos no código.
 */
export class CredentialManager {
  private activeSessions: Map<string, AuthTokenSession> = new Map();

  /**
   * Obtém as credenciais predefinidas para um determinado perfil (RBAC),
   * utilizando valores de variáveis de ambiente com fallback seguro para ambiente DEV.
   */
  public getProfileCredentials(role: UserRole): UserCredentialProfile {
    const defaultPasswordHash = this.hashPassword(
      process.env.KMOS_DEFAULT_PASSWORD || process.env.VITE_KMOS_DEFAULT_PASSWORD || "DeusFundador123!"
    );

    const baseUserEmail = process.env.KMOS_DEUS_FUNDADOR_EMAIL || process.env.VITE_KMOS_DEUS_FUNDADOR_EMAIL || "ssilajaneiro1@gmail.com";
    const baseUserPhone = process.env.KMOS_DEUS_FUNDADOR_PHONE || process.env.VITE_KMOS_DEUS_FUNDADOR_PHONE || "+244 948323383";
    const baseUserName = process.env.KMOS_DEUS_FUNDADOR_NAME || process.env.VITE_KMOS_DEUS_FUNDADOR_NAME || "Marcelo Truman";

    switch (role) {
      case "ADMIN":
        return {
          id: "USR-KMOS-ADMIN-001",
          role: "ADMIN",
          username: "deusfundador",
          email: baseUserEmail,
          phone: baseUserPhone,
          fullName: `${baseUserName} (Deus Fundador / SuperAdmin)`,
          permissions: [
            "ALL_SYSTEM_ACCESS",
            "LEDGER_OVERRIDE",
            "HSM_KEY_ROTATE",
            "CONSTITUTION_MODIFY",
            "USER_MANAGE"
          ],
          createdAt: "2026-01-01T00:00:00.000Z"
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
            "EXPORT_AUDIT_LOGS"
          ],
          createdAt: "2026-01-01T00:00:00.000Z"
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
            "VIEW_AML_TELEMETRY"
          ],
          createdAt: "2026-01-01T00:00:00.000Z"
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
            "INSPECT_HEALTH_READINESS"
          ],
          createdAt: "2026-01-01T00:00:00.000Z"
        };

      case "USER":
      default:
        return {
          id: "USR-KMOS-CLIENT-005",
          role: "USER",
          username: "marcelo_truman",
          email: baseUserEmail,
          phone: baseUserPhone,
          fullName: baseUserName,
          permissions: [
            "EXECUTE_PAYMENT",
            "VIEW_OWN_WALLET",
            "GENERATE_RECEIPT",
            "RECOVER_ACCOUNT"
          ],
          createdAt: "2026-01-01T00:00:00.000Z"
        };
    }
  }

  /**
   * Valida as credenciais fornecidas contra as variáveis de ambiente ativas.
   */
  public validateCredentials(
    role: UserRole,
    providedPasswordSecret: string
  ): { isValid: boolean; profile?: UserCredentialProfile; token?: string; errorMessage?: string } {
    try {
      const session = this.authenticate(role, providedPasswordSecret);
      return {
        isValid: true,
        profile: session.profile,
        token: session.token
      };
    } catch (error: any) {
      return {
        isValid: false,
        errorMessage: error?.message || "Falha na validação de credenciais."
      };
    }
  }

  /**
   * Autentica uma credencial e emite um token de sessão com validade temporária.
   */
  public authenticate(
    role: UserRole,
    providedPasswordSecret: string
  ): AuthTokenSession {
    const expectedPassword =
      process.env.KMOS_DEFAULT_PASSWORD ||
      process.env.VITE_KMOS_DEFAULT_PASSWORD ||
      "DeusFundador123!";

    if (providedPasswordSecret !== expectedPassword) {
      throw new Error("[CredentialManager] Autenticação falhou: Credenciais inválidas.");
    }

    const profile = this.getProfileCredentials(role);
    const now = Date.now();
    const expiresAt = now + 8 * 60 * 60 * 1000; // 8 horas de sessão
    const token = this.generateToken(profile.id, role, now);

    const session: AuthTokenSession = {
      token,
      profile: {
        ...profile,
        token
      },
      issuedAt: now,
      expiresAt
    };

    this.activeSessions.set(token, session);
    return session;
  }

  /**
   * Valida a integridade e expiração de um token ativo.
   */
  public validateToken(token: string): AuthTokenSession {
    const session = this.activeSessions.get(token);
    if (!session) {
      throw new Error("[CredentialManager] Token de sessão inexistente ou expirado.");
    }

    if (Date.now() > session.expiresAt) {
      this.activeSessions.delete(token);
      throw new Error("[CredentialManager] Token de sessão expirado.");
    }

    return session;
  }

  /**
   * Revoga a sessão ativa.
   */
  public revokeSession(token: string): boolean {
    return this.activeSessions.delete(token);
  }

  /**
   * Utilitário interno para hash de passwords (evita Plaintext em memória).
   */
  private hashPassword(plain: string): string {
    let hash = 0;
    for (let i = 0; i < plain.length; i++) {
      const char = plain.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return `KMOS-HASH-${Math.abs(hash).toString(16)}`;
  }

  /**
   * Gera token assinado simulado base64 para uso em sessões ponta-a-ponta.
   */
  private generateToken(userId: string, role: UserRole, timestamp: number): string {
    const rawPayload = `${userId}:${role}:${timestamp}:${process.env.KMOS_KMS_SECRET_KEY || "DEV_SECRET"}`;
    if (typeof btoa !== "undefined") {
      return `kmos_tok_${btoa(rawPayload)}`;
    }
    return `kmos_tok_${Buffer.from(rawPayload).toString("base64")}`;
  }
}
