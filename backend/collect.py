"""Collection layer: one goal in, structured JSON + source URLs out, every raw response cached.

  collect(goal, url)        -> one TinyFish agent run (or a cache hit)
  collect_many([...])       -> many runs in parallel (MAX_PARALLEL_AGENTS)

Cache: data/cache/<sha1(goal|url)>.json holds the full raw response (steps, live view URL, result,
fetch time). DEMO_MODE=1 never calls TinyFish, it only reads that cache, so the demo survives bad
Wi-Fi. A cache miss in demo mode is reported honestly as "not found", never invented.

CLI:  python collect.py company "Trafiksol ITS Technologies"
      python collect.py director "Some Name" [--refresh]
"""
import asyncio
import hashlib
import json
import os
import re
import sys
import time
import urllib.parse
from pathlib import Path
from types import SimpleNamespace

from dotenv import load_dotenv

load_dotenv()

import tinyfish

CACHE_DIR = Path(os.getenv("CACHE_DIR") or Path(__file__).resolve().parent.parent / "data" / "cache")


def demo_mode() -> bool:
    return os.getenv("DEMO_MODE", "0") == "1"


def _search(q: str) -> str:
    tpl = os.getenv("SEARCH_URL_TEMPLATE", "https://www.bing.com/search?q={q}")
    return tpl.replace("{q}", urllib.parse.quote_plus(q))


def _key(goal: str, url: str) -> str:
    return hashlib.sha1(f"{url}|{goal}".encode()).hexdigest()[:16]


def _cache_path(goal: str, url: str) -> Path:
    return CACHE_DIR / f"{_key(goal, url)}.json"


def extract_urls(obj) -> list[str]:
    """Every http(s) URL anywhere in a result, de-duplicated, in order."""
    found: list[str] = []

    def walk(v):
        if isinstance(v, str):
            for m in re.findall(r"https?://[^\s\"'<>)\]]+", v):
                if m not in found:
                    found.append(m.rstrip(".,;"))
        elif isinstance(v, dict):
            for x in v.values():
                walk(x)
        elif isinstance(v, list):
            for x in v:
                walk(x)

    walk(obj)
    return found


def _valid(result, expect) -> bool:
    return result is not None and (not expect or (isinstance(result, dict) and all(k in result for k in expect)))


async def collect(goal: str, url: str, *, label: str = "", on_event=None, refresh: bool = False,
                  expect: list[str] | None = None, schema: dict | None = None) -> dict:
    """Run one goal. `expect` = top-level keys the JSON must have; a wrong shape is retried once. Returns {label, goal, url, result, sources, steps, live_url, error, fetched_at, from_cache}."""
    path = _cache_path(goal, url)
    if not refresh and path.exists():
        rec = json.loads(path.read_text())
        rec["from_cache"] = True
        if on_event:
            await _emit(on_event, {"kind": "step", "text": "Loaded from cache", "url": None})
            if rec.get("result") is not None:
                await _emit(on_event, {"kind": "result", "data": rec["result"]})
        return rec

    rec = {"label": label, "goal": goal, "url": url, "result": None, "sources": [], "steps": [],
           "live_url": None, "error": None, "fetched_at": None, "from_cache": False}

    if demo_mode():
        rec["error"] = "Not found: demo mode only reads the cache and this goal was never cached."
        return rec
    if not tinyfish.is_live():
        rec["error"] = "TINYFISH_API_KEY is not set."
        return rec

    for attempt in (1, 2):
        run_goal = goal if attempt == 1 else (
            goal + " IMPORTANT: your previous answer did not match the required JSON shape. Do the research again "
                   "if needed, then answer with a single JSON object that has exactly the top-level keys: "
                   + ", ".join(expect or []) + ". Do not return raw search results.")
        rec["result"] = None
        async for ev in tinyfish.run_agent(SimpleNamespace(url=url, goal=run_goal, schema=schema)):
            if ev["kind"] == "step":
                rec["steps"].append({"text": ev["text"], "url": ev.get("url")})
            elif ev["kind"] == "live":
                rec["live_url"] = ev["url"]
            elif ev["kind"] == "result":
                rec["result"] = ev["data"]
            elif ev["kind"] == "error":
                rec["error"] = ev["text"]
            if on_event:
                await _emit(on_event, ev)
        if _valid(rec["result"], expect):
            break
        if rec["result"] is not None:
            rec["error"] = "Agent returned JSON in an unexpected shape."
            if attempt == 1 and on_event:
                await _emit(on_event, {"kind": "step", "text": "Answer had the wrong shape, retrying once", "url": None})
        else:
            break   # hard failure (timeout/network): do not burn a second run

    rec["fetched_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    rec["sources"] = extract_urls(rec["result"])
    if not _valid(rec["result"], expect):
        rec["rejected"] = rec["result"]      # kept in memory only (not cached) so shape problems can be debugged
        rec["result"] = None
    else:                                   # only cache valid results, so a retry can still fill a failure
        rec["error"] = None
        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(rec, ensure_ascii=False, indent=2))
    return rec


async def _emit(cb, ev):
    r = cb(ev)
    if asyncio.iscoroutine(r):
        await r


async def collect_many(jobs: list[dict], *, refresh: bool = False, on_event=None) -> list[dict]:
    """jobs: [{"goal","url","label"}]. Runs in parallel; on_event(label, event) gets live progress."""
    sem = asyncio.Semaphore(int(os.getenv("MAX_PARALLEL_AGENTS", "10")))

    async def one(job):
        async with sem:
            cb = (lambda ev, l=job.get("label", ""): on_event(l, ev)) if on_event else None
            return await collect(job["goal"], job["url"], label=job.get("label", ""), on_event=cb, refresh=refresh,
                                 expect=job.get("expect"), schema=job.get("schema"))

    return await asyncio.gather(*(one(j) for j in jobs))



def _s(nullable=True):
    return {"type": "string", "nullable": nullable}


def _obj(**props):
    return {"type": "object", "properties": props, "propertyOrdering": list(props)}


def _arr(item, n=15):
    return {"type": "array", "items": item, "maxItems": n}


def _top(**props):
    return {"type": "object", "properties": props, "propertyOrdering": list(props), "required": list(props)}


_COMPANY = _obj(name=_s(False), cin=_s(), status=_s(), role=_s(), address=_s(), phone=_s(), email=_s(),
                website=_s(), source_url=_s())
_PERSON = _obj(name=_s(False), din=_s(), role=_s(), source_url=_s())
_NAMED = _obj(name=_s(False), detail=_s(), website=_s(), source_url=_s())

# ---- goals (plain-English objectives; the agent decides where to go) ---------------------------

RULES = (" Use only public pages, do not log in, and do not guess: if something cannot be found, return null or an "
         "empty list for it. Include the page URL where you saw each fact. Be quick and stop as soon as you have the answer.")


def director_job(name: str, company: str = "") -> dict:
    ctx = f' (associated with "{company}")' if company else ""
    goal = (f'Find all companies where "{name}"{ctx} is or was a director, using MCA/registry aggregator pages, '
            f"company websites and news. For each company return its name, CIN, registered address, phone, email and "
            f"the source URL where you saw it, and the person's DIN if shown." + RULES +
            '{"person":{"name":"","din":null},"companies":[{"name":"","cin":null,"status":null,"role":null,'
            '"address":null,"phone":null,"email":null,"website":null,"source_url":""}]}')
    return {"label": f"director:{name}", "goal": goal, "url": _search(f'"{name}" director DIN companies'),
            "expect": ["person", "companies"],
            "schema": _top(person=_obj(name=_s(False), din=_s()), companies=_arr(_COMPANY))}


def company_job(name: str, doc_url: str | None = None) -> dict:
    """Registry page only: CIN, status, address, directors. One source keeps the run short."""
    goal = (f'Find the registry page for the Indian company "{name}" on ZaubaCorp (or Tofler if ZaubaCorp has none). '
            f"Open ONLY that one company page and read it. Do not visit any other site. Return its CIN, status, "
            f"registered address, email and its directors with DIN. Leave anything not on the page as null, and put "
            f"that page's URL in every source_url." + RULES + "")
    if doc_url:
        goal = (f'Open this public document about the SME IPO of "{name}": {doc_url} . Use ONLY this document. Return '
                f"the company's registered address and the directors/promoters it names, with DIN and role if given, and "
                f"this URL as source_url. Leave anything not in it as null." + RULES)
    return {"label": f"company:{name}", "goal": goal, "url": doc_url or _search(f'"{name}" zaubacorp CIN directors'),
            "expect": ["company", "people"],
            "schema": _top(company=_COMPANY, people=_arr(_PERSON))}


def contact_job(name: str) -> dict:
    """Official website contact page only: address, phone, email, website."""
    goal = (f'Open the official website of the Indian company "{name}" (not a directory) and its Contact Us page. '
            f"Return the registered or corporate office address, phone, email and the website URL exactly as printed "
            f"there. Visit at most 3 pages of that site and nothing else. Return an empty people list. Put the "
            f"contact page URL in source_url." + RULES + "")
    return {"label": f"company:{name}", "goal": goal, "url": _search(f'"{name}" official website contact us'),
            "expect": ["company", "people"],
            "schema": _top(company=_COMPANY, people=_arr(_PERSON))}


def relations_job(name: str, doc_url: str | None = None) -> dict:
    """Vendors and clients, read from the offer document's own sections."""
    goal = (f'Open the DRHP or RHP PDF of the SME IPO "{name}" (for example from the company website, BSE/NSE or '
            f"SEBI). Use ONLY that document. Read only the sections on suppliers/vendors and on customers/clients. "
            f"Return up to 8 named vendors/suppliers and up to 8 named clients with any detail given (share of "
            f"purchases or revenue) and the PDF URL as source_url. If the document names none, return empty lists." + RULES + "")
    if doc_url:
        goal = (f'Open this public document about the SME IPO of "{name}": {doc_url} . Use ONLY this document. List up to '
                f"8 companies or entities it names as vendors, suppliers, service providers or payees of the company, and "
                f"up to 8 named as customers or clients, with any detail given and this URL as source_url. If it names "
                f"none, return empty lists." + RULES)
    return {"label": f"relations:{name}", "goal": goal, "url": doc_url or _search(f'"{name}" RHP DRHP pdf'),
            "expect": ["vendors", "clients"],
            "schema": _top(vendors=_arr(_NAMED, 8), clients=_arr(_NAMED, 8))}


def _main(argv):
    refresh = "--refresh" in argv
    args = [a for a in argv if not a.startswith("--")]
    if len(args) < 2 or args[0] not in {"company", "director"}:
        print(__doc__)
        return
    who = " ".join(args[1:])
    jobs = [company_job(who), contact_job(who), relations_job(who)] if args[0] == "company" else [director_job(who)]

    def show(label, ev):
        if ev["kind"] in {"step", "live", "error"}:
            print(f"  [{label}] [{ev['kind']}] {ev.get('text') or ev.get('url')}", flush=True)

    for rec in asyncio.run(collect_many(jobs, refresh=refresh, on_event=show)):
        print(json.dumps({k: rec[k] for k in ("label", "result", "rejected", "sources", "fetched_at", "from_cache", "error") if k in rec},
                         ensure_ascii=False, indent=2))


if __name__ == "__main__":
    _main(sys.argv[1:])
