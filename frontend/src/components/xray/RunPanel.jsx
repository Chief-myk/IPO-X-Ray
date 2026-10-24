import React, { useEffect, useRef, useState } from 'react';
import { api, form, SourceLink, inputCls, btnPrimaryCls } from './api.jsx';

/** Starts TinyFish agents for a company / director / vendor and shows each agent's live progress. */
export default function RunPanel({ subject, setSubject, entities, request, onDone, mode }) {
  const [kind, setKind] = useState('company');
  const [refresh, setRefresh] = useState(false);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState('');
  const [lanes, setLanes] = useState({});
  const esRef = useRef(null);

  useEffect(() => () => esRef.current?.close(), []);

  const start = async (k, name, force) => {
    if (!name.trim() || busy) return;
    esRef.current?.close();
    setBusy(true);
    setLanes({});
    setPhase('Starting agents…');
    try {
      const run = await api('/api/runs', { method: 'POST', body: form({ kind: k, name: name.trim(), refresh: force }) });
      const es = new EventSource(`/api/investigations/${run.id}/stream`);
      esRef.current = es;
      es.onmessage = (m) => {
        let e;
        try { e = JSON.parse(m.data); } catch { return; }
        if (e.type === 'phase') setPhase(e.label);
        else if (e.type === 'agent_start') setLanes((l) => ({ ...l, [e.agent.id]: { ...e.agent, text: 'Starting…', state: 'run' } }));
        else if (e.type === 'agent_step') setLanes((l) => l[e.id] ? { ...l, [e.id]: { ...l[e.id], text: e.text, err: !!e.error } } : l);
        else if (e.type === 'agent_live') setLanes((l) => l[e.id] ? { ...l, [e.id]: { ...l[e.id], live: e.url } } : l);
        else if (e.type === 'agent_done') setLanes((l) => l[e.id] ? { ...l, [e.id]: { ...l[e.id], state: e.ok ? 'done' : 'fail', cache: e.from_cache, error: e.error, sources: e.sources || [] } } : l);
        else if (e.type === 'error') setPhase(`Stopped: ${e.message}`);
        else if (e.type === 'done') { setPhase('Finished. Network, scorecards and watchlist are updated.'); onDone?.(name.trim()); }
      };
      es.addEventListener('end', () => { es.close(); setBusy(false); });
      es.onerror = () => { es.close(); setBusy(false); };
    } catch (err) {
      setPhase(err.message);
      setBusy(false);
    }
  };

  // another tab (e.g. "Check this vendor") asked for a run
  useEffect(() => {
    if (request) { setKind(request.kind); setSubject(request.name); start(request.kind, request.name, false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request]);

  const demo = mode?.demo;
  return (
    <div className="rounded-2xl border border-line bg-film-2/70 p-5">
      <div className="flex flex-wrap gap-3 items-center">
        <select value={kind} onChange={(e) => setKind(e.target.value)} className={inputCls} aria-label="What to investigate">
          <option value="company">Company / IPO</option>
          <option value="director">Director / promoter</option>
          <option value="vendor">Vendor</option>
        </select>
        <input
          className={`${inputCls} flex-1 min-w-[240px]`} list="xray-entities" value={subject}
          onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Trafiksol ITS Technologies"
          onKeyDown={(e) => e.key === 'Enter' && start(kind, subject, refresh)}
        />
        <datalist id="xray-entities">{entities.map((r) => <option key={r.id} value={r.name}>{r.kind}</option>)}</datalist>
        <label className="text-xs text-bone-dim flex items-center gap-2">
          <input type="checkbox" checked={refresh} onChange={(e) => setRefresh(e.target.checked)} /> re-run agents (ignore cache)
        </label>
        <button className={btnPrimaryCls} disabled={busy || !subject.trim()} onClick={() => start(kind, subject, refresh)}>
          {busy ? 'Agents running…' : 'Run TinyFish agents'}
        </button>
      </div>
      <p className="text-xs text-bone-dim mt-3">
        {demo ? 'Demo mode: results come from cached agent runs, nothing is fetched live. ' : ''}
        Agents get a goal, not a script: they decide which public sites to open. Everything here is a red flag or needs review, never a verdict, and every finding links its source.
      </p>
      {phase && <p className="mt-3 text-sm text-beam" role="status">{phase}</p>}
      {Object.keys(lanes).length > 0 && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(lanes).map(([id, a]) => (
            <div key={id} className={`rounded-xl border p-3 bg-film/60 ${a.state === 'done' ? 'border-clear/60' : a.state === 'fail' ? 'border-medium/60' : 'border-line'}`}>
              <div className="text-[11px] uppercase tracking-wider text-bone-dim">{a.kind} agent</div>
              <div className="font-semibold text-sm text-bone truncate" title={a.target}>{a.target}</div>
              <div className={`text-xs mt-1.5 line-clamp-2 ${a.err ? 'text-medium' : 'text-bone-dim'}`}>
                {a.state === 'done' ? `Done${a.cache ? ' (from cache)' : ''} · ${a.sources.length} sources`
                  : a.state === 'fail' ? (a.error || 'Not found') : a.text}
              </div>
              {a.live && <div className="text-xs mt-1"><SourceLink url={a.live}>Watch the browser live</SourceLink></div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
