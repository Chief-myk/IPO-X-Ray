import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  Layers, 
  Clock, 
  CheckCircle2, 
  ExternalLink, 
  Calendar, 
  Coins, 
  ShieldAlert, 
  ArrowRight,
  Search,
  ChevronRight,
  Plus
} from 'lucide-react';

const STATUS_FILTERS = ['All', 'Allotment Awaited', 'Fully Allotted', 'Ready to Apply'];

export default function ApplicationsPage() {
  const { applications } = useApp();
  const navigate = useNavigate();
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
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[11px] font-mono text-[#888888]">
        <Link to="/" className="hover:text-[#D4AF37] no-underline">Home</Link>
        <ChevronRight className="w-3 h-3 text-[#444444]" />
        <Link to="/dashboard" className="hover:text-[#D4AF37] no-underline">Dashboard</Link>
        <ChevronRight className="w-3 h-3 text-[#444444]" />
        <span className="text-white font-medium">Application Tracking</span>
      </div>

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#1A1A1A]">
        <div>
          <span className="text-[10px] font-mono text-[#D4AF37] uppercase tracking-wider block font-semibold">Institutional Tracking Desk</span>
          <h1 className="text-xl sm:text-2xl font-bold text-white font-['Cinzel']">
            Application & Allotment Surveillance
          </h1>
          <p className="text-xs text-[#888888] mt-1 font-sans">
            Monitor ASBA mandate block releases, registrar allotment announcements, and demat allocation notices.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3.5 rounded-xl bg-[#080808] border border-[#1A1A1A] text-xs font-mono text-right">
            <span className="text-[10px] font-sans text-[#777777] block">ASBA Capital Blocked</span>
            <span className="text-base font-extrabold text-[#F5E59F]">₹{totalCapitalBlocked.toLocaleString('en-IN')}</span>
          </div>

          <Link
            to="/dashboard"
            className="btn-gold px-4 py-2.5 rounded-xl text-black font-bold text-xs flex items-center gap-1.5 no-underline transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Discover IPO</span>
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar */}
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

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3.5 top-3 w-3.5 h-3.5 text-[#888888]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search applications..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#080808] border border-[#1E1E1E] text-white text-xs placeholder:text-[#666666] focus:outline-none focus:border-[#D4AF37] transition-all"
          />
        </div>
      </div>

      {/* Application List Cards */}
      {filteredApps.length > 0 ? (
        <div className="space-y-3.5">
          {filteredApps.map((app) => {
            const isAwaited = app.status === 'Allotment Awaited';
            const isAllotted = app.status === 'Fully Allotted';
            return (
              <div 
                key={app.id}
                className="p-5 sm:p-6 rounded-2xl bg-[#080808] border border-[#1A1A1A] hover:border-[#D4AF37]/40 transition-all shadow-xl shadow-black"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3.5 border-b border-[#141414]">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.05] text-[#F5E59F] border border-[#222222]">
                        {app.board}
                      </span>
                      <span className="text-[10px] font-mono text-[#888888]">
                        App No: <strong className="text-white">{app.applicationNo}</strong>
                      </span>
                      {isAwaited && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#D4AF37]/15 text-[#F5E59F] border border-[#D4AF37]/35">
                          <Clock className="w-2.5 h-2.5 text-[#D4AF37]" />
                          Allotment Awaited
                        </span>
                      )}
                      {isAllotted && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          {app.allotmentStatus}
                        </span>
                      )}
                      {app.status === 'Ready to Apply' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/15 text-sky-400 border border-sky-500/30">
                          Prepared
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-white font-['Cinzel']">
                      {app.companyName}
                    </h3>
                    <p className="text-[11px] text-[#888888] mt-0.5 font-sans">
                      {app.category} · Applied on {app.appliedAt}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-none">
                    <Link
                      to={`/ipo/${app.ipoId}`}
                      className="px-3.5 py-1.5 rounded-xl bg-[#111111] hover:bg-[#181818] text-white text-xs border border-[#222222] font-semibold no-underline transition-colors"
                    >
                      View Dossier
                    </Link>

                    {app.registrarUrl && (
                      <a
                        href={app.registrarUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-1.5 rounded-xl bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 text-[#F5E59F] text-xs border border-[#D4AF37]/40 font-semibold flex items-center gap-1 no-underline transition-colors"
                      >
                        <span>Check Registrar</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3.5 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-[#777777] font-sans block">Lots Applied</span>
                    <span className="font-semibold text-white">{app.lots} Lot ({app.quantity} shs)</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#777777] font-sans block">Bid Price</span>
                    <span className="font-semibold text-white">₹{app.bidPrice}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#777777] font-sans block">Blocked Amount</span>
                    <span className="font-bold text-[#D4AF37]">₹{app.amount.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#777777] font-sans block">Allotment Date</span>
                    <span className="font-semibold text-white">{app.allotmentDate}</span>
                  </div>
                </div>

                {app.riskWarning && (
                  <div className="mt-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-[11px] text-rose-400 flex items-center gap-1.5">
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
          <Layers className="w-9 h-9 text-[#444444] mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-white">No applications under this filter</h3>
          <p className="text-xs text-[#888888] mt-1 mb-3 font-sans">Explore active IPOs to prepare and track your bids.</p>
          <Link
            to="/dashboard"
            className="btn-gold px-4 py-2 rounded-xl text-xs font-bold text-black no-underline inline-block"
          >
            Discover IPOs
          </Link>
        </div>
      )}
    </div>
  );
}
