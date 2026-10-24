import React from 'react';

export default function Cases() {
  return (
    <section className="max-w-[1440px] mx-auto px-4 md:px-12 py-16 lg:py-28 border-t border-line" id="cases" aria-labelledby="casesTitle">
      <h2 id="casesTitle" className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight max-w-[16ch] font-['Bricolage_Grotesque']">
        The paperwork looked fine. It wasn’t.
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-6 sm:gap-8 mt-12">
        {/* Case 1: Trafiksol ITS */}
        <article className="p-7 sm:p-9 rounded-2xl bg-paper text-ink font-['Source_Serif_4'] text-base sm:text-lg leading-relaxed shadow-lg">
          <h3 className="font-['Bricolage_Grotesque'] text-2xl sm:text-3xl font-bold mb-3.5 tracking-tight">
            Trafiksol ITS
          </h3>
          <p>
            SEBI cancelled the IPO and ordered investors refunded after its probe found that a third-party vendor in the offer was a shell that existed only on paper. The promoters were later fined ₹1.05 crore and barred from the market for a year.
          </p>
          <p className="mt-4 pt-3.5 border-t border-ink-dim/20 italic text-ink">
            The check that would have caught it: does this vendor exist anywhere outside the DRHP?
          </p>
          <cite className="block mt-4 not-italic text-xs font-['Bricolage_Grotesque'] text-ink-dim">
            Reported by Financial Express and The Hindu BusinessLine
          </cite>
        </article>

        {/* Case 2: Resourceful Automobile */}
        <article className="p-7 sm:p-9 rounded-3xl bg-film-2 text-bone font-['Bricolage_Grotesque'] border border-line shadow-lg">
          <h3 className="text-2xl sm:text-3xl font-bold mb-2">Resourceful Automobile</h3>
          <p className="text-4xl sm:text-6xl font-black text-beam tracking-tight leading-none mb-2">
            ₹4,800 crore
          </p>
          <p className="text-bone-dim text-sm sm:text-base leading-normal">
            of bids for a ₹12 crore issue from a Delhi two-wheeler dealer with 8 employees and 2 showrooms — subscribed more than 400 times.
          </p>
          <p className="mt-5 pt-3.5 border-t border-line font-['Source_Serif_4'] italic text-bone text-base">
            The check that matters: does the size of the business match the story being sold?
          </p>
          <cite className="block mt-4 not-italic text-xs text-bone-dim">
            Reported by India Today and The Times of India
          </cite>
        </article>
      </div>

      <p className="max-w-[62ch] mt-10 text-base sm:text-lg text-bone-dim leading-relaxed">
        Today the merchant banker who vets the documents is paid by the company, regulators usually act after listing, and almost no retail investor reads a 300-page DRHP. IPO X-Ray does the reading and the checking in minutes.
      </p>
    </section>
  );
}
