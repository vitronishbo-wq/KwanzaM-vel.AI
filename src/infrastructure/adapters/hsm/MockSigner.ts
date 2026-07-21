/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReceiptSigner } from "../../../domain/security/ReceiptSigner";

/**
 * MockSigner (Adapter para ambiente de desenvolvimento e testes de unidade)
 * 
 * Implementa o port `ReceiptSigner` gerando assinaturas simuladas leves sem
 * requerer chaves de hardware físicas ou variáveis de ambiente restritas do KMS.
 */
export class MockSigner implements ReceiptSigner {
  private readonly mockId = "MOCK-SIGNER-DEV-01";

  public generateHash(payload: any): string {
    const raw = JSON.stringify(payload);
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, "0");
    return (hex + "0".repeat(56)).substring(0, 64).toUpperCase();
  }

  public signDigitally(hash: string): string {
    return `MOCK_DIGITAL_SIG::${this.mockId}::${hash.substring(0, 16)}`;
  }

  public signHsm(hash: string): string {
    return `MOCK_HSM_SIG::${this.mockId}::SLOT[DEV_LOCAL]::${hash.substring(16, 32)}`;
  }
}
