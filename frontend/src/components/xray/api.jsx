import React from 'react';

export async function api(path, opt) {
  const r = await fetch(path, opt);
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.detail || r.statusText);
  return j;
}

export function form(fields) {
  const f = new FormData();
  Object.entries(fields).forEach(([k, v]) => f.append(k, v));
  return f;
}

/** Follows a run's event stream. Returns the EventSource so the caller can close it. */
export function streamRun(id, onEvent, onEnd) {
  const es = new EventSource(`/api/investigations/${id}/stream`);
  es.onmessage = (m) => {
    let e;
    try { e = JSON.parse(m.data); } catch { return; }
    onEvent(e);
  };
  es.addEventListener('end', () => { es.close(); onEnd?.(); });
  es.onerror = () => { es.close(); onEnd?.(); };
  return es;
}

/** Keeps one lane per agent from agent_* events. */
export function laneReducer(lanes, e) {
  if (e.type === 'reset') return {};
  if (e.type === 'agent_start') return { ...lanes, [e.agent.id]: { ...e.agent, text: 'Starting…', state: 'run' } };
  if (!lanes[e.id]) return lanes;
  if (e.type === 'agent_step') return { ...lanes, [e.id]: { ...lanes[e.id], text: e.text, err: !!e.error } };
  if (e.type === 'agent_live') return { ...lanes, [e.id]: { ...lanes[e.id], live: e.url } };
  if (e.type === 'agent_done') return { ...lanes, [e.id]: { ...lanes[e.id], state: e.ok ? 'done' : 'fail', error: e.error, cache: e.from_cache } };
  return lanes;
}

export function Lanes({ lanes }) {
  const list = Object.entries(lanes);
  if (!list.length) return null;
  return (
    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {list.map(([id, a]) => (
        <div key={id} className={`rounded-xl border p-3 bg-film/60 ${a.state === 'done' ? 'border-clear/60' : a.state === 'fail' ? 'border-medium/60' : 'border-line'}`}>
          <div className="text-[11px] uppercase tracking-wider text-bone-dim">{a.kind.replace('_', ' ')} agent</div>
          <div className="font-semibold text-sm text-bone truncate" title={a.target}>{a.target}</div>
          <div className={`text-xs mt-1.5 line-clamp-2 ${a.err ? 'text-medium' : 'text-bone-dim'}`}>
            {a.state === 'done' ? `Done${a.cache ? ' (from cache)' : ''}` : a.state === 'fail' ? (a.error || 'Not found') : a.text}
          </div>
          {a.live && <div className="text-xs mt-1"><SourceLink url={a.live}>Watch the browser live</SourceLink></div>}
        </div>
      ))}
    </div>
  );
}

/** Findings come from the open web, so only ever link real http(s) URLs. */
export function SourceLink({ url, children = 'source' }) {
  if (typeof url !== 'string' || !/^https?:\/\//.test(url)) return null;
  let label = children;
  if (children === 'host') {
    try { label = new URL(url).hostname.replace(/^www\./, ''); } catch { label = 'source'; }
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="text-beam hover:underline break-all">
      {label}
    </a>
  );
}

export const inputCls =
  'bg-film border border-line rounded-lg px-3 py-2 text-sm text-bone placeholder:text-bone-dim/60 focus:outline-none focus:ring-2 focus:ring-beam/50';
export const btnCls =
  'px-4 py-2 rounded-lg text-sm font-medium border border-line bg-film-2 text-bone hover:border-beam/60 hover:text-beam transition-colors disabled:opacity-50 disabled:cursor-wait';
export const btnPrimaryCls =
  'px-4 py-2 rounded-lg text-sm font-semibold text-film bg-gradient-to-r from-beam to-[#A8E8F2] shadow-[0_0_20px_rgba(127,216,232,0.3)] hover:shadow-[0_0_28px_rgba(127,216,232,0.55)] transition-all disabled:opacity-50 disabled:cursor-wait';
