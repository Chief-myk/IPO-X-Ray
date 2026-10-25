import React from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Building2, 
  Calendar, 
  TrendingUp, 
  ShieldAlert, 
  ShieldCheck, 
  Bookmark, 
  BookmarkCheck, 
  ArrowUpRight, 
  AlertTriangle,
  Flame,
  CheckCircle2,
  Users,
  Coins
} from 'lucide-react';

export default function IpoCard({ ipo, recommendationReason }) {
  const { openIpoDetail, startApplyFlow, watchlist, toggleWatchlist } = useApp();
  const { preferences } = useAuth();

  const isSaved = watchlist.includes(ipo.id);
  const isOpen = ipo.status === 'open';

  const renderRiskBadge = () => {
    if (ipo.riskLevel === 'critical') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
          <ShieldAlert className="w-3 h-3 flex-none" />
          <span>{ipo.forensicFlagsCount} Forensic Flags</span>
        </span>
      );
    }
    if (ipo.riskLevel === 'medium') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-[#D4AF37]/15 text-[#F5E59F] border border-[#D4AF37]/35">
          <AlertTriangle className="w-3 h-3 flex-none text-[#D4AF37]" />
          <span>Moderate ({ipo.riskScore}/100)</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
        <ShieldCheck className="w-3 h-3 flex-none" />
        <span>Verified Clean</span>
      </span>
    );
  };

  const renderStatusBadge = () => {
    switch (ipo.status) {
      case 'open':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            LIVE BIDDING
          </span>
        );
      case 'upcoming':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/15 text-sky-400 border border-sky-500/30">
            UPCOMING
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#D4AF37]/15 text-[#F5E59F] border border-[#D4AF37]/35">
            ALLOTMENT PENDING
          </span>
        );
      case 'listed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
            LISTED ON EXCHANGE
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl bg-[#080808] hover:bg-[#0D0D0D] border border-[#1A1A1A] hover:border-[#D4AF37]/50 transition-all duration-300 shadow-xl shadow-black overflow-hidden">
      {/* Top Gold Hairline on Hover */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Card Header */}
      <div className="p-5 sm:p-6 pb-4">
        {/* Top Badges Row */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {renderStatusBadge()}
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-white/[0.05] border border-[#222222] text-[#888888]">
              {ipo.board}
            </span>
          </div>

          <button
            onClick={() => toggleWatchlist(ipo.id)}
            className={`p-1.5 rounded-lg border transition-all ${
              isSaved
                ? 'bg-[#D4AF37]/20 border-[#D4AF37]/60 text-[#F5E59F]'
                : 'bg-transparent border-transparent text-[#888888] hover:text-white hover:border-[#222222]'
            }`}
            title={isSaved ? 'Remove from Watchlist' : 'Add to Watchlist'}
            aria-label="Toggle Watchlist"
          >
            {isSaved ? <BookmarkCheck className="w-4 h-4 text-[#D4AF37]" /> : <Bookmark className="w-4 h-4" />}
          </button>
        </div>

        {/* Company Title & Sector */}
        <div className="mb-4">
          <h3 
            onClick={() => openIpoDetail(ipo)}
            className="text-base sm:text-lg font-bold text-white group-hover:text-[#F5E59F] transition-colors cursor-pointer flex items-center justify-between font-['Cinzel']"
          >
            <span>{ipo.name}</span>
            <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity flex-none ml-1 text-[#D4AF37]" />
          </h3>
          <p className="text-xs text-[#888888] mt-1 line-clamp-1 font-sans">{ipo.sector}</p>
        </div>

        {/* Tailored Recommendation Reason */}
        {recommendationReason && (
          <div className="mb-4 p-3 rounded-xl bg-[#D4AF37]/[0.08] border border-[#D4AF37]/25 text-[11px] text-[#F5E59F] flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37] flex-none mt-0.5" />
            <span className="leading-relaxed font-sans">{recommendationReason}</span>
          </div>
        )}

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-[#050505] border border-[#161616] mb-4 text-xs font-mono">
          <div>
            <span className="text-[10px] text-[#777777] block font-sans">Price Band</span>
            <span className="font-semibold text-white">{ipo.priceBand}</span>
          </div>
          <div>
            <span className="text-[10px] text-[#777777] block font-sans">Issue Size</span>
            <span className="font-bold text-[#D4AF37]">{ipo.issueSize}</span>
          </div>
          <div>
            <span className="text-[10px] text-[#777777] block font-sans">Lot Size / Min Inv</span>
            <span className="text-[#888888]">
              <strong className="text-white font-semibold">{ipo.lotSize}</strong> shs (₹{ipo.minInvestment.toLocaleString('en-IN')})
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[#777777] block font-sans">Subscription</span>
            <span className={`font-semibold ${ipo.subscription?.total > 10 ? 'text-emerald-400' : 'text-white'}`}>
              {ipo.subscription?.total ? `${ipo.subscription.total}x` : 'Awaiting Bids'}
            </span>
          </div>
        </div>

        {/* Dates Row */}
        <div className="flex items-center gap-2 text-xs text-[#888888] mb-3 font-mono">
          <Calendar className="w-3.5 h-3.5 text-[#777777] flex-none" />
          <span className="truncate">{ipo.issueDates}</span>
        </div>

        {/* Forensic Risk Indicator */}
        <div className="pt-3 border-t border-[#141414] flex items-center justify-between">
          <span className="text-[11px] text-[#888888] font-sans">Forensic Integrity:</span>
          {renderRiskBadge()}
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="p-4 px-5 sm:px-6 bg-[#050505] border-t border-[#141414] flex items-center justify-between gap-3">
        <button
          onClick={() => openIpoDetail(ipo)}
          className="text-xs font-semibold text-[#888888] hover:text-[#D4AF37] transition-colors"
        >
          View Full Dossier
        </button>

        <div className="flex items-center gap-2">
          {isOpen ? (
            <button
              onClick={() => startApplyFlow(ipo)}
              className="btn-gold px-3.5 py-1.5 rounded-xl text-xs font-bold text-black flex items-center gap-1 transition-all"
            >
              <span>Apply</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => openIpoDetail(ipo, 'risk')}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#111111] hover:bg-[#181818] text-white border border-[#222222] transition-colors"
            >
              Check Risk
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
