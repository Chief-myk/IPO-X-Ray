import React, { useState } from 'react';
import { api, btnCls, btnPrimaryCls, inputCls } from '../xray/api.jsx';
import { PlanTimeline } from './charts';
import { addDaysIso, fmtDate, oneIn, pct, prob, rs, rsSigned, todayIso } from './format';

let nextId = 1;
const blank = (over = {}) => ({
  id: nextId++, name: '', board: 'MAINBOARD', price: '', lot_size: '', close_date: addDaysIso(todayIso(), 3),
  expected_subscription: '', gmp_rs: '', lo: '', median: '', hi: '', applications: '', reserved_shares: '', fromRange: null, ...over,
});

// Illustrative IPOs closing in the next few days; not real issues.
const EXAMPLES = () => [
  blank({ name: 'Example SME (hot)', board: 'SME', price: '120', lot_size: '1000', close_date: addDaysIso(todayIso(), 3), expected_subscription: '150', gmp_rs: '50' }),
  blank({ name: 'Example mainboard', board: 'MAINBOARD', price: '400', lot_size: '37', close_date: addDaysIso(todayIso(), 4), expected_subscription: '12', gmp_rs: '70' }),
  blank({ name: 'Example weak issue', board: 'MAINBOARD', price: '250', lot_size: '60', close_date: addDaysIso(todayIso(), 4), expected_subscription: '0.8', gmp_rs: '-15' }),
];

function toApi(r) {
  const n = (x) => (x === '' || x == null ? undefined : Number(x));
  const out = {
    name: r.name || 'Unnamed IPO', board: r.board, price: n(r.price), lot_size: n(r.lot_size), close_date: r.close_date,
    expected_subscription: n(r.expected_subscription), applications: n(r.applications), reserved_shares: n(r.reserved_shares),
  };
  if (r.lo !== '' && r.median !== '' && r.hi !== '') out.gain_range = { lo: n(r.lo), median: n(r.median), hi: n(r.hi) };
  else if (r.gmp_rs !== '' && r.price) out.gmp_pct = (100 * Number(r.gmp_rs)) / Number(r.price);
  return out;
}

function Field({ label, children, className = '' }) {
  return <label className={`text-xs text-bone-dim ${className}`}>{label}{children}</label>;
}

function IpoRow({ r, onChange, onRemove }) {
  const [more, setMore] = useState(false);
  const set = (k) => (e) => onChange({ ...r, [k]: e.target.value });
  const inp = (k, ph, type = 'number') => (
    <input type={type} min={type === 'number' ? '0' : undefined} step="any" className={`${inputCls} w-full mt-1`} value={r[k]} placeholder={ph} onChange={set(k)} />
  );
  return (
    <div className="rounded-md border border-line bg-film/50 p-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-[1.6fr_1fr_0.8fr_0.8fr_1fr_0.9fr_0.8fr_auto] gap-2 items-end">
        <Field label="IPO" className="col-span-2 sm:col-span-1">{inp('name', 'name', 'text')}</Field>
        <Field label="Board">
          <select className={`${inputCls} w-full mt-1`} value={r.board} onChange={set('board')}>
            <option value="MAINBOARD">Mainboard</option><option value="SME">SME</option>
          </select>
        </Field>
        <Field label="Price ₹">{inp('price', '400')}</Field>
        <Field label="Lot size">{inp('lot_size', '37')}</Field>
        <Field label="Closes">{inp('close_date', '', 'date')}</Field>
        <Field label="Retail subs. (x)">{inp('expected_subscription', 'expected')}</Field>
        <Field label="GMP ₹">{inp('gmp_rs', 'optional')}</Field>
        <button type="button" onClick={onRemove} className="text-bone-dim hover:text-critical text-xs px-2 py-2" aria-label={`Remove ${r.name || 'IPO'}`}>Remove</button>
      </div>
      {r.fromRange && (
        <p className="text-[11px] text-beam mt-2">
          Listing range from the Listing range tool: {pct(Number(r.lo), 0)} … {pct(Number(r.median), 0)} … {pct(Number(r.hi), 0)}.
          {!r.lot_size && ' Add the lot size and closing date from the RHP.'}
        </p>
      )}
      <button type="button" className="text-[11px] text-bone-dim hover:text-bone mt-2" onClick={() => setMore(!more)}>
        {more ? '− Hide' : '+ Your own listing range, or the exact application count'}
      </button>
      {more && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-2">
          <Field label="Low gain %">{inp('lo', 'e.g. 5')}</Field>
          <Field label="Middle gain %">{inp('median', 'e.g. 20')}</Field>
          <Field label="High gain %">{inp('hi', 'e.g. 40')}</Field>
          <Field label="Retail applications">{inp('applications', 'from exchange')}</Field>
          <Field label="Retail shares on offer">{inp('reserved_shares', 'from RHP')}</Field>
        </div>
      )}
    </div>
  );
}

function Tile({ label, value, sub, tone = 'text-bone' }) {
  return (
    <div className="rounded-md border border-line bg-film-2/70 p-3">
      <div className="text-[11px] uppercase tracking-wider text-bone-dim">{label}</div>
      <div className={`text-2xl font-bold tabular-nums ${tone}`}>{value}</div>
      {sub && <div className="text-xs text-bone-dim">{sub}</div>}
    </div>
  );
}

/** Which IPOs to apply to, from how many accounts, with how many lots, given the money and the overlap in dates. */
export default function ApplyPlanner({ incoming }) {
  const [rows, setRows] = useState(EXAMPLES);
  const [g, setG] = useState({ budget: '300000', accounts: '2', objective: 'expected', apply_on: 'last_day' });
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  // An IPO sent over from the Listing range tool arrives with its range filled in (adjusted during render, once per hand-off).
  const [taken, setTaken] = useState(null);
  if (incoming && incoming !== taken) {
    setTaken(incoming);
    const i = incoming.inputs || {};
    const rp = incoming.range_pct;
    setRows([...rows, blank({
      name: incoming.name || 'From listing range', board: incoming.board, price: i.issue_price || '',
      expected_subscription: i.sub_retail || i.sub_total || '', lo: String(rp.lo), median: String(rp.median), hi: String(rp.hi), fromRange: true,
    })]);
  }

  const run = async () => {
    const need = { price: 'price', lot_size: 'lot size', close_date: 'closing date', expected_subscription: 'expected retail subscription' };
    const idx = rows.findIndex((r) => Object.keys(need).some((k) => !r[k]));
    if (idx >= 0) {
      const missing = Object.keys(need).filter((k) => !rows[idx][k]).map((k) => need[k]).join(', ');
      setErr(`IPO ${idx + 1} (${rows[idx].name || 'unnamed'}) needs: ${missing}.`);
      return;
    }
    if (!(Number(g.budget) > 0)) { setErr('Enter the money available.'); return; }
    setBusy(true); setErr('');
    try {
      const body = { budget: Number(g.budget), accounts: Number(g.accounts), objective: g.objective, apply_on: g.apply_on, ipos: rows.map(toApi) };
      setRes(await api('/api/decide/plan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }));
    } catch (e) { setErr(e.message.includes('[object Object]') ? 'Some values are out of range: check each IPO (a range needs low ≤ middle ≤ high).' : e.message); setRes(null); }
    setBusy(false);
  };

  const t = res?.totals;
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-line bg-film-2/70 p-5 space-y-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Field label="Money available (₹)"><input type="number" min="0" className={`${inputCls} w-full mt-1`} value={g.budget} onChange={(e) => setG({ ...g, budget: e.target.value })} /></Field>
          <Field label="Accounts you can apply from (separate PANs)">
            <select className={`${inputCls} w-full mt-1`} value={g.accounts} onChange={(e) => setG({ ...g, accounts: e.target.value })}>
              {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </Field>
          <Field label="Plan for">
            <select className={`${inputCls} w-full mt-1`} value={g.objective} onChange={(e) => setG({ ...g, objective: e.target.value })}>
              <option value="expected">Best expected profit</option>
              <option value="cautious">Caution: assume each lists at the low end</option>
            </select>
          </Field>
          <Field label="Apply on">
            <select className={`${inputCls} w-full mt-1`} value={g.apply_on} onChange={(e) => setG({ ...g, apply_on: e.target.value })}>
              <option value="last_day">Last day (money blocked for less time)</option>
              <option value="first_day">Opening day</option>
            </select>
          </Field>
        </div>
        <div className="space-y-2">
          {rows.map((r) => (
            <IpoRow key={r.id} r={r} onChange={(nr) => setRows(rows.map((x) => (x.id === r.id ? nr : x)))} onRemove={() => setRows(rows.filter((x) => x.id !== r.id))} />
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className={btnCls} onClick={() => setRows([...rows, blank()])} disabled={rows.length >= 12}>+ Add IPO</button>
          <button type="button" className={btnCls} onClick={() => setRows(EXAMPLES())}>Reset to examples</button>
          <button type="button" className={btnPrimaryCls} disabled={busy || !rows.length} onClick={run}>{busy ? 'Planning…' : 'Make my plan'}</button>
          <span className="text-xs text-bone-dim">Blank range = estimated by the listing model from subscription and GMP.</span>
        </div>
        {err && <p className="text-sm text-critical" role="alert">{err}</p>}
      </div>

      {res && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <Tile label="Expected profit" value={rsSigned(t.expected)} sub="after charges and tax" tone={t.expected > 0 ? 'text-clear' : 'text-bone'} />
            <Tile label="Likely outcome" value={`${rs(t.range.p10)} to ${rs(t.range.p90)}`} sub="10th to 90th percentile" />
            <Tile label="Chance of no allotment" value={prob(t.p_no_allotment)} sub="lotteries are lotteries" tone={t.p_no_allotment > 0.6 ? 'text-medium' : 'text-bone'} />
            <Tile label="Most money tied up" value={rs(t.peak_capital)} sub={`of ${rs(res.budget)}`} />
            <Tile label="vs. applying to all, 1 account" value={rsSigned(t.uplift_vs_naive)} sub={`that would expect ${rsSigned(t.naive_expected)}`} tone={t.uplift_vs_naive > 0 ? 'text-clear' : 'text-bone'} />
          </div>

          <div className="space-y-2">
            {res.ipos.map((i) => {
              const on = i.decision === 'apply';
              const odds = oneIn(i.p_win_one);
              return (
                <div key={i.name} className={`rounded-lg border p-4 ${on ? 'border-beam/40 bg-film-2/80' : 'border-line bg-film-2/40'}`}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h4 className="text-lg font-semibold text-bone">
                      <span className={`mr-2 rounded px-2 py-0.5 text-xs font-bold uppercase ${on ? 'bg-beam/20 text-beam' : 'bg-line/50 text-bone-dim'}`}>{on ? 'Apply' : 'Skip'}</span>
                      {i.name}
                    </h4>
                    <span className="text-sm text-bone-dim">{i.board === 'SME' ? 'SME' : 'Mainboard'} · ₹{i.price} × {i.lot_size} · range {pct(i.gain_range_pct.lo, 0)} … {pct(i.gain_range_pct.hi, 0)} ({i.gain_source})</span>
                  </div>
                  {on ? (
                    <p className="text-bone mt-1">
                      From <b>{i.applications} account{i.applications > 1 ? 's' : ''}</b>, <b>{i.lots_per_application} lot{i.lots_per_application > 1 ? 's' : ''}</b> each ({rs(i.amount_per_application)} per application) on {fmtDate(i.apply_on)}.
                      {' '}Chance of at least one allotment <b>{prob(i.p_any)}</b>; expected profit <b className="text-clear">{rsSigned(i.expected_value)}</b>.
                    </p>
                  ) : <p className="text-bone-dim mt-1">{i.reason}</p>}
                  <div className="grid sm:grid-cols-3 gap-3 mt-2 text-xs text-bone-dim">
                    <p>Odds per application: <b className="text-bone">{prob(i.p_win_one)}</b>{odds ? ` (${odds})` : ''}
                      {i.odds_method === 'bounds' && i.p_win_bounds[1] > i.p_win_bounds[0] && <> · could be up to {prob(i.p_win_bounds[1])} if many bid above the minimum</>}
                      {i.odds_method === 'exact' && ' · from the application count'}</p>
                    <p>If allotted ({i.lots_per_application} lot{i.lots_per_application > 1 ? 's' : ''}), sold at listing open: <b className="text-bone">{rs(i.profit_if_allotted.p10)} to {rs(i.profit_if_allotted.p90)}</b></p>
                    <p>Money back {fmtDate(i.unblock_if_not_allotted)} if not allotted; listing {fmtDate(i.listing_date)}.</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-lg border border-line bg-film-2/70 p-4">
            <h4 className="text-sm font-semibold text-bone mb-2">When your money is tied up</h4>
            <PlanTimeline ipos={res.ipos} timeline={res.timeline} budget={res.budget} />
          </div>

          <div className="rounded-lg border border-line bg-film-2/70 p-4 text-sm">
            <h4 className="font-semibold text-bone mb-1">What this plan assumes</h4>
            <ul className="list-disc pl-4 text-xs text-bone-dim space-y-1">{res.assumptions.map((a) => <li key={a}>{a}</li>)}</ul>
            {res.notes.map((n) => <p key={n} className="text-xs text-medium mt-2">{n}</p>)}
          </div>
          <p className="text-xs text-bone-dim">{res.disclaimer}</p>
        </div>
      )}
    </div>
  );
}
