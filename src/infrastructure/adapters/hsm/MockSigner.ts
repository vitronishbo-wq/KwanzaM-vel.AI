/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SignatureProvider } from "../../../domain/security/SignatureProvider";
import { LocalDevSigner } from "./LocalDevSigner";

/**
 * MockSigner (Adapter de compatibilidade para suítes de testes unitários)
 * 
 * Herda de `LocalDevSigner` implementando o contrato `SignatureProvider`.
 */
export class MockSigner extends LocalDevSigner implements SignatureProvider {
  // Retrocompatibilidade garantida
}
