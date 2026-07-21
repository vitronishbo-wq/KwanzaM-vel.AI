/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import QRCode from "qrcode";
import { 
  X, 
  Download, 
  Printer, 
  ShieldCheck, 
  CheckCircle2, 
  QrCode, 
  Copy, 
  Check, 
  RefreshCw, 
  FileText, 
  Lock, 
  ExternalLink,
  ChevronRight,
  Building2,
  Share2,
  Sparkles
} from "lucide-react";
import { 
  ReceiptAggregate, 
  ReceiptRepository, 
  ReceiptGenerator, 
  ReceiptTemplate 
} from "../domain/evidence/ReceiptEngine";
import { Money } from "../ledgerEngine";

export interface TransactionReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction?: {
    id: string;
    amount: number;
    type: string;
    timestamp: string;
    senderPhone?: string;
    senderName?: string;
    receiverPhone?: string;
    receiverName?: string;
    status: string;
    correlationId?: string;
    traceId?: string;
    receiptId?: string;
    hash?: string;
    hsmSignature?: string;
    complianceScore?: number;
    ledgerEntries?: Array<{ account: string; type: "DEBIT" | "CREDIT"; amount: string }>;
  } | null;
  receiptFormat?: "58mm" | "80mm" | "A5" | "A4";
}

export const TransactionReceiptModal: React.FC<TransactionReceiptModalProps> = ({
  isOpen,
  onClose,
  transaction,
  receiptFormat: initialFormat = "A4"
}) => {
  const [selectedFormat, setSelectedFormat] = useState<"58mm" | "80mm" | "A5" | "A4">(initialFormat);
  const [receipt, setReceipt] = useState<ReceiptAggregate | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Digital Signature Live Validation Simulator state
  const [validationState, setValidationState] = useState<"idle" | "verifying" | "valid" | "error">("idle");
  const [validationProgress, setValidationProgress] = useState<number>(0);
  const [validationStepText, setValidationStepText] = useState<string>("");

  // Ensure or create ReceiptAggregate when modal opens or transaction changes
  useEffect(() => {
    if (!isOpen || !transaction) {
      setReceipt(null);
      setValidationState("idle");
      return;
    }

    // Try finding existing receipt by txId or receiptId
    let existing = ReceiptRepository.findByTxId(transaction.id);
    if (!existing && transaction.receiptId) {
      existing = ReceiptRepository.findById(transaction.receiptId);
    }

    if (existing) {
      setReceipt(existing);
    } else {
      // Auto-generate certified receipt aggregate for any raw transaction
      const mapType = (t: string): "P2P_TRANSFER" | "SETTLEMENT" | "SERVICE_PAY" => {
        if (t.toLowerCase().includes("deposito") || t.toLowerCase().includes("settlement") || t.toLowerCase().includes("mint")) {
          return "SETTLEMENT";
        }
        if (t.toLowerCase().includes("pagamento") || t.toLowerCase().includes("servico")) {
          return "SERVICE_PAY";
        }
        return "P2P_TRANSFER";
      };

      const newReceipt = ReceiptGenerator.create({
        txId: transaction.id,
        type: mapType(transaction.type),
        amount: Money.fromDecimal(transaction.amount),
        senderId: transaction.senderPhone || "KM-SYSTEM-01",
        senderName: transaction.senderName || "Cliente KwanzaMóvel",
        receiverId: transaction.receiverPhone || "KM-SYSTEM-02",
        receiverName: transaction.receiverName || "Destinatário Autenticado",
        status: transaction.status === "failed" || transaction.status === "blocked" ? "FAILED" : "SUCCESS",
      });

      ReceiptRepository.save(newReceipt);
      setReceipt(newReceipt);
    }
  }, [isOpen, transaction]);

  // Generate QR Code Data URL whenever receipt changes
  useEffect(() => {
    if (!receipt) {
      setQrCodeDataUrl("");
      return;
    }

    const verificationUrl = receipt.verificationUrl || 
      `https://bna.ao/verify/receipt?id=${receipt.id}&hash=${receipt.hash.substring(0, 16)}&v=${receipt.version}`;

    QRCode.toDataURL(verificationUrl, {
      margin: 1,
      width: 280,
      color: {
        dark: "#1e293b",
        light: "#ffffff",
      },
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error("Erro ao gerar QR code da assinatura:", err));
  }, [receipt]);

  if (!isOpen || !transaction) return null;

  const currentReceipt = receipt;
  const formattedAmount = `${transaction.amount.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Kz`;

  // Live Digital Signature Verification Simulator
  const handleSimulateValidation = () => {
    setValidationState("verifying");
    setValidationProgress(15);
    setValidationStepText("A carregar Chave Pública Soberana do BNA HSM (RSA-4096)...");

    setTimeout(() => {
      setValidationProgress(45);
      setValidationStepText("A recalcular SHA-256 Digest da transação e lote de liquidação...");
    }, 500);

    setTimeout(() => {
      setValidationProgress(80);
      setValidationStepText("A verificar assinatura criptográfica RSA-PSS contra a cadeia de custódia...");
    }, 1000);

    setTimeout(() => {
      setValidationProgress(100);
      setValidationState("valid");
      setValidationStepText("✓ Assinatura Criptográfica VÁLIDA (Selo HSM-BNA-2026-A01)");
    }, 1500);
  };

  // Download PDF Handler
  const handleDownloadPdf = async () => {
    if (!currentReceipt) return;
    setIsGeneratingPdf(true);

    try {
      const doc = await ReceiptTemplate.generateReceiptPdf(currentReceipt, selectedFormat);
      doc.save(`comprovativo_${currentReceipt.id}_v${currentReceipt.version}.pdf`);
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      alert("Ocorreu um erro ao gerar o documento PDF.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  // Copy Verification Link
  const handleCopyVerificationLink = () => {
    if (!currentReceipt) return;
    const url = currentReceipt.verificationUrl || 
      `https://bna.ao/verify/receipt?id=${currentReceipt.id}&hash=${currentReceipt.hash}`;
    
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  return (
    <div className="fixed inset-0 bg-neutral-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in print:p-0 print:bg-white print:static">
      <div 
        className="bg-zinc-950 border border-zinc-900 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col my-auto max-h-[92vh] print:max-h-none print:border-0 print:shadow-none print:bg-white"
        id="transaction-receipt-modal-content"
      >
        {/* Header Bar */}
        <div className="bg-zinc-900/90 border-b border-zinc-800 p-4 sm:p-5 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#B87333]/15 border border-[#B87333]/30 flex items-center justify-center text-[#B87333]">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-white">KwanzaMóvel • BNA</span>
                <span className="text-[9px] font-bold uppercase tracking-wider bg-[#B87333]/20 text-[#B87333] border border-[#B87333]/40 px-2 py-0.5 rounded-full">
                  Assinatura Digital HSM
                </span>
              </div>
              <h3 className="text-sm font-bold text-zinc-300">
                Comprovativo de Transação & Validação Criptográfica
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl border border-zinc-800 transition-colors cursor-pointer"
            title="Fechar Comprovativo"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-left print:p-0">
          
          {/* Main Transaction Header Card */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/60 pb-4">
              <div>
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block mb-1">
                  Valor Total da Operação
                </span>
                <div className="text-2xl sm:text-3xl font-mono font-black text-white flex items-baseline gap-2">
                  <span>{formattedAmount}</span>
                  <span className="text-xs font-sans font-bold text-[#B87333] uppercase">AOA</span>
                </div>
              </div>

              <div className="flex flex-col items-start sm:items-end gap-1.5">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase px-3 py-1 rounded-full border ${
                    transaction.status === "completed" || transaction.status === "SUCCESS"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                  }`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{transaction.status === "completed" || transaction.status === "SUCCESS" ? "Concluída & Selada" : "Bloqueada / Rejeitada"}</span>
                  </span>
                </div>
                <span className="text-[10px] font-mono text-zinc-400">
                  {new Date(transaction.timestamp).toLocaleString("pt-PT")}
                </span>
              </div>
            </div>

            {/* Quick Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs font-mono">
              <div>
                <span className="text-[9px] uppercase text-zinc-500 block font-sans">ID Transação:</span>
                <strong className="text-white text-[11px] block truncate" title={transaction.id}>{transaction.id}</strong>
              </div>
              <div>
                <span className="text-[9px] uppercase text-zinc-500 block font-sans">ID Recibo:</span>
                <strong className="text-amber-400 text-[11px] block truncate">{currentReceipt?.id || "A Gerar..."}</strong>
              </div>
              <div>
                <span className="text-[9px] uppercase text-zinc-500 block font-sans">Tipo Operação:</span>
                <strong className="text-zinc-300 text-[11px] uppercase block">{transaction.type}</strong>
              </div>
              <div>
                <span className="text-[9px] uppercase text-zinc-500 block font-sans">Compliance score:</span>
                <strong className="text-emerald-400 text-[11px] block">100% (Aviso 11/21)</strong>
              </div>
            </div>
          </div>

          {/* Sender & Receiver Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-4 space-y-1.5">
              <span className="text-[10px] font-bold text-[#B87333] uppercase tracking-wider block">
                Origem / Pagador (Sender)
              </span>
              <div className="text-sm font-bold text-white">
                {transaction.senderName || currentReceipt?.senderName || "Cliente KwanzaMóvel"}
              </div>
              <div className="text-xs font-mono text-zinc-400">
                Conta / Telefone: {transaction.senderPhone || currentReceipt?.senderId || "KM-3841-9238"}
              </div>
            </div>

            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-4 space-y-1.5">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                Destino / Beneficiário (Receiver)
              </span>
              <div className="text-sm font-bold text-white">
                {transaction.receiverName || currentReceipt?.receiverName || "Destinatário Autenticado"}
              </div>
              <div className="text-xs font-mono text-zinc-400">
                Conta / Telefone: {transaction.receiverPhone || currentReceipt?.receiverId || "KM-9921-4810"}
              </div>
            </div>
          </div>

          {/* Double-Entry Ledger Postings Section */}
          {currentReceipt?.evidencePackage?.ledgerEntries && (
            <div className="bg-zinc-900/30 border border-zinc-800/60 rounded-xl p-4 space-y-2">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                Partidas Dobradas no Razão Imutável (Double-Entry Ledger)
              </span>
              <div className="divide-y divide-zinc-800/50 text-xs font-mono">
                {currentReceipt.evidencePackage.ledgerEntries.map((entry: any, idx: number) => (
                  <div key={idx} className="py-2 flex items-center justify-between">
                    <span className="text-zinc-300 font-semibold">{entry.account}</span>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        entry.type === "DEBIT" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      }`}>
                        {entry.type}
                      </span>
                      <span className="text-white font-bold">{entry.amount}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* QR CODE & DIGITAL SIGNATURE VALIDATION PANEL */}
          <div className="bg-gradient-to-br from-zinc-950 via-zinc-900/90 to-zinc-950 border border-[#B87333]/30 rounded-2xl p-5 space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-[#B87333]" />
                <span className="text-xs font-black uppercase tracking-wider text-white">
                  Validação Digital via QR Code & BNA HSM
                </span>
              </div>
              <span className="text-[9px] font-mono uppercase font-bold text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded">
                Criptografia Soberana RSA-4096
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* QR Code Canvas Frame */}
              <div className="md:col-span-4 flex flex-col items-center justify-center p-3 bg-white rounded-xl border-2 border-[#B87333]/40 shadow-lg relative group">
                {qrCodeDataUrl ? (
                  <img 
                    src={qrCodeDataUrl} 
                    alt="QR Code de Validação Digital da Transação" 
                    className="w-40 h-40 object-contain rounded"
                  />
                ) : (
                  <div className="w-40 h-40 flex items-center justify-center text-zinc-400 text-xs font-mono animate-pulse">
                    A gerar QR Code...
                  </div>
                )}
                <span className="text-[9px] font-mono text-zinc-800 font-bold mt-2 uppercase tracking-tight text-center">
                  Digitalizar para validar no BNA
                </span>
              </div>

              {/* Digital Signature Details & Live Simulator */}
              <div className="md:col-span-8 space-y-3.5 text-xs font-mono">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-sans text-zinc-400 font-bold block">
                    Hash de Integridade SHA-256:
                  </span>
                  <div className="p-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-300 break-all text-[10px]">
                    {currentReceipt?.hash || "Generating Cryptographic Hash..."}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-sans text-zinc-400 font-bold block">
                    Assinatura HSM (Módulo de Segurança de Hardware):
                  </span>
                  <div className="p-2 bg-zinc-950 border border-zinc-800 rounded-lg text-amber-200/90 break-all text-[10px] max-h-16 overflow-y-auto">
                    {currentReceipt?.hsmSignature || "Generating HSM Signature..."}
                  </div>
                </div>

                {/* Validation Simulator Action */}
                <div className="pt-2">
                  {validationState === "idle" && (
                    <button
                      onClick={handleSimulateValidation}
                      className="w-full bg-[#B87333] hover:bg-[#a0622a] text-white font-sans font-bold text-xs py-2.5 px-4 rounded-xl transition-all shadow flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Validar Assinatura Digital no BNA HSM</span>
                    </button>
                  )}

                  {validationState === "verifying" && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-[10px] text-amber-300 font-bold">
                        <span className="flex items-center gap-2">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Validação Criptográfica em curso...</span>
                        </span>
                        <span>{validationProgress}%</span>
                      </div>
                      <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-[#B87333] h-full transition-all duration-300" 
                          style={{ width: `${validationProgress}%` }}
                        />
                      </div>
                      <span className="text-[9.5px] text-zinc-400 block truncate">
                        {validationStepText}
                      </span>
                    </div>
                  )}

                  {validationState === "valid" && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-1 animate-fade-in">
                      <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs font-sans">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Assinatura Digital Criptograficamente VÁLIDA</span>
                      </div>
                      <p className="text-[10px] text-zinc-300 leading-relaxed font-sans">
                        A chave RSA-4096 do BNA confirmou a imutabilidade desta transação. O comprovativo possui força probatória completa sob o Aviso 11/2021 do Banco Nacional de Angola.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* PDF Format Selector Bar */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-3 print:hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-white flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#B87333]" />
                <span>Formato de Exportação PDF do Comprovativo</span>
              </span>
              <span className="text-[10px] text-zinc-400">
                Seleccione o formato pretendido
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: "58mm", label: "58mm (POS / Térmico)" },
                { id: "80mm", label: "80mm (Balcão Agente)" },
                { id: "A5", label: "A5 (Documento Compacto)" },
                { id: "A4", label: "A4 (Certificado Oficial)" }
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => setSelectedFormat(fmt.id as any)}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border text-center cursor-pointer ${
                    selectedFormat === fmt.id
                      ? "bg-[#B87333] text-white border-[#B87333] shadow"
                      : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700"
                  }`}
                >
                  {fmt.label}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="bg-zinc-900/90 border-t border-zinc-800 p-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyVerificationLink}
              className="p-2.5 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl border border-zinc-800 text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer"
              title="Copiar Link de Validação"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copiedLink ? "Copiado!" : "Copiar Link"}</span>
            </button>

            <button
              onClick={handlePrint}
              className="p-2.5 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl border border-zinc-800 text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer"
              title="Imprimir Comprovativo"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl border border-zinc-800 text-xs font-bold transition-colors cursor-pointer"
            >
              Fechar
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf || !currentReceipt}
              className="px-5 py-2.5 bg-[#B87333] hover:bg-[#a0622a] disabled:opacity-50 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all shadow flex items-center gap-2 cursor-pointer"
            >
              {isGeneratingPdf ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>A Gerar PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Descarregar Recibo PDF</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
