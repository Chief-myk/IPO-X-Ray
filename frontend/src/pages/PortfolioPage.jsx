import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PromiseTracker from '../components/PromiseTracker';
import { 
  Briefcase, 
  TrendingUp, 
  TrendingDown, 
  ShieldAlert, 
  ShieldCheck, 
  CheckCircle2, 
  ChevronRight, 
  ExternalLink,
  Coins
} from 'lucide-react';

const HOLDINGS = [
  {
    id: 'hld_bajaj_1',
    symbol: 'BAJAJHFL',
    name: 'Bajaj Housing Finance Limited',
    board: 'NSE Mainboard',
    quantity: 214,
    allotmentPrice: 70,
    currentMarketPrice: 132.40,
    investedAmount: 14980,
    currentValue: 28333.60,
    unrealizedGain: 13353.60,
    unrealizedGainPct: 89.14,
    allotmentDate: '2024-09-12',
    realityGapScore: 'Clean (100% Proceeds Met)',
    recentDisclosure: 'H1-FY26 Net Interest Income up 24% YoY; GNPA steady at 0.29% with clean auditor remarks.'
  },
  {
    id: 'hld_kalindi_2',
    symbol: 'KALINDI-SM',
    name: 'Kalindi Smart Mobility Limited',
    board: 'NSE Emerge SME',
    quantity: 1600,
    allotmentPrice: 90,
    currentMarketPrice: 74.20,
    investedAmount: 144000,
    currentValue: 118720,
    unrealizedGain: -25280,
    unrealizedGainPct: -17.56,
    allotmentDate: '2026-10-20',
    realityGapScore: '3 Critical Deviations Detected',
    recentDisclosure: 'Capital expenditure escrow indicates ₹14.2 Cr diverted to vendor Vyom Signal with no plant construction.'
  }
];

export default function PortfolioPage() {
  const [activeTab, setActiveTab] = useState('reality-gap');

  const totalInvested = HOLDINGS.reduce((sum, h) => sum + h.investedAmount, 0);
  const totalValue = HOLDINGS.reduce((sum, h) => sum + h.currentValue, 0);
  const netGain = totalValue - totalInvested;
  const netGainPct = (netGain / totalInvested) * 100;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[11px] font-mono text-[#888888]">
        <Link to="/" className="hover:text-[#D4AF37] no-underline">Home</Link>
        <ChevronRight className="w-3 h-3 text-[#444444]" />
        <Link to="/dashboard" className="hover:text-[#D4AF37] no-underline">Dashboard</Link>
        <ChevronRight className="w-3 h-3 text-[#444444]" />
        <span className="text-white font-medium">Portfolio Surveillance</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#1A1A1A]">
        <div>
          <span className="text-[10px] font-mono text-[#D4AF37] uppercase tracking-wider block font-semibold">Post-Listing Surveillance Desk</span>
          <h1 className="text-xl sm:text-2xl font-bold text-white font-['Cinzel']">
            Portfolio & IPO Reality Gap Desk
          </h1>
          <p className="text-xs text-[#888888] mt-1 font-sans">
            Audit post-listing reality against original DRHP commitments. Continuous tracking of use of proceeds, capex, customer growth, and related-party filings.
          </p>
        </div>

        {/* Portfolio Stats Strip */}
        <div className="p-4 rounded-2xl bg-[#080808] border border-[#1A1A1A] text-xs font-mono text-right flex-none sm:w-68 shadow-xl shadow-black">
          <div className="flex justify-between items-center text-[10px] text-[#777777] mb-1 font-sans">
            <span>Portfolio Valuation</span>
            <span className={netGain >= 0 ? 'text-emerald-400 font-bold font-mono' : 'text-rose-400 font-bold font-mono'}>
              {netGain >= 0 ? `+${netGainPct.toFixed(1)}%` : `${netGainPct.toFixed(1)}%`}
            </span>
          </div>
          <div className="text-xl font-extrabold text-[#F5E59F]">
            ₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <span className="text-[10px] text-[#888888] font-sans mt-0.5 block">
            Invested: ₹{totalInvested.toLocaleString('en-IN')} (Net: {netGain >= 0 ? '+' : ''}₹{netGain.toLocaleString('en-IN', { maximumFractionDigits: 0 })})
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#1A1A1A] pb-2 text-xs">
        <button
          onClick={() => setActiveTab('reality-gap')}
          className={`px-4 py-2 rounded-xl font-bold transition-all ${
            activeTab === 'reality-gap'
              ? 'bg-[#D4AF37]/15 text-[#F5E59F] border border-[#D4AF37]/40 shadow-[0_0_15px_rgba(212,175,55,0.15)]'
              : 'text-[#888888] hover:text-white hover:bg-white/[0.04] border border-transparent'
          }`}
        >
          IPO Reality Gap / Promise-to-Proof
        </button>
        <button
          onClick={() => setActiveTab('holdings')}
          className={`px-4 py-2 rounded-xl font-bold transition-all ${
            activeTab === 'holdings'
              ? 'bg-[#D4AF37]/15 text-[#F5E59F] border border-[#D4AF37]/40 shadow-[0_0_15px_rgba(212,175,55,0.15)]'
              : 'text-[#888888] hover:text-white hover:bg-white/[0.04] border border-transparent'
          }`}
        >
          Demat Holdings ({HOLDINGS.length})
        </button>
      </div>

      {activeTab === 'reality-gap' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#080808] border border-[#1A1A1A] flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-none mt-0.5" />
            <div className="text-xs text-[#888888] leading-relaxed font-sans">
              <strong className="text-white block mb-0.5 font-bold">The Promise-to-Proof Governance Standard:</strong>
              When companies list, management presents quantifiable targets for factory capex, debt repayment, headcount, and municipal contracts. IPO X-Ray 360 freezes those initial claims and programmatically audits post-listing annual reports, EPFO registers, and ROC filings to surface governance divergence before it impacts capital.
            </div>
          </div>

          <div className="rounded-2xl border border-[#1A1A1A] overflow-hidden bg-black p-5 shadow-2xl">
            <PromiseTracker currentCompany="Kalindi Smart Mobility Limited" />
          </div>
        </div>
      )}

      {activeTab === 'holdings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {HOLDINGS.map((h) => {
            const isProfit = h.unrealizedGain >= 0;
            return (
              <div 
                key={h.id}
                className="p-5 sm:p-6 rounded-2xl bg-[#080808] border border-[#1A1A1A] hover:border-[#D4AF37]/40 transition-all flex flex-col justify-between shadow-xl shadow-black"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.05] text-[#F5E59F] border border-[#222222]">
                      {h.board}
                    </span>
                    <span className={`text-xs font-mono font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isProfit ? `+${h.unrealizedGainPct.toFixed(1)}%` : `${h.unrealizedGainPct.toFixed(1)}%`}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white font-['Cinzel']">
                    {h.name}
                  </h3>
                  <span className="text-xs font-mono text-[#888888] block mb-3.5">
                    {h.symbol} · Allotted {h.allotmentDate}
                  </span>

                  <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-[#050505] border border-[#161616] text-xs font-mono mb-3.5">
                    <div>
                      <span className="text-[10px] text-[#777777] font-sans block">Quantity</span>
                      <span className="font-semibold text-white">{h.quantity} shs @ ₹{h.allotmentPrice}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#777777] font-sans block">Current CMP</span>
                      <span className="font-semibold text-white">₹{h.currentMarketPrice.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#777777] font-sans block">Invested</span>
                      <span className="font-semibold text-white">₹{h.investedAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#777777] font-sans block">Current Value</span>
                      <span className="font-bold text-[#D4AF37]">₹{h.currentValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#141414] text-xs">
                  <span className="text-[10px] font-semibold text-[#888888] uppercase tracking-wider block mb-1">
                    Latest Exchange Filing:
                  </span>
                  <p className="text-[11px] text-[#AAAAAA] leading-relaxed font-sans">
                    {h.recentDisclosure}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
