"""Feature 7: Complaint / RTI drafts. Turn findings into a letter an investor can actually file.

Drafts are filled from templates, not written by a model: every fact in a draft is one of the findings passed in,
with its source link, and the wording asks the authority to examine, never asserts fraud. The complainant's own
details are left as [PLACEHOLDERS] for them to fill in. Where-to-file links and timelines are stated as of 2026;
the user is told to confirm them on the authority's site before filing.

Kinds:
  sebi_scores   complaint to SEBI through SCORES (company / intermediary conduct, disclosures)
  exchange      complaint to the NSE / BSE investor services cell (listed or SME-platform company)
  rti_sebi      RTI application to SEBI's CPIO asking for records (orders, complaints count, registration status)
  cybercrime    report of a suspected investment scam (cybercrime.gov.in / 1930, Chakshu, SEBI)
"""
import re
from datetime import date

KINDS = {
    "sebi_scores": "Complaint to SEBI (SCORES)",
    "exchange": "Complaint to the stock exchange",
    "rti_sebi": "RTI application to SEBI",
    "cybercrime": "Cyber-fraud report (1930 / cybercrime.gov.in)",
}
P = {k: f"[{k.upper()}]" for k in ("name", "address", "email", "phone", "pan", "demat", "place", "amount", "txn_id", "date_paid")}


def _urls(v) -> list[str]:
    out = []
    for u in v if isinstance(v, list) else [v]:
        if isinstance(u, str) and re.match(r"https?://", u) and u not in out:
            out.append(u)
    return out


def findings_from(source: str, data: dict) -> tuple[str, list[dict], dict]:
    """Normalise what a feature produced into (subject, findings, identifiers). Findings: {title, detail, sources}."""
    data = data or {}
    if source == "ipo_report":
        fs = [{"title": f.get("title", ""), "detail": f"{f.get('target') + ': ' if f.get('target') else ''}{f.get('detail', '')}",
               "sources": _urls(f.get("evidence") or [])}
              for f in data.get("flags") or [] if f.get("severity") not in {"clear", None}]
        return data.get("company") or "", fs, {}
    if source == "autopsy":
        fs = []
        for c in data.get("claims") or []:
            if c.get("status") == "verified":
                continue
            srcs = [x.get("source_url") for x in c.get("checks") or []]
            detail = f"The message says: \"{c.get('quote', '').rstrip('.!? ')}\". {c.get('why', '')}"
            for x in c.get("checks") or []:
                if x.get("status") == "contradicted":
                    detail += f" Official check: {x.get('title')}. {x.get('detail', '')}"
            fs.append({"title": c.get("title", ""), "detail": detail.strip(), "sources": _urls(srcs)})
        ids = {}
        for e in data.get("entities") or []:
            ids.setdefault(e.get("kind"), []).append(e.get("name"))
        subject = next((e["name"] for e in data.get("entities") or [] if e.get("kind") in {"company", "person"}), "")
        return subject, fs, ids
    if source == "network":
        fs = [{"title": f"Shared or repeated {f.get('kind') or 'link'}",
               "detail": f.get("reason", "") + (f" Companies involved: {', '.join(f['companies'])}." if f.get("companies") else ""),
               "sources": _urls(f.get("source_url"))}
              for f in data.get("flags") or []]
        start = next((n for n in data.get("nodes") or [] if n.get("id") == data.get("start")), {})
        return start.get("label") or data.get("query") or "", fs, {}
    if source == "vendor":
        fs = []
        for v in data.get("vendors") or [data]:
            failed = [c for c in v.get("checks") or [] if c.get("status") == "fail"]
            if v.get("score") is not None and (v["score"] < 40 or failed):
                fs.append({"title": f"Vendor {v.get('name')} shows little real-world presence ({v['score']}/100)",
                           "detail": "; ".join(f"{c['label']}: {c['detail']}" for c in failed) or "Low presence score.",
                           "sources": _urls(v.get("sources") or [])})
            if v.get("multi_company_flag"):
                fs.append({"title": f"Vendor {v.get('name')} is named by several companies",
                           "detail": "Named as a vendor by: " + ", ".join(v.get("used_by") or []), "sources": _urls(v.get("sources") or [])})
        return data.get("company") or ", ".join(sorted({c for v in data.get("vendors") or [data] for c in v.get("used_by") or []})), fs, {}
    if source == "liquidity":
        h, st = data.get("headline") or {}, data.get("market") or {}
        fs = [{"title": "Very thin trading", "detail":
               f"Over {st.get('sessions')} sessions ({st.get('from')} to {st.get('to')}): {st.get('zero_volume_pct')}% of days had no trades, "
               f"{st.get('lower_circuit_days')} lower-circuit days, longest lower-circuit run {st.get('max_consecutive_lower_circuits')} days. "
               f"Simulated worst case ({h.get('worst_scenario')}): {h.get('worst_loss_pct')}% below screen value.",
               "sources": _urls(data.get("source_url"))}] if st else []
        return data.get("name") or data.get("symbol") or "", fs, {}
    return "", [], {}


def _facts(findings, limit=12) -> str:
    lines = []
    for i, f in enumerate(findings[:limit], 1):
        src = "".join(f"\n      Source: {u}" for u in f["sources"][:3])
        lines.append(f"  {i}. {f['title']}. {f['detail']}{src}")
    return "\n".join(lines) or "  1. [DESCRIBE WHAT YOU OBSERVED, WITH DATES AND LINKS]"


def _me(c) -> str:
    return (f"Name: {c.get('name') or P['name']}\nAddress: {c.get('address') or P['address']}\n"
            f"Email: {c.get('email') or P['email']}    Phone: {c.get('phone') or P['phone']}")


def draft(kind: str, source: str, data: dict, complainant: dict | None = None, subject: str | None = None) -> dict:
    if kind not in KINDS:
        raise ValueError(f"Unknown draft kind: {kind}")
    c = {k: (v or "").strip() for k, v in (complainant or {}).items() if isinstance(v, str)}
    subj, findings, ids = findings_from(source, data)
    subj = (subject or subj or "[NAME OF COMPANY / ENTITY]").strip()
    today = date.today().strftime("%d %B %Y")
    facts = _facts(findings)
    screening = ("The points above come from automated screening of public sources (links given). I am not alleging "
                 "wrongdoing; I am asking you to examine them because they may affect investors.")

    if kind == "sebi_scores":
        out = {
            "to": "Securities and Exchange Board of India, through SCORES",
            "where_to_file": "https://scores.sebi.gov.in",
            "subject_line": f"Request to examine disclosures / conduct of {subj}",
            "body": f"""To,
Securities and Exchange Board of India
(filed through SCORES)

Date: {today}

Subject: Request to examine disclosures / conduct of {subj}

Respected Sir/Madam,

I am a retail investor{(' holding demat account ' + c['demat']) if c.get('demat') else ''}. I am writing about {subj}. While checking the public record I found the following points, which I could not reconcile with what investors were told:

{facts}

{screening}

I request SEBI to:
  (a) examine whether the disclosures made to investors by {subj} are accurate and complete on these points;
  (b) direct the entity and its intermediaries to clarify them; and
  (c) take such action as SEBI considers appropriate.

Complainant:
{_me(c)}
PAN: {c.get('pan') or P['pan']}

I confirm that the information given is true to the best of my knowledge.

{c.get('name') or P['name']}""",
            "checklist": ["Choose the right category in SCORES (listed company / SME, or the type of intermediary).",
                          "Attach screenshots or PDFs of each source link above.",
                          "Add your own dealings (application number, allotment, contract notes) if you invested.",
                          "Note the SCORES registration number; SCORES routes the complaint to the entity first and tracks its reply."],
        }
    elif kind == "exchange":
        out = {
            "to": "Investor Services Cell, NSE / BSE",
            "where_to_file": "https://investorhelpline.nseindia.com (NSE)  ·  https://bsecrs.bseindia.com (BSE)",
            "subject_line": f"Complaint / request for clarification regarding {subj}",
            "body": f"""To,
The Investor Services Cell
[National Stock Exchange of India Ltd / BSE Ltd]

Date: {today}

Subject: Request for clarification regarding {subj}

Respected Sir/Madam,

I am an investor{(' (demat ' + c['demat'] + ')') if c.get('demat') else ''} writing about {subj}{(', ' + data.get('symbol')) if data.get('symbol') else ''}, which is listed / proposed to be listed on your platform. I found the following points on the public record:

{facts}

{screening}

I request the Exchange to seek a clarification from the company under its listing obligations, to disseminate it to investors, and to examine whether any further action is needed.

Complainant:
{_me(c)}

{c.get('name') or P['name']}""",
            "checklist": ["Pick the exchange where the company is listed (NSE Emerge / BSE SME for SME IPOs).",
                          "Attach the source documents.",
                          "Keep the complaint reference number for follow-up or a later SCORES complaint."],
        }
    elif kind == "rti_sebi":
        regs = ids.get("registration") or []
        asks = [f"The number of investor complaints received by SEBI against {subj} from [START DATE] to date, and how many are pending (aggregate numbers only).",
                f"The dates and reference numbers of any orders, show-cause notices or settlement orders issued by SEBI concerning {subj}.",
                f"Whether SEBI has initiated any examination, investigation or inspection concerning {subj}, and if so the date it was initiated (not its contents).",
                f"Copies of the replies and action-taken reports on my complaint(s) [SCORES REGISTRATION NO., if any] concerning {subj}."]
        asks += [f"Whether {r} is a valid SEBI registration, the name of the registered holder, the category and the validity period." for r in regs[:3]]
        out = {
            "to": "The Central Public Information Officer, SEBI",
            "where_to_file": "https://rtionline.gov.in (choose 'Securities and Exchange Board of India'), or by post with the fee",
            "subject_line": f"Application under Section 6(1) of the RTI Act, 2005 regarding {subj}",
            "body": f"""To,
The Central Public Information Officer
Securities and Exchange Board of India
SEBI Bhavan, Plot No. C4-A, 'G' Block, Bandra Kurla Complex, Bandra (East), Mumbai 400051

Date: {today}

Subject: Application under Section 6(1) of the Right to Information Act, 2005 regarding {subj}

Sir/Madam,

Please provide the following information held by SEBI:

""" + "\n".join(f"  {i}. {a}" for i, a in enumerate(asks, 1)) + f"""

Background, for context only: as an investor I came across the following publicly available points about {subj}:
{facts}

I am a citizen of India. The application fee of Rs 10 is paid by [IPO / DD / online payment no. ____]. If any part of this information is held by another public authority, kindly transfer that part under Section 6(3). I would prefer the information in electronic form at the email address below.

Applicant:
{_me(c)}

Place: {c.get('place') or P['place']}

{c.get('name') or P['name']}""",
            "checklist": ["Fee: Rs 10 (online on rtionline.gov.in, or IPO/DD to 'Securities and Exchange Board of India'). BPL applicants attach the BPL certificate instead.",
                          "Ask only for records, not opinions or 'why' questions; the CPIO is not required to create information.",
                          "Information about third parties may be refused under Section 8(1)(e), (h) or (j). Aggregate numbers are usually given.",
                          "The reply is due within 30 days. If refused or unanswered, file a first appeal to SEBI's First Appellate Authority within 30 days."],
        }
    else:   # cybercrime
        idlines = []
        for k, label in (("upi", "UPI IDs"), ("phone", "Phone / WhatsApp numbers"), ("website", "Websites / links"),
                         ("registration", "Registration numbers shown"), ("person", "Names used"), ("company", "Companies named")):
            if ids.get(k):
                idlines.append(f"  {label}: {', '.join(ids[k])}")
        out = {
            "to": "National Cyber Crime Reporting Portal (Ministry of Home Affairs)",
            "where_to_file": "https://cybercrime.gov.in  ·  call 1930 at once if money has been paid  ·  https://sancharsaathi.gov.in (Chakshu) for the message/number",
            "subject_line": "Suspected online investment / IPO fraud",
            "body": f"""Category: Online Financial Fraud > Investment / Trading scam

Date of report: {today}

I received the following investment offer [ON WHATSAPP / TELEGRAM / SMS / SOCIAL MEDIA] on [DATE RECEIVED]. It shows the signs of an investment fraud listed below.

Identifiers used by the sender:
{chr(10).join(idlines) or '  [UPI IDs, phone numbers, links, account numbers used by the sender]'}

What the message claims, and why it appears fraudulent:
{facts}

Money paid (if any): {c.get('amount') or P['amount']} on {c.get('date_paid') or P['date_paid']}, transaction / UTR no. {c.get('txn_id') or P['txn_id']}

I request that the identifiers above be investigated and, if money was transferred, that the receiving accounts be frozen.

Complainant:
{_me(c)}""",
            "checklist": ["If you paid money, call 1930 immediately: the first hours matter for freezing the funds.",
                          "Attach screenshots of the full chat, the sender's profile and every payment receipt.",
                          "Report the number / message on Sanchar Saathi (Chakshu) and block the sender.",
                          "If the sender claims to be SEBI-registered, also complain on SCORES; if they used a broker's name, inform that broker."],
        }
    return {"kind": kind, "title": KINDS[kind], "subject": subj, "findings_used": len(findings[:12]), **out,
            "note": "Draft built only from the findings shown, with [PLACEHOLDERS] for your details. Read it, correct anything "
                    "that is wrong, and confirm the filing address and fee on the official website before sending."}
