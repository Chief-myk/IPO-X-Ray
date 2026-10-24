import React, { useState, useEffect, useCallback } from 'react';
import { 
  CheckCircle2, 
  AlertOctagon, 
  Clock, 
  HelpCircle, 
  AlertTriangle, 
  Bell, 
  Filter, 
  Search, 
  FileText, 
  ExternalLink,
  Building2, 
  Briefcase,
  ArrowRight
} from 'lucide-react';

const STATUS_CONFIG = {
  'Met': {
    color: '#8FE0AE',
    bg: 'bg-clear/15',
    border: 'border-clear/40',
    icon: CheckCircle2,
    desc: 'Fully corroborated by post-listing annual reports or exchange disclosures.'
  },
  'Partially Met': {
    color: '#FFC23D',
    bg: 'bg-medium/15',
    border: 'border-medium/40',
    icon: Clock,
    desc: 'Progress reported in disclosures, but target is only partially achieved.'
  },
  'Missed': {
    color: '#FF5A4E',
    bg: 'bg-critical/15',
    border: 'border-critical/40',
    icon: AlertOctagon,
    desc: 'Subsequent filings confirm target missed, diverted proceeds, or cancelled contracts.'
  },
  'Unverified': {
    color: '#8EA3B5',
    bg: 'bg-unverified/15',
    border: 'border-unverified/40',
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
      const res = await fetch('/api/promises/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promise_id: activePromiseForVerify.id,
          disclosure_text: disclosureText.trim(),
          disclosure_source: disclosureSource.trim() || 'Annual Report Post-Listing'
        })
      });
      if (!res.ok) throw new Error('Verification request failed.');
      const updated = await res.json();
      setVerifyMsg(`Status updated to: ${updated.status}`);
      setDisclosureText('');
      setDisclosureSource('');
      setActivePromiseForVerify(null);
      fetchPromisesAndAlerts();
    } catch (err) {
      setVerifyMsg(err.message || 'Verification error.');
    } finally {
      setVerifyLoading(false);
    }
  };

  const filteredPromises = promises.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.company.toLowerCase().includes(q) ||
      p.title.toLowerCase().includes(q) ||
      p.quotation.toLowerCase().includes(q)
    );
  });

  return (
    <section className="relative overflow-hidden max-w-[1560px] mx-auto px-4 sm:px-8 lg:px-12 py-16 lg:py-24 border-t border-line" id="promises">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute top-1/4 right-1/4 w-[32rem] h-[32rem] rounded-full bg-beam/[0.06] blur-[150px]" aria-hidden="true" />
      <div className="pointer-events-none absolute bottom-10 left-10 w-[30rem] h-[30rem] rounded-full bg-[#183552]/[0.25] blur-[140px]" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 bg-grid-fintech opacity-20" aria-hidden="true" />

      <div className="relative">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-line/70">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-beam/30 bg-[#0E1F2E]/80 backdrop-blur-md text-xs font-mono text-beam mb-3">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>POST-LISTING STATUTORY COMMITMENT AUDITING</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-['Bricolage_Grotesque'] text-bone">
              IPO Promise{' '}
              <span className="bg-gradient-to-r from-beam via-[#A3EAF7] to-beam bg-clip-text text-transparent">
                Tracker
              </span>
            </h2>
            <p className="mt-2 text-base text-bone-dim max-w-[65ch] leading-relaxed">
              Track measurable DRHP promises—headcount, capex, revenue targets, and proceeds utilization—compared against subsequent Annual Reports and Exchange disclosures. Clear distinction between **Met, Partially Met, Missed, and Unverified**.
            </p>
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#091522] border border-[#27435E] text-sm w-full md:w-72">
            <Search className="w-4 h-4 text-bone-dim flex-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter company or promise..."
              className="bg-transparent border-0 text-bone text-xs outline-none placeholder:text-bone-dim/60 w-full"
            />
          </div>
        </div>

        {/* Active Disclosures / Alerts Ticker */}
        {alerts.length > 0 && (
          <div className="my-6 p-4 rounded-2xl border border-critical/40 bg-critical/10 backdrop-blur-md shadow-md">
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-critical uppercase mb-2">
              <Bell className="w-4 h-4 animate-bounce text-critical" />
              <span>Active Deviation & Escalation Alerts ({alerts.length})</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {alerts.slice(0, 4).map((a) => (
                <div key={a.id} className="p-2.5 rounded-xl bg-[#091522]/90 border border-critical/30 flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-critical flex-none mt-1" />
                  <div>
                    <strong className="text-bone block">{a.company}: {a.title}</strong>
                    <span className="text-critical text-[11px] font-mono">{a.alert_message}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 my-6 p-3 rounded-2xl border border-line/70 bg-[#0E1C2B]/80 backdrop-blur-md">
          {/* Status Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
            <span className="text-bone-dim mr-1">Status:</span>
            {['', 'Met', 'Partially Met', 'Missed', 'Unverified'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-1 rounded-xl border transition-colors ${
                  selectedStatus === st
                    ? 'border-beam text-beam bg-beam/15 font-bold shadow-sm'
                    : 'border-line/60 text-bone-dim hover:text-bone hover:border-beam/30'
                }`}
              >
                {st || 'All Statuses'}
              </button>
            ))}
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-bone-dim">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#091522] border border-line text-bone text-xs outline-none cursor-pointer"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id} className="bg-[#091522] text-bone">
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Verification Modal / Drawer (if user selects a promise to verify) */}
        {activePromiseForVerify && (
          <div className="my-6 p-6 rounded-3xl border border-beam/60 bg-[#0A1624] shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between mb-4 border-b border-line/60 pb-3">
              <h4 className="font-['Bricolage_Grotesque'] text-lg font-bold text-bone">
                Verify Commitment Against New Public Disclosure
              </h4>
              <button
                type="button"
                onClick={() => setActivePromiseForVerify(null)}
                className="text-xs font-mono text-bone-dim hover:text-bone px-2 py-1 rounded bg-film-2"
              >
                Close ✕
              </button>
            </div>
            <p className="text-xs text-bone-dim mb-3 font-mono">
              Auditing: <strong className="text-bone">{activePromiseForVerify.company}</strong> — "{activePromiseForVerify.title}"
            </p>
            <form onSubmit={handleVerifyCommitment} className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-bone-dim uppercase mb-1">
                  Subsequent Filing Source / URL / Citation:
                </label>
                <input
                  type="text"
                  value={disclosureSource}
                  onChange={(e) => setDisclosureSource(e.target.value)}
                  placeholder="e.g. FY2025 Annual Report Page 42, NSE Filing NSE/SME/2026/041"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#07111A] border border-line text-bone text-xs outline-none focus:border-beam"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-bone-dim uppercase mb-1">
                  Excerpts from Subsequent Statutory Disclosure:
                </label>
                <textarea
                  rows={4}
                  value={disclosureText}
                  onChange={(e) => setDisclosureText(e.target.value)}
                  placeholder="Paste the relevant section from the annual report, exchange disclosure, or auditor notes..."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#07111A] border border-line text-bone text-xs outline-none focus:border-beam"
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={verifyLoading}
                  className="px-5 py-2 rounded-xl bg-beam text-[#091724] font-bold text-xs shadow-md hover:bg-[#A3EAF7] transition-all cursor-pointer disabled:opacity-60"
                >
                  {verifyLoading ? 'Auditing with AI…' : 'Run Audit Verification'}
                </button>
                {verifyMsg && <span className="text-xs font-mono text-beam">{verifyMsg}</span>}
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
                className={`relative overflow-hidden p-6 rounded-3xl border bg-gradient-to-br from-[#122436]/90 via-[#0E1C2B]/90 to-[#0A1622]/90 shadow-md transition-all duration-300 hover:-translate-y-1 ${cfg.border}`}
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

                  <span className="text-[11px] font-mono text-bone-dim">
                    {p.measurement_period}
                  </span>
                </div>

                <div className="mb-2">
                  <span className="text-[11px] font-mono text-beam uppercase font-semibold block">
                    {p.company} · {p.category.replace(/_/g, ' ')}
                  </span>
                  <h3 className="font-['Bricolage_Grotesque'] text-lg sm:text-xl font-bold text-bone mt-0.5">
                    {p.title}
                  </h3>
                </div>

                {/* Original Quotation from DRHP */}
                <div className="my-3.5 p-3.5 rounded-xl border border-line/60 bg-[#08121B]/80 font-['Source_Serif_4'] italic text-sm text-bone-dim leading-relaxed">
                  "{p.quotation}"
                  <span className="block not-italic font-mono text-[10px] text-beam mt-1.5">
                    Source: {p.source_ref}
                  </span>
                </div>

                {/* Baseline vs Target */}
                <div className="grid grid-cols-2 gap-2 my-3 font-mono text-xs">
                  <div className="p-2.5 rounded-xl bg-film-2/40 border border-line/50">
                    <span className="text-[10px] text-bone-dim uppercase block">Baseline at Filing</span>
                    <strong className="text-bone text-[11px] block truncate">{p.baseline_val || 'N/A'}</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-film-2/40 border border-line/50">
                    <span className="text-[10px] text-beam uppercase block">Promised Target</span>
                    <strong className="text-beam text-[11px] block truncate">{p.target_val || 'N/A'}</strong>
                  </div>
                </div>

                {/* Subsequent Disclosure Evidence Section */}
                {p.evidence_quote && (
                  <div className="mt-3 p-3 rounded-xl border border-line/80 bg-[#091522] text-xs">
                    <span className="font-mono text-[10px] text-bone-dim uppercase font-semibold block mb-1">
                      Post-Listing Disclosure Evidence:
                    </span>
                    <p className="text-bone text-[11px] leading-relaxed mb-1.5">
                      {p.evidence_quote}
                    </p>
                    <div className="flex items-center justify-between text-[10px] font-mono text-bone-dim pt-1 border-t border-line/40">
                      <span className="truncate">{p.evidence_source}</span>
                      <span>Verified: {p.verification_date}</span>
                    </div>
                  </div>
                )}

                {/* Alert pill if discrepancy exists */}
                {p.alert_message && p.alert_severity !== 'none' && (
                  <div className="mt-3 p-2.5 rounded-xl bg-critical/10 border border-critical/30 text-critical text-xs flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 flex-none mt-0.5" />
                    <span className="text-[11px] leading-snug">{p.alert_message}</span>
                  </div>
                )}

                {/* Action button: Audit with new filing */}
                <div className="mt-4 pt-3 border-t border-line/50 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setActivePromiseForVerify(p);
                      setDisclosureText('');
                      setDisclosureSource('');
                      setVerifyMsg('');
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-mono text-beam hover:text-[#A3EAF7] transition-colors cursor-pointer"
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
          <div className="p-8 text-center text-bone-dim font-mono text-xs border border-dashed border-line rounded-3xl mt-6">
            No promises matched the selected filters.
          </div>
        )}
      </div>
    </section>
  );
}
