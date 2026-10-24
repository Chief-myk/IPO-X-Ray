import React from 'react';

export default function Cases() {
  return (
    <section className="relative overflow-hidden max-w-[1440px] mx-auto px-4 md:px-12 py-16 lg:py-28 border-t border-line" id="cases" aria-labelledby="casesTitle">
      {/* soft ambient glows behind the content */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-beam/10 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute bottom-0 right-0 w-96 h-96 rounded-full bg-beam/5 blur-3xl" aria-hidden="true" />

      <div className="relative">
        {/* accent bar above the heading */}
        <div className="w-14 h-1 rounded-full bg-gradient-to-r from-beam to-transparent mb-5" aria-hidden="true" />
        <h2 id="casesTitle" className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight max-w-[16ch] font-['Bricolage_Grotesque'] bg-gradient-to-b from-bone to-bone-dim bg-clip-text text-transparent">
          The paperwork looked fine. It wasn’t.
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-6 sm:gap-8 mt-12">
          {/* Case 1: Trafiksol ITS */}
          <article className="group relative overflow-hidden p-7 sm:p-9 rounded-3xl bg-paper text-ink font-['Source_Serif_4'] text-base sm:text-lg leading-relaxed shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_30px_70px_-20px_rgba(127,216,232,0.35)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
            {/* top accent strip */}
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-ink via-beam to-ink/60" aria-hidden="true" />
            <h3 className="font-['Bricolage_Grotesque'] text-2xl sm:text-3xl font-bold mb-3.5 tracking-tight">
              Trafiksol ITS
            </h3>
            <p>
              SEBI cancelled the IPO and ordered investors refunded after its probe found that a third-party vendor in the offer was a shell that existed only on paper. The promoters were later fined ₹1.05 crore and barred from the market for a year.
            </p>
            {/* "check" as a highlighted callout */}
            <p className="mt-5 p-4 rounded-xl border-l-4 border-ink bg-ink/5 italic text-ink">
              The check that would have caught it: does this vendor exist anywhere outside the DRHP?
            </p>
            <cite className="block mt-4 not-italic text-xs font-['Bricolage_Grotesque'] text-ink-dim">
              Reported by Financial Express and The Hindu BusinessLine
            </cite>
          </article>

          {/* Case 2: Resourceful Automobile */}
          <article className="group relative overflow-hidden p-7 sm:p-9 rounded-3xl bg-gradient-to-br from-film-2 to-[#0F1E2B] text-bone font-['Bricolage_Grotesque'] border border-line shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)] transition-all duration-300 hover:-translate-y-1.5 hover:border-beam/50 hover:shadow-[0_30px_70px_-20px_rgba(127,216,232,0.35)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
            {/* corner glow that intensifies on hover */}
            <div className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full bg-beam/15 blur-3xl transition-opacity duration-300 group-hover:bg-beam/25" aria-hidden="true" />
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-transparent via-beam to-transparent" aria-hidden="true" />
            <h3 className="relative text-2xl sm:text-3xl font-bold mb-2">Resourceful Automobile</h3>
            <p className="relative text-4xl sm:text-6xl font-black tracking-tight leading-none mb-3 bg-gradient-to-r from-beam to-[#A8E8F2] bg-clip-text text-transparent drop-shadow-[0_0_24px_rgba(127,216,232,0.35)]">
              ₹4,800 crore
            </p>
            <p className="relative text-bone-dim text-sm sm:text-base leading-normal">
              of bids for a ₹12 crore issue from a Delhi two-wheeler dealer with 8 employees and 2 showrooms — subscribed more than 400 times.
            </p>
            <p className="relative mt-5 p-4 rounded-xl border-l-4 border-beam bg-beam/5 font-['Source_Serif_4'] italic text-bone text-base">
              The check that matters: does the size of the business match the story being sold?
            </p>
            <cite className="relative block mt-4 not-italic text-xs text-bone-dim">
              Reported by India Today and The Times of India
            </cite>
          </article>
        </div>

        {/* closing paragraph with a gradient rail */}
        <p className="max-w-[62ch] mt-10 pl-5 border-l-2 border-transparent [border-image:linear-gradient(to_bottom,#7FD8E8,transparent)_1] text-base sm:text-lg text-bone-dim leading-relaxed">
          Today the merchant banker who vets the documents is paid by the company, regulators usually act after listing, and almost no retail investor reads a 300-page DRHP. IPO X-Ray does the reading and the checking in minutes.
        </p>
      </div>
    </section>
  );
}