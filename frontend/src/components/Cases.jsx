import React from 'react';
import { 
  Scale, 
  Building, 
  Users, 
  Store, 
  TrendingUp, 
  Newspaper, 
  ShieldAlert, 
  Info
} from 'lucide-react';

export default function Cases() {
  return (
    <section className="relative overflow-hidden max-w-[1560px] mx-auto px-4 sm:px-8 lg:px-12 py-20 lg:py-28 border-t border-line" id="cases" aria-labelledby="casesTitle">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute -top-32 -left-32 w-[36rem] h-[36rem] rounded-full bg-beam/[0.08] blur-[140px]" aria-hidden="true" />
      <div className="pointer-events-none absolute bottom-0 right-0 w-[36rem] h-[36rem] rounded-full bg-critical/[0.05] blur-[150px]" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 bg-grid-fintech opacity-20" aria-hidden="true" />

      <div className="relative">
        {/* Precedent Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-[#27435E] bg-[#0E1F2E]/80 backdrop-blur-md text-xs font-mono text-[#8EA3B5] mb-4">
          <ShieldAlert className="w-3.5 h-3.5 text-critical" />
          <span>REAL-WORLD REGULATORY ENFORCEMENTS</span>
        </div>

        <h2 id="casesTitle" className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-[20ch] font-['Bricolage_Grotesque'] bg-gradient-to-b from-bone via-bone to-bone-dim bg-clip-text text-transparent leading-[1.05]">
          The paperwork looked fine.{' '}
          <span className="bg-gradient-to-r from-critical via-[#FF8A7A] to-critical bg-clip-text text-transparent">
            It wasn’t.
          </span>
        </h2>

        <p className="mt-4 text-base sm:text-lg text-bone-dim max-w-[64ch] leading-relaxed">
          SME IPO prospectuses frequently pass initial administrative screenings because verification relies on self-declarations. These landmark cases prove why open-web forensic inspection is vital before bidding.
        </p>

        {/* Case Studies Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-8 mt-12">
          {/* Case 1: Trafiksol ITS */}
          <article className="group relative overflow-hidden p-8 sm:p-10 rounded-3xl bg-paper text-ink font-['Source_Serif_4'] text-base sm:text-lg leading-relaxed shadow-[0_20px_60px_-20px_rgba(0,0,0,0.7)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_30px_80px_-20px_rgba(127,216,232,0.35)]">
            {/* Top accent border */}
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-ink via-critical to-ink/70" aria-hidden="true" />

            {/* Official Order Badge */}
            <div className="flex items-center justify-between gap-2 mb-4 font-['Bricolage_Grotesque'] text-xs font-semibold">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-ink text-paper uppercase tracking-wider font-mono text-[11px]">
                <Scale className="w-3.5 h-3.5 text-beam" />
                SEBI ENFORCEMENT ORDER
              </span>
              <span className="font-mono text-ink-dim">REFUND MANDATED</span>
            </div>

            <h3 className="font-['Bricolage_Grotesque'] text-2xl sm:text-4xl font-extrabold mb-3 tracking-tight text-[#0D1824]">
              Trafiksol ITS Technologies
            </h3>

            <p className="text-[#253240] leading-relaxed">
              SEBI cancelled the listing and ordered full refunds after an investigation confirmed that a key third-party vendor in the offer was a shell entity that existed solely on paper. The promoters were subsequently fined ₹1.05 crore and debarred from capital markets.
            </p>

            {/* Metric pill bar */}
            <div className="grid grid-cols-3 gap-2 my-5 font-['Bricolage_Grotesque'] text-center">
              <div className="p-2.5 rounded-xl bg-ink/5 border border-ink/10">
                <span className="block text-xs uppercase font-mono text-ink-dim">Outcome</span>
                <b className="text-sm sm:text-base text-critical font-bold">Listing Cancelled</b>
              </div>
              <div className="p-2.5 rounded-xl bg-ink/5 border border-ink/10">
                <span className="block text-xs uppercase font-mono text-ink-dim">Penalty</span>
                <b className="text-sm sm:text-base text-[#0D1824] font-bold">₹1.05 Crore</b>
              </div>
              <div className="p-2.5 rounded-xl bg-ink/5 border border-ink/10">
                <span className="block text-xs uppercase font-mono text-ink-dim">Sanction</span>
                <b className="text-sm sm:text-base text-[#0D1824] font-bold">1-Yr Debarment</b>
              </div>
            </div>

            {/* Highlighted Key Investigation Finding */}
            <div className="mt-4 p-4 rounded-xl border-l-4 border-ink bg-ink/5 italic text-[#1C2733] text-sm sm:text-base">
              <strong>The check that would have caught it:</strong> Does this primary vendor maintain genuine physical operations, registry activity, or digital footprint anywhere outside the DRHP?
            </div>

            <cite className="flex items-center gap-1.5 mt-5 not-italic text-xs font-['Bricolage_Grotesque'] text-ink-dim font-medium">
              <Newspaper className="w-3.5 h-3.5" />
              Reported by Financial Express and The Hindu BusinessLine
            </cite>
          </article>

          {/* Case 2: Resourceful Automobile */}
          <article className="group relative overflow-hidden p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-[#122436] via-[#0F1E2B] to-[#0A1622] text-bone font-['Bricolage_Grotesque'] border border-[#27435E] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.7)] transition-all duration-300 hover:-translate-y-1.5 hover:border-beam/60 hover:shadow-[0_30px_80px_-20px_rgba(127,216,232,0.35)]">
            {/* Ambient hover glow */}
            <div className="pointer-events-none absolute -top-20 -right-20 w-64 h-64 rounded-full bg-beam/15 blur-3xl transition-opacity duration-300 group-hover:bg-beam/25" aria-hidden="true" />
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-transparent via-beam to-transparent" aria-hidden="true" />

            {/* Over-subscription badge */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-beam/10 border border-beam/30 text-beam font-mono text-[11px] font-bold uppercase tracking-wider">
                <TrendingUp className="w-3 h-3" />
                400× OVERSUBSCRIBED
              </span>
              <span className="font-mono text-xs text-bone-dim">DELHI TWO-WHEELER DEALER</span>
            </div>

            <h3 className="text-2xl sm:text-4xl font-extrabold mb-1 text-bone">
              Resourceful Automobile
            </h3>

            {/* Giant Metric Callout */}
            <div className="my-4">
              <p className="text-5xl sm:text-7xl font-black tracking-tight leading-none bg-gradient-to-r from-beam via-[#B8F0F9] to-beam bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(127,216,232,0.45)]">
                ₹4,800 crore
              </p>
              <span className="font-mono text-xs text-beam/80 block mt-1">
                IN TOTAL BID CAPITAL COMMITTED
              </span>
            </div>

            <p className="text-bone-dim text-sm sm:text-base leading-relaxed">
              A frenzy of retail and HNI bids flooded a tiny ₹12 crore issue for a dealership operating with merely 8 employees across 2 local showrooms — oversubscribed more than 400 times over.
            </p>

            {/* Reality vs Narrative stats */}
            <div className="grid grid-cols-3 gap-2 my-5 font-mono text-center">
              <div className="p-2.5 rounded-xl bg-[#162D42]/70 border border-line/60">
                <Users className="w-4 h-4 mx-auto text-beam mb-1" />
                <b className="text-base text-bone block leading-none">8</b>
                <span className="text-[10px] text-bone-dim">Employees</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#162D42]/70 border border-line/60">
                <Store className="w-4 h-4 mx-auto text-beam mb-1" />
                <b className="text-base text-bone block leading-none">2</b>
                <span className="text-[10px] text-bone-dim">Showrooms</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#162D42]/70 border border-line/60">
                <Building className="w-4 h-4 mx-auto text-beam mb-1" />
                <b className="text-base text-bone block leading-none">₹12 Cr</b>
                <span className="text-[10px] text-bone-dim">Issue Target</span>
              </div>
            </div>

            <div className="mt-4 p-4 rounded-xl border-l-4 border-beam bg-beam/5 font-['Source_Serif_4'] italic text-bone text-sm sm:text-base">
              <strong>The check that matters:</strong> Does physical scale, employee footprint, and local operational volume plausibly corroborate the valuation multiple being marketed?
            </div>

            <cite className="flex items-center gap-1.5 mt-5 not-italic text-xs text-bone-dim font-medium">
              <Newspaper className="w-3.5 h-3.5" />
              Reported by India Today, The Times of India, and Mint
            </cite>
          </article>
        </div>

        {/* Structural Industry Commentary */}
        <div className="mt-12 p-6 sm:p-7 rounded-2xl bg-gradient-to-r from-[#122436]/90 to-[#0F1E2B]/90 border border-line/80 backdrop-blur-md shadow-lg flex flex-col md:flex-row items-start md:items-center gap-5">
          <div className="w-10 h-10 rounded-xl bg-beam/10 border border-beam/30 flex items-center justify-center flex-none text-beam">
            <Info className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="font-['Bricolage_Grotesque'] text-base sm:text-lg font-bold text-bone mb-1">
              The Structural Due-Diligence Gap in SME Markets
            </h4>
            <p className="text-bone-dim text-xs sm:text-sm leading-relaxed max-w-[85ch]">
              Merchant bankers vetting offer documents are paid by the issuer, regulatory audits typically occur after public capital is already locked, and retail investors rarely have the time to audit a 300-page DRHP. IPO X-Ray executes comprehensive autonomous forensic checks in minutes.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}