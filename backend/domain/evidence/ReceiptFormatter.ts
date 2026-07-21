/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ReceiptData {
  id: string;
  txId: string;
  evidenceId: string;
  version: number;
  type: string;
  amount: string;
  senderName: string;
  senderId: string;
  receiverName: string;
  receiverId: string;
  status: string;
  timestamp: string;
  hash: string;
  digitalSignature: string;
}

export class ReceiptFormatter {
  /**
   * Formats a receipt for thermal printing slips (58mm or 80mm).
   */
  public static formatThermal(data: ReceiptData, format: "58mm" | "80mm"): string {
    const width = format === "58mm" ? 32 : 40;
    const divider = "-".repeat(width);
    const doubleDivider = "=".repeat(width);

    const padLine = (label: string, val: string): string => {
      const spaceLeft = width - label.length - val.length;
      if (spaceLeft <= 0) {
        return `${label}\n${" ".repeat(width - val.length)}${val}`;
      }
      return `${label}${" ".repeat(spaceLeft)}${val}`;
    };

    const centerText = (text: string): string => {
      if (text.length >= width) return text;
      const pad = Math.floor((width - text.length) / 2);
      return " ".repeat(pad) + text;
    };

    const wrapText = (text: string, prefix = ""): string => {
      const limit = width - prefix.length;
      const chunks: string[] = [];
      let i = 0;
      while (i < text.length) {
        chunks.push(prefix + text.substring(i, i + limit));
        i += limit;
      }
      return chunks.join("\n");
    };

    const dateFormatted = data.timestamp.replace("T", " ").substring(0, 19);

    let output = "";
    output += centerText("BANCO NACIONAL DE ANGOLA") + "\n";
    output += centerText("KWANZAMÓVEL PLATFORM") + "\n";
    output += centerText("SISTEMA DE LIQUIDAÇÃO SGP") + "\n";
    output += doubleDivider + "\n";
    output += centerText("COMPROVATIVO DE OPERAÇÃO") + "\n";
    output += centerText(`VERSÃO DO RECIBO: v${data.version}`) + "\n";
    output += divider + "\n";
    output += padLine("RECIBO ID:", data.id) + "\n";
    output += padLine("TX COLD ID:", data.txId) + "\n";
    output += padLine("EVIDENCIA ID:", data.evidenceId) + "\n";
    output += padLine("DATA/HORA:", dateFormatted) + "\n";
    output += padLine("TIPO OPERAÇÃO:", data.type.substring(0, width - 15)) + "\n";
    output += divider + "\n";
    output += padLine("ORIGEM:", data.senderName.substring(0, width - 10)) + "\n";
    output += padLine("ID/TELEFONE:", data.senderId) + "\n";
    output += padLine("DESTINO:", data.receiverName.substring(0, width - 10)) + "\n";
    output += padLine("ID/TELEFONE:", data.receiverId) + "\n";
    output += divider + "\n";
    output += padLine("VALOR:", data.amount) + "\n";
    output += padLine("ESTADO:", data.status) + "\n";
    output += doubleDivider + "\n";
    output += centerText("INTEGRIDADE (LEI 40/20)") + "\n";
    output += wrapText(data.hash, "HASH: ") + "\n";
    output += wrapText(data.digitalSignature, "SIG:  ") + "\n";
    output += doubleDivider + "\n";
    output += centerText("Obrigado por utilizar o KwanzaMóvel") + "\n";
    output += centerText("Liquidação Fiduciária Instantânea") + "\n";

    return output;
  }
}
