"""Feature 6: Financial Claim Autopsy. Take a WhatsApp/Telegram tip, an ad, a pre-IPO offer, a prospectus page or a
public link, pull out what it promises and who it names, check those against official records, and lay the result
out as an evidence graph: each claim is verified, contradicted or unknown, with the source.

Detection looks at what the message asks you to believe or do (guaranteed returns, allotment promises, paying a
personal UPI ID, a well-known name used on an unofficial channel, a look-alike domain), not just at keywords.
Rules are deterministic and every flag quotes the sentence that triggered it. Agent checks only ever upgrade a claim
to "verified" or "contradicted" when an official page was actually read; a failed or skipped check stays "unknown".
"Contradicted" needs positive evidence (a record that says otherwise). An agent that searched and found nothing gives
"unknown": in a live test an agent missed a real RHP, so "not found" must never be read as "does not exist".
"""
import asyncio
import base64
import difflib
import json
import os
import re

import collect
from collect import _arr, _obj, _s, _top
from extractor import _llm, pdf_pages

MAX_TEXT = 20000
_B = {"type": "boolean", "nullable": True}

OFFICIAL = {   # brands scammers often impersonate -> their real domains
    "SEBI": ["sebi.gov.in", "scores.sebi.gov.in"], "NSE": ["nseindia.com"], "BSE": ["bseindia.com"], "RBI": ["rbi.org.in"],
    "Zerodha": ["zerodha.com"], "Groww": ["groww.in"], "Upstox": ["upstox.com"], "Angel One": ["angelone.in"],
    "ICICI Direct": ["icicidirect.com"], "HDFC Securities": ["hdfcsec.com"], "Kotak Securities": ["kotaksecurities.com"],
    "Motilal Oswal": ["motilaloswal.com"], "Sharekhan": ["sharekhan.com"], "5paisa": ["5paisa.com"],
    "Paytm Money": ["paytmmoney.com"], "Dhan": ["dhan.co"], "NSDL": ["nsdl.co.in"], "CDSL": ["cdslindia.com"],
}
FAMOUS = ["Nithin Kamath", "Nikhil Kamath", "Radhakishan Damani", "Vijay Kedia", "Ashish Kacholia", "Raamdeo Agrawal",
          "Porinju Veliyath", "Basant Maheshwari", "Sunil Singhania", "Mukul Agrawal", "Dolly Khanna", "Anil Singhvi",
          "Rakesh Jhunjhunwala", "Madhabi Puri Buch", "Tuhin Kanta Pandey", "Ashishkumar Chauhan"]

UPI_PAT = (r"\b[\w.-]{2,}@(?:ok\w+|ybl|ibl|axl|paytm|upi|apl|yapl|icici|sbi|hdfcbank|axisbank|kotak|yesbank|fbl|pt\w+|"
           r"waaxis|wahdfcbank|wasbi|naviaxis|jupiteraxis|freecharge|slice\w*)\b")

# (kind, title, why, weight, pattern)
RULES = [
    ("promise", "Guaranteed or risk-free returns", "SEBI-registered advisers and brokers are not allowed to guarantee returns. A promise of fixed or risk-free profit from shares is a classic scam sign.", 3,
     r"\b(guarantee[d]?|assured|fixed|confirm(?:ed)?|sure[- ]?shot|risk[- ]?free|no[- ]risk|zero[- ]loss|100\s*%\s*(?:safe|profit|return|accura\w*))\b[^.\n]{0,60}\b(return|profit|income|gain|listing|payout|accura\w*|safe)"),
    ("promise", "Guaranteed or risk-free returns", "SEBI-registered advisers and brokers are not allowed to guarantee returns. A promise of fixed or risk-free profit from shares is a classic scam sign.", 3,
     r"\b(return|profit|income|gain)s?\b[^.\n]{0,40}\b(guarantee[d]?|assured|fixed|risk[- ]?free)\b"),
    ("offer", "Promises an IPO allotment or quota", "IPO shares are allotted by the registrar, by lottery when oversubscribed. Nobody can sell or promise you an allotment, an 'HNI/anchor quota' or a 'pre-IPO' slot over chat.", 3,
     r"\b(allotment\s+(?:guarantee[d]?|confirm(?:ed)?|assured|sure)|guarantee[d]?\s+allotment|(?:hni|anchor|vip|special|institutional)\s+quota|ipo\s+quota|pre[- ]?ipo\s+(?:allotment|shares|slot|offer|quota|placement))\b"),
    ("offer", "Unlisted / pre-IPO shares sold over chat", "Pre-IPO and unlisted share offers through WhatsApp or Telegram are hard to verify and often fake. Check the company's offer document and who is actually selling.", 2,
     r"\b(pre[- ]?ipo|unlisted\s+shares?|grey\s+market|gmp)\b"),
    ("credential", "Says 'approved by SEBI / RBI / government'", "SEBI does not approve tips, schemes or investment returns. 'SEBI approved' is used to borrow trust.", 2,
     r"\b(sebi|rbi|government|govt|nse|bse)[- ]?(approved|certified|authori[sz]ed|backed|verified)\b|\bapproved\s+by\s+(sebi|rbi|government|govt)\b"),
    ("manipulation", "Insider tips, operators or 'circuit' promises", "Trading on insider information or 'operator' tips is illegal, and promised upper circuits are a pump-and-dump pattern.", 2,
     r"\b(insider\s+(?:news|info\w*|tip)|operator\s+(?:stock|call|game|news)|inside\s+information|upper\s+circuit\s+(?:guarantee\w*|confirm\w*|sure|pakka)|jackpot\s+(?:stock|call|share))\b"),
    ("pressure", "Pressure to act fast", "Deadlines and limited seats are there to stop you from checking.", 1,
     r"\b(limited\s+(?:seats|slots|time|offer)|only\s+(?:today|\d+\s+(?:seats|slots|people))|last\s+(?:chance|few\s+(?:hours|seats|slots)|day)|hurry|offer\s+ends|join\s+(?:now|fast|immediately)|act\s+now)\b"),
    ("channel", "Moves you to a private group or app", "Investment fraud usually runs through 'VIP' WhatsApp/Telegram groups or an app downloaded from a link, not a registered platform.", 1,
     r"(t\.me/|telegram\.me/|chat\.whatsapp\.com|wa\.me/|\bvip\s+group\b|\bpremium\s+group\b|\bjoin\s+(?:our|my)\s+(?:group|channel)\b)"),
    ("channel", "Asks you to install an app from a link", "Fake trading apps show fake profits and then block withdrawals. Install trading apps only from your broker's official store listing.", 2,
     r"(\.apk\b|download\s+(?:the|our|this)\s+app|install\s+(?:the|our|this)\s+app)"),
    ("payment", "Payment to a personal UPI ID or bank account", "Real brokers and IPO applications never ask you to send money to a person's UPI ID or account. IPO money is only blocked in your own bank account (ASBA/UPI mandate).", 3,
     UPI_PAT),
    ("payment", "Bank transfer details in the message", "A message that asks you to transfer money to a given account is not how registered intermediaries collect funds.", 2,
     r"\b(?:ifsc\s*[:\-]?\s*[A-Z]{4}0[A-Z0-9]{6}|a/?c\s*(?:no\.?|number)\s*[:\-]?\s*\d{9,18}|account\s+(?:no\.?|number)\s*[:\-]?\s*\d{9,18})\b"),
]
RETURN = re.compile(r"(\d{1,4}(?:\.\d+)?)\s*%\s*(?:return|profit|gain|income)?s?\s*(?:per|a|an|every|each|/|in\s+(?:a|one|1))?\s*"
                    r"(day|daily|week|weekly|month|monthly|year|yearly|annual(?:ly)?|p\.?a\.?)\b", re.I)
MULTIPLY = re.compile(r"\b(double|triple|2\s*x|3\s*x|5\s*x|10\s*x)\b[^.\n]{0,40}?\b(?:in|within)\s+(\d+)\s*(day|week|month|year)s?\b", re.I)
PERIODS = {"day": 250, "daily": 250, "week": 52, "weekly": 52, "month": 12, "monthly": 12, "year": 1, "yearly": 1,
           "annual": 1, "annually": 1, "pa": 1}
PERIOD_NOUN = {"daily": "day", "weekly": "week", "monthly": "month", "yearly": "year", "annual": "year", "annually": "year", "pa": "year"}

REGNO = re.compile(r"\bIN[A-Z]\d{9}\b")
UPI = re.compile(UPI_PAT, re.I)
PHONE = re.compile(r"(?<![\d.])(?:\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}(?![\d@])")
DOMAIN = re.compile(r"\b(?:https?://)?(?:www\.)?((?:[a-z0-9-]+\.)+(?:com|in|co|net|org|io|app|xyz|info|live|online|site|top|club|vip|me|link|pro|biz|cc))\b(?:/[^\s)\]]*)?", re.I)
COMPANY = re.compile(r"\b([A-Z][A-Za-z0-9&.'-]*(?:\s+[A-Z][A-Za-z0-9&.'-]*){0,5}\s+(?:Private\s+Limited|Pvt\.?\s*Ltd\.?|Limited|Ltd\.?|LLP))")
IPO_NAME = re.compile(r"\b([A-Z][A-Za-z0-9&.]+(?:\s+[A-Z][A-Za-z0-9&.]+){0,4})\s+(?:pre[- ]?IPO|IPO|SME\s+IPO)\b")
PERSON = re.compile(r"\b(?:Mr|Mrs|Ms|Dr|CA|Shri|Smt|Sir)\.?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})")
SEBI_REG_CLAIM = re.compile(r"\bsebi[- ]?(?:registered|regd\.?|reg\.?)\b", re.I)
IPO_STOP = {"The", "This", "Our", "Your", "New", "Upcoming", "Latest", "Big", "Hot", "Next", "Any", "All", "Mainboard", "SME", "Get", "Apply", "Pre"}

STATUS = ("verified", "contradicted", "unknown")


# a full stop only ends a sentence before a space (so URLs stay whole); a line break ends one unless the next line
# carries on in lower case (a message wrapped mid-sentence)
_BOUNDARY = re.compile(r"[.!?](?=\s)|\n(?![ \t]*[a-z])")


def _sentence(text: str, start: int, end: int) -> str:
    a = max([m.end() for m in _BOUNDARY.finditer(text, 0, start)], default=0)
    m = _BOUNDARY.search(text, end)
    b = m.end() if m else len(text)
    return " ".join(text[a:b].split())[:300]


def _registered_domain(host: str) -> str:
    parts = host.lower().strip(".").split(".")
    two_level = len(parts) >= 3 and ".".join(parts[-2:]) in {"co.in", "org.in", "gov.in", "net.in", "ac.in", "firm.in"}
    return ".".join(parts[-3:] if two_level else parts[-2:])


def domain_check(host: str) -> dict | None:
    """Official domain of a brand, a look-alike of one, or neither (None)."""
    host = host.lower()
    for brand, doms in OFFICIAL.items():
        for d in doms:
            if host == d or host.endswith("." + d):
                return {"brand": brand, "official": True, "official_domain": d}
    reg = _registered_domain(host)
    label = reg.split(".")[0]
    for brand, doms in OFFICIAL.items():
        for d in doms:
            o_label = d.split(".")[0]
            similar = difflib.SequenceMatcher(None, label, o_label).ratio() >= 0.8
            contains = len(o_label) >= 4 and o_label in host.replace("-", "").replace(".", "")
            if similar or contains:
                return {"brand": brand, "official": False, "official_domain": d}
    return None


def analyze(text: str, extra_entities: list[dict] | None = None) -> dict:
    """Pure function: text -> claims, entities and pattern flags. `extra_entities` = people/companies an LLM found."""
    text = (text or "")[:MAX_TEXT]
    low = text.lower()
    claims, seen = [], set()

    def claim(kind, title, why, weight, s, e):
        quote = _sentence(text, s, e)
        key = (title, quote)
        if key in seen:
            return
        seen.add(key)
        claims.append({"id": f"k{len(claims) + 1}", "kind": kind, "title": title, "why": why, "weight": weight,
                       "quote": quote, "status": "contradicted" if weight >= 3 else "unknown", "checks": []})

    for kind, title, why, weight, pat in RULES:
        for m in re.finditer(pat, text, re.I):
            claim(kind, title, why, weight, m.start(), m.end())

    for m in RETURN.finditer(text):
        pct, per = float(m.group(1)), m.group(2).lower().replace(".", "")
        n = PERIODS.get(per, 1)
        annual = ((1 + pct / 100) ** n - 1) * 100 if n > 1 else pct
        if annual > 30:
            yearly = "more than 10,000%" if annual > 10000 else f"about {annual:,.0f}%"
            claim("promise", f"Promises {m.group(1)}% a {PERIOD_NOUN.get(per, per)}",
                  f"That compounds to {yearly} a year. Nifty 50 has averaged roughly 12-14% a year over long periods; "
                  f"anyone who could reliably earn this would not need your money.", 3 if annual > 100 else 2, m.start(), m.end())
    for m in MULTIPLY.finditer(text):
        n, unit = int(m.group(2)), m.group(3).lower()
        years = n / {"day": 250, "week": 52, "month": 12, "year": 1}[unit]
        if years <= 2:
            claim("promise", f"Promises to {m.group(1).lower()} your money in {n} {unit}s",
                  "A promise to multiply money in a short time is unrealistic and is not something a registered adviser may promise.",
                  3, m.start(), m.end())

    # ---- entities -------------------------------------------------------------------------------
    ents, ekeys = [], {}

    def ent(kind, name, **attrs):
        k = (kind, name.lower())
        if k in ekeys:
            return ekeys[k]
        e = {"id": f"e{len(ents) + 1}", "kind": kind, "name": name, **attrs}
        ents.append(e)
        ekeys[k] = e
        return e

    for m in REGNO.finditer(text):
        ent("registration", m.group(0), regno_type={"A": "Investment Adviser", "H": "Research Analyst", "Z": "Stock broker",
                                                    "P": "Portfolio Manager", "B": "Merchant banker"}.get(m.group(0)[2], "SEBI intermediary"))
    for m in UPI.finditer(text):
        ent("upi", m.group(0))
    for m in PHONE.finditer(text):
        ent("phone", re.sub(r"[\s-]", "", m.group(0)))
    for m in DOMAIN.finditer(text):
        host = m.group(1).lower()
        if text[max(0, m.start() - 1):m.start()] == "@":
            continue   # the domain part of an email address
        url = m.group(0) if m.group(0).startswith("http") else f"https://{m.group(0)}"
        chat = host in {"t.me", "telegram.me", "wa.me", "chat.whatsapp.com"}   # the channel, not the platform, is the identifier
        e = ent("website", re.sub(r"^https?://(www\.)?", "", url).rstrip("/") if chat else host, url=url)
        dc = domain_check(host)
        if dc:
            e["domain_check"] = dc
            if not dc["official"]:
                claim("impersonation", f"Look-alike of {dc['brand']}'s website", f"'{host}' resembles {dc['brand']}'s real domain "
                      f"{dc['official_domain']} but is not it. Fake broker and regulator sites are a common way to steal money and logins.",
                      3, m.start(), m.end())
    for m in COMPANY.finditer(text):
        ent("company", " ".join(m.group(1).split()))
    for m in IPO_NAME.finditer(text):
        name = " ".join(w for w in m.group(1).split() if w not in IPO_STOP)
        if len(name) >= 3 and name.upper() not in {"SEBI", "NSE", "BSE"}:
            ent("company", name, ipo=True)
    for m in PERSON.finditer(text):
        ent("person", m.group(1))
    for name in FAMOUS:
        if name.lower() in low:
            ent("person", name, famous=True)
    for x in extra_entities or []:
        if x.get("name") and x["name"].lower() in low and not any(x["name"].lower() == e["name"].lower() for e in ents):
            ent(x["kind"], x["name"], ai=True)
    brands = [b for b in OFFICIAL if re.search(r"\b" + re.escape(b.lower()) + r"\b", low)]
    for b in brands:
        ent("brand", b, official_domains=OFFICIAL[b])

    # impersonation: a trusted name used while asking you to act on an unofficial channel or pay a person
    unofficial = any(c["kind"] in {"payment", "channel"} for c in claims) or any(e["kind"] == "phone" for e in ents)
    trusted = [e for e in ents if e["kind"] == "brand" and e["name"] not in {"SEBI", "RBI", "NSE", "BSE", "NSDL", "CDSL"}] + \
              [e for e in ents if e.get("famous")]
    if unofficial:
        for e in trusted:
            i = low.find(e["name"].lower())
            claim("impersonation", f"Uses the name of {e['name']} on an unofficial channel",
                  f"The message invokes {e['name']} but asks you to pay or talk through a private number, group or UPI ID. "
                  f"Well-known firms and investors do not run tip groups or collect money this way; check only via "
                  f"{', '.join(e.get('official_domains') or ['their verified official accounts'])}.", 3, i, i + len(e["name"]))
    if SEBI_REG_CLAIM.search(text) and not any(e["kind"] == "registration" for e in ents):
        m = SEBI_REG_CLAIM.search(text)
        claim("credential", "Claims SEBI registration without a registration number",
              "Registered advisers (INA…) and research analysts (INH…) must show their SEBI registration number. "
              "Without one, the claim cannot be checked.", 2, m.start(), m.end())
    for e in ents:
        if e["kind"] == "registration":
            i = text.find(e["name"])
            claim("credential", f"Shows SEBI registration {e['name']}",
                  "A registration number can be copied from a real adviser. It only means something if SEBI's register lists it under "
                  "the same name that is contacting you.", 0, i, i + len(e["name"]))

    # link claims to the entities named in the sentence they quote
    for c in claims:
        q, digits = c["quote"].lower(), re.sub(r"\D", "", c["quote"])
        c["entities"] = [e["id"] for e in ents if e["name"].lower() in q
                         or e["kind"] == "phone" and e["name"].lstrip("+")[-10:] in digits]
    return {"text_chars": len(text), "claims": claims, "entities": ents}


# ---- reading the input -----------------------------------------------------------------------------

def _read_image_gemini(data: bytes, mime: str) -> str | None:
    key = os.getenv("GEMINI_API_KEY", "").strip()
    if not key:
        return None
    try:
        from google import genai
        from google.genai import types
        client = genai.Client(api_key=key)
        r = client.models.generate_content(model=os.getenv("GEMINI_MODEL", "gemini-3.8-flash"), contents=[
            types.Part.from_bytes(data=data, mime_type=mime),
            "Transcribe all text in this screenshot exactly as written, including names, numbers, links, UPI IDs and "
            "phone numbers. Output only the text."])
        return r.text
    except Exception as exc:
        print(f"Gemini image error: {exc}")
        return None


async def _read_image_claude(data: bytes, mime: str) -> str | None:
    key = os.getenv("ANTHROPIC_API_KEY", "").strip()
    if not key:
        return None
    import httpx
    try:
        async with httpx.AsyncClient(timeout=120) as c:
            r = await c.post("https://api.anthropic.com/v1/messages",
                             headers={"x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json"},
                             json={"model": os.getenv("ANTHROPIC_MODEL", "claude-sonnet-5-5"), "max_tokens": 3000, "messages": [{
                                 "role": "user", "content": [
                                     {"type": "image", "source": {"type": "base64", "media_type": mime, "data": base64.b64encode(data).decode()}},
                                     {"type": "text", "text": "Transcribe all text in this screenshot exactly as written, including names, "
                                                              "numbers, links, UPI IDs and phone numbers. Output only the text."}]}]})
            r.raise_for_status()
            return "".join(b.get("text", "") for b in r.json().get("content", []))
    except Exception as exc:
        print(f"Claude image error: {exc}")
        return None


async def read_file(data: bytes, filename: str, content_type: str) -> tuple[str | None, str | None]:
    """-> (text, error). PDFs and text are read locally; images need a vision model key."""
    name = (filename or "").lower()
    if data.startswith(b"%PDF"):
        pages = await asyncio.to_thread(pdf_pages, data)
        return "\n".join(pages)[:MAX_TEXT], None
    if (content_type or "").startswith("image/") or re.search(r"\.(png|jpe?g|webp|gif)$", name):
        mime = content_type if (content_type or "").startswith("image/") else "image/png"
        text = await asyncio.to_thread(_read_image_gemini, data, mime) or await _read_image_claude(data, mime)
        if not text:
            if os.getenv("GEMINI_API_KEY", "").strip() or os.getenv("ANTHROPIC_API_KEY", "").strip():
                return None, "The vision model could not read this image. Try a clearer screenshot, or paste the message text."
            return None, ("Reading a screenshot needs GEMINI_API_KEY or ANTHROPIC_API_KEY in backend/.env. "
                          "Meanwhile, paste the message text instead.")
        return text, None
    try:
        return data.decode("utf-8")[:MAX_TEXT], None
    except UnicodeDecodeError:
        return None, "Unsupported file. Upload a screenshot, a PDF or a text file, or paste the text."


async def ai_entities(text: str) -> list[dict]:
    """Optional: people and companies an LLM spots that the regexes miss. Empty without a key."""
    prompt = ("List every person and every company or brand named in this investment message, and every stock or IPO it "
              'promotes. Respond ONLY with JSON: {"people":[""],"companies":[""]}\n\n' + text[:8000])
    out = await _llm(prompt, 800)
    if not out:
        return []
    m = re.search(r"\{.*\}", out, re.S)
    try:
        data = json.loads(m.group(0)) if m else {}
    except ValueError:
        return []
    return [{"kind": "person", "name": str(p)[:80]} for p in data.get("people") or [] if p] + \
           [{"kind": "company", "name": str(c)[:80]} for c in data.get("companies") or [] if c]


# ---- agent goals -----------------------------------------------------------------------------------

def page_job(url: str) -> dict:
    goal = (f"Open {url} and read it as a member of the public would (do not log in). If it is a video, read the title, "
            f"channel name, upload date and description. Return the page title, who posted it, the post date, and the "
            f"text of the post or description (up to 4000 characters), keeping every number, name, link, phone number "
            f"and UPI ID exactly as written." + collect.RULES)
    return {"label": f"page:{url}", "goal": goal, "url": url, "expect": ["title", "author", "date", "text"],
            "schema": _top(title=_s(), author=_s(), date=_s(), text=_s())}


def regno_job(regno: str) -> dict:
    goal = (f"Check SEBI registration number {regno} on sebi.gov.in. Open SEBI's 'Recognised Intermediaries' "
            f"(Intermediaries/Market Infrastructure Institutions) lists, choose the category that matches the number "
            f"(INA = Investment Advisers, INH = Research Analysts, INZ = Stock brokers, INP = Portfolio Managers) and "
            f"search for it. Return found=true with the registered name, category, validity and address if it is "
            f"listed, found=false if you searched the right list and it is not there, or found=null if you could not "
            f"complete the search." + collect.RULES)
    return {"label": f"sebi_reg:{regno}", "goal": goal, "url": "https://www.sebi.gov.in/intermediaries.html",
            "expect": ["found", "registered_name"],
            "schema": _top(found=_B, registered_name=_s(), category=_s(), valid_till=_s(), address=_s(), source_url=_s())}


def offer_doc_job(company: str) -> dict:
    goal = (f'Has the Indian company "{company}" filed an IPO offer document (DRHP/RHP) with SEBI, NSE Emerge or BSE SME, '
            f"or is it already listed on NSE or BSE? Check sebi.gov.in filings and the exchange websites. Return "
            f"listed and offer_document_filed as true/false when you checked and null if you could not tell, plus the "
            f"exchange, symbol, document URL and IPO dates if any." + collect.RULES)
    return {"label": f"offer_doc:{company}", "goal": goal, "url": collect._search(f'"{company}" DRHP OR RHP OR IPO site:sebi.gov.in OR site:nseindia.com OR site:bseindia.com'),
            "expect": ["listed", "offer_document_filed"],
            "schema": _top(listed=_B, offer_document_filed=_B, exchange=_s(), symbol=_s(), document_url=_s(),
                           ipo_dates=_s(), source_url=_s())}


def regulator_job(name: str) -> dict:
    goal = (f'Search sebi.gov.in enforcement orders, SEBI press releases and investor caution notices for "{name}". '
            f"Return any order or caution that is clearly about this exact person or entity (title, date, URL). Return "
            f"empty lists if the search ran and found nothing about them." + collect.RULES)
    item = _obj(title=_s(), date=_s(), url=_s())
    return {"label": f"regulator:{name}", "goal": goal, "url": collect._search(f'"{name}" site:sebi.gov.in order OR caution'),
            "expect": ["orders", "cautions"], "schema": _top(orders=_arr(item, 8), cautions=_arr(item, 8))}


def plan_checks(analysis: dict, limit: int = 6) -> list[dict]:
    """Which official records to read for these entities, most decisive first."""
    ents = analysis["entities"]
    offers = any(c["kind"] == "offer" for c in analysis["claims"])
    jobs = []
    for e in ents:
        if e["kind"] == "registration":
            jobs.append((e["id"], regno_job(e["name"])))
    companies = [e for e in ents if e["kind"] == "company"]
    for e in companies[:2]:
        if offers or e.get("ipo"):
            jobs.append((e["id"], offer_doc_job(e["name"])))
        if re.search(r"(limited|ltd|llp)\.?$", e["name"], re.I):
            # same registry goal as the X-Ray company check, under its own label so it never enters the network store
            jobs.append((e["id"], {**collect.company_job(e["name"]), "label": f"registry:{e['name']}"}))
    people = [e for e in ents if e["kind"] == "person" and not e.get("famous")]
    for e in (people + companies)[:2]:
        jobs.append((e["id"], regulator_job(e["name"])))
    return [{**j, "entity_id": eid} for eid, j in jobs[:limit]]


# ---- turning agent answers into verified / contradicted / unknown -----------------------------------

def _names_match(a: str, b: str) -> bool:
    from store import norm_name
    x, y = norm_name(a), norm_name(b)
    return bool(x and y) and (x in y or y in x or difflib.SequenceMatcher(None, x, y).ratio() >= 0.8)


def judge(job: dict, rec: dict, analysis: dict) -> dict:
    kind, _, subject = job["label"].partition(":")
    res = rec.get("result") if isinstance(rec.get("result"), dict) else None
    # agents sometimes join several URLs into one string; keep the first real one
    src = next(iter(collect.extract_urls((res or {}).get("source_url"))), None) or (rec.get("sources") or [None])[0]
    base = {"entity_id": job["entity_id"], "check": kind, "subject": subject, "source_url": src,
            "fetched_at": rec.get("fetched_at"), "from_cache": rec.get("from_cache")}
    if res is None:
        return {**base, "status": "unknown", "title": "Not checked", "detail": rec.get("error") or "The agent did not return usable evidence."}

    if kind == "sebi_reg":
        if res.get("found") is True:
            named = [e["name"] for e in analysis["entities"] if e["kind"] in {"person", "company"}]
            reg = res.get("registered_name") or ""
            if named and reg and not any(_names_match(n, reg) for n in named):
                return {**base, "status": "contradicted", "title": f"{subject} belongs to someone else",
                        "detail": f"SEBI lists {subject} as {reg}, which is not a name used in this message. Someone may be borrowing a real registration."}
            return {**base, "status": "verified", "title": f"{subject} is on SEBI's register",
                    "detail": f"Registered to {reg or 'the name shown'}{', ' + res['category'] if res.get('category') else ''}"
                              f"{', valid till ' + res['valid_till'] if res.get('valid_till') else ''}. Make sure you are dealing with that exact entity."}
        if res.get("found") is False:
            return {**base, "status": "unknown", "title": f"{subject} not found on SEBI's register by the agent",
                    "detail": "The agent searched SEBI's list for that category and did not find this number. Check it yourself on "
                              "sebi.gov.in (Intermediaries) before trusting anyone who shows it: an unlisted number is a strong warning sign."}
        return {**base, "status": "unknown", "title": "SEBI search not completed", "detail": "The agent could not finish the search on sebi.gov.in."}

    if kind == "offer_doc":
        if res.get("listed") or res.get("offer_document_filed"):
            what = "is listed" + (f" on {res['exchange']}" if res.get("exchange") else "") if res.get("listed") else "has filed an offer document"
            return {**base, "status": "verified", "title": f"{subject} {what}",
                    "detail": "The company is real in exchange/SEBI records. That does not make a chat offer of its shares or allotment genuine.",
                    "source_url": res.get("document_url") or src}
        if res.get("listed") is False and res.get("offer_document_filed") is False:
            return {**base, "status": "unknown", "title": f"Agent found no IPO filing for {subject}",
                    "detail": "No DRHP/RHP or listing came up on SEBI or the exchanges. That is not proof none exists; look the company "
                              "up on the NSE/BSE public-issue pages before believing any 'IPO' or 'pre-IPO' offer for it."}
        return {**base, "status": "unknown", "title": "IPO filing not determined", "detail": "The agent could not tell whether an offer document exists."}

    if kind == "registry":
        c = res.get("company") or {}
        status = (c.get("status") or "").lower()
        if re.search(r"strike|struck|dissolv|liquidat|dormant|amalgamat", status):
            return {**base, "status": "contradicted", "title": f"{subject} is not an active company",
                    "detail": f"Registry status: {c.get('status')}."}
        if c.get("cin") or status:
            return {**base, "status": "verified", "title": f"{subject} exists in the company registry",
                    "detail": f"CIN {c.get('cin') or 'n/a'}, status {c.get('status') or 'n/a'}. Existing is not the same as being behind this offer."}
        return {**base, "status": "unknown", "title": "Registry record not found", "detail": "No registry page was read for this name."}

    if kind == "regulator":
        hits = (res.get("orders") or []) + (res.get("cautions") or [])
        if hits:
            return {**base, "status": "contradicted", "title": f"SEBI record mentions {subject}",
                    "detail": f"{len(hits)} SEBI order(s) or caution(s) found: " + "; ".join(h.get("title") or "untitled" for h in hits[:3]),
                    "evidence": [h.get("url") for h in hits if h.get("url")][:5]}
        return {**base, "status": "verified", "title": f"No SEBI order found for {subject}",
                "detail": "Nothing came up in SEBI orders or caution notices. Absence of an order is not proof that the offer is safe."}
    return {**base, "status": "unknown", "title": "Unrecognised check", "detail": ""}


def finalize(analysis: dict, checks: list[dict], meta: dict) -> dict:
    """Attach checks to entities/claims, compute the overall picture and the evidence graph."""
    by_ent = {}
    for c in checks:
        by_ent.setdefault(c["entity_id"], []).append(c)
    for e in analysis["entities"]:
        st = [c["status"] for c in by_ent.get(e["id"], [])]
        e["status"] = "contradicted" if "contradicted" in st else "verified" if st and all(s == "verified" for s in st) else "unknown"
        if e.get("domain_check"):
            e["status"] = "verified" if e["domain_check"]["official"] else "contradicted"
    ents = {e["id"]: e for e in analysis["entities"]}
    for c in analysis["claims"]:
        c["checks"] = [x for eid in c["entities"] for x in by_ent.get(eid, [])]
        statuses = [x["status"] for x in c["checks"]] + [ents[eid]["status"] for eid in c["entities"] if ents[eid].get("domain_check")]
        if c["kind"] == "credential" and c["weight"] == 0:   # "shows registration X": decided by the SEBI check alone
            c["status"] = "contradicted" if "contradicted" in statuses else "verified" if "verified" in statuses else "unknown"
        elif "contradicted" in statuses:
            c["status"] = "contradicted"

    contradicted = [c for c in checks if c["status"] == "contradicted"]
    weights = {}   # one pattern counts once, however many sentences repeat it
    for c in analysis["claims"]:
        weights[c["title"]] = max(weights.get(c["title"], 0), c["weight"])
    points = sum(weights.values()) + 3 * len(contradicted)
    level = "high" if points >= 6 else "caution" if points >= 3 else "low"
    verdict = {"high": "Matches known scam patterns", "caution": "Needs careful checking",
               "low": "No common scam pattern found"}[level]

    nodes = [{"id": "src", "kind": "source", "label": meta.get("title") or "The message", "status": "source"}]
    edges = []
    for c in analysis["claims"]:
        nodes.append({"id": c["id"], "kind": "claim", "label": c["title"], "status": c["status"], "detail": c["why"], "quote": c["quote"]})
        edges.append({"from": "src", "to": c["id"], "label": "claims"})
        for eid in c["entities"]:
            edges.append({"from": c["id"], "to": eid, "label": "names"})
    linked = {eid for c in analysis["claims"] for eid in c["entities"]}
    for e in analysis["entities"]:
        nodes.append({"id": e["id"], "kind": e["kind"], "label": e["name"], "status": e["status"]})
        if e["id"] not in linked:
            edges.append({"from": "src", "to": e["id"], "label": "mentions"})
    for i, c in enumerate(checks):
        cid = f"x{i + 1}"
        nodes.append({"id": cid, "kind": "check", "label": c["title"], "status": c["status"], "detail": c["detail"],
                      "source_url": c.get("source_url"), "fetched_at": c.get("fetched_at")})
        edges.append({"from": c["entity_id"], "to": cid, "label": "checked against"})

    counts = {s: sum(1 for c in analysis["claims"] if c["status"] == s) for s in STATUS}
    return {**meta, **analysis, "checks": checks, "level": level, "verdict": verdict, "points": points, "counts": counts,
            "graph": {"nodes": nodes, "edges": edges},
            "disclaimer": "Automated screening of the material you provided. A flag is a reason to stop and check, not proof of fraud. "
                          "Verify advisers at sebi.gov.in and report suspected fraud on 1930 / cybercrime.gov.in and SEBI SCORES."}


SAMPLE = """🔥🔥 PRE-IPO JACKPOT 🔥🔥
Dear investor, as a member of Zerodha VIP Research Group (SEBI registered) we are giving 50 members a confirmed allotment in the
upcoming Kalindi Smart Mobility IPO through our special HNI quota. Guaranteed listing gain of 80%, 100% safe.
Our analyst Mr. Rohit Malhotra has 95% accuracy. Earn 5% daily on our trading app — download the app: zerodha-vip.in/app.apk
Limited seats, offer ends today! To book, pay ₹25,000 to UPI kalindi.ipo@ybl and send screenshot on WhatsApp +91 98765 43210.
Join our group: https://t.me/zerodha_vip_calls"""
