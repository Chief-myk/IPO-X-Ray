import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { IPO_CATALOG, SECTORS, BOARDS, RISK_LEVELS } from '../../data/ipoCatalog';
import IpoCard from './IpoCard';
import { 
  Search, 
  Filter, 
  SlidersHorizontal, 
  Sparkles, 
  ShieldAlert, 
  Activity, 
  Calendar, 
  Coins, 
  Layers, 
  Compass,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

const STATUS_TABS = [
  { id: 'all', label: 'All IPOs' },
  { id: 'open', label: 'Currently Open', countBadge: true },
  { id: 'upcoming', label: 'Upcoming Issues' },
  { id: 'closed', label: 'Awaiting Allotment' },
  { id: 'listed', label: 'Newly Listed' },
  { id: 'recommended', label: 'AI Recommended', icon: Sparkles },
  { id: 'watchlist', label: 'My Watchlist' }
];

export default function DiscoveryDashboard({ onOpenLiveScanner }) {
  const { watchlist, applications, openIpoDetail } = useApp();
  const { preferences, setIsOnboardingOpen } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedSector, setSelectedSector] = useState('All Sectors');
  const [selectedBoard, setSelectedBoard] = useState('All Boards');
  const [selectedRisk, setSelectedRisk] = useState('All Risk Levels');
  const [sortBy, setSortBy] = useState('date');

  const openCount = useMemo(() => IPO_CATALOG.filter((i) => i.status === 'open').length, []);

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
        const matchesName = ipo.name.toLowerCase().includes(q);
        const matchesSym = ipo.symbol.toLowerCase().includes(q);
        const matchesSec = ipo.sector.toLowerCase().includes(q);
        if (!matchesName && !matchesSym && !matchesSec) return false;
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

  const getRecommendationReason = (ipo) => {
    if (activeTab !== 'recommended') return null;
    if (ipo.riskLevel === 'clear' && preferences.preferredSectors?.includes(ipo.sector)) {
      return `Matches your preferred ${ipo.sector} sector with zero forensic red flags and verified disclosures.`;
    }
    if (ipo.riskLevel === 'clear') {
      return `Recommended for low forensic risk (${ipo.riskScore}/100) and verified manufacturing/asset backing.`;
    }
    return `Sector alignment with high growth metrics, though promoter concentration requires inspection.`;
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedSector('All Sectors');
    setSelectedBoard('All Boards');
    setSelectedRisk('All Risk Levels');
    setSortBy('date');
    setActiveTab('all');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Intelligence Telemetry Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#080808] border border-[#1A1A1A] shadow-xl shadow-black">
          <div className="flex items-center justify-between text-[#888888] text-xs mb-1.5 font-sans">
            <span>Bidding Window</span>
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white">
            {openCount} <span className="text-xs font-normal text-emerald-400">Live Issues</span>
          </div>
          <span className="text-[10px] text-[#777777] block mt-0.5 font-sans">NSE Mainboard & Emerge SME</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#080808] border border-[#1A1A1A] shadow-xl shadow-black">
          <div className="flex items-center justify-between text-[#888888] text-xs mb-1.5 font-sans">
            <span>Capital Mobilization</span>
            <Coins className="w-3.5 h-3.5 text-[#D4AF37]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white">
            ₹3,843 <span className="text-xs font-normal text-[#888888]">Cr</span>
          </div>
          <span className="text-[10px] text-[#777777] block mt-0.5 font-sans">Across active prospectuses</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#080808] border border-[#1A1A1A] shadow-xl shadow-black">
          <div className="flex items-center justify-between text-[#888888] text-xs mb-1.5 font-sans">
            <span>SME Red-Flag Rate</span>
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-rose-400">
            38.4% <span className="text-xs font-normal text-[#888888]">Anomalies</span>
          </div>
          <span className="text-[10px] text-[#777777] block mt-0.5 font-sans">Vendor concentration & site gaps</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#080808] border border-[#1A1A1A] shadow-xl shadow-black">
          <div className="flex items-center justify-between text-[#888888] text-xs mb-1.5 font-sans">
            <span>My Applications</span>
            <Layers className="w-3.5 h-3.5 text-[#F5E59F]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white">
            {applications.length} <span className="text-xs font-normal text-[#F5E59F]">Tracked</span>
          </div>
          <span className="text-[10px] text-[#777777] block mt-0.5 font-sans">Awaiting registrar allotment</span>
        </div>
      </div>

      {/* Hero Interactive Header */}
      <div className="relative rounded-3xl bg-gradient-to-br from-[#0C0C0C] via-[#060606] to-[#020202] border border-[#1A1A1A] p-6 sm:p-8 lg:p-10 shadow-2xl shadow-black overflow-hidden">
        <div className="pointer-events-none absolute -right-20 -top-20 w-96 h-96 rounded-full bg-[#D4AF37]/10 blur-3xl" />

        <div className="max-w-3xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#F5E59F] text-xs font-mono font-semibold uppercase tracking-wider mb-4">
            <Compass className="w-3.5 h-3.5 text-[#D4AF37]" />
            End-to-End IPO Investor Intelligence
          </div>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight font-['Cinzel'] leading-[1.15]">
            Discover, evaluate, and monitor IPOs with <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#F5E59F] to-[#D4AF37]">verifiable forensic evidence.</span>
          </h1>
          <p className="mt-3.5 text-sm sm:text-base text-[#888888] max-w-2xl leading-relaxed font-sans">
            Every claim checked on the open web before you bid. No blind trust in subscription hype or promoter promises.
          </p>

          <div className="flex items-center gap-3 mt-6 flex-wrap">
            <button
              onClick={onOpenLiveScanner}
              className="btn-gold px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-black flex items-center gap-2 transition-all cursor-pointer"
            >
              <Activity className="w-4 h-4" />
              <span>Launch Live DRHP Scanner</span>
            </button>
            <button
              onClick={() => setIsOnboardingOpen(true)}
              className="px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-[#111111] hover:bg-[#181818] text-white border border-[#222222] hover:border-[#D4AF37]/40 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Calibrate Mandate Preferences</span>
            </button>
          </div>
        </div>
      </div>

      {/* Discovery Filters & Search Console */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-[#888888]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search companies, ticker symbol, or sector..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#080808] border border-[#1A1A1A] text-white text-xs placeholder:text-[#666666] focus:outline-none focus:border-[#D4AF37] transition-all"
            />
          </div>

          <div className="flex items-center gap-2 flex-none">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-[#080808] border border-[#1A1A1A] text-white text-xs cursor-pointer focus:outline-none focus:border-[#D4AF37]"
            >
              <option value="date" className="bg-[#080808]">Timeline Order</option>
              <option value="size" className="bg-[#080808]">Issue Size (High to Low)</option>
              <option value="subscription" className="bg-[#080808]">Subscription Demand (High)</option>
              <option value="risk" className="bg-[#080808]">Lowest Forensic Risk</option>
            </select>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b border-[#1A1A1A]">
          {STATUS_TABS.map((tab) => {
            const active = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  active
                    ? 'bg-[#D4AF37]/15 text-[#F5E59F] border border-[#D4AF37]/40 shadow-[0_0_15px_rgba(212,175,55,0.15)]'
                    : 'text-[#888888] hover:text-white hover:bg-white/[0.04] border border-transparent'
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                <span>{tab.label}</span>
                {tab.countBadge && openCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[10px]">
                    {openCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-[#080808] border border-[#1A1A1A] text-white text-xs cursor-pointer focus:outline-none focus:border-[#D4AF37]"
          >
            {SECTORS.map((s) => (
              <option key={s} value={s} className="bg-[#080808] text-white">{s}</option>
            ))}
          </select>

          <select
            value={selectedBoard}
            onChange={(e) => setSelectedBoard(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-[#080808] border border-[#1A1A1A] text-white text-xs cursor-pointer focus:outline-none focus:border-[#D4AF37]"
          >
            {BOARDS.map((b) => (
              <option key={b} value={b} className="bg-[#080808] text-white">{b}</option>
            ))}
          </select>

          <select
            value={selectedRisk}
            onChange={(e) => setSelectedRisk(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-[#080808] border border-[#1A1A1A] text-white text-xs cursor-pointer focus:outline-none focus:border-[#D4AF37]"
          >
            {RISK_LEVELS.map((r) => (
              <option key={r} value={r} className="bg-[#080808] text-white">{r}</option>
            ))}
          </select>

          <span className="ml-auto text-xs text-[#888888] font-mono">
            Showing <strong className="text-[#F5E59F]">{filteredIpos.length}</strong> of {IPO_CATALOG.length}
          </span>
        </div>
      </div>

      {/* Cards Grid */}
      {filteredIpos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredIpos.map((ipo) => (
            <IpoCard 
              key={ipo.id} 
              ipo={ipo} 
              recommendationReason={getRecommendationReason(ipo)}
            />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center rounded-2xl bg-[#080808] border border-[#1A1A1A] p-8">
          <Compass className="w-10 h-10 text-[#444444] mx-auto mb-3" />
          <h3 className="text-base font-bold text-white font-['Cinzel']">No issues match current filters</h3>
          <p className="text-xs text-[#888888] mt-1 mb-4 font-sans max-w-sm mx-auto">
            Try resetting your sector, exchange board, or risk tolerance filters to inspect more IPOs.
          </p>
          <button
            onClick={resetFilters}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#111111] hover:bg-[#181818] text-white border border-[#222222] transition-colors"
          >
            Reset all filters
          </button>
        </div>
      )}
    </div>
  );
}
