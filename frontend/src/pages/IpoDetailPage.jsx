import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { IPO_CATALOG } from '../data/ipoCatalog';

import AgentDebate from '../components/AgentDebate';
import InvestmentSimulator from '../components/InvestmentSimulator';
import NetworkMap from '../components/xray/NetworkMap';
import TruthVsHype from '../components/xray/TruthVsHype';

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
  ExternalLink,
  Coins,
  AlertTriangle,
  Bookmark,
  BookmarkCheck,
  ChevronRight,
  Share2,
  Check,
  SearchX
} from 'lucide-react';

const TABS = [
  { id: 'overview', label: 'Financials & Peers', icon: Building2 },
  { id: 'documents', label: 'Official Filings', icon: FileText },
  { id: 'risk', label: 'AI Forensic Risk Audit', icon: ShieldAlert },
  { id: 'debate', label: 'Bull vs Bear Debate', icon: Scale },
  { id: 'hype', label: 'Truth vs Hype', icon: CheckCircle2 },
  { id: 'timemachine', label: 'IPO Time Machine', icon: Clock },
  { id: 'simulator', label: 'Investment Simulator', icon: Calculator },
  { id: 'network', label: 'Promoter & Vendor Graph', icon: Network },
  { id: 'dates', label: 'Subscription & Dates', icon: Calendar }
];

const TAB_STICKY_TOP = 'top-[100px] lg:top-[61px]';
const FOCUS = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/60';

const RISK_META = {
  critical: { text: 'text-rose-400', bar: 'bg-rose-500' },
  medium: { text: 'text-[#D4AF37]', bar: 'bg-[#D4AF37]' },
  clear: { text: 'text-emerald-400', bar: 'bg-emerald-500' }
};

const SEVERITY = {
  critical: { box: 'bg-rose-500/10 border-rose-500/35', icon: ShieldAlert, tone: 'text-rose-400' },
  high: { box: 'bg-[#D4AF37]/10 border-[#D4AF37]/35', icon: AlertTriangle, tone: 'text-[#F5E59F]' },
  default: { box: 'bg-emerald-500/10 border-emerald-500/35', icon: ShieldCheck, tone: 'text-emerald-400' }
};

function Card({ children, className = '' }) {
  return <div className={`p-6 rounded-2xl bg-[#080808] border border-[#1A1A1A] shadow-xl shadow-black ${className}`}>{children}</div>;
}

function SectionTitle({ icon: Icon, title, sub }) {
  return (
    <div className="mb-5">
      <h3 className="flex items-center gap-2.5 text-sm font-bold text-white tracking-wide">
        {Icon && (
          <span className="grid place-items-center w-7 h-7 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/25">
            <Icon className="w-4 h-4" />
          </span>
        )}
        {title}
      </h3>
      {sub && <p className="text-xs text-[#888888] mt-1">{sub}</p>}
    </div>
  );
}

function StatRow({ label, value, tone = 'text-white', last }) {
  return (
    <div className={`flex items-center justify-between gap-3 py-2.5 ${last ? '' : 'border-b border-[#141414]'}`}>
      <span className="text-[#888888]">{label}</span>
      <span className={`font-mono font-semibold ${tone}`}>{value}</span>
    </div>
  );
}

function RiskGauge({ score = 0, level, size = 68, label }) {
  const meta = RISK_META[level] || RISK_META.medium;
  const r = 26;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score));
  return (
    <div className={`relative flex-none ${meta.text}`} style={{ width: size, height: size }} role="img" aria-label={`Risk score ${score} out of 100${label ? `, ${label}` : ''}`}>
      <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="6" />
        <motion.circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - pct / 100) }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center font-mono font-bold" style={{ fontSize: size * 0.28 }}>
        {score}
      </span>
    </div>
  );
}

function MultipleRow({ label, value }) {
  const v = value || 0;
  return (
    <div className="p-3.5 rounded-xl bg-[#050505] border border-[#161616]">
      <div className="flex items-center justify-between mb-2">
        <span className="font-sans text-[#888888] text-xs">{label}</span>
        <span className={`font-bold font-mono ${v >= 1 ? 'text-white' : 'text-[#D4AF37]'}`}>{v}x</span>
      </div>
      <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
        <div className={`h-full rounded-full ${v >= 1 ? 'bg-emerald-400' : 'bg-[#D4AF37]'}`} style={{ width: `${Math.min(v, 100)}%` }} />
      </div>
    </div>
  );
}

export default function IpoDetailPage() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { watchlist, toggleWatchlist } = useApp();
  const [copied, setCopied] = useState(false);

  const ipo = IPO_CATALOG.find((item) => item.id === id);

  const activeTab = searchParams.get('tab') || 'overview';
  const setActiveTab = (tabId) => setSearchParams({ tab: tabId }, { replace: true });

  const isSaved = ipo ? watchlist.includes(ipo.id) : false;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) {
      console.error('Copy failed:', e);
    }
  };

  if (!ipo) {
    return (
      <div className="py-20 text-center rounded-2xl bg-[#080808] border border-dashed border-[#222222]">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white/[0.04] grid place-items-center">
          <SearchX className="w-5 h-5 text-[#888888]" />
        </div>
        <p className="text-sm font-semibold text-white">Issue record not found</p>
        <p className="text-xs text-[#888888] mt-1">This IPO is not in the directory. It may have been removed or the link is wrong.</p>
        <Link to="/dashboard" className={`btn-gold mt-4 inline-block px-4 py-2 rounded-xl text-black text-xs font-bold no-underline ${FOCUS}`}>
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const risk = RISK_META[ipo.riskLevel] || RISK_META.medium;

  return (
    <MotionConfig reducedMotion="user">
      <div className="space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[11px] font-mono text-[#888888]" aria-label="Breadcrumb">
          <Link to="/dashboard" className={`flex items-center gap-1 hover:text-[#D4AF37] no-underline rounded ${FOCUS}`}>
            <ArrowLeft className="w-3 h-3" />
            IPO Dashboard
          </Link>
          <ChevronRight className="w-3 h-3 text-[#444444]" />
          <span className="text-white font-medium truncate" aria-current="page">{ipo.name}</span>
        </nav>

        {/* Dossier banner in Pure Black with Gold Accents */}
        <div className="relative p-7 rounded-2xl bg-gradient-to-br from-[#0C0C0C] via-[#060606] to-[#020202] border border-[#1C1C1C] overflow-hidden shadow-2xl shadow-black">
          <div className={`pointer-events-none absolute top-0 inset-x-0 h-0.5 ${risk.bar}`} aria-hidden="true" />

          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-3.5 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono bg-white/[0.05] border border-[#222222] text-[#F5E59F] font-semibold">{ipo.board}</span>
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono bg-[#0F0F0F] border border-[#222222] text-[#888888]">{ipo.symbol}</span>
                {ipo.status === 'open' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <span className="relative flex w-1.5 h-1.5">
                      <span className="absolute inset-0 rounded-full bg-emerald-400 opacity-60 animate-ping motion-reduce:animate-none" />
                      <span className="relative w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    </span>
                    Live Bidding
                  </span>
                )}
                {ipo.riskLevel === 'critical' ? (
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" />
                    {ipo.forensicFlagsCount} Forensic Flags
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Clean Forensic Screen
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-['Cinzel']">
                {ipo.name}
              </h1>
              <p className="mt-2 text-xs text-[#888888] leading-relaxed font-sans">{ipo.summary}</p>
            </div>

            {/* Gauge + financial capsule + actions */}
            <div className="flex flex-col gap-3 flex-none lg:w-80">
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#060606] border border-[#181818]">
                <RiskGauge score={ipo.riskScore} level={ipo.riskLevel} label={ipo.riskLabel} />
                <div>
                  <span className="text-[10px] text-[#777777] block font-sans">Forensic risk assessment</span>
                  <span className={`text-sm font-bold ${risk.text}`}>{ipo.riskLabel}</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('risk')}
                    className={`block text-[11px] text-[#D4AF37] hover:underline mt-0.5 rounded ${FOCUS}`}
                  >
                    View audit highlights
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#060606] border border-[#181818] text-xs font-mono">
                <div>
                  <span className="text-[10px] text-[#777777] font-sans block">Price Band</span>
                  <span className="font-bold text-white">{ipo.priceBand}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#777777] font-sans block">Issue Size</span>
                  <span className="font-bold text-[#D4AF37]">{ipo.issueSize}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#777777] font-sans block">Lot Size</span>
                  <span className="font-bold text-white">{ipo.lotSize} shs</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#777777] font-sans block">Subscription</span>
                  <span className="font-bold text-emerald-400">{ipo.subscription?.total ? `${ipo.subscription.total}x` : 'Open'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleWatchlist(ipo.id)}
                  aria-pressed={isSaved}
                  className={`flex-1 py-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${FOCUS} ${
                    isSaved ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#F5E59F]' : 'bg-[#0E0E0E] border-[#222222] text-[#888888] hover:text-white hover:border-[#333333]'
                  }`}
                >
                  {isSaved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                  <span>{isSaved ? 'In Watchlist' : 'Watchlist'}</span>
                </button>

                <button
                  onClick={handleShare}
                  aria-label="Copy link to this dossier"
                  title={copied ? 'Link copied' : 'Copy link'}
                  className={`p-2 rounded-xl border bg-[#0E0E0E] transition-all ${FOCUS} ${
                    copied ? 'border-emerald-500 text-emerald-400' : 'border-[#222222] text-[#888888] hover:text-white hover:border-[#333333]'
                  }`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                </button>

                <Link
                  to={`/apply/${ipo.id}`}
                  className={`btn-gold flex-1 py-2 rounded-xl text-xs font-bold text-black flex items-center justify-center gap-1 transition-all no-underline ${FOCUS}`}
                >
                  <span>Prepare Bid</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky luxury tab bar */}
        <div className={`sticky ${TAB_STICKY_TOP} z-30`}>
          <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-black/95 backdrop-blur-2xl border border-[#1C1C1C] overflow-x-auto no-scrollbar shadow-xl shadow-black" role="tablist">
            {TABS.map((tab) => {
              const active = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${FOCUS} ${
                    active ? 'text-[#F5E59F] font-bold' : 'text-[#888888] hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="detail-tab-pill"
                      className="absolute inset-0 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 shadow-[0_0_15px_rgba(212,175,55,0.15)]"
                      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                    />
                  )}
                  <span className="relative flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                    {tab.id === 'risk' && ipo.forensicFlagsCount > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" aria-label="Has forensic flags" />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab content panels */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            role="tabpanel"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.14 }}
          >
            {/* Overview */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <Card>
                    <SectionTitle icon={Building2} title="Operational model & stated capabilities" />
                    <p className="text-xs text-[#888888] leading-relaxed mb-4 max-w-prose font-sans">{ipo.businessModel}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-[#050505] border border-[#161616] text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-[#777777] font-sans block">Fresh Issue Capital</span>
                        <span className="text-white font-semibold">{ipo.freshIssue}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#777777] font-sans block">Promoter OFS</span>
                        <span className="text-white font-semibold">{ipo.ofs}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#777777] font-sans block">Minimum Ticket</span>
                        <span className="text-[#D4AF37] font-semibold">₹{ipo.minInvestment?.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </Card>

                  <Card>
                    <SectionTitle icon={Coins} title="Audited restated financials" sub="Source: Certified DRHP offer documents" />
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left font-mono">
                        <thead>
                          <tr className="border-b border-[#1A1A1A] text-[#888888] text-[11px]">
                            <th className="py-2.5 font-medium">Metric</th>
                            <th className="py-2.5 font-medium text-right">FY24</th>
                            <th className="py-2.5 font-medium text-right">FY25</th>
                            <th className="py-2.5 font-medium text-right">FY26</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#141414] text-white">
                          <tr>
                            <td className="py-3 font-sans text-[#888888]">Revenue from Operations</td>
                            <td className="py-3 text-right">{ipo.financials.revenueFY24}</td>
                            <td className="py-3 text-right">{ipo.financials.revenueFY25}</td>
                            <td className="py-3 text-right text-[#D4AF37] font-bold">{ipo.financials.revenueFY26}</td>
                          </tr>
                          <tr>
                            <td className="py-3 font-sans text-[#888888]">Profit After Tax (PAT)</td>
                            <td className="py-3 text-right">{ipo.financials.patFY24}</td>
                            <td className="py-3 text-right">{ipo.financials.patFY25}</td>
                            <td className="py-3 text-right text-[#D4AF37] font-bold">{ipo.financials.patFY26}</td>
                          </tr>
                          <tr>
                            <td className="py-3 font-sans text-[#888888]">Return on Net Worth (RoNW)</td>
                            <td className="py-3 text-right text-[#888888]">-</td>
                            <td className="py-3 text-right text-[#888888]">-</td>
                            <td className="py-3 text-right text-emerald-400 font-semibold">{ipo.financials.ronw}</td>
                          </tr>
                          <tr>
                            <td className="py-3 font-sans text-[#888888]">Debt to Equity</td>
                            <td className="py-3 text-right text-[#888888]">-</td>
                            <td className="py-3 text-right text-[#888888]">-</td>
                            <td className="py-3 text-right text-[#F5E59F] font-semibold">{ipo.financials.debtToEquity}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>

                <div className="space-y-5">
                  <Card className="!p-5 text-xs">
                    <h4 className="text-xs font-bold text-white mb-2 tracking-wide">Valuation multiples</h4>
                    <StatRow label="Issue P/E (upper band)" value={`${ipo.financials.pe}x`} />
                    <StatRow label="Industry peer benchmark" value={`${ipo.financials.industryPe}x`} />
                    <StatRow label="Diluted EPS" value={ipo.financials.eps} />
                    <StatRow label="Total balance debt" value={ipo.financials.totalDebt} last />
                  </Card>

                  <Card className="!p-5 text-xs">
                    <h4 className="text-xs font-bold text-white mb-2 tracking-wide">Offer quotas</h4>
                    <StatRow label="QIB quota" value={ipo.qibQuota} />
                    <StatRow label="NII / HNI quota" value={ipo.niiQuota} />
                    <StatRow label="Retail (RII)" value={ipo.retailQuota} last />
                  </Card>
                </div>
              </div>
            )}

            {/* Official Filings */}
            {activeTab === 'documents' && (
              <Card>
                <SectionTitle icon={FileText} title="Statutory prospectus & exchange filings" sub="Verified original records from SEBI, NSE, and BSE." />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {(ipo.documents || []).map((doc, idx) => (
                    <a
                      key={idx}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open ${doc.name} in a new tab`}
                      className={`group p-4 rounded-xl bg-[#050505] border border-[#181818] hover:border-[#D4AF37]/50 flex items-center justify-between gap-3 transition-colors no-underline ${FOCUS}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="grid place-items-center w-10 h-10 rounded-xl bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/25 flex-none">
                          <FileText className="w-5 h-5" />
                        </span>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-white block truncate group-hover:text-[#F5E59F] transition-colors">{doc.name}</span>
                          <span className="text-[10px] font-mono text-[#888888]">{doc.date} · {doc.size} · {doc.type}</span>
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-[#888888] group-hover:text-[#D4AF37] transition-colors flex-none" />
                    </a>
                  ))}
                </div>
              </Card>
            )}

            {/* Forensic Risk Audit */}
            {activeTab === 'risk' && (
              <Card className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-mono text-[#888888] block">Explainable classifier</span>
                    <h3 className="text-lg font-bold text-white font-['Cinzel']">Documented forensic flags & anomalies</h3>
                  </div>
                  <div className="flex items-center gap-3 flex-none">
                    <div className="text-right">
                      <span className={`block text-xs font-bold ${risk.text}`}>{ipo.riskLabel}</span>
                      <span className="block text-[10px] text-[#888888] font-mono">out of 100</span>
                    </div>
                    <RiskGauge score={ipo.riskScore} level={ipo.riskLevel} size={72} label={ipo.riskLabel} />
                  </div>
                </div>

                <div className="space-y-3.5">
                  {(ipo.forensicHighlights || []).map((flag, idx) => {
                    const s = SEVERITY[flag.severity] || SEVERITY.default;
                    const SevIcon = s.icon;
                    return (
                      <div key={idx} className={`p-4 rounded-xl border ${s.box}`}>
                        <div className="flex items-start justify-between gap-3 mb-1.5">
                          <div className="flex items-center gap-2">
                            <SevIcon className={`w-4 h-4 flex-none ${s.tone}`} />
                            <span className="text-xs font-bold text-white">{flag.title}</span>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/60 border border-white/[0.08] text-[#888888] flex-none">{flag.source}</span>
                        </div>
                        <p className="text-xs text-[#888888] pl-6 leading-relaxed max-w-prose font-sans">{flag.description}</p>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Bull vs Bear Debate */}
            {activeTab === 'debate' && (
              <div className="rounded-2xl border border-[#1A1A1A] overflow-hidden bg-black p-5 shadow-2xl">
                <AgentDebate currentCompany={ipo.name} />
              </div>
            )}

            {/* Truth vs Hype */}
            {activeTab === 'hype' && (
              <div className="rounded-2xl border border-[#1A1A1A] overflow-hidden bg-black p-5 shadow-2xl">
                <TruthVsHype />
              </div>
            )}

            {/* Time Machine */}
            {activeTab === 'timemachine' && (
              <Card>
                <SectionTitle icon={Clock} title="IPO Time Machine" sub="Comparable historical precedents, identified strictly at their time of listing to avoid survivorship bias." />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(ipo.historicalComparables || []).map((comp, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-[#050505] border border-[#181818] flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-xs font-bold text-white">{comp.name}</span>
                          <span className="text-[10px] font-mono text-[#888888]">{comp.year}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm font-mono mb-3">
                          <div>
                            <span className="text-[10px] text-[#777777] font-sans block">Day 1</span>
                            <span className={`font-bold ${comp.listingGain?.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>{comp.listingGain}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#777777] font-sans block">1 Year</span>
                            <span className={`font-bold ${comp.return1Y?.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>{comp.return1Y}</span>
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] text-[#888888] block pt-3 border-t border-[#161616] leading-relaxed font-sans">{comp.outcome}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Simulator */}
            {activeTab === 'simulator' && (
              <div className="rounded-2xl border border-[#1A1A1A] overflow-hidden bg-black p-5 shadow-2xl">
                <InvestmentSimulator currentCompany={ipo.name} riskScore={ipo.riskScore} />
              </div>
            )}

            {/* Network */}
            {activeTab === 'network' && (
              <Card className="space-y-4">
                <SectionTitle icon={Network} title="Corporate entity & vendor ties" />
                <NetworkMap subject={ipo.name} refreshKey={1} />
              </Card>
            )}

            {/* Dates & Subscription */}
            {activeTab === 'dates' && (
              <Card>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs font-mono">
                  <div>
                    <SectionTitle icon={Calendar} title="Issue timeline calendar" />
                    <ol className="relative ml-2 border-l border-[#222222] space-y-6">
                      {[
                        { label: 'Bidding closes', value: ipo.closeDate, tone: 'text-white', dot: 'bg-white' },
                        { label: 'Allotment date', value: ipo.allotmentDate, tone: 'text-[#D4AF37]', dot: 'bg-[#D4AF37]' },
                        { label: 'Listing date', value: ipo.listingDate, tone: 'text-emerald-400', dot: 'bg-emerald-400' }
                      ].map((step) => (
                        <li key={step.label} className="relative pl-6">
                          <span className={`absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full ring-4 ring-[#080808] ${step.dot}`} />
                          <span className="block font-sans text-[#888888]">{step.label}</span>
                          <span className={`block text-sm font-bold ${step.tone}`}>{step.value}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div>
                    <SectionTitle icon={Coins} title="Live bidding multiples" />
                    <div className="space-y-3">
                      <MultipleRow label="Retail quota" value={ipo.subscription?.retail} />
                      <MultipleRow label="NII / HNI quota" value={ipo.subscription?.nii} />
                      <MultipleRow label="QIB quota" value={ipo.subscription?.qib} />
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
