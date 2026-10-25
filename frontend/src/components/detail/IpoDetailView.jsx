import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import AgentDebate from '../AgentDebate';
import InvestmentSimulator from '../InvestmentSimulator';
import NetworkMap from '../xray/NetworkMap';
import TruthVsHype from '../xray/TruthVsHype';
import { 
  Building2, 
  Calendar, 
  FileText, 
  ShieldAlert, 
  ShieldCheck, 
  Scale, 
  Clock, 
  Calculator, 
  Network, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowUpRight, 
  Download, 
  ExternalLink, 
  Coins, 
  AlertTriangle, 
  Bookmark, 
  BookmarkCheck, 
  Sparkles,
  Layers,
  TrendingDown,
  TrendingUp,
  Share2
} from 'lucide-react';

const DETAIL_TABS = [
  { id: 'overview', label: '1. Overview & Peers', icon: Building2 },
  { id: 'documents', label: '2. Official Filings', icon: FileText },
  { id: 'risk', label: '3. AI Fraud & Risk Audit', icon: ShieldAlert, badge: true },
  { id: 'debate', label: '4. Bull vs Bear Debate', icon: Scale },
  { id: 'hype', label: '5. Truth vs Hype', icon: CheckCircle2 },
  { id: 'timemachine', label: '6. IPO Time Machine', icon: Clock },
  { id: 'simulator', label: '7. Investment Simulator', icon: Calculator },
  { id: 'network', label: '8. Promoter & Vendor Network', icon: Network },
  { id: 'dates', label: '9. Dates & Subscription', icon: Calendar }
];

export default function IpoDetailView({ onBack }) {
  const { selectedIpo, activeDetailTab, setActiveDetailTab, startApplyFlow, watchlist, toggleWatchlist } = useApp();
  const { preferences } = useAuth();

  const ipo = selectedIpo;
  const isSaved = watchlist.includes(ipo?.id);
  const isOpen = ipo?.status === 'open';

  if (!ipo) {
    return (
      <div className="py-20 text-center">
        <p className="text-[#888888]">No IPO selected.</p>
        <button onClick={onBack} className="btn-gold mt-4 px-4 py-2 rounded-xl text-black font-bold text-xs">
          Return to Discovery
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header / Back Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold text-[#888888] hover:text-[#D4AF37] transition-colors group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1 text-[#D4AF37]" />
          <span>Back to All IPOs</span>
        </button>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => toggleWatchlist(ipo.id)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              isSaved
                ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#F5E59F]'
                : 'bg-[#0A0A0A] border-[#222222] text-[#888888] hover:text-white'
            }`}
          >
            {isSaved ? <BookmarkCheck className="w-4 h-4 text-[#D4AF37]" /> : <Bookmark className="w-4 h-4" />}
            <span>{isSaved ? 'In Watchlist' : 'Watchlist'}</span>
          </button>

          {isOpen && (
            <button
              onClick={() => startApplyFlow(ipo)}
              className="btn-gold px-5 py-2 rounded-xl text-xs font-bold text-black flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>Apply for IPO</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Dossier Hero Banner */}
      <div className="relative rounded-3xl bg-gradient-to-br from-[#0C0C0C] via-[#060606] to-[#020202] border border-[#1A1A1A] p-6 sm:p-8 shadow-2xl shadow-black overflow-hidden">
        <div className="pointer-events-none absolute -right-20 -top-20 w-80 h-80 rounded-full bg-[#D4AF37]/10 blur-3xl" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2.5 mb-2.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-white/[0.05] border border-[#222222] text-[#F5E59F]">
                {ipo.board}
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-white/[0.04] border border-[#222222] text-[#888888]">
                {ipo.symbol}
              </span>
              {ipo.riskLevel === 'critical' ? (
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/15 border border-rose-500/35 text-rose-400 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" />
                  Critical Forensic Discrepancies
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/35 text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Clean Forensic Screen
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight font-['Cinzel']">
              {ipo.name}
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-[#888888] leading-relaxed font-sans">
              {ipo.summary}
            </p>
          </div>

          {/* Quick Metrics Capsule */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-3 p-4 rounded-2xl bg-[#080808] border border-[#1A1A1A] text-xs font-mono flex-none lg:w-80 shadow-xl shadow-black">
            <div>
              <span className="text-[10px] text-[#777777] font-sans block">Price Band</span>
              <span className="text-sm font-bold text-white">{ipo.priceBand}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#777777] font-sans block">Lot Size</span>
              <span className="text-sm font-bold text-white">{ipo.lotSize} Shares</span>
            </div>
            <div>
              <span className="text-[10px] text-[#777777] font-sans block">Total Issue Size</span>
              <span className="text-sm font-bold text-[#D4AF37]">{ipo.issueSize}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#777777] font-sans block">Subscription</span>
              <span className="text-sm font-bold text-emerald-400">
                {ipo.subscription?.total ? `${ipo.subscription.total}x` : 'Open'}
              </span>
            </div>
          </div>
        </div>

        {/* Sticky Sub-Navigation Tabs */}
        <div className="mt-8 pt-4 border-t border-[#181818] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {DETAIL_TABS.map((tab) => {
            const active = activeDetailTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveDetailTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  active
                    ? 'bg-[#D4AF37]/15 text-[#F5E59F] border border-[#D4AF37]/40 shadow-[0_0_12px_rgba(212,175,55,0.15)]'
                    : 'text-[#888888] hover:text-white hover:bg-white/[0.04] border border-transparent'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.id === 'risk' && ipo.forensicFlagsCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Module 1: IPO Overview & Peers */}
      {activeDetailTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="p-6 rounded-2xl bg-[#080808] border border-[#1A1A1A] shadow-xl shadow-black">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#D4AF37]" />
                  Business Model & Operations
                </h3>
                <p className="text-xs text-[#888888] leading-relaxed mb-4 font-sans">
                  {ipo.businessModel}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-[#050505] border border-[#161616] text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-[#777777] font-sans block">Fresh Issue Capital</span>
                    <span className="font-semibold text-white">{ipo.freshIssue}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#777777] font-sans block">Promoter OFS</span>
                    <span className="font-semibold text-white">{ipo.ofs}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#777777] font-sans block">Minimum Ticket</span>
                    <span className="font-bold text-[#D4AF37]">₹{ipo.minInvestment.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Financial Highlights */}
              <div className="p-6 rounded-2xl bg-[#080808] border border-[#1A1A1A] shadow-xl shadow-black">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Coins className="w-4 h-4 text-[#D4AF37]" />
                  Financial Highlights & Multi-Year Growth (Audited DRHP)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left font-mono">
                    <thead>
                      <tr className="border-b border-[#1A1A1A] text-[#888888]">
                        <th className="py-2.5 font-medium">Financial Metric</th>
                        <th className="py-2.5 font-medium">FY2024</th>
                        <th className="py-2.5 font-medium">FY2025</th>
                        <th className="py-2.5 font-medium">FY2026 (Annualized)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#141414] text-white">
                      <tr>
                        <td className="py-3 font-sans text-[#AAAAAA]">Revenue from Operations</td>
                        <td className="py-3">{ipo.financials.revenueFY24}</td>
                        <td className="py-3">{ipo.financials.revenueFY25}</td>
                        <td className="py-3 text-[#D4AF37] font-bold">{ipo.financials.revenueFY26}</td>
                      </tr>
                      <tr>
                        <td className="py-3 font-sans text-[#AAAAAA]">Profit After Tax (PAT)</td>
                        <td className="py-3">{ipo.financials.patFY24}</td>
                        <td className="py-3">{ipo.financials.patFY25}</td>
                        <td className="py-3 text-[#D4AF37] font-bold">{ipo.financials.patFY26}</td>
                      </tr>
                      <tr>
                        <td className="py-3 font-sans text-[#AAAAAA]">RoNW (Return on Net Worth)</td>
                        <td className="py-3">-</td>
                        <td className="py-3">-</td>
                        <td className="py-3 text-emerald-400 font-semibold">{ipo.financials.ronw}</td>
                      </tr>
                      <tr>
                        <td className="py-3 font-sans text-[#AAAAAA]">Debt to Equity Ratio</td>
                        <td className="py-3">-</td>
                        <td className="py-3">-</td>
                        <td className="py-3 text-[#F5E59F] font-semibold">{ipo.financials.debtToEquity}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Column: Valuation & Peers */}
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-[#080808] border border-[#1A1A1A] text-xs font-mono shadow-xl shadow-black">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 font-sans">
                  Valuation Metrics vs Industry
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-[#141414]">
                    <span className="text-[#888888] font-sans">Issue P/E (Upper Band)</span>
                    <span className="font-bold text-white">{ipo.financials.pe}x</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[#141414]">
                    <span className="text-[#888888] font-sans">Industry Peer Benchmark P/E</span>
                    <span className="font-semibold text-white">{ipo.financials.industryPe}x</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[#141414]">
                    <span className="text-[#888888] font-sans">Diluted EPS (₹)</span>
                    <span className="font-semibold text-white">{ipo.financials.eps}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-[#888888] font-sans">Total Debt Balance</span>
                    <span className="font-semibold text-rose-400">{ipo.financials.totalDebt}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Module 2: Official Documents */}
      {activeDetailTab === 'documents' && (
        <div className="p-6 rounded-2xl bg-[#080808] border border-[#1A1A1A] shadow-xl shadow-black">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#D4AF37]" />
            Official Regulatory Filings & Documents
          </h3>
          <p className="text-xs text-[#888888] mb-5 font-sans">
            Direct authenticated sources filed with SEBI, NSE, and BSE. Always inspect the primary documents.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ipo.documents.map((doc, idx) => (
              <div 
                key={idx}
                className="p-4 rounded-xl bg-[#050505] border border-[#161616] hover:border-[#D4AF37]/40 transition-colors flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/25 flex items-center justify-center flex-none">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">{doc.name}</span>
                    <span className="text-[10px] font-mono text-[#888888]">
                      {doc.date} · {doc.size} · <strong className="text-[#AAAAAA]">{doc.type}</strong>
                    </span>
                  </div>
                </div>

                <a 
                  href={doc.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-[#111111] hover:bg-[#D4AF37] hover:text-black text-[#888888] border border-[#222222] transition-colors"
                  title="Open Document"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Module 3: AI Fraud & Risk Audit */}
      {activeDetailTab === 'risk' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#080808] border border-[#1A1A1A] shadow-xl shadow-black">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-[#141414]">
              <div>
                <span className="text-xs font-mono text-[#D4AF37] uppercase tracking-wider block font-semibold">Evidence-Backed Fraud Analysis</span>
                <h3 className="text-lg font-bold text-white font-['Cinzel'] mt-0.5">
                  Explainable Risk Assessment & Disclosed Ties
                </h3>
              </div>
              <div className="flex items-center gap-3 bg-[#050505] p-3 rounded-2xl border border-[#161616]">
                <div className="text-right">
                  <span className="text-[10px] font-mono text-[#777777] block">Overall Safety Score</span>
                  <span className="text-base font-bold font-mono text-white">
                    {ipo.riskScore} <span className="text-xs text-[#777777]">/ 100</span>
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center font-bold text-xs font-mono text-[#F5E59F]">
                  {ipo.riskLevel.toUpperCase().slice(0, 3)}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {ipo.forensicHighlights.map((flag, idx) => {
                const isCritical = flag.severity === 'critical';
                const isHigh = flag.severity === 'high';
                return (
                  <div 
                    key={idx}
                    className={`p-4 rounded-xl border ${
                      isCritical
                        ? 'bg-rose-500/10 border-rose-500/35'
                        : isHigh
                        ? 'bg-[#D4AF37]/10 border-[#D4AF37]/35'
                        : 'bg-emerald-500/10 border-emerald-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className={`text-xs font-bold uppercase tracking-wider font-mono flex items-center gap-1.5 ${
                        isCritical ? 'text-rose-400' : isHigh ? 'text-[#F5E59F]' : 'text-emerald-400'
                      }`}>
                        {isCritical ? <ShieldAlert className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                        {flag.title}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/60 border border-white/[0.08] text-[#888888]">
                        Source: {flag.source}
                      </span>
                    </div>
                    <p className="text-xs text-[#888888] leading-relaxed font-sans">
                      {flag.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Module 4: Bull vs Bear Debate */}
      {activeDetailTab === 'debate' && (
        <div className="rounded-2xl border border-[#1A1A1A] overflow-hidden bg-black p-5 shadow-2xl">
          <AgentDebate currentCompany={ipo.name} />
        </div>
      )}

      {/* Module 5: Truth vs Hype */}
      {activeDetailTab === 'hype' && (
        <div className="rounded-2xl border border-[#1A1A1A] overflow-hidden bg-black p-5 shadow-2xl">
          <TruthVsHype />
        </div>
      )}

      {/* Module 6: IPO Time Machine */}
      {activeDetailTab === 'timemachine' && (
        <div className="p-6 rounded-2xl bg-[#080808] border border-[#1A1A1A] shadow-xl shadow-black">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#D4AF37]" />
            IPO Time Machine: Historical Peer Outcomes
          </h3>
          <p className="text-xs text-[#888888] mb-6 font-sans">
            Compares valuation multiples and growth claims against historically similar listings at their original offer dates.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ipo.historicalComparables.map((comp, idx) => (
              <div 
                key={idx}
                className="p-4 rounded-xl bg-[#050505] border border-[#161616] flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-white font-['Cinzel']">{comp.name}</span>
                    <span className="text-[10px] font-mono text-[#888888]">{comp.year}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-3">
                    <div>
                      <span className="text-[10px] text-[#777777] font-sans block">Listing Day</span>
                      <span className={`font-bold ${comp.listingGain.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {comp.listingGain}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#777777] font-sans block">1-Year Return</span>
                      <span className={`font-bold ${comp.return1Y.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {comp.return1Y}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="pt-2 border-t border-[#141414] text-[11px] text-[#888888] font-sans">
                  {comp.outcome}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Module 7: Investment Simulator */}
      {activeDetailTab === 'simulator' && (
        <div className="rounded-2xl border border-[#1A1A1A] overflow-hidden bg-black p-5 shadow-2xl">
          <InvestmentSimulator currentCompany={ipo.name} riskScore={ipo.riskScore} />
        </div>
      )}

      {/* Module 8: Promoter & Vendor Network */}
      {activeDetailTab === 'network' && (
        <div className="p-6 rounded-2xl bg-[#080808] border border-[#1A1A1A] shadow-xl shadow-black space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Network className="w-4 h-4 text-[#D4AF37]" />
              Promoter & Vendor Entity Graph
            </h3>
            <p className="text-xs text-[#888888] mt-1 font-sans">
              Interactive relationship network mapped from ROC filings, shareholding patterns, and supplier invoices.
            </p>
          </div>
          <NetworkMap subject={ipo.name} refreshKey={1} />
        </div>
      )}

      {/* Module 9: Important Dates & Subscription */}
      {activeDetailTab === 'dates' && (
        <div className="p-6 rounded-2xl bg-[#080808] border border-[#1A1A1A] shadow-xl shadow-black">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#D4AF37]" />
            Official Issue Timeline & Live Subscription Multiples
          </h3>
          <p className="text-xs text-[#888888] mb-6 font-sans">
            Key registrar dates and latest verified subscription demands across retail, HNI, and institutional investor quotas.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs font-mono">
            <div>
              <span className="text-xs font-bold text-white font-sans uppercase tracking-wider block mb-4">
                Milestone Schedule
              </span>
              <div className="space-y-4 border-l-2 border-[#1E1E1E] pl-4">
                <div>
                  <span className="text-[10px] text-[#777777] block font-sans">Issue Closing Date</span>
                  <span className="font-bold text-white text-sm">{ipo.closeDate}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#777777] block font-sans">Basis of Allotment</span>
                  <span className="font-bold text-[#D4AF37] text-sm">{ipo.allotmentDate}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#777777] block font-sans">Refund / Unblocking</span>
                  <span className="font-bold text-white text-sm">{ipo.refundDate}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#777777] block font-sans">Exchange Listing</span>
                  <span className="font-bold text-emerald-400 text-sm">{ipo.listingDate}</span>
                </div>
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-white font-sans uppercase tracking-wider block mb-4">
                Live Subscription Breakdown
              </span>
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-[#050505] border border-[#161616] flex justify-between items-center">
                  <span className="font-sans text-[#888888]">Retail Individual (RII)</span>
                  <span className="font-bold text-white">{ipo.subscription?.retail || 'Awaiting'}x</span>
                </div>
                <div className="p-3 rounded-xl bg-[#050505] border border-[#161616] flex justify-between items-center">
                  <span className="font-sans text-[#888888]">Non-Institutional (NII/HNI)</span>
                  <span className="font-bold text-white">{ipo.subscription?.nii || 'Awaiting'}x</span>
                </div>
                <div className="p-3 rounded-xl bg-[#050505] border border-[#161616] flex justify-between items-center">
                  <span className="font-sans text-[#888888]">Qualified Institutional (QIB)</span>
                  <span className="font-bold text-white">{ipo.subscription?.qib || 'Awaiting'}x</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/35 flex justify-between items-center">
                  <span className="font-sans font-bold text-[#F5E59F]">Total Composite Subscription</span>
                  <span className="font-extrabold text-[#F5E59F] text-base">{ipo.subscription?.total || 'Awaiting'}x</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
