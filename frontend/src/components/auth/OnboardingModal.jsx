import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { SECTORS } from '../../data/ipoCatalog';
import { X, Check, Compass, Shield, Clock, Landmark, ArrowRight, Lock } from 'lucide-react';

const HORIZONS = [
  { id: 'Short (Listing Gains)', label: 'Listing Day Gains', desc: 'Focus on GMP, Day-1 demand, and high subscription momentum.' },
  { id: 'Medium (6-18 Months)', label: 'Medium-Term Growth', desc: 'Allow operational order books and stated proceeds to reflect in quarterly earnings.' },
  { id: 'Long-term Compounder (3+ Years)', label: 'Long-term Compounder', desc: 'Target fundamental market leaders with robust governance and deep moats.' }
];

const RISK_PROFILES = [
  { id: 'Conservative (Only Clean Mainboard)', label: 'Conservative', desc: 'Strict governance filter. Zero tolerance for promoter-vendor anomalies or SME issues.' },
  { id: 'Balanced (Calculated SME & Growth)', label: 'Balanced', desc: 'Mix of established Mainboard and verified SME issues with clean audit checks.' },
  { id: 'Aggressive (High-Growth SME)', label: 'Aggressive / High Growth', desc: 'Comfortable with early-stage SME risks, provided unit economics check out.' }
];

const FOCUS = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/70';
const INPUT =
  'w-full px-3.5 py-2.5 rounded-xl bg-[#080808] border border-[#222222] text-white text-xs font-mono hover:border-[#333333] focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/25 transition-all';

function Legend({ icon: Icon, children, aside }) {
  return (
    <legend className="flex w-full items-center justify-between mb-3 p-0">
      <span className="flex items-center gap-2 text-xs font-bold text-white tracking-wide">
        <Icon className="w-3.5 h-3.5 text-[#D4AF37]" />
        {children}
      </span>
      {aside}
    </legend>
  );
}

function OptionCard({ option, active, onSelect }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={() => onSelect(option.id)}
      className={`relative p-3.5 rounded-2xl border text-left transition-all ${FOCUS} ${
        active
          ? 'bg-[#D4AF37]/12 border-[#D4AF37] text-white shadow-[0_0_20px_rgba(212,175,55,0.18)]'
          : 'bg-[#080808] border-[#202020] text-[#888888] hover:border-[#333333] hover:text-white'
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-xs font-bold text-white">{option.label}</span>
        <span
          className={`grid place-items-center w-4 h-4 rounded-full border flex-none transition-colors ${
            active ? 'bg-[#D4AF37] border-[#D4AF37]' : 'border-[#333333]'
          }`}
        >
          {active && <Check className="w-2.5 h-2.5 text-black" strokeWidth={3} />}
        </span>
      </div>
      <p className="text-[11px] leading-relaxed opacity-80">{option.desc}</p>
    </button>
  );
}

export default function OnboardingModal() {
  const { isOnboardingOpen, setIsOnboardingOpen, preferences, updatePreferences } = useAuth();

  const [horizon, setHorizon] = useState(preferences.investmentHorizon || 'Medium (6-18 Months)');
  const [risk, setRisk] = useState(preferences.riskTolerance || 'Balanced (Calculated SME & Growth)');
  const [selectedSectors, setSelectedSectors] = useState(preferences.preferredSectors || []);
  const [dpId, setDpId] = useState(preferences.dematDetails?.dpId || '12081600');
  const [upiId, setUpiId] = useState(preferences.dematDetails?.upiId || 'investor@oksbi');
  const [enableSme, setEnableSme] = useState(preferences.enableSme ?? true);

  const close = () => setIsOnboardingOpen(false);

  useEffect(() => {
    if (!isOnboardingOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setIsOnboardingOpen(false); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [isOnboardingOpen, setIsOnboardingOpen]);

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
      preferredSectors: selectedSectors.length > 0 ? selectedSectors : ['Solar PV Modules & Renewable EPC', 'Smart Transit & IoT Infrastructure'],
      enableSme,
      dematDetails: {
        dpName: 'Primary Broker (CDSL/NSDL)',
        dpId,
        beneficiaryId: '04821932',
        upiId
      }
    });
    setIsOnboardingOpen(false);
  };

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence>
        {isOnboardingOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="onboarding-title"
              aria-describedby="onboarding-desc"
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              className="relative flex flex-col w-full max-w-2xl max-h-[90vh] rounded-3xl bg-black border border-[#2A2A2A] shadow-[0_25px_70px_rgba(0,0,0,0.95),0_0_40px_rgba(212,175,55,0.15)] overflow-hidden text-white"
            >
              <div className="pointer-events-none absolute -top-24 right-0 w-80 h-80 bg-[#D4AF37]/10 blur-3xl" aria-hidden="true" />

              <button
                onClick={close}
                className={`absolute top-5 right-5 z-10 p-2 rounded-xl text-[#888888] hover:text-white hover:bg-white/[0.06] transition-colors ${FOCUS}`}
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <form onSubmit={handleSave} className="relative flex flex-col min-h-0">
                {/* Scrolling content */}
                <div className="overflow-y-auto p-7 sm:p-9 pb-4 space-y-6">
                  <div className="pr-8">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#F5E59F] text-[11px] font-semibold mb-2.5">
                      <Compass className="w-3.5 h-3.5 text-[#D4AF37]" />
                      Investor Mandate Configuration
                    </div>
                    <h2 id="onboarding-title" className="text-2xl font-bold tracking-tight text-white font-['Cinzel']">
                      Tailor your IPO intelligence desk
                    </h2>
                    <p id="onboarding-desc" className="text-xs text-[#888888] mt-1.5 leading-relaxed font-sans">
                      Your preferences calibrate our forensic screening filters and tailored recommendation explanations without fabricating guarantees.
                    </p>
                  </div>

                  {/* Horizon */}
                  <fieldset>
                    <Legend icon={Clock}>Primary investment horizon</Legend>
                    <div role="radiogroup" aria-label="Investment horizon" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {HORIZONS.map((h) => (
                        <OptionCard key={h.id} option={h} active={horizon === h.id} onSelect={setHorizon} />
                      ))}
                    </div>
                  </fieldset>

                  {/* Risk */}
                  <fieldset>
                    <Legend icon={Shield}>Risk tolerance & mandate</Legend>
                    <div role="radiogroup" aria-label="Risk tolerance" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {RISK_PROFILES.map((r) => (
                        <OptionCard key={r.id} option={r} active={risk === r.id} onSelect={setRisk} />
                      ))}
                    </div>
                  </fieldset>

                  {/* Sectors */}
                  <fieldset>
                    <Legend
                      icon={Compass}
                      aside={
                        <span className="flex items-center gap-2 text-[11px] font-normal text-[#888888] font-mono">
                          {selectedSectors.length} selected
                          {selectedSectors.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setSelectedSectors([])}
                              className={`font-sans text-[#D4AF37] hover:underline rounded ${FOCUS}`}
                            >
                              Clear
                            </button>
                          )}
                        </span>
                      }
                    >
                      Preferred focus sectors
                    </Legend>
                    <div className="flex flex-wrap gap-2">
                      {SECTORS.filter((s) => s !== 'All Sectors').map((sec) => {
                        const active = selectedSectors.includes(sec);
                        return (
                          <button
                            key={sec}
                            type="button"
                            aria-pressed={active}
                            onClick={() => toggleSector(sec)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${FOCUS} ${
                              active
                                ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#F5E59F]'
                                : 'bg-[#080808] border-[#222222] text-[#888888] hover:border-[#333333] hover:text-white'
                            }`}
                          >
                            {active && <Check className="w-3 h-3 text-[#D4AF37]" strokeWidth={3} />}
                            {sec}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>

                  {/* Demat & credentials */}
                  <fieldset className="p-4 rounded-2xl bg-[#080808] border border-[#202020]">
                    <Legend icon={Landmark}>Application preparation credentials</Legend>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label htmlFor="onb-dp" className="block text-[11px] text-[#888888] mb-1 font-medium">Default DP ID / Client ID</label>
                        <input
                          id="onb-dp"
                          type="text"
                          value={dpId}
                          onChange={(e) => setDpId(e.target.value)}
                          placeholder="12081600..."
                          autoComplete="off"
                          spellCheck={false}
                          className={INPUT}
                        />
                      </div>
                      <div>
                        <label htmlFor="onb-upi" className="block text-[11px] text-[#888888] mb-1 font-medium">Default UPI ID (for ASBA mandates)</label>
                        <input
                          id="onb-upi"
                          type="text"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          placeholder="investor@oksbi"
                          autoComplete="off"
                          spellCheck={false}
                          className={INPUT}
                        />
                      </div>
                    </div>
                    <p className="flex items-start gap-1.5 text-[11px] text-[#777777] mt-3.5 leading-relaxed font-sans">
                      <Lock className="w-3 h-3 flex-none mt-0.5 text-emerald-400" />
                      Encrypted locally in browser storage. IPO X-Ray 360 never collects bank passwords or UPI PINs.
                    </p>
                  </fieldset>
                </div>

                {/* Pinned footer */}
                <div className="flex items-center justify-end gap-3 px-7 sm:px-9 py-4 border-t border-[#1C1C1C] bg-[#050505]/95 backdrop-blur">
                  <button
                    type="button"
                    onClick={close}
                    className={`px-4 py-2.5 rounded-xl border border-[#262626] text-xs text-[#888888] hover:text-white hover:bg-white/[0.04] transition-all ${FOCUS}`}
                  >
                    Skip for now
                  </button>
                  <button
                    type="submit"
                    className={`btn-gold px-5 py-2.5 rounded-xl text-xs font-bold text-black flex items-center gap-2 transition-all ${FOCUS}`}
                  >
                    <span>Save & calibrate desk</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}
