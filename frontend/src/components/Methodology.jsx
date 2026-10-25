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
    desc: 'Each claim becomes a goal — “is this vendor a real business?” — handed to its own autonomous web agent. No scripts, no fixed sites.',
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
    <section className="relative overflow-hidden border-t border-[#1A1A1A] py-20 lg:py-28" id="how" aria-labelledby="howTitle">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute top-1/4 -right-32 w-[34rem] h-[34rem] rounded-full bg-[#D4AF37]/[0.05] blur-[140px]" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 w-[30rem] h-[30rem] rounded-full bg-white/[0.02] blur-[140px]" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 bg-grid-fintech opacity-20" aria-hidden="true" />

      <div className="relative grid grid-cols-1 lg:grid-cols-[1fr_1.15fr] gap-12 lg:gap-20 items-center max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Left Side: Interactive Step Pipeline */}
        <div>
          {/* Accent Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#D4AF37]/30 bg-[#0A0A0A] backdrop-blur-md text-xs font-mono text-[#F5E59F] mb-4">
            <Cpu className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>HOW THE INVESTIGATION WORKS</span>
          </div>

          <h2 id="howTitle" className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight font-['Cinzel'] text-white">
            One agent per claim.<br />
            <span className="bg-gradient-to-r from-white via-[#F5E59F] to-[#D4AF37] bg-clip-text text-transparent">
              All of them at once.
            </span>
          </h2>

          <p className="mt-4 text-base sm:text-lg text-[#888888] max-w-[54ch] leading-relaxed font-sans">
            Traditional due diligence takes days of tedious manual browsing. IPO X-Ray 360 deploys isolated autonomous web agents simultaneously to inspect independent public records in parallel.
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
                  className={`group relative flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/60 ${
                    isActive
                      ? 'bg-[#0E0E0E] border-[#D4AF37]/50 shadow-[0_12px_36px_-12px_rgba(212,175,55,0.25)] translate-x-1'
                      : 'bg-[#060606] border-[#1C1C1C] hover:bg-[#0A0A0A] hover:border-[#2A2A2A] text-[#888888] hover:text-white'
                  }`}
                >
                  <span
                    className={`absolute left-0 top-3.5 bottom-3.5 w-1 rounded-full bg-gradient-to-b from-[#D4AF37] to-[#F5E59F] shadow-[0_0_12px_rgba(212,175,55,0.8)] transition-all duration-300 ${
                      isActive ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-50'
                    }`}
                    aria-hidden="true"
                  />

                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center flex-none border transition-all ${
                      isActive
                        ? 'bg-[#151515] border-[#D4AF37] text-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                        : 'bg-[#080808] border-[#222222] text-[#888888] group-hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                        <span>{s.title}</span>
                        <span className="text-xs font-mono font-normal text-[#888888]">• {s.subtitle}</span>
                      </h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.05] border border-white/[0.08] text-[#D4AF37] whitespace-nowrap">
                        {s.tag}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-[#888888] leading-relaxed font-sans">{s.desc}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Right Side: Interactive Live Simulation Box */}
        <div className="relative p-6 sm:p-8 rounded-3xl bg-[#080808] border border-[#1A1A1A] shadow-2xl shadow-black overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" aria-hidden="true" />

          {/* Panel 0: Read */}
          {activeStep === 0 && (
            <div className="relative space-y-4">
              <div className="flex items-center justify-between text-xs font-mono text-[#888888] border-b border-[#1A1A1A] pb-3">
                <span className="text-[#AAAAAA]">Document Parser Buffer</span>
                <span className="text-[#D4AF37]">48 claims isolated</span>
              </div>
              <div className="space-y-2 text-xs font-mono">
                {[
                  { p: 'p. 142', text: 'Vyom Signal Technologies accounted for 61.4% of procurement' },
                  { p: 'p. 158', text: 'Revenue grew from ₹11.2 Cr to ₹48.6 Cr with 11 employees' },
                  { p: 'p. 182', text: 'Corporate office located at Plot 14, Sector 9, Kalindi Estate' },
                  { p: 'p. 204', text: 'Director Mr. Rakesh Vardhan holds 42.5% pre-issue equity' }
                ].map((row, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-[#050505] border border-[#161616]">
                    <span className="px-2 py-0.5 rounded bg-white/[0.05] text-[#D4AF37] font-bold text-[10px] flex-none">
                      {row.p}
                    </span>
                    <span className="text-white font-sans text-xs">{row.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Panel 1: Dispatch */}
          {activeStep === 1 && (
            <div className="relative space-y-5">
              <svg className="w-full max-h-[170px] drop-shadow-[0_0_12px_rgba(212,175,55,0.4)]" viewBox="0 0 400 240" aria-hidden="true">
                <defs>
                  <linearGradient id="dispatchPulse" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#D4AF37" stopOpacity="1" />
                    <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.3" />
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
                {[30, 90, 150, 210].map((y) => (
                  <g key={y}>
                    <circle cx="340" cy={y} r="8" fill="#000000" stroke="#D4AF37" strokeWidth="2" />
                    <circle cx="340" cy={y} r="3" fill="#D4AF37" className="animate-ping" />
                  </g>
                ))}
                <circle cx="60" cy="120" r="22" fill="#D4AF37" opacity="0.15" />
                <circle cx="60" cy="120" r="12" fill="#D4AF37" />
                <circle cx="60" cy="120" r="5" fill="#000000" />
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
                    className="bg-[#050505] p-3 rounded-xl border border-[#161616] border-l-2 border-l-[#D4AF37] transition-all hover:border-[#D4AF37]/50"
                  >
                    <span className="text-[10px] text-[#F5E59F] block font-semibold">{item.target}</span>
                    <span className="text-[#888888] text-[11px] font-sans italic">{item.q}</span>
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
                  color: '#EF4444'
                },
                {
                  title: 'Autonomous Browser: WHOIS & DNS',
                  status: 'ANALYZED',
                  lines: ['vyomsignal.example registered: 74 days ago', 'Single static index page, no GST invoice portal'],
                  color: '#F59E0B'
                },
                {
                  title: 'Autonomous Browser: Tender Authority',
                  status: 'VERIFIED',
                  lines: ['Yamuna Urban Roads Authority tender portal checked', 'Contract order #YURA-4409 found and verified'],
                  color: '#10B981'
                },
              ].map((log) => (
                <div
                  key={log.title}
                  className="bg-[#050505] border border-[#181818] rounded-xl p-3.5 grid gap-1 text-xs transition-all hover:border-[#D4AF37]/40"
                >
                  <div className="flex items-center justify-between">
                    <b className="font-semibold text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: log.color, boxShadow: `0 0 8px ${log.color}` }} />
                      {log.title}
                    </b>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-white/[0.05] border border-white/[0.08] text-[#888888]">
                      {log.status}
                    </span>
                  </div>
                  {log.lines.map((line) => (
                    <code key={line} className="text-[#888888] text-xs font-mono">
                      <span className="text-[#D4AF37]">› </span>
                      {line}
                    </code>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Panel 3: Report */}
          {activeStep === 3 && (
            <div className="relative overflow-hidden bg-gradient-to-br from-[#120505] to-[#080808] border-l-4 border-rose-500 rounded-2xl p-6 sm:p-7 shadow-[0_0_60px_-15px_rgba(239,68,68,0.3)] border border-[#222222]">
              <div className="pointer-events-none absolute -top-12 -right-12 w-44 h-44 rounded-full bg-rose-500/15 blur-3xl" aria-hidden="true" />
              
              <div className="flex items-center justify-between mb-3">
                <span className="relative inline-flex items-center gap-1.5 text-xs font-bold font-mono text-rose-400 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/40">
                  <span className="relative flex w-2 h-2">
                    <span className="absolute inline-flex w-full h-full rounded-full bg-rose-500 opacity-75 animate-ping" />
                    <span className="relative inline-flex w-2 h-2 rounded-full bg-rose-500" />
                  </span>
                  CRITICAL RISK (+21.5 POINTS)
                </span>
                <span className="text-xs font-mono text-[#888888]">FEATURE IMPACT #1</span>
              </div>

              <h4 className="relative text-xl sm:text-2xl font-bold font-['Cinzel'] text-white leading-tight">
                Vendor’s website registered 74 days ago
              </h4>

              <p className="relative text-[#888888] text-xs sm:text-sm mt-2 leading-relaxed font-sans">
                Strongest single indicator in the gradient-boosted risk model. Cross-referenced with MCA filing showing vendor formed 6 weeks prior to DRHP submission.
              </p>

              <div className="relative mt-4 pt-3 border-t border-[#1C1C1C] flex items-center justify-between text-xs font-mono text-[#888888]">
                <span>Model Confidence: 99.2%</span>
                <span className="text-[#D4AF37] font-semibold">Source: WHOIS + MCA-21</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
