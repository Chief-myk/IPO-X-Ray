import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Calculator, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  ShieldCheck, 
  Info, 
  DollarSign, 
  Clock, 
  Percent,
  Sparkles
} from 'lucide-react';
import { toast } from 'react-toastify';

const QUICK_AMOUNTS = [
  { label: '₹15,000 (1 Lot)', value: 15000 },
  { label: '₹50,000', value: 50000 },
  { label: '₹1,00,000', value: 100000 },
  { label: '₹2,00,000', value: 200000 },
];

const HORIZONS = [
  { label: 'Listing Day', value: 0 },
  { label: '6 Months', value: 6 },
  { label: '12 Months (1 Yr)', value: 12 },
  { label: '24 Months (2 Yrs)', value: 24 },
  { label: '36 Months (3 Yrs)', value: 36 },
];

const QUICK_COMPANIES = [
  'Kalindi Smart Mobility Limited',
  'Trafiksol ITS Technologies',
  'Resourceful Automobile'
];

export default function InvestmentSimulator({ currentCompany, riskScore }) {
  const audioRef = useRef(null);
  const [company, setCompany] = useState(currentCompany || 'Kalindi Smart Mobility Limited');
  const [amount, setAmount] = useState(15000);
  const [horizon, setHorizon] = useState(12);
  const [simulation, setSimulation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const runSimulation = useCallback(async (compName, invAmount, horizMonths) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/simulator/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: compName,
          investment_amount: Number(invAmount),
          horizon_months: Number(horizMonths),
          risk_score: riskScore
        })
      });
      if (!res.ok) {
        throw new Error('Simulation calculation failed.');
      }
      const data = await res.json();
      setSimulation(data);
      if (data.risk_score >= 60 || (data.risk_level && data.risk_level.toLowerCase().includes('high'))) {
        toast.error("Elevated forensic risk detected for this allocation", {
          toastId: `sim-risk-${compName}`,
          position: "top-right",
          autoClose: 5000,
          theme: "dark",
        });
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(() => {});
        }
      }
    } catch (err) {
      setError(err.message || 'Error running simulation.');
    } finally {
      setLoading(false);
    }
  }, [riskScore]);

  // Sync if currentCompany changes
  useEffect(() => {
    if (currentCompany) {
      setCompany(currentCompany);
      runSimulation(currentCompany, amount, horizon);
    }
  }, [currentCompany, amount, horizon, runSimulation]);

  useEffect(() => {
    runSimulation(company, amount, horizon);
  }, []);

  const handleCalculate = (e) => {
    e.preventDefault();
    runSimulation(company, amount, horizon);
  };

  return (
    <section className="relative overflow-hidden max-w-[1560px] mx-auto px-4 sm:px-8 lg:px-12 py-16 lg:py-24 border-t border-white/10 bg-black" id="simulator">
      {/* Hidden audio element */}
      <audio ref={audioRef} preload="none">
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcHCqS2/P/hEAgH4/N6P+eWzscb7Xv/6FhPB55sfL/rnFJHmuu7f+ycT8ce7Ds/7txRR18rfD/v3hNHYCx7f/Ad0keeLLt/8R8UR+DtOr/y4FRIIew6f/Pg1gigbPn/9aJWCSGr9//3ZBhJYys2v/lm2gskKzM/++ieTCVqcD/9a59O56lsP/4s4ZBnqCo/v26j06io6H//sWUU6OhoP/9yZtV" type="audio/wav" />
      </audio>

      {/* Ambient background glows */}
      <div className="pointer-events-none absolute top-1/3 left-1/4 w-[28rem] h-[28rem] rounded-full bg-[#D4AF37]/[0.02] blur-[140px]" aria-hidden="true" />
      <div className="pointer-events-none absolute top-1/3 right-1/4 w-[28rem] h-[28rem] rounded-full bg-white/[0.02] blur-[140px]" aria-hidden="true" />

      <div className="relative">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#D4AF37]/30 bg-[#080808] text-xs font-mono text-[#D4AF37] mb-3">
              <Calculator className="w-3.5 h-3.5" />
              <span className="tracking-widest uppercase">EVIDENCE-WEIGHTED SCENARIO MODELING</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-cinzel font-bold tracking-tight text-white">
              Investment{' '}
              <span className="text-gold-gradient">
                Simulator
              </span>
            </h2>
            <p className="mt-3 text-base text-zinc-400 max-w-[65ch] font-sans leading-relaxed">
              Model multi-scenario capital outcomes (Best, Base, and Worst case) derived from empirical peer cohort drawdowns, valuation multiples, and forensic risk indicators. No guaranteed returns.
            </p>
          </div>

          {/* Quick select companies */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Target IPO:</span>
            {QUICK_COMPANIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setCompany(c);
                  runSimulation(c, amount, horizon);
                }}
                className={`px-3 py-1 rounded-xl text-xs font-mono transition-colors border ${
                  company.toLowerCase() === c.toLowerCase()
                    ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#F5E59F] font-semibold'
                    : 'border-white/10 bg-[#080808] text-zinc-400 hover:text-white hover:border-white/20'
                }`}
              >
                {c.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Input Parameters Form */}
        <form onSubmit={handleCalculate} className="my-8 p-6 sm:p-8 rounded-3xl border border-white/10 bg-[#080808] shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. Target Company */}
            <div>
              <label className="block text-xs font-mono text-zinc-400 uppercase font-semibold mb-2 tracking-wider">
                1. Target Company
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Company Name"
                className="w-full px-4 py-2.5 rounded-xl bg-black border border-white/10 text-white text-sm outline-none focus:border-[#D4AF37] transition-colors font-sans"
              />
              <span className="text-[11px] font-mono text-zinc-500 mt-1.5 block">
                Forensic penalty is automatically tied to risk score
              </span>
            </div>

            {/* 2. Capital Allocation */}
            <div>
              <label className="block text-xs font-mono text-zinc-400 uppercase font-semibold mb-2 tracking-wider">
                2. Allocation Amount (INR)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-zinc-500 text-sm font-mono">₹</span>
                <input
                  type="number"
                  min="5000"
                  step="1000"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-black border border-white/10 text-white text-sm outline-none focus:border-[#D4AF37] transition-colors font-mono font-semibold"
                />
              </div>

              {/* Quick Amount Chips */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {QUICK_AMOUNTS.map((q) => (
                  <button
                    key={q.value}
                    type="button"
                    onClick={() => {
                      setAmount(q.value);
                      runSimulation(company, q.value, horizon);
                    }}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-mono transition-colors border ${
                      amount === q.value
                        ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#F5E59F] font-bold'
                        : 'border-white/5 bg-black text-zinc-400 hover:text-white'
                    }`}
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Horizon Selector */}
            <div>
              <label className="block text-xs font-mono text-zinc-400 uppercase font-semibold mb-2 tracking-wider">
                3. Holding Horizon
              </label>
              <select
                value={horizon}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setHorizon(val);
                  runSimulation(company, amount, val);
                }}
                className="w-full px-4 py-2.5 rounded-xl bg-black border border-white/10 text-white text-sm outline-none focus:border-[#D4AF37] transition-colors cursor-pointer font-sans"
              >
                {HORIZONS.map((h) => (
                  <option key={h.value} value={h.value} className="bg-black text-white">
                    {h.label}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                disabled={loading}
                className="btn-gold mt-3.5 w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-black font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#D4AF37]/20 hover:shadow-[#D4AF37]/40 active:scale-98 transition-all disabled:opacity-60 cursor-pointer font-sans"
              >
                {loading ? 'Calculating…' : 'Recalculate Scenarios'}
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div className="p-4 my-4 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-400 text-sm flex items-center gap-2 font-mono">
            <AlertTriangle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Dashboard Outcomes */}
        {simulation && (
          <div className="space-y-8">
            {/* KPI Summary Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl border border-white/10 bg-[#080808]">
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">Risk Score Index</span>
                <div className="flex items-center gap-2">
                  <b className="text-3xl font-extrabold font-mono" style={{ color: simulation.risk_score >= 60 ? '#FF5A4E' : '#D4AF37' }}>
                    {simulation.risk_score}
                  </b>
                  <span className="text-xs font-mono text-zinc-500">/100</span>
                </div>
                <span className="text-[11px] font-mono text-zinc-400 mt-0.5 block">{simulation.risk_level}</span>
              </div>

              <div className="p-5 rounded-2xl border border-white/10 bg-[#080808]">
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">Expected Return</span>
                <b className={`text-3xl font-extrabold font-mono ${simulation.expected_return_pct >= 0 ? 'text-[#8FE0AE]' : 'text-rose-400'}`}>
                  {simulation.expected_return_pct > 0 ? `+${simulation.expected_return_pct}%` : `${simulation.expected_return_pct}%`}
                </b>
                <span className="text-[11px] font-mono text-zinc-500 block mt-0.5">Probability-Weighted Mean</span>
              </div>

              <div className="p-5 rounded-2xl border border-white/10 bg-[#080808]">
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">Expected Final Value</span>
                <b className="text-3xl font-extrabold font-mono text-white">
                  ₹{Math.round(simulation.expected_value).toLocaleString('en-IN')}
                </b>
                <span className={`text-[11px] font-mono block mt-0.5 ${simulation.expected_gain_loss_inr >= 0 ? 'text-[#8FE0AE]' : 'text-rose-400'}`}>
                  {simulation.expected_gain_loss_inr >= 0 ? `+₹${simulation.expected_gain_loss_inr.toLocaleString('en-IN')}` : `-₹${Math.abs(simulation.expected_gain_loss_inr).toLocaleString('en-IN')}`}
                </span>
              </div>

              <div className="p-5 rounded-2xl border border-rose-500/30 bg-rose-500/5">
                <span className="text-[10px] font-mono text-rose-400 uppercase font-bold tracking-wider block mb-1">Maximum Tail Drawdown</span>
                <b className="text-3xl font-extrabold font-mono text-rose-400">
                  -₹{Math.abs(simulation.worst_case.gain_loss_inr).toLocaleString('en-IN')}
                </b>
                <span className="text-[11px] font-mono text-rose-400/80 block mt-0.5">Worst-Case Potential Loss</span>
              </div>
            </div>

            {/* Three Scenario Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Best Case */}
              <div className="relative overflow-hidden p-6 sm:p-7 rounded-3xl border border-emerald-500/30 bg-[#060606] shadow-xl flex flex-col justify-between">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />
                <div>
                  <div className="flex items-center justify-between gap-1 mb-4">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5" />
                      Best-Case
                    </span>
                    <span className="text-xs font-mono text-zinc-500">
                      {Math.round(simulation.best_case.probability_weight * 100)}% prob
                    </span>
                  </div>

                  <div className="my-4">
                    <span className="text-4xl sm:text-5xl font-black font-mono text-emerald-400 block">
                      +{simulation.best_case.return_pct}%
                    </span>
                    <span className="text-sm font-mono text-zinc-400 mt-2 block">
                      Portfolio Value: <strong className="text-white">₹{Math.round(simulation.best_case.final_value_inr).toLocaleString('en-IN')}</strong>
                    </span>
                    <span className="text-xs font-mono text-emerald-400 mt-0.5 block">
                      (+₹{Math.round(simulation.best_case.gain_loss_inr).toLocaleString('en-IN')})
                    </span>
                  </div>

                  <div className="pt-4 border-t border-white/10">
                    <span className="text-xs font-mono text-zinc-400 font-semibold uppercase tracking-wider block mb-2">Key Assumptions:</span>
                    <ul className="space-y-1.5 list-none p-0 m-0 text-xs text-zinc-400 font-sans">
                      {simulation.best_case.assumptions.map((a, i) => (
                        <li key={i} className="flex items-start gap-1.5 leading-relaxed">
                          <span className="text-emerald-400 font-mono">›</span>
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Base Case */}
              <div className="relative overflow-hidden p-6 sm:p-7 rounded-3xl border border-[#D4AF37]/40 bg-[#080808] shadow-xl flex flex-col justify-between">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
                <div>
                  <div className="flex items-center justify-between gap-1 mb-4">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#D4AF37] px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/40">
                      Base-Case Scenario
                    </span>
                    <span className="text-xs font-mono text-zinc-500">
                      {Math.round(simulation.base_case.probability_weight * 100)}% prob
                    </span>
                  </div>

                  <div className="my-4">
                    <span className={`text-4xl sm:text-5xl font-black font-mono block ${simulation.base_case.return_pct >= 0 ? 'text-[#D4AF37]' : 'text-zinc-300'}`}>
                      {simulation.base_case.return_pct > 0 ? `+${simulation.base_case.return_pct}%` : `${simulation.base_case.return_pct}%`}
                    </span>
                    <span className="text-sm font-mono text-zinc-400 mt-2 block">
                      Portfolio Value: <strong className="text-white">₹{Math.round(simulation.base_case.final_value_inr).toLocaleString('en-IN')}</strong>
                    </span>
                    <span className="text-xs font-mono text-zinc-400 mt-0.5 block">
                      ({simulation.base_case.gain_loss_inr >= 0 ? `+₹${Math.round(simulation.base_case.gain_loss_inr).toLocaleString('en-IN')}` : `-₹${Math.round(Math.abs(simulation.base_case.gain_loss_inr)).toLocaleString('en-IN')}`})
                    </span>
                  </div>

                  <div className="pt-4 border-t border-white/10">
                    <span className="text-xs font-mono text-zinc-400 font-semibold uppercase tracking-wider block mb-2">Key Assumptions:</span>
                    <ul className="space-y-1.5 list-none p-0 m-0 text-xs text-zinc-400 font-sans">
                      {simulation.base_case.assumptions.map((a, i) => (
                        <li key={i} className="flex items-start gap-1.5 leading-relaxed">
                          <span className="text-[#D4AF37] font-mono">›</span>
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Worst Case */}
              <div className="relative overflow-hidden p-6 sm:p-7 rounded-3xl border border-rose-500/30 bg-[#060606] shadow-xl flex flex-col justify-between">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent" />
                <div>
                  <div className="flex items-center justify-between gap-1 mb-4">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-400 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center gap-1.5">
                      <TrendingDown className="w-3.5 h-3.5" />
                      Worst-Case
                    </span>
                    <span className="text-xs font-mono text-zinc-500">
                      {Math.round(simulation.worst_case.probability_weight * 100)}% prob
                    </span>
                  </div>

                  <div className="my-4">
                    <span className="text-4xl sm:text-5xl font-black font-mono text-rose-400 block">
                      {simulation.worst_case.return_pct}%
                    </span>
                    <span className="text-sm font-mono text-zinc-400 mt-2 block">
                      Portfolio Value: <strong className="text-white">₹{Math.round(simulation.worst_case.final_value_inr).toLocaleString('en-IN')}</strong>
                    </span>
                    <span className="text-xs font-mono text-rose-400 mt-0.5 block">
                      (-₹{Math.round(Math.abs(simulation.worst_case.gain_loss_inr)).toLocaleString('en-IN')})
                    </span>
                  </div>

                  <div className="pt-4 border-t border-white/10">
                    <span className="text-xs font-mono text-zinc-400 font-semibold uppercase tracking-wider block mb-2">Key Assumptions:</span>
                    <ul className="space-y-1.5 list-none p-0 m-0 text-xs text-zinc-400 font-sans">
                      {simulation.worst_case.assumptions.map((a, i) => (
                        <li key={i} className="flex items-start gap-1.5 leading-relaxed">
                          <span className="text-rose-400 font-mono">›</span>
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Methodology & Regulatory Disclaimer Notice */}
            <div className="p-6 rounded-2xl border border-white/10 bg-[#080808] text-xs text-zinc-400 leading-relaxed space-y-2">
              <div className="flex items-center gap-2 text-[#D4AF37] font-mono font-semibold">
                <Info className="w-4 h-4 flex-none" />
                <span className="uppercase tracking-wider">Transparent Methodology & Data Limitations</span>
              </div>
              <p className="font-sans">{simulation.assumptions.methodology}</p>
              <p className="font-sans">{simulation.assumptions.data_limitations}</p>
              <p className="font-sans font-medium text-zinc-300 border-t border-white/10 pt-2.5">
                {simulation.assumptions.disclaimer}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
