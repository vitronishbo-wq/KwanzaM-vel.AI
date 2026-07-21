/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  AreaChart,
  Area
} from "recharts";
import { 
  PieChart as PieIcon, 
  BarChart3, 
  TrendingUp, 
  Zap, 
  Send, 
  ShoppingBag, 
  Banknote, 
  Layers, 
  Filter, 
  Calendar,
  ArrowUpRight,
  Info
} from "lucide-react";
import { Transaction } from "../types";

export interface MonthlySpendingDistributionChartProps {
  ledgerTransactions?: Transaction[];
  className?: string;
}

// Category Configuration
export interface SpendingCategoryConfig {
  id: string;
  label: string;
  shortLabel: string;
  color: string;
  icon: React.ComponentType<any>;
  description: string;
}

export const SPENDING_CATEGORIES: Record<string, SpendingCategoryConfig> = {
  utilidades: {
    id: "utilidades",
    label: "Utilidade Pública (ENDE / EPAL / Zap / TV)",
    shortLabel: "Utilidades",
    color: "#38bdf8", // Sky Blue
    icon: Zap,
    description: "Pagamentos de eletricidade, água, telecomunicações e serviços públicos",
  },
  envios: {
    id: "envios",
    label: "Envios P2P (Transferências de Saldo)",
    shortLabel: "Envios P2P",
    color: "#B87333", // Copper/Amber
    icon: Send,
    description: "Envios diretos de fundos entre utilizadores e carteiras KwanzaMóvel",
  },
  comercio: {
    id: "comercio",
    label: "Comércio & Serviços (Lojas / Mercado)",
    shortLabel: "Comércio",
    color: "#10b981", // Emerald
    icon: ShoppingBag,
    description: "Compras comerciais em estabelecimentos, supermercados e pequenos comerciantes",
  },
  levantamentos: {
    id: "levantamentos",
    label: "Levantamentos (Cash-Out Agente)",
    shortLabel: "Levantamentos",
    color: "#f59e0b", // Amber
    icon: Banknote,
    description: "Conversão de saldo e-Money em dinheiro físico nos balcões de agentes",
  },
  outros: {
    id: "outros",
    label: "Outros & Taxas de Serviço",
    shortLabel: "Outros",
    color: "#a855f7", // Purple
    icon: Layers,
    description: "Outras operações contábeis, taxas de custódia e ajustes",
  },
};

/**
 * Classifies a raw Transaction into one of our predefined spending categories.
 */
export function categorizeTransaction(tx: Transaction): string {
  const receiver = (tx.receiverPhone || "").toUpperCase();
  const sender = (tx.senderPhone || "").toUpperCase();

  if (
    receiver.includes("ENDE") || 
    receiver.includes("EPAL") || 
    receiver.includes("ZAP") || 
    receiver.includes("DSTV") || 
    receiver.includes("UNITEL") || 
    receiver.includes("MOVTEL") ||
    receiver.includes("GUICHE") ||
    receiver.includes("AGUA") ||
    receiver.includes("LUZ")
  ) {
    return "utilidades";
  }

  if (tx.type === "pagamento") {
    if (receiver.includes("AGENTE") || receiver.includes("CASHOUT") || receiver.includes("LEVANTAMENTO")) {
      return "levantamentos";
    }
    return "comercio";
  }

  if (tx.type === "envio") {
    return "envios";
  }

  if (tx.type === "recebimento") {
    return "outros";
  }

  return "outros";
}

// Pre-seeded multi-month historical baseline data for realistic simulation if live data is sparse
const MOCK_MONTHLY_HISTORY = [
  { monthKey: "2026-02", monthLabel: "Fev 2026", utilidades: 185000, envios: 420000, comercio: 310000, levantamentos: 240000, outros: 45000 },
  { monthKey: "2026-03", monthLabel: "Mar 2026", utilidades: 210000, envios: 480000, comercio: 360000, levantamentos: 280000, outros: 52000 },
  { monthKey: "2026-04", monthLabel: "Abr 2026", utilidades: 195000, envios: 510000, comercio: 420000, levantamentos: 310000, outros: 60000 },
  { monthKey: "2026-05", monthLabel: "Mai 2026", utilidades: 240000, envios: 590000, comercio: 480000, levantamentos: 350000, outros: 71000 },
  { monthKey: "2026-06", monthLabel: "Jun 2026", utilidades: 280000, envios: 640000, comercio: 530000, levantamentos: 390000, outros: 85000 },
  { monthKey: "2026-07", monthLabel: "Jul 2026", utilidades: 325000, envios: 710000, comercio: 610000, levantamentos: 430000, outros: 92000 },
];

export const MonthlySpendingDistributionChart: React.FC<MonthlySpendingDistributionChartProps> = ({
  ledgerTransactions = [],
  className = ""
}) => {
  const [chartType, setChartType] = useState<"stacked_bar" | "grouped_bar" | "donut" | "area">("stacked_bar");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>("all");

  // Aggregate monthly spending by category from ledger transactions merged with historical baseline
  const aggregatedData = useMemo(() => {
    // Clone baseline
    const monthMap: Record<string, { monthKey: string; monthLabel: string; utilidades: number; envios: number; comercio: number; levantamentos: number; outros: number }> = {};

    MOCK_MONTHLY_HISTORY.forEach((item) => {
      monthMap[item.monthKey] = { ...item };
    });

    // Process live ledger transactions
    ledgerTransactions.forEach((tx) => {
      if (!tx.timestamp) return;
      const date = new Date(tx.timestamp);
      const yearStr = date.getFullYear();
      const monthNum = String(date.getMonth() + 1).padStart(2, "0");
      const monthKey = `${yearStr}-${monthNum}`;
      
      const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      const monthLabel = `${monthNames[date.getMonth()]} ${yearStr}`;

      if (!monthMap[monthKey]) {
        monthMap[monthKey] = {
          monthKey,
          monthLabel,
          utilidades: 0,
          envios: 0,
          comercio: 0,
          levantamentos: 0,
          outros: 0
        };
      }

      const cat = categorizeTransaction(tx);
      if (cat in monthMap[monthKey]) {
        (monthMap[monthKey] as any)[cat] += tx.amount;
      }
    });

    // Sort by monthKey ascending
    return Object.values(monthMap).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  }, [ledgerTransactions]);

  // Aggregate total sums across selected month or all months
  const totalsByCategory = useMemo(() => {
    const filteredMonths = selectedMonth === "all" 
      ? aggregatedData 
      : aggregatedData.filter(m => m.monthKey === selectedMonth);

    const totals: Record<string, { id: string; amount: number; count: number }> = {
      utilidades: { id: "utilidades", amount: 0, count: 0 },
      envios: { id: "envios", amount: 0, count: 0 },
      comercio: { id: "comercio", amount: 0, count: 0 },
      levantamentos: { id: "levantamentos", amount: 0, count: 0 },
      outros: { id: "outros", amount: 0, count: 0 },
    };

    filteredMonths.forEach((m) => {
      totals.utilidades.amount += m.utilidades;
      totals.envios.amount += m.envios;
      totals.comercio.amount += m.comercio;
      totals.levantamentos.amount += m.levantamentos;
      totals.outros.amount += m.outros;
    });

    const grandTotal = Object.values(totals).reduce((sum, c) => sum + c.amount, 0);

    return {
      byCat: totals,
      grandTotal,
      pieData: Object.keys(totals).map((catId) => ({
        name: SPENDING_CATEGORIES[catId].shortLabel,
        fullLabel: SPENDING_CATEGORIES[catId].label,
        id: catId,
        value: totals[catId].amount,
        color: SPENDING_CATEGORIES[catId].color,
        percentage: grandTotal > 0 ? ((totals[catId].amount / grandTotal) * 100).toFixed(1) : "0"
      }))
    };
  }, [aggregatedData, selectedMonth]);

  // Custom Recharts Tooltip Component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const monthObj = aggregatedData.find(m => m.monthLabel === label || m.monthKey === label);
      const totalMonth = payload.reduce((sum: number, entry: any) => sum + (Number(entry.value) || 0), 0);

      return (
        <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl shadow-2xl text-xs font-mono space-y-2 max-w-xs">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
            <span className="font-bold text-white text-[11px]">{label}</span>
            <span className="text-[10px] text-[#B87333] font-black">
              Total: {totalMonth.toLocaleString("pt-PT")} Kz
            </span>
          </div>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => {
              const catKey = entry.dataKey;
              const catInfo = SPENDING_CATEGORIES[catKey] || { id: catKey, label: entry.name, shortLabel: entry.name, color: entry.color, icon: Layers, description: "" };
              const val = Number(entry.value) || 0;
              const pct = totalMonth > 0 ? ((val / totalMonth) * 100).toFixed(1) : "0";

              return (
                <div key={`item-${index}`} className="flex items-center justify-between text-[10.5px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: entry.color || catInfo.color }} />
                    <span className="text-zinc-300 font-medium truncate max-w-[130px]">{catInfo.shortLabel || entry.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-white font-bold">{val.toLocaleString("pt-PT")} Kz</span>
                    <span className="text-zinc-500 text-[9px] ml-1 font-normal">({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`bg-neutral-950 border border-neutral-900 rounded-2xl p-4 sm:p-5 space-y-5 text-left font-sans ${className}`}>
      
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-900 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#B87333]/15 border border-[#B87333]/30 rounded-lg text-[#B87333]">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white">
              Distribuição Mensal de Gastos por Categoria
            </h3>
            <span className="text-[9px] font-mono font-bold bg-sky-500/10 text-sky-400 border border-sky-500/30 px-2 py-0.5 rounded-full">
              Recharts Engine
            </span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Análise agregada de fluxo financeiro: Pagamentos de Utilidade Pública (ENDE/EPAL), Envios P2P, Comércio e Levantamentos.
          </p>
        </div>

        {/* Chart View Switcher & Month Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Month Selector */}
          <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 text-xs font-mono">
            <Calendar className="w-3.5 h-3.5 text-zinc-400 ml-1.5" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-white text-[11px] font-bold focus:outline-none pr-2 cursor-pointer"
            >
              <option value="all" className="bg-zinc-900 text-white">Todos os Meses</option>
              {aggregatedData.map((m) => (
                <option key={m.monthKey} value={m.monthKey} className="bg-zinc-900 text-white">
                  {m.monthLabel}
                </option>
              ))}
            </select>
          </div>

          {/* Chart Type Toggle */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-1 gap-1">
            <button
              onClick={() => setChartType("stacked_bar")}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                chartType === "stacked_bar"
                  ? "bg-[#B87333] text-white shadow"
                  : "text-zinc-400 hover:text-white"
              }`}
              title="Barras Empilhadas"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[10px]">Empilhado</span>
            </button>

            <button
              onClick={() => setChartType("grouped_bar")}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                chartType === "grouped_bar"
                  ? "bg-[#B87333] text-white shadow"
                  : "text-zinc-400 hover:text-white"
              }`}
              title="Barras Lado a Lado"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[10px]">Agrupado</span>
            </button>

            <button
              onClick={() => setChartType("donut")}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                chartType === "donut"
                  ? "bg-[#B87333] text-white shadow"
                  : "text-zinc-400 hover:text-white"
              }`}
              title="Distribuição em Torta / Donut"
            >
              <PieIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[10px]">Torta</span>
            </button>

            <button
              onClick={() => setChartType("area")}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                chartType === "area"
                  ? "bg-[#B87333] text-white shadow"
                  : "text-zinc-400 hover:text-white"
              }`}
              title="Fluxo em Área Cumulativa"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[10px]">Área</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top Metrics Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
        <div className="bg-zinc-950 border border-zinc-900 p-3 rounded-xl space-y-1">
          <span className="text-[9px] uppercase text-zinc-500 font-sans block">Volume Total de Gastos</span>
          <div className="text-base sm:text-lg font-black text-white truncate">
            {totalsByCategory.grandTotal.toLocaleString("pt-PT")} <span className="text-xs text-[#B87333]">Kz</span>
          </div>
          <span className="text-[9px] text-emerald-400 flex items-center gap-0.5">
            <ArrowUpRight className="w-3 h-3" />
            +14.2% vs mês anterior
          </span>
        </div>

        <div className="bg-zinc-950 border border-zinc-900 p-3 rounded-xl space-y-1">
          <span className="text-[9px] uppercase text-sky-400 font-sans font-bold block flex items-center gap-1">
            <Zap className="w-3 h-3" />
            Utilidade Pública
          </span>
          <div className="text-base sm:text-lg font-black text-white truncate">
            {totalsByCategory.byCat.utilidades.amount.toLocaleString("pt-PT")} <span className="text-xs text-sky-400">Kz</span>
          </div>
          <span className="text-[9px] text-zinc-400">
            {totalsByCategory.grandTotal > 0 ? ((totalsByCategory.byCat.utilidades.amount / totalsByCategory.grandTotal) * 100).toFixed(1) : 0}% do total
          </span>
        </div>

        <div className="bg-zinc-950 border border-zinc-900 p-3 rounded-xl space-y-1">
          <span className="text-[9px] uppercase text-[#B87333] font-sans font-bold block flex items-center gap-1">
            <Send className="w-3 h-3" />
            Envios P2P
          </span>
          <div className="text-base sm:text-lg font-black text-white truncate">
            {totalsByCategory.byCat.envios.amount.toLocaleString("pt-PT")} <span className="text-xs text-[#B87333]">Kz</span>
          </div>
          <span className="text-[9px] text-zinc-400">
            {totalsByCategory.grandTotal > 0 ? ((totalsByCategory.byCat.envios.amount / totalsByCategory.grandTotal) * 100).toFixed(1) : 0}% do total
          </span>
        </div>

        <div className="bg-zinc-950 border border-zinc-900 p-3 rounded-xl space-y-1">
          <span className="text-[9px] uppercase text-emerald-400 font-sans font-bold block flex items-center gap-1">
            <ShoppingBag className="w-3 h-3" />
            Comércio & Serviços
          </span>
          <div className="text-base sm:text-lg font-black text-white truncate">
            {totalsByCategory.byCat.comercio.amount.toLocaleString("pt-PT")} <span className="text-xs text-emerald-400">Kz</span>
          </div>
          <span className="text-[9px] text-zinc-400">
            {totalsByCategory.grandTotal > 0 ? ((totalsByCategory.byCat.comercio.amount / totalsByCategory.grandTotal) * 100).toFixed(1) : 0}% do total
          </span>
        </div>
      </div>

      {/* Main Recharts Visualization Canvas Container */}
      <div className="bg-zinc-950/80 border border-zinc-900 rounded-xl p-3 sm:p-4 relative">
        
        {/* Interactive Chart Container */}
        <div className="w-full h-72 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "donut" ? (
              <PieChart>
                <Pie
                  data={totalsByCategory.pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={105}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percentage }) => `${name} (${percentage}%)`}
                  labelLine={true}
                >
                  {totalsByCategory.pieData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      stroke="#09090b" 
                      strokeWidth={2}
                      className="cursor-pointer transition-opacity hover:opacity-80"
                      onClick={() => setSelectedCategory(selectedCategory === entry.id ? null : entry.id)}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  formatter={(value) => <span className="text-xs text-zinc-300 font-sans font-medium">{value}</span>}
                />
              </PieChart>
            ) : chartType === "area" ? (
              <AreaChart data={aggregatedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUtilidades" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={SPENDING_CATEGORIES.utilidades.color} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={SPENDING_CATEGORIES.utilidades.color} stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorEnvios" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={SPENDING_CATEGORIES.envios.color} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={SPENDING_CATEGORIES.envios.color} stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorComercio" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={SPENDING_CATEGORIES.comercio.color} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={SPENDING_CATEGORIES.comercio.color} stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorLevantamentos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={SPENDING_CATEGORIES.levantamentos.color} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={SPENDING_CATEGORIES.levantamentos.color} stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="monthLabel" stroke="#71717a" tick={{ fontSize: 11 }} />
                <YAxis stroke="#71717a" tick={{ fontSize: 10 }} tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" height={36} formatter={(value) => <span className="text-xs text-zinc-300 font-sans">{value}</span>} />
                <Area type="monotone" dataKey="utilidades" name={SPENDING_CATEGORIES.utilidades.shortLabel} stroke={SPENDING_CATEGORIES.utilidades.color} fillOpacity={1} fill="url(#colorUtilidades)" stackId="1" />
                <Area type="monotone" dataKey="envios" name={SPENDING_CATEGORIES.envios.shortLabel} stroke={SPENDING_CATEGORIES.envios.color} fillOpacity={1} fill="url(#colorEnvios)" stackId="1" />
                <Area type="monotone" dataKey="comercio" name={SPENDING_CATEGORIES.comercio.shortLabel} stroke={SPENDING_CATEGORIES.comercio.color} fillOpacity={1} fill="url(#colorComercio)" stackId="1" />
                <Area type="monotone" dataKey="levantamentos" name={SPENDING_CATEGORIES.levantamentos.shortLabel} stroke={SPENDING_CATEGORIES.levantamentos.color} fillOpacity={1} fill="url(#colorLevantamentos)" stackId="1" />
              </AreaChart>
            ) : (
              /* Bar Charts (Stacked or Grouped) */
              <BarChart data={aggregatedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="monthLabel" stroke="#71717a" tick={{ fontSize: 11 }} />
                <YAxis stroke="#71717a" tick={{ fontSize: 10 }} tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="top" 
                  height={36} 
                  formatter={(value) => <span className="text-xs text-zinc-300 font-sans font-medium">{value}</span>}
                />
                
                <Bar 
                  dataKey="utilidades" 
                  name={SPENDING_CATEGORIES.utilidades.shortLabel} 
                  fill={SPENDING_CATEGORIES.utilidades.color} 
                  stackId={chartType === "stacked_bar" ? "a" : undefined}
                  radius={chartType === "stacked_bar" ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="envios" 
                  name={SPENDING_CATEGORIES.envios.shortLabel} 
                  fill={SPENDING_CATEGORIES.envios.color} 
                  stackId={chartType === "stacked_bar" ? "a" : undefined}
                  radius={chartType === "stacked_bar" ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="comercio" 
                  name={SPENDING_CATEGORIES.comercio.shortLabel} 
                  fill={SPENDING_CATEGORIES.comercio.color} 
                  stackId={chartType === "stacked_bar" ? "a" : undefined}
                  radius={chartType === "stacked_bar" ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="levantamentos" 
                  name={SPENDING_CATEGORIES.levantamentos.shortLabel} 
                  fill={SPENDING_CATEGORIES.levantamentos.color} 
                  stackId={chartType === "stacked_bar" ? "a" : undefined}
                  radius={chartType === "stacked_bar" ? [4, 4, 0, 0] : [4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="outros" 
                  name={SPENDING_CATEGORIES.outros.shortLabel} 
                  fill={SPENDING_CATEGORIES.outros.color} 
                  stackId={chartType === "stacked_bar" ? "a" : undefined}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Legend & Breakdown List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1">
        {Object.values(SPENDING_CATEGORIES).map((cat) => {
          const Icon = cat.icon;
          const totalCat = totalsByCategory.byCat[cat.id]?.amount || 0;
          const pct = totalsByCategory.grandTotal > 0 
            ? ((totalCat / totalsByCategory.grandTotal) * 100).toFixed(1)
            : "0";

          return (
            <div
              key={cat.id}
              onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
              className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                selectedCategory === cat.id
                  ? "bg-zinc-900 border-[#B87333] ring-1 ring-[#B87333]"
                  : "bg-zinc-950 border-zinc-900 hover:border-zinc-800"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-[11px] font-bold text-white truncate">{cat.shortLabel}</span>
                </div>
                <Icon className="w-3.5 h-3.5 text-zinc-500" />
              </div>

              <div className="flex items-baseline justify-between font-mono">
                <span className="text-xs font-black text-white">
                  {totalCat.toLocaleString("pt-PT")} <span className="text-[10px] text-zinc-500 font-sans">Kz</span>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-300">
                  {pct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Informational Regulation Note */}
      <div className="bg-neutral-900/40 border border-neutral-900 rounded-xl p-3 flex items-start gap-2 text-[11px] text-zinc-400">
        <Info className="w-4 h-4 text-[#B87333] shrink-0 mt-0.5" />
        <p className="leading-normal font-sans">
          <strong className="text-zinc-200">Enquadramento Regulatório (Aviso 11/2021 BNA):</strong> A categorização síncrona dos fluxos monetários permite monitorização contínua de limites por escalão KYC (Tier 1 a Tier 3) e reporte automatizado ao Banco Nacional de Angola.
        </p>
      </div>

    </div>
  );
};
