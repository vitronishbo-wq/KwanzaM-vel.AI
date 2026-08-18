/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SignatureProvider, SignatureMode } from "../../../domain/security/SignatureProvider";
import { LocalDevSigner } from "./LocalDevSigner";
import { GoogleKmsSigner } from "./GoogleKmsSigner";
import { HsmSigner } from "./HsmSigner";
import { HsmSignerAdapter } from "./HsmSignerAdapter";
import { EnvironmentConfigValidator } from "../../../bootstrap/EnvironmentConfigValidator";

export type AdapterType = "LOCAL_DEV" | "GOOGLE_KMS" | "HARDWARE_HSM" | "AUTO";

export interface SignatureProviderFactoryOptions {
  mode?: SignatureMode;
  adapterType?: AdapterType;
  keyRef?: string;
  forceSimulated?: boolean;
}

/**
 * SignatureProviderFactory
 * 
 * Fábrica centralizada de provedores criptográficos para o KMOS.
 * Instancia o adaptador correto (`LocalDevSigner`, `GoogleKmsSigner`, `HsmSigner` ou `HsmSignerAdapter`)
 * de acordo com a configuração de ambiente, preservando a imutabilidade do domínio.
 */
export class SignatureProviderFactory {
  public static create(options?: SignatureProviderFactoryOptions): SignatureProvider {
    // 1. Executar validação prévia de conformidade de ambiente
    const report = EnvironmentConfigValidator.getCachedReport();

    const isExplicitSimulated = options?.forceSimulated === true || options?.adapterType === "LOCAL_DEV";
    const isTestEnv = typeof process !== "undefined" && process.env?.NODE_ENV === "test";
    const localStorageSimulated = typeof localStorage !== "undefined" && localStorage.getItem("kmos_use_mock_signer") === "true";

    const envMode = (
      options?.mode ||
      EnvironmentConfigValidator.getEnv("KM_SIGNATURE_MODE", "SIMULATED")
    ).toUpperCase() as SignatureMode;

    const requestedAdapter = (
      options?.adapterType ||
      EnvironmentConfigValidator.getEnv("KM_SIGNER_ADAPTER", "AUTO")
    ).toUpperCase();

    // 2. Se for modo SIMULATED, desenvolvimento ou teste, fornece LocalDevSigner
    if (isExplicitSimulated || isTestEnv || localStorageSimulated || envMode === "SIMULATED") {
      return new LocalDevSigner();
    }

    // 3. Em modo PRODUCTION, roteia para o adaptador de nuvem ou hardware apropriado
    if (requestedAdapter === "GOOGLE_KMS" || requestedAdapter === "GCP_KMS") {
      return new GoogleKmsSigner();
    }

    if (requestedAdapter === "HARDWARE_HSM" || requestedAdapter === "PKCS11") {
      return new HsmSigner();
    }

    // Padrão de produção: adaptador HsmSignerAdapter / HsmSigner com validação estrita
    return new HsmSigner();
  }
}
