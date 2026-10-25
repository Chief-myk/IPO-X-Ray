import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Layers, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Calendar, 
  Coins, 
  ShieldAlert, 
  ArrowRight, 
  Filter, 
  Search, 
  Building2, 
  FileText 
} from 'lucide-react';

const STATUS_FILTERS = ['All', 'Allotment Awaited', 'Fully Allotted', 'Ready to Apply', 'Listed'];

export default function ApplicationsDashboard({ onExploreIpos }) {
  const { applications, openIpoDetail } = useApp();
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const filteredApps = applications.filter((app) => {
    if (filter !== 'All' && app.status !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        app.companyName.toLowerCase().includes(q) ||
        app.applicationNo.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalCapitalBlocked = applications
    .filter((a) => a.status === 'Allotment Awaited' || a.status === 'Submitted')
    .reduce((sum, a) => sum + (a.amount || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#F5E59F] text-[11px] font-mono font-semibold uppercase tracking-wider mb-2">
            <Layers className="w-3.5 h-3.5 text-[#D4AF37]" />
            Investor Application Lifecycle
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-['Cinzel']">
            Application & Allotment Tracking Desk
          </h1>
          <p className="text-xs text-[#888888] mt-1 max-w-xl font-sans">
            Real-time status tracking across ASBA mandate authorization, registrar announcements, and post-listing portfolio transitions.
          </p>
        </div>

        {/* Capital Summary */}
        <div className="p-4 rounded-2xl bg-[#080808] border border-[#1A1A1A] text-xs font-mono flex-none sm:w-64 shadow-xl shadow-black">
          <span className="text-[10px] font-sans text-[#777777] block">ASBA Capital Blocked</span>
          <span className="text-xl font-extrabold text-[#F5E59F]">₹{totalCapitalBlocked.toLocaleString('en-IN')}</span>
          <span className="text-[10px] text-[#888888] block mt-0.5 font-sans">Held in investor's bank account</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filter === s
                  ? 'bg-[#D4AF37]/15 text-[#F5E59F] border border-[#D4AF37]/40 shadow-[0_0_15px_rgba(212,175,55,0.15)]'
                  : 'text-[#888888] hover:text-white hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-[#888888]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search applications..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#080808] border border-[#1A1A1A] text-white text-xs placeholder:text-[#666666] focus:outline-none focus:border-[#D4AF37] transition-all"
          />
        </div>
      </div>

      {/* Application Cards List */}
      {filteredApps.length > 0 ? (
        <div className="space-y-4">
          {filteredApps.map((app) => {
            const isAwaited = app.status === 'Allotment Awaited';
            const isAllotted = app.status === 'Fully Allotted';
            return (
              <div 
                key={app.id}
                className="p-5 sm:p-6 rounded-2xl bg-[#080808] border border-[#1A1A1A] hover:border-[#D4AF37]/40 transition-all shadow-xl shadow-black"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#141414]">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/[0.05] border border-[#222222] text-[#F5E59F]">
                        {app.board}
                      </span>
                      <span className="text-[11px] font-mono text-[#888888]">
                        App No: <strong className="text-white">{app.applicationNo}</strong>
                      </span>
                      {isAwaited && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#D4AF37]/15 text-[#F5E59F] border border-[#D4AF37]/35">
                          <Clock className="w-3 h-3 text-[#D4AF37]" />
                          Allotment Awaited
                        </span>
                      )}
                      {isAllotted && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          {app.allotmentStatus}
                        </span>
                      )}
                      {app.status === 'Ready to Apply' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-500/15 text-sky-400 border border-sky-500/30">
                          Prepared · Pending Broker Submission
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-white font-['Cinzel']">
                      {app.companyName}
                    </h3>
                    <p className="text-xs text-[#888888] mt-0.5 font-sans">
                      Category: {app.category} · Applied on {app.appliedAt}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    {app.registrarUrl && (
                      <a
                        href={app.registrarUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 rounded-xl bg-[#111111] hover:bg-[#181818] text-[#D4AF37] text-xs border border-[#222222] font-semibold flex items-center gap-1.5 transition-colors no-underline"
                      >
                        <span>Check Registrar</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-[#777777] font-sans block">Lots Applied</span>
                    <span className="font-semibold text-white">{app.lots} Lot ({app.quantity} Shares)</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#777777] font-sans block">Bid Price</span>
                    <span className="font-semibold text-white">₹{app.bidPrice}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#777777] font-sans block">Application Amount</span>
                    <span className="font-bold text-[#D4AF37]">₹{app.amount.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#777777] font-sans block">Allotment Date</span>
                    <span className="font-semibold text-white">{app.allotmentDate}</span>
                  </div>
                </div>

                {app.riskWarning && (
                  <div className="mt-3.5 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-[11px] text-rose-400 flex items-center gap-2">
                    <ShieldAlert className="w-3.5 h-3.5 flex-none" />
                    <span>{app.riskWarning}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center rounded-2xl bg-[#080808] border border-[#1A1A1A] p-8">
          <Layers className="w-10 h-10 text-[#444444] mx-auto mb-3" />
          <h3 className="text-base font-bold text-white font-['Cinzel']">No applications recorded under this filter</h3>
          <p className="text-xs text-[#888888] max-w-md mx-auto mt-1 mb-4 font-sans">
            Discover upcoming and open IPOs to prepare and track your bidding parameters.
          </p>
          <button
            onClick={onExploreIpos}
            className="btn-gold px-4 py-2 rounded-xl text-xs font-bold text-black transition-all cursor-pointer"
          >
            Explore Active IPOs
          </button>
        </div>
      )}
    </div>
  );
}
