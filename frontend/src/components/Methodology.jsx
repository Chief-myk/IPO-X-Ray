import React, { useState } from 'react';
import { 
  FileSearch, 
  Share2, 
  Globe, 
  Gauge, 
  Cpu
} from 'lucide-react';

const STEPS = [
  {
    title: 'Read',
    subtitle: 'Automated Prospectus Parsing',
    desc: 'The DRHP is parsed and every claim a stranger could check is pulled out, with its page number.',
    icon: FileSearch,
    tag: 'OCR & Entity Extraction',
  },
  {
    title: 'Dispatch',
    subtitle: 'Parallel Agent Allocation',
    desc: 'Each claim becomes a goal — “is this vendor a real business?” — handed to its own TinyFish web agent. No scripts, no fixed sites.',
    icon: Share2,
    tag: 'Autonomous Dispatch',
  },
  {
    title: 'Verify',
    subtitle: 'Cross-Registry Verification',
    desc: 'Agents search, open registries, maps, tender portals and news, and decide for themselves where to look next.',
    icon: Globe,
    tag: 'Multi-Source Traversal',
  },
  {
    title: 'Report',
    subtitle: 'Gradient-Boosted Risk Scoring',
    desc: 'A gradient-boosted model turns the evidence into a fraud probability and shows how many points each finding added.',
    icon: Gauge,
    tag: 'Statistical ML Model',
  },
];

export default function Methodology() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section className="relative overflow-hidden border-t border-line py-20 lg:py-28" id="how" aria-labelledby="howTitle">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute top-1/4 -right-32 w-[34rem] h-[34rem] rounded-full bg-beam/[0.08] blur-[140px]" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 w-[30rem] h-[30rem] rounded-full bg-[#183552]/[0.25] blur-[140px]" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 bg-grid-fintech opacity-20" aria-hidden="true" />

      <div className="relative grid grid-cols-1 lg:grid-cols-[1fr_1.15fr] gap-12 lg:gap-20 items-center max-w-[1560px] mx-auto px-4 sm:px-8 lg:px-12">
        {/* Left Side: Interactive Step Pipeline */}
        <div>
          {/* Accent Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-beam/30 bg-[#0E1F2E]/80 backdrop-blur-md text-xs font-mono text-beam mb-4">
            <Cpu className="w-3.5 h-3.5" />
            <span>HOW THE INVESTIGATION WORKS</span>
          </div>

          <h2 id="howTitle" className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight font-['Bricolage_Grotesque'] bg-gradient-to-b from-bone via-bone to-bone-dim bg-clip-text text-transparent">
            One agent per claim.<br />
            <span className="bg-gradient-to-r from-beam via-[#B8F0F9] to-beam bg-clip-text text-transparent">
              All of them at once.
            </span>
          </h2>

          <p className="mt-4 text-base sm:text-lg text-bone-dim max-w-[54ch] leading-relaxed">
            Traditional due diligence takes days of tedious manual browsing. IPO X-Ray deploys isolated autonomous web agents simultaneously to inspect independent public records in parallel.
          </p>

          {/* Stepper items */}
          <ol className="mt-8 space-y-3 list-none p-0">
            {STEPS.map((s, idx) => {
              const isActive = activeStep === idx;
              const Icon = s.icon;
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
                  className={`group relative flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-beam/60 ${
                    isActive
                      ? 'bg-[#122436]/90 border-beam/50 shadow-[0_12px_36px_-12px_rgba(127,216,232,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] translate-x-1'
                      : 'bg-[#0E1B28]/50 border-line/60 hover:bg-[#132537]/60 hover:border-beam/30 text-bone-dim hover:text-bone'
                  }`}
                >
                  {/* Left Active Glow Rail */}
                  <span
                    className={`absolute left-0 top-3.5 bottom-3.5 w-1 rounded-full bg-gradient-to-b from-beam to-[#A8E8F2] shadow-[0_0_12px_rgba(127,216,232,0.8)] transition-all duration-300 ${
                      isActive ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-50'
                    }`}
                    aria-hidden="true"
                  />

                  {/* Step Icon Badge */}
                  <div
                    className={`grid place-items-center w-11 h-11 flex-none rounded-xl border transition-all duration-300 ${
                      isActive
                        ? 'text-[#091724] bg-gradient-to-br from-beam to-[#A3EAF7] border-transparent shadow-[0_0_20px_rgba(127,216,232,0.5)]'
                        : 'text-bone-dim border-line/80 bg-[#162B3E] group-hover:border-beam/40 group-hover:text-beam'
                    }`}
                  >
                    <Icon className="w-5 h-5 stroke-[2.2]" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <b className={`text-base sm:text-lg font-bold font-['Bricolage_Grotesque'] ${isActive ? 'text-bone' : 'text-bone-dim group-hover:text-bone'}`}>
                        {idx + 1}. {s.title}
                      </b>
                      <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-film/70 border border-line/60 text-beam">
                        {s.tag}
                      </span>
                    </div>
                    <p className={`text-xs sm:text-sm leading-relaxed ${isActive ? 'text-bone-dim' : 'text-[#62778B]'}`}>
                      {s.desc}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>

          {/* Connected Step Progress Line */}
          <div className="h-1.5 bg-[#172E42] mt-6 rounded-full overflow-hidden p-0.5 border border-[#27435E]/60">
            <div
              className="h-full rounded-full bg-gradient-to-r from-beam via-[#A8E8F2] to-beam shadow-[0_0_14px_rgba(127,216,232,0.8)] transition-all duration-500 ease-out"
              style={{ width: `${((activeStep + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Right Side: High-Precision Interactive Simulator */}
        <div className="relative aspect-[4/3] bg-gradient-to-br from-[#122436] via-[#0E1C2B] to-[#0A1622] border border-[#27435E] rounded-3xl overflow-hidden p-6 sm:p-10 flex flex-col justify-center shadow-[0_30px_90px_-25px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.08)]">
          {/* Subtle grid texture & top glow */}
          <div className="pointer-events-none absolute inset-0 bg-grid-fintech opacity-20" aria-hidden="true" />
          <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-beam/15 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-beam to-transparent" aria-hidden="true" />

          {/* Stage Badge on Top Right */}
          <div className="absolute top-4 right-5 flex items-center gap-2 text-xs font-mono text-bone-dim bg-[#091522]/80 backdrop-blur-md px-3 py-1 rounded-full border border-line/60">
            <span className="w-1.5 h-1.5 rounded-full bg-beam animate-pulse" />
            <span>STAGE 0{activeStep + 1} / 04</span>
          </div>

          {/* Panel 0: Read */}
          {activeStep === 0 && (
            <div className="relative space-y-6">
              <div className="relative overflow-hidden bg-paper text-ink rounded-xl p-5 grid gap-2.5 w-[85%] sm:w-[78%] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.7),0_0_35px_-8px_rgba(127,216,232,0.35)] -rotate-1 border border-[#D5DAD0]">
                {/* Simulated OCR Scanner line */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-transparent via-beam/40 to-transparent animate-pulse" aria-hidden="true" />
                
                <div className="flex justify-between items-center text-[10px] font-mono text-ink-dim border-b border-[#CBD0C6] pb-1.5 mb-1">
                  <span>OCR PARSER · DOCKET 142</span>
                  <span className="text-[#207E92] font-semibold">99.4% CONFIDENCE</span>
                </div>
                <div className="h-2 rounded bg-[#C9CEC4]" />
                <div className="h-2.5 rounded bg-beam shadow-[0_0_12px_rgba(127,216,232,0.8)]" />
                <div className="h-2 rounded bg-[#C9CEC4]" />
                <div className="h-2 rounded bg-[#C9CEC4]" />
                <div className="h-2.5 rounded bg-beam w-[65%] shadow-[0_0_12px_rgba(127,216,232,0.8)]" />
                <div className="h-2 rounded bg-[#C9CEC4]" />
                <div className="h-2.5 rounded bg-beam shadow-[0_0_12px_rgba(127,216,232,0.8)]" />
              </div>

              {/* Extracted tokens */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono text-bone-dim block">Extracted verified entities:</span>
                <ul className="flex flex-wrap gap-2 text-xs sm:text-sm list-none p-0 m-0">
                  {[
                    ['Vendor', 'Vyom Signal Technologies', 'p. 142'],
                    ['Client', 'Northern Metro Transit', 'p. 142'],
                    ['Director', 'Rakesh Vardhan', 'p. 188'],
                    ['Office', 'Sector 9, Delhi', 'p. 45'],
                  ].map(([label, value, page]) => (
                    <li
                      key={label}
                      className="bg-[#152B3E]/90 border border-line/70 rounded-xl px-3 py-2 transition-all duration-300 hover:-translate-y-0.5 hover:border-beam/50 hover:shadow-[0_0_24px_-6px_rgba(127,216,232,0.5)]"
                    >
                      <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-beam">
                        <span>{label}</span>
                        <span className="text-bone-dim">{page}</span>
                      </div>
                      <span className="font-medium text-bone text-xs">{value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Panel 1: Dispatch */}
          {activeStep === 1 && (
            <div className="relative space-y-5">
              <svg className="w-full max-h-[170px] drop-shadow-[0_0_12px_rgba(127,216,232,0.4)]" viewBox="0 0 400 240" aria-hidden="true">
                <defs>
                  <linearGradient id="dispatchPulse" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#7FD8E8" stopOpacity="1" />
                    <stop offset="100%" stopColor="#7FD8E8" stopOpacity="0.3" />
                  </linearGradient>
                </defs>
                <g fill="none" stroke="url(#dispatchPulse)" strokeWidth="1.8" strokeDasharray="5 7">
                  {[
                    'M60 120 C 180 120, 200 30, 340 30',
                    'M60 120 C 180 120, 200 90, 340 90',
                    'M60 120 C 180 120, 200 150, 340 150',
                    'M60 120 C 180 120, 200 210, 340 210',
                  ].map((d, i) => (
                    <path key={d} d={d}>
                      <animate attributeName="stroke-dashoffset" from="24" to="0" dur={`${1 + i * 0.2}s`} repeatCount="indefinite" />
                    </path>
                  ))}
                </g>
                {/* Agent worker endpoints */}
                {[30, 90, 150, 210].map((y) => (
                  <g key={y}>
                    <circle cx="340" cy={y} r="8" fill="#091522" stroke="#7FD8E8" strokeWidth="2" />
                    <circle cx="340" cy={y} r="3" fill="#7FD8E8" className="animate-ping" />
                  </g>
                ))}
                {/* Central Dispatcher Node */}
                <circle cx="60" cy="120" r="22" fill="#7FD8E8" opacity="0.15" />
                <circle cx="60" cy="120" r="12" fill="#7FD8E8" />
                <circle cx="60" cy="120" r="5" fill="#091522" />
              </svg>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                {[
                  { target: 'Agent 01: Vendor Legitimacy', q: 'Does this vendor exist outside the DRHP?' },
                  { target: 'Agent 02: Client Corroboration', q: 'Does Northern Metro acknowledge issuer?' },
                  { target: 'Agent 03: Promoter Network', q: 'What else has this director operated?' },
                  { target: 'Agent 04: Geo-Intelligence', q: 'What physical premise exists at Plot 14?' },
                ].map((item) => (
                  <div
                    key={item.target}
                    className="bg-[#152B3E]/80 p-2.5 rounded-xl border border-line/60 border-l-2 border-l-beam transition-all duration-300 hover:border-beam/60 hover:translate-x-0.5"
                  >
                    <span className="text-[10px] text-beam block font-semibold">{item.target}</span>
                    <span className="text-bone-dim text-[11px] font-sans italic">{item.q}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Panel 2: Verify */}
          {activeStep === 2 && (
            <div className="relative space-y-2.5">
              {[
                {
                  title: 'Autonomous Browser: MCA-21 Portal',
                  status: '200 OK',
                  lines: ['Querying DIN 0892415 across registry', 'Director co-listed on vendor entity (CRITICAL)'],
                  color: '#FF5A4E'
                },
                {
                  title: 'Autonomous Browser: WHOIS & DNS',
                  status: 'ANALYZED',
                  lines: ['vyomsignal.example registered: 74 days ago', 'Single static index page, no GST invoice portal'],
                  color: '#FF8A3D'
                },
                {
                  title: 'Autonomous Browser: Tender Authority',
                  status: 'VERIFIED',
                  lines: ['Yamuna Urban Roads Authority tender portal checked', 'Contract order #YURA-4409 found and verified'],
                  color: '#8FE0AE'
                },
              ].map((log) => (
                <div
                  key={log.title}
                  className="bg-[#0A1624]/90 backdrop-blur-md border border-line/70 rounded-xl p-3 grid gap-1 text-xs transition-all duration-300 hover:border-beam/50 hover:shadow-[0_0_24px_-8px_rgba(127,216,232,0.35)]"
                >
                  <div className="flex items-center justify-between">
                    <b className="font-semibold text-bone flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: log.color, boxShadow: `0 0 8px ${log.color}` }} />
                      {log.title}
                    </b>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-film-3 border border-line text-bone-dim">
                      {log.status}
                    </span>
                  </div>
                  {log.lines.map((line) => (
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
            <div className="relative overflow-hidden bg-gradient-to-br from-[#1B1720] to-[#0F1E2B] border-l-4 border-critical rounded-2xl p-6 sm:p-7 shadow-[0_0_60px_-15px_rgba(255,90,78,0.45)] border border-line/60">
              <div className="pointer-events-none absolute -top-12 -right-12 w-44 h-44 rounded-full bg-critical/20 blur-3xl" aria-hidden="true" />
              
              <div className="flex items-center justify-between mb-3">
                <span className="relative inline-flex items-center gap-1.5 text-xs font-bold font-mono text-critical px-2.5 py-1 rounded-full bg-critical/15 border border-critical/40">
                  <span className="relative flex w-2 h-2">
                    <span className="absolute inline-flex w-full h-full rounded-full bg-critical opacity-75 animate-ping" />
                    <span className="relative inline-flex w-2 h-2 rounded-full bg-critical" />
                  </span>
                  CRITICAL RISK (+21.5 POINTS)
                </span>
                <span className="text-xs font-mono text-bone-dim">FEATURE IMPACT #1</span>
              </div>

              <h4 className="relative text-xl sm:text-2xl font-bold font-['Bricolage_Grotesque'] text-bone leading-tight">
                Vendor’s website registered 74 days ago
              </h4>

              <p className="relative text-bone-dim text-xs sm:text-sm mt-2 leading-relaxed">
                Strongest single indicator in the gradient-boosted risk model. Cross-referenced with MCA filing showing vendor formed 6 weeks prior to DRHP submission.
              </p>

              <div className="relative mt-4 pt-3 border-t border-[#27435E]/60 flex items-center justify-between text-xs font-mono text-bone-dim">
                <span>Model Confidence: 99.2%</span>
                <span className="text-beam">Source: WHOIS + MCA-21</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}