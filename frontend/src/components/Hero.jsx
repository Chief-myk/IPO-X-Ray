import React, { useState, useRef, useEffect } from 'react';

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

const SEV_COLOR_CLASSES = {
  critical: 'bg-critical/20 text-critical border-critical/50 shadow-[inset_0_-2px_0_#FF5A4E]',
  high: 'bg-high/20 text-high border-high/50 shadow-[inset_0_-2px_0_#FF8A3D]',
  medium: 'bg-medium/20 text-medium border-medium/50 shadow-[inset_0_-2px_0_#D69A12]',
  clear: 'bg-clear/20 text-clear border-clear/50 shadow-[inset_0_-2px_0_#3E9E66]',
};

export default function Hero({ onStart, isLive, isSubmitting }) {
  const [company, setCompany] = useState('');
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [formMsg, setFormMsg] = useState('');
  const [beamPos, setBeamPos] = useState(0);
  const fileInputRef = useRef(null);

  // Scanning animation for the DRHP sheet
  useEffect(() => {
    let forward = true;
    const interval = setInterval(() => {
      setBeamPos((prev) => {
        if (prev >= 92) forward = false;
        if (prev <= 0) forward = true;
        return forward ? prev + 0.6 : prev - 0.6;
      });
    }, 25);
    return () => clearInterval(interval);
  }, []);

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
    <section className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-8 lg:gap-16 items-center px-4 md:px-12 py-12 lg:py-24 max-w-[1440px] mx-auto min-h-[calc(100svh-65px)]" id="top">
      {/* Left Column: Copy & Probe Form */}
      <div>
        <h1 className="text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-extrabold tracking-tight leading-[0.92] font-['Bricolage_Grotesque']">
          <span className="block overflow-hidden pb-1">
            <span>Read the prospectus</span>
          </span>
          <span className="block overflow-hidden pb-1">
            <span>like an investigator</span>
          </span>
          <span className="block overflow-hidden pb-1 text-beam">
            <span>would.</span>
          </span>
        </h1>

        <p className="max-w-[54ch] mt-7 text-base sm:text-lg text-bone-dim leading-relaxed">
          Name an SME IPO. IPO X-Ray pulls every checkable claim out of its offer document — vendors, clients, directors, addresses, revenue — and sends a web agent after each one. You get a red-flag report with sources before you put money in.
        </p>

        <form id="probe" className="mt-9 max-w-xl" onSubmit={handleSubmit} noValidate>
          <label htmlFor="company" className="block text-sm text-bone-dim mb-2 font-medium">
            Company name
          </label>
          <div className="flex flex-col sm:flex-row gap-2.5 bg-film-2 border border-line rounded-2xl p-1.5 focus-within:border-beam transition-colors">
            <input
              id="company"
              name="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              autoComplete="off"
              placeholder="e.g. the name on the IPO application"
              className="flex-1 min-w-0 bg-transparent border-0 text-bone text-base sm:text-lg px-3 py-2.5 outline-none placeholder:text-[#62788C]"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-beam hover:bg-[#A3E6F1] active:scale-[0.98] text-[#0A2230] font-semibold text-sm sm:text-base px-5 py-3 rounded-xl transition-all whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
              id="startBtn"
            >
              {isSubmitting ? 'Starting…' : 'Start investigation'}
            </button>
          </div>

          <div className="flex flex-wrap gap-2.5 mt-2.5">
            <label
              className={`flex-1 min-w-[240px] flex items-center gap-2.5 px-3.5 py-2.5 border rounded-xl text-xs sm:text-sm cursor-pointer transition-colors ${
                file
                  ? 'border-solid border-clear text-bone'
                  : isDragging
                  ? 'border-beam bg-beam/5 text-bone'
                  : 'border-dashed border-line text-bone-dim hover:border-beam hover:text-bone'
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
              <svg viewBox="0 0 24 24" className="w-5 h-5 flex-none fill-none stroke-current stroke-[1.6]">
                <path d="M7 3h7l5 5v13H7z M14 3v5h5" />
              </svg>
              <span>
                {file ? (
                  <>
                    <strong className="font-medium">{file.name}</strong>{' '}
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
              className="bg-transparent hover:border-bone-dim text-bone border border-line rounded-xl px-4 py-2.5 text-xs sm:text-sm transition-colors"
              id="sampleBtn"
            >
              Run the sample case
            </button>
          </div>

          {formMsg && (
            <p className="min-h-[1.4em] mt-3 text-sm text-medium" role="alert">
              {formMsg}
            </p>
          )}
        </form>
      </div>

      {/* Right Column: Lightbox + DRHP Sheet Preview */}
      <div className="relative lg:pr-12">
        <div className="relative overflow-hidden bg-paper text-ink rounded p-6 sm:p-9 font-['Source_Serif_4'] text-sm sm:text-base leading-relaxed shadow-[0_0_0_1px_rgba(127,216,232,0.12),0_40px_90px_-30px_rgba(0,0,0,0.65)] -rotate-1 transition-transform hover:rotate-0 duration-300">
          {/* Sheet Header */}
          <header className="flex justify-between font-['Bricolage_Grotesque'] text-xs text-ink-dim border-b border-[#CBD0C6] pb-2.5 mb-4">
            <span>Draft Red Herring Prospectus</span>
            <span>Page 142</span>
          </header>

          <h2 className="text-xl sm:text-2xl font-semibold mb-2.5 tracking-tight font-['Source_Serif_4']">Our business</h2>
          <p>
            Our Company designs and installs intelligent traffic management systems for urban bodies. We procure controllers and sensors primarily from{' '}
            <mark className={`px-1 py-0.5 rounded ${SEV_COLOR_CLASSES.critical}`}>
              Vyom Signal Technologies Private Limited
            </mark>
            , which accounted for 61.4% of total purchases in FY2025.
          </p>

          <p className="mt-2.5">
            Our major customers include{' '}
            <mark className={`px-1 py-0.5 rounded ${SEV_COLOR_CLASSES.medium}`}>
              Northern Metro Transit Corporation
            </mark>{' '}
            and{' '}
            <mark className={`px-1 py-0.5 rounded ${SEV_COLOR_CLASSES.clear}`}>
              Yamuna Urban Roads Authority
            </mark>
            , together contributing 55% of revenue from operations.
          </p>

          <p className="mt-2.5">
            Revenue from operations rose to{' '}
            <mark className={`px-1 py-0.5 rounded ${SEV_COLOR_CLASSES.high}`}>
              ₹48.6 crore
            </mark>{' '}
            in FY2025 from ₹11.2 crore in FY2024. Our registered office is situated at{' '}
            <mark className={`px-1 py-0.5 rounded ${SEV_COLOR_CLASSES.high}`}>
              Plot 14, Sector 9, Kalindi Industrial Estate, Delhi
            </mark>
            .
          </p>

          <h3 className="text-lg font-semibold mt-4 mb-1.5 font-['Source_Serif_4']">Our management</h3>
          <p>
            <mark className={`px-1 py-0.5 rounded ${SEV_COLOR_CLASSES.critical}`}>
              Mr. Rakesh Vardhan
            </mark>
            , Managing Director and Promoter, has over 15 years of experience in infrastructure projects.
          </p>

          {/* Animated Laser Beam */}
          <div
            className="absolute left-[-10%] right-[-10%] h-[75px] pointer-events-none transition-all duration-75 mix-blend-multiply bg-gradient-to-b from-transparent via-beam/40 to-transparent"
            style={{ top: `${beamPos}%` }}
          >
            <div className="absolute left-0 right-0 top-1/2 h-[2px] bg-[#3FB6CC] shadow-[0_0_16px_4px_rgba(127,216,232,0.8)]" />
          </div>
        </div>

        {/* Gutter Callouts */}
        <div className="hidden xl:block absolute top-0 -right-28 w-48 space-y-3.5">
          {SAMPLE_MARKS.map((m) => (
            <div
              key={m.id}
              className="text-xs leading-tight text-bone pl-3 relative border-l-2"
              style={{
                borderColor:
                  m.sev === 'critical'
                    ? '#FF5A4E'
                    : m.sev === 'high'
                    ? '#FF8A3D'
                    : m.sev === 'medium'
                    ? '#FFC23D'
                    : '#8FE0AE',
              }}
            >
              <strong
                className="block uppercase tracking-wider text-[10px] mb-0.5"
                style={{
                  color:
                    m.sev === 'critical'
                      ? '#FF5A4E'
                      : m.sev === 'high'
                      ? '#FF8A3D'
                      : m.sev === 'medium'
                      ? '#FFC23D'
                      : '#8FE0AE',
                }}
              >
                {m.sev}
              </strong>
              {m.note}
            </div>
          ))}
        </div>

        <p className="mt-4 text-xs text-[#6E8497]">Sample case. Kalindi Smart Mobility Limited is fictional.</p>
      </div>
    </section>
  );
}
