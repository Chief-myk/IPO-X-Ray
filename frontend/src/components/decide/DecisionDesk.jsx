import React, { useState } from 'react';
import { CalendarClock, Gauge, Wallet } from 'lucide-react';
import Section, { SectionTitle } from '../ui/Section';
import { DECIDE_KEYS, hrefs, navigate } from '../../router';
import ListingRange from './ListingRange';
import ApplyPlanner from './ApplyPlanner';
import SellTiming from './SellTiming';

const TABS = {
  range: { label: 'Listing range', blurb: 'Where it is likely to open, and how sure that is', icon: Gauge },
  plan: { label: 'Application planner', blurb: "This week's IPOs, your money, your accounts", icon: Wallet },
  sell: { label: 'Sell timing', blurb: 'Listing day vs. holding, after charges and tax', icon: CalendarClock },
};

/** Decide, not just watch: three tools that turn odds, ranges and tax rules into a decision. */
export default function DecisionDesk({ tool }) {
  // A bare #/decide (or leaving the view) keeps whichever tool was open last.
  const [last, setLast] = useState(DECIDE_KEYS.includes(tool) ? tool : DECIDE_KEYS[0]);
  const active = DECIDE_KEYS.includes(tool) ? tool : last;
  if (active !== last) setLast(active);
  // Tools stay mounted after their first visit so inputs and results survive switching tabs.
  const [seen, setSeen] = useState({ [active]: true });
  if (!seen[active]) setSeen({ ...seen, [active]: true });
  // Hand-offs from the Listing range tool; each new object is taken once by the receiving tool.
  const [toPlan, setToPlan] = useState(null);
  const [toSell, setToSell] = useState(null);

  return (
    <Section id="decide" eyebrow="Decision desk" aria-labelledby="decideTitle" className="!border-t-0">
      <div className="max-w-3xl">
        <SectionTitle id="decideTitle">Apply, hold or sell?</SectionTitle>
        <p className="mt-5 text-base sm:text-lg text-bone-dim leading-relaxed">
          Calculators give you one number. These give you the range, the odds and what you keep after tax, and show how
          well their own method has done on past listings.
        </p>
      </div>

      <div role="tablist" aria-label="Decision tools" className="mt-10 grid gap-2 sm:grid-cols-3">
        {DECIDE_KEYS.map((k) => {
          const t = TABS[k];
          const Icon = t.icon;
          const on = k === active;
          return (
            <a key={k} id={`tab-decide-${k}`} role="tab" aria-selected={on} aria-controls={`panel-decide-${k}`} href={hrefs.decide(k)}
              className={`group flex items-start gap-3 rounded-md border px-4 py-3 no-underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-beam/60 ${
                on ? 'border-beam/50 bg-film-2/80 text-bone' : 'border-line/70 text-bone-dim hover:border-line hover:bg-film-2/40 hover:text-bone'}`}>
              <Icon className={`mt-0.5 w-5 h-5 flex-none ${on ? 'text-beam' : 'text-mute group-hover:text-beam'}`} />
              <span>
                <span className="block font-semibold text-sm">{t.label}</span>
                <span className="block text-xs text-bone-dim">{t.blurb}</span>
              </span>
            </a>
          );
        })}
      </div>

      <div className="mt-8">
        {seen.range && (
          <div role="tabpanel" id="panel-decide-range" aria-labelledby="tab-decide-range" hidden={active !== 'range'}>
            <ListingRange
              onUseInPlanner={(r) => { setToPlan(r); navigate(hrefs.decide('plan')); }}
              onUseInSell={(r) => { setToSell(r); navigate(hrefs.decide('sell')); }}
            />
          </div>
        )}
        {(seen.plan || toPlan) && (
          <div role="tabpanel" id="panel-decide-plan" aria-labelledby="tab-decide-plan" hidden={active !== 'plan'}>
            <ApplyPlanner incoming={toPlan} />
          </div>
        )}
        {(seen.sell || toSell) && (
          <div role="tabpanel" id="panel-decide-sell" aria-labelledby="tab-decide-sell" hidden={active !== 'sell'}>
            <SellTiming incoming={toSell} />
          </div>
        )}
      </div>
    </Section>
  );
}
