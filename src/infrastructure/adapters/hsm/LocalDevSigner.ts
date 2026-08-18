/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SignatureProvider, SignatureMode, SignatureProviderMetadata } from "../../../domain/security/SignatureProvider";

/**
 * LocalDevSigner (Adapter de Desenvolvimento Local & Testes de Unidade)
 * 
 * Implementa o contrato único `SignatureProvider` para ambientes de desenvolvimento,
 * CI/CD e testes rápidos sem dependência de hardware HSM ou APIs de nuvem.
 */
export class LocalDevSigner implements SignatureProvider {
  public readonly providerMode: SignatureMode = "SIMULATED";

  public get keyReference(): string {
    return (
      (typeof process !== "undefined" && (process.env?.KM_PRIV_KEY_REF || process.env?.VITE_KM_PRIV_KEY_REF)) ||
      "simulated://kmos-dev/keys/receipt-signer-v1"
    );
  }

  private readonly devId = "LOCAL-DEV-SIGNER-01";
  private readonly devAlgorithm = "ECDSA_P256_SHA256_LOCAL_DEV";

  public generateHash(payload: any): string {
    const raw = typeof payload === "string" ? payload : JSON.stringify(payload);
    let hash = 2166136261;
    const salt = "KMOS_LOCAL_DEV_SALT_2026";
    const combined = raw + salt;
    for (let i = 0; i < combined.length; i++) {
      hash ^= combined.charCodeAt(i);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    const hex = Math.abs(hash).toString(16).padStart(8, "0");
    const suffix = raw.length.toString(16).padStart(8, "0");
    let finalHash = hex + suffix;
    while (finalHash.length < 64) {
      finalHash += Math.abs(finalHash.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) ^ 0x22).toString(16);
    }
    return finalHash.substring(0, 64).toUpperCase();
  }

  public signDigitally(hash: string): string {
    const body = hash.substring(0, 24).toUpperCase();
    return `SIG[${this.devAlgorithm}]::REF(${this.keyReference})::SHA256(${body})`;
  }

  public signSovereign(hash: string): string {
    const body = hash.substring(24, 48).toUpperCase();
    return `SOV_SIG[SIMULATED_BNA_SPTR]::DEV_ID(${this.devId})::REF(${this.keyReference})::BODY(${body})::VERIFIED_LOCAL_DEV`;
  }

  public signHsm(hash: string): string {
    return this.signSovereign(hash);
  }

  public getMetadata(): SignatureProviderMetadata {
    return {
      providerName: "KMOS Local Development Software Signer",
      mode: "SIMULATED",
      keyReference: this.keyReference,
      algorithm: this.devAlgorithm,
      hsmSlot: "SLOT_DEV_IN_MEMORY",
      serialNumber: "DEV-LOCAL-SIGNER-001",
      isSimulated: true,
      status: "ACTIVE"
    };
  }
}
