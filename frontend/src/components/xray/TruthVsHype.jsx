import React, { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { api, form, streamRun, laneReducer, Lanes, SourceLink, inputCls, btnCls, btnPrimaryCls } from './api.jsx';

const SAMPLE = `2024-01-15 Buy RELIANCE target 3000 sl 2600 in 2 months
05 Feb 2024 SUZLON will double in 6 months
2024-03-04 BUY TATAPOWER tgt 450 sl 380
2024-04-10 Buy IRFC target 200 stop loss 130
2024-06-03 SELL INFY target 1400 sl 1600
2024-07-22 BUY ZOMATO target 300 sl 220
2024-09-16 Buy BEL target 350 sl 270
2024-10-07 BUY HAL target 5500 sl 4200
2024-11-11 BUY ADANIPORTS tgt 1600 sl 1250
2025-01-06 Buy IREDA target 300 sl 190`;

const rs = (n) => (n == null ? '–' : `${n < 0 ? '−' : ''}₹${Math.abs(Math.round(n)).toLocaleString('en-IN')}`);
const pct = (n) => (n == null ? '–' : `${n > 0 ? '+' : ''}${n}%`);
const tone = (n) => (n == null ? 'text-bone-dim' : n > 0 ? 'text-clear' : n < 0 ? 'text-critical' : 'text-bone');

/** Cumulative P&L of ₹10k per call, in exit order. Single series: the title names it, no legend. */
function Curve({ points }) {
  const [hover, setHover] = useState(null);
  const W = 720, H = 220, L = 64, R = 16, T = 14, B = 28;
  const ys = points.map((p) => p.pnl).concat(0);
  const lo = Math.min(...ys), hi = Math.max(...ys);
  const span = hi - lo || 1;
  const x = (i) => L + (points.length === 1 ? (W - L - R) / 2 : (i * (W - L - R)) / (points.length - 1));
  const y = (v) => T + ((hi - v) * (H - T - B)) / span;
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.pnl)}`).join('');
  const ticks = [hi, (hi + lo) / 2, lo];
  const move = (ev) => {
    const r = ev.currentTarget.getBoundingClientRect();
    const px = ((ev.clientX - r.left) / r.width) * W;
    let best = 0;
    points.forEach((_, i) => { if (Math.abs(x(i) - px) < Math.abs(x(best) - px)) best = i; });
    setHover(best);
  };
  const h = hover != null ? points[hover] : null;
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" onMouseMove={move} onMouseLeave={() => setHover(null)} role="img"
        aria-label={`Cumulative profit and loss, ending at ${rs(points[points.length - 1]?.pnl)}`}>
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="#27435E" strokeWidth="1" strokeDasharray={t === 0 ? '' : '2 4'} />
            <text x={L - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#9FB2C2">{rs(t)}</text>
          </g>
        ))}
        <line x1={L} x2={W - R} y1={y(0)} y2={y(0)} stroke="#9FB2C2" strokeWidth="1" />
        <path d={path} fill="none" stroke="#7FD8E8" strokeWidth="2" strokeLinejoin="round" />
        {points.length < 40 && points.map((p, i) => <circle key={i} cx={x(i)} cy={y(p.pnl)} r="4" fill="#7FD8E8" stroke="#15283A" strokeWidth="2" />)}
        <text x={L} y={H - 8} fontSize="11" fill="#9FB2C2">{points[0]?.date}</text>
        <text x={W - R} y={H - 8} fontSize="11" fill="#9FB2C2" textAnchor="end">{points[points.length - 1]?.date}</text>
        {h && <line x1={x(hover)} x2={x(hover)} y1={T} y2={H - B} stroke="#9FB2C2" strokeWidth="1" strokeDasharray="3 3" />}
        {h && <circle cx={x(hover)} cy={y(h.pnl)} r="5" fill="#7FD8E8" stroke="#E6EDF2" strokeWidth="2" />}
      </svg>
      {h && (
        <div className="absolute top-2 right-2 rounded-lg border border-line bg-film px-3 py-2 text-xs pointer-events-none">
          <div className="text-bone-dim">{h.date} · after {h.symbol}</div>
          <div className="text-bone font-semibold tabular-nums">{rs(h.pnl)} total</div>
        </div>
      )}
    </div>
  );
}

function Tile({ label, value, sub, cls = 'text-bone' }) {
  return (
    <div className="rounded-xl border border-line bg-film-2/60 p-3">
      <div className="text-xs text-bone-dim">{label}</div>
      <div className={`text-2xl font-bold tabular-nums ${cls}`}>{value}</div>
      {sub && <div className="text-[11px] text-bone-dim mt-0.5">{sub}</div>}
    </div>
  );
}

/** Influencer calls -> what the price actually did next, after costs and against Nifty. */
export default function TruthVsHype() {
  const [text, setText] = useState('');
  const [handle, setHandle] = useState('');
  const [calls, setCalls] = useState([]);
  const [skipped, setSkipped] = useState([]);
  const [horizon, setHorizon] = useState(20);
  const [cost, setCost] = useState(0.3);
  const [claimed, setClaimed] = useState('');
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [lanes, dispatch] = useReducer(laneReducer, {});
  const esRef = useRef(null);
  useEffect(() => () => esRef.current?.close(), []);

  const parse = async (t = text) => {
    setMsg(''); setRes(null);
    try {
      const p = await api('/api/hype/parse', { method: 'POST', body: form({ text: t }) });
      setCalls(p.calls); setSkipped(p.skipped);
      if (!p.calls.length) setMsg('No dated calls found. Each line needs a date and a stock symbol, e.g. "2024-03-12 BUY TATAPOWER target 450 sl 380".');
    } catch (e) { setMsg(e.message); }
  };

  const collectCalls = async () => {
    if (!handle.trim() || busy) return;
    esRef.current?.close();
    setBusy(true); setMsg('Starting the agent…'); setRes(null);
    dispatch({ type: 'reset' });
    try {
      const r = await api('/api/hype/collect', { method: 'POST', body: form({ handle: handle.trim() }) });
      esRef.current = streamRun(r.id, (e) => {
        dispatch(e);
        if (e.type === 'phase') setMsg(e.label);
        else if (e.type === 'calls') {
          setCalls(e.calls); setSkipped([]);
          setMsg(e.calls.length ? `Found ${e.calls.length} dated call(s). Review them, then audit.` : `No dated calls found${e.error ? `: ${e.error}` : '.'}`);
        } else if (e.type === 'error') setMsg(`Stopped: ${e.message}`);
      }, () => setBusy(false));
    } catch (e) { setMsg(e.message); setBusy(false); }
  };

  const audit = async () => {
    setBusy(true); setMsg('Fetching prices and scoring each call…');
    try {
      const r = await api('/api/hype/audit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calls, horizon: +horizon, cost_pct: +cost, claimed_accuracy: claimed === '' ? null : +claimed }),
      });
      setRes(r); setMsg('');
    } catch (e) { setMsg(e.message); }
    setBusy(false);
  };

  const s = res?.summary;
  const sorted = useMemo(() => (res ? [...res.results].sort((a, b) => (a.date < b.date ? -1 : 1)) : []), [res]);

  return (
    <div>
      <div className="rounded-2xl border border-line bg-film-2/70 p-5">
        <div className="grid lg:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-bone-dim" htmlFor="calls-text">Paste dated calls, one per line</label>
            <textarea id="calls-text" className={`${inputCls} w-full h-40 mt-1 font-mono text-xs`} value={text} onChange={(e) => setText(e.target.value)}
              placeholder="2024-03-12 BUY TATAPOWER target 450 sl 380" />
            <div className="flex gap-2 mt-2">
              <button className={btnCls} onClick={() => parse()}>Read calls</button>
              <button className={btnCls} onClick={() => { setText(SAMPLE); parse(SAMPLE); }}>Load example</button>
            </div>
          </div>
          <div>
            <label className="text-xs text-bone-dim" htmlFor="calls-handle">…or let an agent collect public calls</label>
            <input id="calls-handle" className={`${inputCls} w-full mt-1`} value={handle} onChange={(e) => setHandle(e.target.value)}
              placeholder="t.me/channelname, a page URL, or the influencer's name" onKeyDown={(e) => e.key === 'Enter' && collectCalls()} />
            <button className={`${btnCls} mt-2`} disabled={busy || !handle.trim()} onClick={collectCalls}>Collect public calls</button>
            <p className="text-xs text-bone-dim mt-2">Only public, dated posts. Deleted posts cannot be found, which usually makes a record look better than it was.</p>
            <div className="grid grid-cols-3 gap-2 mt-3">
              <label className="text-xs text-bone-dim">Hold (sessions)<input type="number" min="1" max="250" className={`${inputCls} w-full mt-1`} value={horizon} onChange={(e) => setHorizon(e.target.value)} /></label>
              <label className="text-xs text-bone-dim">Costs % round trip<input type="number" step="0.05" min="0" max="5" className={`${inputCls} w-full mt-1`} value={cost} onChange={(e) => setCost(e.target.value)} /></label>
              <label className="text-xs text-bone-dim">Claimed accuracy %<input type="number" min="0" max="100" className={`${inputCls} w-full mt-1`} value={claimed} onChange={(e) => setClaimed(e.target.value)} placeholder="e.g. 90" /></label>
            </div>
          </div>
        </div>
        <Lanes lanes={lanes} />
        {msg && <p className="mt-3 text-sm text-beam" role="status">{msg}</p>}
        {skipped.length > 0 && <p className="mt-2 text-xs text-medium">Skipped {skipped.length} line(s) without a date or symbol: {skipped.slice(0, 3).join(' | ')}{skipped.length > 3 ? ' …' : ''}</p>}
        {calls.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-3 mb-2">
              <b className="text-bone text-sm flex-1">{calls.length} call(s) to audit</b>
              <button className={btnPrimaryCls} disabled={busy} onClick={audit}>{busy ? 'Working…' : 'Audit against real prices'}</button>
            </div>
            <div className="max-h-48 overflow-auto rounded-lg border border-line">
              <table className="w-full text-xs">
                <thead className="text-bone-dim bg-film sticky top-0"><tr>{['Date', 'Call', 'Target', 'Stop', ''].map((h) => <th key={h} className="text-left px-2 py-1.5 font-medium">{h}</th>)}</tr></thead>
                <tbody>
                  {calls.map((c, i) => (
                    <tr key={i} className="border-t border-line">
                      <td className="px-2 py-1 tabular-nums">{c.date}</td>
                      <td className="px-2 py-1"><b className="text-bone">{c.direction.toUpperCase()} {c.symbol}</b></td>
                      <td className="px-2 py-1 tabular-nums">{c.target ?? (c.target_multiple ? `${c.target_multiple}x` : '–')}</td>
                      <td className="px-2 py-1 tabular-nums">{c.stop ?? '–'}</td>
                      <td className="px-2 py-1 text-right"><button className="text-bone-dim hover:text-critical" aria-label={`Remove ${c.symbol}`} onClick={() => setCalls(calls.filter((_, j) => j !== i))}>✕</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {s && (
        <div className="mt-6">
          {res.sample_note && <p className="mb-3 text-sm text-medium border-l-2 border-medium pl-3">{res.sample_note}</p>}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            <Tile label="Calls that made money" value={s.win_rate_pct == null ? '–' : `${s.win_rate_pct}%`}
              sub={s.claimed_accuracy_pct != null ? `claimed ${s.claimed_accuracy_pct}%${s.claim_gap_pct != null ? ` · gap ${s.claim_gap_pct} pts` : ''}` : `${s.closed} closed calls`}
              cls={s.claim_gap_pct > 10 ? 'text-critical' : 'text-bone'} />
            <Tile label="Targets actually hit" value={s.target_hit_rate_pct == null ? '–' : `${s.target_hit_rate_pct}%`} sub="of calls with a target" />
            <Tile label="Average call, after costs" value={pct(s.avg_net_pct)} sub={`median ${pct(s.median_net_pct)}`} cls={tone(s.avg_net_pct)} />
            <Tile label="vs Nifty 50, same dates" value={pct(s.avg_excess_vs_nifty_pct)} sub="average excess return" cls={tone(s.avg_excess_vs_nifty_pct)} />
            <Tile label={`₹${s.stake_per_call.toLocaleString('en-IN')} in every call`} value={rs(s.total_pnl)} sub={`costs ${rs(s.total_costs)}`} cls={tone(s.total_pnl)} />
            <Tile label="Biggest fall from a peak" value={rs(-s.max_drawdown)} sub={`${s.losers} losing call(s)`} cls={s.max_drawdown ? 'text-critical' : 'text-bone'} />
          </div>
          {res.curve.length > 1 && (
            <div className="rounded-2xl border border-line bg-film-2/70 p-4 mt-4">
              <h4 className="text-sm font-semibold text-bone mb-2">Running profit if you had followed every call with ₹{s.stake_per_call.toLocaleString('en-IN')}</h4>
              <Curve points={res.curve} />
            </div>
          )}
          <div className="overflow-auto rounded-2xl border border-line mt-4">
            <table className="w-full text-xs">
              <thead className="text-bone-dim bg-film-2"><tr>{['Call date', 'Call', 'Entry (next open)', 'Exit', 'Why it closed', 'After costs', 'Worst dip', 'Nifty', 'Source'].map((h) => <th key={h} className="text-left px-3 py-2 font-medium whitespace-nowrap">{h}</th>)}</tr></thead>
              <tbody>
                {sorted.map((r, i) => (
                  <tr key={i} className="border-t border-line align-top">
                    <td className="px-3 py-2 tabular-nums whitespace-nowrap">{r.date}</td>
                    <td className="px-3 py-2"><b className="text-bone">{r.direction.toUpperCase()} {r.symbol}</b>{r.target_used ? <div className="text-bone-dim">target {r.target_used}</div> : null}</td>
                    {r.status === 'insufficient_data' ? (
                      <td colSpan={6} className="px-3 py-2 text-medium">Insufficient data: {r.reason}</td>
                    ) : (
                      <>
                        <td className="px-3 py-2 tabular-nums whitespace-nowrap">{r.entry_price} <span className="text-bone-dim">{r.entry_date}</span></td>
                        <td className="px-3 py-2 tabular-nums whitespace-nowrap">{r.exit_price} <span className="text-bone-dim">{r.exit_date}</span></td>
                        <td className="px-3 py-2">{r.exit_reason}{r.split_factor ? <div className="text-bone-dim">adjusted for a {r.split_factor}:1 split/bonus</div> : null}
                          {(r.level_notes || []).map((n) => <div key={n} className="text-medium">{n}</div>)}</td>
                        <td className={`px-3 py-2 tabular-nums font-semibold ${tone(r.net_pct)}`}>{pct(r.net_pct)}</td>
                        <td className="px-3 py-2 tabular-nums text-bone-dim">{pct(r.worst_drawdown_pct)}</td>
                        <td className="px-3 py-2 tabular-nums text-bone-dim">{pct(r.nifty_pct)}</td>
                      </>
                    )}
                    <td className="px-3 py-2"><SourceLink url={r.source_url}>post</SourceLink> <SourceLink url={r.price_source}>prices</SourceLink></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-bone-dim mt-3">
            Entry is the open of the session after the call, so no call gets credit for a price seen before it was posted. If a target and a stop fall in the same day, the stop is assumed. {res.disclaimer}
          </p>
        </div>
      )}
    </div>
  );
}
