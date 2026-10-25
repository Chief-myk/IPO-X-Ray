import React, { useState } from 'react';
import { api, btnCls, btnPrimaryCls, inputCls } from '../xray/api.jsx';
import { RangeStrip } from './charts';
import ModelCard from './ModelCard';
import { numbers, pct, prob, rs } from './format';

const EMPTY = { name: '', board: 'SME', issue_price: '', issue_size_cr: '', sub_retail: '', sub_nii: '', sub_qib: '', sub_total: '', gmp_rs: '' };

// Illustrative inputs to try the tool; they are not real issues.
const PRESETS = [
  { label: 'Hot SME issue', v: { name: 'Example SME (hot)', board: 'SME', issue_price: '120', issue_size_cr: '35', sub_retail: '180', sub_nii: '420', sub_qib: '95', sub_total: '210', gmp_rs: '55' } },
  { label: 'Steady mainboard', v: { name: 'Example mainboard', board: 'MAINBOARD', issue_price: '400', issue_size_cr: '1200', sub_retail: '9', sub_nii: '24', sub_qib: '60', sub_total: '32', gmp_rs: '60' } },
  { label: 'Weak demand', v: { name: 'Example weak issue', board: 'MAINBOARD', issue_price: '250', issue_size_cr: '2500', sub_retail: '0.9', sub_nii: '0.6', sub_qib: '1.2', sub_total: '1', gmp_rs: '' } },
];

const FIELDS = [
  ['issue_price', 'Issue price (₹, upper band)', 'e.g. 120'],
  ['issue_size_cr', 'Issue size (₹ crore)', 'e.g. 35'],
  ['sub_retail', 'Retail subscription (x)', 'final day, e.g. 180'],
  ['sub_nii', 'NII / HNI subscription (x)', 'e.g. 420'],
  ['sub_qib', 'QIB subscription (x)', 'blank if none'],
  ['sub_total', 'Total subscription (x)', 'e.g. 210'],
  ['gmp_rs', 'GMP (₹, optional)', 'unofficial, e.g. 55'],
];

/** Listing-gain range: an honest band from past listings, with the model's own report card. */
export default function ListingRange({ onResult, onUseInPlanner, onUseInSell }) {
  const [v, setV] = useState(EMPTY);
  const [res, setRes] = useState(null);
  const [card, setCard] = useState(null);
  const [hist, setHist] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const run = async (vals = v) => {
    setBusy(true); setErr('');
    try {
      const body = { ...numbers(vals, ['board', 'name']), auto_market: true };
      delete body.name;
      const r = await api('/api/decide/listing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      // keep the form values with the result: the planner and sell-timing hand-offs need the price and subscription
      const full = { ...r, name: vals.name, inputs: vals };
      setRes(full);
      setCard(r.model_card);
      onResult?.(full);
      if (!hist) api('/api/decide/model').then((m) => setHist(m.history)).catch(() => {});
    } catch (e) { setErr(e.message); setRes(null); }
    setBusy(false);
  };

  const preset = (p) => { setV({ ...EMPTY, ...p.v }); run({ ...EMPTY, ...p.v }); };
  const rp = res?.range_pct;
  const an = res?.analogs;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-line bg-film-2/70 p-5">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs text-bone-dim mr-1">Try:</span>
          {PRESETS.map((p) => <button key={p.label} type="button" className={btnCls} onClick={() => preset(p)} disabled={busy}>{p.label}</button>)}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <label className="text-xs text-bone-dim">
            IPO name (for your reference)
            <input className={`${inputCls} w-full mt-1`} value={v.name} placeholder="optional" onChange={(e) => setV({ ...v, name: e.target.value })} />
          </label>
          <fieldset className="text-xs text-bone-dim">
            <legend>Board</legend>
            <div className="mt-1 grid grid-cols-2 rounded-lg border border-line overflow-hidden">
              {['SME', 'MAINBOARD'].map((b) => (
                <button key={b} type="button" aria-pressed={v.board === b} onClick={() => setV({ ...v, board: b })}
                  className={`py-2 text-sm ${v.board === b ? 'bg-beam/20 text-bone font-semibold' : 'bg-film text-bone-dim hover:text-bone'}`}>
                  {b === 'SME' ? 'SME' : 'Mainboard'}
                </button>
              ))}
            </div>
          </fieldset>
          {FIELDS.map(([k, label, ph]) => (
            <label key={k} className="text-xs text-bone-dim">
              {label}
              <input type="number" min="0" step="any" className={`${inputCls} w-full mt-1`} value={v[k]} placeholder={ph}
                onChange={(e) => setV({ ...v, [k]: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && run()} />
            </label>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-4">
          <button type="button" className={btnPrimaryCls} disabled={busy} onClick={() => run()}>{busy ? 'Working…' : 'Get the listing range'}</button>
          <span className="text-xs text-bone-dim">Use final-day subscription for the sharpest range. The Nifty's last 20 sessions are added automatically when available.</span>
        </div>
        {err && <p className="mt-3 text-sm text-critical" role="alert">{err}</p>}
      </div>

      {res && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-6 items-end pb-4 border-b border-line">
            <div className="flex-1 min-w-[280px]">
              <p className="text-sm text-bone-dim">{res.name || 'This IPO'} · {res.board === 'SME' ? 'SME' : 'Mainboard'} · {res.method_label}</p>
              <h3 className="text-2xl sm:text-3xl font-semibold font-serif text-bone">
                Likely to open between <span className="text-beam">{pct(rp.lo)}</span> and <span className="text-beam">{pct(rp.hi)}</span>
              </h3>
              <p className="text-bone mt-1">
                Middle of the range {pct(rp.median)}
                {res.range_price && <> · that is ₹{res.range_price.lo} to ₹{res.range_price.hi} on a ₹{res.inputs_used.issue_price} issue</>}.
                {' '}An {rp.level} range: about 1 in 5 IPOs land outside it.
              </p>
            </div>
            {an && (
              <div className="text-right text-sm">
                <div className="text-bone-dim">Chance of listing below issue price</div>
                <div className={`text-3xl font-bold tabular-nums ${an.p_loss > 0.25 ? 'text-critical' : 'text-bone'}`}>{prob(an.p_loss)}</div>
                <div className="text-bone-dim">{an.losses} of the {an.k} most similar past IPOs did</div>
              </div>
            )}
          </div>

          {res.warnings.map((w) => <p key={w} className="text-sm text-medium border-l-2 border-medium pl-3">{w}</p>)}

          <div className="grid lg:grid-cols-[1fr_320px] gap-4">
            <div className="rounded-lg border border-line bg-film-2/70 p-4">
              <h4 className="text-sm font-semibold text-bone mb-2">This IPO against everything else on its board</h4>
              <RangeStrip range={rp} baseline={res.board_baseline_pct} analogs={an?.closest || []} />
              <p className="text-xs text-bone-dim mt-2">
                Bars: {rp.level} ranges, thick tick = median. Dots: the 8 closest past listings (filled = real, hollow = synthetic). Hover a dot for its name.
              </p>
            </div>
            <aside className="rounded-lg border border-line bg-film-2/70 p-4 text-sm space-y-3">
              <h4 className="font-semibold text-bone">What moves the range</h4>
              <dl className="text-xs divide-y divide-line">
                {[{ label: 'As entered', ...rp, strong: true }, ...res.what_if, { label: 'Board history only', ...res.board_baseline_pct }].map((w) => (
                  <div key={w.label} className={`py-1.5 ${w.strong ? 'text-bone' : 'text-bone-dim'}`}>
                    <dt>{w.label}</dt>
                    <dd className="tabular-nums whitespace-nowrap">{pct(w.lo, 0)} to {pct(w.hi, 0)} <span className="text-mute">· middle {pct(w.median, 0)}</span></dd>
                  </div>
                ))}
              </dl>
              {an && (
                <p className="text-xs text-bone-dim">
                  The {an.k} closest past IPOs opened between {pct(an.p10, 0)} and {pct(an.p90, 0)} (10th–90th percentile); {an.losses} listed below issue. {an.real_count} of them are real listings.
                </p>
              )}
              <div className="flex flex-wrap gap-2 pt-1">
                <button type="button" className={btnCls} onClick={() => onUseInPlanner?.(res)}>Add to application planner</button>
                <button type="button" className={btnCls} onClick={() => onUseInSell?.(res)}>Plan when to sell</button>
              </div>
            </aside>
          </div>

          {an?.closest?.length > 0 && (
            <div className="rounded-lg border border-line bg-film-2/70 p-4 overflow-auto">
              <h4 className="text-sm font-semibold text-bone mb-2">Closest past listings</h4>
              <table className="w-full text-xs">
                <thead className="text-bone-dim"><tr>{['IPO', 'Listed', 'Total subscription', 'GMP', 'Issue size', 'Opened at'].map((t) => <th key={t} className="text-left px-2 py-1.5 font-medium">{t}</th>)}</tr></thead>
                <tbody>
                  {an.closest.map((a, i) => (
                    <tr key={`${a.name}-${i}`} className="border-t border-line">
                      <td className="px-2 py-1.5 text-bone">{a.name}{a.synthetic && <span className="ml-2 text-[10px] text-mute">synthetic</span>}</td>
                      <td className="px-2 py-1.5 tabular-nums">{a.date}</td>
                      <td className="px-2 py-1.5 tabular-nums">{a.sub_total != null ? `${a.sub_total}x` : '–'}</td>
                      <td className="px-2 py-1.5 tabular-nums">{a.gmp_pct != null ? pct(a.gmp_pct, 0) : '–'}</td>
                      <td className="px-2 py-1.5 tabular-nums">{a.issue_size_cr != null ? `${rs(a.issue_size_cr)} cr` : '–'}</td>
                      <td className={`px-2 py-1.5 tabular-nums ${a.gain_open_pct < 0 ? 'text-critical' : 'text-clear'}`}>{pct(a.gain_open_pct)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <ModelCard card={card} history={hist} onCard={(c) => { setCard(c); api('/api/decide/model').then((m) => setHist(m.history)).catch(() => {}); }} />
          <p className="text-xs text-bone-dim">{res.disclaimer}</p>
        </div>
      )}
    </div>
  );
}
