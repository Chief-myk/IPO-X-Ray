import React, { useEffect, useState } from 'react';
import { api } from './api.jsx';
import RunPanel from './RunPanel.jsx';
import NetworkMap from './NetworkMap.jsx';
import VendorScorecards from './VendorScorecards.jsx';
import LiveWatch from './LiveWatch.jsx';

const TABS = [['net', 'Promoter network'], ['ven', 'Vendor scorecards'], ['alr', 'Live watch']];

/** Shared pipeline UI: agents -> entity store -> network map, vendor scores, change alerts. */
export default function XRay() {
  const [tab, setTab] = useState('net');
  const [subject, setSubject] = useState('');
  const [entities, setEntities] = useState([]);
  const [mode, setMode] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [request, setRequest] = useState(null);

  const loadEntities = () => api('/api/entities').then((rows) => {
    setEntities(rows);
    const co = rows.find((r) => r.kind === 'company');           // open on real stored data, not an empty screen
    setSubject((s) => s || co?.name || '');
  }).catch(() => {});

  useEffect(() => { loadEntities(); api('/api/mode').then(setMode).catch(() => {}); }, []);

  const done = () => { setRefreshKey((k) => k + 1); loadEntities(); };
  const checkVendor = (name) => setRequest({ kind: 'vendor', name, id: Date.now() });

  return (
    <section id="xray" className="relative overflow-hidden max-w-[1440px] mx-auto px-4 md:px-12 py-16 lg:py-24 border-t border-line" aria-labelledby="xrayTitle">
      <div className="pointer-events-none absolute -top-24 right-0 w-96 h-96 rounded-full bg-beam/[0.07] blur-3xl" aria-hidden="true" />
      <div className="relative">
        <div className="w-14 h-1 rounded-full bg-gradient-to-r from-beam to-transparent mb-5" aria-hidden="true" />
        <h2 id="xrayTitle" className="text-3xl sm:text-5xl font-bold tracking-tight max-w-[22ch] font-['Bricolage_Grotesque'] bg-gradient-to-b from-bone to-bone-dim bg-clip-text text-transparent">
          Who is really behind the IPO?
        </h2>
        <p className="mt-4 max-w-[62ch] text-bone-dim">
          Map the promoter network, score every vendor for real-world presence, and get alerted when something changes.
          {mode && <span className="ml-2 text-xs px-2 py-0.5 rounded-full border border-line">{mode.demo ? 'Demo mode · cached agent results' : mode.live ? 'Live · TinyFish connected' : 'No TinyFish key'}</span>}
        </p>

        <div className="mt-8">
          <RunPanel subject={subject} setSubject={setSubject} entities={entities} request={request} onDone={done} mode={mode} />
        </div>

        <div role="tablist" className="flex gap-1 mt-8 border-b border-line">
          {TABS.map(([k, t]) => (
            <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
              className={`px-4 py-2.5 text-sm rounded-t-lg transition-colors ${tab === k ? 'bg-film-2 text-bone border-b-2 border-beam' : 'text-bone-dim hover:text-bone'}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="mt-5" role="tabpanel">
          {tab === 'net' && <NetworkMap subject={subject} refreshKey={refreshKey} />}
          {tab === 'ven' && <VendorScorecards refreshKey={refreshKey} onCheck={(n) => checkVendor(n)} />}
          {tab === 'alr' && <LiveWatch subject={subject} setSubject={setSubject} refreshKey={refreshKey} mode={mode} />}
        </div>
      </div>
    </section>
  );
}
