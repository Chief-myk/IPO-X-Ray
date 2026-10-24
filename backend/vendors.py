"""Feature 2: Vendor Reality Engine. Does this named vendor look like a real operating business?

A TinyFish agent is given the goal (not a script) and a typed schema. We turn its answer into a 0-100
presence score with a visible breakdown. A check the agent could not settle is shown as "unverified"
and earns no points, so missing evidence never looks like a pass. Low score = "needs review", not a verdict.
"""
import json
import urllib.parse

import collect
from collect import _arr, _obj, _s, _top
from store import db, now, upsert_entity

CHECKS = [  # key, label, max points
    ("website", "Official website exists", 25),
    ("domain_age", "Domain older than 1 year", 15),
    ("listing", "Business listing at the stated address", 20),
    ("employees", "Visible employees (LinkedIn / job portals)", 20),
    ("news", "Independent news or directory mentions", 10),
    ("clean_record", "No court or regulator mentions found", 10),
]

_B = {"type": "boolean", "nullable": True}
_N = {"type": "number", "nullable": True}
_MENTION = _obj(title=_s(), url=_s(), date=_s())


def vendor_job(vendor: str, company: str = "", website: str | None = None) -> dict:
    ctx = f' (named as a vendor by "{company}")' if company else ""
    goal = (f'Is "{vendor}"{ctx} a real operating business? Visit at most 5 pages in total, in this order, and then '
            f"stop. (1) Search for it. (2) Open its company-registry page (ZaubaCorp, Tofler or filesure) for this exact "
            f"company and read the incorporation date and status. (3) If it has an official website, open it and read "
            f"the address and any WHOIS/domain date shown. (4) Note any independent news, court or regulator mention "
            f"you happened to see. Do NOT return search results: answer only in the requested JSON, and use null for "
            f"anything you did not see. Include source URLs.")
    start = f"https://{website}" if website and "//" not in website else (website or collect._search(f'"{vendor}" company registry India'))
    schema = _top(
        website_exists=_B, website_url=_s(), domain_created=_s(), domain_age_days=_N,
        incorporation_date=_s(), company_age_days=_N, registry_status=_s(), listing_found=_B,
        listing_address=_s(), employees_estimate=_N, news_mentions=_arr(_MENTION, 5),
        court_or_regulator=_arr(_MENTION, 5), sources=_arr({"type": "string"}, 10))
    return {"label": f"vendor:{vendor}", "goal": goal, "url": start, "expect": list(schema["properties"]),
            "schema": schema}


def score(res: dict) -> dict:
    """Pure function: agent result -> {score, checks:[{key,label,max,points,status,detail}]}."""
    def check(key, label, mx, status, detail):
        return {"key": key, "label": label, "max": mx, "status": status, "detail": detail,
                "points": mx if status == "pass" else 0}

    out = []
    w = res.get("website_exists")
    out.append(check("website", CHECKS[0][1], 25, "unverified" if w is None else "pass" if w else "fail",
                     res.get("website_url") or "No official website found" if w is False else res.get("website_url") or "Not determined"))
    age = res.get("domain_age_days")
    src_txt = f"domain registered {res.get('domain_created') or 'unknown'}"
    if age is None:                                  # fall back to the registry incorporation date
        age, src_txt = res.get("company_age_days"), f"incorporated {res.get('incorporation_date') or 'unknown'}"
    out.append(check("domain_age", "Company or domain older than 1 year", 15,
                     "unverified" if age is None else "pass" if age >= 365 else "fail",
                     f"{int(age)} days old ({src_txt})" if age is not None else "Not determined"))
    lf = res.get("listing_found")
    out.append(check("listing", CHECKS[2][1], 20, "unverified" if lf is None else "pass" if lf else "fail",
                     res.get("listing_address") or ("No listing found at the address" if lf is False else "Not determined")))
    emp = res.get("employees_estimate")
    half = emp is not None and 2 <= emp < 10
    c = check("employees", CHECKS[3][1], 20, "unverified" if emp is None else "pass" if emp >= 10 else "fail",
              f"About {int(emp)} visible" if emp is not None else "Not determined")
    if half:
        c["points"] = 10
    out.append(c)
    news = res.get("news_mentions")
    out.append(check("news", CHECKS[4][1], 10, "unverified" if news is None else "pass" if news else "fail",
                     f"{len(news)} mention(s)" if news else "No independent mentions found"))
    cr = res.get("court_or_regulator")
    out.append(check("clean_record", CHECKS[5][1], 10, "unverified" if cr is None else "pass" if not cr else "fail",
                     f"{len(cr)} mention(s) need review" if cr else "None found"))
    total = sum(c["points"] for c in out)
    return {"score": total, "checks": out}


def save(rec: dict, vendor: str) -> dict | None:
    """Score a collect() record and store it. Returns the scorecard or None if the agent gave nothing."""
    res = rec.get("result")
    if not isinstance(res, dict):
        return None
    card = score(res)
    sources = list(dict.fromkeys((res.get("sources") or []) + collect.extract_urls(res)))
    con = db()
    vid = upsert_entity(con, "vendor", vendor, website=res.get("website_url"))
    con.execute("INSERT INTO vendor_score(vendor_id,run_at,score,checks,sources) VALUES(?,?,?,?,?)",
                (vid, rec.get("fetched_at") or now(), card["score"], json.dumps(card["checks"]), json.dumps(sources)))
    con.commit()
    con.close()
    return {**card, "sources": sources}


def rescore_from_cache() -> int:
    n = 0
    for f in sorted(collect.CACHE_DIR.glob("*.json")):
        try:
            rec = json.loads(f.read_text())
        except json.JSONDecodeError:
            continue
        label = rec.get("label", "")
        if label.startswith("vendor:") and save(rec, label.partition(":")[2]):
            n += 1
    return n


def scorecards() -> list[dict]:
    """Latest score per vendor, plus a flag when the vendor appears for more than one company."""
    con = db()
    rows = con.execute("""
        SELECT e.id, e.name, e.attrs, vs.score, vs.checks, vs.sources, vs.run_at
        FROM entity e LEFT JOIN vendor_score vs ON vs.id = (SELECT MAX(id) FROM vendor_score WHERE vendor_id=e.id)
        WHERE e.kind='vendor' ORDER BY (vs.score IS NULL), vs.score""").fetchall()
    out = []
    for r in rows:
        used_by = [x["name"] for x in con.execute(
            "SELECT c.name FROM relation rel JOIN entity c ON c.id=rel.src_id WHERE rel.dst_id=? AND rel.rel='USES_VENDOR'", (r["id"],))]
        src = [x["source_url"] for x in con.execute(
            "SELECT source_url FROM relation WHERE dst_id=? AND rel='USES_VENDOR' AND source_url IS NOT NULL", (r["id"],))]
        out.append({"id": r["id"], "name": r["name"], "used_by": used_by,
                    "multi_company_flag": len(used_by) > 1,
                    "score": r["score"], "checks": json.loads(r["checks"]) if r["checks"] else [],
                    "sources": list(dict.fromkeys((json.loads(r["sources"]) if r["sources"] else []) + src)),
                    "run_at": r["run_at"], "attrs": json.loads(r["attrs"])})
    con.close()
    return out
