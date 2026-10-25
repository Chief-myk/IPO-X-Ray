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
        <div key={id} className={`rounded-2xl border p-4 bg-[#080808] ${a.state === 'done' ? 'border-[#8FE0AE]/50' : a.state === 'fail' ? 'border-[#FF5A4E]/50' : 'border-white/10'}`}>
          <div className="text-[10px] uppercase font-mono tracking-wider text-[#D4AF37]">{a.kind.replace('_', ' ')} agent</div>
          <div className="font-semibold text-sm text-white truncate mt-0.5" title={a.target}>{a.target}</div>
          <div className={`text-xs mt-1.5 line-clamp-2 ${a.err ? 'text-[#FF8A3D]' : 'text-zinc-400'}`}>
            {a.state === 'done' ? `Done${a.cache ? ' (from cache)' : ''}` : a.state === 'fail' ? (a.error || 'Not found') : a.text}
          </div>
          {a.live && <div className="text-xs mt-2"><SourceLink url={a.live}>Watch the browser live</SourceLink></div>}
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
    <a href={url} target="_blank" rel="noopener noreferrer" className="text-[#D4AF37] hover:text-[#F5E59F] underline underline-offset-4 decoration-[#D4AF37]/40 break-all font-mono text-xs">
      {label}
    </a>
  );
}

export const inputCls =
  'bg-black border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/50 transition-all font-sans';
export const btnCls =
  'px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider border border-white/10 bg-[#080808] text-zinc-300 hover:border-[#D4AF37]/50 hover:text-white transition-all disabled:opacity-50 disabled:cursor-wait font-sans cursor-pointer';
export const btnPrimaryCls =
  'btn-gold px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-black shadow-lg shadow-[#D4AF37]/20 hover:shadow-[#D4AF37]/40 transition-all disabled:opacity-50 disabled:cursor-wait font-sans cursor-pointer';
