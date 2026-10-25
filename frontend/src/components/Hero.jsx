import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Play,
  Compass
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
  critical: '#EF4444',
  high: '#F59E0B',
  medium: '#D4AF37',
  clear: '#10B981',
};

const SEV_COLOR_CLASSES = {
  critical: 'bg-rose-500/20 hover:bg-rose-500/35 text-rose-400 border-rose-500/50 shadow-[inset_0_-2px_0_#EF4444]',
  high: 'bg-amber-500/20 hover:bg-amber-500/35 text-amber-400 border-amber-500/50 shadow-[inset_0_-2px_0_#F59E0B]',
  medium: 'bg-[#D4AF37]/20 hover:bg-[#D4AF37]/35 text-[#F5E59F] border-[#D4AF37]/50 shadow-[inset_0_-2px_0_#D4AF37]',
  clear: 'bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-400 border-emerald-500/50 shadow-[inset_0_-2px_0_#10B981]',
};

const CLAIM_CHIPS = [
  { label: 'vendors', color: '#EF4444', icon: Building2 },
  { label: 'clients', color: '#D4AF37', icon: Briefcase },
  { label: 'directors', color: '#F59E0B', icon: UserCheck },
  { label: 'addresses', color: '#F5E59F', icon: MapPin },
  { label: 'revenue', color: '#10B981', icon: TrendingUp },
];

const QUICK_SAMPLES = [
  'Kalindi Smart Mobility Limited',
  'Trafiksol ITS Technologies',
  'Resourceful Automobile'
];

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
          ? 'ring-2 ring-current ring-offset-2 ring-offset-[#0A0A0A] scale-[1.03] shadow-md' 
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

  const handleMouseMove = (e) => {
    const el = sectionRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  };

  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = company.trim();
    if (trimmed) {
      navigate(`/dashboard?q=${encodeURIComponent(trimmed)}`);
    } else {
      navigate('/dashboard');
    }
  };

  const handleSample = () => {
    setFormMsg('');
    if (onStart) {
      onStart({ company: '', file: null, demo: true });
    } else {
      navigate('/dashboard');
    }
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
    } else if (dropped) {
      setFormMsg('Please drop a valid DRHP PDF.');
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
      className="relative isolate overflow-hidden pb-16 pt-4 lg:pb-20"
      id="top"
    >
      <style>{HERO_CSS}</style>

      {/* Ambient Background: Luxury Gold Spotlight Auroras on Pure Black */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 left-[10%] w-[45rem] h-[45rem] rounded-full bg-[#D4AF37]/[0.06] blur-[150px]" />
        <div className="absolute top-1/4 right-[-5%] w-[40rem] h-[40rem] rounded-full bg-[#8F7322]/[0.08] blur-[150px]" />
        <div className="absolute bottom-[-10rem] left-1/3 w-[32rem] h-[32rem] rounded-full bg-rose-500/[0.04] blur-[140px]" />
        
        {/* Subtle geometric dot grid */}
        <div className="absolute inset-0 bg-dots-fintech opacity-30 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
        
        {/* Dynamic cursor spotlight glow */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(580px circle at var(--mx, 65%) var(--my, 30%), rgba(212,175,55,0.08), transparent 60%)',
          }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-14 items-center px-4 sm:px-6 lg:px-8 max-w-[1480px] mx-auto min-h-[calc(100svh-90px)]">
        {/* Left Column: Headlines & Form */}
        <div className="relative z-10 flex flex-col justify-center">
          {/* Market Intelligence Ticker Badge */}
          <div className="ix-fade inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#D4AF37]/30 bg-[#0A0A0A]/80 backdrop-blur-md text-xs text-[#F5E59F] mb-6 w-fit shadow-[0_0_20px_rgba(212,175,55,0.15)]">
            <span className="relative flex w-2 h-2">
              <span className="absolute inline-flex w-full h-full rounded-full bg-[#D4AF37] opacity-75 animate-ping" />
              <span className="relative inline-flex w-2 h-2 rounded-full bg-[#D4AF37]" />
            </span>
            <span className="font-mono font-medium tracking-wide">
              NSE · BSE SME OFFER DOCUMENT INVESTIGATOR
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.0] font-['Cinzel']">
            <span className="block overflow-hidden pb-1">
              <span className="ix-rise text-white">Read the prospectus</span>
            </span>
            <span className="block overflow-hidden pb-1">
              <span className="ix-rise text-white" style={{ animationDelay: '0.1s' }}>
                like an investigator
              </span>
            </span>
            <span className="block overflow-hidden pb-1">
              <span className="ix-rise" style={{ animationDelay: '0.2s' }}>
                <span className="ix-shimmer bg-gradient-to-r from-white via-[#F5E59F] to-[#D4AF37] bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(212,175,55,0.35)]">
                  would.
                </span>
              </span>
            </span>
          </h1>

          <p className="ix-fade max-w-[56ch] mt-6 text-base sm:text-lg text-[#888888] leading-relaxed font-sans" style={{ animationDelay: '0.35s' }}>
            Name an SME IPO. IPO X-Ray 360 extracts checkable disclosures from the offer document — vendors, clients, directors, physical sites, revenue — and dispatches autonomous agents to cross-examine registries, maps, and tender records before you commit capital.
          </p>

          {/* Claim categories chips */}
          <div className="ix-fade flex flex-wrap items-center gap-2 mt-5" style={{ animationDelay: '0.45s' }}>
            <span className="text-xs font-mono text-[#888888] mr-1">Checking:</span>
            {CLAIM_CHIPS.map((c) => {
              const Icon = c.icon;
              return (
                <div
                  key={c.label}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#222222] bg-[#0A0A0A] backdrop-blur-sm text-xs text-[#888888] capitalize transition-all hover:border-[#D4AF37]/50 hover:text-white"
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
              <label htmlFor="company" className="text-xs sm:text-sm text-white font-semibold flex items-center gap-1.5">
                <span>Enter SME Issuer Name</span>
                <span className="text-[#666666] font-normal text-xs">(as filed on NSE/BSE)</span>
              </label>
            </div>

            {/* Glowing Search Bar */}
            <div className="group/bar relative rounded-2xl p-[1.5px] overflow-hidden shadow-[0_20px_50px_-20px_rgba(212,175,55,0.25)] transition-all duration-300">
              <div 
                className="absolute inset-[-150%] ix-spin opacity-40 group-focus-within/bar:opacity-100 transition-opacity duration-500 [background:conic-gradient(from_0deg,transparent_0deg,#D4AF37_80deg,transparent_160deg,transparent_240deg,#996515_310deg,transparent_360deg)]" 
                aria-hidden="true" 
              />
              <div className="relative flex flex-col sm:flex-row gap-2 bg-[#080808] rounded-[14px] p-2 border border-[#222222]">
                <div className="flex items-center flex-1 min-w-0 gap-2.5 pl-3">
                  <Search className="w-5 h-5 flex-none text-[#888888] group-focus-within/bar:text-[#D4AF37] transition-colors" aria-hidden="true" />
                  <input
                    id="company"
                    name="company"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    autoComplete="off"
                    placeholder="e.g. Kalindi Smart Mobility Limited"
                    className="flex-1 min-w-0 bg-transparent border-0 text-white text-base sm:text-lg px-1 py-2.5 outline-none placeholder:text-[#555555]"
                  />
                  {company && (
                    <button
                      type="button"
                      onClick={() => setCompany('')}
                      className="p-1 rounded-md text-[#888888] hover:text-white hover:bg-white/[0.05]"
                      aria-label="Clear input"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-gold group/btn inline-flex items-center justify-center gap-2 text-black font-bold text-sm sm:text-base px-6 py-3 rounded-xl transition-all duration-300 whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/70"
                  id="startBtn"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
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

            {/* Quick Suggestions & Direct Dashboard Action */}
            <div className="flex flex-wrap items-center justify-between gap-3 mt-3.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-mono text-[#888888]">Quick fill:</span>
                {QUICK_SAMPLES.map((sampleName) => (
                  <button
                    key={sampleName}
                    type="button"
                    onClick={() => {
                      setCompany(sampleName);
                    }}
                    className="px-3 py-1 rounded-lg text-xs font-mono text-[#888888] hover:text-[#F5E59F] bg-[#0A0A0A] hover:bg-[#141414] border border-[#1E1E1E] transition-colors cursor-pointer"
                  >
                    {sampleName.split(' ')[0]}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-[#D4AF37] hover:text-[#F5E59F] transition-colors cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Explore all IPOs on Dashboard →</span>
              </button>
            </div>

            {/* DRHP Upload Dropzone + Sample Button */}
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <label
                className={`flex-1 flex items-center gap-3 px-4 py-3 border rounded-2xl text-xs sm:text-sm cursor-pointer transition-all duration-300 ${
                  file
                    ? 'border-solid border-emerald-500/70 bg-emerald-500/10 text-white shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                    : isDragging
                    ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-white scale-[1.01] shadow-[0_0_30px_rgba(212,175,55,0.3)]'
                    : 'border-dashed border-[#222222] bg-[#0A0A0A] text-[#888888] hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/5 hover:text-white'
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
                      ? 'border-emerald-500/60 bg-emerald-500/20 text-emerald-400' 
                      : 'border-[#222222] bg-[#121212] text-[#D4AF37]'
                  }`}
                >
                  {file ? (
                    <FileCheck className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <UploadCloud className="w-5 h-5" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  {file ? (
                    <div className="flex items-center justify-between gap-2">
                      <div className="truncate">
                        <strong className="font-semibold text-white block truncate">{file.name}</strong>
                        <span className="text-emerald-400 font-mono text-xs">{(file.size / 1048576).toFixed(1)} MB · Ready for agent ingestion</span>
                      </div>
                      <button
                        type="button"
                        onClick={removeFile}
                        className="p-1 rounded hover:bg-rose-500/20 text-rose-400"
                        title="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <span className="font-semibold text-white block">Attach DRHP PDF (Optional)</span>
                      <span className="text-[#666666] text-xs">If omitted, web agents fetch the prospectus automatically</span>
                    </div>
                  )}
                </div>
              </label>

              {/* Sample Case Trigger */}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSample}
                className="group inline-flex items-center justify-center gap-2 bg-[#0A0A0A] hover:bg-[#141414] text-white border border-[#222222] hover:border-[#D4AF37]/50 rounded-2xl px-5 py-3 text-xs sm:text-sm font-semibold transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/60 whitespace-nowrap"
                id="sampleBtn"
              >
                <Play className="w-4 h-4 text-[#D4AF37] group-hover:scale-110 transition-transform" />
                <span>Run sample case</span>
              </button>
            </div>

            {/* Error / Alert notice */}
            {formMsg && (
              <div className="mt-3.5 p-3 rounded-xl border border-amber-500/40 bg-amber-500/10 text-sm text-amber-300 flex items-center gap-2.5 animate-fadeIn" role="alert">
                <AlertTriangle className="w-4 h-4 flex-none" />
                <span>{formMsg}</span>
              </div>
            )}
          </form>
        </div>

        {/* Right Column: Interactive DRHP Prospectus Sheet */}
        <div className="ix-fade relative" style={{ animationDelay: '0.35s' }}>
          <div className="pointer-events-none absolute -inset-8 rounded-[3rem] bg-gradient-to-br from-[#D4AF37]/15 via-[#8F7322]/10 to-rose-500/10 blur-3xl" aria-hidden="true" />

          {/* Floating Detection Count Pill */}
          <div className="ix-float hidden sm:flex absolute -top-5 -right-3 z-30 items-center gap-3 px-4 py-2 rounded-full border border-[#222222] bg-[#0A0A0A]/90 backdrop-blur-xl text-xs text-white shadow-[0_12px_40px_rgba(0,0,0,0.85)]">
            <span className="relative flex w-2 h-2">
              <span className="absolute inline-flex w-full h-full rounded-full bg-rose-500 opacity-75 animate-ping" />
              <span className="relative inline-flex w-2 h-2 rounded-full bg-rose-500" />
            </span>
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="text-rose-400 font-bold">{critical} CRITICAL</span>
              <span className="text-[#666666]">·</span>
              <span className="text-amber-400 font-bold">{high} HIGH RISK</span>
            </div>
          </div>

          <div className="relative">
            {/* The Forensic Prospectus Sheet */}
            <div className="relative overflow-hidden bg-[#0A0A0A] text-[#EEEEEE] border border-[#222222] rounded-2xl p-6 sm:p-9 font-['Source_Serif_4'] text-sm sm:text-base leading-relaxed shadow-[0_0_0_1px_rgba(212,175,55,0.2),0_0_70px_-15px_rgba(212,175,55,0.25),0_40px_90px_rgba(0,0,0,0.95)] -rotate-1 transition-transform hover:rotate-0 duration-500">
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" aria-hidden="true" />

              <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.035] -rotate-45 select-none font-['Cinzel'] text-7xl font-black uppercase text-white">
                DRHP ARCHIVE
              </div>

              {/* Sheet Header */}
              <header className="flex justify-between items-center text-xs text-[#888888] border-b border-[#1A1A1A] pb-3 mb-4">
                <span className="font-mono tracking-wider font-semibold text-[#AAAAAA]">
                  DRAFT RED HERRING PROSPECTUS
                </span>
                <span className="px-2 py-0.5 rounded bg-white/[0.05] border border-white/[0.08] font-mono text-[11px] text-[#D4AF37]">
                  PAGE 142
                </span>
              </header>

              <h2 className="text-xl sm:text-2xl font-bold mb-2.5 tracking-tight font-['Cinzel'] text-white">
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

              <h3 className="text-lg font-bold mt-4 mb-1.5 font-['Cinzel'] text-white">
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
                <div className="ix-scan absolute left-[-15%] right-[-15%] h-[90px] mix-blend-screen bg-gradient-to-b from-transparent via-[#D4AF37]/25 to-transparent">
                  <div className="absolute left-0 right-0 top-1/2 h-[2px] bg-[#D4AF37] shadow-[0_0_18px_4px_rgba(212,175,55,0.8)]" />
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
                  className={`group relative overflow-hidden text-xs leading-snug pl-3.5 pr-3 py-3 rounded-xl border border-l-4 bg-[#080808] backdrop-blur-md transition-all duration-300 cursor-pointer ${
                    isActive 
                      ? 'bg-[#121212] -translate-y-1 shadow-[0_16px_35px_-12px_rgba(0,0,0,0.9)] scale-[1.02]' 
                      : 'border-[#1C1C1C] hover:border-[#D4AF37]/40 hover:bg-[#0E0E0E]'
                  }`}
                  style={{
                    borderLeftColor: color,
                    borderColor: isActive ? color : undefined,
                    boxShadow: isActive ? `0 14px 35px -12px ${color}66` : undefined,
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
                    <span className="text-[10px] font-mono text-[#888888] uppercase">
                      {m.category}
                    </span>
                  </div>
                  <p className="text-white text-[12px] leading-snug font-sans">{m.note}</p>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center justify-between text-xs text-[#666666] mt-4 font-mono">
            <span>* Simulated case based on verified SME prospectus findings.</span>
            <span>Kalindi Smart Mobility</span>
          </div>
        </div>
      </div>
    </section>
  );
}
