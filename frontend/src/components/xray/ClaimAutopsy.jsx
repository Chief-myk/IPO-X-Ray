import React, { useEffect, useReducer, useRef, useState } from 'react';
import { Network, DataSet } from 'vis-network/standalone';
import { api, form, streamRun, laneReducer, Lanes, SourceLink, inputCls, btnCls, btnPrimaryCls } from './api.jsx';
import DraftPanel from './DraftPanel.jsx';

const STATUS = {
  verified: { t: 'Verified', c: '#8FE0AE', icon: '✓' },
  contradicted: { t: 'Contradicted', c: '#FF5A4E', icon: '✗' },
  unknown: { t: 'Unknown', c: '#8EA3B5', icon: '?' },
  source: { t: 'Source', c: '#7FD8E8', icon: '' },
};
const SHAPE = { source: 'box', claim: 'box', check: 'ellipse', person: 'dot', company: 'diamond', brand: 'diamond',
  website: 'triangle', upi: 'triangle', phone: 'triangle', registration: 'square' };
const LEVEL = { high: '#FF5A4E', caution: '#FFC23D', low: '#8FE0AE' };

function EvidenceGraph({ graph, onSelect }) {
  const box = useRef(null);
  useEffect(() => {
    if (!graph || !box.current) return undefined;
    const nodes = new DataSet(graph.nodes.map((n) => ({
      id: n.id, label: n.label.length > 34 ? `${n.label.slice(0, 33)}…` : n.label, shape: SHAPE[n.kind] || 'dot',
      color: { background: n.kind === 'claim' || n.kind === 'check' ? '#15283A' : STATUS[n.status].c, border: STATUS[n.status].c },
      borderWidth: n.kind === 'claim' || n.kind === 'check' ? 2 : 1, size: 14,
      font: { color: '#E6EDF2', size: 12 }, margin: 8,
    })));
    const edges = new DataSet(graph.edges.map((e, i) => ({
      id: i, from: e.from, to: e.to, label: e.label, arrows: 'to', color: { color: '#3a5673' },
      font: { color: '#9FB2C2', size: 10, strokeWidth: 0 },
    })));
    const net = new Network(box.current, { nodes, edges }, {
      layout: { hierarchical: { direction: 'LR', sortMethod: 'directed', levelSeparation: 230, nodeSpacing: 70 } },
      physics: false, interaction: { hover: true },
    });
    net.on('click', (p) => onSelect(p.nodes.length ? graph.nodes.find((n) => n.id === p.nodes[0]) : null));
    return () => net.destroy();
  }, [graph, onSelect]);
  return <div ref={box} className="absolute inset-0" />;
}

/** Paste a tip / upload a screenshot or PDF / give a link -> promises, names, official checks, evidence graph. */
export default function ClaimAutopsy() {
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState(null);
  const [check, setCheck] = useState(true);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState('');
  const [report, setReport] = useState(null);
  const [lanes, dispatch] = useReducer(laneReducer, {});
  const [sel, setSel] = useState(null);
  const esRef = useRef(null);
  const fileRef = useRef(null);
  useEffect(() => () => esRef.current?.close(), []);

  const run = async () => {
    if (busy) return;
    esRef.current?.close();
    setBusy(true); setReport(null); setSel(null); setPhase('Starting…');
    dispatch({ type: 'reset' });
    try {
      const fields = { text, url, check };
      if (file) fields.file = file;
      const r = await api('/api/autopsy', { method: 'POST', body: form(fields) });
      esRef.current = streamRun(r.id, (e) => {
        dispatch(e);
        if (e.type === 'phase') setPhase(e.label);
        else if (e.type === 'autopsy') setReport(e.report);
        else if (e.type === 'error') setPhase(`Stopped: ${e.message}`);
        else if (e.type === 'done') setPhase('');
      }, () => setBusy(false));
    } catch (err) { setPhase(err.message); setBusy(false); }
  };

  const sample = async () => {
    const s = await api('/api/autopsy/sample');
    setText(s.text); setUrl(''); setFile(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div>
      <div className="rounded-2xl border border-line bg-film-2/70 p-5">
        <textarea className={`${inputCls} w-full h-36`} value={text} onChange={(e) => setText(e.target.value)}
          placeholder="Paste the WhatsApp / Telegram message, ad text or offer here…" aria-label="Message text" />
        <div className="flex flex-wrap gap-3 items-center mt-3">
          <input className={`${inputCls} flex-1 min-w-[220px]`} value={url} onChange={(e) => setUrl(e.target.value)}
            placeholder="…or a public link (YouTube video, Telegram post, web page)" aria-label="Link" />
          <label className={`${btnCls} cursor-pointer`}>
            {file ? file.name.slice(0, 24) : 'Upload screenshot / PDF'}
            <input ref={fileRef} type="file" accept="image/*,.pdf,.txt" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
          <label className="text-xs text-bone-dim flex items-center gap-2">
            <input type="checkbox" checked={check} onChange={(e) => setCheck(e.target.checked)} /> check official records with agents
          </label>
          <button className={btnCls} onClick={sample}>Load a sample scam</button>
          <button className={btnPrimaryCls} disabled={busy || !(text.trim() || url.trim() || file)} onClick={run}>
            {busy ? 'Working…' : 'Run autopsy'}
          </button>
        </div>
        <p className="text-xs text-bone-dim mt-3">
          We look for what the message asks you to believe or do: guaranteed returns, allotment promises, paying a personal UPI ID, a famous name on an
          unofficial channel, look-alike websites. Agents then check named registrations, companies and people against SEBI, the exchanges and the company registry.
        </p>
        {phase && <p className="mt-3 text-sm text-beam" role="status">{phase}</p>}
        <Lanes lanes={lanes} />
      </div>

      {report && (
        <div className="mt-6">
          <div className="flex flex-wrap items-end gap-4 pb-4 border-b border-line">
            <div className="flex-1 min-w-[260px]">
              <p className="text-sm text-bone-dim">{report.title || 'The material you provided'}{report.partial ? ' · official checks still running' : ''}</p>
              <h3 className="text-3xl sm:text-4xl font-bold font-['Bricolage_Grotesque']" style={{ color: LEVEL[report.level] }}>{report.verdict}</h3>
            </div>
            <div className="flex gap-3 text-sm">
              {['contradicted', 'unknown', 'verified'].map((s) => (
                <div key={s} className="rounded-xl border border-line px-4 py-2 text-center">
                  <b className="block text-2xl text-bone tabular-nums">{report.counts[s]}</b>
                  <span className="text-xs text-bone-dim"><span style={{ color: STATUS[s].c }}>{STATUS[s].icon}</span> {STATUS[s].t}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr_360px] gap-4 mt-4">
            <div>
              <div className="flex flex-wrap gap-4 text-xs text-bone-dim mb-2">
                {['verified', 'contradicted', 'unknown'].map((s) => (
                  <span key={s} className="inline-flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: STATUS[s].c }} />{STATUS[s].icon} {STATUS[s].t}</span>
                ))}
                <span>Message → claims → names → official checks</span>
              </div>
              <div className="relative h-[480px] rounded-2xl border border-line bg-film-2/70">
                <EvidenceGraph graph={report.graph} onSelect={setSel} />
              </div>
            </div>
            <aside className="rounded-2xl border border-line bg-film-2/70 p-4 text-sm h-fit">
              {!sel && <span className="text-bone-dim">Click a node to see why it was flagged and its source.</span>}
              {sel && (
                <>
                  <div className="text-[11px] uppercase tracking-wider text-bone-dim">{sel.kind} · <span style={{ color: STATUS[sel.status].c }}>{STATUS[sel.status].icon} {STATUS[sel.status].t}</span></div>
                  <h4 className="text-lg font-semibold text-bone mb-2">{sel.label}</h4>
                  {sel.quote && <blockquote className="border-l-2 border-line pl-3 italic text-bone-dim mb-2">“{sel.quote}”</blockquote>}
                  {sel.detail && <p className="text-bone">{sel.detail}</p>}
                  {sel.source_url && <p className="mt-2 text-xs"><SourceLink url={sel.source_url}>Official source</SourceLink> · fetched {sel.fetched_at || '?'}</p>}
                </>
              )}
            </aside>
          </div>

          <h4 className="text-lg font-semibold text-bone mt-6 mb-2">What it claims</h4>
          <ol className="space-y-2">
            {report.claims.map((c) => (
              <li key={c.id} className="rounded-xl border border-line border-l-4 bg-film-2/50 p-4" style={{ borderLeftColor: STATUS[c.status].c }}>
                <div className="flex flex-wrap gap-2 items-baseline">
                  <b className="text-xs uppercase tracking-wider" style={{ color: STATUS[c.status].c }}>{STATUS[c.status].icon} {STATUS[c.status].t}</b>
                  <span className="font-semibold text-bone">{c.title}</span>
                </div>
                <blockquote className="text-sm italic text-bone-dim mt-1">“{c.quote}”</blockquote>
                <p className="text-sm text-bone mt-1">{c.why}</p>
                {c.checks.map((x, i) => (
                  <p key={i} className="text-xs mt-1">
                    <span style={{ color: STATUS[x.status].c }}>{STATUS[x.status].icon}</span> <span className="text-bone">{x.title}.</span>{' '}
                    <span className="text-bone-dim">{x.detail}</span> <SourceLink url={x.source_url} />
                  </p>
                ))}
              </li>
            ))}
            {!report.claims.length && <p className="text-bone-dim text-sm">No promises, payment requests or impersonation patterns found. That is not proof the offer is genuine.</p>}
          </ol>

          {report.checks.length > 0 && (
            <>
              <h4 className="text-lg font-semibold text-bone mt-6 mb-2">Official record checks</h4>
              <ul className="space-y-1 text-sm">
                {report.checks.map((x, i) => (
                  <li key={i}><span style={{ color: STATUS[x.status].c }}>{STATUS[x.status].icon} {STATUS[x.status].t}</span> · <span className="text-bone">{x.title}</span> <span className="text-bone-dim">· {x.detail}</span> <SourceLink url={x.source_url} /></li>
                ))}
              </ul>
            </>
          )}
          <div className="mt-6 flex flex-wrap gap-3 items-start">
            <DraftPanel source="autopsy" data={report} defaultKind="cybercrime" label="Report it: draft a 1930 / SEBI / RTI letter" />
          </div>
          <p className="text-xs text-bone-dim mt-4">{report.disclaimer}</p>
        </div>
      )}
    </div>
  );
}
