import { Network, ShieldAlert, Scale, Calculator, CheckCircle2 } from 'lucide-react';

export const TOOLS = {
  xray: { label: 'X-Ray', blurb: 'Promoter network, vendor scorecards, live watch', icon: Network, iconClass: 'text-beam' },
  promises: { label: 'Promise Tracker', blurb: 'DRHP promises vs. what actually happened', icon: CheckCircle2, iconClass: 'text-clear' },
  debate: { label: 'Bull vs Bear', blurb: 'Two AI agents argue the case, a judge rules', icon: Scale, iconClass: 'text-beam' },
  simulator: { label: 'Simulator', blurb: 'Model your gains, losses and exit', icon: Calculator, iconClass: 'text-[#A8E8F2]' },
  shield: { label: 'Shield', blurb: 'Check tips, track records and your exit', icon: ShieldAlert, iconClass: 'text-high' },
};

export const TOOL_GROUPS = [
  { title: 'Research the company', tools: ['xray', 'promises', 'debate'] },
  { title: 'Protect your money', tools: ['simulator', 'shield'] },
];
