import React from 'react';
import { ArrowUp } from 'lucide-react';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative mt-20 border-t border-[#1C1C1C] bg-black text-xs text-[#888888]">
      {/* Metallic Gold Hairline on top edge */}
      <div 
        className="pointer-events-none absolute inset-x-0 -top-px h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent" 
        aria-hidden="true" 
      />

      <div className="max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-8 pb-10 border-b border-[#1A1A1A]">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="grid place-items-center w-8 h-8 rounded-xl bg-[#0D0D0D] border border-[#D4AF37]/40 text-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                <svg viewBox="0 0 32 32" className="w-4 h-4" aria-hidden="true">
                  <path d="M7 9h18M7 16h12M7 23h15" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" fill="none" />
                  <rect x="4" y="14.5" width="24" height="3" fill="#D4AF37" rx="1.5" />
                </svg>
              </div>
              <span className="font-['Cinzel'] tracking-wider font-extrabold text-white text-base">
                IPO X-RAY 360
              </span>
              <span className="font-mono text-[10px] text-[#F5E59F] px-2 py-0.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/35 font-semibold">
                FORENSICS & SURVEILLANCE
              </span>
            </div>
            
            <p className="max-w-[65ch] text-[#888888] leading-relaxed text-xs sm:text-sm font-sans">
              IPO X-Ray 360 performs automated multi-source forensic scrutiny across DRHP disclosures, ROC MCA records, EPFO employee rosters, and promoter networks using autonomous web agents and gradient-boosted risk models before retail and institutional capital is deployed.
            </p>
          </div>

          <div className="flex flex-col md:items-end justify-between gap-4">
            <div className="flex flex-wrap items-center md:justify-end gap-2 font-mono text-[11px]">
              <span className="px-3 py-1 rounded-lg bg-[#0A0A0A] border border-[#222222] text-[#888888]">Autonomous Web Agents</span>
              <span className="px-3 py-1 rounded-lg bg-[#0A0A0A] border border-[#222222] text-[#888888]">ROC / EPFO Graph</span>
              <span className="px-3 py-1 rounded-lg bg-[#0A0A0A] border border-[#222222] text-[#D4AF37]">ASBA Bid Preparation</span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
              <a href="/" className="text-[#888888] hover:text-[#D4AF37] transition-colors no-underline">Home</a>
              <span className="text-[#333333]">·</span>
              <a href="/dashboard" className="text-[#888888] hover:text-[#D4AF37] transition-colors no-underline">IPO Dashboard</a>
              <span className="text-[#333333]">·</span>
              <a href="/applications" className="text-[#888888] hover:text-[#D4AF37] transition-colors no-underline">Applications</a>
              <span className="text-[#333333]">·</span>
              <a href="/portfolio" className="text-[#888888] hover:text-[#D4AF37] transition-colors no-underline">Portfolio</a>
              <span className="text-[#333333]">·</span>
              <a href="/autospy" className="text-[#888888] hover:text-[#D4AF37] transition-colors no-underline">AutoSpy</a>
            </div>

            <button
              onClick={scrollToTop}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#222222] bg-[#0A0A0A] hover:bg-[#141414] hover:border-[#D4AF37]/50 text-[#888888] hover:text-white text-xs font-mono transition-all duration-200 self-start md:self-auto cursor-pointer"
            >
              <ArrowUp className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Back to top</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 text-[11px] font-mono text-[#666666]">
          <p className="max-w-[70ch] leading-relaxed">
            Regulatory Notice: Autonomous screening of public offer records. Not registered SEBI investment advice. All material findings cross-referenced with official filings.
          </p>
          <div className="whitespace-nowrap inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#222222] bg-[#080808] text-[#888888]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.8)] animate-pulse" aria-hidden="true" />
            <span>Autonomous Intelligence Engine</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
