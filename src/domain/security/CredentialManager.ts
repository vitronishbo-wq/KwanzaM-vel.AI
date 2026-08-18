/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * KwanzaMóvel / KMOS
 * CredentialManager — Domain Authentication Service
 *
 * PRINCÍPIOS:
 * - Zero credenciais administrativas hardcoded.
 * - Zero segredos VITE_* utilizados para autenticação backend.
 * - Zero dependência obrigatória de process.env dentro do domínio.
 * - RBAC explícito.
 * - Sessões com expiração.
 * - Tokens aleatórios e opacos.
 * - Secret material nunca é colocado dentro do token.
 * - Falha segura quando a configuração obrigatória não existe.
 * - Sem alteração do Ledger, TransactionManager ou ConstitutionEngine.
 */

export type UserRole =
  | "ADMIN"
  | "AUDITOR"
  | "USER"
  | "COMPLIANCE"
  | "ENGINEER";

export interface UserCredentialProfile {
  readonly id: string;
  readonly role: UserRole;
  readonly username: string;
  readonly email: string;
  readonly phone: string;
  readonly fullName: string;
  readonly permissions: readonly string[];
  readonly createdAt: string;
}

export interface AuthTokenSession {
  readonly token: string;
  readonly profile: UserCredentialProfile;
  readonly issuedAt: number;
  readonly expiresAt: number;
}

export interface CredentialConfiguration {
  /**
   * Credencial de autenticação administrativa.
   *
   * Deve ser fornecida pelo runtime seguro.
   * Nunca utilizar VITE_* como fallback.
   */
  readonly defaultPassword: string;

  readonly superAdminEmail: string;
  readonly superAdminPhone: string;
  readonly superAdminName: string;

  /**
   * Secret utilizado exclusivamente para infraestrutura
   * de geração/assinatura quando aplicável.
   *
   * Nunca é incorporado no payload do token.
   */
  readonly tokenSecret: string;

  /**
   * Tempo de vida da sessão.
   */
  readonly sessionTtlMs?: number;
}

export interface CredentialManagerOptions {
  readonly now?: () => number;
  readonly randomBytes?: (size: number) => Uint8Array;
}

export interface AuthValidationResult {
  readonly isValid: boolean;
  readonly profile?: UserCredentialProfile;
  readonly token?: string;
  readonly errorMessage?: string;
}

export interface E2ETestSuiteResult {
  readonly success: boolean;
  readonly total: number;
  readonly passed: number;
  readonly failed: number;
  readonly results: Array<{
    readonly role: UserRole;
    readonly success: boolean;
    readonly message?: string;
  }>;
}

const DEFAULT_SESSION_TTL_MS = 8 * 60 * 60 * 1000;

const ADMIN_PERMISSIONS = [
  "ALL_SYSTEM_ACCESS",
  "LEDGER_OVERRIDE",
  "HSM_KEY_ROTATE",
  "CONSTITUTION_MODIFY",
  "USER_MANAGE",
] as const;

const AUDITOR_PERMISSIONS = [
  "READ_ALL_LEDGERS",
  "INSPECT_EVIDENCE_VAULT",
  "READ_COMPLIANCE_REPORTS",
  "EXPORT_AUDIT_LOGS",
] as const;

const COMPLIANCE_PERMISSIONS = [
  "READ_COMPLIANCE_REPORTS",
  "BLOCK_SUSPICIOUS_ACCOUNTS",
  "VIEW_AML_TELEMETRY",
] as const;

const ENGINEER_PERMISSIONS = [
  "READ_RAW_TELEMETRY",
  "EXECUTE_TEST_SUITE",
  "INSPECT_HEALTH_READINESS",
] as const;

const USER_PERMISSIONS = [
  "EXECUTE_PAYMENT",
  "VIEW_OWN_WALLET",
  "GENERATE_RECEIPT",
  "RECOVER_ACCOUNT",
] as const;

/**
 * CredentialManager
 *
 * Serviço puro de domínio para autenticação e autorização.
 *
 * O domínio:
 * - não lê process.env;
 * - não lê import.meta.env;
 * - não conhece Render, Firebase ou Vite;
 * - não contém credenciais hardcoded;
 * - recebe toda a configuração externa por injeção.
 */
export class CredentialManager {
  private readonly activeSessions = new Map<
    string,
    AuthTokenSession
  >();

  private readonly now: () => number;
  private readonly randomBytes: (size: number) => Uint8Array;

  private readonly defaultPassword: string;
  private readonly superAdminEmail: string;
  private readonly superAdminPhone: string;
  private readonly superAdminName: string;
  private readonly tokenSecret: string;
  private readonly sessionTtlMs: number;

  constructor(
    configuration: CredentialConfiguration,
    options: CredentialManagerOptions = {},
  ) {
    this.assertConfiguration(configuration);

    this.defaultPassword = configuration.defaultPassword;
    this.superAdminEmail = configuration.superAdminEmail;
    this.superAdminPhone = configuration.superAdminPhone;
    this.superAdminName = configuration.superAdminName;
    this.tokenSecret = configuration.tokenSecret;

    this.sessionTtlMs =
      configuration.sessionTtlMs ?? DEFAULT_SESSION_TTL_MS;

    this.now = options.now ?? (() => Date.now());

    this.randomBytes =
      options.randomBytes ??
      ((size: number) => {
        if (
          typeof globalThis.crypto !== "undefined" &&
          typeof globalThis.crypto.getRandomValues === "function"
        ) {
          return globalThis.crypto.getRandomValues(
            new Uint8Array(size),
          );
        }

        throw new Error(
          "[CredentialManager] Secure random generator indisponível.",
        );
      });
  }

  /**
   * Retorna o perfil correspondente ao papel RBAC.
   *
   * Nenhuma password ou token é colocado no perfil.
   */
  public getProfileCredentials(
    role: UserRole,
  ): UserCredentialProfile {
    switch (role) {
      case "ADMIN":
        return {
          id: "USR-KMOS-ADMIN-001",
          role: "ADMIN",
          username: "deusfundador",
          email: this.superAdminEmail,
          phone: this.superAdminPhone,
          fullName: `${this.superAdminName} (Deus Fundador / SuperAdmin)`,
          permissions: ADMIN_PERMISSIONS,
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
          permissions: AUDITOR_PERMISSIONS,
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
          permissions: COMPLIANCE_PERMISSIONS,
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
          permissions: ENGINEER_PERMISSIONS,
          createdAt: "2026-01-01T00:00:00.000Z",
        };

      case "USER":
        return {
          id: "USR-KMOS-CLIENT-005",
          role: "USER",
          username: "cliente",
          email: this.superAdminEmail,
          phone: this.superAdminPhone,
          fullName: this.superAdminName,
          permissions: USER_PERMISSIONS,
          createdAt: "2026-01-01T00:00:00.000Z",
        };

      default: {
        const exhaustiveCheck: never = role;

        throw new Error(
          `[CredentialManager] Papel RBAC inválido: ${String(
            exhaustiveCheck,
          )}`,
        );
      }
    }
  }

  /**
   * Valida uma credencial e devolve uma sessão.
   */
  public validateCredentials(
    role: UserRole,
    providedPasswordSecret: string,
  ): AuthValidationResult {
    try {
      const session = this.authenticate(
        role,
        providedPasswordSecret,
      );

      return {
        isValid: true,
        profile: session.profile,
        token: session.token,
      };
    } catch {
      return {
        isValid: false,
        errorMessage:
          "[CredentialManager] Falha na autenticação.",
      };
    }
  }

  /**
   * Autenticação.
   *
   * Não existe fallback de desenvolvimento.
   */
  public authenticate(
    role: UserRole,
    providedPasswordSecret: string,
  ): AuthTokenSession {
    if (!providedPasswordSecret) {
      throw new Error(
        "[CredentialManager] Credencial obrigatória.",
      );
    }

    if (
      !this.constantTimeEqual(
        providedPasswordSecret,
        this.defaultPassword,
      )
    ) {
      throw new Error(
        "[CredentialManager] Credenciais inválidas.",
      );
    }

    const profile = this.getProfileCredentials(role);
    const issuedAt = this.now();
    const expiresAt = issuedAt + this.sessionTtlMs;
    const token = this.generateToken();

    const session: AuthTokenSession = {
      token,
      profile,
      issuedAt,
      expiresAt,
    };

    this.activeSessions.set(token, session);

    return session;
  }

  /**
   * Valida uma sessão existente.
   */
  public validateToken(
    token: string,
  ): AuthTokenSession {
    if (!token) {
      throw new Error(
        "[CredentialManager] Token obrigatório.",
      );
    }

    const session = this.activeSessions.get(token);

    if (!session) {
      throw new Error(
        "[CredentialManager] Sessão inexistente.",
      );
    }

    if (this.now() >= session.expiresAt) {
      this.activeSessions.delete(token);

      throw new Error(
        "[CredentialManager] Sessão expirada.",
      );
    }

    return session;
  }

  /**
   * Revoga uma sessão específica.
   */
  public revokeSession(token: string): boolean {
    return this.activeSessions.delete(token);
  }

  /**
   * Revoga todas as sessões ativas.
   */
  public revokeAllSessions(): void {
    this.activeSessions.clear();
  }

  /**
   * Número de sessões ativas.
   */
  public getActiveSessionCount(): number {
    return this.activeSessions.size;
  }

  /**
   * Executa validação E2E de todos os papéis RBAC.
   */
  public validateAllProfilesForE2E(
    password: string = this.defaultPassword,
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
        const result = this.validateCredentials(
          role,
          password,
        );

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

    const passed = results.filter(
      (result) => result.success,
    ).length;

    return {
      success: passed === results.length,
      total: results.length,
      passed,
      failed: results.length - passed,
      results,
    };
  }

  /**
   * Gera um token opaco e criptograficamente aleatório.
   *
   * O token não contém:
   * - password;
   * - tokenSecret;
   * - email;
   * - telefone;
   * - role;
   * - dados pessoais.
   */
  private generateToken(): string {
    const bytes = this.randomBytes(32);

    return `kmos_tok_${this.toBase64Url(bytes)}`;
  }

  /**
   * Comparação de strings em tempo constante.
   *
   * Não substitui um password hasher de produção,
   * mas evita uma comparação direta caractere a caractere.
   */
  private constantTimeEqual(
    provided: string,
    expected: string,
  ): boolean {
    const providedBytes =
      new TextEncoder().encode(provided);

    const expectedBytes =
      new TextEncoder().encode(expected);

    if (providedBytes.length !== expectedBytes.length) {
      return false;
    }

    let difference = 0;

    for (
      let index = 0;
      index < expectedBytes.length;
      index += 1
    ) {
      difference |=
        providedBytes[index] ^ expectedBytes[index];
    }

    return difference === 0;
  }

  /**
   * Base64URL sem dependência obrigatória de Node Buffer.
   */
  private toBase64Url(bytes: Uint8Array): string {
    let binary = "";

    for (const byte of bytes) {
      binary += String.fromCharCode(byte);
    }

    const base64 =
      typeof btoa === "function"
        ? btoa(binary)
        : this.nodeBase64(bytes);

    return base64
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
  }

  /**
   * Adapter mínimo para runtime Node.
   *
   * Não é utilizado para obter segredos.
   */
  private nodeBase64(bytes: Uint8Array): string {
    const nodeBuffer = (
      globalThis as typeof globalThis & {
        Buffer?: {
          from(input: Uint8Array): {
            toString(encoding: string): string;
          };
        };
      }
    ).Buffer;

    if (!nodeBuffer) {
      throw new Error(
        "[CredentialManager] Encoder Base64 indisponível.",
      );
    }

    return nodeBuffer
      .from(bytes)
      .toString("base64");
  }

  /**
   * Valida a configuração recebida por injeção.
   *
   * Nenhum fallback de credencial é permitido.
   */
  private assertConfiguration(
    configuration: CredentialConfiguration,
  ): void {
    if (!configuration) {
      throw new Error(
        "[CredentialManager] Configuração obrigatória ausente.",
      );
    }

    const required: Array<[string, string]> = [
      [
        "defaultPassword",
        configuration.defaultPassword,
      ],
      [
        "superAdminEmail",
        configuration.superAdminEmail,
      ],
      [
        "superAdminPhone",
        configuration.superAdminPhone,
      ],
      [
        "superAdminName",
        configuration.superAdminName,
      ],
      [
        "tokenSecret",
        configuration.tokenSecret,
      ],
    ];

    for (const [name, value] of required) {
      if (!value || !value.trim()) {
        throw new Error(
          `[CredentialManager] Configuração obrigatória ausente: ${name}.`,
        );
      }
    }

    if (configuration.defaultPassword.length < 12) {
      throw new Error(
        "[CredentialManager] Credencial administrativa demasiado fraca.",
      );
    }

    if (configuration.tokenSecret.length < 32) {
      throw new Error(
        "[CredentialManager] Token secret demasiado curto.",
      );
    }
  }
}