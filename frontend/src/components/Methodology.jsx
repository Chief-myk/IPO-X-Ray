import React, { useState } from 'react';

const STEPS = [
  {
    title: 'Read',
    desc: 'The DRHP is parsed and every claim a stranger could check is pulled out, with its page number.',
  },
  {
    title: 'Dispatch',
    desc: 'Each claim becomes a goal — “is this vendor a real business?” — handed to its own TinyFish web agent. No scripts, no fixed sites.',
  },
  {
    title: 'Verify',
    desc: 'Agents search, open registries, maps, tender portals and news, and decide for themselves where to look next.',
  },
  {
    title: 'Report',
    desc: 'A gradient-boosted model turns the evidence into a fraud probability and shows how many points each finding added.',
  },
];

export default function Methodology() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section className="border-t border-line" id="how" aria-labelledby="howTitle">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-8 lg:gap-20 items-center max-w-[1440px] mx-auto px-4 md:px-12 py-16 lg:py-28 min-h-[85vh]">
        {/* Left Side: Numbered Steps */}
        <div>
          <h2 id="howTitle" className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight font-['Bricolage_Grotesque']">
            One agent per claim.<br />All of them at once.
          </h2>

          <ol className="mt-10 space-y-2">
            {STEPS.map((s, idx) => {
              const isActive = activeStep === idx;
              return (
                <li
                  key={s.title}
                  onClick={() => setActiveStep(idx)}
                  className={`grid grid-cols-[40px_1fr] gap-3 pt-3.5 pb-4 border-t border-line cursor-pointer transition-colors ${
                    isActive ? 'text-bone' : 'text-[#5F778C] hover:text-bone-dim'
                  }`}
                >
                  <span
                    className={`row-span-2 text-2xl font-bold font-['Bricolage_Grotesque'] ${
                      isActive ? 'text-beam' : 'text-inherit'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <b className="text-lg font-semibold">{s.title}</b>
                  <span className="text-sm sm:text-base max-w-[50ch] text-bone-dim">{s.desc}</span>
                </li>
              );
            })}
          </ol>

          {/* Progress Indicator */}
          <div className="h-0.5 bg-line mt-6 rounded overflow-hidden">
            <div
              className="h-full bg-beam transition-all duration-300"
              style={{ width: `${((activeStep + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Right Side: Interactive Stage Panels */}
        <div className="relative aspect-[4/3] bg-film-2 border border-line rounded-3xl overflow-hidden p-6 sm:p-10 flex flex-col justify-center">
          {/* Panel 0: Read */}
          {activeStep === 0 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-paper rounded p-4 grid gap-2.5 w-[75%] shadow-md">
                <i className="block h-2 rounded bg-[#C9CEC4]" />
                <i className="block h-2 rounded bg-beam" />
                <i className="block h-2 rounded bg-[#C9CEC4]" />
                <i className="block h-2 rounded bg-[#C9CEC4]" />
                <i className="block h-2 rounded bg-beam w-[60%]" />
                <i className="block h-2 rounded bg-[#C9CEC4]" />
                <i className="block h-2 rounded bg-beam" />
              </div>
              <ul className="flex flex-wrap gap-2 text-xs sm:text-sm">
                <li className="bg-film-3 rounded-lg px-3 py-2">
                  <small className="block text-[11px] text-beam">Vendor</small>
                  Vyom Signal
                </li>
                <li className="bg-film-3 rounded-lg px-3 py-2">
                  <small className="block text-[11px] text-beam">Client</small>
                  Northern Metro
                </li>
                <li className="bg-film-3 rounded-lg px-3 py-2">
                  <small className="block text-[11px] text-beam">Director</small>
                  R. Vardhan
                </li>
                <li className="bg-film-3 rounded-lg px-3 py-2">
                  <small className="block text-[11px] text-beam">Office</small>
                  Plot 14
                </li>
              </ul>
            </div>
          )}

          {/* Panel 1: Dispatch */}
          {activeStep === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <svg className="w-full max-h-[50%]" viewBox="0 0 400 300" aria-hidden="true">
                <g>
                  <path d="M60 150 C 180 150, 200 40, 340 40" fill="none" stroke="#7FD8E8" strokeWidth="1.5" strokeDasharray="4 6" />
                  <path d="M60 150 C 180 150, 200 110, 340 110" fill="none" stroke="#7FD8E8" strokeWidth="1.5" strokeDasharray="4 6" />
                  <path d="M60 150 C 180 150, 200 190, 340 190" fill="none" stroke="#7FD8E8" strokeWidth="1.5" strokeDasharray="4 6" />
                  <path d="M60 150 C 180 150, 200 260, 340 260" fill="none" stroke="#7FD8E8" strokeWidth="1.5" strokeDasharray="4 6" />
                </g>
                <circle cx="60" cy="150" r="10" fill="#7FD8E8" />
              </svg>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm font-['Source_Serif_4'] italic">
                <li className="bg-film-3 p-2.5 rounded-lg border border-line/40">Is this vendor real?</li>
                <li className="bg-film-3 p-2.5 rounded-lg border border-line/40">Does the client name them?</li>
                <li className="bg-film-3 p-2.5 rounded-lg border border-line/40">What else has this director run?</li>
                <li className="bg-film-3 p-2.5 rounded-lg border border-line/40">What is at this address?</li>
              </ul>
            </div>
          )}

          {/* Panel 2: Verify */}
          {activeStep === 2 && (
            <div className="space-y-2.5 animate-fadeIn">
              <div className="bg-film border border-line rounded-xl p-3 grid gap-1 text-xs sm:text-sm">
                <b className="font-semibold text-bone">Vendor reality check</b>
                <code className="text-bone-dim text-xs font-mono">
                  <span className="text-beam">› </span>opening vyomsignal.example
                </code>
                <code className="text-bone-dim text-xs font-mono">
                  <span className="text-beam">› </span>one page, no address
                </code>
              </div>
              <div className="bg-film border border-line rounded-xl p-3 grid gap-1 text-xs sm:text-sm">
                <b className="font-semibold text-bone">Director network</b>
                <code className="text-bone-dim text-xs font-mono">
                  <span className="text-beam">› </span>listing past directorships
                </code>
                <code className="text-bone-dim text-xs font-mono">
                  <span className="text-beam">› </span>3 of 6 struck off
                </code>
              </div>
              <div className="bg-film border border-line rounded-xl p-3 grid gap-1 text-xs sm:text-sm">
                <b className="font-semibold text-bone">Address check</b>
                <code className="text-bone-dim text-xs font-mono">
                  <span className="text-beam">› </span>reading street listings
                </code>
              </div>
            </div>
          )}

          {/* Panel 3: Report */}
          {activeStep === 3 && (
            <div className="bg-film border-l-4 border-critical rounded-r-xl p-6 sm:p-8 animate-fadeIn">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-critical">
                <span className="w-2 h-2 rounded-full bg-critical" />
                Critical, +21.5 points
              </span>
              <p className="text-xl sm:text-2xl font-bold my-2.5 leading-snug font-['Bricolage_Grotesque'] text-bone">
                Vendor’s website is 74 days old
              </p>
              <small className="text-bone-dim text-xs sm:text-sm block">
                Biggest single driver of the model’s 99/100 risk score for the sample case. Source: WHOIS record.
              </small>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
