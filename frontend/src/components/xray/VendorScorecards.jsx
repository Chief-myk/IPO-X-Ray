import React, { useEffect, useState } from 'react';
import { api, SourceLink, btnCls } from './api.jsx';
import DraftPanel from './DraftPanel.jsx';

const STATUS = {
  pass: { t: 'pass', cls: 'text-clear' },
  fail: { t: 'fail', cls: 'text-critical' },
  partial: { t: 'partial', cls: 'text-medium' },
  unverified: { t: 'unverified', cls: 'text-medium' },
};

export default function VendorScorecards({ refreshKey, onCheck }) {
  const [rows, setRows] = useState(null);
  useEffect(() => { api('/api/vendors').then(setRows).catch(() => setRows([])); }, [refreshKey]);

  if (!rows) return <p className="text-bone-dim text-sm">Loading…</p>;
  if (!rows.length) return <p className="text-bone-dim text-sm">No vendors stored yet. Run a company above to pull its vendors from the offer document.</p>;

  const weak = rows.filter((v) => (v.score != null && v.score < 40) || v.multi_company_flag);
  return (
    <>
    {weak.length > 0 && (
      <div className="mb-4">
        <DraftPanel source="vendor" data={{ vendors: weak }} label={`Draft a complaint about ${weak.length} weak vendor${weak.length > 1 ? 's' : ''}`} />
      </div>
    )}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {rows.map((v) => {
        const col = v.score == null ? '#8EA3B5' : v.score >= 70 ? '#8FE0AE' : v.score >= 40 ? '#FFC23D' : '#FF5A4E';
        return (
          <article key={v.id} className="rounded-2xl border border-line bg-film-2/70 p-4">
            <div className="flex items-start gap-2">
              <h3 className="font-semibold text-bone flex-1">{v.name}</h3>
              {v.multi_company_flag && (
                <span className="text-xs px-2 py-0.5 rounded-full border border-critical text-critical bg-critical/10 whitespace-nowrap">
                  Used by {v.used_by.length} companies
                </span>
              )}
            </div>
            <p className="text-xs text-bone-dim mt-0.5">Named by: {v.used_by.join(', ') || 'n/a'}</p>

            {v.score == null ? (
              <div className="mt-3">
                <p className="text-sm text-bone-dim mb-2">Not checked yet. No score is shown until an agent has looked.</p>
                <button className={btnCls} onClick={() => onCheck(v.name)}>Check this vendor</button>
              </div>
            ) : (
              <>
                <div className="mt-3 text-3xl font-bold" style={{ color: col }}>
                  {v.score}<span className="text-sm font-normal text-bone-dim"> / 100 presence</span>
                </div>
                <div className="h-2 rounded-full bg-line overflow-hidden my-2">
                  <div className="h-full rounded-full" style={{ width: `${v.score}%`, background: col }} />
                </div>
                <ul className="space-y-1 mt-2">
                  {v.checks.map((c) => (
                    <li key={c.key} className="flex gap-2 text-xs">
                      <b className={`w-[78px] shrink-0 ${(STATUS[c.status] || STATUS.unverified).cls}`}>{c.status === 'pass' ? '✓' : c.status === 'fail' ? '✗' : c.status === 'partial' ? '½' : '?'} {(STATUS[c.status] || STATUS.unverified).t}</b>
                      <span className="text-bone">{c.label} <span className="text-bone-dim">· {c.detail} ({c.points}/{c.max})</span></span>
                    </li>
                  ))}
                </ul>
                <p className="text-[11px] text-bone-dim mt-2">Checked {v.run_at}. A low score means “needs review”, not a verdict.</p>
              </>
            )}
            <div className="mt-2 text-xs flex flex-wrap gap-x-3">
              {v.sources.slice(0, 5).map((s) => <SourceLink key={s} url={s}>host</SourceLink>)}
            </div>
          </article>
        );
      })}
    </div>
    </>
  );
}
