import React, { useRef, useState } from 'react';
import { api, btnCls } from '../xray/api.jsx';
import { prob } from './format';

const COLS = [
  ['coverage', 'Covered', (m) => prob(m.coverage)],
  ['avg_width', 'Avg width', (m) => `${m.avg_width} pts`],
  ['interval_score', 'Interval score ↓', (m) => m.interval_score],
  ['mae_median', 'Median error', (m) => `${m.mae_median} pts`],
  ['direction_accuracy', 'Up/down right', (m) => prob(m.direction_accuracy)],
];

/** How the listing-range model was judged, on what data, and a way to feed it real IPOs. */
export default function ModelCard({ card, history, onCard }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');
  const fileRef = useRef(null);
  if (!card) return null;
  const basis = card.selection_basis.startsWith('real') ? 'real' : 'all';

  const upload = async (file) => {
    if (!file) return;
    setBusy('import'); setMsg('');
    const fd = new FormData();
    fd.append('file', file);
    try {
      const r = await api('/api/decide/history/import', { method: 'POST', body: fd });
      setMsg(`Imported ${r.kept} rows (${r.added} new, ${r.skipped} skipped). ${r.total_real} real IPOs on file.${r.warning ? ` ${r.warning}` : ''}`);
      if (r.card) onCard?.(r.card);
    } catch (e) { setMsg(e.message); }
    setBusy('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const retrain = async () => {
    setBusy('train'); setMsg('');
    try { onCard?.((await api('/api/decide/model/train', { method: 'POST' })).card); setMsg('Retrained.'); } catch (e) { setMsg(e.message); }
    setBusy('');
  };

  return (
    <div className="rounded-lg border border-line bg-film-2/70 p-4 text-sm">
      <button type="button" className="w-full flex items-center justify-between text-left" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span>
          <b className="text-bone">How good is this range?</b>{' '}
          <span className="text-bone-dim">
            {card.chosen_label} won on {card.selection_basis}: its {card.range} range covered{' '}
            <b className="text-bone">{prob(card.evaluation[card.chosen][basis].coverage)}</b> of held-out listings.
          </span>
        </span>
        <span className="text-bone-dim ml-3">{open ? '−' : '+'}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          <p className="text-bone-dim">
            Data: <b className="text-bone">{card.n_real}</b> real IPOs
            {card.n_real ? ` (SME ${card.real_by_board.SME}, mainboard ${card.real_by_board.MAINBOARD})` : ''} and{' '}
            <b className="text-bone">{card.n_synthetic}</b> synthetic ones (our stated assumptions, see <code>ipo_decide/synth.py</code>).
            {card.synthetic_retired ? ' Synthetic data is retired: the model learns from real IPOs only.' : ` Synthetic rows are dropped once ${card.retire_synthetic_at} real IPOs are imported; until then a real IPO counts ${card.real_weight}×.`}
          </p>
          <div className="overflow-auto">
            <table className="w-full text-xs">
              <thead className="text-bone-dim">
                <tr><th className="text-left px-2 py-1.5 font-medium">Method (test set: {card.evaluation[card.chosen][basis].n} listings)</th>{COLS.map(([k, t]) => <th key={k} className="text-right px-2 py-1.5 font-medium">{t}</th>)}</tr>
              </thead>
              <tbody>
                {Object.entries(card.evaluation).map(([k, e]) => (
                  <tr key={k} className={`border-t border-line ${k === card.chosen ? 'text-bone' : 'text-bone-dim'}`}>
                    <td className="px-2 py-2">{e.label}{k === card.chosen && <span className="ml-2 rounded bg-beam/15 text-beam px-1.5 py-0.5 text-[10px] font-semibold">in use</span>}</td>
                    {COLS.map(([c, , f]) => <td key={c} className="px-2 py-2 text-right tabular-nums">{e[basis] ? f(e[basis]) : '–'}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="list-disc pl-4 text-xs text-bone-dim space-y-1">
            <li>Target: {card.target}. Split: {card.split}.</li>
            <li>Interval score = width + 10 × how far outside the range the real result fell. It rewards ranges that are both narrow and right; lowest wins.</li>
            <li>{card.monotonic}</li>
            {card.partial_inputs && <li>{card.partial_inputs}</li>}
            <li>A good {card.range} range should cover about {card.range} of listings. Much more means it is too wide to be useful; much less means it is overconfident.</li>
          </ul>
          <div className="rounded-md border border-line/70 bg-film/50 p-3">
            <p className="text-bone font-medium">Make it real: import past IPOs</p>
            <p className="text-xs text-bone-dim mt-1">
              CSV with listing date, issue price, subscription (retail / NII / QIB / total) and the listing open or listing gain %.
              Common public dataset headers (IPOName, Issue_Size, Subscription_RII, Listing_Gains_Percent…) are recognised.
              Real IPOs on file: <b className="text-bone">{history?.real_rows ?? card.n_real}</b>.
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <label className={`${btnCls} cursor-pointer`}>
                {busy === 'import' ? 'Importing…' : 'Import CSV'}
                <input ref={fileRef} type="file" accept=".csv,text/csv" className="sr-only" disabled={!!busy} onChange={(e) => upload(e.target.files?.[0])} />
              </label>
              <button type="button" className={btnCls} disabled={!!busy} onClick={retrain}>{busy === 'train' ? 'Retraining…' : 'Retrain now'}</button>
              <span className="text-xs text-bone-dim">Trained {card.trained_at}</span>
            </div>
            {msg && <p className="text-xs text-bone mt-2" role="status">{msg}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
