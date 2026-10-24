import React from 'react';

export default function Footer() {
  return (
    <footer className="relative mt-8 border-t border-line bg-gradient-to-b from-transparent to-[#0F1E2B]/60">
      {/* glowing hairline on the top edge */}
      <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-beam/60 to-transparent" aria-hidden="true" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 md:px-12 py-8 text-xs text-[#6E8497] max-w-[1560px] mx-auto">
        <p className="max-w-[70ch] leading-relaxed">
          IPO X-Ray screens public information automatically. It is not investment advice and a flag is not proof of wrongdoing.
        </p>
        <p className="sm:text-right whitespace-nowrap inline-flex items-center sm:justify-end gap-2 px-3 py-1.5 rounded-full border border-line bg-film-2/40 backdrop-blur-sm transition-colors duration-300 hover:border-beam/40 hover:text-bone-dim self-start sm:self-auto">
          {/* small glowing dot */}
          <span className="w-1.5 h-1.5 rounded-full bg-beam shadow-[0_0_8px_rgba(127,216,232,0.7)]" aria-hidden="true" />
          Built for HackIIITD 2026 on TinyFish web agents.
        </p>
      </div>
    </footer>
  );
}