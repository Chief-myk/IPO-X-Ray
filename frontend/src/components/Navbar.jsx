import React from 'react';

export default function Navbar({ health }) {
  const isLive = health?.live;
  const isHealthy = health !== null;

  // shared link style: animated underline on hover + keyboard focus ring
  const linkCls =
    "relative py-1 text-bone-dim hover:text-bone transition-colors no-underline " +
    "after:absolute after:left-0 after:-bottom-0.5 after:h-px after:w-0 after:bg-beam " +
    "after:transition-all after:duration-300 hover:after:w-full " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-beam/60 rounded-sm";

  return (
    <header className="sticky top-0 z-30 flex items-center gap-7 px-4 md:px-12 py-3 bg-[#0F1E2B]/70 backdrop-blur-xl backdrop-saturate-150 border-b border-[#27435E]/50 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.6)]">
      {/* glowing hairline under the header */}
      <div className="pointer-events-none absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-beam/60 to-transparent" />

      <a href="#top" className="group flex items-center gap-2.5 text-bone font-bold text-lg tracking-tight no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-beam/60 rounded-lg">
        {/* logo now sits in a glowing tile */}
        <span className="grid place-items-center w-9 h-9 rounded-xl bg-gradient-to-br from-[#1B3550] to-[#0F1E2B] border border-[#27435E] shadow-[0_0_18px_rgba(127,216,232,0.22)] transition-all duration-300 group-hover:shadow-[0_0_26px_rgba(127,216,232,0.5)] group-hover:-translate-y-0.5">
          <svg viewBox="0 0 32 32" className="w-6 h-6 transition-transform duration-300 group-hover:scale-110" aria-hidden="true">
            <path d="M7 9h18M7 16h12M7 23h15" stroke="#E6EDF2" strokeWidth="2.4" strokeLinecap="round" fill="none" />
            <rect x="4" y="14.5" width="24" height="3" fill="#7FD8E8" opacity="0.85" />
          </svg>
        </span>
        <span className="font-['Bricolage_Grotesque'] bg-gradient-to-r from-bone to-beam bg-clip-text text-transparent">IPO X-Ray</span>
      </a>

      <nav className="hidden sm:flex items-center gap-6 ml-auto text-sm" aria-label="Sections">
        <a href="#how" className={linkCls}>How it works</a>
        <a href="#cases" className={linkCls}>Why it matters</a>
        <a href="#xray" className={linkCls}>Network · Vendors · Watch</a>
        <a href="#shield" className={linkCls}>Before you invest</a>
        {/* Investigate becomes a CTA pill */}
        <a
          href="#probe"
          className="px-4 py-1.5 rounded-full font-medium text-[#0F1E2B] bg-gradient-to-r from-beam to-[#A8E8F2] shadow-[0_0_20px_rgba(127,216,232,0.35)] hover:shadow-[0_0_28px_rgba(127,216,232,0.6)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-beam/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F1E2B]"
        >
          Investigate
        </a>
      </nav>

      <div className="ml-auto sm:ml-0 flex items-center gap-2 text-xs text-bone-dim px-3 py-1.5 border border-line rounded-full bg-film-2/50 backdrop-blur-sm transition-colors hover:border-beam/40">
        {/* dot with a pulsing ring when live */}
        <span className="relative flex w-2 h-2">
          {isHealthy && isLive && (
            <span className="absolute inline-flex w-full h-full rounded-full bg-clear opacity-60 animate-ping" />
          )}
          <span
            className={`relative inline-flex w-2 h-2 rounded-full transition-all ${
              !isHealthy
                ? 'bg-unverified animate-pulse'
                : isLive
                ? 'bg-clear shadow-[0_0_8px_rgba(143,224,174,0.5)]'
                : 'bg-medium'
            }`}
          />
        </span>
        <span className="hidden sm:inline">
          {!isHealthy
            ? 'Checking agents…'
            : isLive
            ? 'TinyFish agents live'
            : 'Sample mode: add key'}
        </span>
      </div>
    </header>
  );
}