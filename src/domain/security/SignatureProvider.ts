/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SignatureMode = "SIMULATED" | "PRODUCTION";

export interface SignatureProviderMetadata {
  providerName: string;
  mode: SignatureMode;
  keyReference: string;
  algorithm: string;
  hsmSlot?: string;
  serialNumber?: string;
  isSimulated: boolean;
  status: "ACTIVE" | "INITIALIZING" | "DEGRADED" | "STANDBY";
}

/**
 * SignatureProvider Interface (Port de Domínio)
 * 
 * Contrato abstrato de arquitetura hexagonal para operações criptográficas de integridade,
 * assinaturas institucionais e validação soberana regulatória (SGP-BNA).
 * 
 * Desacopla o domínio de dependências diretas de HSM físico ou KMS de nuvem específica.
 * Garante que a aplicação manipule apenas referências de chave (KM_PRIV_KEY_REF / URI de KMS)
 * e nunca chaves privadas brutas em memória.
 */
export interface SignatureProvider {
  /**
   * Modo de execução formal do provedor criptográfico.
   */
  readonly providerMode: SignatureMode;

  /**
   * Referência/URI da chave gerenciada pelo KMS/HSM (ex: 'projects/kmos/keys/receipt-signer').
   * Separa o identificador opaco da chave privada real residente no hardware seguro.
   */
  readonly keyReference: string;

  /**
   * Gera um hash criptográfico determinístico (SHA-256 ou superior) para o payload.
   */
  generateHash(payload: any): string;

  /**
   * Executa a assinatura institucional utilizando a referência de chave privada configurada.
   */
  signDigitally(hash: string): string;

  /**
   * Executa a assinatura soberana / regulatória do Banco Nacional de Angola (SGP-BNA).
   */
  signSovereign(hash: string): string;

  /**
   * Alias de compatibilidade para assinaturas de hardware HSM legadas.
   */
  signHsm(hash: string): string;

  /**
   * Retorna os metadados de telemetria e integridade do provedor ativo.
   */
  getMetadata(): SignatureProviderMetadata;
}
