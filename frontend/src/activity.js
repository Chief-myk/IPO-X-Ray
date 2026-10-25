// Records everything the user does in the browser and ships it to /api/activity, which stores it
// in MySQL (ui_events). API calls themselves are logged server-side, tagged with the same ids.
//   visitor id - one per browser, kept in a cookie so every fetch / EventSource carries it
//   session id - one per tab, also sent as X-Session-Id on every fetch

const ENDPOINT = '/api/activity';
const FLUSH_MS = 2000;
const MAX_VALUE = 5000;

function rid() {
  return (crypto.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`);
}

function readCookie(name) {
  return document.cookie.split('; ').find((c) => c.startsWith(`${name}=`))?.split('=')[1];
}

function storageGet(store, key) {
  try { return store.getItem(key); } catch { return null; }
}

function storageSet(store, key, value) {
  try { store.setItem(key, value); } catch { /* private mode */ }
}

const visitorId = readCookie('xray_vid') || storageGet(localStorage, 'xray_vid') || rid();
document.cookie = `xray_vid=${visitorId}; path=/; max-age=${60 * 60 * 24 * 365 * 2}; SameSite=Lax`;
storageSet(localStorage, 'xray_vid', visitorId);

const sessionId = storageGet(sessionStorage, 'xray_sid') || rid();
storageSet(sessionStorage, 'xray_sid', sessionId);

let buffer = [];

export function track(type, fields = {}) {
  buffer.push({ type, ts: Date.now(), page: location.href, session_id: sessionId, ...fields });
  if (buffer.length >= 50) flush();
}

function flush(useBeacon = false) {
  if (!buffer.length) return;
  const body = JSON.stringify({ visitor_id: visitorId, session_id: sessionId, events: buffer });
  buffer = [];
  if (useBeacon && navigator.sendBeacon) {
    navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'application/json' }));
  } else {
    origFetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true })
      .catch(() => {});
  }
}

// Short, readable description of the element the user touched.
function describe(el) {
  if (!el || el === document) return null;
  const tag = el.tagName?.toLowerCase();
  const id = el.id ? `#${el.id}` : '';
  const name = el.getAttribute?.('name') ? `[name=${el.getAttribute('name')}]` : '';
  const label = el.getAttribute?.('aria-label') || el.getAttribute?.('placeholder') || el.getAttribute?.('title') || '';
  const text = (el.innerText || el.value || '').trim().replace(/\s+/g, ' ').slice(0, 120);
  return [tag + id + name, label && `"${label}"`, text && `: ${text}`].filter(Boolean).join(' ');
}

function clickable(el) {
  return el.closest?.('a, button, [role=button], [role=tab], input, select, textarea, label, summary') || el;
}

function fieldValue(el) {
  if (el.type === 'password') return '[hidden]';
  if (el.type === 'checkbox' || el.type === 'radio') return String(el.checked);
  if (el.type === 'file') return Array.from(el.files || []).map((f) => `${f.name} (${f.size} bytes)`).join(', ');
  return String(el.value ?? '').slice(0, MAX_VALUE);
}

// Every fetch carries the tab's session id; the activity endpoint itself uses the untouched fetch.
const origFetch = window.fetch.bind(window);
window.fetch = (input, init = {}) => {
  const headers = new Headers(init.headers || (input instanceof Request ? input.headers : undefined));
  headers.set('X-Session-Id', sessionId);
  return origFetch(input, { ...init, headers });
};

export function startActivityTracking() {
  track('session_start', {
    details: {
      referrer: document.referrer, language: navigator.language, platform: navigator.platform,
      screen: `${screen.width}x${screen.height}`, viewport: `${innerWidth}x${innerHeight}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  });
  track('page_view', { target: document.title });

  window.addEventListener('hashchange', (e) => track('route_change', { value: location.hash, details: { from: e.oldURL } }));

  document.addEventListener('click', (e) => {
    const el = clickable(e.target);
    track('click', { target: describe(el), details: { href: el.href, x: e.clientX, y: e.clientY } });
  }, true);

  // `change` fires once a field is committed - one row per edit, not per keystroke.
  document.addEventListener('change', (e) => {
    const el = e.target;
    track('input', { target: describe(el), value: fieldValue(el), details: { field_type: el.type } });
  }, true);

  document.addEventListener('submit', (e) => {
    const data = {};
    try {
      new FormData(e.target).forEach((v, k) => {
        data[k] = v instanceof File ? `${v.name} (${v.size} bytes)` : String(v).slice(0, MAX_VALUE);
      });
    } catch { /* not a real form */ }
    track('form_submit', { target: describe(e.target), value: JSON.stringify(data) });
  }, true);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.matches?.('input, textarea')) {
      track('enter_pressed', { target: describe(e.target), value: fieldValue(e.target) });
    }
  }, true);

  document.addEventListener('copy', () => track('copy', { value: String(getSelection()).slice(0, MAX_VALUE) }));

  let scrollTimer;
  let maxDepth = 0;
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      const depth = Math.round(((scrollY + innerHeight) / document.documentElement.scrollHeight) * 100);
      if (depth > maxDepth + 10) { maxDepth = depth; track('scroll', { value: `${depth}%` }); }
    }, 400);
  }, { passive: true });

  window.addEventListener('error', (e) => track('js_error', { value: e.message, details: { src: e.filename, line: e.lineno } }));
  window.addEventListener('unhandledrejection', (e) => track('js_error', { value: String(e.reason?.message || e.reason) }));

  document.addEventListener('visibilitychange', () => {
    track(document.visibilityState === 'hidden' ? 'tab_hidden' : 'tab_visible');
    if (document.visibilityState === 'hidden') flush(true);
  });
  window.addEventListener('pagehide', () => { track('page_leave'); flush(true); });

  setInterval(flush, FLUSH_MS);
}
