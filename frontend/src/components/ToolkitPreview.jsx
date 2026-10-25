import React from 'react';
import { ArrowRight } from 'lucide-react';
import Section, { SectionTitle } from './ui/Section';
import { TOOLS, TOOL_GROUPS } from '../toolsConfig';
import { hrefs } from '../router';

/* Landing-page teaser: what else the platform does, each card opens its tool in the Toolkit view. */
export default function ToolkitPreview() {
  return (
    <Section id="toolkit-preview" eyebrow="Beyond the scan" aria-labelledby="previewTitle">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          <SectionTitle id="previewTitle">Five tools, one workspace</SectionTitle>
          <p className="mt-5 text-base sm:text-lg text-bone-dim leading-relaxed">
            Once the scan is done, go deeper: map who is behind the issuer, argue both sides, or stress-test your own exit.
          </p>
        </div>
        <a
          href={hrefs.toolkit()}
          className="inline-flex flex-none items-center gap-2 self-start rounded-md border border-line bg-panel/90 px-4 py-2.5 text-sm font-medium text-bone no-underline transition-colors hover:border-beam/60 hover:bg-film-2 md:self-auto"
        >
          Open the toolkit <ArrowRight className="h-4 w-4 text-beam" />
        </a>
      </div>

      <div className="mt-10 space-y-8">
        {TOOL_GROUPS.map((group) => (
          <div key={group.title}>
            <div className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-mute">{group.title}</div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.tools.map((key) => {
                const t = TOOLS[key];
                const Icon = t.icon;
                return (
                  <a
                    key={key}
                    href={hrefs.toolkit(key)}
                    className="group flex items-start gap-4 rounded-lg border border-line/80 bg-panel/70 p-5 no-underline transition-all duration-200 hover:-translate-y-0.5 hover:border-beam/50 hover:bg-film-2/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-beam/60"
                  >
                    <span className="grid h-11 w-11 flex-none place-items-center rounded-md border border-line bg-film">
                      <Icon className={`h-5 w-5 ${t.iconClass}`} />
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 text-base font-semibold text-bone">
                        {t.label}
                        <ArrowRight className="h-4 w-4 text-beam opacity-0 transition-opacity group-hover:opacity-100" />
                      </span>
                      <span className="mt-1 block text-sm leading-snug text-bone-dim">{t.blurb}</span>
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
