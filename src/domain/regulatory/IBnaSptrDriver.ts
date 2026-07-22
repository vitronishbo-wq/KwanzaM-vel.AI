/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BnaResponse {
  sptrReferenceId: string;
  settlementStatus: "SETTLED" | "PENDING" | "REJECTED";
  bnaTimestamp: string;
  correlationId?: string;
  signedXmlHash?: string;
  signatureAlgorithm?: string;
  hsmSerialUsed?: string;
  iso20022Xml?: string;
  mode?: "SIMULATED" | "PRODUCTION";
}

export interface Pacs008Payload {
  correlationId?: string;
  uetr?: string;
  amount?: number;
  currency?: string;
  debtorIban?: string;
  debtorPhone?: string;
  debtorName?: string;
  creditorIban?: string;
  creditorPhone?: string;
  creditorName?: string;
  remittanceInfo?: string;
  rawXml?: string;
  [key: string]: any;
}

/**
 * Port (Interface de Domínio) para o Driver do BNA SPTR.
 * Isolamento da camada de liquidação regulatória interbancária.
 */
export interface IBnaSptrDriver {
  sendInstantTransfer(pacs008Payload: Pacs008Payload | any): Promise<BnaResponse>;
}
