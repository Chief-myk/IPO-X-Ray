import asyncio
import io
import json
import os
import re

import httpx
from pypdf import PdfReader

KEYWORDS = re.compile(r"(customer|client|supplier|vendor|director|DIN|registered office|revenue from operations|promoter)", re.I)


def pdf_pages(data: bytes) -> list[str]:
    reader = PdfReader(io.BytesIO(data))
    return [(p.extract_text() or "") for p in reader.pages]


def relevant_text(pages: list[str], limit=70000) -> str:
    chunks, total = [], 0
    for i, txt in enumerate(pages, 1):
        if KEYWORDS.search(txt):
            piece = f"\n[page {i}]\n{txt}"
            if total + len(piece) > limit:
                break
            chunks.append(piece)
            total += len(piece)
    return "".join(chunks)


def _gemini_generate(prompt: str) -> str | None:
    key = os.getenv("GEMINI_API_KEY", "").strip()
    if not key:
        return None
    try:
        from google import genai
        client = genai.Client(api_key=key)
        model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        response = client.models.generate_content(model=model, contents=prompt)
        return response.text
    except Exception as exc:
        print(f"Gemini API error: {exc}")
        return None


async def _llm(prompt: str, max_tokens=4000) -> str | None:
    # 1. Primary: Google Gemini
    if os.getenv("GEMINI_API_KEY", "").strip():
        out = await asyncio.to_thread(_gemini_generate, prompt)
        if out:
            return out

    # 2. Optional Fallback: Claude
    key = os.getenv("ANTHROPIC_API_KEY", "").strip()
    if key:
        try:
            async with httpx.AsyncClient(timeout=120) as c:
                r = await c.post("https://api.anthropic.com/v1/messages",
                                 headers={"x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json"},
                                 json={"model": os.getenv("ANTHROPIC_MODEL", "claude-sonnet-5-5"), "max_tokens": max_tokens,
                                       "messages": [{"role": "user", "content": prompt}]})
                r.raise_for_status()
                return "".join(b.get("text", "") for b in r.json().get("content", []))
        except Exception:
            pass
    return None


def _number_claims(company, raw):
    claims = [{"id": "c1", "type": "company", "name": company, "detail": "Issuer", "page": 1}]
    seen = {company.lower()}
    for c in raw:
        name = str(c.get("name", "")).strip()
        if not name or name.lower() in seen or c.get("type") not in {"vendor", "client", "director", "address", "financial", "company"}:
            continue
        if c["type"] == "company":
            continue
        seen.add(name.lower())
        claims.append({"id": f"c{len(claims) + 1}", "type": c["type"], "name": name[:120],
                       "detail": str(c.get("detail", ""))[:240], "page": c.get("page"),
                       "website": c.get("website") or None, "growth_multiple": c.get("growth_multiple")})
    return claims[:16]


async def extract_claims(company: str, pdf: bytes) -> list[dict]:
    pages = await asyncio.to_thread(pdf_pages, pdf)
    text = relevant_text(pages)
    prompt = (
        f"You are reading the offer document (DRHP) of the Indian SME IPO '{company}'. Extract every claim an "
        "investigator could check on the open web: key vendors/suppliers (with website if given), top customers/clients, "
        "directors and promoters (with role), registered office and plant addresses, and headline financials "
        "(include growth_multiple = latest revenue / previous year revenue when both appear). Use the [page N] markers. "
        'Respond ONLY with JSON: {"claims":[{"type":"vendor|client|director|address|financial","name":"","detail":"",'
        '"page":0,"website":"","growth_multiple":0}]}\n\n' + text)
    try:
        out = await _llm(prompt)
        if out:
            cleaned = re.sub(r"^```(?:json)?|```$", "", out.strip(), flags=re.M).strip()
            match = re.search(r"\{.*\}", cleaned, re.S)
            if match:
                data = json.loads(match.group(0))
                return _number_claims(company, data.get("claims", []))
    except Exception as exc:
        print(f"Extraction error: {exc}")
    return _number_claims(company, regex_claims(text))


def regex_claims(text: str) -> list[dict]:
    out = []
    for m in re.finditer(r"([A-Z][A-Za-z.\s]{3,60}?)\s*\(?\s*DIN[:\s]*\d{8}", text):
        out.append({"type": "director", "name": m.group(1).strip(" ,.("), "detail": "Director (from DIN listing)"})
    m = re.search(r"Registered Office[:\s]+(.{20,160}?)(?:Tel|Phone|Email|CIN|\n\n)", text, re.S | re.I)
    if m:
        out.append({"type": "address", "name": "Registered office", "detail": " ".join(m.group(1).split())})
    for m in re.finditer(r"([A-Z][A-Za-z&.\s]{3,60}(?:Private Limited|Pvt\.? Ltd\.?|Limited|LLP))", text):
        ctx = text[max(0, m.start() - 160): m.end() + 40].lower()
        typ = "vendor" if re.search(r"supplier|vendor|purchase", ctx) else "client" if re.search(r"customer|client", ctx) else None
        if typ:
            out.append({"type": typ, "name": " ".join(m.group(1).split()), "detail": f"Named near '{typ}' in the DRHP"})
    return out


async def summarise(report: dict) -> str | None:
    flags = [{k: f[k] for k in ("severity", "title", "detail", "target")} for f in report["flags"][:14]]
    prompt = (f"Write a 3-sentence plain-English summary for a retail investor of these automated red flags on the SME IPO "
              f"'{report['company']}' (risk score {report['score']}/100). Be factual, do not accuse anyone of fraud, "
              f"and say which flags matter most and what to check next.\n{json.dumps(flags)}")
    try:
        return (await _llm(prompt, 400) or "").strip() or None
    except Exception:
        return None
