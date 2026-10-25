import React, { useState } from 'react';
import { api, btnCls, btnPrimaryCls, inputCls, SourceLink } from '../xray/api.jsx';
import { HorizonFan } from './charts';
import { addDaysIso, fmtDate, numbers, pct, prob, rs, rsSigned, todayIso } from './format';

const START = {
  status: 'upcoming', board: 'SME', issue_price: '120', shares: '2000', allotment_date: '', listing_date: addDaysIso(todayIso(), 5),
  lo: '', median: '', hi: '', sub_total: '180', gmp_rs: '50', symbol: '', current_price: '',
};
const ADV = { daily_vol_pct: '', drift_annual_pct: '0', alt_return_pct: '7', surcharge_pct: '0', ltcg_exemption_left: '', brokerage: '0' };

function Field({ label, hint, children }) {
  return <label className="text-xs text-bone-dim">{label}{children}{hint && <span className="block text-[10px] text-mute mt-0.5">{hint}</span>}</label>;
}

/** Listing day, a few months, or past the 12-month mark: what you keep after charges and tax, compared like for like. */
export default function SellTiming({ incoming }) {
  const [v, setV] = useState(START);
  const [adv, setAdv] = useState(ADV);
  const [showAdv, setShowAdv] = useState(false);
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  // A range sent over from the Listing range tool fills the form (adjusted during render, once per hand-off).
  const [taken, setTaken] = useState(null);
  if (incoming && incoming !== taken) {
    setTaken(incoming);
    const i = incoming.inputs || {};
    setV({
      ...v, status: 'upcoming', board: incoming.board, issue_price: i.issue_price || v.issue_price,
      lo: String(incoming.range_pct.lo), median: String(incoming.range_pct.median), hi: String(incoming.range_pct.hi),
    });
  }

  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });
  const inp = (k, ph, type = 'number') => (
    <input type={type} min={type === 'number' ? '0' : undefined} step="any" className={`${inputCls} w-full mt-1`} value={v[k]} placeholder={ph} onChange={set(k)} />
  );

  const run = async () => {
    setBusy(true); setErr('');
    const a = numbers(adv);
    const body = {
      board: v.board, issue_price: Number(v.issue_price), shares: Number(v.shares),
      allotment_date: v.allotment_date || undefined, listing_date: v.listing_date || undefined,
      daily_vol_pct: a.daily_vol_pct, drift_annual_pct: a.drift_annual_pct ?? 0, alt_return_pct: a.alt_return_pct ?? 7,
      surcharge: (a.surcharge_pct ?? 0) / 100, ltcg_exemption_left: a.ltcg_exemption_left, brokerage: a.brokerage ?? 0,
    };
    if (v.status === 'listed') {
      if (v.symbol.trim()) body.symbol = v.symbol.trim();
      if (v.current_price) body.current_price = Number(v.current_price);
      if (!body.symbol && !body.current_price) { setErr('Give the stock symbol or today\'s price.'); setBusy(false); return; }
    } else if (v.lo !== '' && v.median !== '' && v.hi !== '') {
      body.gain_range = { lo: Number(v.lo), median: Number(v.median), hi: Number(v.hi) };
    } else {
      body.model_inputs = { board: v.board, issue_price: Number(v.issue_price), auto_market: true, ...numbers({ sub_total: v.sub_total }) };
      if (v.gmp_rs !== '') body.model_inputs.gmp_rs = Number(v.gmp_rs);
    }
    try {
      setRes(await api('/api/decide/sell', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }));
    } catch (e) { setErr(e.message.includes('[object Object]') ? 'Check the numbers: issue price and shares are required, and a range needs low ≤ middle ≤ high.' : e.message); setRes(null); }
    setBusy(false);
  };

  const best = res?.horizons.find((h) => h.key === res.best_by_median);
  const first = res?.horizons[0];
  const lw = res?.ltcg_wait;
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-line bg-film-2/70 p-5 space-y-4">
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Where is this IPO">
          {[['upcoming', 'Allotted, not listed yet'], ['listed', 'Already listed, I hold it']].map(([k, t]) => (
            <button key={k} type="button" role="radio" aria-checked={v.status === k} onClick={() => setV({ ...v, status: k })}
              className={`px-3 py-2 rounded-lg text-sm border ${v.status === k ? 'border-beam/60 bg-beam/15 text-bone font-semibold' : 'border-line text-bone-dim hover:text-bone'}`}>{t}</button>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Field label="Board">
            <select className={`${inputCls} w-full mt-1`} value={v.board} onChange={set('board')}>
              <option value="SME">SME</option><option value="MAINBOARD">Mainboard</option>
            </select>
          </Field>
          <Field label="Issue price (₹)">{inp('issue_price', '120')}</Field>
          <Field label="Shares allotted">{inp('shares', '2000')}</Field>
          <Field label="Allotment date" hint="Your tax clock starts here (demat credit)">{inp('allotment_date', '', 'date')}</Field>
          <Field label="Listing date">{inp('listing_date', '', 'date')}</Field>
          {v.status === 'listed' ? (
            <>
              <Field label="Stock symbol" hint="e.g. ABC-SM.NS or a BSE code; fetches price and volatility">{inp('symbol', 'optional', 'text')}</Field>
              <Field label="…or today's price (₹)">{inp('current_price', 'optional')}</Field>
            </>
          ) : (
            <>
              <Field label="Listing range: low / mid / high %" hint="Blank = estimate from subscription and GMP">
                <div className="grid grid-cols-3 gap-1">
                  {['lo', 'median', 'hi'].map((k) => (
                    <input key={k} type="number" step="any" aria-label={`${k} gain %`} className={`${inputCls} w-full mt-1`} value={v[k]} placeholder={k === 'lo' ? 'low' : k === 'hi' ? 'high' : 'mid'} onChange={set(k)} />
                  ))}
                </div>
              </Field>
              <Field label="Total subscription (x) · GMP ₹" hint="Used only when the range is blank">
                <div className="grid grid-cols-2 gap-1">
                  <input type="number" min="0" step="any" aria-label="Total subscription" className={`${inputCls} w-full mt-1`} value={v.sub_total} onChange={set('sub_total')} />
                  <input type="number" step="any" aria-label="GMP in rupees" className={`${inputCls} w-full mt-1`} value={v.gmp_rs} onChange={set('gmp_rs')} />
                </div>
              </Field>
            </>
          )}
        </div>
        <button type="button" className="text-xs text-bone-dim hover:text-bone" onClick={() => setShowAdv(!showAdv)}>{showAdv ? '− Hide' : '+ Your tax position and the price assumptions'}</button>
        {showAdv && (
          <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              ['daily_vol_pct', 'Daily volatility %', 'blank = stock or board default'],
              ['drift_annual_pct', 'Price drift % a year', '0 = no view'],
              ['alt_return_pct', 'Money elsewhere earns % a year', 'e.g. FD 7'],
              ['surcharge_pct', 'Your surcharge %', '0, 10 or 15'],
              ['ltcg_exemption_left', 'LTCG exemption left ₹', 'blank = full 1,25,000'],
              ['brokerage', 'Brokerage per sale ₹', '0 at most discount brokers'],
            ].map(([k, l, h]) => (
              <Field key={k} label={l} hint={h}>
                <input type="number" step="any" className={`${inputCls} w-full mt-1`} value={adv[k]} onChange={(e) => setAdv({ ...adv, [k]: e.target.value })} />
              </Field>
            ))}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className={btnPrimaryCls} disabled={busy} onClick={run}>{busy ? 'Simulating…' : 'Compare selling dates'}</button>
          <button type="button" className={btnCls} onClick={() => { setV(START); setAdv(ADV); }}>Reset</button>
          <span className="text-xs text-bone-dim">20,000 simulated price paths, fixed seed: same inputs, same answer.</span>
        </div>
        {err && <p className="text-sm text-critical" role="alert">{err}</p>}
      </div>

      {res && (
        <div className="space-y-4">
          <div className="pb-4 border-b border-line">
            <p className="text-sm text-bone-dim">{res.position.shares.toLocaleString('en-IN')} shares at ₹{res.position.issue_price} · cost {rs(res.position.cost)} · allotted {fmtDate(res.position.allotment_date)}</p>
            <h3 className="text-2xl sm:text-3xl font-semibold font-serif text-bone">
              Best middle outcome: <span className="text-beam">{best.label.toLowerCase()}</span>, keeping {rsSigned(best.profit.p50)} after tax
            </h3>
            <p className="text-bone mt-1">
              Selling {first.label.toLowerCase()} keeps {rsSigned(first.profit.p50)} in the middle case ({rs(first.profit.p10)} to {rs(first.profit.p90)}).
              {' '}Holding longer widens the range: at {res.horizons[res.horizons.length - 1].label.toLowerCase()} it is {rs(res.horizons[res.horizons.length - 1].profit.p10)} to {rs(res.horizons[res.horizons.length - 1].profit.p90)}.
            </p>
          </div>
          {res.notes.map((n) => <p key={n} className="text-sm text-medium border-l-2 border-medium pl-3">{n}</p>)}

          <div className="grid lg:grid-cols-[1fr_340px] gap-4">
            <div className="rounded-lg border border-line bg-film-2/70 p-4">
              <h4 className="text-sm font-semibold text-bone mb-2">Profit after charges and tax, by selling date</h4>
              <HorizonFan horizons={res.horizons} />
              <p className="text-xs text-bone-dim mt-1">Bar: 10th to 90th percentile. Dot: middle outcome. Green = long-term tax applies.</p>
            </div>
            {lw && (
              <aside className="rounded-lg border border-line bg-film-2/70 p-4 text-sm space-y-2">
                <h4 className="font-semibold text-bone">Is waiting for long-term tax worth it?</h4>
                <p className="text-bone-dim">{lw.explain}</p>
                <p>From {lw.from.toLowerCase()} to {fmtDate(lw.until)} ({lw.wait_trading_days} trading days):</p>
                <ul className="space-y-1">
                  <li>Tax saved if the price stays put: <b className="text-clear">{rs(lw.tax_saving_at_median_price)}</b></li>
                  <li>A fall of <b className="text-bone">{pct(lw.breakeven_fall_pct)}</b> or more wipes that saving out</li>
                  {lw.p_fall_more_than_breakeven != null && <li>The price model falls further than that <b className={lw.p_fall_more_than_breakeven > 0.4 ? 'text-critical' : 'text-bone'}>{prob(lw.p_fall_more_than_breakeven)}</b> of the time</li>}
                  {lw.p_long_beats_first != null && <li>Holding to the long-term day beats selling now and earning {res.inputs.alt_return_pct}% elsewhere in <b className="text-bone">{prob(lw.p_long_beats_first)}</b> of paths</li>}
                </ul>
              </aside>
            )}
          </div>

          <div className="rounded-lg border border-line bg-film-2/70 p-4 overflow-auto">
            <table className="w-full text-xs">
              <thead className="text-bone-dim">
                <tr>{['Sell', 'Date', 'Tax', 'Price (middle)', 'Profit: low', 'middle', 'high', 'Chance of loss', `Beats selling first + ${res.inputs.alt_return_pct}%`].map((h) => <th key={h} className="text-left px-2 py-1.5 font-medium">{h}</th>)}</tr>
              </thead>
              <tbody>
                {res.horizons.map((h) => (
                  <tr key={h.key} className={`border-t border-line ${h.key === res.best_by_median ? 'text-bone' : ''}`}>
                    <td className="px-2 py-2 font-medium">{h.label}</td>
                    <td className="px-2 py-2 tabular-nums">{fmtDate(h.date)}</td>
                    <td className={`px-2 py-2 ${h.tax_type === 'LTCG' ? 'text-clear' : ''}`}>{h.tax_type} {h.tax_rate_pct}%</td>
                    <td className="px-2 py-2 tabular-nums">₹{h.price.p50}</td>
                    <td className={`px-2 py-2 tabular-nums ${h.profit.p10 < 0 ? 'text-critical' : ''}`}>{rsSigned(h.profit.p10)}</td>
                    <td className="px-2 py-2 tabular-nums font-semibold">{rsSigned(h.profit.p50)}</td>
                    <td className="px-2 py-2 tabular-nums">{rsSigned(h.profit.p90)}</td>
                    <td className={`px-2 py-2 tabular-nums ${h.p_loss > 0.25 ? 'text-critical' : ''}`}>{prob(h.p_loss)}</td>
                    <td className="px-2 py-2 tabular-nums">{h.p_beats_first == null ? '—' : prob(h.p_beats_first)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-lg border border-line bg-film-2/70 p-4 text-sm">
            <h4 className="font-semibold text-bone mb-1">Assumptions</h4>
            <ul className="list-disc pl-4 text-xs text-bone-dim space-y-1">{res.assumptions.map((a) => <li key={a}>{a}</li>)}</ul>
            {res.stock && <p className="text-xs text-bone-dim mt-2">{res.stock.name || res.stock.symbol}: {res.stock.sessions} sessions, last close ₹{res.stock.last_close} on {res.stock.last_date}. <SourceLink url={res.stock.source_url}>Price history</SourceLink></p>}
          </div>
          <p className="text-xs text-bone-dim">{res.disclaimer}</p>
        </div>
      )}
    </div>
  );
}
