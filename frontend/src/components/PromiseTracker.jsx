import React, { useState, useEffect, useCallback } from 'react';
import { 
  CheckCircle2, 
  AlertOctagon, 
  Clock, 
  HelpCircle, 
  AlertTriangle, 
  Bell, 
  Search, 
  ArrowRight
} from 'lucide-react';

const STATUS_CONFIG = {
  'Met': {
    color: '#8FE0AE',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    icon: CheckCircle2,
    desc: 'Fully corroborated by post-listing annual reports or exchange disclosures.'
  },
  'Partially Met': {
    color: '#FFC23D',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    icon: Clock,
    desc: 'Progress reported in disclosures, but target is only partially achieved.'
  },
  'Missed': {
    color: '#FF5A4E',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    icon: AlertOctagon,
    desc: 'Subsequent filings confirm target missed, diverted proceeds, or cancelled contracts.'
  },
  'Unverified': {
    color: '#A1A1AA',
    bg: 'bg-zinc-800/40',
    border: 'border-zinc-700/40',
    icon: HelpCircle,
    desc: 'Disclosures to date lack sufficient evidence to substantiate (distinguished from Missed).'
  }
};

const CATEGORIES = [
  { id: '', label: 'All Categories' },
  { id: 'use_of_proceeds', label: 'Use of Proceeds' },
  { id: 'headcount', label: 'Headcount & Staff' },
  { id: 'revenue_target', label: 'Revenue Targets' },
  { id: 'contracts', label: 'Contracts & Vendors' },
  { id: 'client_acquisition', label: 'Client Expansion' },
  { id: 'capex_expansion', label: 'Capex & Showrooms' }
];

export default function PromiseTracker({ currentCompany }) {
  const [promises, setPromises] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState(currentCompany || '');
  const [loading, setLoading] = useState(false);
  const [activePromiseForVerify, setActivePromiseForVerify] = useState(null);
  const [disclosureText, setDisclosureText] = useState('');
  const [disclosureSource, setDisclosureSource] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState('');

  const fetchPromisesAndAlerts = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/api/promises';
      const params = new URLSearchParams();
      if (selectedStatus) params.append('status', selectedStatus);
      if (selectedCategory) params.append('category', selectedCategory);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      const data = await res.json();
      setPromises(data.promises || []);

      const aRes = await fetch('/api/promises/alerts');
      const aData = await aRes.json();
      setAlerts(aData.alerts || []);
    } catch (e) {
      console.error('Error fetching promises:', e);
    } finally {
      setLoading(false);
    }
  }, [selectedStatus, selectedCategory]);

  useEffect(() => {
    fetchPromisesAndAlerts();
  }, [fetchPromisesAndAlerts]);

  useEffect(() => {
    if (currentCompany) {
      setSearchQuery(currentCompany);
    }
  }, [currentCompany]);

  const handleVerifyCommitment = async (e) => {
    e.preventDefault();
    if (!activePromiseForVerify || !disclosureText.trim()) return;

    setVerifyLoading(true);
    setVerifyMsg('');
    try {
      const res = await fetch(`/api/promises/${activePromiseForVerify.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disclosure_text: disclosureText,
          disclosure_source: disclosureSource || 'Manual User Diligence Verification'
        })
      });
      if (!res.ok) throw new Error('Verification failed.');
      const data = await res.json();
      setVerifyMsg(`Status Updated: ${data.promise.status}`);
      fetchPromisesAndAlerts();
    } catch (err) {
      setVerifyMsg(err.message || 'Audit verification failed.');
    } finally {
      setVerifyLoading(false);
    }
  };

  // Filtered list
  const filteredPromises = promises.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.company.toLowerCase().includes(q) ||
      p.title.toLowerCase().includes(q) ||
      p.quotation.toLowerCase().includes(q)
    );
  });

  return (
    <section className="relative overflow-hidden max-w-[1560px] mx-auto px-4 sm:px-8 lg:px-12 py-16 lg:py-24 border-t border-white/10 bg-black" id="promise-tracker">
      <div className="relative">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#D4AF37]/30 bg-[#080808] text-xs font-mono text-[#D4AF37] mb-3">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="tracking-widest uppercase">POST-LISTING STATUTORY COMMITMENT AUDITING</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-cinzel font-bold tracking-tight text-white">
              IPO Promise{' '}
              <span className="text-gold-gradient">
                Tracker
              </span>
            </h2>
            <p className="mt-3 text-base text-zinc-400 max-w-[65ch] leading-relaxed font-sans">
              Track measurable DRHP promises—headcount, capex, revenue targets, and proceeds utilization—compared against subsequent Annual Reports and Exchange disclosures. Clear distinction between **Met, Partially Met, Missed, and Unverified**.
            </p>
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#080808] border border-white/10 text-sm w-full md:w-72">
            <Search className="w-4 h-4 text-zinc-500 flex-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter company or promise..."
              className="bg-transparent border-0 text-white text-xs outline-none placeholder:text-zinc-600 w-full font-sans"
            />
          </div>
        </div>

        {/* Active Disclosures / Alerts Ticker */}
        {alerts.length > 0 && (
          <div className="my-6 p-5 rounded-2xl border border-rose-500/30 bg-rose-500/5 shadow-xl">
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-rose-400 uppercase tracking-wider mb-3">
              <Bell className="w-4 h-4 animate-bounce text-rose-400" />
              <span>Active Deviation & Escalation Alerts ({alerts.length})</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {alerts.slice(0, 4).map((a) => (
                <div key={a.id} className="p-3 rounded-xl bg-black border border-rose-500/20 flex items-start gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-rose-400 flex-none mt-1.5" />
                  <div>
                    <strong className="text-white block font-sans">{a.company}: {a.title}</strong>
                    <span className="text-rose-400 text-[11px] font-mono mt-0.5 block">{a.alert_message}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 my-6 p-4 rounded-2xl border border-white/10 bg-[#080808]">
          {/* Status Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
            <span className="text-zinc-500 mr-1 uppercase tracking-wider">Status:</span>
            {['', 'Met', 'Partially Met', 'Missed', 'Unverified'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-1.5 rounded-xl border transition-colors ${
                  selectedStatus === st
                    ? 'border-[#D4AF37] text-[#F5E59F] bg-[#D4AF37]/10 font-bold'
                    : 'border-white/10 text-zinc-400 hover:text-white hover:border-white/20'
                }`}
              >
                {st || 'All Statuses'}
              </button>
            ))}
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-zinc-500 uppercase tracking-wider">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3.5 py-1.5 rounded-xl bg-black border border-white/10 text-white text-xs outline-none cursor-pointer font-sans"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id} className="bg-black text-white">
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Verification Modal / Drawer (if user selects a promise to verify) */}
        {activePromiseForVerify && (
          <div className="my-6 p-6 sm:p-8 rounded-3xl border border-[#D4AF37]/40 bg-[#080808] shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
              <h4 className="font-cinzel text-lg font-bold text-white">
                Verify Commitment Against New Public Disclosure
              </h4>
              <button
                type="button"
                onClick={() => setActivePromiseForVerify(null)}
                className="text-xs font-mono text-zinc-400 hover:text-white px-2.5 py-1 rounded-lg bg-black border border-white/10"
              >
                Close ✕
              </button>
            </div>
            <p className="text-xs text-zinc-400 mb-4 font-mono">
              Auditing: <strong className="text-white">{activePromiseForVerify.company}</strong> — "{activePromiseForVerify.title}"
            </p>
            <form onSubmit={handleVerifyCommitment} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-zinc-400 uppercase mb-1.5 tracking-wider">
                  Subsequent Filing Source / URL / Citation:
                </label>
                <input
                  type="text"
                  value={disclosureSource}
                  onChange={(e) => setDisclosureSource(e.target.value)}
                  placeholder="e.g. FY2025 Annual Report Page 42, NSE Filing NSE/SME/2026/041"
                  className="w-full px-4 py-2.5 rounded-xl bg-black border border-white/10 text-white text-xs outline-none focus:border-[#D4AF37] font-sans"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-zinc-400 uppercase mb-1.5 tracking-wider">
                  Excerpts from Subsequent Statutory Disclosure:
                </label>
                <textarea
                  rows={4}
                  value={disclosureText}
                  onChange={(e) => setDisclosureText(e.target.value)}
                  placeholder="Paste the relevant section from the annual report, exchange disclosure, or auditor notes..."
                  className="w-full px-4 py-2.5 rounded-xl bg-black border border-white/10 text-white text-xs outline-none focus:border-[#D4AF37] font-sans"
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={verifyLoading}
                  className="btn-gold px-6 py-2.5 rounded-xl text-black font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#D4AF37]/20 hover:shadow-[#D4AF37]/40 cursor-pointer disabled:opacity-60 font-sans"
                >
                  {verifyLoading ? 'Auditing with AI…' : 'Run Audit Verification'}
                </button>
                {verifyMsg && <span className="text-xs font-mono text-[#D4AF37]">{verifyMsg}</span>}
              </div>
            </form>
          </div>
        )}

        {/* Commitments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {filteredPromises.map((p) => {
            const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG['Unverified'];
            const StatusIcon = cfg.icon;

            return (
              <article
                key={p.id}
                className={`relative overflow-hidden p-6 rounded-3xl border bg-[#080808] shadow-xl transition-all duration-300 hover:border-[#D4AF37]/40 ${cfg.border}`}
              >
                {/* Top Status Accent Header */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider ${cfg.bg} ${cfg.border} border`}
                    style={{ color: cfg.color }}
                  >
                    <StatusIcon className="w-3.5 h-3.5" />
                    <span>{p.status}</span>
                  </span>

                  <span className="text-[11px] font-mono text-zinc-500">
                    {p.measurement_period}
                  </span>
                </div>

                <div className="mb-2">
                  <span className="text-[10px] font-mono text-[#D4AF37] uppercase font-semibold tracking-wider block">
                    {p.company} · {p.category.replace(/_/g, ' ')}
                  </span>
                  <h3 className="font-cinzel text-lg sm:text-xl font-bold text-white mt-1">
                    {p.title}
                  </h3>
                </div>

                {/* Original Quotation from DRHP */}
                <div className="my-3.5 p-4 rounded-xl border border-white/5 bg-black font-playfair italic text-sm text-zinc-300 leading-relaxed">
                  "{p.quotation}"
                  <span className="block not-italic font-mono text-[10px] text-[#D4AF37] mt-2">
                    Source: {p.source_ref}
                  </span>
                </div>

                {/* Baseline vs Target */}
                <div className="grid grid-cols-2 gap-2 my-3 font-mono text-xs">
                  <div className="p-3 rounded-xl bg-black border border-white/5">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Baseline at Filing</span>
                    <strong className="text-zinc-200 text-xs block truncate mt-0.5">{p.baseline_val || 'N/A'}</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-black border border-white/5">
                    <span className="text-[10px] text-[#D4AF37] uppercase tracking-wider block">Promised Target</span>
                    <strong className="text-[#F5E59F] text-xs block truncate mt-0.5">{p.target_val || 'N/A'}</strong>
                  </div>
                </div>

                {/* Subsequent Disclosure Evidence Section */}
                {p.evidence_quote && (
                  <div className="mt-3 p-3.5 rounded-xl border border-white/10 bg-black text-xs font-sans">
                    <span className="font-mono text-[10px] text-zinc-400 uppercase font-semibold tracking-wider block mb-1">
                      Post-Listing Disclosure Evidence:
                    </span>
                    <p className="text-zinc-300 text-xs leading-relaxed mb-2">
                      {p.evidence_quote}
                    </p>
                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-2 border-t border-white/5">
                      <span className="truncate">{p.evidence_source}</span>
                      <span>Verified: {p.verification_date}</span>
                    </div>
                  </div>
                )}

                {/* Alert pill if discrepancy exists */}
                {p.alert_message && p.alert_severity !== 'none' && (
                  <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 flex-none text-rose-400 mt-0.5" />
                    <span className="text-[11px] leading-relaxed font-mono">{p.alert_message}</span>
                  </div>
                )}

                {/* Action button: Audit with new filing */}
                <div className="mt-4 pt-3 border-t border-white/10 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setActivePromiseForVerify(p);
                      setDisclosureText('');
                      setDisclosureSource('');
                      setVerifyMsg('');
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-mono text-[#D4AF37] hover:text-[#F5E59F] transition-colors cursor-pointer"
                  >
                    <span>Audit with New Disclosure</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {filteredPromises.length === 0 && !loading && (
          <div className="p-10 text-center text-zinc-500 font-mono text-xs border border-dashed border-white/10 rounded-3xl mt-6">
            No promises matched the selected filters.
          </div>
        )}
      </div>
    </section>
  );
}
