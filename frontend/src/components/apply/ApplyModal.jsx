import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { 
  X, 
  Check, 
  ArrowRight, 
  ShieldAlert, 
  Landmark, 
  Calculator, 
  ExternalLink, 
  Info,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

const CATEGORIES = [
  { id: 'Retail Individual Investor (RII)', label: 'Retail (RII)', limit: 'Up to ₹2,00,000 max' },
  { id: 'Small Non-Institutional Investor (sNII)', label: 'Small HNI (sNII)', limit: '₹2,00,000 to ₹10,00,000' },
  { id: 'Big Non-Institutional Investor (bNII)', label: 'Big HNI (bNII)', limit: 'Above ₹10,00,000' }
];

const BROKERS = [
  { name: 'Zerodha Coin / Kite', url: 'https://kite.zerodha.com' },
  { name: 'Groww', url: 'https://groww.in/ipo' },
  { name: 'AngelOne', url: 'https://www.angelone.in' },
  { name: 'ICICI Direct', url: 'https://www.icicidirect.com' },
  { name: 'HDFC Sky', url: 'https://hdfcsky.com' },
  { name: 'SBI NetBanking ASBA', url: 'https://www.onlinesbi.sbi' }
];

export default function ApplyModal() {
  const { isApplyModalOpen, setIsApplyModalOpen, applyTargetIpo, recordApplication } = useApp();
  const { preferences } = useAuth();

  const ipo = applyTargetIpo;

  const [step, setStep] = useState(1); // 1: Lots & Category, 2: Demat & UPI, 3: Review & ASBA Instructions
  const [category, setCategory] = useState('Retail Individual Investor (RII)');
  const [lots, setLots] = useState(1);
  const [useCutoff, setUseCutoff] = useState(true);
  const [customPrice, setCustomPrice] = useState(ipo?.maxPrice || 0);
  const [upiId, setUpiId] = useState(preferences.dematDetails?.upiId || '');
  const [dpId, setDpId] = useState(preferences.dematDetails?.dpId || '');
  const [acknowledgedRisk, setAcknowledgedRisk] = useState(false);

  if (!isApplyModalOpen || !ipo) return null;

  const effectivePrice = useCutoff ? ipo.maxPrice : Number(customPrice);
  const quantity = lots * ipo.lotSize;
  const totalAmount = quantity * effectivePrice;

  const handleNext = (e) => {
    e.preventDefault();
    if (step === 1) {
      if (category.includes('Retail') && totalAmount > 200000 && !ipo.board.includes('SME')) {
        alert('Retail (RII) application amount cannot exceed ₹2,00,000. Please select an HNI category or reduce lot quantity.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!upiId || !upiId.includes('@')) {
        alert('Please enter a valid UPI ID (e.g. yourname@okhdfcbank).');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!acknowledgedRisk) {
        alert('Please confirm that you have reviewed the DRHP risk disclosures.');
        return;
      }

      // Record prepared application into Application Tracking Dashboard
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
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div 
        className="relative w-full max-w-xl rounded-2xl bg-[#0E1C29]/95 border border-[#27435E]/80 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_40px_rgba(127,216,232,0.15)] p-6 sm:p-8 overflow-hidden text-bone my-8"
        role="dialog"
      >
        <div className="pointer-events-none absolute -top-24 right-0 w-80 h-80 bg-beam/10 blur-3xl" />

        <button
          onClick={() => setIsApplyModalOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-lg text-bone-dim hover:text-bone hover:bg-white/5 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-beam/10 border border-beam/25 text-beam">
              {ipo.board}
            </span>
            <span className="text-xs font-mono text-bone-dim">
              Step {step} of 3
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-bone font-['Bricolage_Grotesque']">
            Apply: {ipo.name}
          </h2>
          <p className="text-xs text-bone-dim mt-1">
            Price Band: <strong className="text-bone">{ipo.priceBand}</strong> · Lot Size: <strong className="text-bone">{ipo.lotSize} Shares</strong>
          </p>
        </div>

        {/* Risk Warning Pill if Critical */}
        {ipo.riskLevel === 'critical' && (
          <div className="mb-5 p-3 rounded-xl bg-critical/15 border border-critical/40 text-critical text-xs flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 flex-none mt-0.5" />
            <div>
              <strong className="block font-semibold">Forensic Risk Notice:</strong>
              This issue flagged {ipo.forensicFlagsCount} material discrepancies (undisclosed vendor ties / site verification gaps). Ensure you review before bidding.
            </div>
          </div>
        )}

        <form onSubmit={handleNext} className="space-y-5">
          {/* STEP 1: Lots, Price, Category */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-bone uppercase tracking-wider mb-2">
                  Investor Category
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        category === cat.id
                          ? 'bg-beam/15 border-beam text-bone shadow-[0_0_12px_rgba(127,216,232,0.2)]'
                          : 'bg-[#09141F] border-line/60 text-bone-dim hover:text-bone'
                      }`}
                    >
                      <span className="text-xs font-semibold block">{cat.label}</span>
                      <span className="text-[10px] opacity-75">{cat.limit}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Lot Quantity Selector */}
              <div className="p-4 rounded-xl bg-[#09141F] border border-line/70">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-bone uppercase tracking-wider">
                    Number of Lots
                  </label>
                  <span className="text-xs font-mono text-beam font-bold">
                    {quantity} Shares Total
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setLots((l) => Math.max(1, l - 1))}
                    className="w-10 h-10 rounded-xl bg-film-2 border border-line text-bone font-bold hover:bg-film-3 transition-colors flex items-center justify-center text-lg"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={lots}
                    onChange={(e) => setLots(Math.max(1, parseInt(e.target.value) || 1))}
                    aria-label="Number of lots"
                    className="flex-1 py-2 rounded-xl bg-[#08131C] border border-line text-center text-sm font-mono font-bold text-bone focus:outline-none focus:border-beam"
                  />
                  <button
                    type="button"
                    onClick={() => setLots((l) => l + 1)}
                    className="w-10 h-10 rounded-xl bg-film-2 border border-line text-bone font-bold hover:bg-film-3 transition-colors flex items-center justify-center text-lg"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Price Selector */}
              <div className="p-4 rounded-xl bg-[#09141F] border border-line/70 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-bone uppercase tracking-wider">
                    Bid Price
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-bone-dim cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useCutoff}
                      onChange={(e) => setUseCutoff(e.target.checked)}
                      className="rounded border-line text-beam focus:ring-beam"
                    />
                    <span>Bid at Cut-off (₹{ipo.maxPrice})</span>
                  </label>
                </div>

                {!useCutoff && (
                  <div>
                    <input
                      type="number"
                      min={ipo.minPrice}
                      max={ipo.maxPrice}
                      value={customPrice}
                      onChange={(e) => setCustomPrice(e.target.value)}
                      aria-label="Custom bid price"
                      className="w-full px-3 py-2 rounded-lg bg-[#08131C] border border-line text-bone text-xs font-mono"
                    />
                    <span className="text-[10px] text-bone-dim mt-1 block">
                      Must be between ₹{ipo.minPrice} and ₹{ipo.maxPrice}.
                    </span>
                  </div>
                )}
              </div>

              {/* Total Calculation Capsule */}
              <div className="p-4 rounded-xl bg-film-3/80 border border-beam/30 flex items-center justify-between font-mono">
                <div>
                  <span className="text-[10px] font-sans text-bone-dim block">Total Application Payable</span>
                  <span className="text-lg font-extrabold text-beam">
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="text-right text-[11px] text-bone-dim">
                  <span>{lots} Lot{lots > 1 ? 's' : ''} × {ipo.lotSize} shs @ ₹{effectivePrice}</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Demat & UPI ID */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-film-2/60 border border-line/70 flex items-start gap-3">
                <Landmark className="w-5 h-5 text-beam flex-none mt-0.5" />
                <div className="text-xs text-bone-dim leading-relaxed">
                  Enter your verified DP ID and UPI ID. Your bank will issue an ASBA mandate block for <strong className="text-bone">₹{totalAmount.toLocaleString('en-IN')}</strong>. Funds remain in your account until allotment.
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-bone uppercase tracking-wider mb-1.5">
                  DP ID / Demat Beneficiary Number (16 Digits)
                </label>
                <input
                  type="text"
                  value={dpId}
                  onChange={(e) => setDpId(e.target.value)}
                  placeholder="e.g. 1208160004821932"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#09141F] border border-line text-bone text-sm font-mono focus:outline-none focus:border-beam"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-bone uppercase tracking-wider mb-1.5">
                  UPI ID (Linked to Bank ASBA)
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. investor@okhdfcbank"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#09141F] border border-line text-bone text-sm font-mono focus:outline-none focus:border-beam"
                  required
                />
                <span className="text-[10px] text-bone-dim mt-1 block">
                  Supported: GPay (@okhdfcbank, @okaxis, @oksbi), PhonePe (@ybl, @ibl), Paytm (@paytm), BHIM.
                </span>
              </div>
            </div>
          )}

          {/* STEP 3: Review & Broker Routing */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#09141F] border border-line/80 space-y-2.5 text-xs">
                <div className="flex justify-between pb-2 border-b border-line/50">
                  <span className="text-bone-dim">Company:</span>
                  <span className="font-bold text-bone">{ipo.name}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-line/50">
                  <span className="text-bone-dim">Investor Category:</span>
                  <span className="font-bold text-bone">{category}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-line/50">
                  <span className="text-bone-dim">Lots & Bid:</span>
                  <span className="font-mono font-bold text-bone">{lots} Lots ({quantity} Shs) @ ₹{effectivePrice}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-line/50">
                  <span className="text-bone-dim">Total Payable:</span>
                  <span className="font-mono font-bold text-beam">₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-bone-dim">UPI Mandate Account:</span>
                  <span className="font-mono text-bone">{upiId}</span>
                </div>
              </div>

              {/* Supported Broker Routing Direct Links */}
              <div className="p-4 rounded-xl bg-[#09141F] border border-line/80">
                <span className="text-xs font-semibold text-bone block mb-2">
                  Direct One-Click Submission in Your Broker Portal:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {BROKERS.map((b) => (
                    <a
                      key={b.name}
                      href={b.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 rounded-lg bg-film-2 hover:bg-beam/20 text-bone hover:text-beam text-[11px] font-medium border border-line transition-colors flex items-center justify-between"
                    >
                      <span className="truncate">{b.name}</span>
                      <ExternalLink className="w-3 h-3 flex-none ml-1 opacity-70" />
                    </a>
                  ))}
                </div>
              </div>

              {/* Mandatory Risk Acknowledgment */}
              <label className="flex items-start gap-2.5 text-xs text-bone-dim cursor-pointer p-3 rounded-xl bg-[#08131C] border border-line/60">
                <input
                  type="checkbox"
                  checked={acknowledgedRisk}
                  onChange={(e) => setAcknowledgedRisk(e.target.checked)}
                  className="rounded border-line text-beam focus:ring-beam mt-0.5"
                />
                <span className="leading-snug">
                  I understand that IPO X-Ray prepares and tracks my bid parameters. Final submission must be authorized in my broker portal or via ASBA bank mandate.
                </span>
              </label>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-line/50">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="px-4 py-2.5 rounded-xl border border-line text-xs font-medium text-bone-dim hover:text-bone hover:bg-white/5 transition-colors"
              >
                Back
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsApplyModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-line text-xs font-medium text-bone-dim hover:text-bone hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-beam hover:bg-beam/90 text-[#08131C] shadow-[0_4px_16px_rgba(127,216,232,0.3)] flex items-center gap-2 transition-all"
            >
              <span>{step === 3 ? 'Save to Application Tracker' : 'Continue'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

