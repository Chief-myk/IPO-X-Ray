import React from 'react';
import { Play, Search } from 'lucide-react';
import Section, { SectionTitle } from './ui/Section';
import { hrefs } from '../router';

/* Shown on the Investigate view until a case has been started. */
export default function InvestigateEmpty({ onSample, isSubmitting }) {
  return (
    <Section id="case" eyebrow="Investigate" aria-labelledby="emptyTitle" className="!border-t-0 min-h-[60svh]">
      <div className="max-w-2xl">
        <SectionTitle id="emptyTitle">No case running yet</SectionTitle>
        <p className="mt-5 text-base sm:text-lg text-bone-dim leading-relaxed">
          Start an investigation from the home page and its live agent monitor and final verdict will appear here. Or watch a finished run on the sample case.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="#/probe"
            className="inline-flex items-center gap-2 rounded-md bg-bone hover:bg-white px-5 py-3 text-sm font-bold text-abyss no-underline transition-all hover:-translate-y-0.5"
          >
            <Search className="h-4 w-4 stroke-[2.5]" /> Investigate a company
          </a>
          <button
            type="button"
            onClick={onSample}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-md border border-line bg-panel/90 px-5 py-3 text-sm font-medium text-bone transition-colors hover:border-beam/60 hover:bg-film-2 disabled:opacity-60"
          >
            <Play className="h-4 w-4 text-beam" /> Run the sample case
          </button>
        </div>
        <p className="mt-6 text-sm text-mute">
          Looking for the deep-dive tools? <a href={hrefs.toolkit()} className="text-beam hover:underline">Open the toolkit</a>.
        </p>
      </div>
    </Section>
  );
}
