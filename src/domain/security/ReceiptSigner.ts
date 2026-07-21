/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * ReceiptSigner Interface (Port)
 * 
 * Define o contrato abstrato para as operações de criptografia de integridade
 * e assinaturas digitais por hardware (HSM) no KwanzaMóvel.
 * Este port garante que o domínio de negócio permaneça agnóstico de infraestrutura.
 */
export interface ReceiptSigner {
  /**
   * Gera um hash SHA-256 (ou equivalente forte) para o payload do recibo.
   */
  generateHash(payload: any): string;

  /**
   * Assina digitalmente o hash gerado utilizando a chave privada da instituição.
   */
  signDigitally(hash: string): string;

  /**
   * Assina o hash gerado usando as chaves de hardware de segurança do Estado (HSM SGP-BNA).
   */
  signHsm(hash: string): string;
}
