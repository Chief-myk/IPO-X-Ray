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
    <section className="relative overflow-hidden border-t border-line" id="how" aria-labelledby="howTitle">
      {/* ambient glows */}
      <div className="pointer-events-none absolute top-1/3 -right-32 w-[30rem] h-[30rem] rounded-full bg-beam/[0.07] blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 w-[26rem] h-[26rem] rounded-full bg-beam/[0.06] blur-3xl" aria-hidden="true" />

      <div className="relative grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-8 lg:gap-20 items-center max-w-[1440px] mx-auto px-4 md:px-12 py-16 lg:py-28 min-h-[85vh]">
        {/* Left Side: Numbered Steps */}
        <div>
          {/* accent bar above the heading */}
          <div className="w-14 h-1 rounded-full bg-gradient-to-r from-beam to-transparent mb-5" aria-hidden="true" />
          <h2 id="howTitle" className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight font-['Bricolage_Grotesque'] bg-gradient-to-b from-bone to-bone-dim bg-clip-text text-transparent">
            One agent per claim.<br />All of them at once.
          </h2>

          <ol className="mt-10 space-y-2.5">
            {STEPS.map((s, idx) => {
              const isActive = activeStep === idx;
              return (
                <li
                  key={s.title}
                  onClick={() => setActiveStep(idx)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setActiveStep(idx);
                    }
                  }}
                  tabIndex={0}
                  aria-current={isActive ? 'step' : undefined}
                  className={`group relative grid grid-cols-[44px_1fr] gap-x-3 gap-y-0.5 px-4 pt-3.5 pb-4 rounded-2xl border cursor-pointer transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-beam/60 ${
                    isActive
                      ? 'text-bone bg-film-2/70 border-beam/40 shadow-[0_0_34px_-12px_rgba(127,216,232,0.45)]'
                      : 'text-[#5F778C] border-transparent hover:bg-film-2/40 hover:border-line hover:text-bone-dim hover:translate-x-1 motion-reduce:hover:translate-x-0'
                  }`}
                >
                  {/* active rail */}
                  <span
                    className={`absolute left-0 top-3 bottom-3 w-1 rounded-full bg-gradient-to-b from-beam to-[#A8E8F2] origin-center transition-transform duration-300 ${
                      isActive ? 'scale-y-100' : 'scale-y-0'
                    }`}
                    aria-hidden="true"
                  />
                  {/* number in a ring */}
                  <span
                    className={`row-span-2 grid place-items-center w-10 h-10 rounded-full border text-lg font-bold font-['Bricolage_Grotesque'] transition-all duration-300 ${
                      isActive
                        ? 'text-[#0A2230] bg-gradient-to-br from-beam to-[#A8E8F2] border-transparent shadow-[0_0_20px_rgba(127,216,232,0.5)]'
                        : 'text-inherit border-line group-hover:border-beam/50'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <b className="text-lg font-semibold self-end">{s.title}</b>
                  <span className="text-sm sm:text-base max-w-[50ch] text-bone-dim">{s.desc}</span>
                </li>
              );
            })}
          </ol>

          {/* Progress Indicator */}
          <div className="h-1 bg-line mt-7 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-beam to-[#A8E8F2] shadow-[0_0_12px_rgba(127,216,232,0.7)] transition-all duration-500 ease-out"
              style={{ width: `${((activeStep + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Right Side: Interactive Stage Panels */}
        <div className="relative aspect-[4/3] bg-gradient-to-br from-film-2 to-[#0F1E2B] border border-line rounded-3xl overflow-hidden p-6 sm:p-10 flex flex-col justify-center shadow-[0_30px_80px_-30px_rgba(0,0,0,0.7),0_0_0_1px_rgba(127,216,232,0.06)]">
          {/* faint grid + corner glow + top strip */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(#E6EDF2_1px,transparent_1px),linear-gradient(90deg,#E6EDF2_1px,transparent_1px)] [background-size:32px_32px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_80%)]" aria-hidden="true" />
          <div className="pointer-events-none absolute -top-20 -right-20 w-64 h-64 rounded-full bg-beam/15 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-beam to-transparent" aria-hidden="true" />

          {/* Panel 0: Read */}
          {activeStep === 0 && (
            <div className="relative space-y-6 animate-fadeIn">
              <div className="relative overflow-hidden bg-paper rounded-lg p-4 grid gap-2.5 w-[75%] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.6),0_0_30px_-8px_rgba(127,216,232,0.3)] -rotate-1">
                <i className="block h-2 rounded bg-[#C9CEC4]" />
                <i className="block h-2 rounded bg-beam shadow-[0_0_10px_rgba(127,216,232,0.7)]" />
                <i className="block h-2 rounded bg-[#C9CEC4]" />
                <i className="block h-2 rounded bg-[#C9CEC4]" />
                <i className="block h-2 rounded bg-beam w-[60%] shadow-[0_0_10px_rgba(127,216,232,0.7)]" />
                <i className="block h-2 rounded bg-[#C9CEC4]" />
                <i className="block h-2 rounded bg-beam shadow-[0_0_10px_rgba(127,216,232,0.7)]" />
                {/* soft scan sweep */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-transparent via-beam/30 to-transparent animate-pulse" aria-hidden="true" />
              </div>
              <ul className="flex flex-wrap gap-2 text-xs sm:text-sm">
                {[
                  ['Vendor', 'Vyom Signal'],
                  ['Client', 'Northern Metro'],
                  ['Director', 'R. Vardhan'],
                  ['Office', 'Plot 14'],
                ].map(([label, value]) => (
                  <li
                    key={label}
                    className="bg-film-3 border border-line/60 rounded-lg px-3 py-2 transition-all duration-300 hover:-translate-y-0.5 hover:border-beam/50 hover:shadow-[0_0_20px_-6px_rgba(127,216,232,0.5)]"
                  >
                    <small className="block text-[11px] text-beam">{label}</small>
                    {value}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Panel 1: Dispatch */}
          {activeStep === 1 && (
            <div className="relative space-y-6 animate-fadeIn">
              <svg className="w-full max-h-[50%] drop-shadow-[0_0_8px_rgba(127,216,232,0.35)]" viewBox="0 0 400 300" aria-hidden="true">
                <defs>
                  <linearGradient id="dispatchLine" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#7FD8E8" stopOpacity="1" />
                    <stop offset="100%" stopColor="#7FD8E8" stopOpacity="0.35" />
                  </linearGradient>
                </defs>
                <g fill="none" stroke="url(#dispatchLine)" strokeWidth="1.5" strokeDasharray="4 6">
                  {[
                    'M60 150 C 180 150, 200 40, 340 40',
                    'M60 150 C 180 150, 200 110, 340 110',
                    'M60 150 C 180 150, 200 190, 340 190',
                    'M60 150 C 180 150, 200 260, 340 260',
                  ].map((d) => (
                    <path key={d} d={d}>
                      {/* dashes travel toward the agents */}
                      <animate attributeName="stroke-dashoffset" from="20" to="0" dur="1.2s" repeatCount="indefinite" />
                    </path>
                  ))}
                </g>
                {/* agent endpoints */}
                {[40, 110, 190, 260].map((y) => (
                  <circle key={y} cx="340" cy={y} r="5" fill="#0F1E2B" stroke="#7FD8E8" strokeWidth="1.5" />
                ))}
                {/* source node with halo */}
                <circle cx="60" cy="150" r="18" fill="#7FD8E8" opacity="0.15" />
                <circle cx="60" cy="150" r="10" fill="#7FD8E8" />
              </svg>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm font-['Source_Serif_4'] italic">
                {[
                  'Is this vendor real?',
                  'Does the client name them?',
                  'What else has this director run?',
                  'What is at this address?',
                ].map((q) => (
                  <li
                    key={q}
                    className="bg-film-3 p-2.5 rounded-lg border border-line/40 border-l-2 border-l-beam/70 transition-all duration-300 hover:bg-film-3/80 hover:border-beam/50 hover:translate-x-0.5"
                  >
                    {q}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Panel 2: Verify */}
          {activeStep === 2 && (
            <div className="relative space-y-2.5 animate-fadeIn">
              {[
                ['Vendor reality check', ['opening vyomsignal.example', 'one page, no address']],
                ['Director network', ['listing past directorships', '3 of 6 struck off']],
                ['Address check', ['reading street listings']],
              ].map(([title, lines]) => (
                <div
                  key={title}
                  className="bg-film/90 backdrop-blur-sm border border-line rounded-xl p-3 grid gap-1 text-xs sm:text-sm transition-all duration-300 hover:border-beam/50 hover:shadow-[0_0_24px_-8px_rgba(127,216,232,0.45)]"
                >
                  <b className="font-semibold text-bone flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-beam shadow-[0_0_8px_rgba(127,216,232,0.8)] animate-pulse" aria-hidden="true" />
                    {title}
                  </b>
                  {lines.map((line) => (
                    <code key={line} className="text-bone-dim text-xs font-mono">
                      <span className="text-beam">› </span>
                      {line}
                    </code>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Panel 3: Report */}
          {activeStep === 3 && (
            <div className="relative overflow-hidden bg-film border-l-4 border-critical rounded-r-xl p-6 sm:p-8 animate-fadeIn shadow-[0_0_50px_-15px_rgba(255,90,78,0.45)]">
              <div className="pointer-events-none absolute -top-12 -right-12 w-40 h-40 rounded-full bg-critical/15 blur-3xl" aria-hidden="true" />
              <span className="relative inline-flex items-center gap-1.5 text-xs font-semibold text-critical px-2.5 py-1 rounded-full bg-critical/10 border border-critical/30">
                <span className="relative flex w-2 h-2">
                  <span className="absolute inline-flex w-full h-full rounded-full bg-critical opacity-60 animate-ping" />
                  <span className="relative inline-flex w-2 h-2 rounded-full bg-critical" />
                </span>
                Critical, +21.5 points
              </span>
              <p className="relative text-xl sm:text-2xl font-bold my-3 leading-snug font-['Bricolage_Grotesque'] text-bone">
                Vendor’s website is 74 days old
              </p>
              <small className="relative text-bone-dim text-xs sm:text-sm block">
                Biggest single driver of the model’s 99/100 risk score for the sample case. Source: WHOIS record.
              </small>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}