/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SignatureProvider, SignatureMode, SignatureProviderMetadata } from "./SignatureProvider";

export type { SignatureMode, SignatureProviderMetadata, SignatureProvider };

/**
 * ReceiptSigner Interface (Port de Domínio)
 * 
 * Mantido como contrato de retrocompatibilidade com o ecossistema KMOS.
 * Estende `SignatureProvider` para assegurar que qualquer adapter implementando
 * assinaturas digitais ou soberanas cumpra os requisitos do domínio.
 */
export interface ReceiptSigner extends SignatureProvider {
  /**
   * Gera um hash SHA-256 para o payload do recibo.
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
