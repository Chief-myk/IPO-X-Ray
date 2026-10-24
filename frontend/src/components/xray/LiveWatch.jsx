import React, { useEffect, useState } from 'react';
import { api, form, SourceLink, inputCls, btnCls } from './api.jsx';

export default function LiveWatch({ subject, setSubject, refreshKey, mode }) {
  const [w, setW] = useState({ watched: [], alerts: [] });
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');

  const load = () => api('/api/watch').then(setW).catch(() => {});
  useEffect(() => { load(); }, [refreshKey]);

  const act = async (key, path) => {
    if (!subject.trim()) return;
    setBusy(key); setErr('');
    try { await api(path, { method: 'POST', body: form({ name: subject.trim() }) }); } catch (e) { setErr(e.message); }
    setBusy(''); load();
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3 items-center mb-3">
        <input className={`${inputCls} flex-1 min-w-[220px]`} list="xray-entities" value={subject}
          onChange={(e) => setSubject(e.target.value)} placeholder="Company or vendor to watch" />
        <button className={btnCls} disabled={!!busy} onClick={() => act('add', '/api/watch')}>Add to watchlist</button>
        <button className={btnCls} disabled={!!busy} onClick={() => act('run', '/api/watch/run')}>
          {busy === 'run' ? 'Agents running…' : 'Re-run checks now'}
        </button>
        <button className={btnCls} disabled={!!busy} onClick={() => act('sim', '/api/watch/simulate')}
          title="Adds a clearly labelled SIMULATED change so an alert can be shown on stage">
          Simulate a change (demo)
        </button>
      </div>
      <p className="text-xs text-bone-dim mb-3">
        {w.watched.length ? `Watching: ${w.watched.join(', ')}` : 'Watchlist is empty.'}
        {mode?.demo && ' · Demo mode: re-running reads the cache, so real changes will not appear. Use the simulate button.'}
      </p>
      {err && <p className="text-sm text-medium mb-3" role="alert">{err}</p>}
      <div className="rounded-2xl border border-line bg-film-2/70 divide-y divide-line">
        {w.alerts.length === 0 && <p className="p-4 text-sm text-bone-dim">No changes recorded yet. Re-run the checks later, or simulate one for the demo.</p>}
        {w.alerts.map((a) => (
          <div key={a.id} className="flex gap-4 p-4 text-sm">
            <time className="w-40 shrink-0 text-xs text-bone-dim">{a.detected_at.replace('T', ' ').replace('Z', ' UTC')}</time>
            <div>
              <b className="text-bone">{a.subject}</b>{' '}
              {a.simulated ? <span className="text-[11px] px-2 py-0.5 rounded-full border border-medium text-medium bg-medium/10">SIMULATED</span> : null}
              <div className="text-bone-dim">{a.detail}</div>
              <div className="text-xs"><SourceLink url={a.source_url} /></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
