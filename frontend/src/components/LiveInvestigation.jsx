import React from 'react';

const TYPE_NAMES = {
  company: 'Issuer',
  vendor: 'Vendor',
  client: 'Client',
  director: 'Director',
  address: 'Address',
  financial: 'Financials',
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

export default function LiveInvestigation({ investigation, elapsedTime }) {
  if (!investigation) return null;

  const { company, demo, phase, phaseLabel, claims, lanes, score, flags, stats } = investigation;

  const phases = ['read', 'dispatch', 'verify', 'report'];
  const currentPhaseIdx = phases.indexOf(phase);

  // SVG Dial Math
  const circumference = 314.16;
  const strokeDashoffset = circumference - (circumference * Math.min(100, Math.max(0, score))) / 100;
  const dialColor = score >= 60 ? '#FF5A4E' : score >= 30 ? '#FFC23D' : '#8FE0AE';

  return (
    <section className="max-w-[1560px] mx-auto px-4 md:px-12 py-10 lg:py-16 border-t border-line" id="case">
      {/* Investigation Header */}
      <header className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-6 items-end">
        <div>
          <p className="text-sm text-bone-dim">
            {demo ? 'Sample investigation (fictional company)' : 'Live investigation'}
          </p>
          <h2 className="text-2xl sm:text-4xl font-bold mt-1 tracking-tight text-bone font-['Bricolage_Grotesque']">
            {company}
          </h2>
        </div>

        {/* Phase Badges */}
        <ol className="flex gap-1.5 list-none m-0 p-0 text-xs sm:text-sm">
          {phases.map((p, idx) => {
            const isDone = idx < currentPhaseIdx;
            const isCurrent = idx === currentPhaseIdx;
            return (
              <li
                key={p}
                className={`capitalize px-3 py-1.5 rounded-full border transition-all ${
                  isCurrent
                    ? 'text-film bg-beam border-beam font-semibold'
                    : isDone
                    ? 'text-bone border-bone-dim'
                    : 'text-[#5F778C] border-line'
                }`}
              >
                {p}
              </li>
            );
          })}
        </ol>

        {/* Realtime Stats */}
        <div className="flex gap-5 text-xs text-bone-dim">
          <div>
            <b className="block text-2xl text-bone font-['Bricolage_Grotesque'] tabular-nums leading-none">
              {stats.agents}
            </b>
            agents
          </div>
          <div>
            <b className="block text-2xl text-bone font-['Bricolage_Grotesque'] tabular-nums leading-none">
              {stats.steps}
            </b>
            steps
          </div>
          <div>
            <b className="block text-2xl text-bone font-['Bricolage_Grotesque'] tabular-nums leading-none">
              {elapsedTime.toFixed(1)}
            </b>
            seconds
          </div>
        </div>
      </header>

      {/* Active Phase Banner */}
      <p className="my-5 text-beam text-sm sm:text-base flex items-center min-h-[1.5em]">
        <span className="w-2 h-2 rounded-full bg-beam mr-2.5 animate-pulseGlow" />
        {phaseLabel || 'Analyzing claims…'}
      </p>

      {/* Board Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[270px_minmax(0,1fr)_300px] gap-6 items-start">
        {/* Left Aside: DRHP Claims */}
        <aside className="lg:sticky top-24 bg-paper text-ink rounded p-4.5 shadow-md">
          <h3 className="text-sm font-semibold tracking-normal text-ink-dim mb-3">Claims in the DRHP</h3>
          <ul className="space-y-0 divide-y divide-[#D3D7CE] text-xs sm:text-sm">
            {claims.length === 0 ? (
              <li className="py-2.5 text-ink-dim italic">Reading the document…</li>
            ) : (
              claims.map((c) => (
                <li key={c.id} className="py-2.5 pl-4 relative font-['Source_Serif_4'] leading-snug">
                  <span
                    className={`absolute left-0 top-3.5 w-1.5 h-1.5 rounded-full ${
                      c.state === 'checking' ? 'bg-[#3FB6CC] animate-pulseGlow' : ''
                    }`}
                    style={{
                      backgroundColor: c.worst ? SEV_COLORS[c.worst] : c.state === 'checking' ? '#3FB6CC' : '#B9BFB4',
                    }}
                  />
                  <small className="block font-['Bricolage_Grotesque'] text-[11px] text-ink-dim">
                    {TYPE_NAMES[c.type] || c.type}
                    {c.page ? `, page ${c.page}` : ''}
                  </small>
                  <span className="font-medium text-ink">{c.name}</span>
                  {c.detail && c.type !== 'company' && (
                    <small className="block text-ink-dim text-[11px] font-sans mt-0.5">{c.detail}</small>
                  )}
                </li>
              ))
            )}
          </ul>
        </aside>

        {/* Center Grid: Parallel Agent Lanes */}
        <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3.5">
          {Object.values(lanes).map((lane) => {
            const isFinished = lane.finished;
            const borderColor = lane.sev ? SEV_COLORS[lane.sev] : '#27435E';
            return (
              <article
                key={lane.id}
                className="bg-film-2 border rounded-2xl p-4 flex flex-col gap-2.5 min-h-[210px] relative overflow-hidden transition-all shadow-sm"
                style={{ borderColor }}
              >
                {!isFinished && (
                  <div className="absolute left-0 right-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-beam to-transparent animate-sweep" />
                )}

                <div className="flex justify-between gap-2 text-xs text-bone-dim">
                  <span className="font-medium">{lane.label}</span>
                  <span className="font-semibold" style={{ color: lane.sev ? SEV_COLORS[lane.sev] : undefined }}>
                    {lane.sev ? SEV_NAMES[lane.sev] : 'Working'}
                  </span>
                </div>

                <p className="font-['Source_Serif_4'] text-base text-bone font-medium leading-snug line-clamp-2">
                  {lane.target}
                </p>

                <ul className="mt-auto pt-2.5 border-t border-line font-mono text-[11px] text-bone-dim grid gap-1 flex-1 content-start">
                  {lane.steps.slice(-4).map((step, idx) => (
                    <li key={idx} className={`flex gap-1.5 ${step.error ? 'text-high' : 'text-bone-dim'}`}>
                      <span className="text-beam">›</span>
                      <span className="truncate">{step.text}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex justify-between items-center text-xs text-bone-dim pt-2 border-t border-line/50">
                  <span>{lane.elapsed}s</span>
                  {lane.liveUrl && lane.liveUrl.startsWith('http') ? (
                    <a
                      href={lane.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-beam hover:underline font-medium"
                    >
                      Watch the browser
                    </a>
                  ) : lane.topTitle ? (
                    <span className="font-semibold truncate max-w-[150px]" style={{ color: SEV_COLORS[lane.sev] }}>
                      {lane.topTitle}
                    </span>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>

        {/* Right Aside: Risk Meter & Live Feed */}
        <aside className="lg:sticky top-24 bg-film-2/60 border border-line rounded-2xl p-4.5">
          <h3 className="text-sm font-semibold tracking-normal text-bone-dim mb-3">Risk so far</h3>

          {/* Dial SVG Meter */}
          <div className="relative w-40 mx-auto mb-4">
            <svg viewBox="0 0 120 120" className="w-full -rotate-90">
              <circle cx="60" cy="60" r="50" fill="none" strokeWidth="9" stroke="#1F3851" />
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                strokeWidth="9"
                stroke={dialColor}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <p className="absolute inset-0 flex items-center justify-center gap-0.5 m-0 font-['Bricolage_Grotesque']">
              <b className="text-4xl text-bone tabular-nums">{score}</b>
              <span className="text-bone-dim text-xs mt-3">/100</span>
            </p>
          </div>

          {/* Flag Feed */}
          <ul className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
            {flags.length === 0 ? (
              <li className="p-3 border border-dashed border-line rounded-lg text-xs text-bone-dim text-center">
                Flags will appear here as agents report back.
              </li>
            ) : (
              flags.map((f, idx) => (
                <li
                  key={idx}
                  className="bg-film border-l-3 rounded-r-lg p-2.5 text-xs leading-snug shadow-sm"
                  style={{ borderLeftColor: SEV_COLORS[f.severity] }}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold uppercase tracking-wider text-[10px]" style={{ color: SEV_COLORS[f.severity] }}>
                      {SEV_NAMES[f.severity]}
                    </span>
                    {f.points > 0 && <span className="font-bold text-bone tabular-nums">+{f.points}</span>}
                  </div>
                  <strong className="block text-bone font-medium">{f.title}</strong>
                  <small className="block text-bone-dim mt-0.5 text-[11px] truncate">{f.target}</small>
                </li>
              ))
            )}
          </ul>
        </aside>
      </div>
    </section>
  );
}
