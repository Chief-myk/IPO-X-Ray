import React, { useState, useEffect, useCallback } from 'react';
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
    <section className="relative overflow-hidden max-w-[1560px] mx-auto px-4 sm:px-8 lg:px-12 py-16 lg:py-24 border-t border-line" id="simulator">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute top-1/3 left-1/4 w-[32rem] h-[32rem] rounded-full bg-beam/[0.06] blur-[150px]" aria-hidden="true" />
      <div className="pointer-events-none absolute bottom-10 right-10 w-[30rem] h-[30rem] rounded-full bg-critical/[0.05] blur-[140px]" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 bg-grid-fintech opacity-20" aria-hidden="true" />

      <div className="relative">
        {/* Section Header */}
        <div className="max-w-[70ch] mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-beam/30 bg-[#0E1F2E]/80 backdrop-blur-md text-xs font-mono text-beam mb-3">
            <Calculator className="w-3.5 h-3.5" />
            <span>FINANCIAL SCENARIO MODELING</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-['Bricolage_Grotesque'] text-bone">
            Investment Decision{' '}
            <span className="bg-gradient-to-r from-beam via-[#A3EAF7] to-beam bg-clip-text text-transparent">
              Simulator
            </span>
          </h2>
          <p className="mt-2 text-base text-bone-dim leading-relaxed">
            Model hypothetical Best-Case, Base-Case, and Worst-Case financial returns for any SME IPO based on its verified risk score, planned investment capital, and holding horizon. Transparent calculations with no guaranteed returns.
          </p>
        </div>

        {/* Input Parameters Controls Bar */}
        <form onSubmit={handleCalculate} className="p-6 sm:p-8 rounded-3xl border border-[#27435E] bg-gradient-to-br from-[#122436]/90 via-[#0E1C2B]/90 to-[#0A1622]/90 backdrop-blur-xl shadow-xl mb-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Company Selection */}
            <div>
              <label className="block text-xs font-mono text-bone-dim uppercase font-semibold mb-2">
                1. Target SME IPO
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Company name..."
                className="w-full px-4 py-2.5 rounded-xl bg-[#091522] border border-[#27435E] text-bone text-sm outline-none focus:border-beam/60 transition-colors"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {QUICK_COMPANIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setCompany(c);
                      runSimulation(c, amount, horizon);
                    }}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-film-2/60 text-bone-dim hover:text-bone border border-line"
                  >
                    {c.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Investment Amount */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-mono text-bone-dim uppercase font-semibold">
                  2. Investment Amount (₹)
                </label>
                <span className="font-mono text-xs text-beam font-bold">
                  ₹{Number(amount).toLocaleString('en-IN')}
                </span>
              </div>
              <input
                type="number"
                min="1000"
                step="1000"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl bg-[#091522] border border-[#27435E] text-bone text-sm outline-none focus:border-beam/60 transition-colors"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {QUICK_AMOUNTS.map((qa) => (
                  <button
                    key={qa.value}
                    type="button"
                    onClick={() => {
                      setAmount(qa.value);
                      runSimulation(company, qa.value, horizon);
                    }}
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors ${
                      amount === qa.value
                        ? 'border-beam text-beam bg-beam/10 font-bold'
                        : 'border-line text-bone-dim hover:text-bone'
                    }`}
                  >
                    {qa.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Holding Horizon */}
            <div>
              <label className="block text-xs font-mono text-bone-dim uppercase font-semibold mb-2">
                3. Holding Horizon
              </label>
              <select
                value={horizon}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setHorizon(val);
                  runSimulation(company, amount, val);
                }}
                className="w-full px-4 py-2.5 rounded-xl bg-[#091522] border border-[#27435E] text-bone text-sm outline-none focus:border-beam/60 transition-colors cursor-pointer"
              >
                {HORIZONS.map((h) => (
                  <option key={h.value} value={h.value} className="bg-[#091522] text-bone">
                    {h.label}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                disabled={loading}
                className="mt-3.5 w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-beam via-[#A3EAF7] to-beam bg-[length:200%_auto] text-[#091724] font-bold text-sm shadow-[0_0_20px_rgba(127,216,232,0.35)] hover:shadow-[0_0_30px_rgba(127,216,232,0.6)] active:scale-98 transition-all disabled:opacity-60 cursor-pointer"
              >
                {loading ? 'Calculating…' : 'Recalculate Scenarios'}
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div className="p-4 my-4 rounded-xl border border-critical/40 bg-critical/10 text-critical text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Dashboard Outcomes */}
        {simulation && (
          <div className="space-y-8">
            {/* KPI Summary Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl border border-line/80 bg-[#102232]/80 backdrop-blur-md">
                <span className="text-[11px] font-mono text-bone-dim uppercase block mb-1">Risk Score Index</span>
                <div className="flex items-center gap-2">
                  <b className="text-3xl font-extrabold font-['Bricolage_Grotesque']" style={{ color: simulation.risk_score >= 60 ? '#FF5A4E' : '#7FD8E8' }}>
                    {simulation.risk_score}
                  </b>
                  <span className="text-xs font-mono text-bone-dim">/100</span>
                </div>
                <span className="text-[11px] font-mono text-bone-dim">{simulation.risk_level}</span>
              </div>

              <div className="p-5 rounded-2xl border border-line/80 bg-[#102232]/80 backdrop-blur-md">
                <span className="text-[11px] font-mono text-bone-dim uppercase block mb-1">Expected Return</span>
                <b className={`text-3xl font-extrabold font-mono ${simulation.expected_return_pct >= 0 ? 'text-clear' : 'text-critical'}`}>
                  {simulation.expected_return_pct > 0 ? `+${simulation.expected_return_pct}%` : `${simulation.expected_return_pct}%`}
                </b>
                <span className="text-[11px] font-mono text-bone-dim block">Probability-Weighted Mean</span>
              </div>

              <div className="p-5 rounded-2xl border border-line/80 bg-[#102232]/80 backdrop-blur-md">
                <span className="text-[11px] font-mono text-bone-dim uppercase block mb-1">Expected Final Value</span>
                <b className="text-3xl font-extrabold font-mono text-bone">
                  ₹{Math.round(simulation.expected_value).toLocaleString('en-IN')}
                </b>
                <span className={`text-[11px] font-mono block ${simulation.expected_gain_loss_inr >= 0 ? 'text-clear' : 'text-critical'}`}>
                  {simulation.expected_gain_loss_inr >= 0 ? `+₹${simulation.expected_gain_loss_inr.toLocaleString('en-IN')}` : `-₹${Math.abs(simulation.expected_gain_loss_inr).toLocaleString('en-IN')}`}
                </span>
              </div>

              <div className="p-5 rounded-2xl border border-critical/40 bg-critical/10 backdrop-blur-md">
                <span className="text-[11px] font-mono text-critical uppercase font-bold block mb-1">Maximum Tail Drawdown</span>
                <b className="text-3xl font-extrabold font-mono text-critical">
                  -₹{Math.abs(simulation.worst_case.gain_loss_inr).toLocaleString('en-IN')}
                </b>
                <span className="text-[11px] font-mono text-critical/80 block">Worst-Case Potential Loss</span>
              </div>
            </div>

            {/* Three Scenario Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Best Case */}
              <div className="relative overflow-hidden p-6 sm:p-7 rounded-3xl border border-clear/40 bg-gradient-to-br from-[#0D241C] via-[#0E1E2B] to-[#091522] shadow-lg flex flex-col justify-between">
                <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-transparent via-clear to-transparent" />
                <div>
                  <div className="flex items-center justify-between gap-1 mb-3">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-clear px-2.5 py-0.5 rounded-full bg-clear/15 border border-clear/40 flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      Best-Case
                    </span>
                    <span className="text-xs font-mono text-bone-dim">
                      {Math.round(simulation.best_case.probability_weight * 100)}% prob
                    </span>
                  </div>

                  <div className="my-4">
                    <span className="text-4xl sm:text-5xl font-black font-mono text-clear block">
                      +{simulation.best_case.return_pct}%
                    </span>
                    <span className="text-sm font-mono text-bone-dim mt-1 block">
                      Portfolio Value: <strong className="text-bone">₹{Math.round(simulation.best_case.final_value_inr).toLocaleString('en-IN')}</strong>
                    </span>
                    <span className="text-xs font-mono text-clear">
                      (+₹{Math.round(simulation.best_case.gain_loss_inr).toLocaleString('en-IN')})
                    </span>
                  </div>

                  <div className="pt-4 border-t border-line/60">
                    <span className="text-xs font-mono text-bone-dim font-semibold uppercase block mb-2">Key Assumptions:</span>
                    <ul className="space-y-1.5 list-none p-0 m-0 text-xs text-bone-dim">
                      {simulation.best_case.assumptions.map((a, i) => (
                        <li key={i} className="flex items-start gap-1.5 leading-relaxed">
                          <span className="text-clear font-mono">›</span>
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Base Case */}
              <div className="relative overflow-hidden p-6 sm:p-7 rounded-3xl border border-beam/40 bg-gradient-to-br from-[#122436] via-[#0E1E2B] to-[#091522] shadow-lg flex flex-col justify-between">
                <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-transparent via-beam to-transparent" />
                <div>
                  <div className="flex items-center justify-between gap-1 mb-3">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-beam px-2.5 py-0.5 rounded-full bg-beam/15 border border-beam/40">
                      Base-Case Scenario
                    </span>
                    <span className="text-xs font-mono text-bone-dim">
                      {Math.round(simulation.base_case.probability_weight * 100)}% prob
                    </span>
                  </div>

                  <div className="my-4">
                    <span className={`text-4xl sm:text-5xl font-black font-mono block ${simulation.base_case.return_pct >= 0 ? 'text-beam' : 'text-medium'}`}>
                      {simulation.base_case.return_pct > 0 ? `+${simulation.base_case.return_pct}%` : `${simulation.base_case.return_pct}%`}
                    </span>
                    <span className="text-sm font-mono text-bone-dim mt-1 block">
                      Portfolio Value: <strong className="text-bone">₹{Math.round(simulation.base_case.final_value_inr).toLocaleString('en-IN')}</strong>
                    </span>
                    <span className="text-xs font-mono text-bone-dim">
                      ({simulation.base_case.gain_loss_inr >= 0 ? `+₹${Math.round(simulation.base_case.gain_loss_inr).toLocaleString('en-IN')}` : `-₹${Math.round(Math.abs(simulation.base_case.gain_loss_inr)).toLocaleString('en-IN')}`})
                    </span>
                  </div>

                  <div className="pt-4 border-t border-line/60">
                    <span className="text-xs font-mono text-bone-dim font-semibold uppercase block mb-2">Key Assumptions:</span>
                    <ul className="space-y-1.5 list-none p-0 m-0 text-xs text-bone-dim">
                      {simulation.base_case.assumptions.map((a, i) => (
                        <li key={i} className="flex items-start gap-1.5 leading-relaxed">
                          <span className="text-beam font-mono">›</span>
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Worst Case */}
              <div className="relative overflow-hidden p-6 sm:p-7 rounded-3xl border border-critical/40 bg-gradient-to-br from-[#261214] via-[#0E1E2B] to-[#091522] shadow-lg flex flex-col justify-between">
                <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-transparent via-critical to-transparent" />
                <div>
                  <div className="flex items-center justify-between gap-1 mb-3">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-critical px-2.5 py-0.5 rounded-full bg-critical/15 border border-critical/40 flex items-center gap-1">
                      <TrendingDown className="w-3.5 h-3.5" />
                      Worst-Case
                    </span>
                    <span className="text-xs font-mono text-bone-dim">
                      {Math.round(simulation.worst_case.probability_weight * 100)}% prob
                    </span>
                  </div>

                  <div className="my-4">
                    <span className="text-4xl sm:text-5xl font-black font-mono text-critical block">
                      {simulation.worst_case.return_pct}%
                    </span>
                    <span className="text-sm font-mono text-bone-dim mt-1 block">
                      Portfolio Value: <strong className="text-bone">₹{Math.round(simulation.worst_case.final_value_inr).toLocaleString('en-IN')}</strong>
                    </span>
                    <span className="text-xs font-mono text-critical">
                      (-₹{Math.round(Math.abs(simulation.worst_case.gain_loss_inr)).toLocaleString('en-IN')})
                    </span>
                  </div>

                  <div className="pt-4 border-t border-line/60">
                    <span className="text-xs font-mono text-bone-dim font-semibold uppercase block mb-2">Key Assumptions:</span>
                    <ul className="space-y-1.5 list-none p-0 m-0 text-xs text-bone-dim">
                      {simulation.worst_case.assumptions.map((a, i) => (
                        <li key={i} className="flex items-start gap-1.5 leading-relaxed">
                          <span className="text-critical font-mono">›</span>
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Methodology & Regulatory Disclaimer Notice */}
            <div className="p-5 rounded-2xl border border-line/70 bg-[#091522]/80 text-xs text-bone-dim leading-relaxed space-y-2">
              <div className="flex items-center gap-2 text-beam font-mono font-semibold">
                <Info className="w-4 h-4 flex-none" />
                <span>Transparent Methodology & Data Limitations</span>
              </div>
              <p>{simulation.assumptions.methodology}</p>
              <p>{simulation.assumptions.data_limitations}</p>
              <p className="font-semibold text-medium/90 border-t border-line/50 pt-2">
                {simulation.assumptions.disclaimer}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
