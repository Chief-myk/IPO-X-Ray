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
    <section className="relative overflow-hidden max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 border-t border-[#1A1A1A]" id="cases" aria-labelledby="casesTitle">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute -top-32 -left-32 w-[36rem] h-[36rem] rounded-full bg-[#D4AF37]/[0.05] blur-[140px]" aria-hidden="true" />
      <div className="pointer-events-none absolute bottom-0 right-0 w-[36rem] h-[36rem] rounded-full bg-rose-500/[0.04] blur-[150px]" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 bg-grid-fintech opacity-20" aria-hidden="true" />

      <div className="relative">
        {/* Precedent Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-[#D4AF37]/30 bg-[#0A0A0A] backdrop-blur-md text-xs font-mono text-[#F5E59F] mb-4">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
          <span>REAL-WORLD REGULATORY ENFORCEMENTS</span>
        </div>

        <h2 id="casesTitle" className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-[20ch] font-['Cinzel'] text-white leading-[1.08]">
          The paperwork looked fine.{' '}
          <span className="bg-gradient-to-r from-rose-400 via-rose-300 to-rose-500 bg-clip-text text-transparent">
            It was not.
          </span>
        </h2>

        <p className="mt-4 text-base sm:text-lg text-[#888888] max-w-[64ch] leading-relaxed font-sans">
          SME IPO prospectuses frequently pass administrative screenings because verification relies on self-declarations. These landmark cases prove why open-web forensic inspection is vital before bidding.
        </p>

        {/* Case Studies Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-8 mt-12">
          {/* Case 1: Trafiksol ITS */}
          <article className="group relative overflow-hidden p-8 sm:p-10 rounded-3xl bg-[#080808] border border-[#1A1A1A] hover:border-[#D4AF37]/40 text-white font-['Source_Serif_4'] text-base sm:text-lg leading-relaxed shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-rose-500 to-transparent" aria-hidden="true" />

            <div className="flex items-center justify-between gap-2 mb-4 font-sans text-xs font-semibold">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 uppercase tracking-wider font-mono text-[11px]">
                <Scale className="w-3.5 h-3.5" />
                SEBI ENFORCEMENT ORDER
              </span>
              <span className="font-mono text-[#888888]">REFUND MANDATED</span>
            </div>

            <h3 className="font-['Cinzel'] text-2xl sm:text-3xl font-extrabold mb-3 tracking-tight text-white">
              Trafiksol ITS Technologies
            </h3>

            <p className="text-[#AAAAAA] leading-relaxed font-sans text-sm sm:text-base">
              SEBI cancelled the listing and ordered full refunds after an investigation confirmed that a key third-party vendor in the offer was a shell entity that existed solely on paper. The promoters were subsequently fined ₹1.05 crore and debarred from capital markets.
            </p>

            {/* Metric pill bar */}
            <div className="grid grid-cols-3 gap-2.5 my-6 font-mono text-center">
              <div className="p-3 rounded-xl bg-[#050505] border border-[#1A1A1A]">
                <span className="block text-xs uppercase font-sans text-[#777777]">Outcome</span>
                <b className="text-sm sm:text-base text-rose-400 font-bold">Listing Cancelled</b>
              </div>
              <div className="p-3 rounded-xl bg-[#050505] border border-[#1A1A1A]">
                <span className="block text-xs uppercase font-sans text-[#777777]">Penalty</span>
                <b className="text-sm sm:text-base text-white font-bold">₹1.05 Crore</b>
              </div>
              <div className="p-3 rounded-xl bg-[#050505] border border-[#1A1A1A]">
                <span className="block text-xs uppercase font-sans text-[#777777]">Sanction</span>
                <b className="text-sm sm:text-base text-white font-bold">1-Yr Debarment</b>
              </div>
            </div>

            <div className="mt-4 p-4 rounded-xl border-l-4 border-rose-500 bg-rose-500/5 italic text-[#DDDDDD] text-sm sm:text-base">
              <strong>The check that would have caught it:</strong> Does this primary vendor maintain genuine physical operations, registry activity, or digital footprint anywhere outside the DRHP?
            </div>

            <cite className="flex items-center gap-1.5 mt-5 not-italic text-xs font-sans text-[#777777] font-medium">
              <Newspaper className="w-3.5 h-3.5 text-[#D4AF37]" />
              Reported by Financial Express and The Hindu BusinessLine
            </cite>
          </article>

          {/* Case 2: Resourceful Automobile */}
          <article className="group relative overflow-hidden p-8 sm:p-10 rounded-3xl bg-[#080808] border border-[#1A1A1A] hover:border-[#D4AF37]/40 text-white font-sans shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" aria-hidden="true" />

            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/35 text-[#F5E59F] font-mono text-[11px] font-bold uppercase tracking-wider">
                <TrendingUp className="w-3 h-3 text-[#D4AF37]" />
                400× OVERSUBSCRIBED
              </span>
              <span className="font-mono text-xs text-[#888888]">DELHI TWO-WHEELER DEALER</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-extrabold mb-1 text-white font-['Cinzel']">
              Resourceful Automobile
            </h3>

            <div className="my-5">
              <p className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-none text-[#F5E59F] font-mono">
                ₹4,800 crore
              </p>
              <span className="font-mono text-xs text-[#888888] block mt-1.5">
                IN TOTAL BID CAPITAL COMMITTED
              </span>
            </div>

            <p className="text-[#888888] text-sm sm:text-base leading-relaxed font-sans">
              A frenzy of retail and HNI bids flooded a tiny ₹12 crore issue for a dealership operating with merely 8 employees across 2 local showrooms — oversubscribed more than 400 times over.
            </p>

            {/* Reality vs Narrative stats */}
            <div className="grid grid-cols-3 gap-2.5 my-6 font-mono text-center">
              <div className="p-3 rounded-xl bg-[#050505] border border-[#1A1A1A]">
                <Users className="w-4 h-4 mx-auto text-[#D4AF37] mb-1" />
                <b className="text-base text-white block leading-none">8</b>
                <span className="text-[10px] text-[#777777] font-sans">Employees</span>
              </div>
              <div className="p-3 rounded-xl bg-[#050505] border border-[#1A1A1A]">
                <Store className="w-4 h-4 mx-auto text-[#D4AF37] mb-1" />
                <b className="text-base text-white block leading-none">2</b>
                <span className="text-[10px] text-[#777777] font-sans">Showrooms</span>
              </div>
              <div className="p-3 rounded-xl bg-[#050505] border border-[#1A1A1A]">
                <Building className="w-4 h-4 mx-auto text-[#D4AF37] mb-1" />
                <b className="text-base text-white block leading-none">₹12 Cr</b>
                <span className="text-[10px] text-[#777777] font-sans">Issue Target</span>
              </div>
            </div>

            <div className="mt-4 p-4 rounded-xl border-l-4 border-[#D4AF37] bg-[#D4AF37]/5 italic text-[#DDDDDD] text-sm sm:text-base">
              <strong>The check that matters:</strong> Does physical scale, employee footprint, and local operational volume plausibly corroborate the valuation multiple being marketed?
            </div>

            <cite className="flex items-center gap-1.5 mt-5 not-italic text-xs text-[#777777] font-medium font-sans">
              <Newspaper className="w-3.5 h-3.5 text-[#D4AF37]" />
              Reported by India Today, The Times of India, and Mint
            </cite>
          </article>
        </div>

        {/* Structural Industry Commentary */}
        <div className="mt-12 p-6 sm:p-7 rounded-2xl bg-[#080808] border border-[#1A1A1A] shadow-xl flex flex-col md:flex-row items-start md:items-center gap-5">
          <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center flex-none text-[#D4AF37]">
            <Info className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="font-['Cinzel'] text-base sm:text-lg font-bold text-white mb-1">
              The Structural Due-Diligence Gap in SME Markets
            </h4>
            <p className="text-[#888888] text-xs sm:text-sm leading-relaxed max-w-[85ch] font-sans">
              Merchant bankers vetting offer documents are paid by the issuer, regulatory audits typically occur after public capital is already locked, and retail investors rarely have the time to audit a 300-page DRHP. IPO X-Ray 360 executes comprehensive autonomous forensic checks in minutes.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
