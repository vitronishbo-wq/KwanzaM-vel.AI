import React, { useState, useEffect, useMemo } from "react";
import { Clock, RefreshCw, Copy, Check, AlertCircle, Sparkles, Smartphone, ShieldCheck } from "lucide-react";
import { UserAccount, Transaction } from "../types";

interface QRGeneratorProps {
  currentUser: UserAccount;
  receiveToken: string;
  timeLeft: number;
  onRenewToken: () => void;
  onSimulateReceive: (amount: number, senderName: string) => void;
  highContrast?: boolean;
}

export const QRGenerator: React.FC<QRGeneratorProps> = ({
  currentUser,
  receiveToken,
  timeLeft,
  onRenewToken,
  onSimulateReceive,
  highContrast = false
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [showSandboxScan, setShowSandboxScan] = useState<boolean>(false);
  const [sandboxAmount, setSandboxAmount] = useState<string>("5000");
  const [sandboxSender, setSandboxSender] = useState<string>("Mamã Alzira");
  const [justSimulated, setJustSimulated] = useState<boolean>(false);

  // Generate payment URI
  const paymentPayload = useMemo(() => {
    return `kwanzamovel://pay?phone=${currentUser.phone}&name=${encodeURIComponent(currentUser.name)}&token=${receiveToken}&expires=${Date.now() + timeLeft * 1000}`;
  }, [currentUser.phone, currentUser.name, receiveToken]);

  // Deterministic 21x21 matrix for a realistic visual QR code
  const qrGrid = useMemo(() => {
    const size = 21;
    const grid: boolean[][] = Array(size).fill(null).map(() => Array(size).fill(false));

    // Decent hash code
    let hash = 0;
    for (let i = 0; i < paymentPayload.length; i++) {
      hash = (hash << 5) - hash + paymentPayload.charCodeAt(i);
      hash |= 0;
    }

    let seed = Math.abs(hash) || 123456789;
    const pseudorandom = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    const isFinder = (r: number, c: number) => {
      if (r < 7 && c < 7) return true;
      if (r < 7 && c >= size - 7) return true;
      if (r >= size - 7 && c < 7) return true;
      return false;
    };

    const isCenter = (r: number, c: number) => {
      return r >= 9 && r <= 11 && c >= 9 && c <= 11;
    };

    // Filling random data modules
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (isFinder(r, c) || isCenter(r, c)) continue;
        if (r === 6 || c === 6) {
          grid[r][c] = (r + c) % 2 === 0;
        } else {
          grid[r][c] = pseudorandom() > 0.45;
        }
      }
    }

    // Embed finder patterns (Outer bounding outline + solid core)
    const drawFinder = (sr: number, sc: number) => {
      for (let dr = 0; dr < 7; dr++) {
        for (let dc = 0; dc < 7; dc++) {
          const r = sr + dr;
          const c = sc + dc;
          const isOuterBorder = dr === 0 || dr === 6 || dc === 0 || dc === 6;
          const isInnerCore = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
          grid[r][c] = isOuterBorder || isInnerCore;
        }
      }
    };

    drawFinder(0, 0);
    drawFinder(0, size - 7);
    drawFinder(size - 7, 0);

    return grid;
  }, [paymentPayload]);

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(paymentPayload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback
    }
  };

  const executeSandboxScan = () => {
    const amt = parseFloat(sandboxAmount);
    if (isNaN(amt) || amt <= 0) return;
    
    onSimulateReceive(amt, sandboxSender);
    setJustSimulated(true);
    setTimeout(() => {
      setJustSimulated(false);
      setShowSandboxScan(false);
    }, 2500);
  };

  const isExpiringSoon = timeLeft <= 15;

  return (
    <div id="qr_generator_card" className="w-full bg-[#050505] border border-zinc-900 rounded-2xl p-4 space-y-4 shadow-xl">
      
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase bg-[#B87333]/10 text-orange-400 border border-[#B87333]/20 px-2 py-0.5 rounded-md font-bold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>QR Dinâmico Seguro</span>
        </div>
        <button
          id="btn_renew_qr_token"
          onClick={onRenewToken}
          className="text-zinc-500 hover:text-[#B87333] transition-colors p-1"
          title="Regerar Código"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-col items-center justify-center space-y-4">
        
        {/* Dynamic Countdown Radial Ring Housing the QR SVG */}
        <div className="relative p-5 bg-white rounded-3xl shadow-xl flex items-center justify-center">
          
          {/* Radial visual ring surrounding QR Code */}
          <svg className="absolute -inset-0.5 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            <circle
              cx="50"
              cy="50"
              r="48.5"
              fill="transparent"
              stroke={isExpiringSoon ? "rgba(244,63,94,0.1)" : "rgba(184,115,51,0.06)"}
              strokeWidth="1.5"
            />
            <circle
              cx="50"
              cy="50"
              r="48.5"
              fill="transparent"
              stroke={isExpiringSoon ? "#f43f5e" : "#B87333"}
              strokeWidth="2"
              strokeDasharray={2 * Math.PI * 48.5}
              strokeDashoffset={2 * Math.PI * 48.5 * (1 - timeLeft / 60)}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>

          {/* Core Procedural QR Grid */}
          <div className="relative">
            <svg 
              id="qr_code_svg_display" 
              className="w-28 h-28" 
              viewBox="0 0 21 21" 
              fill="black"
            >
              {/* Background */}
              <rect x="0" y="0" width="21" height="21" fill="white" />
              
              {/* Individual matrix module blocks */}
              {qrGrid.map((row, rIdx) => 
                row.map((active, cIdx) => 
                  active ? (
                    <rect 
                      key={`${rIdx}-${cIdx}`} 
                      x={cIdx} 
                      y={rIdx} 
                      width="1.05" 
                      height="1.05" 
                      fill="black"
                      shapeRendering="crispEdges"
                    />
                  ) : null
                )
              )}

              {/* High precision aesthetic brand badge in the center of the QR code */}
              <rect x="9" y="9" width="3" height="3" fill="#B87333" rx="0.5" />
              <rect x="9.75" y="9.75" width="1.5" height="1.5" fill="white" rx="0.3" />
            </svg>
          </div>

        </div>

        {/* Dynamic numerical code display below */}
        <div className="w-full text-center space-y-2">
          
          <div className="bg-zinc-950/60 border border-zinc-900 rounded-xl py-2 px-4 inline-block">
            <span className="text-[9px] font-mono font-black uppercase text-zinc-500 tracking-wider block">Código Numérico Alternativo</span>
            <strong className="text-2xl font-mono tracking-widest text-[#B87333] font-black select-all">
              {receiveToken}
            </strong>
          </div>

          <div className="flex items-center justify-center gap-1.5">
            <Clock className={`w-3.5 h-3.5 ${isExpiringSoon ? "text-rose-500 animate-pulse" : "text-orange-500 animate-spin"}`} />
            <span className={`text-[10px] uppercase font-mono font-bold tracking-wider ${isExpiringSoon ? "text-rose-500" : "text-zinc-400"}`}>
              {isExpiringSoon ? `Expira em ${timeLeft}s (A renovar!)` : `Atualiza em ${timeLeft} segundos`}
            </span>
          </div>

          {/* Utility Quick Buttons */}
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              id="btn_copy_qr_payload"
              onClick={handleCopy}
              className="px-3 py-1.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 rounded-lg text-[9px] uppercase font-mono tracking-wider font-extrabold text-zinc-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#B87333]" />
                  <span>Copiar Link</span>
                </>
              )}
            </button>

            <button
              id="btn_sandbox_tool"
              onClick={() => setShowSandboxScan(!showSandboxScan)}
              className="px-3 py-1.5 bg-[#B87333]/10 hover:bg-[#B87333]/20 border border-[#B87333]/20 rounded-lg text-[9px] uppercase font-mono tracking-wider font-extrabold text-orange-400 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simular Scan</span>
            </button>
          </div>

        </div>

      </div>

      {/* Sandbox simulated scanner panel drawer */}
      {showSandboxScan && (
        <div id="qr_sandbox_simulate_drawer" className="bg-zinc-950 rounded-xl p-3 border border-zinc-900 space-y-3 animate-fade-in text-left">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-1.5">
            <span className="text-[9px] font-mono font-black uppercase text-orange-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping"></span>
              Ferramenta de Sandbox (Simulação)
            </span>
            <button 
              onClick={() => setShowSandboxScan(false)}
              className="text-[9px] text-zinc-500 uppercase hover:text-white font-black"
            >
              Fechar
            </button>
          </div>

          {justSimulated ? (
            <div className="py-4 text-center space-y-2 animate-scale-up">
              <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto animate-bounce">
                <Check className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-extrabold uppercase text-emerald-450 block">Pagamento Recebido!</span>
                <p className="text-[9px] font-mono text-zinc-500 uppercase">
                  +{parseFloat(sandboxAmount).toLocaleString("pt-PT")} Kz recebidos de {sandboxSender}.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[8.5px] font-mono font-black uppercase text-zinc-500 block mb-1">Montante (Kz)</label>
                  <input 
                    type="number"
                    value={sandboxAmount}
                    onChange={(e) => setSandboxAmount(e.target.value)}
                    className="w-full bg-black border border-zinc-900 rounded-lg p-2 text-[11px] font-mono text-white focus:outline-none focus:border-[#B87333]"
                  />
                </div>
                <div>
                  <label className="text-[8.5px] font-mono font-black uppercase text-zinc-500 block mb-1">Quem envia</label>
                  <input 
                    type="text"
                    value={sandboxSender}
                    onChange={(e) => setSandboxSender(e.target.value)}
                    className="w-full bg-black border border-zinc-900 rounded-lg p-2 text-[11px] font-mono text-white focus:outline-none focus:border-[#B87333]"
                  />
                </div>
              </div>

              <button
                id="btn_simulate_qr_scan"
                onClick={executeSandboxScan}
                className="w-full py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-550 hover:to-amber-550 text-white font-extrabold text-[9px] uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Efetuar Envio Simulado</span>
              </button>
              
              <p className="text-[8px] text-zinc-600 uppercase text-center leading-normal">
                Esta ação simula outro telemóvel a ler com sucesso o seu código QR e a depositar moedas físicas ou digitais.
              </p>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
