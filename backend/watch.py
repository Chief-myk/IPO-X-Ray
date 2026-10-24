"""Feature 3: Live Watch. Re-run the checks for watched companies, save a dated snapshot, diff it against
the previous one and record only what changed.

  python watch.py run            # re-check every watched subject (live, or cache in DEMO_MODE=1)
  python watch.py add "Name"     # add to the watchlist
  python watch.py simulate "Name"  # demo only: appends a clearly labelled SIMULATED change
Cron example:  0 8 * * *  cd /path/to/ipo-xray/backend && python watch.py run

Changes tracked: website down/up, new regulator order, new news mention, new linked company/person/vendor,
address or status changed.
"""
import asyncio
import json
import sys

import collect
from collect import _arr, _obj, _s, _top
from store import db, find_entity, now, ingest

_B = {"type": "boolean", "nullable": True}
_MENTION = _obj(title=_s(), url=_s(), date=_s())


def news_job(name: str) -> dict:
    goal = (f'Check the latest public news and official pages about the Indian company "{name}". Report whether its '
            f"official website currently loads, any news mentions, and any SEBI, stock exchange, court or other "
            f"regulator orders naming the company or its promoters. Include source URLs and dates. If nothing is "
            f"found, return empty lists. Be quick: a few searches are enough.")
    schema = _top(website_up=_B, news_mentions=_arr(_MENTION, 8), regulator_orders=_arr(_MENTION, 8))
    return {"label": f"news:{name}", "goal": goal, "url": collect._search(f'"{name}" news SEBI order'),
            "expect": list(schema["properties"]), "schema": schema}


# ---- snapshots ---------------------------------------------------------------------------------

def payload_from_store(subject: str) -> dict:
    con = db()
    e = find_entity(con, subject)
    p = {"people": [], "vendors": [], "clients": [], "address": None, "status": None, "website": None,
         "website_up": None, "news": [], "regulator": []}
    if e:
        def names(q):
            return sorted(r[0] for r in con.execute(q, (e["id"],)))
        p["people"] = names("SELECT e.name FROM relation r JOIN entity e ON e.id=r.src_id WHERE r.dst_id=? AND r.rel='DIRECTS'")
        p["vendors"] = names("SELECT e.name FROM relation r JOIN entity e ON e.id=r.dst_id WHERE r.src_id=? AND r.rel='USES_VENDOR'")
        p["clients"] = names("SELECT e.name FROM relation r JOIN entity e ON e.id=r.dst_id WHERE r.src_id=? AND r.rel='CLAIMS_CLIENT'")
        a = con.execute("SELECT e.name FROM relation r JOIN entity e ON e.id=r.dst_id WHERE r.src_id=? AND r.rel='HAS_ADDRESS'", (e["id"],)).fetchone()
        p["address"] = a[0] if a else None
        attrs = json.loads(e["attrs"])
        p["status"], p["website"] = attrs.get("status"), attrs.get("website")
    con.close()
    return p


def _latest(con, subject, real_only=False):
    q = "SELECT * FROM snapshot WHERE subject=? " + ("AND simulated=0 " if real_only else "") + "ORDER BY id DESC LIMIT 1"
    r = con.execute(q, (subject,)).fetchone()
    return (r, json.loads(r["payload"])) if r else (None, None)


def diff(old: dict, new: dict) -> list[dict]:
    out = []
    for key, label in (("people", "person linked"), ("vendors", "vendor"), ("clients", "client")):
        a, b = set(old.get(key) or []), set(new.get(key) or [])
        for x in sorted(b - a):
            out.append({"kind": f"new_{key[:-1]}", "detail": f"New {label}: {x}", "source_url": None})
        for x in sorted(a - b):
            out.append({"kind": f"removed_{key[:-1]}", "detail": f"No longer listed, {label}: {x}", "source_url": None})
    for key in ("address", "status"):
        if old.get(key) and new.get(key) and old[key] != new[key]:
            out.append({"kind": f"{key}_changed", "detail": f"{key.title()} changed: '{old[key]}' to '{new[key]}'", "source_url": None})
    if old.get("website_up") is True and new.get("website_up") is False:
        out.append({"kind": "website_down", "detail": "Official website is not loading", "source_url": new.get("website")})
    if old.get("website_up") is False and new.get("website_up") is True:
        out.append({"kind": "website_up", "detail": "Official website is loading again", "source_url": new.get("website")})
    for key, kind, label in (("regulator", "new_regulator_order", "New regulator/court mention"),
                             ("news", "new_news", "New news mention")):
        seen = {m.get("url") or m.get("title") for m in old.get(key) or []}
        for m in new.get(key) or []:
            if (m.get("url") or m.get("title")) not in seen:
                out.append({"kind": kind, "detail": f"{label}: {m.get('title') or m.get('url')}", "source_url": m.get("url")})
    return out


def record(subject: str, payload: dict, simulated=False) -> list[dict]:
    """Save snapshot, diff against the previous one, store the changes. First snapshot is a baseline."""
    con = db()
    _, prev = _latest(con, subject)
    ts = now()
    con.execute("INSERT INTO snapshot(subject,taken_at,payload,simulated) VALUES(?,?,?,?)",
                (subject, ts, json.dumps(payload, ensure_ascii=False), int(simulated)))
    changes = diff(prev, payload) if prev is not None else []
    for c in changes:
        con.execute("INSERT INTO change(subject,detected_at,kind,detail,source_url,simulated) VALUES(?,?,?,?,?,?)",
                    (subject, ts, c["kind"], c["detail"], c["source_url"], int(simulated)))
    con.commit()
    con.close()
    return changes


# ---- run ---------------------------------------------------------------------------------------

def add(subject: str):
    con = db()
    con.execute("INSERT OR IGNORE INTO watchlist(subject,added_at) VALUES(?,?)", (subject, now()))
    con.commit()
    con.close()


def watched() -> list[str]:
    con = db()
    r = [x[0] for x in con.execute("SELECT subject FROM watchlist ORDER BY added_at")]
    con.close()
    return r


async def check(subject: str, on_event=None, refresh=True) -> list[dict]:
    """Re-run the agents for one subject, update the store, snapshot, diff."""
    con = db()
    if not _latest(con, subject)[0]:                   # make sure a baseline exists before the first diff
        record(subject, payload_from_store(subject))
    con.close()
    jobs = [collect.company_job(subject), collect.contact_job(subject), collect.relations_job(subject), news_job(subject)]
    recs = await collect.collect_many(jobs, refresh=refresh and not collect.demo_mode(), on_event=on_event)
    for r in recs:
        ingest(r)
    payload = payload_from_store(subject)
    news = recs[3].get("result") if isinstance(recs[3].get("result"), dict) else {}
    payload["website_up"] = news.get("website_up")
    payload["news"] = news.get("news_mentions") or []
    payload["regulator"] = news.get("regulator_orders") or []
    return record(subject, payload)


def simulate(subject: str) -> list[dict]:
    """Demo helper: take the latest snapshot and add a change, flagged SIMULATED everywhere it shows."""
    con = db()
    _, prev = _latest(con, subject)
    con.close()
    if prev is None:
        record(subject, payload_from_store(subject))
        prev = payload_from_store(subject)
    new = json.loads(json.dumps(prev))
    new["website_up"] = False
    new.setdefault("regulator", []).append({"title": "SIMULATED TEST: new regulator order (not a real finding)",
                                            "url": None, "date": now()[:10]})
    return record(subject, new, simulated=True)


def alerts(limit=100) -> list[dict]:
    con = db()
    r = [dict(x) for x in con.execute("SELECT * FROM change ORDER BY id DESC LIMIT ?", (limit,))]
    con.close()
    return r


async def run_all(refresh=True):
    for s in watched():
        print(f"checking {s} ...", flush=True)
        ch = await check(s, refresh=refresh)
        print(f"  {len(ch)} change(s)" + "".join(f"\n   - {c['detail']}" for c in ch))


if __name__ == "__main__":
    cmd, arg = (sys.argv[1:] + ["", ""])[:2]
    if cmd == "add" and arg:
        add(arg)
        print("added", arg)
    elif cmd == "run":
        asyncio.run(run_all())
    elif cmd == "simulate" and arg:
        print(simulate(arg))
    else:
        print(__doc__)
