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
    <section className="relative overflow-hidden max-w-[1560px] mx-auto px-4 sm:px-8 lg:px-12 py-16 lg:py-24 border-t border-line" id="debate">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute top-1/4 left-10 w-[30rem] h-[30rem] rounded-full bg-clear/[0.06] blur-[150px]" aria-hidden="true" />
      <div className="pointer-events-none absolute top-1/4 right-10 w-[30rem] h-[30rem] rounded-full bg-critical/[0.06] blur-[150px]" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 bg-grid-fintech opacity-20" aria-hidden="true" />

      <div className="relative">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-line/70">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-beam/30 bg-[#0E1F2E]/80 backdrop-blur-md text-xs font-mono text-beam mb-3">
              <Scale className="w-3.5 h-3.5" />
              <span>INDEPENDENT AI AGENT CROSS-EXAMINATION</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-['Bricolage_Grotesque'] text-bone">
              Agent Debate:{' '}
              <span className="bg-gradient-to-r from-clear via-[#A8E8F2] to-critical bg-clip-text text-transparent">
                Bull vs Bear
              </span>
            </h2>
            <p className="mt-2 text-base text-bone-dim max-w-[62ch]">
              Two autonomous AI agents debate the IPO: the Bull builds the strongest evidence-backed growth case, while the Bear attacks its forensic vulnerabilities. An impartial Judge resolves contradictions without fabricating facts.
            </p>
          </div>

          {/* Company Search / Switcher Form */}
          <form onSubmit={handleRunDebate} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Enter company name..."
              className="px-4 py-2.5 rounded-xl bg-[#091522] border border-[#27435E] text-bone text-sm outline-none focus:border-beam/60 transition-colors w-full sm:w-64 placeholder:text-bone-dim/60 font-medium"
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-beam to-[#A3EAF7] text-[#091724] font-bold text-sm shadow-[0_0_20px_rgba(127,216,232,0.35)] hover:shadow-[0_0_30px_rgba(127,216,232,0.6)] active:scale-95 transition-all disabled:opacity-60 whitespace-nowrap cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-[#091724] border-t-transparent rounded-full animate-spin" />
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
        <div className="flex flex-wrap items-center gap-2 my-4">
          <span className="text-xs font-mono text-bone-dim">Quick IPOs:</span>
          {QUICK_COMPANIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setCompany(c);
                fetchDebate(c, null);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors border ${
                company.toLowerCase() === c.toLowerCase()
                  ? 'border-beam/70 bg-beam/10 text-beam font-semibold'
                  : 'border-line/60 bg-[#122334]/60 text-bone-dim hover:text-bone hover:border-beam/40'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {error && (
          <div className="p-4 my-4 rounded-xl border border-critical/40 bg-critical/10 text-critical text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && !debate && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-8 animate-pulse">
            <div className="h-80 rounded-2xl bg-film-2/50 border border-line" />
            <div className="h-80 rounded-2xl bg-film-2/50 border border-line" />
          </div>
        )}

        {/* Debate Arena Grid */}
        {debate && (
          <div className="space-y-8 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
              {/* ───────── Bull Agent Column ───────── */}
              <div className="relative overflow-hidden rounded-3xl border border-clear/40 bg-gradient-to-br from-[#0D241C] via-[#0E1E2B] to-[#091522] p-6 sm:p-8 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.8),0_0_30px_-15px_rgba(143,224,174,0.25)] flex flex-col justify-between">
                <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-transparent via-clear to-transparent" aria-hidden="true" />
                
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-clear/15 border border-clear/40 text-clear font-mono text-xs font-bold uppercase tracking-wider">
                      <TrendingUp className="w-3.5 h-3.5" />
                      BULL AGENT CASE
                    </span>
                    <span className="text-[11px] font-mono text-bone-dim">ADVOCATE FOR EXPANSION</span>
                  </div>

                  <p className="font-['Source_Serif_4'] text-base sm:text-lg text-bone italic leading-relaxed mb-6 border-l-2 border-clear/60 pl-4 bg-clear/5 py-2 rounded-r-xl">
                    "{debate.bull_case.thesis}"
                  </p>

                  <div className="space-y-4">
                    {debate.bull_case.arguments.map((arg, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-line/70 bg-[#0E1C2B]/80 hover:border-clear/50 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <h4 className="font-bold text-bone text-sm sm:text-base font-['Bricolage_Grotesque']">
                            {arg.title}
                          </h4>
                          {arg.strength && (
                            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-clear/10 text-clear border border-clear/30">
                              {arg.strength}
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-bone-dim leading-relaxed mb-2">
                          {arg.detail}
                        </p>
                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-clear">
                          <BookOpen className="w-3 h-3 flex-none" />
                          <span className="truncate">{arg.evidence}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-line/60 flex items-center justify-between text-xs font-mono text-bone-dim">
                  <span>Standard: Disclosed DRHP Metrics</span>
                  <span className="text-clear font-medium">Audited & Declared</span>
                </div>
              </div>

              {/* ───────── Bear Agent Column ───────── */}
              <div className="relative overflow-hidden rounded-3xl border border-critical/40 bg-gradient-to-br from-[#261214] via-[#0E1E2B] to-[#091522] p-6 sm:p-8 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.8),0_0_30px_-15px_rgba(255,90,78,0.25)] flex flex-col justify-between">
                <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-transparent via-critical to-transparent" aria-hidden="true" />
                
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-critical/15 border border-critical/40 text-critical font-mono text-xs font-bold uppercase tracking-wider">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      BEAR AGENT CASE
                    </span>
                    <span className="text-[11px] font-mono text-bone-dim">FORENSIC COUNTER-EXAMINATION</span>
                  </div>

                  <p className="font-['Source_Serif_4'] text-base sm:text-lg text-bone italic leading-relaxed mb-6 border-l-2 border-critical/60 pl-4 bg-critical/5 py-2 rounded-r-xl">
                    "{debate.bear_case.thesis}"
                  </p>

                  <div className="space-y-4">
                    {debate.bear_case.arguments.map((arg, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-line/70 bg-[#0E1C2B]/80 hover:border-critical/50 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <h4 className="font-bold text-bone text-sm sm:text-base font-['Bricolage_Grotesque']">
                            {arg.title}
                          </h4>
                          {arg.severity && (
                            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-critical/10 text-critical border border-critical/30">
                              {arg.severity}
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-bone-dim leading-relaxed mb-2">
                          {arg.detail}
                        </p>
                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-critical">
                          <ShieldAlert className="w-3 h-3 flex-none" />
                          <span className="truncate">{arg.evidence}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-line/60 flex items-center justify-between text-xs font-mono text-bone-dim">
                  <span>Standard: Independent Open-Web Auditing</span>
                  <span className="text-critical font-medium">Registry Corroborated</span>
                </div>
              </div>
            </div>

            {/* ───────── Impartial Judge Podium ───────── */}
            <div className="relative overflow-hidden rounded-3xl border border-[#27435E] bg-gradient-to-br from-[#122436] via-[#0E1C2B] to-[#0A1622] p-6 sm:p-10 shadow-[0_30px_80px_-25px_rgba(0,0,0,0.85)]">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-clear via-beam to-critical" aria-hidden="true" />
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-line/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-beam/10 border border-beam/30 flex items-center justify-center text-beam">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-['Bricolage_Grotesque'] font-bold text-xl text-bone">
                      Impartial Judge Verdict & Cross-Examination
                    </h3>
                    <span className="text-xs font-mono text-bone-dim">
                      EVALUATING BOTH CASES AGAINST VERIFIED PUBLIC EVIDENCE
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono px-3 py-1 rounded-full bg-beam/10 border border-beam/30 text-beam font-bold">
                    VERDICT: {debate.judge_verdict.risk_verdict || 'NEUTRAL EVALUATION'}
                  </span>
                </div>
              </div>

              {/* Synthesis */}
              <p className="font-['Source_Serif_4'] text-base sm:text-lg text-bone leading-relaxed mb-6">
                {debate.judge_verdict.synthesis}
              </p>

              {/* Contradictions & Unanswered Questions 2-Col Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
                {/* Contradictions */}
                <div className="p-5 rounded-2xl border border-medium/40 bg-medium/5">
                  <h4 className="text-sm font-bold font-mono text-medium uppercase tracking-wider mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-medium" />
                    <span>Identified Contradictions</span>
                  </h4>
                  <ul className="space-y-2.5 list-none p-0 m-0 text-xs sm:text-sm text-bone-dim">
                    {debate.judge_verdict.contradictions.map((c, idx) => (
                      <li key={idx} className="flex items-start gap-2 leading-relaxed">
                        <span className="text-medium font-mono">›</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Unanswered Questions */}
                <div className="p-5 rounded-2xl border border-beam/40 bg-beam/5">
                  <h4 className="text-sm font-bold font-mono text-beam uppercase tracking-wider mb-3 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-beam" />
                    <span>Unanswered Diligence Questions</span>
                  </h4>
                  <ul className="space-y-2.5 list-none p-0 m-0 text-xs sm:text-sm text-bone-dim">
                    {debate.judge_verdict.unanswered_questions.map((q, idx) => (
                      <li key={idx} className="flex items-start gap-2 leading-relaxed">
                        <span className="text-beam font-mono">?</span>
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Verified Citations Footer */}
              {debate.citations && debate.citations.length > 0 && (
                <div className="pt-6 border-t border-line/60">
                  <span className="text-xs font-mono text-bone-dim block mb-2 font-semibold">
                    Evidentiary Citations & Document Sources:
                  </span>
                  <div className="flex flex-wrap gap-2 text-xs font-mono">
                    {debate.citations.map((c, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-line/80 bg-[#0A1624]/80 text-bone-dim"
                      >
                        <BookOpen className="w-3 h-3 text-beam" />
                        <strong className="text-bone">{c.title}</strong>
                        <span>({c.ref})</span>
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
