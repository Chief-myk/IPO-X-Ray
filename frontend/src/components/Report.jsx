import React from 'react';

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

export default function Report({ report, onReset }) {
  if (!report) return null;

  const { company, score, verdict, summary, drivers, flags, verified, model, anomaly_pct, probability, disclaimer, demo } = report;

  const toneColor = score >= 60 ? '#FF5A4E' : score >= 30 ? '#FFC23D' : '#8FE0AE';
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

  return (
    <section className="max-w-[1440px] mx-auto px-4 md:px-12 py-14 lg:py-24 border-t border-line" id="report">
      {/* Report Header */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 items-end pb-9 border-b border-line">
        <div>
          <p className="text-sm text-bone-dim">
            Report on {company} {demo && '(fictional sample)'}
          </p>
          <h2
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight font-['Bricolage_Grotesque'] leading-tight my-2"
            style={{ color: toneColor }}
          >
            {verdict}
          </h2>
          <p className="font-['Source_Serif_4'] text-base sm:text-xl text-bone max-w-[62ch] leading-relaxed">
            {summary || 'Each flag below links back to the claim it concerns and to the sources the agents found.'}
          </p>
          {model && (
            <p className="mt-4 max-w-[70ch] text-xs sm:text-sm text-bone-dim leading-normal">
              Scored by {model.name?.toLowerCase()}, trained on {model.n_synthetic?.toLocaleString('en-IN')} synthetic cases
              {model.n_real ? ` and ${model.n_real} real labelled IPOs (AUC on real cases: ${model.auc_real ?? 'n/a'})` : ' and no real labelled IPOs yet'}.{' '}
              Fraud probability {Math.round((probability ?? (score / 100)) * 100)}%.{' '}
              {anomaly_pct != null && `Less typical than ${anomaly_pct}% of clean SME IPOs in the training set.`}
            </p>
          )}
        </div>

        {/* Big Score Display */}
        <div className="text-left md:text-right">
          <b
            className="block text-6xl sm:text-8xl font-black font-['Bricolage_Grotesque'] tabular-nums leading-none"
            style={{ color: toneColor }}
          >
            {score}
          </b>
          <span className="text-xs sm:text-sm text-bone-dim tracking-wide uppercase">Risk Score</span>
        </div>
      </div>

      {/* Report Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8 lg:gap-16 mt-10">
        {/* Left Column: Red Flags */}
        <div>
          <h3 className="text-xl sm:text-2xl font-bold font-['Bricolage_Grotesque'] mb-4 text-bone">
            Red flags
          </h3>

          <ol className="divide-y divide-line list-none m-0 p-0">
            {flags && flags.length > 0 ? (
              flags.map((f, idx) => (
                <li key={idx} className="grid grid-cols-1 sm:grid-cols-[110px_1fr] gap-4 py-5">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: SEV_COLORS[f.severity] }}>
                      {SEV_NAMES[f.severity]}
                    </span>
                    {f.points > 0 && (
                      <b className="text-xl font-bold font-['Bricolage_Grotesque'] text-bone tabular-nums">
                        +{f.points}
                      </b>
                    )}
                  </div>
                  <div>
                    <h4 className="text-lg sm:text-xl font-semibold text-bone mb-1">{f.title}</h4>
                    <p className="font-['Source_Serif_4'] italic text-bone text-sm mb-1.5">{f.target}</p>
                    <p className="text-bone-dim text-sm sm:text-base leading-relaxed">{f.detail}</p>
                    {f.evidence && f.evidence.length > 0 && (
                      <div className="flex flex-wrap gap-2.5 mt-2.5 text-xs">
                        {f.evidence.map((u, uIdx) => {
                          const safeUrl = String(u || '');
                          if (!safeUrl.startsWith('http://') && !safeUrl.startsWith('https://')) return null;
                          return (
                            <a
                              key={uIdx}
                              href={safeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-beam hover:underline break-all"
                            >
                              {safeUrl.replace(/^https?:\/\//, '')}
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </li>
              ))
            ) : (
              <li className="py-6 text-bone-dim">
                <h4 className="text-lg font-semibold text-bone mb-1">No red flags</h4>
                <p>Every claim the agents checked was backed by public evidence.</p>
              </li>
            )}
          </ol>
        </div>

        {/* Right Column: Drivers & Verified Claims */}
        <div>
          <h3 className="text-xl sm:text-2xl font-bold font-['Bricolage_Grotesque'] mb-4 text-bone">
            What moved the score
          </h3>

          <ul className="space-y-2.5 mb-8">
            {(drivers || []).map((d, idx) => {
              const isUp = d.points >= 0;
              const barWidth = Math.min(100, (Math.abs(d.points || 0) / maxPts) * 100);
              return (
                <li key={idx} className="grid grid-cols-[1fr_90px_52px] gap-3 items-center text-xs sm:text-sm">
                  <span className="text-bone truncate">{d.label}</span>
                  <div className="h-1.5 rounded-full bg-film-3 relative overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: isUp ? '#FF5A4E' : '#8FE0AE',
                      }}
                    />
                  </div>
                  <b className={`text-right tabular-nums ${isUp ? 'text-bone' : 'text-clear'}`}>
                    {d.points > 0 ? `+${d.points}` : d.points}
                  </b>
                </li>
              );
            })}
          </ul>

          <h3 className="text-xl sm:text-2xl font-bold font-['Bricolage_Grotesque'] mb-4 text-bone pt-6 border-t border-line">
            Claims that checked out
          </h3>

          <ul className="divide-y divide-line text-sm mb-8">
            {verified && verified.length > 0 ? (
              verified.map((c, idx) => (
                <li key={idx} className="py-3 font-['Source_Serif_4'] text-bone">
                  <span className="font-medium">{c.name}</span>
                  <small className="block font-['Bricolage_Grotesque'] text-bone-dim text-xs mt-0.5">
                    {TYPE_NAMES[c.type] || c.type}
                  </small>
                </li>
              ))
            ) : (
              <li className="py-3 text-bone-dim italic">None of the claims could be fully confirmed.</li>
            )}
          </ul>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={handleDownload}
              className="bg-beam hover:bg-[#A3E6F1] text-[#0A2230] font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-all"
            >
              Download report
            </button>
            <button
              onClick={handlePrint}
              className="bg-transparent hover:border-bone-dim text-bone border border-line rounded-xl px-4 py-2.5 text-xs sm:text-sm transition-colors"
            >
              Print
            </button>
            <button
              onClick={onReset}
              className="bg-transparent hover:border-bone-dim text-bone border border-line rounded-xl px-4 py-2.5 text-xs sm:text-sm transition-colors"
            >
              Investigate another IPO
            </button>
          </div>

          <p className="mt-6 text-xs text-bone-dim leading-relaxed max-w-[50ch]">
            {disclaimer || 'Automated open-web screening scored by a statistical model. Not investment advice and not proof of wrongdoing. Verify every flag before acting.'}
          </p>
        </div>
      </div>
    </section>
  );
}
