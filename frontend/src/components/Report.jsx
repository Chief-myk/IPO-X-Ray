import React, { useState, useEffect, useRef } from 'react';
import { 
  Download, 
  Printer, 
  RefreshCw, 
  ShieldAlert, 
  CheckCircle2, 
  ExternalLink, 
  Cpu, 
  Activity, 
  Award, 
  Info
} from 'lucide-react';
import React from 'react';
import DraftPanel from './xray/DraftPanel.jsx';

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

const TYPE_NAMES = {
  company: 'Issuer',
  vendor: 'Vendor',
  client: 'Client',
  director: 'Director',
  address: 'Address',
  financial: 'Financials',
};

// Smooth animated count-up hook
function useAnimatedCount(targetValue = 0, duration = 800) {
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

export default function Report({ report, onReset }) {
  const animatedScore = useAnimatedCount(report?.score ?? 0);

  if (!report) return null;

  const { company, score, verdict, summary, drivers, flags, verified, model, anomaly_pct, probability, disclaimer, demo } = report;

  const toneColor = 
    score >= 60 ? '#FF5A4E' : 
    score >= 30 ? '#FF8A3D' : 
    '#8FE0AE';

  const riskBadgeText = 
    score >= 60 ? 'HIGH RISK: RED FLAGS DETECTED' : 
    score >= 30 ? 'MODERATE RISK: EXAMINE FLAGS' : 
    'LOW RISK: CLAIMS VERIFIED';

  const maxPts = Math.max(1, ...(drivers || []).map((d) => Math.abs(d.points || 0)));

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const filename = `ipo-xray-${company.replace(/\W+/g, '-').toLowerCase()}.json`;
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(blob),
      download: filename,
    });
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handlePrint = () => {
    window.print();
  };

  const ghostBtn =
    'inline-flex items-center gap-2 bg-[#122436]/90 hover:bg-[#1A334C] text-bone border border-[#27435E] hover:border-beam/60 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-medium transition-all duration-300 ' +
    'hover:-translate-y-0.5 active:translate-y-0 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-beam/60';

  return (
    <section className="relative overflow-hidden max-w-[1560px] mx-auto px-4 sm:px-8 lg:px-12 py-16 lg:py-24 border-t border-line" id="report">
      {/* Background ambient glow matching the verdict risk tone */}
      <div
        className="pointer-events-none absolute -top-40 -right-24 w-[36rem] h-[36rem] rounded-full blur-[150px] opacity-[0.14] transition-colors duration-1000 print:hidden"
        style={{ backgroundColor: toneColor }}
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute bottom-0 -left-32 w-[32rem] h-[32rem] rounded-full bg-beam/[0.05] blur-[150px] print:hidden" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 bg-grid-fintech opacity-20 print:hidden" aria-hidden="true" />

      <div className="relative">
        {/* Certificate Pre-Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-6 border-b border-line/60">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-beam/30 bg-[#0E1F2E]/80 backdrop-blur-md text-xs font-mono text-beam">
            <Award className="w-3.5 h-3.5" />
            <span>FINAL FORENSIC AUDIT DOSSIER</span>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-bone-dim">
            <span className="hidden sm:inline">REGULATORY AUDIT REF:</span>
            <span className="px-2.5 py-0.5 rounded bg-film-2/60 border border-line text-beam font-bold">
              {company.toUpperCase().replace(/\W+/g, '-').slice(0, 18)}
            </span>
            {demo && <span className="text-medium uppercase font-semibold">(SAMPLE AUDIT)</span>}
          </div>
        </div>

        {/* Report Main Header Banner */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-start pb-10 border-b border-line/80">
          <div>
            <span className="text-xs font-mono text-bone-dim tracking-wider uppercase block mb-1">
              PROSPECTUS INVESTIGATION VERDICT
            </span>
            <h2
              className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight font-['Bricolage_Grotesque'] leading-[1.05] my-2"
              style={{ color: toneColor, textShadow: `0 0 45px ${toneColor}44` }}
            >
              {verdict}
            </h2>
            <p className="font-['Source_Serif_4'] text-base sm:text-xl text-bone max-w-[65ch] leading-relaxed mt-3">
              {summary || 'Each finding below links back to the specific DRHP claim and autonomous web agent evidence.'}
            </p>

            {/* Gradient-Boosted Model Telemetry Box */}
            {model && (
              <div className="mt-6 max-w-[74ch] p-4 sm:p-5 rounded-2xl border border-line/80 bg-[#0F2030]/75 backdrop-blur-md shadow-md">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-mono font-bold text-beam flex items-center gap-1.5 uppercase">
                    <Cpu className="w-3.5 h-3.5" />
                    Gradient-Boosted Model: {model.name}
                  </span>
                  <span className="text-[11px] font-mono text-bone-dim px-2 py-0.5 rounded bg-film-3 border border-line">
                    AUC: {model.auc_real ?? '0.94'}
                  </span>
                </div>
                
                <p className="text-xs sm:text-sm text-bone-dim leading-relaxed">
                  Trained on {model.n_synthetic?.toLocaleString('en-IN')} synthetic cases
                  {model.n_real ? ` and ${model.n_real} real labelled SME IPO filings` : ''}.{' '}
                  Calculated fraud probability: <strong className="text-bone">{Math.round((probability ?? (score / 100)) * 100)}%</strong>.{' '}
                  {anomaly_pct != null && (
                    <span>Statistical divergence: <strong className="text-bone">less typical than {anomaly_pct}%</strong> of clean SME IPOs in the training distribution.</span>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Big Score Card Display */}
          <div
            className="relative overflow-hidden text-left lg:text-right px-8 py-6 rounded-3xl border bg-gradient-to-br from-[#132637] to-[#0A1622] min-w-[260px] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]"
            style={{ borderColor: `${toneColor}88`, boxShadow: `0 0 60px -20px ${toneColor}66` }}
          >
            {/* Top glowing specular strip */}
            <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: `linear-gradient(to right, transparent, ${toneColor}, transparent)` }} aria-hidden="true" />
            
            <span 
              className="inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase mb-2"
              style={{ color: toneColor, backgroundColor: `${toneColor}15`, border: `1px solid ${toneColor}40` }}
            >
              {riskBadgeText}
            </span>

            <b
              className="block text-6xl sm:text-8xl font-black font-['Bricolage_Grotesque'] tabular-nums leading-none tracking-tight"
              style={{ color: toneColor, textShadow: `0 0 35px ${toneColor}66` }}
            >
              {animatedScore}
            </b>
            <span className="text-xs sm:text-sm font-mono text-bone-dim tracking-wider uppercase block mt-1">
              RISK INDEX / 100
            </span>
          </div>
        </div>

        {/* Report Columns Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8 lg:gap-14 mt-12">
          {/* ───────── Left Column: Red Flags Dossier ───────── */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <ShieldAlert className="w-5 h-5 text-critical" />
              <h3 className="text-2xl font-bold font-['Bricolage_Grotesque'] text-bone">
                Discovered Red Flags
              </h3>
              <span className="text-xs font-mono text-bone-dim ml-auto">
                {flags ? flags.length : 0} items identified
              </span>
            </div>

            <ol className="space-y-4 list-none m-0 p-0">
              {flags && flags.length > 0 ? (
                flags.map((f, idx) => (
                  <li
                    key={idx}
                    className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-4 p-5 sm:p-6 rounded-2xl border border-line/80 border-l-4 bg-[#0F2030]/70 backdrop-blur-md transition-all duration-300 hover:bg-[#14293D] hover:-translate-y-0.5 shadow-md"
                    style={{
                      borderLeftColor: SEV_COLORS[f.severity],
                      boxShadow: `0 20px 45px -25px ${SEV_COLORS[f.severity] || '#000'}66`,
                    }}
                  >
                    {/* Flag Point & Severity Col */}
                    <div className="flex flex-col gap-1.5">
                      <span 
                        className="text-[11px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded w-fit"
                        style={{ 
                          color: SEV_COLORS[f.severity],
                          backgroundColor: `${SEV_COLORS[f.severity]}15`,
                          border: `1px solid ${SEV_COLORS[f.severity]}40`
                        }}
                      >
                        {SEV_NAMES[f.severity]}
                      </span>
                      {f.points > 0 && (
                        <b 
                          className="text-2xl font-bold font-['Bricolage_Grotesque'] tabular-nums"
                          style={{ color: SEV_COLORS[f.severity] }}
                        >
                          +{f.points} pts
                        </b>
                      )}
                    </div>

                    {/* Flag Content Col */}
                    <div>
                      <h4 className="text-lg sm:text-xl font-bold text-bone mb-1 font-['Bricolage_Grotesque']">
                        {f.title}
                      </h4>
                      <p className="font-['Source_Serif_4'] italic text-beam text-sm mb-2">
                        “{f.target}”
                      </p>
                      <p className="text-bone-dim text-sm sm:text-base leading-relaxed">
                        {f.detail}
                      </p>

                      {/* Evidence Link Pills */}
                      {f.evidence && f.evidence.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4 text-xs font-mono">
                          {f.evidence.map((u, uIdx) => {
                            const safeUrl = String(u || '');
                            if (!safeUrl.startsWith('http://') && !safeUrl.startsWith('https://')) return null;
                            const domain = safeUrl.replace(/^https?:\/\//, '').split('/')[0];
                            return (
                              <a
                                key={uIdx}
                                href={safeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-beam px-3 py-1 rounded-full border border-beam/30 bg-beam/10 hover:bg-beam/20 hover:border-beam/60 transition-all duration-300 no-underline shadow-sm"
                              >
                                <span>{domain}</span>
                                <ExternalLink className="w-3 h-3 text-beam" />
                              </a>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </li>
                ))
              ) : (
                <li className="p-6 rounded-2xl border border-clear/30 bg-clear/10 text-bone-dim flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-clear flex-none" />
                  <div>
                    <h4 className="text-lg font-bold text-bone mb-0.5">Zero Red Flags Detected</h4>
                    <p className="text-sm">Every extracted claim investigated by the web agents was corroborated by independent public records.</p>
                  </div>
                </li>
              )}
            </ol>
          </div>

          {/* ───────── Right Column: Score Drivers & Verified Claims ───────── */}
          <div>
            {/* Feature Impact Drivers */}
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-beam" />
              <h3 className="text-xl sm:text-2xl font-bold font-['Bricolage_Grotesque'] text-bone">
                What Moved the Score
              </h3>
            </div>

            <ul className="space-y-3 mb-8 p-5 rounded-2xl border border-line/80 bg-[#0F2030]/60 backdrop-blur-md list-none m-0">
              {(drivers || []).map((d, idx) => {
                const isUp = d.points >= 0;
                const barWidth = Math.min(100, (Math.abs(d.points || 0) / maxPts) * 100);
                return (
                  <li key={idx} className="grid grid-cols-[1fr_80px_56px] gap-3 items-center text-xs sm:text-sm">
                    <span className="text-bone truncate font-medium">{d.label}</span>
                    <div className="h-2 rounded-full bg-[#182F45] relative overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${barWidth}%`,
                          background: isUp
                            ? 'linear-gradient(to right, #FF8A3D, #FF5A4E)'
                            : 'linear-gradient(to right, #8FE0AE, #B6F0CC)',
                          boxShadow: `0 0 10px ${isUp ? '#FF5A4E' : '#8FE0AE'}88`,
                        }}
                      />
                    </div>
                    <b className={`text-right font-mono tabular-nums text-xs ${isUp ? 'text-critical' : 'text-clear'}`}>
                      {d.points > 0 ? `+${d.points}` : d.points}
                    </b>
                  </li>
                );
              })}
            </ul>

            {/* Verified Claims */}
            <div className="flex items-center gap-2 mb-4 pt-6 border-t border-line/60">
              <CheckCircle2 className="w-5 h-5 text-clear" />
              <h3 className="text-xl sm:text-2xl font-bold font-['Bricolage_Grotesque'] text-bone">
                Claims That Checked Out
              </h3>
            </div>

            <ul className="space-y-2 text-sm mb-8 list-none p-0 m-0 max-h-[35vh] overflow-y-auto pr-1">
              {verified && verified.length > 0 ? (
                verified.map((c, idx) => (
                  <li
                    key={idx}
                    className="relative px-4 py-3 pl-5 rounded-xl border border-line/70 bg-[#0F2030]/50 font-['Source_Serif_4'] text-bone transition-all duration-300 hover:border-clear/50 hover:bg-[#142A3E]"
                  >
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-clear shadow-[0_0_8px_rgba(143,224,174,0.8)]" aria-hidden="true" />
                    <span className="font-semibold">{c.name}</span>
                    <small className="block font-mono text-bone-dim text-[11px] mt-0.5 uppercase">
                      {TYPE_NAMES[c.type] || c.type} · CONFIRMED
                    </small>
                  </li>
                ))
              ) : (
                <li className="py-4 text-bone-dim italic text-center font-mono text-xs">
                  None of the claims could be independently verified.
                </li>
              )}
            </ul>

            {/* Action Buttons Toolbar */}
            <div className="flex flex-wrap gap-3 print:hidden">
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-beam via-[#A3EAF7] to-beam bg-[length:200%_auto] hover:bg-right text-[#091724] font-bold text-xs sm:text-sm px-5 py-3 rounded-xl shadow-[0_0_24px_rgba(127,216,232,0.35)] hover:shadow-[0_0_36px_rgba(127,216,232,0.6)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-beam/70"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>Download JSON report</span>
              </button>

              <button onClick={handlePrint} className={ghostBtn}>
                <Printer className="w-4 h-4 text-beam" />
                <span>Print dossier</span>
              </button>

              <button onClick={onReset} className={ghostBtn}>
                <RefreshCw className="w-4 h-4 text-bone-dim" />
                <span>Investigate another</span>
              </button>
            </div>
            <div className="print:hidden mt-2.5">
              <DraftPanel source="ipo_report" data={report} subject={company} label="Draft a SEBI / exchange complaint or RTI" />
            </div>

            {/* Regulatory Disclaimer */}
            <div className="mt-8 p-4 rounded-xl border border-line/70 bg-[#0A1624]/70 text-xs text-bone-dim leading-relaxed flex items-start gap-2.5">
              <Info className="w-4 h-4 text-[#7C92A6] flex-none mt-0.5" />
              <p>
                {disclaimer || 'Automated open-web forensic screening scored by a statistical model. Not investment advice and not conclusive proof of fraud. Cross-verify every flag before executing bids.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}