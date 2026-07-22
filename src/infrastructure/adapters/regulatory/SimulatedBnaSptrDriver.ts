/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { IBnaSptrDriver, BnaResponse, Pacs008Payload } from "../../../domain/regulatory/IBnaSptrDriver";
import { HsmSignerAdapter } from "../hsm/HsmSignerAdapter";

/**
 * SimulatedBnaSptrDriver (Adapter de Infraestrutura Regulatória)
 * 
 * Implementa a comunicação simulada com o Sistema de Pagamentos em Tempo Real (SPTR)
 * do Banco Nacional de Angola (BNA), operando segundo a Arquitetura Hexagonal.
 * 
 * Processa mensagens financeiras estruturadas (pacs.008.001.08 ISO 20022),
 * simula latência de rede interbancária e assina digitalmente os payloads via HSM.
 */
export class SimulatedBnaSptrDriver implements IBnaSptrDriver {
  private hsmSigner: HsmSignerAdapter;

  constructor() {
    this.hsmSigner = new HsmSignerAdapter();
  }

  /**
   * Obtém o modo de operação configurado nas variáveis de ambiente.
   */
  private get mode(): "SIMULATED" | "PRODUCTION" {
    const rawMode = process.env.BNA_SPTR_MODE || process.env.VITE_BNA_SPTR_MODE || "SIMULATED";
    return rawMode.toUpperCase() === "PRODUCTION" ? "PRODUCTION" : "SIMULATED";
  }

  /**
   * Obtém o número de série do HSM configurado nas variáveis de ambiente.
   */
  private get hsmSerialNumber(): string {
    return process.env.HSM_SERIAL_NUMBER || process.env.VITE_HSM_SERIAL_NUMBER || "DEV-HSM-001";
  }

  /**
   * Encapsula a transação no formato de mensageria pacs.008 (ISO 20022 XML).
   */
  private buildPacs008Xml(payload: Pacs008Payload): string {
    if (payload.rawXml && payload.rawXml.includes("pacs.008")) {
      return payload.rawXml;
    }

    const txId = payload.uetr || payload.correlationId || `tx_${Date.now()}`;
    const amount = Number(payload.amount || 0).toFixed(2);
    const timestamp = new Date().toISOString();
    const debtorPhone = (payload.debtorPhone || "244948323383").replace("+", "");
    const creditorPhone = (payload.creditorPhone || "244923000100").replace("+", "");
    const debtorName = payload.debtorName || "Utilizador KwanzaMóvel";
    const creditorName = payload.creditorName || "Destinatário KwanzaMóvel";

    return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <FIToFICstmrCdtTrf>
    <GrpHdr>
      <MsgId>KMV-${txId.substring(0, 12).toUpperCase()}</MsgId>
      <CreDtTm>${timestamp}</CreDtTm>
      <NbOfTxs>1</NbOfTxs>
      <SttlmInf>
        <SttlmMtd>CLRG</SttlmMtd>
        <ClrSys>
          <Prtry>SPTR-BNA-ANGOLA</Prtry>
        </ClrSys>
      </SttlmInf>
    </GrpHdr>
    <CdtTrfTxInf>
      <PmtId>
        <EndToEndId>KM-E2E-${txId.substring(0, 8).toUpperCase()}</EndToEndId>
        <UETR>${txId}</UETR>
      </PmtId>
      <IntrBkSttlmAmt Ccy="AOA">${amount}</IntrBkSttlmAmt>
      <IntrBkSttlmDt>${timestamp.substring(0, 10)}</IntrBkSttlmDt>
      <Dbtr>
        <Nm>${debtorName}</Nm>
        <Id>
          <OrgId>
            <Othr>
              <Id>${debtorPhone}</Id>
              <SchmeNm><Prtry>MSISDN</Prtry></SchmeNm>
            </Othr>
          </OrgId>
        </Id>
      </Dbtr>
      <Cdtr>
        <Nm>${creditorName}</Nm>
        <Id>
          <OrgId>
            <Othr>
              <Id>${creditorPhone}</Id>
              <SchmeNm><Prtry>MSISDN</Prtry></SchmeNm>
            </Othr>
          </OrgId>
        </Id>
      </Dbtr>
    </CdtTrfTxInf>
  </FIToFICstmrCdtTrf>
</Document>`;
  }

  /**
   * Envia uma transferência instantânea ao liquidante BNA SPTR.
   */
  public async sendInstantTransfer(pacs008Payload: Pacs008Payload | any): Promise<BnaResponse> {
    const correlationId = pacs008Payload.correlationId || pacs008Payload.uetr || `CORR-${Date.now()}`;
    
    console.info(`[BNA SPTR Driver] [${correlationId}] A iniciar liquidação de transferência instantânea em modo ${this.mode}...`);

    try {
      // 1. Validar modo de operação
      if (this.mode !== "SIMULATED") {
        console.warn(`[BNA SPTR Driver] [${correlationId}] Aviso: O driver está configurado em BNA_SPTR_MODE=${this.mode}, mas está a utilizar o adaptador Simulado.`);
      }

      // 2. Encapsular no formato ISO 20022 pacs.008 XML
      const iso20022Xml = this.buildPacs008Xml(pacs008Payload);

      // 3. Simular Assinatura Digital do Payload via HSM
      const xmlHash = this.hsmSigner.generateHash({ xml: iso20022Xml, correlationId });
      const hsmSignature = this.hsmSigner.signHsm(xmlHash);

      console.info(`[BNA SPTR Driver] [${correlationId}] Payload XML pacs.008 assinado com sucesso via HSM [Serial: ${this.hsmSerialNumber}]. Hash: ${xmlHash}`);

      // 4. Simular latência de rede interbancária com o BNA (150ms a 300ms)
      const simulatedLatencyMs = Math.floor(150 + Math.random() * 150);
      await new Promise((resolve) => setTimeout(resolve, simulatedLatencyMs));

      // 5. Gerar Referência de Liquidação BNA
      const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
      const sptrReferenceId = `BNA-SPTR-${Date.now()}-${randomSuffix}`;
      const bnaTimestamp = new Date().toISOString();

      console.info(`[BNA SPTR Driver] [${correlationId}] Liquidação SPTR concluída com SUCESSO após ${simulatedLatencyMs}ms. Ref BNA: ${sptrReferenceId}`);

      return {
        sptrReferenceId,
        settlementStatus: "SETTLED",
        bnaTimestamp,
        correlationId,
        signedXmlHash: xmlHash,
        signatureAlgorithm: "ECDSA_P256_SHA256",
        hsmSerialUsed: this.hsmSerialNumber,
        iso20022Xml,
        mode: this.mode
      };
    } catch (error: any) {
      console.error(`[BNA SPTR Driver] [${correlationId}] Erro ao processar liquidação SPTR:`, error);
      throw new Error(`[BNA SPTR Driver] Falha na liquidação interbancária SPTR: ${error?.message || "Erro desconhecido"}`);
    }
  }
}
