import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { IPO_CATALOG } from '../data/ipoCatalog';
import {
  ArrowLeft,
  ShieldAlert,
  Landmark,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  ArrowRight,
  Minus,
  Plus,
  Check,
  SearchX,
  Lock
} from 'lucide-react';

const CATEGORIES = [
  { id: 'Retail Individual Investor (RII)', label: 'Retail (RII)', limit: 'Up to ₹2,00,000 max', min: 0, max: 200000 },
  { id: 'Small Non-Institutional Investor (sNII)', label: 'Small HNI (sNII)', limit: '₹2,00,000 to ₹10,00,000', min: 200000, max: 1000000 },
  { id: 'Big Non-Institutional Investor (bNII)', label: 'Big HNI (bNII)', limit: 'Above ₹10,00,000', min: 1000000, max: Infinity }
];

const BROKERS = [
  { name: 'Zerodha Kite', url: 'https://kite.zerodha.com' },
  { name: 'Groww IPO', url: 'https://groww.in/ipo' },
  { name: 'AngelOne', url: 'https://www.angelone.in' },
  { name: 'ICICI Direct', url: 'https://www.icicidirect.com' },
  { name: 'HDFC Sky', url: 'https://hdfcsky.com' },
  { name: 'SBI NetBanking ASBA', url: 'https://www.onlinesbi.sbi' }
];

const FOCUS = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/60';
const INPUT =
  'w-full px-3.5 py-2.5 rounded-xl bg-[#050505] border border-[#202020] text-white text-xs font-mono hover:border-[#333333] focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/25 transition-all';

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

function Card({ children, className = '' }) {
  return <div className={`p-6 rounded-2xl bg-[#080808] border border-[#1A1A1A] shadow-xl shadow-black ${className}`}>{children}</div>;
}

export default function ApplyPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { recordApplication } = useApp();
  const { preferences } = useAuth();

  const ipo = IPO_CATALOG.find((item) => item.id === id);

  const [category, setCategory] = useState('Retail Individual Investor (RII)');
  const [lots, setLots] = useState(1);
  const [useCutoff, setUseCutoff] = useState(true);
  const [customPrice, setCustomPrice] = useState(ipo?.maxPrice || 0);
  const [upiId, setUpiId] = useState(preferences.dematDetails?.upiId || 'investor@oksbi');
  const [dpId, setDpId] = useState(preferences.dematDetails?.dpId || '1208160004821932');
  const [acknowledgedRisk, setAcknowledgedRisk] = useState(false);
  const [submitError, setSubmitError] = useState('');

  if (!ipo) {
    return (
      <div className="max-w-5xl mx-auto py-20 text-center rounded-2xl bg-[#080808] border border-dashed border-[#222222]">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white/[0.04] grid place-items-center">
          <SearchX className="w-5 h-5 text-[#888888]" />
        </div>
        <p className="text-sm font-semibold text-white">Issue record not found</p>
        <p className="text-xs text-[#888888] mt-1">We could not find this IPO in our registry.</p>
        <Link to="/dashboard" className={`btn-gold mt-4 inline-block px-4 py-2 rounded-xl text-black text-xs font-bold no-underline ${FOCUS}`}>
          Return to IPO Dashboard
        </Link>
      </div>
    );
  }

  const minPrice = ipo.minPrice ?? 0;
  const customPriceNum = Number(customPrice);
  const effectivePrice = useCutoff ? ipo.maxPrice : customPriceNum;
  const quantity = lots * ipo.lotSize;
  const totalAmount = quantity * effectivePrice;

  const priceError =
    !useCutoff && (!(customPriceNum > 0) || customPriceNum > ipo.maxPrice || customPriceNum < minPrice)
      ? `Enter a price between ${minPrice ? `₹${minPrice}` : '₹1'} and ₹${ipo.maxPrice}.`
      : '';

  const cat = CATEGORIES.find((c) => c.id === category);
  const categoryWarning =
    !priceError && (totalAmount > cat.max || totalAmount <= cat.min)
      ? totalAmount > cat.max
        ? `This bid (${inr(totalAmount)}) is above the ${cat.label} limit. Reduce lots or choose a higher category.`
        : `This bid (${inr(totalAmount)}) is below the ${cat.label} range. Add lots or choose a lower category.`
      : '';

  const canSubmit = acknowledgedRisk && !priceError;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (priceError) {
      setSubmitError(priceError);
      return;
    }
    if (!acknowledgedRisk) {
      setSubmitError('Please confirm that you have reviewed the DRHP risk disclosures.');
      return;
    }
    setSubmitError('');

    const newApp = {
      id: `app_${Date.now()}`,
      ipoId: ipo.id,
      companyName: ipo.name,
      board: ipo.board,
      category,
      lots,
      quantity,
      bidPrice: effectivePrice,
      amount: totalAmount,
      upiId,
      applicationNo: `XRAY-PREP-${Math.floor(100000 + Math.random() * 900000)}`,
      status: 'Ready to Apply',
      allotmentStatus: 'Application Prepared · Submit via Broker ASBA',
      appliedAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      allotmentDate: ipo.allotmentDate,
      refundDate: ipo.refundDate,
      registrar: 'Link Intime / Bigshare India',
      registrarUrl: 'https://linkintime.co.in/initial_offer/',
      riskWarning: ipo.riskLevel === 'critical' ? 'Critical forensic discrepancies noted.' : null
    };

    recordApplication(newApp);
    navigate('/applications');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-[11px] font-mono text-[#888888] flex-wrap" aria-label="Breadcrumb">
        <Link to="/dashboard" className={`hover:text-[#D4AF37] no-underline rounded ${FOCUS}`}>IPO Dashboard</Link>
        <ChevronRight className="w-3 h-3 text-[#444444]" />
        <Link to={`/ipo/${ipo.id}`} className={`flex items-center gap-1 hover:text-[#D4AF37] no-underline rounded ${FOCUS}`}>
          <ArrowLeft className="w-3 h-3" />
          {ipo.name}
        </Link>
        <ChevronRight className="w-3 h-3 text-[#444444]" />
        <span className="text-white font-medium" aria-current="page">Prepare application</span>
      </nav>

      {/* Title + issue facts */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[#1A1A1A]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white font-['Cinzel'] tracking-tight">
            Prepare ASBA Bid: {ipo.name}
          </h1>
          <p className="text-xs text-[#888888] mt-1 font-sans">Configure your order details, then execute via your verified broker or bank ASBA terminal.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono flex-none">
          <span className="px-3 py-1.5 rounded-xl bg-[#080808] border border-[#1A1A1A] text-[#888888]">
            Price band <strong className="text-white ml-1">{ipo.priceBand}</strong>
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-[#080808] border border-[#1A1A1A] text-[#888888]">
            Lot <strong className="text-white ml-1">{ipo.lotSize} shs</strong>
          </span>
        </div>
      </div>

      {/* Forensic warning */}
      {ipo.riskLevel === 'critical' && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/35 flex items-start gap-3" role="alert">
          <ShieldAlert className="w-5 h-5 text-rose-400 flex-none mt-0.5" />
          <div className="text-xs">
            <p className="font-semibold text-rose-400">{ipo.forensicFlagsCount} forensic flags recorded on this issuer</p>
            <p className="text-[#888888] mt-0.5 leading-relaxed font-sans">
              Carefully inspect the verified auditor and vendor flags before proceeding.{' '}
              <Link to={`/ipo/${ipo.id}?tab=risk`} className={`text-[#D4AF37] font-semibold hover:underline rounded ${FOCUS}`}>
                View forensic audit
              </Link>
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left: inputs */}
        <div className="lg:col-span-2 space-y-5">
          {/* Category */}
          <Card>
            <fieldset>
              <legend className="text-sm font-bold text-white mb-3 tracking-wide">Investor quota category</legend>
              <div role="radiogroup" aria-label="Investor category" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {CATEGORIES.map((c) => {
                  const active = category === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setCategory(c.id)}
                      className={`p-3.5 rounded-xl border text-left transition-all ${FOCUS} ${
                        active
                          ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-white shadow-[0_0_15px_rgba(212,175,55,0.18)]'
                          : 'bg-[#050505] border-[#1A1A1A] text-[#888888] hover:text-white hover:border-[#2A2A2A]'
                      }`}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold">{c.label}</span>
                        <span className={`grid place-items-center w-4 h-4 rounded-full border flex-none ${active ? 'bg-[#D4AF37] border-[#D4AF37]' : 'border-[#333333]'}`}>
                          {active && <Check className="w-2.5 h-2.5 text-black" strokeWidth={3} />}
                        </span>
                      </span>
                      <span className="text-[11px] opacity-75 block mt-1 font-mono">{c.limit}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </Card>

          {/* Lots & price */}
          <Card className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label htmlFor="lots" className="text-sm font-bold text-white">Number of lots</label>
                <span className="text-xs font-mono text-[#F5E59F] font-bold">{quantity.toLocaleString('en-IN')} total shares</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setLots((l) => Math.max(1, l - 1))}
                  disabled={lots <= 1}
                  aria-label="Decrease lots"
                  className={`w-11 h-11 rounded-xl bg-[#0F0F0F] border border-[#222222] text-white hover:bg-[#181818] hover:border-[#D4AF37]/40 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors ${FOCUS}`}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  id="lots"
                  type="number"
                  min="1"
                  max="50"
                  inputMode="numeric"
                  value={lots}
                  onChange={(e) => setLots(Math.max(1, parseInt(e.target.value) || 1))}
                  className="flex-1 py-2.5 rounded-xl bg-[#050505] border border-[#202020] text-center text-base font-mono font-bold text-white hover:border-[#333333] focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/25 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setLots((l) => l + 1)}
                  aria-label="Increase lots"
                  className={`w-11 h-11 rounded-xl bg-[#0F0F0F] border border-[#222222] text-white hover:bg-[#181818] hover:border-[#D4AF37]/40 flex items-center justify-center transition-colors ${FOCUS}`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Cut-off switch + custom price */}
            <div className="pt-4 border-t border-[#161616] space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <span id="cutoff-label" className="text-xs font-bold text-white block">Bid at cut-off price</span>
                  <span className="text-[11px] text-[#888888]">Uses the highest book-build price (₹{ipo.maxPrice})</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={useCutoff}
                  aria-labelledby="cutoff-label"
                  onClick={() => setUseCutoff((v) => !v)}
                  className={`relative w-11 h-6 rounded-full border transition-colors flex-none ${FOCUS} ${
                    useCutoff ? 'bg-[#D4AF37] border-[#D4AF37]' : 'bg-[#181818] border-[#2A2A2A]'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-[18px] h-[18px] rounded-full transition-transform ${useCutoff ? 'translate-x-5 bg-black' : 'bg-[#888888]'}`} />
                </button>
              </div>

              {!useCutoff && (
                <div>
                  <label htmlFor="custom-price" className="block text-[11px] text-[#888888] mb-1 font-medium">Custom bid price per share (₹)</label>
                  <input
                    id="custom-price"
                    type="number"
                    step="0.05"
                    min={minPrice || 1}
                    max={ipo.maxPrice}
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    aria-invalid={!!priceError}
                    className={`${INPUT} ${priceError ? '!border-rose-500' : ''}`}
                  />
                  {priceError && <p className="text-[11px] text-rose-400 mt-1.5" role="alert">{priceError}</p>}
                </div>
              )}
            </div>
          </Card>

          {/* Mandate */}
          <Card className="space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-bold text-white">
              <span className="grid place-items-center w-6 h-6 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/25">
                <Landmark className="w-3.5 h-3.5" />
              </span>
              ASBA Mandate Coordinates
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label htmlFor="dp-id" className="block text-[11px] text-[#888888] mb-1 font-medium">Demat DP ID / Beneficiary ID</label>
                <input id="dp-id" type="text" value={dpId} onChange={(e) => setDpId(e.target.value)} autoComplete="off" spellCheck={false} className={INPUT} required />
              </div>
              <div>
                <label htmlFor="upi-id" className="block text-[11px] text-[#888888] mb-1 font-medium">UPI ID for Bank ASBA Fund Block</label>
                <input id="upi-id" type="text" value={upiId} onChange={(e) => setUpiId(e.target.value)} autoComplete="off" spellCheck={false} className={INPUT} required />
              </div>
            </div>

            <p className="flex items-start gap-1.5 text-[11px] text-[#777777] leading-relaxed font-sans">
              <Lock className="w-3.5 h-3.5 flex-none mt-0.5 text-emerald-400" />
              IPO X-Ray never collects UPI PINs or banking credentials. Your funds are blocked in your bank account until allotment.
            </p>
          </Card>
        </div>

        {/* Right: summary */}
        <div className="space-y-4 lg:sticky lg:top-24">
          <Card className="font-mono text-xs !p-0 overflow-hidden">
            <div className="p-6 pb-4 bg-gradient-to-b from-[#D4AF37]/15 to-transparent border-b border-[#1A1A1A]">
              <span className="text-[11px] font-sans text-[#888888] block">Total Amount to be Blocked</span>
              <span className="text-3xl font-extrabold text-[#F5E59F] tracking-tight block mt-1">{inr(totalAmount)}</span>
            </div>
            <div className="px-6 pb-6 space-y-0">
              {[
                ['Category', cat.label],
                ['Lots & shares', `${lots} lot${lots > 1 ? 's' : ''} (${quantity.toLocaleString('en-IN')} shs)`],
                ['Bid price', `₹${effectivePrice || 0}`]
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 py-2.5 border-b border-[#161616]">
                  <span className="font-sans text-[#888888]">{k}</span>
                  <span className="text-white text-right font-semibold">{v}</span>
                </div>
              ))}
              <p className="text-[11px] font-sans text-[#777777] leading-relaxed pt-3">
                Funds remain safely blocked in your own savings account earning interest until the registrar completes final share allocation.
              </p>
            </div>
          </Card>

          {categoryWarning && (
            <div className="p-3.5 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/35 flex items-start gap-2 text-[11px] text-[#F5E59F] leading-snug" role="status">
              <AlertTriangle className="w-4 h-4 flex-none text-[#D4AF37]" />
              <span>{categoryWarning}</span>
            </div>
          )}

          {/* Broker channels */}
          <Card className="!p-4 space-y-3">
            <span className="text-xs font-bold text-white block">Official broker submission channels</span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {BROKERS.map((b) => (
                <a
                  key={b.name}
                  href={b.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-2 rounded-xl bg-[#050505] hover:bg-[#121212] text-white hover:text-[#F5E59F] border border-[#1A1A1A] hover:border-[#D4AF37]/40 flex items-center justify-between no-underline transition-colors ${FOCUS}`}
                >
                  <span className="truncate">{b.name}</span>
                  <ExternalLink className="w-3 h-3 flex-none ml-1 opacity-60" />
                </a>
              ))}
            </div>
          </Card>

          {/* Acknowledgement */}
          <label
            className={`flex items-start gap-3 text-xs cursor-pointer p-3.5 rounded-2xl border transition-colors ${
              acknowledgedRisk ? 'bg-emerald-500/10 border-emerald-500/35 text-white' : 'bg-[#080808] border-[#1C1C1C] text-[#888888] hover:border-[#2C2C2C]'
            }`}
          >
            <input
              type="checkbox"
              checked={acknowledgedRisk}
              onChange={(e) => {
                setAcknowledgedRisk(e.target.checked);
                setSubmitError('');
              }}
              className="rounded border-[#333333] text-[#D4AF37] mt-0.5 focus:ring-[#D4AF37]"
            />
            <span className="leading-snug text-[11px] font-sans">
              I confirm that I have reviewed the DRHP risk disclosures and will authorize the mandate via my bank portal.
            </span>
          </label>

          {submitError && (
            <p className="text-[11px] text-rose-400 flex items-start gap-1.5" role="alert">
              <AlertTriangle className="w-3.5 h-3.5 flex-none mt-px" />
              {submitError}
            </p>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className={`btn-gold group w-full py-3.5 rounded-xl text-xs font-bold text-black flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${FOCUS}`}
          >
            <span>Record in tracking hub</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </button>
          {!acknowledgedRisk && (
            <p className="text-[11px] text-[#777777] text-center -mt-2">Confirm the risk review above to continue.</p>
          )}
        </div>
      </form>
    </div>
  );
}
