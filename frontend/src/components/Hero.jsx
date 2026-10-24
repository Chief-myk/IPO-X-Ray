import React, { useState, useRef } from 'react';

const SAMPLE_MARKS = [
  {
    id: 1,
    name: 'Vyom Signal Technologies Private Limited',
    sev: 'critical',
    note: "Vendor director shares the promoter's home address",
  },
  {
    id: 2,
    name: 'Northern Metro Transit Corporation',
    sev: 'medium',
    note: 'Client has never named the issuer anywhere',
  },
  {
    id: 3,
    name: 'Yamuna Urban Roads Authority',
    sev: 'clear',
    note: "Work order found on the client's tender portal",
  },
  {
    id: 4,
    name: '₹48.6 crore',
    sev: 'high',
    note: 'About 11 people visible for 4.3× growth',
  },
  {
    id: 5,
    name: 'Plot 14, Sector 9, Kalindi Industrial Estate, Delhi',
    sev: 'high',
    note: 'No operating business at this address',
  },
  {
    id: 6,
    name: 'Mr. Rakesh Vardhan',
    sev: 'critical',
    note: 'Former director of the main vendor',
  },
];

const SEV_HEX = {
  critical: '#FF5A4E',
  high: '#FF8A3D',
  medium: '#FFC23D',
  clear: '#8FE0AE',
};

const SEV_COLOR_CLASSES = {
  critical: 'bg-critical/20 hover:bg-critical/35 text-critical border-critical/50 shadow-[inset_0_-2px_0_#FF5A4E]',
  high: 'bg-high/20 hover:bg-high/35 text-high border-high/50 shadow-[inset_0_-2px_0_#FF8A3D]',
  medium: 'bg-medium/20 hover:bg-medium/35 text-medium border-medium/50 shadow-[inset_0_-2px_0_#D69A12]',
  clear: 'bg-clear/20 hover:bg-clear/35 text-clear border-clear/50 shadow-[inset_0_-2px_0_#3E9E66]',
};

const CLAIM_CHIPS = [
  { label: 'vendors', color: '#FF5A4E' },
  { label: 'clients', color: '#FFC23D' },
  { label: 'directors', color: '#FF8A3D' },
  { label: 'addresses', color: '#7FD8E8' },
  { label: 'revenue', color: '#8FE0AE' },
];

// Self-contained keyframes so no Tailwind config changes are needed
const HERO_CSS = `
@keyframes ix-rise{from{transform:translateY(110%)}to{transform:translateY(0)}}
@keyframes ix-fade{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes ix-scan{from{top:-8%}to{top:92%}}
@keyframes ix-spin{to{transform:rotate(360deg)}}
@keyframes ix-shimmer{to{background-position:200% center}}
@keyframes ix-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
.ix-rise{display:inline-block;animation:ix-rise .9s cubic-bezier(.2,.8,.2,1) both}
.ix-fade{animation:ix-fade .8s ease-out both}
.ix-scan{animation:ix-scan 3.6s ease-in-out infinite alternate}
.ix-spin{animation:ix-spin 7s linear infinite}
.ix-shimmer{background-size:200% auto;animation:ix-shimmer 5s linear infinite}
.ix-float{animation:ix-float 6s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){
  .ix-rise,.ix-fade,.ix-scan,.ix-spin,.ix-shimmer,.ix-float{animation:none}
}
`;

// Highlight inside the DRHP sheet; linked to the callout list via activeId
function Mark({ id, sev, activeId, setActiveId, children }) {
  return (
    <mark
      onMouseEnter={() => setActiveId(id)}
      onMouseLeave={() => setActiveId(null)}
      className={`px-1 py-0.5 rounded transition-all duration-200 cursor-help ${SEV_COLOR_CLASSES[sev]} ${
        activeId === id ? 'ring-2 ring-current ring-offset-2 ring-offset-paper' : ''
      }`}
    >
      {children}
    </mark>
  );
}

export default function Hero({ onStart, isLive, isSubmitting }) {
  const [company, setCompany] = useState('');
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [formMsg, setFormMsg] = useState('');
  const [activeId, setActiveId] = useState(null);
  const fileInputRef = useRef(null);
  const sectionRef = useRef(null);

  const critical = SAMPLE_MARKS.filter((m) => m.sev === 'critical').length;
  const high = SAMPLE_MARKS.filter((m) => m.sev === 'high').length;

  // cursor spotlight: sets CSS vars, no re-render
  const handleMouseMove = (e) => {
    const el = sectionRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = company.trim();
    if (!trimmed) {
      setFormMsg('Enter the company name as it appears on the IPO.');
      return;
    }
    if (!isLive) {
      setFormMsg('Live agents need TINYFISH_API_KEY in backend/.env. Try the sample case meanwhile.');
      return;
    }
    setFormMsg('');
    onStart({ company: trimmed, file, demo: false });
  };

  const handleSample = () => {
    setFormMsg('');
    onStart({ company: '', file: null, demo: true });
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected && selected.type === 'application/pdf') {
      setFile(selected);
      setFormMsg('');
    } else if (selected) {
      setFormMsg('Drop a PDF of the DRHP.');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped && dropped.type === 'application/pdf') {
      setFile(dropped);
      setFormMsg('');
    } else {
      setFormMsg('Drop a PDF of the DRHP.');
    }
  };

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      className="relative isolate overflow-hidden"
      id="top"
    >
      <style>{HERO_CSS}</style>

      {/* ───────── Background: aurora, grid, cursor spotlight ───────── */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute -top-40 left-[-10%] w-[40rem] h-[40rem] rounded-full bg-beam/[0.13] blur-[120px]" />
        <div className="absolute top-1/3 right-[-12%] w-[36rem] h-[36rem] rounded-full bg-[#3F7FBF]/[0.16] blur-[130px]" />
        <div className="absolute bottom-[-10rem] left-1/3 w-[30rem] h-[30rem] rounded-full bg-critical/[0.06] blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(#E6EDF2_1px,transparent_1px),linear-gradient(90deg,#E6EDF2_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_30%_30%,black_20%,transparent_75%)]" />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(520px circle at var(--mx, 70%) var(--my, 25%), rgba(127,216,232,0.10), transparent 60%)',
          }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-16 items-center px-4 md:px-12 py-12 lg:py-24 max-w-[1440px] mx-auto min-h-[calc(100svh-65px)]">
        {/* ───────── Left: copy + probe form ───────── */}
        <div>
          <h2 className="text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-extrabold tracking-tight leading-[0.95] font-['Bricolage_Grotesque']">
            <span className="block overflow-hidden pb-2">
              <span className="ix-rise text-bone">Read the prospectus</span>
            </span>
            <span className="block overflow-hidden pb-2">
              <span className="ix-rise text-bone" style={{ animationDelay: '0.12s' }}>
                like an investigator
              </span>
            </span>
            <span className="block overflow-hidden pb-2">
              <span className="ix-rise" style={{ animationDelay: '0.24s' }}>
                <span className="ix-shimmer bg-gradient-to-r from-beam via-[#EAFBFF] to-beam bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(127,216,232,0.45)]">
                  would.
                </span>
              </span>
            </span>
          </h2>

          <p className="ix-fade max-w-[54ch] mt-7 text-base sm:text-lg text-bone-dim leading-relaxed" style={{ animationDelay: '0.4s' }}>
            Name an SME IPO. IPO X-Ray pulls every checkable claim out of its offer document — vendors, clients, directors, addresses, revenue — and sends a web agent after each one. You get a red-flag report with sources before you put money in.
          </p>

          {/* claim types pulled from the paragraph above */}
          <ul className="ix-fade flex flex-wrap gap-2 mt-5 list-none p-0" style={{ animationDelay: '0.5s' }}>
            {CLAIM_CHIPS.map((c) => (
              <li
                key={c.label}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-line bg-film-2/50 backdrop-blur-sm text-xs text-bone-dim capitalize"
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.color, boxShadow: `0 0 8px ${c.color}` }} />
                {c.label}
              </li>
            ))}
          </ul>

          <form id="probe" className="ix-fade mt-9 max-w-xl" style={{ animationDelay: '0.6s' }} onSubmit={handleSubmit} noValidate>
            <label htmlFor="company" className="block text-sm text-bone-dim mb-2 font-medium">
              Company name
            </label>

            {/* command-bar with a slowly rotating glow border */}
            <div className="group/bar relative rounded-2xl p-[1.5px] overflow-hidden shadow-[0_30px_70px_-30px_rgba(127,216,232,0.35)]">
              <div className="absolute inset-[-100%] ix-spin opacity-60 group-focus-within/bar:opacity-100 transition-opacity duration-500 [background:conic-gradient(from_0deg,transparent_0deg,#7FD8E8_70deg,transparent_140deg,transparent_220deg,#3F7FBF_290deg,transparent_360deg)]" aria-hidden="true" />
              <div className="relative flex flex-col sm:flex-row gap-2 bg-[#0F1E2B] rounded-[14px] p-1.5">
                <div className="flex items-center flex-1 min-w-0 gap-2 pl-3">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 flex-none fill-none stroke-bone-dim stroke-[1.8] group-focus-within/bar:stroke-beam transition-colors" aria-hidden="true">
                    <circle cx="11" cy="11" r="7" />
                    <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
                  </svg>
                  <input
                    id="company"
                    name="company"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    autoComplete="off"
                    placeholder="e.g. the name on the IPO application"
                    className="flex-1 min-w-0 bg-transparent border-0 text-bone text-base sm:text-lg px-1 py-3 outline-none placeholder:text-[#62788C]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group/btn inline-flex items-center justify-center gap-2 bg-gradient-to-r from-beam to-[#A8E8F2] hover:from-[#A3E6F1] hover:to-[#C4F0F7] text-[#0A2230] font-semibold text-sm sm:text-base px-5 py-3 rounded-xl shadow-[0_0_24px_rgba(127,216,232,0.35)] hover:shadow-[0_0_36px_rgba(127,216,232,0.6)] active:scale-[0.98] transition-all duration-300 whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-beam/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F1E2B]"
                  id="startBtn"
                >
                  {isSubmitting ? 'Starting…' : 'Start investigation'}
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-[2.2] transition-transform duration-300 group-hover/btn:translate-x-1" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5 mt-3">
              <label
                className={`flex-1 min-w-[240px] flex items-center gap-3 px-3.5 py-2.5 border rounded-xl text-xs sm:text-sm cursor-pointer transition-all duration-300 ${
                  file
                    ? 'border-solid border-clear/70 bg-clear/5 text-bone'
                    : isDragging
                    ? 'border-beam bg-beam/10 text-bone scale-[1.01] shadow-[0_0_28px_rgba(127,216,232,0.25)]'
                    : 'border-dashed border-line bg-film-2/30 text-bone-dim hover:border-beam hover:bg-beam/5 hover:text-bone'
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="application/pdf"
                  className="sr-only"
                  onChange={handleFileChange}
                />
                <span
                  className={`grid place-items-center w-9 h-9 flex-none rounded-lg border transition-colors ${
                    file ? 'border-clear/50 bg-clear/10 text-clear' : 'border-line bg-film-2 text-beam'
                  }`}
                >
                  {file ? (
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current stroke-2" aria-hidden="true">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current stroke-[1.6]" aria-hidden="true">
                      <path d="M7 3h7l5 5v13H7z M14 3v5h5" />
                    </svg>
                  )}
                </span>
                <span className="min-w-0">
                  {file ? (
                    <>
                      <strong className="font-medium break-all">{file.name}</strong>{' '}
                      <span className="text-[#6E8497]">({(file.size / 1048576).toFixed(1)} MB)</span>
                    </>
                  ) : (
                    <>
                      Attach the DRHP PDF{' '}
                      <span className="text-[#6E8497] hidden sm:inline">(optional — without it, an agent finds it online)</span>
                    </>
                  )}
                </span>
              </label>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSample}
                className="bg-transparent hover:bg-film-2 hover:border-beam/60 hover:-translate-y-0.5 active:translate-y-0 text-bone border border-line rounded-xl px-4 py-2.5 text-xs sm:text-sm transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-beam/60"
                id="sampleBtn"
              >
                Run the sample case
              </button>
            </div>

            {formMsg && (
              <p className="min-h-[1.4em] mt-3 px-3 py-2 rounded-lg border border-medium/30 bg-medium/10 text-sm text-medium" role="alert">
                {formMsg}
              </p>
            )}
          </form>
        </div>

        {/* ───────── Right: DRHP sheet + linked callouts ───────── */}
        <div className="ix-fade relative" style={{ animationDelay: '0.35s' }}>
          {/* halo */}
          <div className="pointer-events-none absolute -inset-8 rounded-[3rem] bg-gradient-to-br from-beam/20 via-transparent to-[#3F7FBF]/20 blur-3xl" aria-hidden="true" />

          {/* floating summary chip */}
          <div className="ix-float hidden sm:flex absolute -top-5 -right-3 z-20 items-center gap-2.5 px-3.5 py-2 rounded-full border border-line bg-[#0F1E2B]/85 backdrop-blur-md text-xs text-bone shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)]">
            <span className="relative flex w-2 h-2">
              <span className="absolute inline-flex w-full h-full rounded-full bg-critical opacity-60 animate-ping" />
              <span className="relative inline-flex w-2 h-2 rounded-full bg-critical" />
            </span>
            <span className="tabular-nums">{critical} critical</span>
            <span className="text-bone-dim">·</span>
            <span className="tabular-nums text-high">{high} high</span>
          </div>

          <div className="relative">
            {/* stacked pages for depth */}
            <div className="absolute inset-0 rounded-lg bg-paper/25 rotate-3 translate-x-3 translate-y-3" aria-hidden="true" />
            <div className="absolute inset-0 rounded-lg bg-paper/45 rotate-[1.5deg] translate-x-1.5 translate-y-1.5" aria-hidden="true" />

            <div className="relative overflow-hidden bg-paper text-ink rounded-lg p-6 sm:p-9 font-['Source_Serif_4'] text-sm sm:text-base leading-relaxed shadow-[0_0_0_1px_rgba(127,216,232,0.18),0_0_80px_-10px_rgba(127,216,232,0.3),0_50px_100px_-30px_rgba(0,0,0,0.8)] -rotate-1 transition-transform hover:rotate-0 duration-500 motion-reduce:transition-none motion-reduce:hover:-rotate-1">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-beam to-transparent" aria-hidden="true" />

              {/* Sheet Header */}
              <header className="flex justify-between font-['Bricolage_Grotesque'] text-xs text-ink-dim border-b border-[#CBD0C6] pb-2.5 mb-4">
                <span>Draft Red Herring Prospectus</span>
                <span>Page 142</span>
              </header>

              <h2 className="text-xl sm:text-2xl font-semibold mb-2.5 tracking-tight font-['Source_Serif_4']">Our business</h2>
              <p>
                Our Company designs and installs intelligent traffic management systems for urban bodies. We procure controllers and sensors primarily from{' '}
                <Mark id={1} sev="critical" activeId={activeId} setActiveId={setActiveId}>
                  Vyom Signal Technologies Private Limited
                </Mark>
                , which accounted for 61.4% of total purchases in FY2025.
              </p>

              <p className="mt-2.5">
                Our major customers include{' '}
                <Mark id={2} sev="medium" activeId={activeId} setActiveId={setActiveId}>
                  Northern Metro Transit Corporation
                </Mark>{' '}
                and{' '}
                <Mark id={3} sev="clear" activeId={activeId} setActiveId={setActiveId}>
                  Yamuna Urban Roads Authority
                </Mark>
                , together contributing 55% of revenue from operations.
              </p>

              <p className="mt-2.5">
                Revenue from operations rose to{' '}
                <Mark id={4} sev="high" activeId={activeId} setActiveId={setActiveId}>
                  ₹48.6 crore
                </Mark>{' '}
                in FY2025 from ₹11.2 crore in FY2024. Our registered office is situated at{' '}
                <Mark id={5} sev="high" activeId={activeId} setActiveId={setActiveId}>
                  Plot 14, Sector 9, Kalindi Industrial Estate, Delhi
                </Mark>
                .
              </p>

              <h3 className="text-lg font-semibold mt-4 mb-1.5 font-['Source_Serif_4']">Our management</h3>
              <p>
                <Mark id={6} sev="critical" activeId={activeId} setActiveId={setActiveId}>
                  Mr. Rakesh Vardhan
                </Mark>
                , Managing Director and Promoter, has over 15 years of experience in infrastructure projects.
              </p>

              {/* Scan beam (pure CSS, no re-renders) */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
                <div className="ix-scan absolute left-[-10%] right-[-10%] h-[80px] mix-blend-multiply bg-gradient-to-b from-transparent via-beam/40 to-transparent">
                  <div className="absolute left-0 right-0 top-1/2 h-[2px] bg-[#3FB6CC] shadow-[0_0_16px_4px_rgba(127,216,232,0.8)]" />
                </div>
              </div>
            </div>
          </div>

          {/* Callouts: always visible, linked to the highlights above */}
          <ul className="relative grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-10 list-none p-0">
            {SAMPLE_MARKS.map((m) => {
              const color = SEV_HEX[m.sev];
              const isActive = activeId === m.id;
              return (
                <li
                  key={m.id}
                  onMouseEnter={() => setActiveId(m.id)}
                  onMouseLeave={() => setActiveId(null)}
                  className={`relative overflow-hidden text-xs leading-snug text-bone pl-3.5 pr-3 py-2.5 rounded-xl border border-l-[3px] bg-film-2/50 backdrop-blur-sm transition-all duration-300 cursor-default ${
                    isActive ? 'bg-film-2 -translate-y-0.5' : 'border-line'
                  }`}
                  style={{
                    borderLeftColor: color,
                    borderColor: isActive ? color : undefined,
                    boxShadow: isActive ? `0 12px 30px -12px ${color}` : undefined,
                  }}
                >
                  <strong
                    className="flex items-center gap-1.5 uppercase tracking-wider text-[10px] mb-0.5"
                    style={{ color }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }} />
                    {m.sev}
                  </strong>
                  {m.note}
                </li>
              );
            })}
          </ul>

          <p className="relative mt-4 text-xs text-[#6E8497]">Sample case. Kalindi Smart Mobility Limited is fictional.</p>
        </div>
      </div>
    </section>
  );
}