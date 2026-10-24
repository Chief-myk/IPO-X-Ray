import React, { useState } from 'react';
import { api, SourceLink, inputCls, btnCls, btnPrimaryCls } from './api.jsx';

const KINDS = [
  ['sebi_scores', 'SEBI complaint (SCORES)'],
  ['exchange', 'Stock exchange complaint'],
  ['rti_sebi', 'RTI application to SEBI'],
  ['cybercrime', 'Cyber-fraud report (1930)'],
];

/** Turns a feature's findings into a complaint / RTI draft the investor can edit, copy and file. */
export default function DraftPanel({ source, data, subject, defaultKind = 'sebi_scores', label = 'Draft a complaint / RTI' }) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState(defaultKind);
  const [me, setMe] = useState({ name: '', address: '', email: '', phone: '' });
  const [draft, setDraft] = useState(null);
  const [body, setBody] = useState('');
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState(false);

  const make = async () => {
    setErr('');
    try {
      const d = await api('/api/drafts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, source, data, subject, complainant: me }),
      });
      setDraft(d);
      setBody(d.body);
    } catch (e) { setErr(e.message); }
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(body); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { setErr('Copy failed: select the text and copy it by hand.'); }
  };
  const download = () => {
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([body], { type: 'text/plain' })),
      download: `${kind}-${(draft?.subject || 'draft').replace(/\W+/g, '-').toLowerCase()}.txt`,
    });
    a.click();
    URL.revokeObjectURL(a.href);
  };

  if (!open) return <button className={btnCls} onClick={() => setOpen(true)}>{label}</button>;

  return (
    <div className="rounded-2xl border border-line bg-film-2/70 p-4 mt-3 text-sm">
      <div className="flex items-center gap-2 mb-3">
        <h4 className="font-semibold text-bone flex-1">Turn these findings into a letter</h4>
        <button className="text-bone-dim hover:text-bone text-xs" onClick={() => setOpen(false)}>Close</button>
      </div>
      <div className="flex flex-wrap gap-2 mb-2">
        {KINDS.map(([k, t]) => (
          <button key={k} onClick={() => { setKind(k); setDraft(null); }}
            className={`px-3 py-1.5 rounded-full border text-xs ${kind === k ? 'border-beam text-beam bg-beam/10' : 'border-line text-bone-dim hover:text-bone'}`}>
            {t}
          </button>
        ))}
      </div>
      <div className="grid sm:grid-cols-2 gap-2">
        {[['name', 'Your name'], ['email', 'Email'], ['phone', 'Phone'], ['address', 'Postal address']].map(([k, ph]) => (
          <input key={k} className={inputCls} placeholder={`${ph} (optional, else a placeholder)`} value={me[k]}
            onChange={(e) => setMe({ ...me, [k]: e.target.value })} />
        ))}
      </div>
      <p className="text-xs text-bone-dim mt-2">Your details stay in your browser and in the draft; they are not stored.</p>
      <button className={`${btnPrimaryCls} mt-3`} onClick={make}>Generate draft</button>
      {err && <p className="text-critical mt-2" role="alert">{err}</p>}
      {draft && (
        <div className="mt-4">
          <p className="text-bone"><b>{draft.title}</b> · to {draft.to}</p>
          <p className="text-xs text-bone-dim mt-1">
            File at: {draft.where_to_file.split('  ·  ').map((w) => {
              const url = w.match(/https?:\/\/\S+/)?.[0];
              return <span key={w} className="mr-3">{url ? <SourceLink url={url}>{w}</SourceLink> : w}</span>;
            })}
          </p>
          {draft.findings_used === 0 && <p className="text-medium text-xs mt-2">No findings were passed in, so the facts section is a placeholder for you to fill.</p>}
          <textarea className={`${inputCls} w-full h-80 mt-3 font-mono text-xs leading-relaxed`} value={body}
            onChange={(e) => setBody(e.target.value)} aria-label="Draft text (editable)" />
          <div className="flex gap-2 mt-2">
            <button className={btnCls} onClick={copy}>{copied ? 'Copied' : 'Copy'}</button>
            <button className={btnCls} onClick={download}>Download .txt</button>
          </div>
          <ul className="mt-3 space-y-1 text-xs text-bone-dim list-disc pl-5">
            {draft.checklist.map((c) => <li key={c}>{c}</li>)}
          </ul>
          <p className="text-xs text-medium mt-2">{draft.note}</p>
        </div>
      )}
    </div>
  );
}
