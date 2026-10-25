import React, { useEffect, useRef, useState } from 'react';
import { Network, DataSet } from 'vis-network/standalone';
import { api, SourceLink, inputCls, btnCls } from './api.jsx';
import DraftPanel from './DraftPanel.jsx';

const COLOR = { company: '#D4AF37', person: '#C9B8FF', vendor: '#FF8A3D', address: '#8EA3B5', phone: '#8EA3B5', email: '#8EA3B5' };
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
      font: { color: '#FFFFFF', size: 13, face: 'Plus Jakarta Sans' }, size: n.id === data.start ? 24 : 16,
    })));
    const edges = new DataSet(data.edges.map((e) => ({
      id: e.id, from: e.from, to: e.to, label: relText(e.rel), arrows: 'to',
      color: { color: e.flagged ? '#FF5A4E' : 'rgba(212, 175, 55, 0.4)' }, width: e.flagged ? 3 : 1.2,
      dashes: !e.flagged && e.rel.startsWith('HAS'), font: { color: '#A1A1AA', size: 10, strokeWidth: 0, face: 'JetBrains Mono' },
    })));
    const net = new Network(box.current, { nodes, edges }, { physics: { stabilization: { iterations: 120 }, barnesHut: { springLength: 130 } }, interaction: { hover: true } });
    net.on('click', (p) => {
      if (p.nodes.length) setSel({ node: data.nodes.find((n) => n.id === p.nodes[0]) });
      else if (p.edges.length) setSel({ edge: data.edges.find((e) => e.id === p.edges[0]) });
    });
    return () => net.destroy();
  }, [data]);

  return (
    <div>
      <div className="flex flex-wrap gap-3 items-center mb-4">
        <input className={`${inputCls} flex-1 min-w-[220px]`} value={q} onChange={(e) => setQ(e.target.value)}
          list="xray-entities" placeholder="Person or company to map" onKeyDown={(e) => e.key === 'Enter' && load()} />
        <select className={inputCls} value={depth} onChange={(e) => setDepth(+e.target.value)} aria-label="Levels">
          {[1, 2, 3].map((d) => <option key={d} value={d} className="bg-black text-white">{d} level{d > 1 ? 's' : ''}</option>)}
        </select>
        <button className={btnCls} onClick={() => load()}>Show network</button>
      </div>
      <div className="flex flex-wrap gap-4 text-xs font-mono text-zinc-400 mb-4">
        {[['Company', COLOR.company], ['Person', COLOR.person], ['Vendor', COLOR.vendor], ['Address / phone / email', COLOR.address], ['Red-flag link (shared or repeated)', '#FF5A4E']].map(([t, c]) => (
          <span key={t} className="inline-flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: c }} />{t}</span>
        ))}
      </div>
      <div className="grid lg:grid-cols-[1fr_340px] gap-4">
        <div className="relative h-[540px] rounded-2xl border border-white/10 bg-black">
          <div ref={box} className="absolute inset-0" />
          {data && !data.found && (
            <div className="absolute inset-0 grid place-items-center text-center p-6 text-zinc-500">
              <p><b className="text-white">Not found.</b> Nothing stored for “{data.query}” yet. Run the agents above first.</p>
            </div>
          )}
          {!data && <div className="absolute inset-0 grid place-items-center text-zinc-500 text-sm font-sans">Enter a name to map its promoter and vendor network.</div>}
        </div>
        <aside className="space-y-3">
          <div className="rounded-2xl border border-white/10 bg-[#080808] p-5 text-sm">
            {!sel && <span className="text-zinc-500 font-sans">Click a node or link to see its details and sources.</span>}
            {sel?.node && (
              <>
                <div className="text-[10px] uppercase font-mono tracking-widest text-[#D4AF37]">{sel.node.kind}</div>
                <h3 className="text-lg font-cinzel font-bold text-white mb-2">{sel.node.label}</h3>
                {sel.node.reasons.map((r) => <p key={r} className="border-l-2 border-rose-500 bg-rose-500/10 px-3 py-1.5 mb-2 rounded-r text-rose-300 text-xs">{r}</p>)}
                {sel.node.facts.length === 0 && <p className="text-zinc-500 text-xs">No sourced facts stored.</p>}
                {sel.node.facts.map((f, i) => (
                  <div key={i} className="mb-2 text-xs">
                    <span className="text-zinc-400">{f.field}:</span> <span className="text-white">{f.value}</span>
                    <div className="text-[11px] text-zinc-500 mt-0.5"><SourceLink url={f.source_url} /> · fetched {f.fetched_at || '?'}</div>
                  </div>
                ))}
              </>
            )}
            {sel?.edge && (
              <>
                <h3 className="text-lg font-cinzel font-bold text-white mb-2 capitalize">{relText(sel.edge.rel)}</h3>
                {sel.edge.reason && <p className="border-l-2 border-rose-500 bg-rose-500/10 px-3 py-1.5 mb-2 rounded-r text-rose-300 text-xs">{sel.edge.reason}</p>}
                <SourceLink url={sel.edge.source_url}>Source</SourceLink>
                <div className="text-xs text-zinc-500 mt-1">fetched {sel.edge.fetched_at || '?'}</div>
              </>
            )}
          </div>
          {data?.found && (
            data.flags.length
              ? (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-5 text-sm">
                  <h4 className="font-bold text-rose-400 mb-2 font-cinzel text-sm uppercase tracking-wider">Red flags (Review required)</h4>
                  {data.flags.map((f, i) => <p key={i} className="border-l-2 border-rose-500 pl-3 py-1 text-rose-200 text-xs leading-relaxed">{f.reason}</p>)}
                  <div className="mt-4"><DraftPanel source="network" data={data} label="Draft a complaint / RTI" /></div>
                </div>
              )
              : <p className="text-sm text-zinc-500">No shared address, phone, email or repeated vendor in the stored data.</p>
          )}
        </aside>
      </div>
    </div>
  );
}
