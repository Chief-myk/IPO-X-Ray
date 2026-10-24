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
