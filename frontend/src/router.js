import { useEffect, useState } from 'react';

export const TOOL_KEYS = ['xray', 'promises', 'debate', 'simulator', 'shield'];
export const DEFAULT_TOOL = 'xray';
export const DECIDE_KEYS = ['range', 'plan', 'sell'];

// Routes live in the hash so the plain static build needs no server rewrites:
//   #/                 landing page          (#how, #cases, #probe scroll to a landing section)
//   #/investigate      live case + verdict
//   #/toolkit[/tool]   the five deep-dive tools (#xray, #debate, … still open the right tool)
//   #/decide[/tool]    decision desk: listing range, application planner, sell timing
export function parseHash(hash = window.location.hash) {
  const [first = '', second = ''] = hash.replace(/^#\/?/, '').split('/');

  if (['investigate', 'case', 'report'].includes(first)) return { view: 'investigate' };
  if (['toolkit', 'tools'].includes(first)) {
    return { view: 'toolkit', tool: TOOL_KEYS.includes(second) ? second : null };
  }
  if (TOOL_KEYS.includes(first)) return { view: 'toolkit', tool: first };
  if (first === 'decide') return { view: 'decide', tool: DECIDE_KEYS.includes(second) ? second : null };
  return { view: 'home', anchor: first || null };
}

export const hrefs = {
  home: '#/',
  investigate: '#/investigate',
  toolkit: (tool) => (tool ? `#/toolkit/${tool}` : '#/toolkit'),
  decide: (tool) => (tool ? `#/decide/${tool}` : '#/decide'),
};

export function navigate(href) {
  if (window.location.hash === href) window.dispatchEvent(new HashChangeEvent('hashchange'));
  else window.location.hash = href;
}

export function useRoute() {
  const [route, setRoute] = useState(() => parseHash());
  useEffect(() => {
    const onChange = () => setRoute(parseHash());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
