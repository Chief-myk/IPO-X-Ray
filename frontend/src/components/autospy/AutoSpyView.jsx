import React from 'react';
import ClaimAutopsy from '../xray/ClaimAutopsy';
import { ShieldAlert, Compass, Sparkles, AlertOctagon, HelpCircle, CheckCircle2 } from 'lucide-react';

export default function AutoSpyView() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-beam/10 border border-beam/25 text-beam text-[11px] font-mono font-semibold uppercase tracking-wider mb-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            Autonomous Claim Autopsy
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-bone tracking-tight font-['Bricolage_Grotesque']">
            AutoSpy — Financial Claim Investigator
          </h1>
          <p className="text-xs text-bone-dim mt-1 max-w-2xl leading-relaxed">
            Submit unverified pre-IPO tips, WhatsApp messages, Telegram forwarded channels, YouTube video URLs, or prospectuses. AutoSpy extracts the promises, names, and entities, then runs autonomous web investigations against official MCA/SEBI registries.
          </p>
        </div>
      </div>

      {/* Guide Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#0E1C29]/80 border border-line/60">
          <div className="flex items-center gap-2 mb-1.5">
            <CheckCircle2 className="w-4 h-4 text-clear" />
            <span className="text-xs font-bold text-bone">1. Entity Extraction</span>
          </div>
          <p className="text-[11px] text-bone-dim leading-snug">
            Identifies promoters, unregistered advisory handles, claimed order books, and promised return rates.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#0E1C29]/80 border border-line/60">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-4 h-4 text-beam" />
            <span className="text-xs font-bold text-bone">2. Autonomous Fact-Checking</span>
          </div>
          <p className="text-[11px] text-bone-dim leading-snug">
            Cross-verifies SEBI intermediary registration numbers, MCA corporate filings, and domain creation timestamps.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#0E1C29]/80 border border-line/60">
          <div className="flex items-center gap-2 mb-1.5">
            <AlertOctagon className="w-4 h-4 text-critical" />
            <span className="text-xs font-bold text-bone">3. Evidence Graph & Verdict</span>
          </div>
          <p className="text-[11px] text-bone-dim leading-snug">
            Surfaces contradictory records, shell entity networks, and generates ready-to-file regulatory complaint drafts.
          </p>
        </div>
      </div>

      {/* Embedded Main Autopsy Workspace */}
      <div className="rounded-2xl border border-line/70 overflow-hidden bg-[#0A1622]/90 p-4 sm:p-6 shadow-xl">
        <ClaimAutopsy />
      </div>
    </div>
  );
}

