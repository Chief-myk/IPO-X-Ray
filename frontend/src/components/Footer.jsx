import React from 'react';
import { ArrowUp } from 'lucide-react';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative mt-16 border-t border-[#27435E]/80 bg-gradient-to-b from-[#09131C] to-[#060D14] text-xs text-[#7A90A4]">
      {/* Laser hairline on the top edge */}
      <div 
        className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-beam/70 to-transparent" 
        aria-hidden="true" 
      />

      <div className="max-w-[1560px] mx-auto px-4 sm:px-8 lg:px-12 py-12">
        <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-8 pb-10 border-b border-[#27435E]/50">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="grid place-items-center w-7 h-7 rounded-lg bg-[#142A3E] border border-line text-beam">
                <svg viewBox="0 0 32 32" className="w-4 h-4" aria-hidden="true">
                  <path d="M7 9h18M7 16h12M7 23h15" stroke="#E6EDF2" strokeWidth="2.4" strokeLinecap="round" fill="none" />
                  <rect x="4" y="14.5" width="24" height="3" fill="#7FD8E8" opacity="0.9" rx="1.5" />
                </svg>
              </div>
              <span className="font-['Bricolage_Grotesque'] font-bold text-bone text-base">
                IPO X-Ray
              </span>
              <span className="font-mono text-[10px] text-beam px-1.5 py-0.5 rounded bg-beam/10 border border-beam/20">
                FORENSICS
              </span>
            </div>
            
            <p className="max-w-[65ch] text-bone-dim leading-relaxed text-xs sm:text-sm">
              IPO X-Ray screens public information automatically using parallel autonomous web agents and gradient-boosted risk modeling. It is designed to expose undisclosed promoter linkages, synthetic vendors, and valuation disconnects before retail capital is committed.
            </p>
          </div>

          <div className="flex flex-col md:items-end justify-between gap-4">
            {/* Tech stack badge pill */}
            <div className="flex flex-wrap items-center md:justify-end gap-2 font-mono text-[11px]">
              <span className="px-2.5 py-1 rounded-md bg-[#0F2132] border border-line text-bone-dim">TinyFish Web Agents</span>
              <span className="px-2.5 py-1 rounded-md bg-[#0F2132] border border-line text-bone-dim">LightGBM ML</span>
              <span className="px-2.5 py-1 rounded-md bg-[#0F2132] border border-line text-bone-dim">FastAPI SSE</span>
            </div>

            <button
              onClick={scrollToTop}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-line/70 bg-[#122334]/60 hover:bg-[#183149] hover:border-beam/50 text-bone-dim hover:text-bone text-xs font-mono transition-all duration-200 self-start md:self-auto cursor-pointer"
            >
              <ArrowUp className="w-3.5 h-3.5 text-beam" />
              <span>Back to top</span>
            </button>
          </div>
        </div>

        {/* Bottom Disclaimer + Credit Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 text-[11px] font-mono text-[#62778A]">
          <p className="max-w-[70ch] leading-relaxed">
            Legal Disclaimer: Automated screening of public records only. Not investment advice and a flag is not conclusive legal proof of wrongdoing. Always verify every flag before acting.
          </p>
          <div className="whitespace-nowrap inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-line/60 bg-[#0E1F2E]/60 backdrop-blur-sm self-start sm:self-auto text-bone-dim">
            <span className="w-1.5 h-1.5 rounded-full bg-beam shadow-[0_0_8px_rgba(127,216,232,0.8)] animate-pulse" aria-hidden="true" />
            <span>Built for HackIIITD 2026 on TinyFish web agents</span>
          </div>
        </div>
      </div>
    </footer>
  );
}