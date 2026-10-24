import React from 'react';
import { Activity, ShieldAlert, Layers, Search, Sparkles, Scale, Calculator, CheckCircle2 } from 'lucide-react';

export default function Navbar({ health }) {
  const isLive = health?.live;
  const isHealthy = health !== null;

  return (
    <header className="sticky top-0 z-40 w-full transition-all duration-300">
      {/* Primary Glass Header */}
      <div className="relative flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-10 py-3 bg-[#09131C]/85 backdrop-blur-2xl backdrop-saturate-150 border-b border-[#27435E]/60 shadow-[0_12px_40px_-15px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.06)]">
        {/* Animated laser hairline on bottom edge */}
        <div 
          className="pointer-events-none absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-beam/70 to-transparent" 
          aria-hidden="true" 
        />

        {/* Brand / Logo */}
        <a 
          href="#top" 
          className="group flex items-center gap-2.5 sm:gap-3 no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-beam/60 rounded-xl flex-none"
          aria-label="IPO X-Ray Home"
        >
          {/* Logo Badge with Multi-layered Depth */}
          <div className="relative grid place-items-center w-9 sm:w-10 h-9 sm:h-10 rounded-xl bg-gradient-to-br from-[#1C3650] via-[#13273B] to-[#0A1724] border border-[#27435E]/90 shadow-[0_0_20px_rgba(127,216,232,0.25),inset_0_1px_0_rgba(255,255,255,0.15)] transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(127,216,232,0.55)] group-hover:scale-105 group-hover:border-beam/50">
            <svg viewBox="0 0 32 32" className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" aria-hidden="true">
              <path d="M7 9h18M7 16h12M7 23h15" stroke="#E6EDF2" strokeWidth="2.4" strokeLinecap="round" fill="none" />
              <rect x="4" y="14.5" width="24" height="3" fill="#7FD8E8" opacity="0.9" rx="1.5" />
            </svg>
            <div className="absolute inset-0 rounded-xl bg-beam/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm -z-10" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-['Bricolage_Grotesque'] font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-bone via-[#EAFBFF] to-beam bg-clip-text text-transparent">
                IPO X-Ray
              </span>
              <span className="hidden xl:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono tracking-wider font-semibold uppercase bg-beam/10 border border-beam/25 text-beam">
                <Sparkles className="w-2.5 h-2.5" />
                360 Platform
              </span>
            </div>
            <span className="hidden sm:block text-[10px] font-mono text-bone-dim tracking-wider uppercase -mt-0.5">
              Forensic Intelligence
            </span>
          </div>
        </a>

        {/* Center / Navigation Links for all features */}
        <nav className="hidden lg:flex items-center gap-1 text-xs font-medium" aria-label="Primary Navigation">
          <a
            href="#how"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-bone-dim hover:text-bone hover:bg-film-2/50 border border-transparent hover:border-line/60 transition-all duration-200 no-underline"
          >
            <Layers className="w-3.5 h-3.5 text-beam/80" />
            <span>How it works</span>
          </a>
          <a
            href="#cases"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-bone-dim hover:text-bone hover:bg-film-2/50 border border-transparent hover:border-line/60 transition-all duration-200 no-underline"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-[#FF8A3D]/80" />
            <span>Precedents</span>
          </a>
          <a
            href="#debate"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-bone-dim hover:text-bone hover:bg-film-2/50 border border-transparent hover:border-line/60 transition-all duration-200 no-underline"
          >
            <Scale className="w-3.5 h-3.5 text-beam" />
            <span>Bull vs Bear</span>
          </a>
          <a
            href="#simulator"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-bone-dim hover:text-bone hover:bg-film-2/50 border border-transparent hover:border-line/60 transition-all duration-200 no-underline"
          >
            <Calculator className="w-3.5 h-3.5 text-[#A8E8F2]" />
            <span>Simulator</span>
          </a>
          <a
            href="#promises"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-bone-dim hover:text-bone hover:bg-film-2/50 border border-transparent hover:border-line/60 transition-all duration-200 no-underline"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-clear" />
            <span>Promise Tracker</span>
          </a>
        </nav>

        {/* Right actions: Status Badge + CTA */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-none">
          {/* Health Status Telemetry Badge */}
          <div 
            className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-full border border-[#27435E]/80 bg-[#122232]/70 backdrop-blur-md shadow-inner text-xs transition-colors hover:border-beam/40"
            title={!isHealthy ? 'Checking TinyFish API status...' : isLive ? 'TinyFish web agent network active' : 'Sample mode: Add TINYFISH_API_KEY in backend/.env for live autonomous web agents'}
          >
            <span className="relative flex w-2 h-2">
              {isHealthy && isLive && (
                <span className="absolute inline-flex w-full h-full rounded-full bg-clear opacity-75 animate-ping" />
              )}
              <span
                className={`relative inline-flex w-2 h-2 rounded-full transition-all duration-300 ${
                  !isHealthy
                    ? 'bg-unverified animate-pulse'
                    : isLive
                    ? 'bg-clear shadow-[0_0_10px_rgba(143,224,174,0.7)]'
                    : 'bg-medium shadow-[0_0_10px_rgba(255,194,61,0.6)]'
                }`}
              />
            </span>
            <span className="font-mono text-[10px] sm:text-[11px] text-bone-dim hidden sm:inline">
              {!isHealthy ? (
                'Checking agents…'
              ) : isLive ? (
                <span className="text-clear font-medium flex items-center gap-1">
                  <Activity className="w-3 h-3 inline text-clear" />
                  Agents live
                </span>
              ) : (
                <span className="text-medium font-medium">Sample mode</span>
              )}
            </span>
          </div>

          {/* Quick Action Button */}
          <a
            href="#probe"
            className="group/cta relative inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-[#091724] bg-gradient-to-r from-beam via-[#A3EAF7] to-beam bg-[length:200%_auto] hover:bg-right shadow-[0_0_20px_rgba(127,216,232,0.35)] hover:shadow-[0_0_30px_rgba(127,216,232,0.6)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 no-underline"
          >
            <Search className="w-3.5 h-3.5 stroke-[2.5] text-[#091724] transition-transform duration-300 group-hover/cta:scale-110" />
            <span>Investigate</span>
          </a>
        </div>
      </div>
    </header>
  );
}