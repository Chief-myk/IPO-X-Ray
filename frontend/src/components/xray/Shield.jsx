import React, { useState } from 'react';
import ClaimAutopsy from './ClaimAutopsy.jsx';
import TruthVsHype from './TruthVsHype.jsx';
import LiquiditySim from './LiquiditySim.jsx';

const TABS = [
  ['autopsy', 'Claim autopsy', 'Tip, ad or pre-IPO offer → what it promises, who it names, what official records say.'],
  ['hype', 'Truth vs hype', 'An influencer’s dated calls → what the price actually did, after costs, against Nifty.'],
  ['exit', 'Can I actually exit?', 'Your position + the stock’s real trading → days to sell, price you would get, capital at risk.'],
];

/** Investor-side tools: check a claim, audit a track record, stress-test an exit. */
export default function Shield() {
  const [tab, setTab] = useState('autopsy');
  return (
    <section id="shield" className="relative overflow-hidden max-w-[1440px] mx-auto px-4 md:px-12 py-16 lg:py-24 border-t border-line" aria-labelledby="shieldTitle">
      <div className="pointer-events-none absolute -top-24 left-0 w-96 h-96 rounded-full bg-beam/[0.06] blur-3xl" aria-hidden="true" />
      <div className="relative">
        <div className="w-14 h-1 rounded-full bg-gradient-to-r from-beam to-transparent mb-5" aria-hidden="true" />
        <h2 id="shieldTitle" className="text-3xl sm:text-5xl font-bold tracking-tight max-w-[22ch] font-['Bricolage_Grotesque'] bg-gradient-to-b from-bone to-bone-dim bg-clip-text text-transparent">
          Before you put money in
        </h2>
        <p className="mt-4 max-w-[62ch] text-bone-dim">
          Check what you were promised, whether the person promising it has ever been right, and whether you could get out if it goes wrong.
        </p>
        <div role="tablist" className="flex flex-wrap gap-1 mt-8 border-b border-line">
          {TABS.map(([k, t]) => (
            <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
              className={`px-4 py-2.5 text-sm rounded-t-lg transition-colors ${tab === k ? 'bg-film-2 text-bone border-b-2 border-beam' : 'text-bone-dim hover:text-bone'}`}>
              {t}
            </button>
          ))}
        </div>
        <p className="text-sm text-bone-dim mt-4 mb-4">{TABS.find(([k]) => k === tab)[2]}</p>
        <div role="tabpanel">
          {tab === 'autopsy' && <ClaimAutopsy />}
          {tab === 'hype' && <TruthVsHype />}
          {tab === 'exit' && <LiquiditySim />}
        </div>
      </div>
    </section>
  );
}
