import React from 'react';
import { pct, rs, shortDate } from './format';

// Hand-drawn SVG charts for the decision desk. One idea per chart, direct labels, colours from the theme:
// beam = this IPO / the plan, mute = reference, critical = below zero. The tables next to each chart carry the same numbers.

const C = { beam: '#D8C48F', clear: '#8FE0AE', mute: '#837C6F', line: '#36312A', bone: '#EEE8DA', dim: '#A8A092', critical: '#FF5A4E', medium: '#FFC23D' };

function niceStep(span, target = 6) {
  const raw = span / target;
  const mag = 10 ** Math.floor(Math.log10(raw || 1));
  return [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => span / s <= target) || 10 * mag;
}

function ticks(lo, hi, target) {
  const step = niceStep(hi - lo, target);
  const out = [];
  for (let t = Math.ceil(lo / step) * step; t <= hi + 1e-9; t += step) out.push(+t.toFixed(6));
  return out;
}

const compactRs = (n) => {
  const a = Math.abs(n);
  const s = a >= 1e7 ? `${(a / 1e7).toFixed(1)}Cr` : a >= 1e5 ? `${(a / 1e5).toFixed(1)}L` : a >= 1e3 ? `${(a / 1e3).toFixed(0)}k` : `${Math.round(a)}`;
  return `${n < 0 ? '−' : ''}₹${s}`;
};

/** Listing-gain range against the board's history, with the closest past listings as dots. */
export function RangeStrip({ range, baseline, analogs = [] }) {
  const W = 760, H = 190, L = 136, R = 24;
  const vals = [range.lo, range.hi, baseline.lo, baseline.hi, 0, ...analogs.map((a) => a.gain_open_pct)];
  let lo = Math.min(...vals), hi = Math.max(...vals);
  const pad = (hi - lo) * 0.08 || 5;
  lo -= pad; hi += pad;
  const x = (v) => L + ((v - lo) / (hi - lo)) * (W - L - R);
  const rows = [
    { y: 40, label: 'Board history', band: baseline, color: C.mute },
    { y: 92, label: 'This IPO', band: range, color: C.beam },
  ];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img"
      aria-label={`Likely listing gain ${pct(range.lo)} to ${pct(range.hi)}, median ${pct(range.median)}; board history ${pct(baseline.lo)} to ${pct(baseline.hi)}.`}>
      {ticks(lo, hi, 7).map((t) => (
        <g key={t}>
          <line x1={x(t)} x2={x(t)} y1={18} y2={H - 28} stroke={C.line} strokeDasharray={t === 0 ? '0' : '2 4'} strokeWidth={t === 0 ? 1.5 : 1} />
          <text x={x(t)} y={H - 10} fill={C.dim} fontSize="11" textAnchor="middle">{t > 0 ? `+${t}%` : `${t}%`}</text>
        </g>
      ))}
      {rows.map((r) => (
        <g key={r.label}>
          <text x={L - 10} y={r.y + 5} fill={C.bone} fontSize="12" textAnchor="end">{r.label}</text>
          <rect x={x(r.band.lo)} y={r.y - 10} width={Math.max(2, x(r.band.hi) - x(r.band.lo))} height={20} rx={10} fill={r.color} opacity={r.color === C.beam ? 0.35 : 0.22} />
          <line x1={x(r.band.median)} x2={x(r.band.median)} y1={r.y - 14} y2={r.y + 14} stroke={r.color} strokeWidth={3} />
          <text x={x(r.band.lo)} y={r.y - 16} fill={C.dim} fontSize="10" textAnchor="middle">{pct(r.band.lo, 0)}</text>
          <text x={x(r.band.hi)} y={r.y - 16} fill={C.dim} fontSize="10" textAnchor="middle">{pct(r.band.hi, 0)}</text>
          {r.color === C.beam && <text x={x(r.band.median)} y={r.y + 28} fill={C.beam} fontSize="11" fontWeight="600" textAnchor="middle">median {pct(r.band.median)}</text>}
        </g>
      ))}
      <text x={L - 10} y={146} fill={C.bone} fontSize="12" textAnchor="end">Closest past IPOs</text>
      {analogs.map((a, i) => (
        <circle key={`${a.name}-${i}`} cx={x(a.gain_open_pct)} cy={142 + ((i % 3) - 1) * 6} r={5}
          fill={a.synthetic ? 'none' : a.gain_open_pct < 0 ? C.critical : C.clear}
          stroke={a.gain_open_pct < 0 ? C.critical : C.clear} strokeWidth={1.5}>
          <title>{`${a.synthetic ? '(synthetic) ' : ''}${a.name}, ${a.date}: ${pct(a.gain_open_pct)}`}</title>
        </circle>
      ))}
    </svg>
  );
}

/** When each application's money is reserved, and how much of the budget is in use on each day. */
export function PlanTimeline({ ipos, timeline, budget }) {
  if (!ipos.length) return null;
  const W = 760, rowH = 30, L = 150, R = 20, top = 22;
  const dates = [...ipos.flatMap((i) => [i.apply_on, i.money_back_if_allotted]), ...timeline.map((t) => t.date)].sort();
  const t0 = new Date(`${dates[0]}T00:00:00`).getTime();
  const t1 = new Date(`${dates[dates.length - 1]}T00:00:00`).getTime() + 864e5;
  const x = (iso, end = false) => L + ((new Date(`${iso}T00:00:00`).getTime() + (end ? 864e5 : 0) - t0) / (t1 - t0)) * (W - L - R);
  const ganttH = top + ipos.length * rowH;
  const useTop = ganttH + 34, useH = 90;
  const H = useTop + useH + 30;
  const y = (v) => useTop + useH - (v / budget) * useH;
  const days = [];
  for (let t = t0; t < t1; t += 864e5) days.push(new Date(t));
  // reserved money steps at the timeline's change points and drops to zero after the last one
  let path = `M${L},${y(0)}`;
  let prev = 0;
  timeline.forEach((p) => {
    path += ` L${x(p.date)},${y(prev)} L${x(p.date)},${y(p.reserved)}`;
    prev = p.reserved;
  });
  if (timeline.length) {
    const end = x(timeline[timeline.length - 1].date, true);
    path += ` L${end},${y(prev)} L${end},${y(0)} L${W - R},${y(0)}`;
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Timeline of money reserved for each application, and total reserved against the budget">
      {days.map((d) => {
        const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const wk = d.getDay() === 0 || d.getDay() === 6;
        return (
          <g key={iso}>
            {wk && <rect x={x(iso)} y={top - 6} width={x(iso, true) - x(iso)} height={ganttH - top + 6} fill="#ffffff" opacity={0.025} />}
            <text x={(x(iso) + x(iso, true)) / 2} y={12} fill={C.dim} fontSize="9" textAnchor="middle">{d.getDate()}</text>
          </g>
        );
      })}
      {ipos.map((i, k) => {
        const yy = top + k * rowH;
        const on = i.decision === 'apply';
        const a = x(i.apply_on), u = x(i.unblock_if_not_allotted, true), m = x(i.money_back_if_allotted, true), lst = x(i.listing_date);
        return (
          <g key={i.name}>
            <text x={L - 10} y={yy + 17} fill={on ? C.bone : C.dim} fontSize="12" textAnchor="end">{i.name.length > 20 ? `${i.name.slice(0, 19)}…` : i.name}</text>
            <rect x={a} y={yy + 6} width={Math.max(2, u - a)} height={16} rx={4} fill={on ? C.beam : 'none'} stroke={on ? 'none' : C.mute} strokeDasharray={on ? '0' : '3 3'} opacity={on ? 0.75 : 1} />
            <rect x={u} y={yy + 6} width={Math.max(0, m - u)} height={16} rx={4} fill={on ? C.beam : 'none'} opacity={on ? 0.25 : 1} stroke={on ? 'none' : C.mute} strokeDasharray="3 3" />
            <line x1={lst} x2={lst} y1={yy + 3} y2={yy + 25} stroke={C.medium} strokeWidth={2}><title>Listing day</title></line>
            {on && <text x={a + 6} y={yy + 18} fill="#171512" fontSize="10" fontWeight="700">{rs(i.capital_reserved)}</text>}
          </g>
        );
      })}
      <text x={L - 10} y={useTop + 10} fill={C.bone} fontSize="12" textAnchor="end">Budget in use</text>
      <line x1={L} x2={W - R} y1={y(budget)} y2={y(budget)} stroke={C.critical} strokeDasharray="4 4" />
      <text x={W - R} y={y(budget) - 4} fill={C.critical} fontSize="10" textAnchor="end">budget {rs(budget)}</text>
      <line x1={L} x2={W - R} y1={y(0)} y2={y(0)} stroke={C.line} />
      <path d={path} fill="none" stroke={C.beam} strokeWidth={2} />
      {timeline.map((p) => (
        <circle key={p.date} cx={x(p.date)} cy={y(p.reserved)} r={3} fill={C.beam}><title>{`${shortDate(p.date)}: ${rs(p.reserved)} reserved`}</title></circle>
      ))}
      <g transform={`translate(${L},${H - 10})`} fontSize="10" fill={C.dim}>
        <rect x={0} y={-8} width={14} height={8} rx={2} fill={C.beam} opacity={0.75} /><text x={18} y={0}>blocked until unblocked if not allotted</text>
        <rect x={230} y={-8} width={14} height={8} rx={2} fill={C.beam} opacity={0.25} /><text x={248} y={0}>reserved until sale money arrives if allotted</text>
        <line x1={505} x2={505} y1={-9} y2={1} stroke={C.medium} strokeWidth={2} /><text x={511} y={0}>listing day</text>
      </g>
    </svg>
  );
}

/** Profit after charges and tax at each horizon: 10th-90th percentile bar, median dot. */
export function HorizonFan({ horizons }) {
  const W = 760, H = 280, L = 70, R = 16, top = 16, bottom = 64;
  const vals = horizons.flatMap((h) => [h.profit.p10, h.profit.p90, 0]);
  let lo = Math.min(...vals), hi = Math.max(...vals);
  const pad = (hi - lo) * 0.08 || 1;
  lo -= pad; hi += pad;
  const y = (v) => top + (1 - (v - lo) / (hi - lo)) * (H - top - bottom);
  const bw = (W - L - R) / horizons.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Profit after tax and charges for each selling date, 10th to 90th percentile with median">
      {ticks(lo, hi, 5).map((t) => (
        <g key={t}>
          <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke={C.line} strokeWidth={t === 0 ? 1.5 : 1} strokeDasharray={t === 0 ? '0' : '2 4'} />
          <text x={L - 8} y={y(t) + 4} fill={C.dim} fontSize="11" textAnchor="end">{compactRs(t)}</text>
        </g>
      ))}
      {horizons.map((h, i) => {
        const cx = L + bw * (i + 0.5);
        const col = h.tax_type === 'LTCG' ? C.clear : C.beam;
        return (
          <g key={h.key}>
            <title>{`${h.label} (${h.date}): ${rs(h.profit.p10)} to ${rs(h.profit.p90)}, median ${rs(h.profit.p50)}, ${h.tax_type} ${h.tax_rate_pct}%`}</title>
            <rect x={cx - 9} y={y(h.profit.p90)} width={18} height={Math.max(2, y(h.profit.p10) - y(h.profit.p90))} rx={9} fill={col} opacity={0.3} />
            <circle cx={cx} cy={y(h.profit.p50)} r={6} fill={h.profit.p50 < 0 ? C.critical : col} />
            <text x={cx} y={y(h.profit.p50) - 11} fill={C.bone} fontSize="11" fontWeight="600" textAnchor="middle">{compactRs(h.profit.p50)}</text>
            <text x={cx} y={H - bottom + 18} fill={C.bone} fontSize="11" textAnchor="middle">{h.label.replace('Listing day, at the ', 'Listing ').replace(' day', '')}</text>
            <text x={cx} y={H - bottom + 33} fill={C.dim} fontSize="10" textAnchor="middle">{shortDate(h.date)}</text>
            <text x={cx} y={H - bottom + 48} fill={col} fontSize="10" textAnchor="middle">{h.tax_type} {h.tax_rate_pct}%</text>
          </g>
        );
      })}
    </svg>
  );
}
