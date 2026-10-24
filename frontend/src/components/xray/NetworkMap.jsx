import React, { useEffect, useRef, useState } from 'react';
import { Network, DataSet } from 'vis-network/standalone';
import { api, SourceLink, inputCls, btnCls } from './api.jsx';

const COLOR = { company: '#7FD8E8', person: '#C9B8FF', vendor: '#FF8A3D', address: '#8EA3B5', phone: '#8EA3B5', email: '#8EA3B5' };
const SHAPE = { company: 'box', person: 'dot', vendor: 'diamond', address: 'triangle', phone: 'triangle', email: 'triangle' };
const relText = (r) => r.replace('_', ' ').toLowerCase();

export default function NetworkMap({ subject, refreshKey }) {
  const [q, setQ] = useState(subject);
  const [depth, setDepth] = useState(2);
  const [data, setData] = useState(null);
  const [sel, setSel] = useState(null);
  const box = useRef(null);

  useEffect(() => setQ(subject), [subject]);

  const load = async (name = q) => {
    if (!name.trim()) return;
    const g = await api(`/api/graph?q=${encodeURIComponent(name.trim())}&depth=${depth}`);
    setData(g);
    setSel(g.found ? { node: g.nodes.find((n) => n.id === g.start) } : null);
  };
  useEffect(() => { if (subject) load(subject).catch(() => setData(null)); /* eslint-disable-next-line */ }, [subject, refreshKey, depth]);

  useEffect(() => {
    if (!data?.found || !box.current) return undefined;
    const nodes = new DataSet(data.nodes.map((n) => ({
      id: n.id, label: n.label.length > 26 ? `${n.label.slice(0, 25)}…` : n.label, shape: SHAPE[n.kind] || 'dot',
      color: { background: COLOR[n.kind], border: n.flagged ? '#FF5A4E' : COLOR[n.kind] }, borderWidth: n.flagged ? 4 : 1,
      font: { color: '#E6EDF2', size: 13 }, size: n.id === data.start ? 24 : 16,
    })));
    const edges = new DataSet(data.edges.map((e) => ({
      id: e.id, from: e.from, to: e.to, label: relText(e.rel), arrows: 'to',
      color: { color: e.flagged ? '#FF5A4E' : '#3a5673' }, width: e.flagged ? 4 : 1.2,
      dashes: !e.flagged && e.rel.startsWith('HAS'), font: { color: '#9FB2C2', size: 10, strokeWidth: 0 },
    })));
    const net = new Network(box.current, { nodes, edges }, { physics: { stabilization: 120, barnesHut: { springLength: 130 } }, interaction: { hover: true } });
    net.on('click', (p) => {
      if (p.nodes.length) setSel({ node: data.nodes.find((n) => n.id === p.nodes[0]) });
      else if (p.edges.length) setSel({ edge: data.edges.find((e) => e.id === p.edges[0]) });
    });
    return () => net.destroy();
  }, [data]);

  return (
    <div>
      <div className="flex flex-wrap gap-3 items-center mb-3">
        <input className={`${inputCls} flex-1 min-w-[220px]`} value={q} onChange={(e) => setQ(e.target.value)}
          list="xray-entities" placeholder="Person or company to map" onKeyDown={(e) => e.key === 'Enter' && load()} />
        <select className={inputCls} value={depth} onChange={(e) => setDepth(+e.target.value)} aria-label="Levels">
          {[1, 2, 3].map((d) => <option key={d} value={d}>{d} level{d > 1 ? 's' : ''}</option>)}
        </select>
        <button className={btnCls} onClick={() => load()}>Show network</button>
      </div>
      <div className="flex flex-wrap gap-4 text-xs text-bone-dim mb-3">
        {[['Company', COLOR.company], ['Person', COLOR.person], ['Vendor', COLOR.vendor], ['Address / phone / email', COLOR.address], ['Red-flag link (shared or repeated)', '#FF5A4E']].map(([t, c]) => (
          <span key={t} className="inline-flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: c }} />{t}</span>
        ))}
      </div>
      <div className="grid lg:grid-cols-[1fr_340px] gap-4">
        <div className="relative h-[540px] rounded-2xl border border-line bg-film-2/70">
          <div ref={box} className="absolute inset-0" />
          {data && !data.found && (
            <div className="absolute inset-0 grid place-items-center text-center p-6 text-bone-dim">
              <p><b className="text-bone">Not found.</b> Nothing stored for “{data.query}” yet. Run the agents above first.</p>
            </div>
          )}
          {!data && <div className="absolute inset-0 grid place-items-center text-bone-dim text-sm">Enter a name to map its network.</div>}
        </div>
        <aside className="space-y-3">
          <div className="rounded-2xl border border-line bg-film-2/70 p-4 text-sm">
            {!sel && <span className="text-bone-dim">Click a node or link to see its details and sources.</span>}
            {sel?.node && (
              <>
                <div className="text-[11px] uppercase tracking-wider text-bone-dim">{sel.node.kind}</div>
                <h3 className="text-lg font-semibold text-bone mb-2">{sel.node.label}</h3>
                {sel.node.reasons.map((r) => <p key={r} className="border-l-2 border-critical bg-critical/10 px-3 py-1.5 mb-2 rounded-r">{r}</p>)}
                {sel.node.facts.length === 0 && <p className="text-bone-dim">No sourced facts stored.</p>}
                {sel.node.facts.map((f, i) => (
                  <div key={i} className="mb-2">
                    <span className="text-bone-dim">{f.field}:</span> {f.value}
                    <div className="text-xs text-bone-dim"><SourceLink url={f.source_url} /> · fetched {f.fetched_at || '?'}</div>
                  </div>
                ))}
              </>
            )}
            {sel?.edge && (
              <>
                <h3 className="text-lg font-semibold text-bone mb-2">{relText(sel.edge.rel)}</h3>
                {sel.edge.reason && <p className="border-l-2 border-critical bg-critical/10 px-3 py-1.5 mb-2 rounded-r">{sel.edge.reason}</p>}
                <SourceLink url={sel.edge.source_url}>Source</SourceLink>
                <div className="text-xs text-bone-dim">fetched {sel.edge.fetched_at || '?'}</div>
              </>
            )}
          </div>
          {data?.found && (
            data.flags.length
              ? (
                <div className="rounded-2xl border border-critical/40 bg-critical/5 p-4 text-sm">
                  <h4 className="font-semibold text-bone mb-2">Red flags (need review)</h4>
                  {data.flags.map((f, i) => <p key={i} className="border-l-2 border-critical pl-3 py-1">{f.reason}</p>)}
                </div>
              )
              : <p className="text-sm text-bone-dim">No shared address, phone, email or repeated vendor in the stored data.</p>
          )}
        </aside>
      </div>
    </div>
  );
}
