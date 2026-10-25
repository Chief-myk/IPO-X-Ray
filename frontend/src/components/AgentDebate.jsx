import React, { useState, useEffect, useCallback } from 'react';
import { 
  Scale, 
  TrendingUp, 
  ShieldAlert, 
  AlertTriangle, 
  HelpCircle, 
  Sparkles, 
  BookOpen
} from 'lucide-react';

const QUICK_COMPANIES = [
  'Kalindi Smart Mobility Limited',
  'Trafiksol ITS Technologies',
  'Resourceful Automobile'
];

export default function AgentDebate({ currentCompany, investigationId }) {
  const [company, setCompany] = useState(currentCompany || 'Kalindi Smart Mobility Limited');
  const [loading, setLoading] = useState(false);
  const [debate, setDebate] = useState(null);
  const [error, setError] = useState('');

  const fetchDebate = useCallback(async (compName, invId) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/debate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company: compName, investigation_id: invId })
      });
      if (!res.ok) {
        throw new Error('Failed to generate agent debate.');
      }
      const data = await res.json();
      setDebate(data);
    } catch (err) {
      setError(err.message || 'Error running AI debate.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Sync if currentCompany changes from hero or live investigation
  useEffect(() => {
    if (currentCompany) {
      setCompany(currentCompany);
      fetchDebate(currentCompany, investigationId);
    }
  }, [currentCompany, investigationId, fetchDebate]);

  useEffect(() => {
    fetchDebate(company, investigationId);
  }, []);

  const handleRunDebate = (e) => {
    e.preventDefault();
    if (!company.trim()) return;
    fetchDebate(company.trim(), investigationId);
  };

  return (
    <section className="relative overflow-hidden max-w-[1560px] mx-auto px-4 sm:px-8 lg:px-12 py-16 lg:py-24 border-t border-white/10 bg-black" id="debate">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute top-1/4 left-10 w-[30rem] h-[30rem] rounded-full bg-[#D4AF37]/[0.03] blur-[150px]" aria-hidden="true" />
      <div className="pointer-events-none absolute top-1/4 right-10 w-[30rem] h-[30rem] rounded-full bg-rose-500/[0.03] blur-[150px]" aria-hidden="true" />

      <div className="relative">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#D4AF37]/30 bg-[#080808] text-xs font-mono text-[#D4AF37] mb-3">
              <Scale className="w-3.5 h-3.5" />
              <span className="tracking-widest uppercase">INDEPENDENT AI AGENT CROSS-EXAMINATION</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-cinzel font-bold tracking-tight text-white">
              Agent Debate:{' '}
              <span className="text-gold-gradient">
                Bull vs Bear
              </span>
            </h2>
            <p className="mt-3 text-base text-zinc-400 max-w-[62ch] font-sans leading-relaxed">
              Two autonomous AI agents debate the IPO: the Bull builds the strongest evidence-backed growth case, while the Bear attacks its forensic vulnerabilities. An impartial Judge synthesizes both arguments against verified public records.
            </p>
          </div>

          {/* Company Search / Switcher Form */}
          <form onSubmit={handleRunDebate} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Enter company name..."
              className="px-4 py-2.5 rounded-xl bg-[#080808] border border-white/10 text-white text-sm outline-none focus:border-[#D4AF37] transition-colors w-full sm:w-64 placeholder:text-zinc-600 font-sans font-medium"
            />
            <button
              type="submit"
              disabled={loading}
              className="btn-gold inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-black font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#D4AF37]/20 hover:shadow-[#D4AF37]/40 active:scale-95 transition-all disabled:opacity-60 whitespace-nowrap cursor-pointer font-sans"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Debating…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Run Debate
                </>
              )}
            </button>
          </form>
        </div>

        {/* Quick select pills */}
        <div className="flex flex-wrap items-center gap-2 my-5">
          <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Quick Companies:</span>
          {QUICK_COMPANIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setCompany(c);
                fetchDebate(c, null);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-mono transition-colors border ${
                company.toLowerCase() === c.toLowerCase()
                  ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#F5E59F] font-semibold'
                  : 'border-white/10 bg-[#080808] text-zinc-400 hover:text-white hover:border-white/20'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {error && (
          <div className="p-4 my-4 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-400 text-sm flex items-center gap-2 font-mono">
            <AlertTriangle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && !debate && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-8 animate-pulse">
            <div className="h-80 rounded-2xl bg-[#080808] border border-white/10" />
            <div className="h-80 rounded-2xl bg-[#080808] border border-white/10" />
          </div>
        )}

        {/* Debate Arena Grid */}
        {debate && (
          <div className="space-y-8 mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
              {/* ───────── Bull Agent Column ───────── */}
              <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-[#060606] p-6 sm:p-8 shadow-2xl flex flex-col justify-between">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent" aria-hidden="true" />
                
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider">
                      <TrendingUp className="w-3.5 h-3.5" />
                      BULL AGENT CASE
                    </span>
                    <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">ADVOCATE FOR EXPANSION</span>
                  </div>

                  <p className="font-playfair text-base sm:text-lg text-white italic leading-relaxed mb-6 border-l-2 border-emerald-500/60 pl-4 bg-emerald-500/5 py-2.5 rounded-r-xl">
                    "{debate.bull_case.thesis}"
                  </p>

                  <div className="space-y-4">
                    {debate.bull_case.arguments.map((arg, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-white/5 bg-[#090909] hover:border-emerald-500/30 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <h4 className="font-bold text-white text-sm sm:text-base font-cinzel">
                            {arg.title}
                          </h4>
                          {arg.strength && (
                            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              {arg.strength}
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mb-2 font-sans">
                          {arg.detail}
                        </p>
                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
                          <BookOpen className="w-3 h-3 flex-none" />
                          <span className="truncate">{arg.evidence}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono text-zinc-500">
                  <span>Standard: Disclosed DRHP Metrics</span>
                  <span className="text-emerald-400 font-medium">Audited & Declared</span>
                </div>
              </div>

              {/* ───────── Bear Agent Column ───────── */}
              <div className="relative overflow-hidden rounded-3xl border border-rose-500/30 bg-[#060606] p-6 sm:p-8 shadow-2xl flex flex-col justify-between">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent" aria-hidden="true" />
                
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 font-mono text-xs font-bold uppercase tracking-wider">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      BEAR AGENT CASE
                    </span>
                    <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">FORENSIC COUNTER-EXAMINATION</span>
                  </div>

                  <p className="font-playfair text-base sm:text-lg text-white italic leading-relaxed mb-6 border-l-2 border-rose-500/60 pl-4 bg-rose-500/5 py-2.5 rounded-r-xl">
                    "{debate.bear_case.thesis}"
                  </p>

                  <div className="space-y-4">
                    {debate.bear_case.arguments.map((arg, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-white/5 bg-[#090909] hover:border-rose-500/30 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <h4 className="font-bold text-white text-sm sm:text-base font-cinzel">
                            {arg.title}
                          </h4>
                          {arg.severity && (
                            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30">
                              {arg.severity}
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mb-2 font-sans">
                          {arg.detail}
                        </p>
                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-rose-400">
                          <ShieldAlert className="w-3 h-3 flex-none" />
                          <span className="truncate">{arg.evidence}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono text-zinc-500">
                  <span>Standard: Independent Open-Web Auditing</span>
                  <span className="text-rose-400 font-medium">Registry Corroborated</span>
                </div>
              </div>
            </div>

            {/* ───────── Impartial Judge Podium ───────── */}
            <div className="relative overflow-hidden rounded-3xl border border-[#D4AF37]/30 bg-[#080808] p-6 sm:p-10 shadow-2xl">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-[#D4AF37] to-rose-500" aria-hidden="true" />
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-5 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-cinzel font-bold text-xl text-white">
                      Impartial Judge Verdict & Cross-Examination
                    </h3>
                    <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                      EVALUATING BOTH CASES AGAINST VERIFIED PUBLIC EVIDENCE
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono px-3.5 py-1.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/40 text-[#F5E59F] font-bold">
                    VERDICT: {debate.judge_verdict.risk_verdict || 'NEUTRAL EVALUATION'}
                  </span>
                </div>
              </div>

              {/* Synthesis */}
              <p className="font-playfair text-base sm:text-lg text-zinc-200 leading-relaxed mb-6">
                {debate.judge_verdict.synthesis}
              </p>

              {/* Contradictions & Unanswered Questions 2-Col Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
                {/* Contradictions */}
                <div className="p-5 rounded-2xl border border-rose-500/30 bg-rose-500/5">
                  <h4 className="text-xs font-bold font-mono text-rose-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>Identified Contradictions</span>
                  </h4>
                  <ul className="space-y-2.5 list-none p-0 m-0 text-xs sm:text-sm text-zinc-300 font-sans">
                    {debate.judge_verdict.contradictions.map((c, idx) => (
                      <li key={idx} className="flex items-start gap-2 leading-relaxed">
                        <span className="text-rose-400 font-mono">›</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Unanswered Questions */}
                <div className="p-5 rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/5">
                  <h4 className="text-xs font-bold font-mono text-[#D4AF37] uppercase tracking-widest mb-3 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-[#D4AF37]" />
                    <span>Unanswered Diligence Questions</span>
                  </h4>
                  <ul className="space-y-2.5 list-none p-0 m-0 text-xs sm:text-sm text-zinc-300 font-sans">
                    {debate.judge_verdict.unanswered_questions.map((q, idx) => (
                      <li key={idx} className="flex items-start gap-2 leading-relaxed">
                        <span className="text-[#D4AF37] font-mono">?</span>
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Verified Citations Footer */}
              {debate.citations && debate.citations.length > 0 && (
                <div className="pt-6 border-t border-white/10">
                  <span className="text-xs font-mono text-zinc-400 block mb-3 font-semibold uppercase tracking-wider">
                    Evidentiary Citations & Document Sources:
                  </span>
                  <div className="flex flex-wrap gap-2 text-xs font-mono">
                    {debate.citations.map((c, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-black text-zinc-300"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <strong className="text-white">{c.title}</strong>
                        <span className="text-zinc-500">({c.ref})</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
