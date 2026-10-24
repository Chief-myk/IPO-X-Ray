import React, { useState, useRef } from 'react';
import { 
  Search, 
  ArrowRight, 
  UploadCloud, 
  AlertTriangle, 
  Building2, 
  Briefcase, 
  UserCheck, 
  MapPin, 
  TrendingUp, 
  FileCheck,
  X,
  Play
} from 'lucide-react';

const SAMPLE_MARKS = [
  {
    id: 1,
    name: 'Vyom Signal Technologies Private Limited',
    sev: 'critical',
    note: "Vendor director shares the promoter's home address",
    category: 'vendor',
  },
  {
    id: 2,
    name: 'Northern Metro Transit Corporation',
    sev: 'medium',
    note: 'Client has never named the issuer anywhere',
    category: 'client',
  },
  {
    id: 3,
    name: 'Yamuna Urban Roads Authority',
    sev: 'clear',
    note: "Work order found on the client's tender portal",
    category: 'client',
  },
  {
    id: 4,
    name: '₹48.6 crore',
    sev: 'high',
    note: 'About 11 people visible for 4.3× growth',
    category: 'revenue',
  },
  {
    id: 5,
    name: 'Plot 14, Sector 9, Kalindi Industrial Estate, Delhi',
    sev: 'high',
    note: 'No operating business at this address',
    category: 'address',
  },
  {
    id: 6,
    name: 'Mr. Rakesh Vardhan',
    sev: 'critical',
    note: 'Former director of the main vendor',
    category: 'director',
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
  medium: 'bg-medium/20 hover:bg-medium/35 text-medium border-medium/50 shadow-[inset_0_-2px_0_#FFC23D]',
  clear: 'bg-clear/20 hover:bg-clear/35 text-clear border-clear/50 shadow-[inset_0_-2px_0_#8FE0AE]',
};

const CLAIM_CHIPS = [
  { label: 'vendors', color: '#FF5A4E', icon: Building2 },
  { label: 'clients', color: '#FFC23D', icon: Briefcase },
  { label: 'directors', color: '#FF8A3D', icon: UserCheck },
  { label: 'addresses', color: '#7FD8E8', icon: MapPin },
  { label: 'revenue', color: '#8FE0AE', icon: TrendingUp },
];

const QUICK_SAMPLES = [
  'Kalindi Smart Mobility Limited',
  'Trafiksol ITS Technologies',
  'Resourceful Automobile'
];

// Self-contained keyframes
const HERO_CSS = `
@keyframes ix-rise { from { transform: translateY(110%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
@keyframes ix-fade { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
@keyframes ix-scan { from { top: -6%; } to { top: 94%; } }
@keyframes ix-spin { to { transform: rotate(360deg); } }
@keyframes ix-shimmer { to { background-position: 200% center; } }
@keyframes ix-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }

.ix-rise { display: inline-block; animation: ix-rise 0.85s cubic-bezier(0.16, 1, 0.3, 1) both; }
.ix-fade { animation: ix-fade 0.75s ease-out both; }
.ix-scan { animation: ix-scan 3.8s ease-in-out infinite alternate; }
.ix-spin { animation: ix-spin 8s linear infinite; }
.ix-shimmer { background-size: 200% auto; animation: ix-shimmer 4.5s linear infinite; }
.ix-float { animation: ix-float 5s ease-in-out infinite; }

@media (prefers-reduced-motion: reduce) {
  .ix-rise, .ix-fade, .ix-scan, .ix-spin, .ix-shimmer, .ix-float { animation: none !important; }
}
`;

function Mark({ id, sev, activeId, setActiveId, children }) {
  const isActive = activeId === id;
  return (
    <mark
      onMouseEnter={() => setActiveId(id)}
      onMouseLeave={() => setActiveId(null)}
      className={`px-1 py-0.5 rounded cursor-pointer transition-all duration-200 ${SEV_COLOR_CLASSES[sev]} ${
        isActive 
          ? 'ring-2 ring-current ring-offset-2 ring-offset-[#EEF0EA] scale-[1.03] shadow-md' 
          : 'hover:scale-[1.01]'
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

  // cursor spotlight: sets CSS vars on mouse move
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
      setFormMsg('Enter the company name as it appears on the IPO application.');
      return;
    }
    if (!isLive) {
      setFormMsg('Live autonomous agents need TINYFISH_API_KEY in backend/.env. Try running the sample case below meanwhile!');
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
      setFormMsg('Please upload a PDF file of the DRHP.');
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
      setFormMsg('Please drop a valid PDF file of the DRHP.');
    }
  };

  const removeFile = (e) => {
    e.stopPropagation();
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      className="relative isolate overflow-hidden pt-4 pb-16 lg:py-20"
      id="top"
    >
      <style>{HERO_CSS}</style>

      {/* ───────── Ambient Background: Cyber Grid & Auroras ───────── */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 left-[5%] w-[45rem] h-[45rem] rounded-full bg-beam/[0.12] blur-[140px]" />
        <div className="absolute top-1/4 right-[-10%] w-[40rem] h-[40rem] rounded-full bg-[#1F4B78]/[0.22] blur-[150px]" />
        <div className="absolute bottom-[-10rem] left-1/4 w-[32rem] h-[32rem] rounded-full bg-critical/[0.07] blur-[130px]" />
        
        {/* Subtle geometric dot grid */}
        <div className="absolute inset-0 bg-dots-fintech opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
        
        {/* Dynamic cursor spotlight glow */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(580px circle at var(--mx, 65%) var(--my, 30%), rgba(127,216,232,0.12), transparent 60%)',
          }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-14 items-center px-4 sm:px-8 lg:px-12 max-w-[1560px] mx-auto min-h-[calc(100svh-90px)]">
        {/* ───────── Left Column: Headlines & Form ───────── */}
        <div className="relative z-10 flex flex-col justify-center">
          {/* Market Intelligence Ticker Badge */}
          <div className="ix-fade inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-beam/30 bg-[#0E1F2E]/70 backdrop-blur-md text-xs text-beam mb-6 w-fit shadow-[0_0_20px_rgba(127,216,232,0.15)]">
            <span className="relative flex w-2 h-2">
              <span className="absolute inline-flex w-full h-full rounded-full bg-beam opacity-75 animate-ping" />
              <span className="relative inline-flex w-2 h-2 rounded-full bg-beam" />
            </span>
            <span className="font-mono font-medium tracking-wide">
              NSE · BSE SME OFFER DOCUMENT INVESTIGATOR
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.0] font-['Bricolage_Grotesque']">
            <span className="block overflow-hidden pb-1">
              <span className="ix-rise text-bone">Read the prospectus</span>
            </span>
            <span className="block overflow-hidden pb-1">
              <span className="ix-rise text-bone" style={{ animationDelay: '0.1s' }}>
                like an investigator
              </span>
            </span>
            <span className="block overflow-hidden pb-1">
              <span className="ix-rise" style={{ animationDelay: '0.2s' }}>
                <span className="ix-shimmer bg-gradient-to-r from-beam via-[#EAFBFF] to-beam bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(127,216,232,0.5)]">
                  would.
                </span>
              </span>
            </span>
          </h1>

          <p className="ix-fade max-w-[56ch] mt-6 text-base sm:text-lg text-bone-dim leading-relaxed" style={{ animationDelay: '0.35s' }}>
            Name an SME IPO. IPO X-Ray extracts every checkable claim from its offer document — vendors, clients, directors, addresses, revenue — and dispatches autonomous web agents to cross-examine registries, maps, tender portals and WHOIS data before you invest.
          </p>

          {/* Claim categories chips */}
          <div className="ix-fade flex flex-wrap items-center gap-2 mt-5" style={{ animationDelay: '0.45s' }}>
            <span className="text-xs font-mono text-bone-dim mr-1">Checking:</span>
            {CLAIM_CHIPS.map((c) => {
              const Icon = c.icon;
              return (
                <div
                  key={c.label}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#27435E]/80 bg-[#122232]/80 backdrop-blur-sm text-xs text-bone-dim capitalize transition-all hover:border-beam/40 hover:text-bone"
                >
                  <Icon className="w-3.5 h-3.5" style={{ color: c.color }} />
                  <span>{c.label}</span>
                </div>
              );
            })}
          </div>

          {/* Form container */}
          <form id="probe" className="ix-fade mt-8 max-w-xl" style={{ animationDelay: '0.55s' }} onSubmit={handleSubmit} noValidate>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="company" className="text-xs sm:text-sm text-bone font-medium flex items-center gap-1.5">
                <span>Enter SME Issuer Name</span>
                <span className="text-[#62788C] font-normal text-xs">(as filed on NSE/BSE)</span>
              </label>
            </div>

            {/* Glowing Search Bar */}
            <div className="group/bar relative rounded-2xl p-[1.5px] overflow-hidden shadow-[0_20px_50px_-20px_rgba(127,216,232,0.35)] transition-all duration-300">
              {/* Rotating conic gradient border */}
              <div 
                className="absolute inset-[-150%] ix-spin opacity-50 group-focus-within/bar:opacity-100 transition-opacity duration-500 [background:conic-gradient(from_0deg,transparent_0deg,#7FD8E8_80deg,transparent_160deg,transparent_240deg,#3F7FBF_310deg,transparent_360deg)]" 
                aria-hidden="true" 
              />
              <div className="relative flex flex-col sm:flex-row gap-2 bg-[#091522] rounded-[14px] p-2 border border-[#27435E]/50">
                <div className="flex items-center flex-1 min-w-0 gap-2.5 pl-3">
                  <Search className="w-5 h-5 flex-none text-bone-dim group-focus-within/bar:text-beam transition-colors" aria-hidden="true" />
                  <input
                    id="company"
                    name="company"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    autoComplete="off"
                    placeholder="e.g. Kalindi Smart Mobility Limited"
                    className="flex-1 min-w-0 bg-transparent border-0 text-bone text-base sm:text-lg px-1 py-2.5 outline-none placeholder:text-[#5F7588]"
                  />
                  {company && (
                    <button
                      type="button"
                      onClick={() => setCompany('')}
                      className="p-1 rounded-md text-bone-dim hover:text-bone hover:bg-film-2/50"
                      aria-label="Clear input"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group/btn inline-flex items-center justify-center gap-2 bg-gradient-to-r from-beam via-[#A3EAF7] to-beam bg-[length:200%_auto] hover:bg-right text-[#091724] font-bold text-sm sm:text-base px-6 py-3 rounded-xl shadow-[0_0_24px_rgba(127,216,232,0.35)] hover:shadow-[0_0_36px_rgba(127,216,232,0.6)] active:scale-[0.98] transition-all duration-300 whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-beam/70"
                  id="startBtn"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-[#091724] border-t-transparent rounded-full animate-spin" />
                      Scanning…
                    </span>
                  ) : (
                    <>
                      <span>Start investigation</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5] transition-transform duration-300 group-hover/btn:translate-x-1" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Suggestions / Sample tags */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="text-[11px] font-mono text-bone-dim">Quick fill:</span>
              {QUICK_SAMPLES.map((sampleName) => (
                <button
                  key={sampleName}
                  type="button"
                  onClick={() => setCompany(sampleName)}
                  className="px-2.5 py-1 rounded-lg text-xs font-mono text-bone-dim hover:text-bone bg-[#112130]/60 hover:bg-[#183149] border border-line/60 transition-colors"
                >
                  {sampleName.split(' ')[0]}
                </button>
              ))}
            </div>

            {/* DRHP Upload Dropzone + Sample Button */}
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <label
                className={`flex-1 flex items-center gap-3 px-4 py-3 border rounded-xl text-xs sm:text-sm cursor-pointer transition-all duration-300 ${
                  file
                    ? 'border-solid border-clear/70 bg-clear/10 text-bone shadow-[0_0_20px_rgba(143,224,174,0.15)]'
                    : isDragging
                    ? 'border-beam bg-beam/15 text-bone scale-[1.01] shadow-[0_0_30px_rgba(127,216,232,0.3)]'
                    : 'border-dashed border-[#27435E] bg-[#112130]/50 text-bone-dim hover:border-beam/60 hover:bg-beam/5 hover:text-bone'
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
                  className={`grid place-items-center w-10 h-10 flex-none rounded-xl border transition-colors ${
                    file 
                      ? 'border-clear/60 bg-clear/20 text-clear' 
                      : 'border-[#27435E] bg-[#172C40] text-beam'
                  }`}
                >
                  {file ? (
                    <FileCheck className="w-5 h-5 text-clear" />
                  ) : (
                    <UploadCloud className="w-5 h-5" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  {file ? (
                    <div className="flex items-center justify-between gap-2">
                      <div className="truncate">
                        <strong className="font-semibold text-bone block truncate">{file.name}</strong>
                        <span className="text-clear font-mono text-xs">{(file.size / 1048576).toFixed(1)} MB · Ready for agent ingestion</span>
                      </div>
                      <button
                        type="button"
                        onClick={removeFile}
                        className="p-1 rounded hover:bg-critical/20 text-critical"
                        title="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <span className="font-medium text-bone block">Attach DRHP PDF (Optional)</span>
                      <span className="text-[#6E8497] text-xs">If omitted, web agents fetch the prospectus automatically</span>
                    </div>
                  )}
                </div>
              </label>

              {/* Sample Case Trigger */}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSample}
                className="group inline-flex items-center justify-center gap-2 bg-[#122436]/80 hover:bg-[#1A334C] text-bone border border-[#27435E] hover:border-beam/50 rounded-xl px-5 py-3 text-xs sm:text-sm font-medium transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-beam/60 whitespace-nowrap"
                id="sampleBtn"
              >
                <Play className="w-4 h-4 text-beam group-hover:scale-110 transition-transform" />
                <span>Run sample case</span>
              </button>
            </div>

            {/* Error / Alert notice */}
            {formMsg && (
              <div className="mt-3.5 p-3 rounded-xl border border-medium/40 bg-medium/10 text-sm text-medium flex items-center gap-2.5 animate-fadeIn" role="alert">
                <AlertTriangle className="w-4 h-4 flex-none" />
                <span>{formMsg}</span>
              </div>
            )}
          </form>
        </div>

        {/* ───────── Right Column: Interactive DRHP Prospectus Sheet ───────── */}
        <div className="ix-fade relative" style={{ animationDelay: '0.35s' }}>
          {/* Ambient colored spotlight halo behind document */}
          <div className="pointer-events-none absolute -inset-8 rounded-[3rem] bg-gradient-to-br from-beam/20 via-[#1F3D5E]/20 to-critical/15 blur-3xl" aria-hidden="true" />

          {/* Floating Live Detection Count Pill */}
          <div className="ix-float hidden sm:flex absolute -top-5 -right-3 z-30 items-center gap-3 px-4 py-2 rounded-full border border-line bg-[#091522]/90 backdrop-blur-xl text-xs text-bone shadow-[0_12px_40px_-10px_rgba(0,0,0,0.85)]">
            <span className="relative flex w-2 h-2">
              <span className="absolute inline-flex w-full h-full rounded-full bg-critical opacity-75 animate-ping" />
              <span className="relative inline-flex w-2 h-2 rounded-full bg-critical" />
            </span>
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="text-critical font-bold">{critical} CRITICAL</span>
              <span className="text-bone-dim">·</span>
              <span className="text-high font-bold">{high} HIGH RISK</span>
            </div>
          </div>

          <div className="relative">
            {/* Multi-layered paper depth effect */}
            <div className="absolute inset-0 rounded-xl bg-paper/20 rotate-3 translate-x-3.5 translate-y-3.5 shadow-md" aria-hidden="true" />
            <div className="absolute inset-0 rounded-xl bg-paper/40 rotate-[1.5deg] translate-x-2 translate-y-2 shadow-sm" aria-hidden="true" />

            {/* The Forensic Prospectus Sheet */}
            <div className="relative overflow-hidden bg-paper text-ink rounded-xl p-6 sm:p-9 font-['Source_Serif_4'] text-sm sm:text-base leading-relaxed shadow-[0_0_0_1px_rgba(127,216,232,0.25),0_0_80px_-15px_rgba(127,216,232,0.35),0_40px_90px_-25px_rgba(0,0,0,0.85)] -rotate-1 transition-transform hover:rotate-0 duration-500">
              {/* Cyan top scanner border highlight */}
              <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-transparent via-beam to-transparent" aria-hidden="true" />

              {/* Watermark */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.035] -rotate-45 select-none font-['Bricolage_Grotesque'] text-7xl font-black uppercase text-ink">
                DRHP ARCHIVE
              </div>

              {/* Sheet Header */}
              <header className="flex justify-between items-center font-['Bricolage_Grotesque'] text-xs text-ink-dim border-b border-[#CBD0C6] pb-3 mb-4">
                <span className="font-mono tracking-wider font-semibold text-[#3D4C59]">
                  DRAFT RED HERRING PROSPECTUS
                </span>
                <span className="px-2 py-0.5 rounded bg-ink/5 border border-ink/10 font-mono text-[11px]">
                  PAGE 142
                </span>
              </header>

              <h2 className="text-xl sm:text-2xl font-bold mb-2.5 tracking-tight font-['Source_Serif_4'] text-[#0D1824]">
                Our business
              </h2>
              <p>
                Our Company designs and installs intelligent traffic management systems for urban bodies. We procure controllers and sensors primarily from{' '}
                <Mark id={1} sev="critical" activeId={activeId} setActiveId={setActiveId}>
                  Vyom Signal Technologies Private Limited
                </Mark>
                , which accounted for 61.4% of total purchases in FY2025.
              </p>

              <p className="mt-3">
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

              <p className="mt-3">
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

              <h3 className="text-lg font-bold mt-4 mb-1.5 font-['Source_Serif_4'] text-[#0D1824]">
                Our management
              </h3>
              <p>
                <Mark id={6} sev="critical" activeId={activeId} setActiveId={setActiveId}>
                  Mr. Rakesh Vardhan
                </Mark>
                , Managing Director and Promoter, has over 15 years of experience in infrastructure projects.
              </p>

              {/* Laser Scanning Beam */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
                <div className="ix-scan absolute left-[-15%] right-[-15%] h-[90px] mix-blend-multiply bg-gradient-to-b from-transparent via-beam/35 to-transparent">
                  <div className="absolute left-0 right-0 top-1/2 h-[2px] bg-[#2EAECA] shadow-[0_0_18px_4px_rgba(127,216,232,0.9)]" />
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Red Flag Callouts */}
          <ul className="relative grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8 list-none p-0">
            {SAMPLE_MARKS.map((m) => {
              const color = SEV_HEX[m.sev];
              const isActive = activeId === m.id;
              return (
                <li
                  key={m.id}
                  onMouseEnter={() => setActiveId(m.id)}
                  onMouseLeave={() => setActiveId(null)}
                  className={`group relative overflow-hidden text-xs leading-snug pl-3.5 pr-3 py-3 rounded-xl border border-l-4 bg-[#112130]/75 backdrop-blur-md transition-all duration-300 cursor-pointer ${
                    isActive 
                      ? 'bg-[#183149] -translate-y-1 shadow-[0_16px_35px_-12px_rgba(0,0,0,0.8)] scale-[1.02]' 
                      : 'border-line/70 hover:border-beam/40 hover:bg-[#14293D]'
                  }`}
                  style={{
                    borderLeftColor: color,
                    borderColor: isActive ? color : undefined,
                    boxShadow: isActive ? `0 14px 35px -12px ${color}88` : undefined,
                  }}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <strong
                      className="flex items-center gap-1.5 uppercase font-mono tracking-wider text-[10px] font-bold"
                      style={{ color }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }} />
                      {m.sev}
                    </strong>
                    <span className="text-[10px] font-mono text-bone-dim uppercase">
                      {m.category}
                    </span>
                  </div>
                  <p className="text-bone text-[12px] leading-snug">{m.note}</p>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center justify-between text-xs text-[#6E8497] mt-4 font-mono">
            <span>* Simulated case based on typical SME prospectus findings.</span>
            <span>Kalindi Smart Mobility</span>
          </div>
        </div>
      </div>
    </section>
  );
}