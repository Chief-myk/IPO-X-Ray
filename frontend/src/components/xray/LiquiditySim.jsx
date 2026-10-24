import React, { useState } from 'react';
import { api, SourceLink, inputCls, btnPrimaryCls } from './api.jsx';
import DraftPanel from './DraftPanel.jsx';

const rs = (n) => (n == null ? '–' : `${n < 0 ? '−' : ''}₹${Math.abs(Math.round(n)).toLocaleString('en-IN')}`);
const num = (n) => (n == null ? '–' : Math.round(n).toLocaleString('en-IN'));

const FIELDS = [
  ['symbol', 'Stock symbol', 'text', 'e.g. ABC-SM.NS, 543921 or RELIANCE'],
  ['amount', 'Amount invested (₹)', 'number', 'e.g. 240000'],
  ['shares', '…or number of shares', 'number', 'optional'],
  ['lot_size', 'Lot size', 'number', 'SME lots, e.g. 1200'],
  ['band_pct', 'Circuit band %', 'number', '5 for most SME stocks'],
  ['participation_pct', 'Max % of daily volume you sell', 'number', '10'],
  ['drop_pct', 'Price-fall scenario %', 'number', '20'],
  ['lockin_shares', 'Shares unlocking (lock-in expiry)', 'number', 'optional'],
];
const ADVANCED = [
  ['price', 'Price (if no symbol)', 'number', ''],
  ['daily_volume', 'Avg daily volume (if no symbol)', 'number', ''],
  ['volatility_pct', 'Daily volatility % (optional)', 'number', ''],
  ['lc_days', 'Lower-circuit days (blank = from history, min 3)', 'number', ''],
];

/** Loss vs screen value per scenario: one measure, one hue, direct labels; the table below carries the same numbers. */
function LossBars({ scenarios }) {
  const max = Math.max(1, ...scenarios.map((s) => s.loss_vs_screen_pct || 0));
  return (
    <div className="space-y-2" role="img" aria-label="Loss versus screen value by scenario">
      {scenarios.map((s) => (
        <div key={s.scenario} className="grid grid-cols-[150px_1fr_70px] gap-3 items-center text-sm" title={`${s.title}: ${s.loss_vs_screen_pct}% below screen value`}>
          <span className="text-bone truncate">{s.title}</span>
          <div className="h-3 rounded-full bg-line/40 overflow-hidden">
            <div className="h-full rounded-r" style={{ width: `${Math.max(0, (100 * (s.loss_vs_screen_pct || 0)) / max)}%`, background: '#FF8A3D' }} />
          </div>
          <span className="tabular-nums text-bone text-right">{s.loss_vs_screen_pct > 0 ? `−${s.loss_vs_screen_pct}%` : '0%'}</span>
        </div>
      ))}
    </div>
  );
}

/** Can I actually exit? Simulates selling a position day by day on the stock's real recent liquidity. */
export default function LiquiditySim() {
  const [v, setV] = useState({ symbol: '', amount: '', shares: '', lot_size: '1', band_pct: '5', participation_pct: '10', drop_pct: '20', lockin_shares: '' });
  const [adv, setAdv] = useState({ price: '', daily_volume: '', volatility_pct: '', lc_days: '' });
  const [showAdv, setShowAdv] = useState(false);
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const run = async () => {
    setBusy(true); setErr('');
    const body = {};
    Object.entries({ ...v, ...adv }).forEach(([k, x]) => {
      if (x === '' || x == null) return;
      body[k] = k === 'symbol' ? x.trim() : Number(x);
    });
    try {
      setRes(await api('/api/liquidity', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }));
    } catch (e) { setErr(e.message); setRes(null); }
    setBusy(false);
  };

  const field = (state, set) => ([k, label, type, ph]) => (
    <label key={k} className="text-xs text-bone-dim">
      {label}
      <input type={type} min={type === 'number' ? '0' : undefined} step="any" className={`${inputCls} w-full mt-1`} value={state[k]} placeholder={ph}
        onChange={(e) => set({ ...state, [k]: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && run()} />
    </label>
  );

  const m = res?.market;
  const h = res?.headline;
  return (
    <div>
      <div className="rounded-2xl border border-line bg-film-2/70 p-5">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">{FIELDS.map(field(v, setV))}</div>
        <button className="text-xs text-bone-dim hover:text-bone mt-3" onClick={() => setShowAdv(!showAdv)}>{showAdv ? '− Hide' : '+ Enter price/volume by hand, or change assumptions'}</button>
        {showAdv && <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-2">{ADVANCED.map(field(adv, setAdv))}</div>}
        <div className="flex items-center gap-3 mt-4">
          <button className={btnPrimaryCls} disabled={busy} onClick={run}>{busy ? 'Simulating…' : 'Simulate my exit'}</button>
          <span className="text-xs text-bone-dim">Uses the last 120 sessions of real trading. Deterministic: same inputs, same answer.</span>
        </div>
        {err && <p className="mt-3 text-sm text-critical" role="alert">{err}</p>}
      </div>

      {res && (
        <div className="mt-6">
          <div className="flex flex-wrap gap-6 items-end pb-4 border-b border-line">
            <div className="flex-1 min-w-[260px]">
              <p className="text-sm text-bone-dim">{res.name || res.symbol || 'Your position'} · {num(res.position.shares)} shares at ₹{res.position.price}</p>
              <h3 className="text-2xl sm:text-3xl font-bold font-['Bricolage_Grotesque'] text-bone">
                Screen value {rs(h.screen_value)}.{' '}
                {h.normal_days === 1 ? 'In a normal market you could sell it all in one day.'
                  : h.normal_days ? `Even in a normal market the exit takes ${h.normal_days} trading days.` : 'Even in a normal market you could not exit within a year.'}
              </h3>
              <p className="text-bone mt-1">Worst case simulated ({h.worst_scenario}): you realise <b className="text-critical">{rs(h.screen_value - h.worst_loss)}</b>, {h.worst_loss_pct}% below what the screen shows.</p>
            </div>
            <div className="text-right text-sm">
              <div className="text-bone-dim">Your position is</div>
              <div className="text-3xl font-bold tabular-nums text-bone">{res.position.pct_of_daily_volume == null ? '–' : res.position.pct_of_daily_volume < 0.1 ? '<0.1' : res.position.pct_of_daily_volume}%</div>
              <div className="text-bone-dim">of a normal day's volume</div>
            </div>
          </div>

          {res.notes.map((n) => <p key={n} className="mt-3 text-sm text-medium border-l-2 border-medium pl-3">{n}</p>)}

          <div className="grid lg:grid-cols-[1fr_340px] gap-4 mt-4">
            <div className="rounded-2xl border border-line bg-film-2/70 p-4">
              <h4 className="text-sm font-semibold text-bone mb-3">Capital lost against the screen price, by scenario</h4>
              <LossBars scenarios={res.scenarios} />
              <div className="overflow-auto mt-4">
                <table className="w-full text-xs">
                  <thead className="text-bone-dim"><tr>{['Scenario', 'Days to exit', 'Avg exit price', 'You get', 'Unsold', 'Impact cost'].map((t) => <th key={t} className="text-left px-2 py-1.5 font-medium">{t}</th>)}</tr></thead>
                  <tbody>
                    {res.scenarios.map((s) => (
                      <tr key={s.scenario} className="border-t border-line align-top">
                        <td className="px-2 py-2"><b className="text-bone">{s.title}</b><div className="text-bone-dim">{s.description}</div></td>
                        <td className="px-2 py-2 tabular-nums">{s.days_to_exit ?? `>${s.exited_within_days}`}</td>
                        <td className="px-2 py-2 tabular-nums">{s.avg_exit_price != null ? `₹${s.avg_exit_price}` : '–'}</td>
                        <td className="px-2 py-2 tabular-nums">{rs(s.proceeds)}</td>
                        <td className={`px-2 py-2 tabular-nums ${s.shares_unsold ? 'text-critical' : ''}`}>{num(s.shares_unsold)}</td>
                        <td className="px-2 py-2 tabular-nums">{s.slippage_pct ?? '–'}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <aside className="rounded-2xl border border-line bg-film-2/70 p-4 text-sm space-y-1">
              <h4 className="font-semibold text-bone mb-1">What the trading data says</h4>
              {m ? (
                <>
                  <p className="text-bone-dim">{m.sessions} sessions, {m.from} to {m.to}</p>
                  <p>Typical day: <b className="text-bone">{num(m.effective_daily_volume)}</b> shares <span className="text-bone-dim">(≈{rs(m.median_traded_value)} traded)</span></p>
                  <p>Days with no trades: <b className={m.zero_volume_pct > 10 ? 'text-critical' : 'text-bone'}>{m.zero_volume_days} ({m.zero_volume_pct}%)</b></p>
                  <p>Lower-circuit days: <b className={m.lower_circuit_days ? 'text-critical' : 'text-bone'}>{m.lower_circuit_days}</b>, longest run {m.max_consecutive_lower_circuits}</p>
                  <p>Upper-circuit days: <b className="text-bone">{m.upper_circuit_days}</b></p>
                  <p>Daily volatility: <b className="text-bone">{m.daily_volatility_pct ?? '–'}%</b></p>
                  <p className="text-xs"><SourceLink url={res.source_url}>Price history</SourceLink> · fetched {res.fetched_at}</p>
                </>
              ) : <p className="text-bone-dim">Entered by hand; no trading history used.</p>}
              <h4 className="font-semibold text-bone pt-3">Assumptions</h4>
              <ul className="list-disc pl-4 text-xs text-bone-dim space-y-1">{res.assumptions.map((a) => <li key={a}>{a}</li>)}</ul>
            </aside>
          </div>
          <div className="mt-4"><DraftPanel source="liquidity" data={res} defaultKind="exchange" label="Draft a letter to the exchange" /></div>
          <p className="text-xs text-bone-dim mt-3">{res.disclaimer}</p>
        </div>
      )}
    </div>
  );
}
