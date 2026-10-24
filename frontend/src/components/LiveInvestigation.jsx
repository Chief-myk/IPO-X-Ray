import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, 
  Cpu, 
  Clock, 
  ExternalLink, 
  CheckCircle2, 
  Building2, 
  Briefcase, 
  UserCheck, 
  MapPin, 
  TrendingUp,
  Radio,
  Eye
} from 'lucide-react';

const TYPE_NAMES = {
  company: 'Issuer',
  vendor: 'Vendor',
  client: 'Client',
  director: 'Director',
  address: 'Address',
  financial: 'Financials',
};

const TYPE_ICONS = {
  company: Building2,
  vendor: Building2,
  client: Briefcase,
  director: UserCheck,
  address: MapPin,
  financial: TrendingUp,
};

const SEV_NAMES = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  unverified: 'Unverified',
  clear: 'Checks out',
};

const SEV_COLORS = {
  critical: '#FF5A4E',
  high: '#FF8A3D',
  medium: '#FFC23D',
  low: '#C9D46A',
  clear: '#8FE0AE',
  unverified: '#8EA3B5',
};

// Smooth count-up hook for numbers
function useAnimatedCount(targetValue = 0, duration = 650) {
  const [displayValue, setDisplayValue] = useState(targetValue);
  const prevRef = useRef(targetValue);

  useEffect(() => {
    let startTimestamp = null;
    const startNum = prevRef.current;
    const endNum = Number(targetValue || 0);
    const diff = endNum - startNum;
    if (diff === 0) return;

    let frameId;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.round(startNum + diff * eased);
      setDisplayValue(current);
      prevRef.current = current;

      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      }
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [targetValue, duration]);

  return displayValue;
}

export default function LiveInvestigation({ investigation, elapsedTime }) {
  const animatedScore = useAnimatedCount(investigation?.score ?? 0);

  if (!investigation) return null;

  const { company, demo, phase, phaseLabel, claims, lanes, flags, stats } = investigation;

  const phases = ['read', 'dispatch', 'verify', 'report'];
  const currentPhaseIdx = phases.indexOf(phase);

  // SVG Dial Math
  const circumference = 314.16; // 2 * Math.PI * 50
  const clampedScore = Math.min(100, Math.max(0, animatedScore));
  const strokeDashoffset = circumference - (circumference * clampedScore) / 100;
  
  const dialColor = 
    clampedScore >= 60 ? '#FF5A4E' : 
    clampedScore >= 30 ? '#FFC23D' : 
    '#8FE0AE';

  const riskLabel = 
    clampedScore >= 60 ? 'CRITICAL RISK' : 
    clampedScore >= 30 ? 'ELEVATED RISK' : 
    'NORMAL RANGE';

  return (
    <section className="relative overflow-hidden max-w-[1560px] mx-auto px-4 sm:px-8 lg:px-12 py-12 lg:py-20 border-t border-line" id="case">
      {/* Background ambient radar glow */}
      <div 
        className="pointer-events-none absolute -top-32 -left-32 w-[34rem] h-[34rem] rounded-full blur-[140px] opacity-25 transition-colors duration-1000" 
        style={{ backgroundColor: dialColor }}
        aria-hidden="true" 
      />
      <div className="pointer-events-none absolute bottom-0 right-0 w-[30rem] h-[30rem] rounded-full bg-beam/[0.06] blur-[140px]" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 bg-grid-fintech opacity-20" aria-hidden="true" />

      <div className="relative">
        {/* Investigation Header */}
        <header className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-end pb-6 border-b border-line/70">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="relative flex w-2.5 h-2.5">
                <span className="absolute inline-flex w-full h-full rounded-full bg-critical opacity-75 animate-ping" />
                <span className="relative inline-flex w-2.5 h-2.5 rounded-full bg-critical" />
              </span>
              <span className="font-mono text-xs font-semibold tracking-wider text-beam uppercase">
                {demo ? 'SIMULATED FORENSIC MONITOR' : 'LIVE AUTONOMOUS AGENT RADAR'}
              </span>
              <span className="text-bone-dim text-xs font-mono">· DOCKET AUDIT IN PROGRESS</span>
            </div>
            
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-['Bricolage_Grotesque'] bg-gradient-to-r from-bone via-[#EAFBFF] to-beam bg-clip-text text-transparent">
              {company}
            </h2>
          </div>

          {/* Right Header Stats & Telemetry */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Realtime Stats Pills */}
            <div className="flex items-center gap-2">
              <div className="px-3.5 py-2 rounded-xl border border-line/80 bg-[#122334]/80 backdrop-blur-md shadow-inner flex items-center gap-3">
                <Cpu className="w-4 h-4 text-beam" />
                <div>
                  <b className="block text-lg text-bone font-mono tabular-nums leading-none">
                    {stats.agents}
                  </b>
                  <span className="text-[10px] font-mono text-bone-dim uppercase">Agents</span>
                </div>
              </div>

              <div className="px-3.5 py-2 rounded-xl border border-line/80 bg-[#122334]/80 backdrop-blur-md shadow-inner flex items-center gap-3">
                <Terminal className="w-4 h-4 text-[#A8E8F2]" />
                <div>
                  <b className="block text-lg text-bone font-mono tabular-nums leading-none">
                    {stats.steps}
                  </b>
                  <span className="text-[10px] font-mono text-bone-dim uppercase">Steps</span>
                </div>
              </div>

              <div className="px-3.5 py-2 rounded-xl border border-line/80 bg-[#122334]/80 backdrop-blur-md shadow-inner flex items-center gap-3">
                <Clock className="w-4 h-4 text-beam" />
                <div>
                  <b className="block text-lg text-bone font-mono tabular-nums leading-none">
                    {elapsedTime.toFixed(1)}s
                  </b>
                  <span className="text-[10px] font-mono text-bone-dim uppercase">Elapsed</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Phase Stepper Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 my-6 p-3 rounded-2xl border border-line/80 bg-[#0E1C2B]/80 backdrop-blur-md">
          {/* Phase steps */}
          <ol className="flex items-center gap-2 list-none m-0 p-0 overflow-x-auto text-xs font-mono">
            {phases.map((p, idx) => {
              const isDonePhase = idx < currentPhaseIdx;
              const isCurrent = idx === currentPhaseIdx;
              return (
                <li
                  key={p}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border transition-all duration-300 capitalize whitespace-nowrap ${
                    isCurrent
                      ? 'text-[#091724] bg-gradient-to-r from-beam via-[#A3EAF7] to-beam bg-[length:200%_auto] border-transparent font-bold shadow-[0_0_20px_rgba(127,216,232,0.45)]'
                      : isDonePhase
                      ? 'text-clear border-clear/30 bg-clear/10 font-medium'
                      : 'text-[#5F778C] border-line/50 bg-film-2/30'
                  }`}
                >
                  {isDonePhase ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-clear" />
                  ) : isCurrent ? (
                    <span className="w-2 h-2 rounded-full bg-[#091724] animate-ping" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#5F778C]" />
                  )}
                  <span>{p}</span>
                </li>
              );
            })}
          </ol>

          {/* Phase Label Telemetry Banner */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-beam/30 bg-beam/10 text-beam text-xs font-mono">
            <Radio className="w-3.5 h-3.5 animate-pulse text-beam" />
            <span className="font-medium truncate">{phaseLabel || 'Analyzing claims in progress…'}</span>
          </div>
        </div>

        {/* Main 3-Column Board Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)_320px] gap-6 items-start">
          {/* ───────── Left Aside: Extracted DRHP Claims ───────── */}
          <aside className="lg:sticky top-24 relative overflow-hidden bg-paper text-ink rounded-2xl p-5 shadow-[0_0_0_1px_rgba(127,216,232,0.18),0_30px_70px_-25px_rgba(0,0,0,0.8)] border border-[#CBD0C6]">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-transparent via-beam to-transparent" aria-hidden="true" />
            
            <div className="flex items-center justify-between border-b border-[#CBD0C6] pb-2.5 mb-3">
              <h3 className="text-xs font-bold font-mono tracking-wider uppercase text-ink-dim">
                Extracted Claims
              </h3>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-ink/5 border border-ink/10 text-ink-dim">
                {claims.length} claims
              </span>
            </div>

            <ul className="space-y-0 divide-y divide-[#D8DCD3] text-xs sm:text-sm list-none p-0 m-0 max-h-[65vh] overflow-y-auto pr-1">
              {claims.length === 0 ? (
                <li className="py-4 text-ink-dim italic text-center font-mono text-xs">
                  Extracting claims from offer document…
                </li>
              ) : (
                claims.map((c) => {
                  const Icon = TYPE_ICONS[c.type] || Building2;
                  const isChecking = c.state === 'checking';

                  return (
                    <li key={c.id} className="py-2.5 pl-4 relative font-['Source_Serif_4'] leading-snug transition-colors hover:bg-ink/[0.04] rounded-lg">
                      {/* State beacon dot */}
                      <span
                        className={`absolute left-0 top-3 w-2 h-2 rounded-full transition-colors ${
                          isChecking ? 'bg-[#2EAECA] animate-ping' : ''
                        }`}
                        style={{
                          backgroundColor: c.worst ? SEV_COLORS[c.worst] : isChecking ? '#2EAECA' : '#B0B6AB',
                        }}
                      />

                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <small className="flex items-center gap-1 font-['Bricolage_Grotesque'] text-[11px] font-semibold text-ink-dim uppercase">
                          <Icon className="w-3 h-3 text-[#5A6573]" />
                          <span>{TYPE_NAMES[c.type] || c.type}</span>
                          {c.page ? <span className="font-mono text-[#7C8894]">· p. {c.page}</span> : ''}
                        </small>
                        {c.worst && (
                          <span 
                            className="font-mono text-[9px] uppercase font-bold px-1.5 py-0.2 rounded"
                            style={{ 
                              color: SEV_COLORS[c.worst], 
                              backgroundColor: `${SEV_COLORS[c.worst]}15`,
                              border: `1px solid ${SEV_COLORS[c.worst]}40`
                            }}
                          >
                            {SEV_NAMES[c.worst]}
                          </span>
                        )}
                      </div>

                      <span className="font-semibold text-ink text-[13px] block">{c.name}</span>
                      {c.detail && c.type !== 'company' && (
                        <small className="block text-ink-dim text-[11px] font-sans mt-0.5 line-clamp-2">
                          {c.detail}
                        </small>
                      )}
                    </li>
                  );
                })
              )}
            </ul>
          </aside>

          {/* ───────── Center Grid: Parallel Agent Lanes ───────── */}
          <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(270px,1fr))] gap-4">
            {Object.values(lanes).map((lane) => {
              const isFinished = lane.finished;
              const borderColor = lane.sev ? SEV_COLORS[lane.sev] : '#27435E';
              const isWorking = !isFinished;

              return (
                <article
                  key={lane.id}
                  className="bg-gradient-to-br from-[#132637] via-[#0E1C2B] to-[#0A1622] border rounded-2xl p-4 flex flex-col gap-3 min-h-[230px] relative overflow-hidden transition-all duration-300 hover:-translate-y-1 shadow-[0_16px_36px_-16px_rgba(0,0,0,0.7)]"
                  style={{
                    borderColor,
                    boxShadow: lane.sev
                      ? `0 20px 45px -20px rgba(0,0,0,0.8), 0 0 30px -10px ${SEV_COLORS[lane.sev]}66`
                      : '0 20px 45px -20px rgba(0,0,0,0.8)',
                  }}
                >
                  {/* Active Laser Sweep */}
                  {isWorking && (
                    <div className="absolute left-0 right-0 top-0 h-[2.5px] bg-gradient-to-r from-transparent via-beam to-transparent animate-sweep shadow-[0_0_12px_rgba(127,216,232,0.9)]" />
                  )}

                  {/* Lane Header */}
                  <div className="flex justify-between items-center gap-2 text-xs">
                    <span className="font-mono text-[11px] font-semibold text-beam flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-beam" />
                      {lane.label}
                    </span>
                    <span
                      className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#091522] border uppercase tracking-wider"
                      style={{ 
                        color: lane.sev ? SEV_COLORS[lane.sev] : '#7FD8E8',
                        borderColor: lane.sev ? `${SEV_COLORS[lane.sev]}50` : '#27435E'
                      }}
                    >
                      {lane.sev ? SEV_NAMES[lane.sev] : 'Checking'}
                    </span>
                  </div>

                  {/* Target Claim */}
                  <p className="font-['Source_Serif_4'] text-sm sm:text-base text-bone font-medium leading-snug line-clamp-2">
                    {lane.target}
                  </p>

                  {/* Terminal Steps Log */}
                  <div className="mt-auto pt-2.5 border-t border-line/60 bg-[#07111A]/80 -mx-4 -mb-4 p-3 rounded-b-2xl">
                    <div className="flex items-center justify-between text-[10px] font-mono text-bone-dim mb-1">
                      <span>TERMINAL STREAM</span>
                      <span className="tabular-nums text-beam">{lane.elapsed}s</span>
                    </div>

                    <ul className="font-mono text-[11px] text-bone-dim grid gap-1 min-h-[50px] list-none p-0 m-0">
                      {lane.steps.slice(-3).map((step, idx) => (
                        <li key={idx} className={`flex gap-1.5 truncate ${step.error ? 'text-critical' : 'text-bone-dim'}`}>
                          <span className="text-beam flex-none">›</span>
                          <span className="truncate">{step.text}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Footer URL / Finding */}
                    <div className="flex justify-between items-center text-xs text-bone-dim pt-2 mt-1 border-t border-[#1C3348]/60">
                      {lane.liveUrl && lane.liveUrl.startsWith('http') ? (
                        <a
                          href={lane.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-beam px-3 py-1 rounded-full border border-beam/40 bg-beam/10 hover:bg-beam/20 hover:border-beam shadow-[0_0_15px_rgba(127,216,232,0.3)] transition-all duration-300 no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-beam/60 w-full justify-center"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Watch live browser</span>
                          <ExternalLink className="w-3 h-3 ml-0.5" />
                        </a>
                      ) : lane.topTitle ? (
                        <span className="font-semibold text-xs truncate" style={{ color: SEV_COLORS[lane.sev] }}>
                          {lane.topTitle}
                        </span>
                      ) : (
                        <span className="text-[11px] font-mono text-[#586F82]">Autonomous browser active…</span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* ───────── Right Aside: Live Chronometer Risk Meter & Flag Feed ───────── */}
          <aside className="lg:sticky top-24 relative overflow-hidden bg-gradient-to-br from-[#122436]/90 to-[#0A1622]/90 backdrop-blur-xl border border-line rounded-2xl p-5 shadow-[0_30px_70px_-25px_rgba(0,0,0,0.85)]">
            <div 
              className="pointer-events-none absolute -top-16 -right-16 w-52 h-52 rounded-full blur-3xl opacity-25 transition-colors duration-700" 
              style={{ backgroundColor: dialColor }} 
              aria-hidden="true" 
            />

            <div className="flex items-center justify-between border-b border-line/60 pb-2.5 mb-4">
              <h3 className="text-xs font-bold font-mono tracking-wider uppercase text-bone-dim">
                Real-Time Risk Gauge
              </h3>
              <span 
                className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase"
                style={{ color: dialColor, backgroundColor: `${dialColor}15`, border: `1px solid ${dialColor}40` }}
              >
                {riskLabel}
              </span>
            </div>

            {/* Circular Gauge Chronometer */}
            <div className="relative w-44 mx-auto my-3">
              <svg viewBox="0 0 120 120" className="w-full -rotate-90">
                {/* Gauge Background Track */}
                <circle cx="60" cy="60" r="50" fill="none" strokeWidth="8" stroke="#172C3F" />
                
                {/* Dynamic Value Arc */}
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  strokeWidth="8"
                  stroke={dialColor}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-700 ease-out"
                  style={{ filter: `drop-shadow(0 0 8px ${dialColor})` }}
                />
              </svg>

              {/* Animated Center Score Readout */}
              <div className="absolute inset-0 flex flex-col items-center justify-center m-0">
                <span className="text-[10px] font-mono text-bone-dim uppercase tracking-wider -mb-1">
                  FRAUD PROBABILITY
                </span>
                <b 
                  className="text-4xl font-extrabold font-['Bricolage_Grotesque'] tabular-nums leading-tight"
                  style={{ color: dialColor, textShadow: `0 0 20px ${dialColor}66` }}
                >
                  {animatedScore}
                </b>
                <span className="text-bone-dim font-mono text-xs">/100</span>
              </div>
            </div>

            {/* Live Flag Stream Header */}
            <div className="flex items-center justify-between mt-6 mb-2 border-t border-line/60 pt-3">
              <span className="text-xs font-mono font-semibold text-bone">
                Discovered Flags ({flags.length})
              </span>
              <span className="w-2 h-2 rounded-full bg-beam animate-pulse" />
            </div>

            {/* Flag Feed */}
            <ul className="space-y-2.5 max-h-[46vh] overflow-y-auto pr-1 list-none p-0 m-0">
              {flags.length === 0 ? (
                <li className="p-4 border border-dashed border-line/70 rounded-xl text-xs text-bone-dim text-center font-mono">
                  Autonomous agents scanning registries… Flags will appear here.
                </li>
              ) : (
                flags.map((f, idx) => (
                  <li
                    key={idx}
                    className="bg-[#0A1624]/90 border border-line/60 border-l-4 rounded-xl p-3 text-xs leading-snug shadow-md transition-all duration-300 hover:bg-[#122436] hover:translate-x-0.5"
                    style={{ borderLeftColor: SEV_COLORS[f.severity] }}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-mono font-bold uppercase tracking-wider text-[10px]" style={{ color: SEV_COLORS[f.severity] }}>
                        {SEV_NAMES[f.severity]}
                      </span>
                      {f.points > 0 && (
                        <span 
                          className="font-mono font-bold px-1.5 py-0.2 rounded text-[11px]"
                          style={{ color: SEV_COLORS[f.severity], backgroundColor: `${SEV_COLORS[f.severity]}15` }}
                        >
                          +{f.points} pts
                        </span>
                      )}
                    </div>
                    <strong className="block text-bone font-medium text-[13px]">{f.title}</strong>
                    <small className="block text-bone-dim mt-0.5 text-[11px] truncate font-mono">{f.target}</small>
                  </li>
                ))
              )}
            </ul>
          </aside>
        </div>
      </div>
    </section>
  );
}