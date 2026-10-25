import React, { useEffect, useState } from 'react';
import Section, { SectionTitle } from './ui/Section';
import XRay from './xray/XRay';
import Shield from './xray/Shield';
import AgentDebate from './AgentDebate';
import InvestmentSimulator from './InvestmentSimulator';
import PromiseTracker from './PromiseTracker';
import { DEFAULT_TOOL, hrefs } from '../router';
import { TOOLS, TOOL_GROUPS } from '../toolsConfig';

function Panel({ id, active, children }) {
  return (
    <div
      role="tabpanel"
      id={`panel-${id}`}
      aria-labelledby={`tab-${id}`}
      hidden={!active}
      className={active ? 'tool-panel' : undefined}
    >
      {children}
    </div>
  );
}

export default function ToolsHub({ tool, visible, investigation }) {
  const active = tool || DEFAULT_TOOL;
  // Tools mount on first visit and then stay mounted, so a running debate or simulation survives switching.
  const [seen, setSeen] = useState({ [active]: true });
  if (!seen[active]) setSeen({ ...seen, [active]: true });

  // Charts measured while hidden need a nudge to re-measure once shown again.
  useEffect(() => {
    if (visible) window.dispatchEvent(new Event('resize'));
  }, [visible, active]);

  const tabClass = (isActive) =>
    `group flex w-full items-center gap-3 rounded-md border px-3.5 py-3 text-left no-underline transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-beam/60 ${
      isActive
        ? 'border-beam/40 bg-film-2/80 text-bone'
        : 'border-transparent text-bone-dim hover:border-line/70 hover:bg-film-2/40 hover:text-bone'
    }`;

  return (
    <Section id="toolkit" eyebrow="Toolkit" aria-labelledby="toolsTitle" className="!border-t-0">
      <div className="max-w-3xl">
        <SectionTitle id="toolsTitle">Investigation toolkit</SectionTitle>
        <p className="mt-5 text-base sm:text-lg text-bone-dim leading-relaxed">
          Five deep-dive tools, grouped by what you are trying to do. Each one keeps its state while you move between them.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-10">
        <nav aria-label="Investigation tools" className="lg:sticky lg:top-24 lg:self-start">
          <div role="tablist" aria-orientation="vertical" className="flex flex-col gap-5">
            {TOOL_GROUPS.map((group) => (
              <div key={group.title}>
                <div className="mb-2 px-1 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-mute">
                  {group.title}
                </div>
                <div className="grid grid-cols-2 gap-2 lg:flex lg:flex-col">
                  {group.tools.map((key) => {
                    const t = TOOLS[key];
                    const Icon = t.icon;
                    const isActive = active === key;
                    return (
                      <a
                        key={key}
                        id={`tab-${key}`}
                        role="tab"
                        href={hrefs.toolkit(key)}
                        aria-selected={isActive}
                        aria-controls={`panel-${key}`}
                        className={tabClass(isActive)}
                      >
                        <Icon className={`h-5 w-5 flex-none ${t.iconClass}`} />
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold">{t.label}</span>
                          <span className="hidden text-xs leading-snug text-mute lg:block">{t.blurb}</span>
                        </span>
                      </a>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>

        <div className="min-w-0">
          {seen.xray && (
            <Panel id="xray" active={active === 'xray'}>
              <XRay />
            </Panel>
          )}
          {seen.promises && (
            <Panel id="promises" active={active === 'promises'}>
              <PromiseTracker currentCompany={investigation?.company} />
            </Panel>
          )}
          {seen.debate && (
            <Panel id="debate" active={active === 'debate'}>
              <AgentDebate currentCompany={investigation?.company} investigationId={investigation?.id} />
            </Panel>
          )}
          {seen.simulator && (
            <Panel id="simulator" active={active === 'simulator'}>
              <InvestmentSimulator currentCompany={investigation?.company} riskScore={investigation?.score} />
            </Panel>
          )}
          {seen.shield && (
            <Panel id="shield" active={active === 'shield'}>
              <Shield />
            </Panel>
          )}
        </div>
      </div>
    </Section>
  );
}
