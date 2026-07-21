/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BnaCustodyState, Transaction } from "./types";

/**
 * Generates official, structured ISO 20022 compliant XML strings
 * (specifically pacs.008.001.08 for Credit Transfer) so developers or regulators
 * can inspect the absolute compliance standard of the KwanzaMóvel core engine.
 */
export function generatePacs008Message(tx: Transaction): string {
  const txId = tx.id || "tx_sim_000000";
  const amount = tx.amount || 0;
  const timestamp = tx.timestamp || new Date().toISOString();
  const cleanPhoneSender = tx.senderPhone ? tx.senderPhone.replace("+", "") : "244923456789";
  const cleanPhoneReceiver = tx.receiverPhone ? tx.receiverPhone.replace("+", "") : "244923000100";

  return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <FIToFICstmrCdtTrf>
    <GrpHdr>
      <MsgId>KMV-${txId.substring(3, 15).toUpperCase()}</MsgId>
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
        <EndToEndId>KM-E2E-${txId.substring(3, 10).toUpperCase()}</EndToEndId>
        <UETR>${txId}</UETR>
      </PmtId>
      <IntrBkSttlmAmt Ccy="AOA">${amount.toFixed(2)}</IntrBkSttlmAmt>
      <IntrBkSttlmDt>${timestamp.substring(0, 10)}</IntrBkSttlmDt>
      <Dbtr>
        <Nm>Utilizador KwanzaMóvel</Nm>
        <Id>
          <OrgId>
            <Othr>
              <Id>${cleanPhoneSender}</Id>
              <SchmeNm>
                <Prtry>MSISDN</Prtry>
              </SchmeNm>
            </Othr>
          </OrgId>
        </Id>
      </Dbtr>
      <DbtrAgt>
        <FinInstnId>
          <Othr>
            <Id>KMV-AO-LA</Id>
          </Othr>
        </FinInstnId>
      </DbtrAgt>
      <CdtrAgt>
        <FinInstnId>
          <Othr>
            <Id>KMV-AO-LA</Id>
          </Othr>
        </FinInstnId>
      </CdtrAgt>
      <Cdtr>
        <Nm>Destinatário KwanzaMóvel</Nm>
        <Id>
          <OrgId>
            <Othr>
              <Id>${cleanPhoneReceiver}</Id>
              <SchmeNm>
                <Prtry>MSISDN</Prtry>
              </SchmeNm>
            </Othr>
          </OrgId>
        </Id>
      </Cdtr>
    </CdtTrfTxInf>
  </FIToFICstmrCdtTrf>
</Document>`;
}

/**
 * Default initial state of BNA Custody and Liquidation Engine.
 * Represents 1:1 backing across leading Custodians in Angola.
 */
export const defaultBnaCustodyState: BnaCustodyState = {
  bnaCustodyBalance: 250000000, // 250M Kz Backed directly in Banco Nacional de Angola Escrow
  bfaReserveBalance: 125000000, // 125M Kz kept in Banco de Fomento Angola
  baiReserveBalance: 100000000, // 100M Kz kept in Banco Angolano de Investimentos
  bicReserveBalance: 25000000,  // 25M Kz kept in Banco BIC
  totalCirculation: 45500,      // Wallet circulation corresponding to Antonio's balance
  pendingSettlementsCount: 0,
  lastSptrMsgIso20022: `<!-- Inicie transações na "KwanzaMóvel" para gerar mensagens de liquidação síncronas ISO 20022 pacs.008 -->`,
  isSettling: false,
  criticalVolumeThreshold: 2450000, // A partir de 2.450.000 Kz de volume diário, ativa o alerta crítico
  criticalPendingLimit: 4,          // A partir de 4 transações pendentes de liquidação SPTR, ativa o alerta
  criticalCirculationThreshold: 50000, // A partir de 50.000 Kz de circulação total, ativa o alerta
  largeTxThreshold: 5000,            // Limiar configurável para destacar transações de alto valor
  fraudEnabled: true,                // Detecção de fraude activa por defeito
  fraudGeoVelocityLimit: 300,        // Limite de velocidade de impossibilidade de viagem de 300 km/h
  fraudTxFrequencyLimit: 3,          // Máximo de 3 transações permitidas na janela temporal
  fraudTxTimeWindow: 120,            // Janela temporal padrão de 120 segundos
  syncBatches: []
};
