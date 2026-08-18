/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SignatureProvider, SignatureMode, SignatureProviderMetadata } from "../../../domain/security/SignatureProvider";

/**
 * SimulatedSignatureProvider (Adapter de Desenvolvimento / Sandbox)
 * 
 * Formaliza o modo 'SIMULATED' explicitamente para ambientes de desenvolvimento,
 * testes unitários, testes de concorrência e demonstrações de sandbox.
 * 
 * Separa a referência de chave (KM_PRIV_KEY_REF) da chave privada real,
 * operando sem requerer acesso a HSM físico nem credenciais ativas do Cloud KMS.
 */
export class SimulatedSignatureProvider implements SignatureProvider {
  public readonly providerMode: SignatureMode = "SIMULATED";

  public get keyReference(): string {
    return (
      (typeof process !== "undefined" && (process.env?.KM_PRIV_KEY_REF || process.env?.VITE_KM_PRIV_KEY_REF)) ||
      "simulated://kmos-dev/keys/receipt-signer-v1"
    );
  }

  private get mockId(): string {
    return "SIMULATED-KMS-DEV-01";
  }

  private get activeAlgorithm(): string {
    return "ECDSA_P256_SHA256_SIMULATED";
  }

  public generateHash(payload: any): string {
    const raw = typeof payload === "string" ? payload : JSON.stringify(payload);
    let hash = 2166136261;
    const salt = "KMOS_SIMULATED_SALT_DEV";
    const combined = raw + salt;
    for (let i = 0; i < combined.length; i++) {
      hash ^= combined.charCodeAt(i);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    const hex = Math.abs(hash).toString(16).padStart(8, "0");
    const suffix = raw.length.toString(16).padStart(8, "0");
    let finalHash = hex + suffix;
    while (finalHash.length < 64) {
      finalHash += Math.abs(finalHash.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) ^ 0x33).toString(16);
    }
    return finalHash.substring(0, 64).toUpperCase();
  }

  public sign(hash: string): string {
    return this.signDigitally(hash);
  }

  public signDigitally(hash: string): string {
    const keyRef = this.keyReference;
    const body = hash.substring(0, 24).toUpperCase();
    return `SIG[${this.activeAlgorithm}]::REF(${keyRef})::SHA256(${body})`;
  }

  public signSovereign(hash: string): string {
    const body = hash.substring(24, 48).toUpperCase();
    return `SOV_SIG[SIMULATED_BNA_SPTR]::KEY_REF(${this.keyReference})::BODY(${body})::VERIFIED_SIMULATED`;
  }

  public signHsm(hash: string): string {
    return this.signSovereign(hash);
  }

  public getMetadata(): SignatureProviderMetadata {
    return {
      providerName: "KMOS Simulated Software Key Provider",
      mode: "SIMULATED",
      keyReference: this.keyReference,
      algorithm: this.activeAlgorithm,
      hsmSlot: "SLOT_SIMULATED_DEV",
      serialNumber: "DEV-SIMULATED-HSM-001",
      isSimulated: true,
      status: "ACTIVE"
    };
  }
}
