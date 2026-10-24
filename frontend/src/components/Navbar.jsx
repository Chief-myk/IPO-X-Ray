import React from 'react';

export default function Navbar({ health }) {
  const isLive = health?.live;
  const isHealthy = health !== null;

  return (
    <header className="sticky top-0 z-30 flex items-center gap-7 px-4 md:px-12 py-3.5 bg-[#0F1E2B]/80 backdrop-blur-md border-b border-[#27435E]/60">
      <a href="#top" className="flex items-center gap-2.5 text-bone font-bold text-lg tracking-tight no-underline">
        <svg viewBox="0 0 32 32" className="w-6.5 h-6.5" aria-hidden="true">
          <path d="M7 9h18M7 16h12M7 23h15" stroke="#E6EDF2" strokeWidth="2.4" strokeLinecap="round" fill="none" />
          <rect x="4" y="14.5" width="24" height="3" fill="#7FD8E8" opacity="0.85" />
        </svg>
        <span className="font-['Bricolage_Grotesque']">IPO X-Ray</span>
      </a>

      <nav className="hidden sm:flex items-center gap-6 ml-auto text-sm" aria-label="Sections">
        <a href="#how" className="text-bone-dim hover:text-bone transition-colors no-underline">How it works</a>
        <a href="#cases" className="text-bone-dim hover:text-bone transition-colors no-underline">Why it matters</a>
        <a href="#probe" className="text-bone font-medium hover:text-beam transition-colors no-underline">Investigate</a>
      </nav>

      <div className="ml-auto sm:ml-0 flex items-center gap-2 text-xs text-bone-dim px-3 py-1.5 border border-line rounded-full bg-film-2/50">
        <span
          className={`w-2 h-2 rounded-full transition-all ${
            !isHealthy
              ? 'bg-unverified'
              : isLive
              ? 'bg-clear shadow-[0_0_8px_rgba(143,224,174,0.5)]'
              : 'bg-medium'
          }`}
        />
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
