import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { IPO_CATALOG, SECTORS, BOARDS, RISK_LEVELS } from '../data/ipoCatalog';
import {
  Search,
  Activity,
  ShieldAlert,
  ShieldCheck,
  ArrowUpRight,
  LayoutGrid,
  Table as TableIcon,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Bookmark,
  BookmarkCheck,
  Coins,
  Radio,
  ScanSearch,
  X,
  ChevronDown
} from 'lucide-react';

const STATUS_TABS = [
  { id: 'all', label: 'All Issues' },
  { id: 'open', label: 'Live Bidding' },
  { id: 'upcoming', label: 'Upcoming Filings' },
  { id: 'closed', label: 'Awaiting Allotment' },
  { id: 'listed', label: 'Newly Listed' },
  { id: 'recommended', label: 'AI Risk-Screened' },
  { id: 'watchlist', label: 'My Watchlist', icon: Bookmark }
];

const STATUS_META = {
  open: { label: 'Live', text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', dot: 'bg-emerald-400', pulse: true },
  upcoming: { label: 'Upcoming', text: 'text-sky-400', bg: 'bg-sky-400/10', border: 'border-sky-400/30', dot: 'bg-sky-400' },
  closed: { label: 'Allotment', text: 'text-[#F5E59F]', bg: 'bg-[#D4AF37]/10', border: 'border-[#D4AF37]/30', dot: 'bg-[#D4AF37]' },
  listed: { label: 'Listed', text: 'text-purple-300', bg: 'bg-purple-400/10', border: 'border-purple-400/30', dot: 'bg-purple-300' }
};

const RISK_META = {
  critical: { text: 'text-rose-400', bar: 'bg-rose-500', edge: 'border-l-rose-500' },
  medium: { text: 'text-[#D4AF37]', bar: 'bg-[#D4AF37]', edge: 'border-l-[#D4AF37]' },
  clear: { text: 'text-emerald-400', bar: 'bg-emerald-500', edge: 'border-l-emerald-500' }
};

function StatusPill({ status }) {
  const m = STATUS_META[status];
  if (!m) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${m.bg} ${m.text} ${m.border}`}>
      <span className="relative flex w-1.5 h-1.5">
        {m.pulse && <span className={`absolute inset-0 rounded-full ${m.dot} opacity-60 animate-ping motion-reduce:animate-none`} />}
        <span className={`relative w-1.5 h-1.5 rounded-full ${m.dot}`} />
      </span>
      {m.label}
    </span>
  );
}

function RiskBadge({ ipo }) {
  if (ipo.riskLevel === 'critical')
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
        <ShieldAlert className="w-3 h-3 flex-none" />
        {ipo.forensicFlagsCount} {ipo.forensicFlagsCount === 1 ? 'Flag' : 'Flags'}
      </span>
    );
  if (ipo.riskLevel === 'medium')
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-semibold bg-[#D4AF37]/15 text-[#F5E59F] border border-[#D4AF37]/35">
        <AlertTriangle className="w-3 h-3 flex-none text-[#D4AF37]" />
        Moderate
      </span>
    );
  if (ipo.riskLevel === 'clear')
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
        <ShieldCheck className="w-3 h-3 flex-none" />
        Verified Clean
      </span>
    );
  return null;
}

function SubscriptionMeter({ total, align = 'right' }) {
  const hot = total > 10;
  const pct = Math.min(total || 0, 100);
  return (
    <div className={`flex flex-col gap-1 ${align === 'right' ? 'items-end' : 'items-start'}`}>
      <span className={`font-bold font-mono ${hot ? 'text-emerald-400' : 'text-white'}`}>{total ? `${total}x` : '-'}</span>
      <span className="w-16 h-1 rounded-full bg-white/[0.08] overflow-hidden">
        <span className={`block h-full rounded-full ${hot ? 'bg-emerald-400' : 'bg-[#D4AF37]'}`} style={{ width: `${pct}%` }} />
      </span>
    </div>
  );
}

function WatchButton({ saved, onToggle, size = 'w-3.5 h-3.5' }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className="p-1 rounded-md text-[#888888] hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/60 transition-colors"
      aria-label={saved ? 'Remove from watchlist' : 'Add to watchlist'}
      aria-pressed={saved}
    >
      {saved ? <BookmarkCheck className={`${size} text-[#D4AF37]`} /> : <Bookmark className={`${size} opacity-60`} />}
    </button>
  );
}

function FilterSelect({ value, onChange, options, label, defaultValue }) {
  const active = value !== defaultValue;
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className={`appearance-none pl-3 pr-8 py-2 rounded-xl bg-[#0A0A0A] border text-xs text-white cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50 transition-colors ${
          active ? 'border-[#D4AF37] text-[#F5E59F]' : 'border-[#222222] hover:border-[#333333]'
        }`}
      >
        {options.map((o) => (
          <option key={o} value={o} className="bg-[#0A0A0A] text-white">{o}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-[#888888] pointer-events-none" />
    </div>
  );
}

function StatTile({ icon: Icon, label, value, unit, sub, tone = 'text-white', iconTone = 'text-[#D4AF37]', bar }) {
  return (
    <div className="relative p-5 rounded-2xl bg-gradient-to-b from-[#0C0C0C] to-[#040404] border border-[#1A1A1A] hover:border-[#D4AF37]/40 transition-all duration-300 overflow-hidden group shadow-lg shadow-black/80">
      <div className="flex items-start justify-between">
        <span className="text-[11px] text-[#888888] font-sans font-medium uppercase tracking-wider">{label}</span>
        <span className={`p-2 rounded-xl bg-[#111111] border border-[#222222] group-hover:border-[#D4AF37]/40 transition-colors ${iconTone}`}>
          <Icon className="w-4 h-4" />
        </span>
      </div>
      <div className={`mt-3 text-2xl font-extrabold tracking-tight font-mono ${tone}`}>
        {value}
        {unit && <span className="ml-1.5 text-xs font-semibold text-[#888888]">{unit}</span>}
      </div>
      <p className="mt-1 text-[11px] text-[#777777] font-sans">{sub}</p>
      {bar !== undefined && (
        <div className="mt-3.5 h-1 rounded-full bg-white/[0.08] overflow-hidden">
          <div className={`h-full rounded-full ${iconTone === 'text-rose-400' ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${bar}%` }} />
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const { watchlist, toggleWatchlist } = useApp();
  const { preferences } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [viewMode, setViewMode] = useState('table');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'all');
  const [selectedSector, setSelectedSector] = useState('All Sectors');
  const [selectedBoard, setSelectedBoard] = useState('All Boards');
  const [selectedRisk, setSelectedRisk] = useState('All Risk Levels');
  const [sortBy, setSortBy] = useState('date');

  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) setSearchQuery(q);
    const tab = searchParams.get('tab');
    if (tab !== null) setActiveTab(tab);
  }, [searchParams]);

  const openCount = useMemo(() => IPO_CATALOG.filter((i) => i.status === 'open').length, []);

  const tabCounts = useMemo(() => {
    const c = { all: IPO_CATALOG.length, watchlist: watchlist.length };
    ['open', 'upcoming', 'closed', 'listed'].forEach((s) => {
      c[s] = IPO_CATALOG.filter((i) => i.status === s).length;
    });
    c.recommended = IPO_CATALOG.filter(
      (i) => preferences.preferredSectors?.includes(i.sector) || i.riskLevel === 'clear'
    ).length;
    return c;
  }, [watchlist, preferences]);

  const filteredIpos = useMemo(() => {
    return IPO_CATALOG.filter((ipo) => {
      if (activeTab === 'open' && ipo.status !== 'open') return false;
      if (activeTab === 'upcoming' && ipo.status !== 'upcoming') return false;
      if (activeTab === 'closed' && ipo.status !== 'closed') return false;
      if (activeTab === 'listed' && ipo.status !== 'listed') return false;
      if (activeTab === 'watchlist' && !watchlist.includes(ipo.id)) return false;
      if (activeTab === 'recommended') {
        const sectorMatch = preferences.preferredSectors?.includes(ipo.sector);
        const isClean = ipo.riskLevel === 'clear';
        if (!sectorMatch && !isClean) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!ipo.name.toLowerCase().includes(q) && !ipo.symbol.toLowerCase().includes(q) && !ipo.sector.toLowerCase().includes(q)) {
          return false;
        }
      }

      if (selectedSector !== 'All Sectors' && ipo.sector !== selectedSector) return false;
      if (selectedBoard !== 'All Boards' && ipo.board !== selectedBoard) return false;
      if (selectedRisk === 'Clean / Low Risk' && ipo.riskLevel !== 'clear') return false;
      if (selectedRisk === 'Moderate Risk' && ipo.riskLevel !== 'medium') return false;
      if (selectedRisk === 'Critical Forensic Flags' && ipo.riskLevel !== 'critical') return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'size') return b.issueSizeCr - a.issueSizeCr;
      if (sortBy === 'subscription') return (b.subscription?.total || 0) - (a.subscription?.total || 0);
      if (sortBy === 'risk') return a.riskScore - b.riskScore;
      return 0;
    });
  }, [activeTab, searchQuery, selectedSector, selectedBoard, selectedRisk, sortBy, watchlist, preferences]);

  const hasActiveFilters =
    selectedSector !== 'All Sectors' || selectedBoard !== 'All Boards' || selectedRisk !== 'All Risk Levels' || searchQuery;

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedSector('All Sectors');
    setSelectedBoard('All Boards');
    setSelectedRisk('All Risk Levels');
    setSortBy('date');
    setActiveTab('all');
  };

  const isWatchlistEmpty = activeTab === 'watchlist' && watchlist.length === 0;

  return (
    <MotionConfig reducedMotion="user">
      <div className="space-y-7">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs font-mono text-[#888888]">
          <Link to="/" className="hover:text-[#D4AF37] no-underline">Home</Link>
          <span>/</span>
          <span className="text-[#D4AF37] font-semibold">IPO Intelligence Dashboard</span>
          <span className="text-zinc-600">({filteredIpos.length} issues)</span>
        </div>

        {/* ── Terminal Metric Telemetry Strip ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatTile
            icon={Radio}
            label="Active Bidding Window"
            value={openCount}
            unit="Live IPOs"
            sub="Mainboard & Emerge SME"
            iconTone="text-emerald-400"
          />
          <StatTile icon={Coins} label="Capital Being Raised" value="₹3,843" unit="Cr" sub="Active book builds" />
          <StatTile
            icon={ShieldAlert}
            label="SME Forensic Flag Rate"
            value="38.4%"
            tone="text-rose-400"
            iconTone="text-rose-400"
            sub="Vendor / entity anomalies"
            bar={38.4}
          />
          <StatTile
            icon={ShieldCheck}
            label="Clean Audit Rate"
            value="61.6%"
            tone="text-emerald-400"
            iconTone="text-emerald-400"
            sub="Full multi-source corroborated"
            bar={61.6}
          />
        </div>

        {/* ── Control Bar ── */}
        <div className="space-y-4">
          {/* Search / view / sort */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888888]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search companies, ticker symbol, or sector (e.g. Kalindi, Solar, Trans)..."
                aria-label="Search IPOs"
                className="w-full pl-11 pr-10 py-3 rounded-2xl bg-[#080808] border border-[#1E1E1E] text-white text-xs placeholder:text-[#666666] hover:border-[#2C2C2C] focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/25 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-[#888888] hover:text-white hover:bg-white/10"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-none">
              <div className="flex items-center p-1 rounded-xl bg-[#080808] border border-[#1E1E1E]" role="group" aria-label="View mode">
                {[
                  { id: 'table', icon: TableIcon, title: 'Financial Terminal Table View' },
                  { id: 'grid', icon: LayoutGrid, title: 'Executive Card View' }
                ].map(({ id, icon: Icon, title }) => (
                  <button
                    key={id}
                    onClick={() => setViewMode(id)}
                    title={title}
                    aria-label={title}
                    aria-pressed={viewMode === id}
                    className={`p-2 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50 ${
                      viewMode === id ? 'bg-[#D4AF37]/20 text-[#F5E59F]' : 'text-[#888888] hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>

              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  aria-label="Sort issues by"
                  className="appearance-none pl-3 pr-8 py-2.5 rounded-xl bg-[#080808] border border-[#1E1E1E] hover:border-[#2E2E2E] text-white text-xs cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50 font-medium"
                >
                  <option value="date" className="bg-[#080808]">Default Issue Timeline</option>
                  <option value="size" className="bg-[#080808]">Issue Size (High to Low)</option>
                  <option value="subscription" className="bg-[#080808]">Subscription Demand (High)</option>
                  <option value="risk" className="bg-[#080808]">Forensic Safety (Lowest Risk)</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-3 w-3.5 h-3.5 text-[#888888] pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Status Tabs — sliding luxury gold pill */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 no-scrollbar border-b border-[#1A1A1A]" role="tablist">
            {STATUS_TABS.map((tab) => {
              const active = activeTab === tab.id;
              const Icon = tab.icon;
              const count = tabCounts[tab.id];
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50 ${
                    active ? 'text-[#F5E59F]' : 'text-[#888888] hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="active-tab-pill"
                      className="absolute inset-0 rounded-xl bg-[#D4AF37]/12 border border-[#D4AF37]/40 shadow-[0_0_15px_rgba(212,175,55,0.15)]"
                      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                    />
                  )}
                  <span className="relative flex items-center gap-1.5">
                    {Icon && <Icon className="w-3.5 h-3.5" />}
                    {tab.label}
                    {count > 0 && (
                      <span
                        className={`px-1.5 rounded-full text-[10px] leading-4 font-mono ${
                          tab.id === 'open'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : active
                            ? 'bg-[#D4AF37]/25 text-[#F5E59F] border border-[#D4AF37]/40'
                            : 'bg-white/[0.06] text-[#888888]'
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Dropdown Filters + result count */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <FilterSelect value={selectedSector} onChange={setSelectedSector} options={SECTORS} label="Filter Sector" defaultValue="All Sectors" />
            <FilterSelect value={selectedBoard} onChange={setSelectedBoard} options={BOARDS} label="Filter Board" defaultValue="All Boards" />
            <FilterSelect value={selectedRisk} onChange={setSelectedRisk} options={RISK_LEVELS} label="Filter Risk" defaultValue="All Risk Levels" />

            <span className="ml-auto flex items-center gap-3 text-[11px] text-[#888888] font-mono">
              <span>
                Showing <span className="text-[#F5E59F] font-bold">{filteredIpos.length}</span> of {IPO_CATALOG.length}
              </span>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[#888888] hover:text-[#D4AF37] hover:bg-white/[0.04] transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset filters
                </button>
              )}
            </span>
          </div>
        </div>

        {/* ── Main Content Viewport ── */}
        {filteredIpos.length > 0 ? (
          viewMode === 'table' ? (
            <div className="rounded-2xl border border-[#1A1A1A] overflow-x-auto bg-black shadow-2xl shadow-black">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#1A1A1A] bg-[#070707] text-[#888888] font-mono text-[11px]">
                    <th className="py-3.5 px-4 font-semibold">Company & Ticker</th>
                    <th className="py-3.5 px-3 font-semibold">Board</th>
                    <th className="py-3.5 px-3 font-semibold">Sector</th>
                    <th className="py-3.5 px-3 font-semibold text-right">Price Band</th>
                    <th className="py-3.5 px-3 font-semibold text-right">Lot Size</th>
                    <th className="py-3.5 px-3 font-semibold text-right">Issue Size</th>
                    <th className="py-3.5 px-3 font-semibold text-right">Subscription</th>
                    <th className="py-3.5 px-3 font-semibold">Forensic Audit</th>
                    <th className="py-3.5 px-3 font-semibold">Status</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#141414] font-mono text-white">
                  <AnimatePresence initial={false}>
                    {filteredIpos.map((ipo) => {
                      const isSaved = watchlist.includes(ipo.id);
                      const risk = RISK_META[ipo.riskLevel];
                      return (
                        <motion.tr
                          key={ipo.id}
                          layout="position"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.18 }}
                          className="hover:bg-[#0A0A0A] transition-colors group cursor-pointer"
                          onClick={() => navigate(`/ipo/${ipo.id}`)}
                        >
                          <td className={`py-3.5 px-4 border-l-2 ${risk ? risk.edge : 'border-l-transparent'}`}>
                            <div className="flex items-center gap-2.5">
                              <WatchButton saved={isSaved} onToggle={() => toggleWatchlist(ipo.id)} />
                              <div className="font-sans">
                                <span className="block text-xs font-bold text-white group-hover:text-[#F5E59F] transition-colors">{ipo.name}</span>
                                <span className="text-[10px] font-mono text-[#888888]">{ipo.symbol}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="px-2 py-0.5 rounded bg-white/[0.05] border border-white/[0.08] text-[10px] text-[#AAAAAA] font-sans whitespace-nowrap">{ipo.board}</span>
                          </td>
                          <td className="py-3.5 px-3 text-[11px] text-[#888888] font-sans max-w-[140px] truncate" title={ipo.sector}>{ipo.sector}</td>
                          <td className="py-3.5 px-3 text-right font-bold whitespace-nowrap text-white">{ipo.priceBand}</td>
                          <td className="py-3.5 px-3 text-right text-[#888888] whitespace-nowrap">{ipo.lotSize} shs</td>
                          <td className="py-3.5 px-3 text-right text-[#D4AF37] font-bold whitespace-nowrap">{ipo.issueSize}</td>
                          <td className="py-3.5 px-3">
                            <SubscriptionMeter total={ipo.subscription?.total} />
                          </td>
                          <td className="py-3.5 px-3"><RiskBadge ipo={ipo} /></td>
                          <td className="py-3.5 px-3"><StatusPill status={ipo.status} /></td>
                          <td className="py-3.5 px-4 text-right">
                            <Link
                              to={`/ipo/${ipo.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="px-3 py-1.5 rounded-lg bg-[#111111] hover:bg-[#D4AF37] hover:text-black text-white font-semibold text-[11px] border border-[#222222] hover:border-[#D4AF37] transition-all inline-flex items-center gap-1 no-underline shadow-sm"
                            >
                              Dossier
                              <ArrowUpRight className="w-3 h-3" />
                            </Link>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          ) : (
            /* Cards Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredIpos.map((ipo) => {
                const risk = RISK_META[ipo.riskLevel];
                return (
                  <div
                    key={ipo.id}
                    onClick={() => navigate(`/ipo/${ipo.id}`)}
                    className="group relative p-6 rounded-2xl bg-gradient-to-b from-[#0E0E0E] to-[#040404] border border-[#1A1A1A] hover:border-[#D4AF37]/50 hover:-translate-y-1 hover:shadow-2xl hover:shadow-[#D4AF37]/10 transition-all cursor-pointer flex flex-col justify-between overflow-hidden"
                  >
                    <span className={`absolute top-0 inset-x-0 h-0.5 ${risk ? risk.bar : 'bg-transparent'}`} />

                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] border border-[#262626] text-[#F5E59F]">{ipo.board}</span>
                          <StatusPill status={ipo.status} />
                        </div>
                        <WatchButton saved={watchlist.includes(ipo.id)} onToggle={() => toggleWatchlist(ipo.id)} size="w-4 h-4" />
                      </div>

                      <h3 className="text-base font-bold text-white group-hover:text-[#F5E59F] transition-colors leading-snug">
                        {ipo.name}
                      </h3>
                      <p className="text-xs text-[#888888] mt-1 mb-4 line-clamp-1">
                        <span className="font-mono text-[#AAAAAA]">{ipo.symbol}</span> <span className="opacity-40">/</span> {ipo.sector}
                      </p>

                      <div className="grid grid-cols-3 gap-2 p-3.5 rounded-xl bg-[#080808] border border-[#1A1A1A] text-xs font-mono mb-3.5">
                        <div>
                          <span className="text-[10px] text-[#777777] font-sans block">Price Band</span>
                          <span className="font-bold text-white">{ipo.priceBand}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#777777] font-sans block">Issue Size</span>
                          <span className="font-bold text-[#D4AF37]">{ipo.issueSize}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#777777] font-sans block">Subscribed</span>
                          <SubscriptionMeter total={ipo.subscription?.total} align="left" />
                        </div>
                      </div>

                      <RiskBadge ipo={ipo} />
                    </div>

                    <div className="mt-5 pt-3.5 border-t border-[#181818] flex items-center justify-between">
                      <span className="text-xs text-[#888888]">{ipo.issueDates}</span>
                      <Link
                        to={`/ipo/${ipo.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-[#D4AF37] hover:text-[#F5E59F] font-bold flex items-center gap-1 no-underline"
                      >
                        View Dossier
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* Empty state */
          <div className="py-16 text-center rounded-2xl bg-[#060606] border border-dashed border-[#222222] p-8">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-white/[0.04] flex items-center justify-center">
              {isWatchlistEmpty ? <Bookmark className="w-6 h-6 text-[#888888]" /> : <ScanSearch className="w-6 h-6 text-[#888888]" />}
            </div>
            <h3 className="text-sm font-semibold text-white">
              {isWatchlistEmpty ? 'Your watchlist is empty' : 'No matching issues found'}
            </h3>
            <p className="text-xs text-[#888888] mt-1 mb-4 max-w-sm mx-auto">
              {isWatchlistEmpty
                ? 'Bookmark any IPO from the table to track it here.'
                : 'Try a different search term or loosen your filters.'}
            </p>
            <button
              onClick={isWatchlistEmpty ? () => setActiveTab('all') : resetFilters}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#141414] hover:bg-[#202020] text-white border border-[#2A2A2A] transition-colors"
            >
              {isWatchlistEmpty ? 'Browse all issues' : 'Clear filters'}
            </button>
          </div>
        )}
      </div>
    </MotionConfig>
  );
}
