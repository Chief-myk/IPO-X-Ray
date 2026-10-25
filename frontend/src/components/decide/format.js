// Number formatting shared by the decision tools: Indian grouping, explicit signs, en dash for "unknown".

export const rs = (n) => (n == null || Number.isNaN(n) ? '–' : `${n < 0 ? '−' : ''}₹${Math.abs(Math.round(n)).toLocaleString('en-IN')}`);
export const rsSigned = (n) => (n == null ? '–' : n > 0 ? `+${rs(n)}` : rs(n));
export const pct = (n, d = 1) => (n == null || Number.isNaN(n) ? '–' : `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toFixed(d)}%`);
export const prob = (p) => {
  if (p == null) return '–';
  if (p >= 0.995) return '100%';
  if (p > 0 && p < 0.001) return '<0.1%';
  return `${(100 * p).toFixed(p < 0.1 ? 1 : 0)}%`;
};
export const oneIn = (p) => (p > 0 && p < 0.5 ? `1 in ${Math.round(1 / p).toLocaleString('en-IN')}` : null);
export const fmtDate = (iso) => {
  if (!iso) return '–';
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};
export const shortDate = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

/** Form state is strings; the API wants numbers or nothing. */
export function numbers(obj, keep = []) {
  const out = {};
  Object.entries(obj).forEach(([k, v]) => {
    if (v === '' || v == null) return;
    out[k] = keep.includes(k) ? v : Number(v);
  });
  return out;
}

// Local dates only: toISOString() would shift to UTC and lose a day in IST evenings.
const isoOf = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const todayIso = () => isoOf(new Date());
export const addDaysIso = (iso, n) => {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + n);
  return isoOf(d);
};
