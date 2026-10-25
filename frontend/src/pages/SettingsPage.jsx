import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SECTORS } from '../data/ipoCatalog';
import { 
  SlidersHorizontal, 
  Shield, 
  Clock, 
  Landmark, 
  Check, 
  ChevronRight, 
  Bell, 
  Save,
  CheckCircle2
} from 'lucide-react';

const HORIZONS = [
  { id: 'Short (Listing Gains)', label: 'Listing Day Gains', desc: 'Prioritize high Day-1 demand and GMP momentum.' },
  { id: 'Medium (6-18 Months)', label: 'Medium-Term Growth', desc: 'Hold until post-listing order book conversions materialize.' },
  { id: 'Long-term Compounder (3+ Years)', label: 'Long-term Compounder', desc: 'Target established sector leaders with high RoNW and low debt.' }
];

const RISK_PROFILES = [
  { id: 'Conservative (Only Clean Mainboard)', label: 'Conservative Mandate', desc: 'Strict governance filter. Zero tolerance for promoter-vendor anomalies.' },
  { id: 'Balanced (Calculated SME & Growth)', label: 'Balanced Mandate', desc: 'Mix of institutional Mainboard and audited, verified SME issues.' },
  { id: 'Aggressive (High-Growth SME)', label: 'Aggressive / High Growth', desc: 'Comfortable with early-stage SME volatility provided unit margins hold.' }
];

export default function SettingsPage() {
  const { preferences, updatePreferences } = useAuth();
  const [horizon, setHorizon] = useState(preferences.investmentHorizon || 'Medium (6-18 Months)');
  const [risk, setRisk] = useState(preferences.riskTolerance || 'Balanced (Calculated SME & Growth)');
  const [selectedSectors, setSelectedSectors] = useState(preferences.preferredSectors || []);
  const [dpId, setDpId] = useState(preferences.dematDetails?.dpId || '1208160004821932');
  const [upiId, setUpiId] = useState(preferences.dematDetails?.upiId || 'investor@oksbi');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const toggleSector = (sec) => {
    if (sec === 'All Sectors') return;
    setSelectedSectors((prev) => 
      prev.includes(sec) ? prev.filter((s) => s !== sec) : [...prev, sec]
    );
  };

  const handleSave = (e) => {
    e.preventDefault();
    updatePreferences({
      investmentHorizon: horizon,
      riskTolerance: risk,
      preferredSectors: selectedSectors,
      dematDetails: {
        dpName: 'Primary Broker (CDSL/NSDL)',
        dpId,
        beneficiaryId: '04821932',
        upiId
      }
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[11px] font-mono text-[#888888]">
        <Link to="/" className="hover:text-[#D4AF37] no-underline">Home</Link>
        <ChevronRight className="w-3 h-3 text-[#444444]" />
        <Link to="/dashboard" className="hover:text-[#D4AF37] no-underline">Dashboard</Link>
        <ChevronRight className="w-3 h-3 text-[#444444]" />
        <span className="text-white font-medium">Investor Mandate</span>
      </div>

      <div className="flex items-center justify-between pb-5 border-b border-[#1A1A1A]">
        <div>
          <span className="text-[10px] font-mono text-[#D4AF37] uppercase tracking-wider block font-semibold">Desk Calibration</span>
          <h1 className="text-xl sm:text-2xl font-bold text-white font-['Cinzel']">
            Investor Mandate & Risk Calibration
          </h1>
          <p className="text-xs text-[#888888] mt-1 font-sans">
            Calibrate algorithmic screening filters, default lot sizes, and notification thresholds.
          </p>
        </div>

        {savedSuccess && (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/35 text-xs font-semibold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            Mandate Saved
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Horizon */}
        <div className="p-6 rounded-2xl bg-[#080808] border border-[#1A1A1A] shadow-xl shadow-black">
          <label className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider mb-3.5">
            <Clock className="w-4 h-4 text-[#D4AF37]" />
            Investment Horizon
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {HORIZONS.map((h) => {
              const active = horizon === h.id;
              return (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => setHorizon(h.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    active
                      ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-white shadow-[0_0_15px_rgba(212,175,55,0.18)]'
                      : 'bg-[#050505] border-[#1A1A1A] text-[#888888] hover:text-white hover:border-[#2A2A2A]'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-bold text-white">{h.label}</span>
                    {active && <Check className="w-3.5 h-3.5 text-[#D4AF37]" />}
                  </div>
                  <p className="text-[11px] opacity-75 font-sans leading-relaxed">{h.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Risk Mandate */}
        <div className="p-6 rounded-2xl bg-[#080808] border border-[#1A1A1A] shadow-xl shadow-black">
          <label className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider mb-3.5">
            <Shield className="w-4 h-4 text-[#D4AF37]" />
            Risk Mandate & Tolerance
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {RISK_PROFILES.map((r) => {
              const active = risk === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRisk(r.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    active
                      ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-white shadow-[0_0_15px_rgba(212,175,55,0.18)]'
                      : 'bg-[#050505] border-[#1A1A1A] text-[#888888] hover:text-white hover:border-[#2A2A2A]'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-bold text-white">{r.label}</span>
                    {active && <Check className="w-3.5 h-3.5 text-[#D4AF37]" />}
                  </div>
                  <p className="text-[11px] opacity-75 font-sans leading-relaxed">{r.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Focus Sectors */}
        <div className="p-6 rounded-2xl bg-[#080808] border border-[#1A1A1A] shadow-xl shadow-black">
          <label className="flex items-center justify-between text-xs font-bold text-white uppercase tracking-wider mb-3.5">
            <span className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#D4AF37]" />
              Focus Sectors
            </span>
            <span className="text-[11px] font-mono text-[#D4AF37] font-semibold">{selectedSectors.length} active</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {SECTORS.filter((s) => s !== 'All Sectors').map((sec) => {
              const active = selectedSectors.includes(sec);
              return (
                <button
                  key={sec}
                  type="button"
                  onClick={() => toggleSector(sec)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    active
                      ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#F5E59F]'
                      : 'bg-[#050505] border-[#1A1A1A] text-[#888888] hover:text-white hover:border-[#2A2A2A]'
                  }`}
                >
                  {sec}
                </button>
              );
            })}
          </div>
        </div>

        {/* Demat Details */}
        <div className="p-6 rounded-2xl bg-[#080808] border border-[#1A1A1A] space-y-3.5 shadow-xl shadow-black">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
            <Landmark className="w-4 h-4 text-[#D4AF37]" />
            Default ASBA Coordinates (Local Cache)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] text-[#888888] mb-1 font-medium font-sans">DP ID / Demat Number</label>
              <input
                type="text"
                value={dpId}
                onChange={(e) => setDpId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#050505] border border-[#202020] text-white text-xs font-mono focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#888888] mb-1 font-medium font-sans">Default UPI ID</label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#050505] border border-[#202020] text-white text-xs font-mono focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="btn-gold px-7 py-3 rounded-xl text-xs font-bold text-black flex items-center gap-2 transition-all cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Save Preferences</span>
        </button>
      </form>
    </div>
  );
}
