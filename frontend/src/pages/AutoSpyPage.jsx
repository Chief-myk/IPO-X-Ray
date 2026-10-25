import React from 'react';
import { Link } from 'react-router-dom';
import ClaimAutopsy from '../components/xray/ClaimAutopsy';
import { ShieldAlert, Sparkles, AlertOctagon, CheckCircle2, ChevronRight } from 'lucide-react';

export default function AutoSpyPage() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[11px] font-mono text-[#888888]">
        <Link to="/" className="hover:text-[#D4AF37] no-underline">Home</Link>
        <ChevronRight className="w-3 h-3 text-[#444444]" />
        <Link to="/dashboard" className="hover:text-[#D4AF37] no-underline">Dashboard</Link>
        <ChevronRight className="w-3 h-3 text-[#444444]" />
        <span className="text-white font-medium">AutoSpy</span>
      </div>

      {/* Header */}
      <div className="pb-5 border-b border-[#1A1A1A]">
        <span className="text-[10px] font-mono text-[#D4AF37] uppercase tracking-wider block font-semibold">Forensic Intelligence Desk</span>
        <h1 className="text-xl sm:text-2xl font-bold text-white font-['Cinzel']">
          AutoSpy — Autonomous Claim Investigator
        </h1>
        <p className="text-xs text-[#888888] mt-1 max-w-2xl leading-relaxed font-sans">
          Submit unverified pre-IPO tips, WhatsApp messages, Telegram channels, YouTube URLs, or prospectuses. AutoSpy extracts the promises, names, and entities, then runs autonomous web investigations against official MCA/SEBI registries.
        </p>
      </div>

      {/* Step Guide Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#080808] border border-[#1A1A1A] hover:border-[#D4AF37]/30 transition-all shadow-xl shadow-black">
          <div className="flex items-center gap-2.5 mb-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-white tracking-wide">1. Entity Extraction</span>
          </div>
          <p className="text-[11px] text-[#888888] leading-relaxed font-sans">
            Identifies promoters, unregistered advisory handles, claimed order books, and promised return rates.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#080808] border border-[#1A1A1A] hover:border-[#D4AF37]/30 transition-all shadow-xl shadow-black">
          <div className="flex items-center gap-2.5 mb-1.5">
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-xs font-bold text-white tracking-wide">2. Autonomous Verification</span>
          </div>
          <p className="text-[11px] text-[#888888] leading-relaxed font-sans">
            Cross-verifies SEBI intermediary registration numbers, MCA corporate filings, and domain creation timestamps.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#080808] border border-[#1A1A1A] hover:border-[#D4AF37]/30 transition-all shadow-xl shadow-black">
          <div className="flex items-center gap-2.5 mb-1.5">
            <AlertOctagon className="w-4 h-4 text-rose-400" />
            <span className="text-xs font-bold text-white tracking-wide">3. Evidence Graph & Verdict</span>
          </div>
          <p className="text-[11px] text-[#888888] leading-relaxed font-sans">
            Surfaces contradictory records, shell entity networks, and generates ready-to-file regulatory complaint drafts.
          </p>
        </div>
      </div>

      {/* Main Autopsy Workspace */}
      <div className="rounded-2xl border border-[#1A1A1A] overflow-hidden bg-black p-5 sm:p-6 shadow-2xl">
        <ClaimAutopsy />
      </div>
    </div>
  );
}
