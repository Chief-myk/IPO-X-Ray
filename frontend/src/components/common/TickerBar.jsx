import React from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

const TICKER_DATA = [
  { symbol: 'NIFTY 50', val: '25,482.10', change: '+108.40 (+0.43%)', up: true },
  { symbol: 'NIFTY SME EMERGE', val: '18,945.30', change: '-124.60 (-0.65%)', up: false },
  { symbol: 'BSE IPO INDEX', val: '16,210.85', change: '+240.15 (+1.50%)', up: true },
  { symbol: 'INDIA VIX', val: '13.15', change: '-0.32 (-2.38%)', up: false },
  { symbol: 'AVG SME LISTING GAIN', val: '44.8%', change: 'Median H2-2026', up: true },
  { symbol: 'DRHP REJECTION RATE', val: '14.2%', change: 'SEBI Enhanced Scrutiny', up: false }
];

// One ticker item (shared by both marquee copies)
function TickerItem({ t }) {
  return (
    <div className="flex items-center gap-2 whitespace-nowrap px-6 border-r border-[#1A1A1A]">
      <span className="text-[#888888] font-medium tracking-wider text-[10px]">{t.symbol}</span>
      <span className="font-semibold text-white tracking-tight">{t.val}</span>
      <span
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
          t.up ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'
        }`}
      >
        {t.up ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
        {t.change}
      </span>
    </div>
  );
}

export default function TickerBar() {
  return (
    <div className="w-full flex items-stretch bg-black border-b border-[#181818] text-[11px] font-mono text-[#888888]">
      {/* Static label — stays fixed while data scrolls */}
      <div className="flex items-center gap-2 flex-none px-4 py-2 bg-[#080808] border-r border-[#181818] font-sans font-semibold text-[#D4AF37] text-[11px]">
        <span className="relative flex w-1.5 h-1.5">
          <span className="absolute inset-0 rounded-full bg-emerald-400 opacity-60 animate-ping motion-reduce:animate-none" />
          <span className="relative w-1.5 h-1.5 rounded-full bg-emerald-400" />
        </span>
        <Activity className="w-3 h-3 text-[#D4AF37]" />
        <span className="tracking-wide">Market Telemetry</span>
      </div>

      {/* Scrolling track: seamless loop */}
      <div
        className="ticker-viewport relative flex-1 overflow-hidden py-2"
        style={{ maskImage: 'linear-gradient(90deg, transparent, #000 40px, #000 calc(100% - 40px), transparent)' }}
        role="marquee"
        aria-label="Market telemetry"
      >
        <div className="ticker-track flex w-max">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex" aria-hidden={copy === 1}>
              {TICKER_DATA.map((t) => (
                <TickerItem key={`${copy}-${t.symbol}`} t={t} />
              ))}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes ticker-scroll { to { transform: translateX(-50%); } }
        .ticker-track { animation: ticker-scroll 40s linear infinite; }
        .ticker-viewport:hover .ticker-track,
        .ticker-viewport:focus-within .ticker-track { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) {
          .ticker-track { animation: none; }
          .ticker-viewport { overflow-x: auto; }
        }
      `}</style>
    </div>
  );
}
